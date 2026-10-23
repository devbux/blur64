import { Blur64Options, Blur64ImageData } from './types';
import { validateBlur64Options } from './validation';
import { fetchBuffer } from './fetch';
import { generateBlurData, normalizeInputOptions, resolveOptions } from './core-internal';

export async function blur64Image(
  input: string | Buffer | Blur64Options,
  options?: Omit<Blur64Options, 'src'>
): Promise<Blur64ImageData> {
  const inputOptions = normalizeInputOptions(input, options);
  const resolved = resolveOptions(inputOptions);

  validateBlur64Options(inputOptions);

  let imageBuffer: Buffer | string = resolved.src;

  if (typeof resolved.src === 'string' && (resolved.src.startsWith('http://') || resolved.src.startsWith('https://'))) {
    const buffer = await fetchBuffer(resolved.src, resolved.retries, resolved.retryDelay, resolved.timeout);
    if (!buffer) {
      return { width: 0, height: 0, blurDataURL: undefined };
    }
    imageBuffer = buffer;
  }

  return generateBlurData(imageBuffer, resolved);
}
