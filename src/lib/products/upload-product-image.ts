interface ProductImageUploadResponse {
  imageKey?: unknown;
  message?: unknown;
}

export async function uploadProductImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);

  let response: Response;

  try {
    response = await fetch("/api/uploads/product-image", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      body: formData,
    });
  } catch {
    throw new Error("Unable to connect to the server.");
  }

  const data = (await response
    .json()
    .catch(() => null)) as ProductImageUploadResponse | null;

  if (!response.ok) {
    throw new Error(
      typeof data?.message === "string"
        ? data.message
        : `Product image upload failed. Server returned status ${response.status}.`,
    );
  }

  if (typeof data?.imageKey !== "string" || !data.imageKey) {
    throw new Error("Invalid product image upload response.");
  }

  return data.imageKey;
}
