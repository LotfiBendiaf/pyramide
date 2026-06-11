"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  ExternalLink,
  FileText,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  addListingDocuments,
  removeListingDocument,
  type ListingDocumentInput,
} from "@/lib/actions/listings.action";

type ListingDocument = NonNullable<Listing["documents"]>[number];

type ListingDocumentsSectionProps = {
  listingId: string;
  documents?: ListingDocument[];
};

const ACCEPTED_DOCUMENT_TYPES =
  "application/pdf,.pdf,.doc,.docx,.xls,.xlsx,image/png,image/jpeg";

function formatFileSize(bytes?: number) {
  if (!bytes) return null;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatUploadDate(date?: string | Date) {
  if (!date) return null;

  return new Intl.DateTimeFormat("fr-DZ", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

async function uploadListingDocument(
  listingId: string,
  file: File
): Promise<ListingDocumentInput> {
  if (!process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET) {
    throw new Error("Configuration Cloudinary manquante");
  }

  if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME) {
    throw new Error("Configuration Cloudinary manquante");
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append(
    "upload_preset",
    process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
  );
  formData.append("folder", `pyramide/listings/documents/${listingId}`);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/auto/upload`,
    {
      method: "POST",
      body: formData,
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(
      errorData?.error?.message || "Erreur lors du téléchargement du document"
    );
  }

  const result = await response.json();

  return {
    publicId: result.public_id,
    url: result.url,
    secureUrl: result.secure_url,
    originalFilename: result.original_filename ?? file.name,
    format: result.format,
    resourceType: result.resource_type,
    bytes: result.bytes,
  };
}

export function ListingDocumentsSection({
  listingId,
  documents: initialDocuments = [],
}: ListingDocumentsSectionProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [documents, setDocuments] = useState<ListingDocument[]>(initialDocuments);
  const [uploading, setUploading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function handleDocumentUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    setUploading(true);

    try {
      const uploadedDocuments = await Promise.all(
        files.map((file) => uploadListingDocument(listingId, file))
      );

      const result = await addListingDocuments(listingId, uploadedDocuments);

      if (!result.success || !result.data) {
        toast.error("Erreur", {
          description:
            result.error?.message || "Impossible d'ajouter les documents",
        });
        return;
      }

      setDocuments(result.data.documents ?? []);
      toast.success(
        files.length > 1
          ? `${files.length} documents ajoutés`
          : "Document ajouté"
      );
      router.refresh();
    } catch (error) {
      toast.error("Échec du téléchargement", {
        description:
          error instanceof Error
            ? error.message
            : "Impossible d'envoyer les documents",
      });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function handleRemoveDocument(document: ListingDocument) {
    if (!document._id) return;

    setRemovingId(document._id);

    try {
      const result = await removeListingDocument(listingId, document._id);

      if (!result.success || !result.data) {
        toast.error("Erreur", {
          description:
            result.error?.message || "Impossible de supprimer le document",
        });
        return;
      }

      setDocuments(result.data.documents ?? []);
      toast.success("Document supprimé");
      router.refresh();
    } catch (error) {
      toast.error("Erreur", {
        description:
          error instanceof Error
            ? error.message
            : "Impossible de supprimer le document",
      });
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <Card className="mt-10">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Documents</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            Contrats, pièces justificatives et fichiers liés à cette annonce.
          </p>
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED_DOCUMENT_TYPES}
            className="hidden"
            onChange={handleDocumentUpload}
            disabled={uploading}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {uploading ? "Upload..." : "Ajouter des documents"}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {documents.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            Aucun document ajouté pour cette annonce.
          </div>
        ) : (
          <div className="divide-y rounded-md border">
            {documents.map((document) => {
              const href = document.secureUrl ?? document.url;
              const fileSize = formatFileSize(document.bytes);
              const uploadDate = formatUploadDate(document.uploadedAt);
              const documentId = document._id ?? document.publicId;

              return (
                <div
                  key={documentId}
                  className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-muted">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        {document.originalFilename ?? document.publicId}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                        {document.format && (
                          <span>{document.format.toUpperCase()}</span>
                        )}
                        {fileSize && <span>{fileSize}</span>}
                        {uploadDate && <span>{uploadDate}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex shrink-0 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => window.open(href, "_blank")}
                      disabled={!href}
                      aria-label="Ouvrir le document"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      onClick={() => handleRemoveDocument(document)}
                      disabled={!document._id || removingId === document._id}
                      aria-label="Supprimer le document"
                    >
                      {removingId === document._id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
