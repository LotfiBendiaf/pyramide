/**
 * Download utility functions for listing images
 * Uses the same approach as ImageUpload component for consistency
 */

import JSZip from "jszip";

interface ImageData {
  url: string;
  isPublic: boolean;
}

/**
 * Downloads listing images as a ZIP file
 * Matches the implementation used in ImageUpload component
 */
export async function downloadListingImages(
  images: ImageData[]
): Promise<void> {
  if (images.length === 0) return;

  try {
    const zip = new JSZip();
    const fileAdds = images.map(async (image, index) => {
      const response = await fetch(image.url);
      if (!response.ok) {
        throw new Error("Failed to download image");
      }

      const blob = await response.blob();
      const url = new URL(image.url);
      const fileNameFromUrl = url.pathname.split("/").pop();
      const extension = blob.type.split("/")[1] || "jpg";
      const fileName =
        fileNameFromUrl && fileNameFromUrl.length > 0
          ? fileNameFromUrl
          : `listing-image-${index + 1}.${extension}`;

      zip.file(fileName, blob);
    });

    await Promise.all(fileAdds);

    const zipBlob = await zip.generateAsync({ type: "blob" });
    const downloadUrl = URL.createObjectURL(zipBlob);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `listing-images-${Date.now()}.zip`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error("Download failed", error);
    throw error;
  }
}
