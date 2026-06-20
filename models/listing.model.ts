import { Schema, model, models } from "mongoose";

/* ---------------------------------
   TypeScript Interface
----------------------------------*/
export type ListingPipelineStatus =
  | "DRAFT"
  | "PENDING_VALIDATION"
  | "PHOTO_VISIT_PENDING"
  | "ACTIVE"
  | "UNDER_NEGOTIATION"
  | "CLOSING"
  | "SOLD"
  | "ARCHIVED";

export type SellerMotivation = "LOW" | "MEDIUM" | "HIGH";

export interface IListingDocument {
  publicId: string;
  url: string;
  secureUrl?: string;
  originalFilename?: string;
  format?: string;
  resourceType?: string;
  bytes?: number;
  uploadedBy?: Schema.Types.ObjectId;
  uploadedAt?: Date;
}

export interface IListing {
  referenceCode?: string; // V-0000001 (vente), L-0000001 (location) — assigned on validation
  title?: string;
  slug?: string;

  description: string;

  price?: number;
  priceLabel?: string; // ex: "80 000 DA / mois"
  offeredPrice?: number; // Final agreed price

  status: "En Vente" | "En Location" | "Vendu" | "Loué" | "Retiré";

  // Internal pipeline tracking (separate from public-facing status)
  pipelineStatus: ListingPipelineStatus;

  // Key availability for visit scheduling
  keyAvailable: boolean;

  // Temporary blocking during negotiation
  blockedUntil?: Date;
  blockedForClient?: Schema.Types.ObjectId;

  // Photo visit tracking (done by listing agent after validation)
  photoVisitScheduledAt?: Date;
  photoVisitCompletedAt?: Date;
  photoVisitNotes?: string;

  // Seller info from photo visit evaluation
  sellerMotivation?: SellerMotivation;
  listingAgentEvalPrice?: number;

  propertyType:
    | "Appartement"
    | "Maison"
    | "Villa"
    | "Studio"
    | "Terrain"
    | "Commercial"
    | "Duplex"
    | "Hangar"
    | "Penthouse"
    | "Local Commercial"
    | "Autre";
  propertyTypeCustom?: string;

  location: {
    city: string;
    district?: string;
    address?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };

  features: {
    bedrooms: number;
    bathrooms: number;
    area: number; // m²
    facade?: number;
    etage?: number;
    nombreEtages?: number;
    furnished?: boolean;
    parking?: boolean;
    balcony?: boolean;
    garden?: boolean;
    pool?: boolean;
    elevator?: boolean;
  };

  /** ✅ NEW — Internal Evaluation */
  evaluation?: {
    positives?: string[];
    negatives?: string[];
    idealBuyerType?: string;
    priceQualityOpinion?: string;
    finalScore?: number; // 0 → 10
    evaluatedBy?: Schema.Types.ObjectId;
    evaluatedAt?: Date;
  };

  images: Array<{
    url: string;
    isPublic: boolean;
  }>;
  documents?: IListingDocument[];
  coverImage?: string;

  owner: string; // admin or agent
  agent: Schema.Types.ObjectId; // admin or agent
  sellerClient: Schema.Types.ObjectId; // Reference to the seller client created for this listing
  isPublished: boolean;
  publishedAt?: Date;

  isValidated: boolean;
  validatedAt?: Date;
  validatedBy?: Schema.Types.ObjectId;

  archived: boolean;
  archivedAt?: Date;

  views: number;
  likes: number;
  isFeatured: boolean;
  isPremium: boolean;
}

/* ---------------------------------
   Schema
----------------------------------*/
const listingSchema = new Schema<IListing>(
  {
    referenceCode: { type: String },
    title: { type: String, trim: true },

    slug: {
      type: String,
      lowercase: true,
      trim: true,
    },

    description: { type: String, required: true },

    price: { type: Number },
    priceLabel: { type: String, trim: true },
    offeredPrice: { type: Number },

    status: {
      type: String,
      enum: ["En Vente", "En Location", "Vendu", "Loué", "Retiré"],
      required: true,
    },

    pipelineStatus: {
      type: String,
      enum: [
        "DRAFT",
        "PENDING_VALIDATION",
        "PHOTO_VISIT_PENDING",
        "ACTIVE",
        "UNDER_NEGOTIATION",
        "CLOSING",
        "SOLD",
        "ARCHIVED",
      ],
      default: "DRAFT",
    },

    keyAvailable: { type: Boolean, default: true },

    blockedUntil: { type: Date },
    blockedForClient: { type: Schema.Types.ObjectId, ref: "Client" },

    photoVisitScheduledAt: { type: Date },
    photoVisitCompletedAt: { type: Date },
    photoVisitNotes: { type: String },
    sellerMotivation: { type: String, enum: ["LOW", "MEDIUM", "HIGH"] },
    listingAgentEvalPrice: { type: Number },

    propertyType: {
      type: String,
      enum: [
        "Appartement",
        "Maison",
        "Villa",
        "Studio",
        "Terrain",
        "Commercial",
        "Duplex",
        "Hangar",
        "Penthouse",
        "Local Commercial",
        "Autre",
      ],
      required: true,
    },
    propertyTypeCustom: { type: String, trim: true },

    location: {
      city: { type: String, required: true, trim: true },
      district: { type: String, trim: true },
      address: { type: String, trim: true },
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },

    features: {
      bedrooms: { type: Number, default: 0 },
      bathrooms: { type: Number, default: 0 },
      area: { type: Number, required: true },
      facade: { type: Number },
      etage: { type: Number },
      nombreEtages: { type: Number },
      furnished: { type: Boolean, default: false },
      parking: { type: Boolean, default: false },
      balcony: { type: Boolean, default: false },
      garden: { type: Boolean, default: false },
      pool: { type: Boolean, default: false },
      elevator: { type: Boolean, default: false },
    },
    evaluation: {
      positives: { type: [String], default: [] },
      negatives: { type: [String], default: [] },
      idealBuyerType: {
        type: String,
        trim: true,
      },
      priceQualityOpinion: {
        type: String,
        trim: true,
      },
      finalScore: {
        type: Number,
        min: 0,
        max: 10,
      },
      evaluatedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      evaluatedAt: {
        type: Date,
      },
    },

    images: [
      {
        url: { type: String, required: true },
        isPublic: { type: Boolean, default: true },
      },
    ],
    documents: [
      {
        publicId: { type: String, required: true },
        url: { type: String, required: true },
        secureUrl: { type: String },
        originalFilename: { type: String },
        format: { type: String },
        resourceType: { type: String },
        bytes: { type: Number },
        uploadedBy: { type: Schema.Types.ObjectId, ref: "User" },
        uploadedAt: { type: Date, default: Date.now },
      },
    ],
    coverImage: { type: String, trim: true },

    owner: {
      type: String,
    },
    agent: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sellerClient: {
      type: Schema.Types.ObjectId,
      ref: "Client",
      required: true,
    },
    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date, default: new Date() },
    isValidated: { type: Boolean, default: false },
    validatedAt: { type: Date },
    validatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    archived: { type: Boolean, default: false },
    archivedAt: { type: Date },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    isPremium: { type: Boolean, default: false },
  },
  { timestamps: true }
);

/* ---------------------------------
   Indexes (important for performance)
----------------------------------*/
listingSchema.index({ referenceCode: 1 });
listingSchema.index({ "location.city": 1 });
listingSchema.index({ price: 1 });
listingSchema.index({ status: 1 });
listingSchema.index({ propertyType: 1 });
listingSchema.index({ isFeatured: 1 });
listingSchema.index({ isValidated: 1 });
listingSchema.index({ archived: 1 });
listingSchema.index({ "evaluation.finalScore": -1 });
listingSchema.index({ pipelineStatus: 1 });
listingSchema.index({ blockedUntil: 1 });

/* ---------------------------------
   Model
----------------------------------*/
const Listing = models.Listing || model<IListing>("Listing", listingSchema);

export default Listing;
