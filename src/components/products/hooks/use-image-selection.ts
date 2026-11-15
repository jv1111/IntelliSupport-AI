import { useCallback, useEffect, useState } from "react";

export interface SelectedImage {
  file: File;
  name: string;
  size: number;
  previewUrl: string;
}

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

export function useImageSelection() {
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedImage) {
      return;
    }

    return () => URL.revokeObjectURL(selectedImage.previewUrl);
  }, [selectedImage]);

  const selectFile = useCallback((file: File): boolean => {
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setError("Only JPEG, PNG, WEBP, and GIF images are allowed.");
      return false;
    }

    if (file.size === 0 || file.size > MAX_IMAGE_SIZE) {
      setError("Image must not exceed 5 MB.");
      return false;
    }

    setError(null);
    setSelectedImage({
      file,
      name: file.name,
      size: file.size,
      previewUrl: URL.createObjectURL(file),
    });

    return true;
  }, []);

  const clear = useCallback(() => {
    setSelectedImage(null);
    setError(null);
  }, []);

  const reportPreviewFailure = useCallback(() => {
    setSelectedImage(null);
    setError("Unable to preview the selected image.");
  }, []);

  return { selectedImage, error, selectFile, clear, reportPreviewFailure };
}
