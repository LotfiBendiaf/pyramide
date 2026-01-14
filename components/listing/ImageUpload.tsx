"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone"; // npm install react-dropzone
import { ImagePlus, Trash2 } from "lucide-react";
import Image from "next/image";
import { Button } from "@/components/ui/button";

interface ImageUploadProps {
  value: string[]; // Current URLs
  onChange: (value: string[]) => void; // Function to update form
  onRemove: (value: string) => void; // Function to remove image
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

      // 1. Upload Logic Here
      // This is where you send the file to your backend or Cloudinary
      // For now, I will simulate it returning a URL.

      try {
        const uploadPromises = acceptedFiles.map(async (file) => {
          const formData = new FormData();
          formData.append("file", file);
          formData.append(
            "upload_preset",
            process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!
          );
          formData.append("folder", "pyramide/listings");

          // Fetch to Cloudinary
          const response = await fetch(
            `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`,
            { method: "POST", body: formData }
          );
          const data = await response.json();
          return data.secure_url;
        });

        const newUrls = await Promise.all(uploadPromises);

        // Update the parent form with the new URLs
        onChange([...value, ...newUrls]);
      } catch (error) {
        console.error("Upload failed", error);
      } finally {
        setUploading(false);
      }
    },
    [value, onChange]
  );

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
        {value.map((url) => (
          <div
            key={url}
            className="relative w-[200px] h-[200px] rounded-md overflow-hidden border"
          >
            <Button
              type="button"
              onClick={() => onRemove(url)}
              variant="destructive"
              size="icon"
              className="absolute size-8 z-10 top-2 right-2 rounded"
            >
              <Trash2 />
            </Button>
            <Image fill className="object-cover" alt="Image" src={url} />
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
      <p className="text-sm text-muted-foreground">
        Veuillez inroduire des photos de qualité.
      </p>
    </div>
  );
}
