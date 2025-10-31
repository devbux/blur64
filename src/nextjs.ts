'use server';

import { blur64Image, type Blur64ImageData, type Blur64Options } from '.';

/** Server Action for generating blur image data. Use this in Server Components or Route Handlers. */
export async function blur64Action(
  input: string | Buffer | Blur64Options,
  options?: Omit<Blur64Options, 'src'>
): Promise<Blur64ImageData> {
  'use server';

  try {
    return await blur64Image(input, options);
  } catch (error) {
    console.error('[blur64] Action error:', error instanceof Error ? error.message : String(error));
    return { width: 0, height: 0, blurDataURL: undefined };
  }
}

/**
 * Server Action optimized for Next.js Image component. Returns data in the format expected by the Next.js Image
 * component.
 */
export async function blur64NextImageData(
  input: string | Buffer | Blur64Options,
  options?: Omit<Blur64Options, 'src'>
): Promise<Blur64ImageData & { placeholder?: 'blur' | 'empty' }> {
  'use server';

  try {
    const result = await blur64Image(input, options);
    return { ...result, placeholder: result.blurDataURL ? 'blur' : 'empty' };
  } catch (error) {
    console.error('[blur64] Next Image error:', error instanceof Error ? error.message : String(error));
    return { width: 0, height: 0, blurDataURL: undefined, placeholder: 'empty' };
  }
}
