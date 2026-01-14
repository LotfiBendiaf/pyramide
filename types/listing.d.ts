interface ListingInput {
  title: string;
  slug: string;
  description: string;

  price: number;
  priceLabel?: string;

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
    bedrooms?: number;
    bathrooms?: number;
    area?: number; // m²
    facade: number;

    furnished?: boolean;
    parking?: boolean;
    balcony?: boolean;
    garden?: boolean;
    pool?: boolean;
  };

  images?: string[];

  isFeatured?: boolean;
  published?: boolean;
}
interface ListingItem {
  id: string;
  title: string;
  description: string;

  price: number;

  image?: string;
}
