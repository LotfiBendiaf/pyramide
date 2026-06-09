"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import ROUTES from "@/constants/routes";
import { Button } from "@/components/ui/button";

interface CopyClientListingLinkButtonProps {
  listingId: string;
}

export function CopyClientListingLinkButton({
  listingId,
}: CopyClientListingLinkButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const clientUrl = new URL(
      ROUTES.LISTING_DETAIL(listingId),
      window.location.origin,
    ).toString();

    try {
      await navigator.clipboard.writeText(clientUrl);
      setCopied(true);
      toast.success("Lien client copié");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier le lien");
    }
  };

  return (
    <Button type="button" variant="outline" onClick={handleCopy}>
      {copied ? (
        <Check className="h-4 w-4 mr-2" />
      ) : (
        <Copy className="h-4 w-4 mr-2" />
      )}
      Copier le lien client
    </Button>
  );
}
