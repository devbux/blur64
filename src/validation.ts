import sharp from 'sharp';
import { Blur64Options, Blur64NextOptions, Blur64Error, supportedFormats } from './types';

export function validateBlur64Options(options: Blur64Options): void {
  const {
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
  } = options;

  if (!src || (typeof src !== 'string' && !Buffer.isBuffer(src))) {
    throw new Blur64Error('src is required');
  }
  if (typeof scale === 'number' && (scale <= 0 || scale > 1)) {
    throw new Blur64Error('scale must be between 0 and 1');
  }
  if (
    size &&
    ((typeof size === 'number' && size <= 0) || (typeof size === 'object' && (size.width <= 0 || size.height <= 0)))
  ) {
    throw new Blur64Error('size value(s) must be positive');
  }
  if (
    ratio &&
    ((typeof ratio === 'number' && ratio <= 0) ||
      (typeof ratio === 'object' && (ratio.width <= 0 || ratio.height <= 0)))
  ) {
    throw new Blur64Error('ratio value(s) must be positive');
  }
  if (
    blurRadius !== undefined &&
    blurRadius !== false &&
    !(typeof blurRadius === 'number' && blurRadius > 0) &&
    typeof blurRadius !== 'object'
  ) {
    throw new Blur64Error('blurRadius must be > 0, false, or a BlurOptions object');
  }
  if (quality !== undefined && (typeof quality !== 'number' || quality < 0 || quality > 100)) {
    throw new Blur64Error('quality must be between 0 and 100');
  }
  if (format !== undefined && (typeof format !== 'string' || !supportedFormats.includes(format))) {
    throw new Blur64Error(`Invalid format option: ${format}`);
  }
  if (formatOptions !== undefined && typeof formatOptions !== 'object') {
    throw new Blur64Error('formatOptions must be an object');
  }
  if (brightness !== undefined && (typeof brightness !== 'number' || brightness < 0)) {
    throw new Blur64Error('brightness must be >= 0');
  }
  if (saturation !== undefined && (typeof saturation !== 'number' || saturation < 0)) {
    throw new Blur64Error('saturation must be >= 0');
  }
  if (hue !== undefined && typeof hue !== 'number') {
    throw new Blur64Error('hue must be a number');
  }
  if (lightness !== undefined && typeof lightness !== 'number') {
    throw new Blur64Error('lightness must be a number');
  }
  if (fit !== undefined && (typeof fit !== 'string' || !sharp.fit[fit])) {
    throw new Blur64Error(`Invalid fit option: ${fit}`);
  }
  if (kernel !== undefined && (typeof kernel !== 'string' || !sharp.kernel[kernel])) {
    throw new Blur64Error(`Invalid kernel option: ${kernel}`);
  }
  if (retries !== undefined && (typeof retries !== 'number' || retries < 0)) {
    throw new Blur64Error('retries must be a non-negative integer');
  }
  if (retryDelay !== undefined && (typeof retryDelay !== 'number' || retryDelay < 0)) {
    throw new Blur64Error('retryDelay must be a non-negative integer');
  }
  if (timeout !== undefined && (typeof timeout !== 'number' || timeout <= 0)) {
    throw new Blur64Error('timeout must be a positive integer');
  }
}

export function validateBlur64NextOptions(options: Blur64NextOptions): void {
  validateBlur64Options(options);

  if (options.revalidate !== undefined && (typeof options.revalidate !== 'number' || options.revalidate < 0)) {
    throw new Blur64Error('revalidate must be a non-negative integer');
  }
}
