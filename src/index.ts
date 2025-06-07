import sharp, { type Sharp } from "sharp";

export interface Blur64Options {
  src: string | Buffer;
  size?: { width: number; height: number };
  scale?: number; // 0 < scale <= 1
  blurRadius?: number;
  format?: "avif" | "jpeg" | "png" | "webp";
  quality?: number; // 0-100, only applies to JPEG, AVIF, and WebP
  brightness?: number;
  saturation?: number;
  hue?: number;
  lightness?: number;
  fit?: Parameters<Sharp["resize"]>[0]["fit"];
  kernel?: Parameters<Sharp["resize"]>[0]["kernel"];
  retries?: number; // Only applies to URL fetch
}

export interface Blur64Output {
  base64: string | null;
  metadata: {
    width: number;
    height: number;
    format: string;
  } | null;
}

export class Blur64Error extends Error {
  constructor(message: string) {
    super(message);
    this.name = "Blur64Error";
  }
}

async function fetchBuffer(
  url: string,
  retries: number
): Promise<Blur64Options["src"]> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return Buffer.from(await response.arrayBuffer());
    } catch (e) {
      if (attempt === retries) {
        console.warn("[blur64] Failed to fetch image from URL:", e);
        return "";
      }
      await new Promise((r) => setTimeout(r, 300 * (attempt + 1)));
    }
  }
  return "";
}

export async function blur64Image(
  input: string | Buffer | Blur64Options,
  options?: Omit<Blur64Options, "src">
): Promise<Blur64Output> {
  const {
    src,
    size,
    scale = 0.1,
    blurRadius = 10,
    quality = 50,
    format = "avif",
    brightness = 1,
    saturation = 1.2,
    hue = 0,
    lightness = 0,
    fit = "fill",
    kernel = "lanczos2",
    retries = 2,
  }: Blur64Options = input instanceof Object && "src" in input
    ? input
    : options instanceof Object
    ? { ...options, src: input }
    : { src: input };

  if (!src || (typeof src !== "string" && !Buffer.isBuffer(src))) {
    throw new Blur64Error("src is required");
  }

  if (size && (size.width <= 0 || size.height <= 0)) {
    throw new Blur64Error("size must be positive");
  }

  if (typeof scale !== "number" || scale <= 0 || scale > 1) {
    throw new Blur64Error("scale must be between 0 and 1");
  }

  if (typeof blurRadius !== "number" || blurRadius < 0) {
    throw new Blur64Error("blurRadius must be >= 0");
  }

  let imageBuffer: Blur64Options["src"] = src;

  if (typeof src === "string" && /^https?:\/\//.test(src)) {
    imageBuffer = await fetchBuffer(src, retries);
    if (!imageBuffer) return { base64: null, metadata: null };
  }

  const image = sharp(imageBuffer, { failOn: "error" });

  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height) {
    console.warn("[blur64] Failed to read image metadata");
    return { base64: null, metadata: null };
  }

  const targetWidth =
    size?.width ?? Math.max(4, Math.floor(metadata.width * scale));
  const targetHeight =
    size?.height ?? Math.max(4, Math.floor(metadata.height * scale));

  let base64: string | null = null;
  try {
    const processed = await image
      .clone()
      .resize(targetWidth, targetHeight, {
        fit,
        withoutEnlargement: true,
        kernel,
      })
      .modulate({ brightness, saturation, hue, lightness })
      .toFormat(format, { quality })
      .blur(blurRadius)
      .toBuffer();
    base64 = `data:image/${format};base64,${processed.toString("base64")}`;
  } catch (e) {
    console.warn("[blur64] Failed to process image:", e);
    return { base64: null, metadata: null };
  }

  return {
    base64,
    metadata: {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format || format,
    },
  };
}
