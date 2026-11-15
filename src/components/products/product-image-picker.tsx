"use client";

import { ProductImage } from "@/components/products/product-image";
import { useRef, useState } from "react";
import type { ChangeEvent, DragEvent } from "react";
import { ImagePlus, RefreshCw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FieldLabel } from "@/components/ui/field";
import { useImageSelection } from "@/components/products/hooks/use-image-selection";
import { formatFileSize } from "@/lib/files/format-file-size";

interface ProductImagePickerProps {
  productName: string;
  imageUrl?: string | null;
  disabled?: boolean;
  onChange: (file: File | null, removeImage: boolean) => void;
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
  imageUrl,
  disabled = false,
  onChange,
}: ProductImagePickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isRemoved, setIsRemoved] = useState(false);

  const { selectedImage, error, selectFile, clear, reportPreviewFailure } =
    useImageSelection();

  const previewUrl =
    selectedImage?.previewUrl ?? (!isRemoved ? imageUrl : null);

  function openFilePicker() {
    inputRef.current?.click();
  }

  function handleFileSelection(file: File) {
    if (selectFile(file)) {
      setIsRemoved(false);
      onChange(file, false);
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (file) {
      handleFileSelection(file);
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
      handleFileSelection(file);
    }
  }

  function handleClear() {
    clear();
    setIsRemoved(true);
    onChange(null, true);
  }

  return (
    <div>
      <FieldLabel htmlFor="product-image">Product Image</FieldLabel>

      <input
        ref={inputRef}
        id="product-image"
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={handleChange}
        disabled={disabled}
        className="sr-only"
      />

      {previewUrl ? (
        <div className={previewCardStyles}>
          <div className="relative aspect-4/3 w-full shrink-0 overflow-hidden rounded-xl border border-border bg-surface sm:w-44">
            <ProductImage
                src={previewUrl}
                alt={productName || "Product image"}
                sizes="(min-width: 640px) 11rem, 100vw"
                onError={selectedImage ? reportPreviewFailure : undefined}
                className="object-contain p-2"
              />
          </div>

          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <p className="truncate text-xs font-bold text-foreground">
                {selectedImage?.name ?? "Current product image"}
              </p>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {selectedImage
                  ? formatFileSize(selectedImage.size)
                  : "Saved product image"}
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
                onClick={handleClear}
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
            PNG, JPG, WEBP or GIF · Max 5 MB
          </span>
        </button>
      )}

      <p className="mt-1.5 text-[11px] text-muted-foreground">
        Product images are stored securely.
      </p>

      {error && (
        <p role="alert" className="mt-1.5 text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
