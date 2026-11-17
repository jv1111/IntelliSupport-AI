import { getCurrentUser } from "@/server/auth/current-user";
import {
  isSupportedProductImageType,
  MAX_PRODUCT_IMAGE_SIZE,
  ProductImageStorageError,
  saveProductImage,
} from "@/server/storage/google-cloud-storage";


export async function POST(request: Request): Promise<Response> {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return Response.json(
        { message: "Authentication required." },
        { status: 401 },
      );
    }

    const origin = request.headers.get("origin");

    if (origin && origin !== new URL(request.url).origin) {
      return Response.json(
        { message: "Invalid request origin." },
        { status: 403 },
      );
    }

    const contentLength = request.headers.get("content-length");

    if (contentLength && Number(contentLength) > MAX_PRODUCT_IMAGE_SIZE) {
      return Response.json(
        { message: "Image must not exceed 5 MB." },
        { status: 413 },
      );
    }

    const contentType =
      request.headers.get("content-type")?.split(";", 1)[0].trim() ?? "";

    if (!isSupportedProductImageType(contentType)) {
      return Response.json(
        { message: "Only JPEG, PNG, WEBP, and GIF images are allowed." },
        { status: 400 },
      );
    }

    if (!request.body) {
      return Response.json(
        { message: "An image file is required." },
        { status: 400 },
      );
    }

    const imageKey = await saveProductImage(user.id, request.body, contentType);

    return Response.json({ imageKey });
  } catch (error) {
    if (error instanceof ProductImageStorageError) {
      return Response.json(
        { message: error.message },
        { status: error.code === "FILE_TOO_LARGE" ? 413 : 400 },
      );
    }

    console.error("Product image upload failed:", error);

    return Response.json(
      { message: "Unable to upload product image." },
      { status: 500 },
    );
  }
}
