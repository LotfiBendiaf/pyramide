"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Icon from "./Icon";

export default function SearchBar() {
  const [priceRange, setPriceRange] = useState([30000, 20000000]);

  return (
    <div className="absolute top-0 left-1/2 -translate-x-[50%] -translate-y-[10%] md:-translate-y-[50%] bg-white rounded-4xl shadow-md px-10 py-6 flex flex-col gap-4 justify-between md:flex-row md:items-center md:gap-2 w-full max-w-6xl z-40">
      <Icon format="mini" />
      {/* Localisation */}

      {/* Type de propriété */}
      <Select>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Type de propriété" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="apartment">Appartement</SelectItem>
          <SelectItem value="house">Maison</SelectItem>
          <SelectItem value="villa">Villa</SelectItem>
          <SelectItem value="studio">Studio</SelectItem>
          <SelectItem value="land">Terrain</SelectItem>
          <SelectItem value="commercial">Commercial</SelectItem>
        </SelectContent>
      </Select>

      {/* Chambres */}
      <Select>
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Chambres" />
        </SelectTrigger>
        <SelectContent>
          {[1, 2, 3, 4, 5].map((num) => (
            <SelectItem key={num} value={String(num)}>
              {num}+
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Plage de prix */}
      <div className="w-[250px] px-2 space-y-2">
        <p className="text-sm font-medium mb-1">Plage de prix</p>
        <Slider
          value={priceRange}
          onValueChange={setPriceRange}
          min={10000}
          max={50000000}
          step={5000}
        />
        <div className="flex justify-between text-xs mt-1">
          <span>{priceRange[0]} DZD</span>
          <span>{priceRange[1]} DZD</span>
        </div>
      </div>

      {/* Plus de filtres */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline">Plus de filtres</Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Plus de filtres</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-4">
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Salles de bain" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5].map((num) => (
                  <SelectItem key={num} value={String(num)}>
                    {num}+
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Meublé" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="furnished">Meublé</SelectItem>
                <SelectItem value="semi-furnished">Semi-meublé</SelectItem>
                <SelectItem value="unfurnished">Non meublé</SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sale">À vendre</SelectItem>
                <SelectItem value="rent">À louer</SelectItem>
              </SelectContent>
            </Select>

            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Commodités" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="parking">Parking</SelectItem>
                <SelectItem value="balcony">Balcon</SelectItem>
                <SelectItem value="pool">Piscine</SelectItem>
                <SelectItem value="garden">Jardin</SelectItem>
                <SelectItem value="elevator">Ascenseur</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button className="w-full mt-2">Appliquer les filtres</Button>
        </DialogContent>
      </Dialog>

      {/* Bouton Rechercher */}
      <Button className="bg-blue-600 hover:bg-blue-700 text-white transition-all cursor-pointer">
        Rechercher
      </Button>
    </div>
  );
}
