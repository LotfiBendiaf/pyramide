import { Schema, model, models } from "mongoose";

/* ---------------------------------
   TypeScript Interface
----------------------------------*/
export interface IListing {
  title?: string;
  slug?: string;

  description: string;

  price: number;
  priceLabel?: string; // ex: "80 000 DA / mois"

  status: "À Vendre" | "À Louer";
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

    furnished?: boolean;
    parking?: boolean;
    balcony?: boolean;
    garden?: boolean;
    pool?: boolean;
    elevator?: boolean;
  };

  images: string[];
  coverImage?: string;

  owner: string; // admin or agent
  agent: Schema.Types.ObjectId; // admin or agent
  published: boolean;
  publishedAt?: Date;

  views: number;
  likes: number;
  isFeatured: boolean;
}

/* ---------------------------------
   Schema
----------------------------------*/
const listingSchema = new Schema<IListing>(
  {
    title: { type: String, trim: true },

    slug: {
      type: String,
      unique: true,
      lowercase: true,
      trim: true,
    },

    description: { type: String, required: true },

    price: { type: Number, required: true },
    priceLabel: { type: String, trim: true },

    status: {
      type: String,
      enum: ["À Vendre", "À Louer"],
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
      furnished: { type: Boolean, default: false },
      parking: { type: Boolean, default: false },
      balcony: { type: Boolean, default: false },
      garden: { type: Boolean, default: false },
      pool: { type: Boolean, default: false },
      elevator: { type: Boolean, default: false },
    },

    images: [{ type: String, required: true }],
    coverImage: { type: String, trim: true },

    owner: {
      type: String,
    },

    published: { type: Boolean, default: false },
    publishedAt: { type: Date },

    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
  },
  { timestamps: true }
);

/* ---------------------------------
   Indexes (important for performance)
----------------------------------*/
listingSchema.index({ "location.city": 1 });
listingSchema.index({ price: 1 });
listingSchema.index({ status: 1 });
listingSchema.index({ propertyType: 1 });
listingSchema.index({ isFeatured: 1 });

/* ---------------------------------
   Model
----------------------------------*/
const Listing = models.Listing || model<IListing>("Listing", listingSchema);

export default Listing;
