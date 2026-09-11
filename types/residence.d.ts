interface UnitInput {
  unitNumber: string;
  floor?: number;
  type?: string;
  typeCustom?: string;
  bedrooms?: number;
  bathrooms?: number;
  area: number;
  price?: number;
  status: UnitStatus;
  label?: string;
}

interface ResidenceInput {
  title: string;
  slug?: string;
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
  images?: Array<{
    url: string;
    isPublic: boolean;
  }>;
  documents?: Listing["documents"];
  units: UnitInput[];
  agent?: string;
  isPublished: boolean;
  isFeatured?: boolean;
}
