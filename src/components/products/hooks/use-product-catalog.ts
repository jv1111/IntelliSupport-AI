"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import {
  deleteProduct as deleteProductRequest,
  fetchProducts,
  updateProduct,
} from "@/lib/products";
import type { Product, ProductPage, ProductStatus } from "@/lib/products/types";

const emptyPage: ProductPage = {
  items: [],
  totalCount: 0,
  totalPages: 0,
  currentPage: 1,
  hasNextPage: false,
  hasPreviousPage: false,
};

export function useProductCatalog(initialStatus: ProductStatus) {
  const [status, setStatus] = useState<ProductStatus>(initialStatus);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [productPage, setProductPage] = useState<ProductPage>(emptyPage);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [unarchivingProductId, setUnarchivingProductId] = useState<
    string | null
  >(null);
  const [productPendingDeletion, setProductPendingDeletion] =
    useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(
    null,
  );
  const [refreshKey, setRefreshKey] = useState(0);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const isLoadingMoreRef = useRef(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput.trim());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    requestIdRef.current += 1;
    isLoadingMoreRef.current = false;

    let cancelled = false;

    const timeout = window.setTimeout(async () => {
      setIsLoadingMore(false);
      setIsLoading(true);
      setFetchError(null);

      try {
        const result = await fetchProducts({
          page: 1,
          limit: DEFAULT_PAGE_SIZE,
          search: search || null,
          status,
        });

        if (!cancelled) {
          setProductPage(result);
        }
      } catch (error) {
        if (!cancelled) {
          setFetchError(
            error instanceof Error
              ? error.message
              : "Unable to load products. Please try again.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }, 150);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [search, status, refreshKey]);

  const loadMore = useCallback(async () => {
    if (
      isLoadingMoreRef.current ||
      isLoading ||
      !productPage.hasNextPage ||
      fetchError
    ) {
      return;
    }

    const requestId = requestIdRef.current;

    isLoadingMoreRef.current = true;
    setIsLoadingMore(true);

    try {
      const result = await fetchProducts({
        page: productPage.currentPage + 1,
        limit: DEFAULT_PAGE_SIZE,
        search: search || null,
        status,
      });

      if (requestId === requestIdRef.current) {
        setProductPage((currentPage) => ({
          ...result,
          items: [...currentPage.items, ...result.items],
        }));
      }
    } catch (error) {
      if (requestId === requestIdRef.current) {
        setFetchError(
          error instanceof Error
            ? error.message
            : "Unable to load more products. Please try again.",
        );
      }
    } finally {
      if (requestId === requestIdRef.current) {
        isLoadingMoreRef.current = false;
        setIsLoadingMore(false);
      }
    }
  }, [
    fetchError,
    isLoading,
    productPage.currentPage,
    productPage.hasNextPage,
    search,
    status,
  ]);

  function changeStatus(nextStatus: ProductStatus) {
    setActionError(null);
    setStatus(nextStatus);
  }

  async function unarchiveProduct(productId: string) {
    if (unarchivingProductId) {
      return;
    }

    setUnarchivingProductId(productId);
    setActionError(null);

    try {
      await updateProduct(productId, { status: "draft" });
      setRefreshKey((current) => current + 1);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to unarchive product. Please try again.",
      );
    } finally {
      setUnarchivingProductId(null);
    }
  }

  function openDeleteConfirmation(product: Product) {
    if (product.status !== "archived") {
      return;
    }

    setActionError(null);
    setProductPendingDeletion(product);
  }

  function closeDeleteConfirmation() {
    if (deletingProductId) {
      return;
    }

    setProductPendingDeletion(null);
    setActionError(null);
  }

  async function confirmDeleteProduct() {
    if (
      !productPendingDeletion ||
      productPendingDeletion.status !== "archived" ||
      deletingProductId
    ) {
      return;
    }

    setDeletingProductId(productPendingDeletion.id);
    setActionError(null);

    try {
      await deleteProductRequest(productPendingDeletion.id);
      setProductPendingDeletion(null);
      setRefreshKey((current) => current + 1);
    } catch (error) {
      setActionError(
        error instanceof Error
          ? error.message
          : "Unable to delete product. Please try again.",
      );
    } finally {
      setDeletingProductId(null);
    }
  }

  function clearSearch() {
    setSearchInput("");
    setSearch("");
  }

  function retry() {
    setRefreshKey((current) => current + 1);
  }

  return {
    status,
    searchInput,
    setSearchInput,
    productPage,
    isLoading,
    isLoadingMore,
    loadMore,
    fetchError,
    actionError,
    unarchivingProductId,
    productPendingDeletion,
    deletingProductId,
    changeStatus,
    unarchiveProduct,
    openDeleteConfirmation,
    closeDeleteConfirmation,
    confirmDeleteProduct,
    clearSearch,
    retry,
  };
}
