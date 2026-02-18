"use client";

import { Heart } from "lucide-react";
import { Button } from "./ui/button";
import { toast } from "sonner";
import ROUTES from "@/constants/routes";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  decrementListingLikes,
  incrementListingLikes,
} from "@/lib/actions/listings.action";
import { useWishlistStore } from "@/app/store/useWishlistStore";

export default function AddToWishlistButton({
  product,
  light = false,
}: {
  product: Listing;
  light?: boolean;
}) {
  const router = useRouter();
  const { addItem, removeItem, isInWishlist } = useWishlistStore();

  const [mounted, setMounted] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const inWishlist = isInWishlist(product._id);

  const handleClick = () => {
    startTransition(async () => {
      try {
        if (inWishlist) {
          // Optimistic update
          removeItem(product._id);

          const res = await decrementListingLikes(product._id);
          if (!res.success) throw new Error();

          toast.info("Retiré de la liste de souhaits", {
            description: `${product.title} a été retiré.`,
          });
        } else {
          // Optimistic update
          addItem({
            id: product._id,
            title: product.title || "",
            description: product.description,
            price: product.price,
            image: product.images?.[0]?.url ?? "/placeholder.png",
          });

          const res = await incrementListingLikes(product._id);
          if (!res.success) throw new Error();

          toast.success("Ajouté à la liste de souhaits", {
            description: `${product.title} a été ajouté.`,
            action: {
              label: "Voir",
              onClick: () => router.push(ROUTES.WISHLIST),
            },
          });
        }
      } catch (error) {
        // 🔁 Rollback UI
        if (inWishlist) {
          addItem({
            id: product._id,
            title: product.title || "",
            description: product.description,
            price: product.price,
            image: product.images?.[0]?.url ?? "/placeholder.png",
          });
        } else {
          toast.error(error as string);
          removeItem(product._id);
        }

        toast.error("Erreur lors de la mise à jour des favoris.");
      }
    });
  };

  return (
    <Button
      variant={light ? "outline" : "ghost"}
      size="icon"
      disabled={isPending}
      onClick={handleClick}
      aria-label={inWishlist ? "Retirer des favoris" : "Ajouter aux favoris"}
      className={`rounded-full transition z-20 ${
        inWishlist ? "text-red-500" : light ? "text-gray-500" : "text-white"
      }`}
    >
      <Heart className="w-5 h-5" fill={inWishlist ? "currentColor" : "none"} />
    </Button>
  );
}
