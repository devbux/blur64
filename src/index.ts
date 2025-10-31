import sharp from 'sharp';

export const supportedFormats = ['avif', 'webp', 'jpeg', 'png'] as const;

export interface Blur64Options {
  src: string | Buffer;
  scale?: number;
  size?: number | { width: number; height: number };
  ratio?: number | { width: number; height: number };
  blurRadius?: number | false | sharp.BlurOptions;
  format?: (typeof supportedFormats)[number];
  formatOptions?: sharp.OutputOptions | sharp.AvifOptions | sharp.WebpOptions | sharp.JpegOptions | sharp.PngOptions;
  quality?: number;
  brightness?: number;
  saturation?: number;
  hue?: number;
  lightness?: number;
  fit?: keyof sharp.FitEnum;
  kernel?: keyof sharp.KernelEnum;
  retries?: number;
  retryDelay?: number;
}

export interface Blur64ImageData {
  height: number;
  width: number;
  blurDataURL?: string;
}

export class Blur64Error extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'Blur64Error';
  }
}

async function fetchBuffer(url: string, retries: number, retryDelay: number): Promise<Buffer | null> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const init: RequestInit & { next?: { revalidate: number } } = { signal: controller.signal };
      init.next = { revalidate: 3600 };
      const response = await fetch(url, init);

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const buffer = Buffer.from(await response.arrayBuffer());
      return buffer;
    } catch (e) {
      if (attempt === retries) {
        console.warn('[blur64] Failed to fetch image:', e instanceof Error ? e.message : String(e));
        return null;
      }
      await new Promise(r => setTimeout(r, retryDelay * Math.pow(2, attempt)));
    } finally {
      clearTimeout(timeout);
    }
  }
  return null;
}

export async function blur64Image(
  input: string | Buffer | Blur64Options,
  options?: Omit<Blur64Options, 'src'>
): Promise<Blur64ImageData> {
  const inputOptions: Blur64Options =
    typeof input === 'object' && input !== null && 'src' in input
      ? (input as Blur64Options)
      : typeof options === 'object' && options !== null
      ? { ...(options as Omit<Blur64Options, 'src'>), src: input as string | Buffer }
      : { src: input as string | Buffer };

  const {
    src,
    scale,
    size = !inputOptions.scale && !inputOptions.size ? 24 : inputOptions.size,
    ratio,
    blurRadius = 4,
    quality = 20,
    format = 'avif',
    formatOptions = {},
    brightness = 1,
    saturation = 1.2,
    hue = 0,
    lightness = 0,
    fit = 'inside',
    kernel = 'lanczos3',
    retries = 2,
    retryDelay = 300,
  }: Blur64Options = inputOptions;

  if (!src || (typeof src !== 'string' && !Buffer.isBuffer(src))) throw new Blur64Error('src is required');
  if (typeof scale === 'number' && (scale <= 0 || scale > 1)) throw new Blur64Error('scale must be between 0 and 1');
  if (
    size &&
    ((typeof size === 'number' && size <= 0) || (typeof size === 'object' && (size.width <= 0 || size.height <= 0)))
  )
    throw new Blur64Error('size value(s) must be positive');
  if (
    ratio &&
    ((typeof ratio === 'number' && ratio <= 0) ||
      (typeof ratio === 'object' && (ratio.width <= 0 || ratio.height <= 0)))
  )
    throw new Blur64Error('ratio value(s) must be positive');
  if (
    blurRadius !== undefined &&
    blurRadius !== false &&
    !(typeof blurRadius === 'number' && blurRadius > 0) &&
    typeof blurRadius !== 'object'
  ) {
    throw new Blur64Error('blurRadius must be > 0, false, or a BlurOptions object');
  }
  if (typeof quality !== 'number' || quality < 0 || quality > 100)
    throw new Blur64Error('quality must be between 0 and 100');
  if (typeof format !== 'string' || !supportedFormats.includes(format))
    throw new Blur64Error(`Invalid format option: ${format}`);
  if (formatOptions && typeof formatOptions !== 'object') throw new Blur64Error('formatOptions must be an object');
  if (typeof brightness !== 'number' || brightness < 0) throw new Blur64Error('brightness must be >= 0');
  if (typeof saturation !== 'number' || saturation < 0) throw new Blur64Error('saturation must be >= 0');
  if (typeof hue !== 'number') throw new Blur64Error('hue must be a number');
  if (typeof lightness !== 'number') throw new Blur64Error('lightness must be a number');
  if (typeof fit !== 'string' || !sharp.fit[fit]) throw new Blur64Error(`Invalid fit option: ${fit}`);
  if (typeof kernel !== 'string' || !sharp.kernel[kernel]) throw new Blur64Error(`Invalid kernel option: ${kernel}`);
  if (typeof retries !== 'number' || retries < 0) throw new Blur64Error('retries must be a non-negative integer');
  if (typeof retryDelay !== 'number' || retryDelay < 0)
    throw new Blur64Error('retryDelay must be a non-negative integer');

  let imageBuffer: Buffer | string = src;

  if (typeof src === 'string' && /^https?:\/\//.test(src)) {
    const buffer = await fetchBuffer(src, retries, retryDelay);
    if (!buffer) {
      return { width: 0, height: 0, blurDataURL: undefined };
    }
    imageBuffer = buffer;
  }

  const image = sharp(imageBuffer, {
    failOn: 'error',
    sequentialRead: true,
  });

  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height) throw new Blur64Error('Failed to read image metadata');

  const originalRatio = metadata.width / metadata.height;
  const targetRatio = ratio ? (typeof ratio === 'number' ? ratio : ratio.width / ratio.height) : originalRatio;

  let targetWidth: number, targetHeight: number;

  if (typeof size === 'number') {
    targetHeight = targetWidth = Math.max(4, Math.floor(size));
    if (originalRatio >= 1) {
      targetWidth = Math.max(4, Math.floor(targetHeight * targetRatio));
    } else {
      targetHeight = Math.max(4, Math.floor(targetWidth / targetRatio));
    }
  } else if (typeof size === 'object') {
    targetWidth = Math.max(4, Math.floor(size.width));
    targetHeight = Math.max(4, Math.floor(size.height));
    if (ratio) {
      if (targetWidth / targetHeight >= targetRatio) {
        targetWidth = Math.max(4, Math.floor(targetHeight * targetRatio));
      } else {
        targetHeight = Math.max(4, Math.floor(targetWidth / targetRatio));
      }
    }
  } else if (typeof scale === 'number') {
    targetWidth = Math.floor(metadata.width * scale);
    targetHeight = Math.floor(metadata.height * scale);
    if (originalRatio >= 1) {
      targetHeight = Math.max(4, targetHeight);
      targetWidth = Math.max(4, Math.floor(targetHeight * targetRatio));
    } else {
      targetWidth = Math.max(4, targetWidth);
      targetHeight = Math.max(4, Math.floor(targetWidth / targetRatio));
    }
  } else {
    if (originalRatio >= 1) {
      targetHeight = Math.max(4, Math.floor(metadata.height * 0.1));
      targetWidth = Math.max(4, Math.floor(targetHeight * targetRatio));
    } else {
      targetWidth = Math.max(4, Math.floor(metadata.width * 0.1));
      targetHeight = Math.max(4, Math.floor(targetWidth / targetRatio));
    }
  }

  let blurDataURL: string | undefined = undefined;
  try {
    const pipeline = image.resize(targetWidth, targetHeight, {
      fit,
      withoutEnlargement: true,
      kernel,
      fastShrinkOnLoad: true,
    });

    if (brightness !== 1 || saturation !== 1.2 || hue !== 0 || lightness !== 0) {
      pipeline.modulate({ brightness, saturation, hue, lightness });
    }

    const toFormatOptions: Record<string, unknown> = {
      quality,
      ...(format === 'jpeg' ? { mozjpeg: true } : {}),
      ...(formatOptions || {}),
    };

    let processedPipeline = pipeline.toFormat(format, toFormatOptions);
    if (blurRadius !== false && blurRadius !== undefined) {
      processedPipeline = processedPipeline.blur(blurRadius);
    }

    const processed = await processedPipeline.toBuffer();

    blurDataURL = `data:image/${format};base64,${processed.toString('base64')}`;
  } catch (e) {
    console.error('[blur64] Failed to process image:', e instanceof Error ? e.message : String(e));
    return { width: 0, height: 0, blurDataURL: undefined };
  }

  return {
    width: metadata.width,
    height: metadata.height,
    blurDataURL,
  };
}
