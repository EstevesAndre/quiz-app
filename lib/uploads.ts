import os from "node:os";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

function resolveUploadsDir() {
  return process.env.UPLOADS_DIR || path.join(os.tmpdir(), "quiz-app-uploads");
}

function resolveReadableUploadsDirs() {
  if (process.env.UPLOADS_DIR) {
    return [process.env.UPLOADS_DIR];
  }

  return [
    path.join(os.tmpdir(), "quiz-app-uploads"),
    path.join(process.cwd(), "uploads"),
  ];
}

function resolvePublicUploadsPrefix() {
  return process.env.PUBLIC_UPLOADS_PREFIX || "/api/uploads";
}

function extensionFromMimeType(mimeType: string) {
  if (mimeType === "image/jpeg") {
    return "jpg";
  }

  if (mimeType === "image/png") {
    return "png";
  }

  if (mimeType === "image/webp") {
    return "webp";
  }

  return null;
}

function sanitizePathSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9-_]/g, "");
}

export type StoredUpload = {
  absolutePath: string;
  publicUrl: string;
};

export async function saveUploadedImage(file: File): Promise<StoredUpload> {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    throw new Error("Formato inválido. Use JPG, PNG ou WEBP.");
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    throw new Error("Imagem acima de 5MB.");
  }

  const extension = extensionFromMimeType(file.type);
  if (!extension) {
    throw new Error("Tipo de imagem não suportado.");
  }

  const uploadsDir = resolveUploadsDir();
  await mkdir(uploadsDir, { recursive: true });

  const filename = `${randomUUID()}.${extension}`;
  const absolutePath = path.join(uploadsDir, filename);
  const fileBuffer = Buffer.from(await file.arrayBuffer());

  await writeFile(absolutePath, fileBuffer);

  return {
    absolutePath,
    publicUrl: `${resolvePublicUploadsPrefix()}/${filename}`,
  };
}

export async function readUploadedImage(fileName: string) {
  const sanitizedFileName = sanitizePathSegment(fileName.replace(/\.[^/.]+$/, ""));
  const extension = path.extname(fileName).slice(1).toLowerCase();
  if (!sanitizedFileName) {
    throw new Error("Nome de ficheiro inválido.");
  }

  if (!["jpg", "jpeg", "png", "webp"].includes(extension)) {
    throw new Error("Extensão inválida.");
  }

  const normalizedFileName = `${sanitizedFileName}.${extension}`;
  for (const uploadsDir of resolveReadableUploadsDirs()) {
    const absolutePath = path.join(uploadsDir, normalizedFileName);

    try {
      const fileBuffer = await readFile(absolutePath);

      return {
        fileBuffer,
        extension,
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
    }
  }

  throw new Error("Imagem não encontrada.");
}

export function getMimeTypeFromExtension(extension: string) {
  if (extension === "jpg" || extension === "jpeg") {
    return "image/jpeg";
  }
  if (extension === "png") {
    return "image/png";
  }
  if (extension === "webp") {
    return "image/webp";
  }

  return "application/octet-stream";
}
