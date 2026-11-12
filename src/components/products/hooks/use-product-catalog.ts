"use client";

import { useEffect, useState } from "react";
import {
  fetchProducts,
  updateProduct,
  type ProductPage,
  type ProductStatus,
} from "@/lib/products";

const PAGE_SIZE = 10;

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
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setSearch(searchInput.trim());
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;

    const timeout = window.setTimeout(async () => {
      setIsLoading(true);
      setFetchError(null);

      try {
        const result = await fetchProducts({
          page: 1,
          limit: PAGE_SIZE,
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
    fetchError,
    actionError,
    unarchivingProductId,
    changeStatus,
    unarchiveProduct,
    clearSearch,
    retry,
  };
}
