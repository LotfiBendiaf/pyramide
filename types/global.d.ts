type ActionResponse<T = null> = {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    details?: Record<string, string[]>;
  };
  status?: number;
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

interface Listing {
  _id: string;
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
  isFeatured: boolean;
}
