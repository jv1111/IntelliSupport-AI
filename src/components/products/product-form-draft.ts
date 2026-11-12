export function getProductFormDraftStorageKey(productId?: string | null) {
  return `product-form-draft:${productId ?? "new"}`;
}

export function clearProductFormDraft(productId?: string | null): boolean {
  try {
    window.sessionStorage.removeItem(getProductFormDraftStorageKey(productId));
    return true;
  } catch {
    return false;
  }
}
