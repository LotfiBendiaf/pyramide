interface ListingInput {
  title: string;
  slug: string;
  description?: string;

  price?: number;
  offeredPrice?: number;
  priceLabel?: string;

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
    bedrooms?: number;
    bathrooms?: number;
    area?: number; // m²
    facade?: number;
    etage?: number;

    furnished?: boolean;
    parking?: boolean;
    balcony?: boolean;
    garden?: boolean;
    pool?: boolean;
  };

  images?: Array<{
    url: string;
    isPublic: boolean;
  }>;
  isFeatured?: boolean;
  isPublished: boolean;
}
interface ListingItem {
  id: string;
  title: string;
  description: string;

  price: number;

  image?: string;
}
