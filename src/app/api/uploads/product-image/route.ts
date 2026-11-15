import { getCurrentUser } from "@/server/auth/current-user";
import {
  isSupportedProductImage,
  MAX_PRODUCT_IMAGE_SIZE,
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

    if (
      contentLength &&
      Number(contentLength) > MAX_PRODUCT_IMAGE_SIZE + 64 * 1024
    ) {
      return Response.json(
        { message: "Image must not exceed 5 MB." },
        { status: 413 },
      );
    }

    let formData: FormData;

    try {
      formData = await request.formData();
    } catch {
      return Response.json(
        { message: "Invalid upload request." },
        { status: 400 },
      );
    }

    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json(
        { message: "An image file is required." },
        { status: 400 },
      );
    }

    if (file.size === 0 || file.size > MAX_PRODUCT_IMAGE_SIZE) {
      return Response.json(
        { message: "Image must be between 1 byte and 5 MB." },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (!isSupportedProductImage(file.type, buffer)) {
      return Response.json(
        { message: "Only valid JPEG, PNG, WEBP, and GIF images are allowed." },
        { status: 400 },
      );
    }

    const imageKey = await saveProductImage(user.id, buffer, file.type);

    return Response.json({ imageKey });
  } catch (error) {
    console.error("Product image upload failed:", error);

    return Response.json(
      { message: "Unable to upload product image." },
      { status: 500 },
    );
  }
}
