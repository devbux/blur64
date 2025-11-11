import sharp from 'sharp';
import { Blur64Options, Blur64ImageData, Blur64Error } from './types';
import { validateBlur64Options } from './validation';
import { fetchBuffer } from './fetch';
import { calculateTargetDimensions, processImage, normalizeInputOptions } from './core-internal';

export async function blur64Image(
  input: string | Buffer | Blur64Options,
  options?: Omit<Blur64Options, 'src'>
): Promise<Blur64ImageData> {
  const inputOptions = normalizeInputOptions(input, options);

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

  validateBlur64Options(inputOptions);

  let imageBuffer: Buffer | string = src;

  if (typeof src === 'string' && (src.startsWith('http://') || src.startsWith('https://'))) {
    const buffer = await fetchBuffer(src, retries, retryDelay, timeout);
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
