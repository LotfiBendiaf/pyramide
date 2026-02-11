"use client";

import { useWishlistStore } from "@/app/store/useWishlistStore";
import { SectionHeader } from "@/components/SectionHeader";
import { Button } from "@/components/ui/button";
import { Trash2, HeartOff } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import Link from "next/link";
import ROUTES from "@/constants/routes";
import Navbar from "@/components/navigation/Navbar";

export default function WishlistPage() {
  const { items, removeItem, clearWishlist } = useWishlistStore();

  // --- Empty State ---
  if (items.length === 0) {
    return (
      <div className="container mx-auto px-5">
        <SectionHeader
          title="Ma Wishlist"
          subtitle="Vos biens favoris apparaîtront ici"
        />

        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
          <HeartOff className="w-14 h-14 text-muted-foreground" />
          <h2 className="text-2xl font-semibold">
            Votre liste de souhaits est vide
          </h2>
          <p className="text-muted-foreground max-w-md">
            Parcourez nos annonces et ajoutez vos biens préférés pour les
            retrouver facilement.
          </p>
          <Button asChild>
            <Link href={ROUTES.HOME}>Explorer les annonces</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <main>
      <div className="bg-black">
        <Navbar variant="solid" />
      </div>
      <div className="container mx-auto p-5">
        <SectionHeader
          title="Ma Wishlist"
          subtitle="Trouvez vos biens immobiliers préférés"
        />

        <div className="max-w-5xl mx-auto py-8 min-h-[70vh] space-y-6">
          {/* Header actions */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <h1 className="text-3xl font-semibold">Liste de souhaits</h1>
            <Button variant="destructive" onClick={clearWishlist}>
              Vider la liste
            </Button>
          </div>

          {/* Items */}
          <div className="grid gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 rounded-2xl border bg-card p-4 shadow-sm hover:shadow-md transition"
              >
                {/* Left */}
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-muted">
                    <Image
                      src={item.image || "/placeholder.png"}
                      alt={item.title}
                      fill
                      className="object-cover"
                    />
                  </div>

                  <div className="space-y-1">
                    <h2 className="text-lg font-medium leading-tight">
                      {item.title}
                    </h2>
                    <p className="text-primary font-semibold">
                      {Intl.NumberFormat("fr-DZ").format(item.price)} DA
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      removeItem(item.id);
                      toast.info("Supprimé", {
                        description: "Retiré de la wishlist.",
                      });
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
