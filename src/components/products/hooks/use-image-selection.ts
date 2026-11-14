import { useCallback, useEffect, useState } from "react";

export interface SelectedImage {
  name: string;
  size: number;
  previewUrl: string;
}

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

  const selectFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file.");
      return;
    }

    setError(null);
    setSelectedImage({
      name: file.name,
      size: file.size,
      previewUrl: URL.createObjectURL(file),
    });
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
