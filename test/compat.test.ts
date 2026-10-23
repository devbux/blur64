import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import sharp from 'sharp';

import * as core from '../src/index';
import * as next from '../src/nextjs';

/**
 * Backward-compatibility contract. These tests pin the public surface that
 * applications written against blur64 1.x depend on: export names and kinds,
 * the supported-formats list, both legacy call styles, the Next.js helpers'
 * result shape, and the package metadata (entry points and the sharp peer
 * range). If one of these fails, the change is a breaking change and must
 * not ship as a minor or patch release.
 */

async function samplePng(): Promise<Buffer> {
  return sharp({
    create: { width: 48, height: 32, channels: 3, background: { r: 90, g: 140, b: 200 } },
  })
    .png()
    .toBuffer();
}

describe('public exports', () => {
  it('exposes the documented core API', () => {
    expect(typeof core.blur64Image).toBe('function');
    expect(typeof core.Blur64Error).toBe('function');
    expect(new core.Blur64Error('x')).toBeInstanceOf(Error);
    expect(core.supportedFormats).toEqual(['avif', 'webp', 'jpeg', 'png']);
  });

  it('exposes the documented Next.js helpers', () => {
    expect(typeof next.blur64Action).toBe('function');
    expect(typeof next.blur64NextImageData).toBe('function');
  });
});

describe('legacy call styles', () => {
  it('accepts a Buffer positionally', async () => {
    const png = await samplePng();
    const result = await core.blur64Image(png);
    expect(result.width).toBe(48);
    expect(result.height).toBe(32);
    expect(result.blurDataURL?.startsWith('data:image/avif;base64,')).toBe(true);
  });

  it('accepts positional input plus an options object', async () => {
    const png = await samplePng();
    const result = await core.blur64Image(png, { format: 'webp' });
    expect(result.blurDataURL?.startsWith('data:image/webp;base64,')).toBe(true);
  });

  it('accepts a single options object with src', async () => {
    const png = await samplePng();
    const result = await core.blur64Image({ src: png, format: 'jpeg' });
    expect(result.blurDataURL?.startsWith('data:image/jpeg;base64,')).toBe(true);
  });

  it('Next.js helpers return the documented shapes', async () => {
    const png = await samplePng();
    const data = await next.blur64NextImageData(png);
    expect(data.placeholder).toBe('blur');
    expect(data.width).toBe(48);
    const action = await next.blur64Action(png);
    expect(action.blurDataURL?.startsWith('data:image/avif;base64,')).toBe(true);
    expect('placeholder' in action).toBe(false);
  });
});

describe('package metadata contract', () => {
  const pkg = JSON.parse(readFileSync(join(process.cwd(), 'package.json'), 'utf8'));

  it('keeps both entry points with types/import/require conditions', () => {
    for (const key of ['.', './nextjs']) {
      expect(pkg.exports[key].types).toBeDefined();
      expect(pkg.exports[key].import).toBeDefined();
      expect(pkg.exports[key].require).toBeDefined();
    }
    expect(pkg.main).toBeDefined();
    expect(pkg.module).toBeDefined();
    expect(pkg.types).toBeDefined();
  });

  it('keeps the verified sharp peer range (0.33 / 0.34 / 0.35)', () => {
    expect(pkg.peerDependencies.sharp).toBe('^0.33.5 || ^0.34.2 || ^0.35.0');
  });
});
