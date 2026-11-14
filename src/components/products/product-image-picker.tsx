"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { ImagePlus, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldLabel } from "@/components/ui/field";
import { useImageSelection } from "@/components/products/hooks/use-image-selection";
import { formatFileSize } from "@/lib/files/format-file-size";

interface ProductImagePickerProps {
  productName: string;
  disabled?: boolean;
}

const dropzoneStyles =
  "group flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors focus-visible:ring-4 focus-visible:ring-ring/15 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60";

const dropzoneIdleStyles =
  "border-border bg-surface-muted hover:border-primary/60 hover:bg-primary/5";

const dropzoneActiveStyles = "border-primary bg-primary/5";

const previewCardStyles =
  "flex flex-col gap-4 rounded-xl border border-border bg-surface-muted p-4 sm:flex-row sm:items-center";

export function ProductImagePicker({
  productName,
  disabled = false,
}: ProductImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const { selectedImage, error, selectFile, clear, reportPreviewFailure } =
    useImageSelection();

  function openFilePicker() {
    inputRef.current?.click();
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (file) {
      selectFile(file);
    }
  }

  function handleDragOver(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();

    if (!disabled) {
      setIsDragging(true);
    }
  }

  function handleDrop(event: DragEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0];

    if (file && !disabled) {
      selectFile(file);
    }
  }

  return (
    <div>
      <FieldLabel htmlFor="product-image">Product Image</FieldLabel>

      <input
        ref={inputRef}
        id="product-image"
        type="file"
        accept="image/*"
        onChange={handleChange}
        disabled={disabled}
        className="sr-only"
      />

      {selectedImage ? (
        <div className={previewCardStyles}>
          <div className="relative aspect-4/3 w-full shrink-0 overflow-hidden rounded-xl border border-border bg-surface sm:w-44">
            <Image
              src={selectedImage.previewUrl}
              alt={productName || "Selected product image"}
              fill
              sizes="(min-width: 640px) 11rem, 100vw"
              unoptimized
              onError={reportPreviewFailure}
              className="object-contain p-2"
            />
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="truncate text-xs font-bold text-foreground">
                {selectedImage.name}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {formatFileSize(selectedImage.size)}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                fullWidth={false}
                className="gap-1.5"
                onClick={openFilePicker}
                disabled={disabled}
              >
                <RefreshCw className="size-3.5" aria-hidden="true" />
                Change
              </Button>

              <Button
                variant="danger-subtle"
                fullWidth={false}
                className="gap-1.5"
                onClick={clear}
                disabled={disabled}
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
                Remove
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={openFilePicker}
          onDragOver={handleDragOver}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          disabled={disabled}
          className={`${dropzoneStyles} ${isDragging ? dropzoneActiveStyles : dropzoneIdleStyles}`}
        >
          <span className="flex size-11 items-center justify-center rounded-xl bg-surface text-primary shadow-sm inset-ring-1 inset-ring-border transition-transform duration-150 group-hover:scale-105">
            <ImagePlus className="size-5" aria-hidden="true" />
          </span>
          <span className="text-xs font-bold text-foreground">
            Click to select an image
          </span>
          <span className="text-[11px] text-muted-foreground">
            or drag and drop it here
          </span>
          <span className="text-[10px] text-muted-foreground">
            PNG, JPG, WEBP or GIF
          </span>
        </button>
      )}

      <p className="mt-1.5 text-[11px] text-muted-foreground">
        Selected images are only previewed. Saving images will be added later.
      </p>

      {error && (
        <p role="alert" className="mt-1.5 text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
