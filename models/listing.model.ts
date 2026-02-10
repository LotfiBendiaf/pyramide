import { Schema, model, models } from "mongoose";

/* ---------------------------------
   TypeScript Interface
----------------------------------*/
export interface IListing {
  referenceCode: string; // VA-0001 (Vente Appartement), LV-0001 (Location Villa)
  title?: string;
  slug?: string;

  description: string;

  price: number;
  priceLabel?: string; // ex: "80 000 DA / mois"

  status: "En Vente" | "En Location" | "Vendu" | "Loué" | "Retiré";
  propertyType:
    | "Appartement"
    | "Maison"
    | "Villa"
    | "Studio"
    | "Terrain"
    | "Commercial";

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
    facade: number;
    etage?: number;
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
  coverImage?: string;

  owner: string; // admin or agent
  agent: Schema.Types.ObjectId; // admin or agent
  published: boolean;
  publishedAt?: Date;

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

    price: { type: Number, required: true },
    priceLabel: { type: String, trim: true },

    status: {
      type: String,
      enum: ["En Vente", "En Location", "Vendu", "Loué", "Retiré"],
      required: true,
    },

    propertyType: {
      type: String,
      enum: [
        "Appartement",
        "Maison",
        "Villa",
        "Studio",
        "Terrain",
        "Commercial",
      ],
      required: true,
    },

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
    coverImage: { type: String, trim: true },

    owner: {
      type: String,
    },
    agent: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    published: { type: Boolean, default: false },
    publishedAt: { type: Date, default: new Date() },

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
listingSchema.index({ "evaluation.finalScore": -1 });

/* ---------------------------------
   Model
----------------------------------*/
const Listing = models.Listing || model<IListing>("Listing", listingSchema);

export default Listing;
