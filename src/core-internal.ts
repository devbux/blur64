import sharp from 'sharp';
import { Blur64Options, Blur64ImageData, Blur64Error } from './types';

const MIN_DIMENSION = 4;

function clampDimension(value: number): number {
  return Math.max(MIN_DIMENSION, Math.floor(value));
}

export function calculateTargetDimensions(
  metadata: { width: number; height: number },
  size: number | { width: number; height: number } | undefined,
  scale: number | undefined,
  ratio: number | { width: number; height: number } | undefined
): { width: number; height: number } {
  const originalRatio = metadata.width / metadata.height;
  const targetRatio = ratio ? (typeof ratio === 'number' ? ratio : ratio.width / ratio.height) : originalRatio;
  const isLandscape = originalRatio >= 1;

  let targetWidth: number;
  let targetHeight: number;

  if (typeof size === 'number') {
    const baseSize = clampDimension(size);
    if (isLandscape) {
      targetHeight = baseSize;
      targetWidth = clampDimension(targetHeight * targetRatio);
    } else {
      targetWidth = baseSize;
      targetHeight = clampDimension(targetWidth / targetRatio);
    }
  } else if (typeof size === 'object') {
    targetWidth = clampDimension(size.width);
    targetHeight = clampDimension(size.height);
    if (ratio) {
      const currentRatio = targetWidth / targetHeight;
      if (currentRatio >= targetRatio) {
        targetWidth = clampDimension(targetHeight * targetRatio);
      } else {
        targetHeight = clampDimension(targetWidth / targetRatio);
      }
    }
  } else if (typeof scale === 'number') {
    targetWidth = metadata.width * scale;
    targetHeight = metadata.height * scale;
    if (isLandscape) {
      targetHeight = clampDimension(targetHeight);
      targetWidth = clampDimension(targetHeight * targetRatio);
    } else {
      targetWidth = clampDimension(targetWidth);
      targetHeight = clampDimension(targetWidth / targetRatio);
    }
  } else {
    if (isLandscape) {
      targetHeight = clampDimension(metadata.height * 0.1);
      targetWidth = clampDimension(targetHeight * targetRatio);
    } else {
      targetWidth = clampDimension(metadata.width * 0.1);
      targetHeight = clampDimension(targetWidth / targetRatio);
    }
  }

  return { width: targetWidth, height: targetHeight };
}

export async function processImage(
  image: sharp.Sharp,
  targetWidth: number,
  targetHeight: number,
  options: {
    fit: keyof sharp.FitEnum;
    kernel: keyof sharp.KernelEnum;
    brightness: number;
    saturation: number;
    hue: number;
    lightness: number;
    format: typeof import('./types').supportedFormats[number];
    quality: number;
    formatOptions: sharp.OutputOptions | sharp.AvifOptions | sharp.WebpOptions | sharp.JpegOptions | sharp.PngOptions;
    blurRadius: number | false | sharp.BlurOptions | undefined;
  }
): Promise<string | undefined> {
  try {
    let pipeline = image.resize(targetWidth, targetHeight, {
      fit: options.fit,
      withoutEnlargement: true,
      kernel: options.kernel,
      fastShrinkOnLoad: true,
    });

    const needsModulation =
      options.brightness !== 1 || options.saturation !== 1.2 || options.hue !== 0 || options.lightness !== 0;

    if (needsModulation) {
      pipeline = pipeline.modulate({
        brightness: options.brightness,
        saturation: options.saturation,
        hue: options.hue,
        lightness: options.lightness,
      });
    }

    const toFormatOptions: Record<string, unknown> = {
      quality: options.quality,
      ...(options.format === 'jpeg' ? { mozjpeg: true } : {}),
      ...(options.formatOptions || {}),
    };

    pipeline = pipeline.toFormat(options.format, toFormatOptions);

    if (options.blurRadius !== false && options.blurRadius !== undefined) {
      pipeline = pipeline.blur(options.blurRadius);
    }

    const processed = await pipeline.toBuffer();
    return `data:image/${options.format};base64,${processed.toString('base64')}`;
  } catch (e) {
    console.error('[blur64] Failed to process image:', e instanceof Error ? e.message : String(e));
    return undefined;
  }
}

export function normalizeInputOptions<T extends Blur64Options>(
  input: string | Buffer | T,
  options?: Omit<T, 'src'>
): T {
  if (typeof input === 'object' && input !== null && 'src' in input) {
    return input as T;
  }
  if (typeof options === 'object' && options !== null) {
    return { ...options, src: input as string | Buffer } as T;
  }
  return { src: input as string | Buffer } as T;
}

/** Options with every default applied — the values that define blur64's output. */
export interface ResolvedBlur64Options {
  src: string | Buffer;
  scale?: number;
  size?: number | { width: number; height: number };
  ratio?: number | { width: number; height: number };
  blurRadius: number | false | sharp.BlurOptions;
  quality: number;
  format: typeof import('./types').supportedFormats[number];
  formatOptions:
    | sharp.OutputOptions
    | sharp.AvifOptions
    | sharp.WebpOptions
    | sharp.JpegOptions
    | sharp.PngOptions;
  brightness: number;
  saturation: number;
  hue: number;
  lightness: number;
  fit: keyof sharp.FitEnum;
  kernel: keyof sharp.KernelEnum;
  retries: number;
  retryDelay: number;
  timeout: number;
}

/**
 * Apply the documented defaults. The exact values — and quirks, such as
 * `size` defaulting to 24 only when neither `scale` nor `size` is given —
 * are part of the package's behaviour and must not drift.
 */
export function resolveOptions(inputOptions: Blur64Options): ResolvedBlur64Options {
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
    timeout = 30000,
  } = inputOptions;

  return {
    src,
    scale,
    size,
    ratio,
    blurRadius,
    quality,
    format,
    formatOptions,
    brightness,
    saturation,
    hue,
    lightness,
    fit,
    kernel,
    retries,
    retryDelay,
    timeout,
  };
}

/** Shared tail of the core and Next.js pipelines: metadata, resize, process. */
export async function generateBlurData(
  imageBuffer: Buffer | string,
  resolved: ResolvedBlur64Options
): Promise<Blur64ImageData> {
  const image = sharp(imageBuffer, {
    failOn: 'error',
    sequentialRead: true,
  });

  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height) {
    throw new Blur64Error('Failed to read image metadata');
  }

  const { width: targetWidth, height: targetHeight } = calculateTargetDimensions(
    { width: metadata.width, height: metadata.height },
    resolved.size,
    resolved.scale,
    resolved.ratio
  );

  const blurDataURL = await processImage(image, targetWidth, targetHeight, {
    fit: resolved.fit,
    kernel: resolved.kernel,
    brightness: resolved.brightness,
    saturation: resolved.saturation,
    hue: resolved.hue,
    lightness: resolved.lightness,
    format: resolved.format,
    quality: resolved.quality,
    formatOptions: resolved.formatOptions,
    blurRadius: resolved.blurRadius,
  });

  return {
    width: metadata.width,
    height: metadata.height,
    blurDataURL,
  };
}
