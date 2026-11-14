"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createProduct, fetchProduct, updateProduct } from "@/lib/products";
import type {
  Product,
  ProductInput,
  ProductStatus,
} from "@/lib/products/types";
import { clearProductFormDraft } from "@/components/products/product-form-draft";

export function useProductEditor(productId?: string) {
  const router = useRouter();

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(productId));
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const [isArchiveOpen, setIsArchiveOpen] = useState(false);

  useEffect(() => {
    if (!productId) {
      return;
    }

    let cancelled = false;

    fetchProduct(productId)
      .then((result) => {
        if (!cancelled) {
          setProduct(result);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setLoadError(
            error instanceof Error
              ? error.message
              : "Unable to load product. Please try again.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [productId]);

  const closeEditor = useCallback(() => {
    router.push("/products");
  }, [router]);

  const saveProduct = useCallback(
    async (input: ProductInput): Promise<boolean> => {
      setIsSaving(true);
      setActionError(null);

      try {
        const savedProduct = product
          ? await updateProduct(product.id, input)
          : await createProduct(input);

        router.replace(`/products?status=${savedProduct.status}`);
        return true;
      } catch (error) {
        setActionError(
          error instanceof Error
            ? error.message
            : "Unable to save product. Please try again.",
        );
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [product, router],
  );

  const openArchiveConfirmation = useCallback(() => {
    setActionError(null);
    setIsArchiveOpen(true);
  }, []);

  const closeArchiveConfirmation = useCallback(() => {
    if (isSaving) {
      return;
    }

    setIsArchiveOpen(false);
    setActionError(null);
  }, [isSaving]);

  const changeProductStatus = useCallback(
    async (status: ProductStatus): Promise<void> => {
      if (!product) {
        return;
      }

      setIsSaving(true);
      setActionError(null);

      try {
        await updateProduct(product.id, {
          name: product.name,
          sku: product.sku,
          description: product.description,
          imageUrl: product.imageUrl,
          status,
        });

        if (status === "archived") {
          clearProductFormDraft(product.id);
          setIsArchiveOpen(false);
        }

        router.replace("/products?status=" + status);
      } catch (error) {
        setActionError(
          error instanceof Error
            ? error.message
            : "Unable to update product status. Please try again.",
        );
      } finally {
        setIsSaving(false);
      }
    },
    [product, router],
  );

  const archiveProduct = useCallback(async () => {
    await changeProductStatus("archived");
  }, [changeProductStatus]);

  const unarchiveProduct = useCallback(() => {
    void changeProductStatus("draft");
  }, [changeProductStatus]);

  const publishProduct = useCallback(() => {
    void changeProductStatus("published");
  }, [changeProductStatus]);

  return {
    product,
    isLoading,
    loadError,
    isSaving,
    actionError,
    isArchiveOpen,
    closeEditor,
    saveProduct,
    openArchiveConfirmation,
    closeArchiveConfirmation,
    archiveProduct,
    unarchiveProduct,
    publishProduct,
  };
}
