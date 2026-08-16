export type SupportedImageMediaType = "image/jpeg" | "image/png" | "image/gif" | "image/webp";

const ALLOWED_MIME_TYPES: ReadonlySet<string> = new Set<SupportedImageMediaType>([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]);

export interface PreparedImage {
  base64: string;
  mediaType: SupportedImageMediaType;
}

function isHeic(file: File): boolean {
  const type = file.type.toLowerCase();
  if (type === "image/heic" || type === "image/heif") return true;
  return /\.(heic|heif)$/i.test(file.name);
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the "data:<mime>;base64," prefix — Claude wants raw base64.
      resolve(result.slice(result.indexOf(",") + 1));
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

/**
 * Normalizes an uploaded image for the Claude Vision API in-browser: converts
 * HEIC/HEIF (common on iPhone gallery photos) to JPEG via a WASM decoder, and
 * passes through already-supported formats. Nothing leaves the device except
 * the final base64 sent directly to Anthropic.
 */
export async function prepareImageForClaude(file: File): Promise<PreparedImage> {
  if (isHeic(file)) {
    const heic2any = (await import("heic2any")).default;
    const converted = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
    const blob = Array.isArray(converted) ? converted[0] : converted;
    return { base64: await blobToBase64(blob), mediaType: "image/jpeg" };
  }

  const normalized = file.type.toLowerCase();
  if (ALLOWED_MIME_TYPES.has(normalized)) {
    return { base64: await blobToBase64(file), mediaType: normalized as SupportedImageMediaType };
  }

  throw new Error(`지원하지 않는 이미지 형식입니다: ${file.type || file.name}`);
}
