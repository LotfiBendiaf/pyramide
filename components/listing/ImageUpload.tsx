"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone"; // npm install react-dropzone
import { ImagePlus, Trash2, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import imageCompression from "browser-image-compression";

interface ImageData {
  url: string;
  isPublic: boolean;
}

interface ImageUploadProps {
  value: ImageData[]; // Current image objects
  onChange: (value: ImageData[]) => void; // Function to update form
  onRemove: (url: string) => void; // Function to remove image
}

export default function ImageUpload({
  value,
  onChange,
  onRemove,
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setUploading(true);

      try {
        const uploadPromises = acceptedFiles.map(async (file) => {
          // ✅ COMPRESS IMAGE FIRST
          const compressedFile = await imageCompression(file, {
            maxSizeMB: 1,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          });

          const formData = new FormData();
          formData.append("file", compressedFile);
          formData.append(
            "upload_preset",
            process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!
          );
          formData.append("folder", "pyramide/listings");

          const response = await fetch(
            `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`,
            {
              method: "POST",
              body: formData,
            }
          );

          if (!response.ok) {
            throw new Error("Cloudinary upload failed");
          }

          const data = await response.json();
          return { url: data.secure_url, isPublic: true };
        });

        const newImages = await Promise.all(uploadPromises);
        onChange([...value, ...newImages]);
      } catch (error) {
        console.error("Upload failed", error);
      } finally {
        setUploading(false);
      }
    },
    [value, onChange]
  );

  const toggleVisibility = (url: string) => {
    const updated = value.map((img) =>
      img.url === url ? { ...img, isPublic: !img.isPublic } : img
    );
    onChange(updated);
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { "image/*": [".png", ".jpeg", ".jpg", ".webp"] },
    multiple: true,
    disabled: uploading,
  });

  return (
    <div>
      {/* 1. Image Previews */}
      <div className="mb-4 flex flex-wrap gap-4">
        {value.map((image) => (
          <div
            key={image.url}
            className="relative w-[200px] h-[200px] rounded-md overflow-hidden border"
          >
            <Badge
              variant={image.isPublic ? "default" : "secondary"}
              className="absolute z-10 top-2 left-2"
            >
              {image.isPublic ? "Public" : "Interne"}
            </Badge>
            <Button
              type="button"
              onClick={() => toggleVisibility(image.url)}
              variant="outline"
              size="icon"
              className="absolute size-8 z-10 top-2 right-12 rounded bg-white/90 hover:bg-white"
              aria-label="Basculer la visibilité"
              title={
                image.isPublic
                  ? "Cliquez pour rendre cette image interne uniquement"
                  : "Cliquez pour rendre cette image publique"
              }
            >
              {image.isPublic ? (
                <Eye className="h-4 w-4" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
            </Button>
            <Button
              type="button"
              onClick={() => onRemove(image.url)}
              variant="destructive"
              size="icon"
              className="absolute size-8 z-10 top-2 right-2 rounded"
              aria-label="Supprimer l'image"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Image fill className="object-cover" alt="Image" src={image.url} />
          </div>
        ))}
      </div>

      {/* 2. Dropzone Area */}
      <div
        {...getRootProps()}
        className="
          border-dashed border-2 border-gray-300 rounded-lg 
          p-10 hover:bg-gray-100 transition cursor-pointer 
          flex flex-col justify-center items-center gap-4
        "
      >
        <input {...getInputProps()} />
        <div className="p-4 bg-muted rounded-full">
          <ImagePlus className="h-10 w-10 text-secondary" />
        </div>
        <div className="text-center">
          {uploading ? (
            <p>Chargement en cours...</p>
          ) : (
            <p className="font-semibold">Cliquez ou glissez des images ici</p>
          )}
          <p className="text-xs text-gray-500">JPG, PNG, WebP</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground mt-2">
        Veuillez introduire des photos de qualité. Cliquez sur l&apos;icône{" "}
        <Eye className="inline h-4 w-4" /> pour contrôler la visibilité de
        chaque image.
      </p>
    </div>
  );
}
