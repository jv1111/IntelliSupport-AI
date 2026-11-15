import "server-only";

import { randomUUID } from "node:crypto";
import { Storage } from "@google-cloud/storage";

export const MAX_PRODUCT_IMAGE_SIZE = 5 * 1024 * 1024;

const productImageTypes = {
  "image/jpeg": {
    extension: "jpg",
    matches: (buffer: Buffer) =>
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff,
  },
  "image/png": {
    extension: "png",
    matches: (buffer: Buffer) =>
      buffer.length >= 8 &&
      buffer.subarray(0, 8).equals(
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      ),
  },
  "image/webp": {
    extension: "webp",
    matches: (buffer: Buffer) =>
      buffer.length >= 12 &&
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP",
  },
  "image/gif": {
    extension: "gif",
    matches: (buffer: Buffer) =>
      buffer.length >= 6 &&
      ["GIF87a", "GIF89a"].includes(buffer.toString("ascii", 0, 6)),
  },
} as const;

export type ProductImageContentType = keyof typeof productImageTypes;

export class ProductImageStorageError extends Error {
  constructor(
    public readonly code: "INVALID_INPUT" | "INVALID_IMAGE",
    message: string,
  ) {
    super(message);
    this.name = "ProductImageStorageError";
  }
}

const storage = new Storage();

function getBucket() {
  const bucketName = process.env.GCS_BUCKET_NAME;

  if (!bucketName) {
    throw new Error("GCS_BUCKET_NAME is not configured.");
  }

  return storage.bucket(bucketName);
}

export function isSupportedProductImage(
  contentType: string,
  buffer: Buffer,
): contentType is ProductImageContentType {
  const imageType =
    productImageTypes[contentType as ProductImageContentType];

  return Boolean(imageType && imageType.matches(buffer));
}

export async function createProductImageUploadPolicy(
  userId: string,
  contentType: string,
  size: number,
) {
  if (!Object.hasOwn(productImageTypes, contentType)) {
    throw new ProductImageStorageError(
      "INVALID_INPUT",
      "Unsupported product image format.",
    );
  }

  if (
    !Number.isSafeInteger(size) ||
    size < 1 ||
    size > MAX_PRODUCT_IMAGE_SIZE
  ) {
    throw new ProductImageStorageError(
      "INVALID_INPUT",
      "Image must not exceed 5 MB.",
    );
  }

  const extension =
    productImageTypes[contentType as ProductImageContentType].extension;

  const imageKey = `products/${userId}/${randomUUID()}.${extension}`;

  const [policy] = await getBucket()
    .file(imageKey)
    .generateSignedPostPolicyV4({
      expires: Date.now() + 5 * 60 * 1000,
      fields: {
        "Content-Type": contentType,
      },
      conditions: [
        ["content-length-range", size, size],
      ],
    });

  return {
    imageKey,
    uploadUrl: policy.url,
    fields: policy.fields,
  };
}

export async function verifyProductImage(
  userId: string,
  imageKey: string,
): Promise<void> {
  const prefix = `products/${userId}/`;
  const filename = imageKey.startsWith(prefix)
    ? imageKey.slice(prefix.length)
    : "";

  const validFilename =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(?:jpg|png|webp|gif)$/i;

  if (!validFilename.test(filename)) {
    throw new ProductImageStorageError(
      "INVALID_INPUT",
      "Invalid product image reference.",
    );
  }

  const file = getBucket().file(imageKey);
  const [exists] = await file.exists();

  if (!exists) {
    throw new ProductImageStorageError(
      "INVALID_IMAGE",
      "Uploaded product image was not found.",
    );
  }

  const [metadata] = await file.getMetadata();
  const size = Number(metadata.size);
  const contentType = String(metadata.contentType ?? "");

  if (
    !Number.isSafeInteger(size) ||
    size < 1 ||
    size > MAX_PRODUCT_IMAGE_SIZE ||
    !Object.hasOwn(productImageTypes, contentType)
  ) {
    throw new ProductImageStorageError(
      "INVALID_IMAGE",
      "Uploaded product image is invalid.",
    );
  }

  const [buffer] = await file.download();

  if (
    buffer.length !== size ||
    !isSupportedProductImage(contentType, buffer)
  ) {
    throw new ProductImageStorageError(
      "INVALID_IMAGE",
      "Uploaded file does not contain a valid image.",
    );
  }
}

export async function saveProductImage(
  userId: string,
  buffer: Buffer,
  contentType: ProductImageContentType,
): Promise<string> {
  const extension = productImageTypes[contentType].extension;
  const objectName = `products/${userId}/${randomUUID()}.${extension}`;

  await getBucket().file(objectName).save(buffer, {
    resumable: false,
    metadata: {
      contentType,
      contentDisposition: "inline",
      cacheControl: "private, max-age=300",
    },
  });

  return objectName;
}

export async function createProductImageReadUrl(
  objectName: string,
): Promise<string> {
  const [url] = await getBucket().file(objectName).getSignedUrl({
    version: "v4",
    action: "read",
    expires: Date.now() + 60 * 60 * 1000,
  });

  return url;
}
