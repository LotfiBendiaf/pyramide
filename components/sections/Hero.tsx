import { ArrowDownRight, Calendar } from "lucide-react";
import React from "react";
import HeroBgCarousel from "../HeroBgCarousel";
import HeroSplitWord from "../HeroSplitWord";
import SearchBar from "../SearchBar";
import { Button } from "../ui/button";

const Hero = () => {
  return (
    <section>
      <HeroBgCarousel>
        <div className="inset-0 absolute bg-gradient-to-b from-black to-black/10 -z-10"></div>

        <div className="space-y-5 h-screen flex flex-col items-center md:justify-center text-center text-white">
          <div className="lg:max-w-2/3 2xl:max-w-1/2 space-y-2 p-2">
            <HeroSplitWord />
            <h1 className="text-lg leading-7 lg:text-4xl lg:leading-12 2xl:text-5xl 2xl:leading-14 syncopate-bold ">
              Là où vos rêves trouvent une adresse.
            </h1>
            <p className="text-xl">
              Des biens immobiliers, des solutions sur mesure
            </p>
          </div>
          <div className="lg:flex gap-4 space-y-3">
            <Button>
              Voir nos offres <ArrowDownRight />
            </Button>
            <Button variant={"outline"} className="text-black">
              Contactez-nous
              <Calendar />
            </Button>
          </div>
          {/* <h2 className="syncopate-bold text-2xl">Real Estate Agency</h2> */}
        </div>
        <div className="rounded-t-[60px] absolute bottom-0 h-32 w-full bg-white z-40"></div>
        <SearchBar />
      </HeroBgCarousel>
    </section>
  );
};

export default Hero;
