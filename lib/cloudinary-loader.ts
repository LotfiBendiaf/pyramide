interface CloudinaryLoaderParams {
  src: string;
  width: number;
  quality?: number;
}

export default function cloudinaryLoader({
  src,
  width,
  quality,
}: CloudinaryLoaderParams): string {
  // If the src is already a Cloudinary URL, inject transformations
  if (src.includes("res.cloudinary.com")) {
    const q = quality || 75;
    // Replace /upload/ or /fetch/ with transformation params
    return src.replace(
      /\/upload\//,
      `/upload/w_${width},q_${q},f_auto/`
    );
  }

  // For local images, return as-is
  return src;
}
