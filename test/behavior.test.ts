import { afterEach, describe, expect, it, vi } from 'vitest';

import { blur64Image, Blur64Error } from '../src/index';
import { blur64Action, blur64NextImageData } from '../src/nextjs';

describe('validation', () => {
  it('throws Blur64Error when src is missing', async () => {
    await expect(blur64Image({} as never)).rejects.toThrow(Blur64Error);
    await expect(blur64Image({} as never)).rejects.toThrow('src is required');
  });

  it('rejects an invalid format with the documented message', async () => {
    await expect(
      blur64Image({ src: Buffer.from('x'), format: 'gif' as never })
    ).rejects.toThrow('Invalid format option: gif');
  });

  it('rejects an out-of-range scale', async () => {
    await expect(blur64Image({ src: Buffer.from('x'), scale: 2 })).rejects.toThrow(
      'scale must be between 0 and 1'
    );
  });

  it('rejects a non-positive size and an out-of-range quality', async () => {
    await expect(blur64Image({ src: Buffer.from('x'), size: -1 })).rejects.toThrow(
      'size value(s) must be positive'
    );
    await expect(blur64Image({ src: Buffer.from('x'), quality: 101 })).rejects.toThrow(
      'quality must be between 0 and 100'
    );
  });
});

describe('URL fetching', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns empty data when the fetch ultimately fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down');
      })
    );
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const result = await blur64Image({ src: 'https://example.invalid/x.png', retries: 0 });
    expect(result).toEqual({ width: 0, height: 0, blurDataURL: undefined });
    warn.mockRestore();
  });

  it('processes a fetched image exactly like a Buffer input', async () => {
    const { default: sharp } = await import('sharp');
    const png = await sharp({
      create: { width: 60, height: 40, channels: 3, background: { r: 200, g: 80, b: 40 } },
    })
      .png()
      .toBuffer();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () =>
          new Response(png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength) as ArrayBuffer, {
            status: 200,
          })
      )
    );
    const viaUrl = await blur64Image('https://example.test/pic.png');
    const viaBuffer = await blur64Image(png);
    expect(viaUrl.width).toBe(60);
    expect(viaUrl.blurDataURL).toBe(viaBuffer.blurDataURL);
  });
});

describe('Next.js helpers', () => {
  it('blur64Action swallows errors into empty data', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await blur64Action(123 as never);
    expect(result).toEqual({ width: 0, height: 0, blurDataURL: undefined });
    error.mockRestore();
  });

  it('blur64NextImageData reports placeholder "empty" on failure', async () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    const result = await blur64NextImageData(123 as never);
    expect(result.placeholder).toBe('empty');
    expect(result.blurDataURL).toBeUndefined();
    error.mockRestore();
  });
});
