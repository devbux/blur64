import sharp from 'sharp';
import { Blur64NextOptions, Blur64ImageData, Blur64Error } from './types';
import { validateBlur64NextOptions } from './validation';
import { fetchBufferNext } from './fetch';
import { calculateTargetDimensions, processImage } from './core-internal';

function normalizeNextInputOptions(
  input: string | Buffer | Blur64NextOptions,
  options?: Omit<Blur64NextOptions, 'src'>
): Blur64NextOptions {
  if (typeof input === 'object' && input !== null && 'src' in input) {
    return input as Blur64NextOptions;
  }
  if (typeof options === 'object' && options !== null) {
    return { ...options, src: input as string | Buffer };
  }
  return { src: input as string | Buffer };
}

export async function blur64ImageNext(
  input: string | Buffer | Blur64NextOptions,
  options?: Omit<Blur64NextOptions, 'src'>
): Promise<Blur64ImageData> {
  const inputOptions = normalizeNextInputOptions(input, options);

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
    revalidate = 3600 * 24,
  } = inputOptions;

  validateBlur64NextOptions(inputOptions);

  let imageBuffer: Buffer | string = src;

  if (typeof src === 'string' && (src.startsWith('http://') || src.startsWith('https://'))) {
    const buffer = await fetchBufferNext(src, retries, retryDelay, timeout, revalidate);
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
  if (!metadata.width || !metadata.height) {
    throw new Blur64Error('Failed to read image metadata');
  }

  const { width: targetWidth, height: targetHeight } = calculateTargetDimensions(
    { width: metadata.width, height: metadata.height },
    size,
    scale,
    ratio
  );

  const blurDataURL = await processImage(image, targetWidth, targetHeight, {
    fit,
    kernel,
    brightness,
    saturation,
    hue,
    lightness,
    format,
    quality,
    formatOptions,
    blurRadius,
  });

  return {
    width: metadata.width,
    height: metadata.height,
    blurDataURL,
  };
}
