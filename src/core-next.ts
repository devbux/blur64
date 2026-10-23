import { Blur64NextOptions, Blur64ImageData } from './types';
import { validateBlur64NextOptions } from './validation';
import { fetchBufferNext } from './fetch';
import { generateBlurData, normalizeInputOptions, resolveOptions } from './core-internal';

export async function blur64ImageNext(
  input: string | Buffer | Blur64NextOptions,
  options?: Omit<Blur64NextOptions, 'src'>
): Promise<Blur64ImageData> {
  const inputOptions = normalizeInputOptions<Blur64NextOptions>(input, options);
  const resolved = resolveOptions(inputOptions);
  const { revalidate = 3600 * 24 } = inputOptions;

  validateBlur64NextOptions(inputOptions);

  let imageBuffer: Buffer | string = resolved.src;

  if (typeof resolved.src === 'string' && (resolved.src.startsWith('http://') || resolved.src.startsWith('https://'))) {
    const buffer = await fetchBufferNext(
      resolved.src,
      resolved.retries,
      resolved.retryDelay,
      resolved.timeout,
      revalidate
    );
    if (!buffer) {
      return { width: 0, height: 0, blurDataURL: undefined };
    }
    imageBuffer = buffer;
  }

  return generateBlurData(imageBuffer, resolved);
}
