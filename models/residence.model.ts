import { Schema, model, models } from "mongoose";
import { IListingDocument } from "./listing.model";

/* ---------------------------------
   TypeScript Interface
----------------------------------*/
export type UnitStatus = "AVAILABLE" | "RESERVED" | "SOLD";
export type ResidenceCompletionStatus =
  | "PLANNED"
  | "UNDER_CONSTRUCTION"
  | "DELIVERED";

export interface IResidenceUnit {
  _id?: Schema.Types.ObjectId;
  unitNumber: string;
  floor?: number;
  type?: string;
  typeCustom?: string;
  bedrooms?: number;
  bathrooms?: number;
  area: number; // m²
  price?: number;
  status: UnitStatus;
  label?: string;
}

export interface IResidence {
  referenceCode?: string; // RES-0000001 — assigned on create
  referenceGeneratedAt?: Date;

  title: string;
  slug: string;
  tagline?: string;
  description: string;
  developerName?: string;

  location: {
    city: string;
    district?: string;
    address?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };

  deliveryDate?: Date;
  completionStatus: ResidenceCompletionStatus;

  amenities?: string[];

  images: Array<{
    url: string;
    isPublic: boolean;
  }>;
  coverImage?: string;
  documents?: IListingDocument[];

  units: IResidenceUnit[];
  // Cached aggregates, recomputed server-side on every write
  totalUnits?: number;
  priceFrom?: number;

  agent?: Schema.Types.ObjectId; // ref User — optional point of contact
  createdBy: Schema.Types.ObjectId;

  isPublished: boolean;
  publishedAt?: Date;
  isFeatured: boolean;

  archived: boolean;
  archivedAt?: Date;

  views: number;
}

/* ---------------------------------
   Schema
----------------------------------*/
const residenceUnitSchema = new Schema<IResidenceUnit>(
  {
    unitNumber: { type: String, required: true, trim: true },
    floor: { type: Number },
    type: { type: String, trim: true },
    typeCustom: { type: String, trim: true },
    bedrooms: { type: Number },
    bathrooms: { type: Number },
    area: { type: Number, required: true },
    price: { type: Number },
    status: {
      type: String,
      enum: ["AVAILABLE", "RESERVED", "SOLD"],
      default: "AVAILABLE",
    },
    label: { type: String, trim: true },
  },
  { _id: true }
);

const residenceSchema = new Schema<IResidence>(
  {
    referenceCode: { type: String },
    referenceGeneratedAt: { type: Date },

    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, lowercase: true, trim: true },
    tagline: { type: String, trim: true },
    description: { type: String, required: true },
    developerName: { type: String, trim: true },

    location: {
      city: { type: String, required: true, trim: true },
      district: { type: String, trim: true },
      address: { type: String, trim: true },
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },

    deliveryDate: { type: Date },
    completionStatus: {
      type: String,
      enum: ["PLANNED", "UNDER_CONSTRUCTION", "DELIVERED"],
      default: "PLANNED",
    },

    amenities: { type: [String], default: [] },

    images: [
      {
        url: { type: String, required: true },
        isPublic: { type: Boolean, default: true },
      },
    ],
    coverImage: { type: String, trim: true },
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

    units: { type: [residenceUnitSchema], default: [] },
    totalUnits: { type: Number, default: 0 },
    priceFrom: { type: Number },

    agent: { type: Schema.Types.ObjectId, ref: "User" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

    isPublished: { type: Boolean, default: false },
    publishedAt: { type: Date },
    isFeatured: { type: Boolean, default: false },

    archived: { type: Boolean, default: false },
    archivedAt: { type: Date },

    views: { type: Number, default: 0 },
  },
  { timestamps: true }
);

/* ---------------------------------
   Indexes
----------------------------------*/
residenceSchema.index({ slug: 1 }, { unique: true });
residenceSchema.index(
  { referenceCode: 1 },
  {
    unique: true,
    partialFilterExpression: {
      referenceCode: { $type: "string", $gt: "" },
    },
  }
);
residenceSchema.index({ "location.city": 1 });
residenceSchema.index({ isPublished: 1 });
residenceSchema.index({ isFeatured: 1 });
residenceSchema.index({ archived: 1 });
residenceSchema.index({ "units.status": 1 });

/* ---------------------------------
   Model
----------------------------------*/
const Residence =
  models.Residence || model<IResidence>("Residence", residenceSchema);

export default Residence;
