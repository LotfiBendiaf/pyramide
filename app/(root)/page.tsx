import HeroBgCarousel from "@/components/HeroBgCarousel";
import HeroSplitWord from "@/components/HeroSplitWord";
import ListingCard from "@/components/ListingCard";
import ReviewQuote from "@/components/ReviewQuote";
import SearchBar from "@/components/SearchBar";
import { Button } from "@/components/ui/button";
import { ArrowDownRight, Calendar } from "lucide-react";
import React from "react";

export const listings = [
  {
    id: 1,
    image: "/immo1.jpg",
    status: "À Vendre",
    price: "25 000 000 DA",
    title: "Appartement Moderne",
    location: "Oran, Akid Lotfi",
    beds: 3,
    baths: 2,
    area: 120,
  },
  {
    id: 2,
    image: "/immo2.jpg",
    status: "À Louer",
    price: "80 000 DA / mois",
    title: "Villa de Luxe avec Piscine",
    location: "Alger, Hydra",
    beds: 5,
    baths: 4,
    area: 350,
  },
  {
    id: 3,
    image: "/immo3.jpg",
    status: "À Vendre",
    price: "12 500 000 DA",
    title: "Maison Familiale",
    location: "Tlemcen, Mansourah",
    beds: 4,
    baths: 2,
    area: 200,
  },
  {
    id: 4,
    image: "/immo4.jpg",
    status: "À Louer",
    price: "35 000 DA / mois",
    title: "Studio Meublé",
    location: "Constantine, Centre-ville",
    beds: 1,
    baths: 1,
    area: 45,
  },
  {
    id: 5,
    image: "/immo5.jpg",
    status: "À Vendre",
    price: "40 000 000 DA",
    title: "Duplex Haut Standing",
    location: "Annaba, Les Crêtes",
    beds: 4,
    baths: 3,
    area: 280,
  },
  {
    id: 6,
    image: "/immo6.jpg",
    status: "À Vendre",
    price: "7 000 000 DA",
    title: "Terrain Constructible",
    location: "Mostaganem, Kharrouba",
    beds: 0,
    baths: 0,
    area: 600,
  },
  {
    id: 7,
    image: "/immo8.jpg",
    status: "À Louer",
    price: "60 000 DA / mois",
    title: "Appartement avec Vue sur Mer",
    location: "Tipaza, Chenoua",
    beds: 2,
    baths: 1,
    area: 90,
  },
  {
    id: 8,
    image: "/immo7.jpg",
    status: "À Vendre",
    price: "18 000 000 DA",
    title: "Maison Traditionnelle",
    location: "Ghardaïa, Beni Isguen",
    beds: 3,
    baths: 2,
    area: 150,
  },
];

const page = () => {
  return (
    <main className="space-y-10">
      <HeroBgCarousel>
        <div className="inset-0 absolute bg-black/50 -z-10"></div>

        <div className="space-y-5 h-full flex flex-col items-center justify-center pt-20 text-center text-white">
          <div className="lg:max-w-2/3 2xl:max-w-1/2 space-y-2">
            <HeroSplitWord />
            <h1 className="text-lg leading-7 lg:text-4xl lg:leading-12 2xl:text-5xl 2xl:leading-14 syncopate-bold ">
              Là où vos rêves trouvent une adresse.
            </h1>
            <p className="text-xl">
              Des biens immobiliers, des solutions sur mesure
            </p>
          </div>
          <div className="lg:flex gap-4">
            <Button className="">
              Voir nos offres <ArrowDownRight />
            </Button>
            <Button variant="secondary">
              Contactez-nous
              <Calendar />
            </Button>
          </div>
          <h2 className="syncopate-bold text-2xl">Real Estate Agency</h2>
        </div>
        <div className="flex-1"></div>
        <SearchBar />
      </HeroBgCarousel>{" "}
      <h2 className="text-5xl mb-10 syncopate-bold text-center">Listings</h2>
      <div className="grid grid-cols-1 mx-20 md:grid-cols-3 lg:grid-cols-3 2xl:grid-cols-4 gap-6 z-10 relative">
        {listings.map((item, index) => (
          <ListingCard key={index} {...item} />
        ))}
      </div>
      <h2 className="text-4xl syncopate-bold">Avis Client</h2>
      <ReviewQuote />
    </main>
  );
};

export default page;
