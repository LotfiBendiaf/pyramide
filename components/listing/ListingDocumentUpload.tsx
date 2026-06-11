"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { toast } from "sonner";
import {
  ExternalLink,
  FileText,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export type ListingDocumentValue = {
  _id?: string;
  publicId: string;
  url: string;
  secureUrl?: string;
  originalFilename?: string;
  format?: string;
  resourceType?: string;
  bytes?: number;
  uploadedAt?: string | Date;
};

type ListingDocumentUploadProps = {
  value?: ListingDocumentValue[];
  onChange: (documents: ListingDocumentValue[]) => void;
  folder: string;
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

async function uploadDocument(
  file: File,
  folder: string
): Promise<ListingDocumentValue> {
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
  formData.append("folder", folder);

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
    uploadedAt: new Date(),
  };
}

export function ListingDocumentUpload({
  value = [],
  onChange,
  folder,
}: ListingDocumentUploadProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    if (!files.length) return;

    setUploading(true);

    try {
      const uploadedDocuments = await Promise.all(
        files.map((file) => uploadDocument(file, folder))
      );

      onChange([...value, ...uploadedDocuments]);
      toast.success(
        files.length > 1
          ? `${files.length} documents ajoutés`
          : "Document ajouté"
      );
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

  function removeDocument(document: ListingDocumentValue) {
    onChange(value.filter((item) => item.publicId !== document.publicId));
  }

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={ACCEPTED_DOCUMENT_TYPES}
        className="hidden"
        onChange={handleUpload}
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

      {value.length === 0 ? (
        <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
          Aucun document ajouté.
        </div>
      ) : (
        <div className="divide-y rounded-md border">
          {value.map((document) => {
            const href = document.secureUrl ?? document.url;
            const fileSize = formatFileSize(document.bytes);
            const uploadDate = formatUploadDate(document.uploadedAt);

            return (
              <div
                key={document.publicId}
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
                    onClick={() => removeDocument(document)}
                    aria-label="Supprimer le document"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
