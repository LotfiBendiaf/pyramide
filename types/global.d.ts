type ActionResponse<T = null> = {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    details?: Record<string, string[]>;
  };
  status?: number;
  total?: number;
};

type SuccessResponse<T = null> = ActionResponse<T> & { success: true };
type ErrorResponse = ActionResponse<undefined> & { success: false };

type APIErrorResponse = NextResponse<ErrorResponse>;
type APIResponse<T = null> = NextResponse<SuccessResponse<T> | ErrorResponse>;

interface User {
  _id: string;
  firstname: string;
  lastname: string;
  username: string;
  name: string;
  email: string;
  role: Role;
  profileImage?: string;
  phone?: string;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
}

interface RouteParams {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string>>;
}

interface PaginatedSearchParams {
  page?: number;
  pageSize?: number;
  query?: string;
  filter?: string;
  sort?: string;
  today?: boolean;
  tomorrow?: boolean;
}

type ListingPipelineStatus =
  | "DRAFT"
  | "PENDING_VALIDATION"
  | "PHOTO_VISIT_PENDING"
  | "ACTIVE"
  | "UNDER_NEGOTIATION"
  | "CLOSING"
  | "SOLD"
  | "ARCHIVED";

interface Listing {
  _id: string;
  title?: string;
  referenceCode?: string; // VA-0001 — assigned on validation
  slug?: string;

  description: string;

  price: number;
  priceLabel?: string; // ex: "80 000 DA / mois"
  offeredPrice?: number;

  pipelineStatus: ListingPipelineStatus;
  status: "En Vente" | "En Location" | "Vendu" | "Loué" | "Retiré";
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
    facade: number;
    etage?: number;
    nombreEtages?: number;
    furnished?: boolean;
    parking?: boolean;
    balcony?: boolean;
    garden?: boolean;
    pool?: boolean;
    elevator?: boolean;
  };

  evaluation?: {
    positives?: string[];
    negatives?: string[];
    idealBuyerType?: string;
    priceQualityOpinion?: string;
    finalScore?: number; // 0 → 10
    evaluatedBy?: string;
    evaluatedAt?: Date;
  };

  images?: Array<{
    url: string;
    isPublic: boolean;
  }>;
  coverImage?: string;

  sellerClient: {
    _id: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
  };
  agent?: {
    _id: string;
    firstname: string;
    lastname: string;
    name?: string;
    email?: string;
    phone?: string;
  };
  isPublished: boolean;
  publishedAt?: Date;

  isValidated: boolean;
  validatedAt?: Date;
  validatedBy?: string;

  archived?: boolean;
  archivedAt?: Date;

  views: number;
  likes: number;
  isFeatured: boolean;
  isPremium: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface Client {
  _id: string;

  referenceCode: string; // BUY-00032
  type: "BUYER" | "SELLER" | "RENTER" | "INVESTOR";

  firstName?: string;
  lastName?: string;
  phone: string;
  email?: string;

  budgetMin?: number;
  budgetMax?: number;
  priceCurrency?: "DZD" | "EUR" | "USD";
  wantedArea?: number;
  city?: string;
  wantedPropertyType?: string;
  rooms?: number;
  floorMin?: number;
  floorMax?: number;
  preferredLocation?: string;

  extraNotes?: string;

  qualificationStatus:
    | "NEUTRAL"
    | "NEW"
    | "QUALIFIED"
    | "HOT"
    | "COLD"
    | "NO_RESPONSE"
    | "NOT_RELEVANT"
    | "ARCHIVED";
  qualificationNotes?: string;

  pipelineStage: string;
  clientTemperature?: string;
  phase1Notes?: string;
  phase2Agent?: string;
  phase2Notes?: string;
  lastContactedAt?: string | Date;

  createdBy: Schema.Types.ObjectId; // Agent / Assistant
  assignedAgent?: Schema.Types.ObjectId;

  archived: boolean;
  archivedAt?: Date;
  archiveReason?: string;

  createdAt: Date;
  updatedAt: Date;
}

interface FollowUp {
  _id?: string;
  listing: Schema.Types.ObjectId;
  client: Schema.Types.ObjectId;
  agent?: Schema.Types.ObjectId;
  type: "COLD" | "WARM" | "HOT" | "CUSTOM";
  title?: string;
  note?: string;
  reminderAt?: Date;
  channel?: "CALL" | "WHATSAPP" | "EMAIL" | "VISIT";
  status?: "PENDING" | "DONE" | "OVERDUE";
  createdAt: Date;
  updatedAt: Date;
}

interface Message {
  _id: string;
  name: string;
  email?: string;
  phone?: string;
  message: string;
  status: "NEW" | "READ" | "REPLIED" | "ARCHIVED";
  adminNotes?: string;
  repliedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}
