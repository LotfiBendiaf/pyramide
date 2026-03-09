#!/usr/bin/env node
/**
 * Import listings from Google Sheets into MongoDB
 *
 * Column mapping (from the sheet):
 *   "Type de bien"    → propertyType  (F3 → Appartement+3ch, Villa → Villa …)
 *   "Nom"             → seller name   (stored on Client + owner field)
 *   "Téléphone"       → phone         → creates a SELLER Client record
 *   "Localisation"    → address       (location.address + auto-detect city)
 *   "Type de service" → status        (Vente → En Vente, Location → En Location)
 *   "Prix Demandé"    → price         (parses "1.87 Milliard" → number)
 *   "Superficie"      → features.area (m²)
 *   "Information"     → description
 *   "Source"          → ignored (stored in description if present)
 *   "Disponibilité"   → overrides status (Vendu / Loué / Retiré)
 *
 * Usage:
 *   node scripts/import-listings.mjs            ← dry run (safe preview, no DB writes)
 *   node scripts/import-listings.mjs --import   ← insert into DB
 */

import mongoose from 'mongoose';
import https from 'https';
import http from 'http';
import { readFileSync } from 'fs';

// ─── Config ───────────────────────────────────────────────────────────────────

const SHEET_ID  = '1OPfz-bV9GI8BU7u0jwMZ3ycRNH4y2vSiir11yDOhNhU';
const SHEET_GID = '0';
const AGENT_ID  = '69256e87a84b812ee80c50bc';

// Only import rows whose reference number falls within this range (inclusive).
const REF_RANGE = { min: 201, max: 418 };
const ROW_LIMIT = null;
const DRY_RUN        = !process.argv.includes('--import') && !process.argv.includes('--fix-validation');
const FIX_VALIDATION = process.argv.includes('--fix-validation');

// ─── Load .env.local ──────────────────────────────────────────────────────────

function loadEnv() {
  try {
    const content = readFileSync('.env.local', 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) process.env[key] = val;
    }
  } catch { /* MONGODB_URI must be in environment */ }
}

// ─── HTTP fetch with redirect following ───────────────────────────────────────

function fetchText(url, redirectCount = 0) {
  if (redirectCount > 5) throw new Error('Too many redirects');
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, (res) => {
      if ([301, 302, 307, 308].includes(res.statusCode)) {
        return resolve(fetchText(res.headers.location, redirectCount + 1));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode}`));
      }
      let data = '';
      res.setEncoding('utf-8');
      res.on('data', c => (data += c));
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// ─── CSV parser ───────────────────────────────────────────────────────────────

function parseCSVRow(line) {
  const fields = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { field += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      fields.push(field);
      field = '';
    } else {
      field += ch;
    }
  }
  fields.push(field);
  return fields.map(f => f.trim());
}

function parseCSV(text) {
  // Strip BOM if present
  const clean = text.replace(/^\uFEFF/, '');
  const lines = clean.split('\n').filter(l => l.trim());
  // Trim each header to remove invisible chars, extra spaces, and \r
  const headers = parseCSVRow(lines[0]).map(h => h.trim().replace(/\r/g, ''));
  const rows = lines.slice(1).map(line => {
    const vals = parseCSVRow(line);
    const obj = {};
    // Use column index as key for empty/duplicate headers to avoid overwriting
    headers.forEach((h, i) => {
      const key = h || `_col${i}`;
      obj[key] = (vals[i] ?? '').trim();
    });
    return obj;
  });
  return { headers, rows };
}

// ─── Known Algerian cities ────────────────────────────────────────────────────

const KNOWN_CITIES = [
  'Alger', 'Oran', 'Constantine', 'Annaba', 'Blida', 'Batna', 'Djelfa',
  'Sétif', 'Sidi Bel Abbès', 'Biskra', 'Tébessa', 'El-Oued', 'Skikda',
  'Tiaret', 'Tizi Ouzou', 'Béjaïa', 'Tlemcen', 'Mostaganem', 'Médéa',
  'Msila', 'Mascara', 'Ouargla', 'Béchar', 'Souk Ahras', 'Ain Témouchent',
];

/** Returns { city, address }. Stores the full value as address; detects city. */
function parseLocationField(localisation) {
  const val = (localisation || '').trim();
  if (!val) return { city: 'Oran', address: '' };

  // Exact match → it IS the city
  for (const city of KNOWN_CITIES) {
    if (val.toLowerCase() === city.toLowerCase()) {
      return { city, address: val };
    }
  }

  // Contains a city name → use that city, full string as address
  for (const city of KNOWN_CITIES) {
    if (val.toLowerCase().includes(city.toLowerCase())) {
      return { city, address: val };
    }
  }

  // No city detected → default to Oran, treat as district/address
  return { city: 'Oran', address: val };
}

// ─── Price parser ─────────────────────────────────────────────────────────────

function parsePrice(priceStr) {
  if (!priceStr) return undefined;
  const str = priceStr.toLowerCase().replace(/\s+/g, ' ').trim();
  const cleaned = str
    .replace(/équipé?/gi, '')
    .replace(/meublé?/gi, '')
    .replace(/\s*\/\s*mois/gi, '')
    .trim();

  const match = cleaned.match(/([0-9,.]+)\s*(milliard|million|millions|da)?/i);
  if (!match) return undefined;

  const num = parseFloat(match[1].replace(/,/g, '.'));
  const unit = (match[2] || '').toLowerCase();

  // Algerian real estate prices are quoted in centimes (100 centimes = 1 DA):
  //   1 milliard = 10^9 centimes = 10,000,000 DA
  //   1 million  = 10^6 centimes =     10,000 DA
  if (unit.startsWith('milliard')) return Math.round(num * 10_000_000);
  if (unit.startsWith('million'))  return Math.round(num * 10_000);
  return Math.round(num);
}

// ─── Property type parser ─────────────────────────────────────────────────────

function parsePropertyType(typeDeBien) {
  if (!typeDeBien) return { propertyType: 'Autre', bedrooms: 0 };

  const str = typeDeBien.trim().toLowerCase();

  const fMatch = str.match(/f(\d)/i);
  if (fMatch) return { propertyType: 'Appartement', bedrooms: parseInt(fMatch[1]) };

  if (str.includes('studio'))     return { propertyType: 'Studio',          bedrooms: 1 };
  if (str.includes('villa'))      return { propertyType: 'Villa',            bedrooms: 0 };
  if (str.includes('duplex'))     return { propertyType: 'Duplex',           bedrooms: 0 };
  if (str.includes('terrain'))    return { propertyType: 'Terrain',          bedrooms: 0 };
  if (str.includes('penthouse'))  return { propertyType: 'Penthouse',        bedrooms: 0 };
  if (str.includes('hangar'))     return { propertyType: 'Hangar',           bedrooms: 0 };
  if (str.includes('maison'))     return { propertyType: 'Maison',           bedrooms: 0 };
  if (str.match(/local|commerce|commercial/)) {
    return { propertyType: 'Local Commercial', bedrooms: 0 };
  }

  return { propertyType: 'Autre', bedrooms: 0 };
}

// ─── Status parser ────────────────────────────────────────────────────────────

function parseStatus(typeService, disponibilite) {
  const disp = (disponibilite || '').toLowerCase();
  if (disp.includes('vendu'))                            return 'Vendu';
  if (disp.includes('lou'))                              return 'Loué';
  if (disp.includes('retiré') || disp.includes('retire')) return 'Retiré';

  const ts = (typeService || '').toLowerCase();
  if (ts.includes('location'))                           return 'En Location';
  return 'En Vente';
}

// ─── Information field parser ─────────────────────────────────────────────────
//
// Extracts all structured data from the free-text "Information" column.
// Examples of real values:
//   "Pas de place parking 4 éme étage"
//   "4 éme étage, ascenseur, chauffage central"
//   "9ème étage, 3 appartement par palier, double ascenseur"
//   "F4, 120m², 3ème étage avec ascenseur, balcon, parking sous-sol"

function parseInformation(info) {
  if (!info) return {};

  const result = {};

  // ── Floor (étage) ──────────────────────────────────────────────────────────
  const etageMatch = info.match(/(\d+)\s*[eèéème]+\s*[eé]tage/i)
    || info.match(/[eé]tage\s*[:\-]?\s*(\d+)/i);
  if (etageMatch) result.etage = parseInt(etageMatch[1]);

  // ── Elevator ───────────────────────────────────────────────────────────────
  const noElevator = /pas\s+d[e']?\s*asc|sans\s+asc/i.test(info);
  if (!noElevator && /asc[e]n[s]?eur|ascenceur|assenceur|elevator/i.test(info)) {
    result.elevator = true;
  }

  // ── Parking ────────────────────────────────────────────────────────────────
  // "Pas de place parking" → no parking
  const noParking = /pas\s+de\s+(place\s+)?parking|sans\s+parking/i.test(info);
  if (!noParking && /parking|garage|box\s|sous[\s-]sol/i.test(info)) {
    result.parking = true;
  }

  // ── Balcony / Terrace ──────────────────────────────────────────────────────
  if (/balcon|terrasse/i.test(info)) result.balcony = true;

  // ── Garden ────────────────────────────────────────────────────────────────
  if (/jardin/i.test(info)) result.garden = true;

  // ── Pool ──────────────────────────────────────────────────────────────────
  if (/piscine/i.test(info)) result.pool = true;

  // ── Furnished ─────────────────────────────────────────────────────────────
  if (/meublé|meuble|équipé|equipe|furnished/i.test(info)) result.furnished = true;

  // ── Bedrooms (fallback — used only if Type de bien gave 0) ────────────────
  // "3 chambres", "4 pièces", "F4", "3ch"
  const chMatch = info.match(/(\d+)\s*(chambre[s]?|ch\b|pièce[s]?)/i)
    || info.match(/\bF(\d)\b/i);
  if (chMatch) result.bedrooms = parseInt(chMatch[1]);

  // ── Bathrooms ─────────────────────────────────────────────────────────────
  const sdbMatch = info.match(/(\d+)\s*(salle[s]?\s*de\s*bain|sdb|douche[s]?|wc|toilette[s]?)/i);
  if (sdbMatch) result.bathrooms = parseInt(sdbMatch[1]);

  // ── Facade ────────────────────────────────────────────────────────────────
  const facadeMatch = info.match(/facade[:\s]+(\d+)/i)
    || info.match(/(\d+)\s*m\s+de\s+facade/i);
  if (facadeMatch) result.facade = parseInt(facadeMatch[1]);

  return result;
}

// ─── Reference code detector ─────────────────────────────────────────────────
//
// The sheet has an (often unlabeled) first column with old reference codes
// like V0000001, V0000201, L0000042 …
// We scan all column values of the row to find it rather than relying on a
// specific header name.

const REF_PATTERN = /^[VLvl]\d{4,}$/;

/** Converts V0000201 → V-0000201. Returns null for placeholder values like "V0000". */
function normalizeRefCode(raw) {
  const v = raw.trim().toUpperCase();

  // "V0000" with no meaningful digits after it is a placeholder — skip
  if (/^[VL]-?0+$/i.test(v)) return null;

  // Already has dash (e.g. V-0000201) — return as-is
  if (v[1] === '-') return v;
  // Insert dash after first letter: V0000201 → V-0000201
  return `${v[0]}-${v.slice(1)}`;
}

// Column names that are known to hold the reference code (case-insensitive)
const REF_COLUMN_NAMES = new Set(['ref', 'réf', 'référence', 'reference', 'n°']);

function findReferenceCode(row) {
  // 1. Look for a column whose header matches a known ref column name
  for (const [key, val] of Object.entries(row)) {
    const k = key.trim().replace(/\r/g, '').toLowerCase();
    if (!k) continue; // skip empty-header columns
    if (REF_COLUMN_NAMES.has(k)) {
      const v = (val || '').trim();
      // Ref column found but empty → skip this row entirely
      if (!v) return null;
      return normalizeRefCode(v);
    }
  }

  // 2. Fallback: scan all values for the old-style pattern
  for (const val of Object.values(row)) {
    const v = (val || '').trim();
    if (REF_PATTERN.test(v)) return normalizeRefCode(v);
  }
  return null;
}

// ─── Name splitter ────────────────────────────────────────────────────────────

function parseName(nom) {
  if (!nom) return { firstName: undefined, lastName: undefined };
  const parts = nom.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: undefined };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

// ─── Row → { listing, client } ───────────────────────────────────────────────

function mapRow(row) {
  const typeDeBien  = (row['Type de bien']    || '').trim();
  const nom         = (row['Nom']             || '').trim();
  const telephone   = (row['Téléphone']       || '').trim();
  const localisation = (row['Localisation']   || '').trim();
  const typeService  = (row['Type de service']|| '').trim();
  const prixStr      = (row['Prix Demandé']   || '').trim();
  const superficie   = (row['Superficie']     || '').trim();
  const information  = (row['Information']    || '').trim();
  const disponibilite = (row['Disponibilité'] || '').trim();

  const { propertyType, bedrooms: typebedrooms } = parsePropertyType(typeDeBien);
  const { city, address }                        = parseLocationField(localisation);
  const status                                   = parseStatus(typeService, disponibilite);
  const price                                    = parsePrice(prixStr);
  const area                                     = parseFloat(superficie) || 0;
  const info                                     = parseInformation(information);

  // Bedrooms: prefer Type de bien, fall back to what's found in Information
  const bedrooms = typebedrooms || info.bedrooms || 0;

  const description = information || `${propertyType} à ${address || city}`;

  // Skip rows that have no reference code — only validated listings are imported
  const referenceCode = findReferenceCode(row);
  if (!referenceCode) return null;

  // Apply numeric range filter
  if (REF_RANGE) {
    const numPart = parseInt(referenceCode.replace(/^[VL]-?/i, ''), 10);
    if (numPart < REF_RANGE.min || numPart > REF_RANGE.max) return null;
  }

  const { firstName, lastName } = parseName(nom);
  const isValidated = true;
  const now           = new Date();

  const listing = {
    description,
    status,
    propertyType,
    location: {
      city,
      address: address || undefined,
    },
    features: {
      bedrooms,
      bathrooms:  info.bathrooms  || 0,
      area,
      ...(info.etage     !== undefined && { etage:     info.etage }),
      ...(info.facade    !== undefined && { facade:    info.facade }),
      ...(info.elevator                && { elevator:  true }),
      ...(info.parking                 && { parking:   true }),
      ...(info.furnished               && { furnished: true }),
      ...(info.balcony                 && { balcony:   true }),
      ...(info.garden                  && { garden:    true }),
      ...(info.pool                    && { pool:      true }),
    },
    ...(price !== undefined  && { price }),
    ...(prixStr              && { priceLabel: prixStr }),
    ...(nom                  && { owner: nom }),
    ...(referenceCode        && { referenceCode }),
    agent:       new mongoose.Types.ObjectId(AGENT_ID),
    images:      [],
    isPublished: false,
    isValidated,
    ...(isValidated && {
      validatedAt: now,
      validatedBy: new mongoose.Types.ObjectId(AGENT_ID),
    }),
    views:       0,
    likes:       0,
    isFeatured:  false,
    isPremium:   false,
  };

  // Client is only created when a phone number is present
  const client = telephone
    ? {
        type:                'SELLER',
        phone:               telephone,
        ...(firstName && { firstName }),
        ...(lastName  && { lastName }),
        city,
        qualificationStatus: 'NEW',
        createdBy:           new mongoose.Types.ObjectId(AGENT_ID),
        assignedAgent:       new mongoose.Types.ObjectId(AGENT_ID),
        archived:            false,
      }
    : null;

  return { listing, client };
}

// ─── Mongoose schemas ─────────────────────────────────────────────────────────

const listingSchema = new mongoose.Schema(
  {
    referenceCode: String,
    description:   { type: String, required: true },
    status: {
      type: String,
      enum: ['En Vente', 'En Location', 'Vendu', 'Loué', 'Retiré'],
      required: true,
    },
    propertyType: {
      type: String,
      enum: [
        'Appartement', 'Maison', 'Villa', 'Studio', 'Terrain',
        'Commercial', 'Duplex', 'Hangar', 'Penthouse', 'Local Commercial', 'Autre',
      ],
      required: true,
    },
    location: {
      city:     { type: String, required: true },
      district: String,
      address:  String,
    },
    features: {
      bedrooms:  { type: Number, default: 0 },
      bathrooms: { type: Number, default: 0 },
      area:      { type: Number, required: true },
      etage:     Number,
      furnished: Boolean,
      parking:   Boolean,
      balcony:   Boolean,
      garden:    Boolean,
      pool:      Boolean,
      elevator:  Boolean,
    },
    price:        Number,
    priceLabel:   String,
    offeredPrice: Number,
    images:       [{ url: String, isPublic: Boolean }],
    coverImage:   String,
    owner:        String,
    agent:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    sellerClient: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
    isPublished:  { type: Boolean, default: false },
    publishedAt:  Date,
    isValidated:  { type: Boolean, default: false },
    validatedAt:  Date,
    validatedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    views:        { type: Number, default: 0 },
    likes:        { type: Number, default: 0 },
    isFeatured:   { type: Boolean, default: false },
    isPremium:    { type: Boolean, default: false },
  },
  { timestamps: true }
);

const clientSchema = new mongoose.Schema(
  {
    referenceCode:      { type: String, unique: true },
    type:               { type: String, enum: ['BUYER', 'SELLER', 'RENTER', 'INVESTOR'], required: true },
    firstName:          String,
    lastName:           String,
    phone:              { type: String, required: true },
    city:               String,
    qualificationStatus:{ type: String, enum: ['NEW', 'QUALIFIED', 'NOT_RELEVANT', 'ARCHIVED'], default: 'NEW' },
    createdBy:          { type: mongoose.Schema.Types.ObjectId, required: true },
    assignedAgent:      mongoose.Schema.Types.ObjectId,
    archived:           { type: Boolean, default: false },
  },
  { timestamps: true }
);

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  loadEnv();

  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error('\n❌ MONGODB_URI is not set. Make sure .env.local exists in the project root.\n');
    process.exit(1);
  }

  // ── Fix-validation mode ──────────────────────────────────────────────────────
  // Patches already-imported listings that have an old-style referenceCode
  // (V0000001 …) but are still marked isValidated: false.
  if (FIX_VALIDATION) {
    console.log('\n🔌 Connecting to MongoDB…');
    await mongoose.connect(MONGODB_URI, { dbName: 'Pyramide-Immobilier' });
    console.log('✅ Connected\n');

    const Listing = mongoose.models.Listing || mongoose.model('Listing', listingSchema);

    // Case 1: referenceCode is already stored — just flip the flag
    const withCode = await Listing.updateMany(
      { referenceCode: { $regex: /^[VL]\d{4,}$/i }, isValidated: false },
      {
        $set: {
          isValidated: true,
          validatedAt:  new Date(),
          validatedBy:  new mongoose.Types.ObjectId(AGENT_ID),
        },
      }
    );

    console.log(`✅ Updated (had referenceCode, was not validated): ${withCode.modifiedCount}`);

    // Case 2: no referenceCode stored at all — re-read sheet and match by description
    if (withCode.modifiedCount === 0) {
      console.log('\n⚠️  No listings with old-style referenceCode found.');
      console.log('   This means the import ran before reference detection was added.');
      console.log('   Re-fetching sheet to match and patch listings…\n');

      const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;
      const csvText = await fetchText(csvUrl);
      const { rows } = parseCSV(csvText);

      let patched = 0;
      let missed  = 0;

      for (const row of rows) {
        const refCode = findReferenceCode(row);
        if (!refCode) continue;

        const { propertyType } = parsePropertyType((row['Type de bien'] || '').trim());
        const information = (row['Information'] || '').trim();
        const telephone   = (row['Téléphone']   || '').trim();

        // Match by description text + propertyType (most reliable combo without a PK)
        const filter = {
          isValidated: false,
          propertyType,
          ...(information && { description: information }),
          ...(telephone   && { owner: { $regex: telephone } }),
        };

        const result = await Listing.findOneAndUpdate(
          filter,
          {
            $set: {
              referenceCode: refCode,
              isValidated:   true,
              validatedAt:   new Date(),
              validatedBy:   new mongoose.Types.ObjectId(AGENT_ID),
            },
          }
        );

        if (result) {
          console.log(`✅ Patched: ${refCode}  ${propertyType}`);
          patched++;
        } else {
          console.log(`⚠️  No match for: ${refCode}  ${propertyType}`);
          missed++;
        }
      }

      console.log(`\n── Result ───────────────────────────────────────────────`);
      console.log(`  ✅ Patched : ${patched}`);
      console.log(`  ⚠️  Missed  : ${missed}  (already validated or no matching listing found)`);
    }

    await mongoose.disconnect();
    console.log('\nDone.\n');
    return;
  }

  // 1. Fetch CSV
  console.log('\n📋 Fetching Google Sheet…');
  const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${SHEET_GID}`;
  const csvText = await fetchText(csvUrl);

  const { headers, rows } = parseCSV(csvText);

  console.log(`✅ ${rows.length} rows fetched`);
  console.log(`\n── Detected columns ────────────────────────────────────────`);
  headers.forEach((h, i) => {
    const charCodes = [...h].map(c => c.charCodeAt(0)).join(',');
    console.log(`   [${i}] "${h}"  (chars: ${charCodes})`);
  });
  // Find first 10 rows where _col0 (the ref column) is non-empty
  console.log('\n── First 10 rows with non-empty _col0 ─────────────────────');
  let found = 0;
  for (let i = 0; i < rows.length && found < 10; i++) {
    const firstVal = (rows[i]['_col0'] || '').trim();
    if (firstVal) {
      const charCodes = [...firstVal].map(c => c.charCodeAt(0)).join(',');
      console.log(`  Row ${i + 1}: _col0="${firstVal}"  chars:[${charCodes}]`);
      found++;
    }
  }
  if (found === 0) console.log('  (no rows with non-empty _col0 found)');
  console.log();

  // 2. Map rows
  const mapped   = [];
  const mapErrors = [];

  const rowsToProcess = ROW_LIMIT ? rows.slice(0, ROW_LIMIT) : rows;
  let skippedNoRef = 0;
  for (let i = 0; i < rowsToProcess.length; i++) {
    try {
      const result = mapRow(rowsToProcess[i]);
      if (result === null) { skippedNoRef++; continue; }
      mapped.push(result);
    } catch (err) {
      mapErrors.push({ rowNum: i + 2, error: err.message });
    }
  }

  if (mapErrors.length) {
    console.warn(`⚠️  ${mapErrors.length} rows could not be mapped:`);
    mapErrors.forEach(e => console.warn(`   Row ${e.rowNum}: ${e.error}`));
    console.log();
  }

  // 3. Preview
  console.log('── Preview (first 5 listings) ──────────────────────────────');
  mapped.slice(0, 5).forEach(({ listing, client }, i) => {
    console.log(`\n[${i + 1}]`);
    const f = listing.features;
    const validated = listing.isValidated ? `✅ validated  ref=${listing.referenceCode}` : '⏳ not validated';
    console.log(`   ${validated}`);
    console.log(`   type    : ${listing.propertyType}  bedrooms=${f.bedrooms}  bathrooms=${f.bathrooms}  area=${f.area}m²`);
    console.log(`   status  : ${listing.status}`);
    console.log(`   city    : ${listing.location.city}  address="${listing.location.address || '—'}"`);
    console.log(`   price   : ${listing.price ? listing.price.toLocaleString('fr-DZ') + ' DA' : '—'}`);
    const flags = ['etage','facade','elevator','parking','furnished','balcony','garden','pool'].filter(k => f[k]);
    if (flags.length) console.log(`   extras  : ${flags.map(k => `${k}=${f[k]}`).join('  ')}`);
    console.log(`   desc    : ${listing.description.slice(0, 80)}`);
    if (client) {
      console.log(`   client  : [SELLER] ${client.firstName || ''} ${client.lastName || ''} — ${client.phone}`);
    } else {
      console.log(`   client  : (no phone — skipped)`);
    }
  });

  const withPhone = mapped.filter(m => m.client).length;
  console.log(`\n────────────────────────────────────────────────────────────`);
  console.log(`📦 Listings ready (with ref) : ${mapped.length}`);
  console.log(`⏭  Skipped (no ref code)     : ${skippedNoRef}`);
  console.log(`👤 Clients ready             : ${withPhone}  (rows with a phone number)`);

  if (DRY_RUN) {
    console.log(`\n⚡ DRY RUN — database was NOT modified.`);
    console.log(`   To actually insert, run:\n`);
    console.log(`   node scripts/import-listings.mjs --import\n`);
    return;
  }

  // 4. Connect
  console.log(`\n🔌 Connecting to MongoDB…`);
  await mongoose.connect(MONGODB_URI, { dbName: 'Pyramide-Immobilier' });
  console.log('✅ Connected\n');

  const Listing = mongoose.models.Listing || mongoose.model('Listing', listingSchema);
  const Client  = mongoose.models.Client  || mongoose.model('Client',  clientSchema);

  let listingsInserted = 0;
  let listingsFailed   = 0;
  let clientsInserted  = 0;
  let clientsSkipped   = 0;

  for (const { listing, client } of mapped) {
    try {
      // ── Create seller client (skip if phone already exists) ───────────────
      let sellerClientId = undefined;

      if (client) {
        const existingClient = await Client.findOne({ phone: client.phone });

        if (existingClient) {
          sellerClientId = existingClient._id;
          clientsSkipped++;
        } else {
          // Generate reference code: SELL-001, SELL-002, …
          const count = await Client.countDocuments({ type: 'SELLER' });
          const refCode = `SELL-${String(count + 1).padStart(3, '0')}`;

          const created = await Client.create({ ...client, referenceCode: refCode });
          sellerClientId = created._id;
          clientsInserted++;
          console.log(`👤 Client created: ${refCode}  ${client.phone}`);
        }
      }

      // ── Create listing ────────────────────────────────────────────────────
      const doc = { ...listing, sellerClient: sellerClientId };
      await Listing.create(doc);
      console.log(`✅ Listing: ${listing.propertyType} ${listing.features.bedrooms}ch — ${listing.location.city}`);
      listingsInserted++;
    } catch (err) {
      console.error(`❌ Failed: ${err.message}`);
      listingsFailed++;
    }
  }

  await mongoose.disconnect();

  console.log(`\n════════════════════════════════════════════════════════════`);
  console.log(`  ✅ Listings inserted : ${listingsInserted}`);
  console.log(`  ❌ Listings failed   : ${listingsFailed}`);
  console.log(`  👤 Clients created   : ${clientsInserted}`);
  console.log(`  ⏭  Clients skipped   : ${clientsSkipped}  (phone already exists)`);
  console.log(`════════════════════════════════════════════════════════════\n`);
}

main().catch(err => {
  console.error('\nFatal error:', err);
  process.exit(1);
});
