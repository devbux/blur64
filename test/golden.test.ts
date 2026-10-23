import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import sharp from 'sharp';

import { blur64Image } from '../src/index';
import { blur64NextImageData } from '../src/nextjs';

/**
 * Golden-output tests. The hashes below are the reference outputs captured
 * on sharp 0.35.5 for v1.4.0: the defaults and the processing pipeline
 * define blur64's output, so any drift in a default value, the dimension
 * maths, or the pipeline order fails these tests byte-for-byte.
 *
 * Compatibility note: the encoder bytes come from sharp's bundled libvips,
 * so they legitimately differ between sharp versions. What blur64
 * guarantees is stability per sharp version — the same library code run
 * on sharp 0.34.5 reproduces the original v1.3.0 outputs exactly
 * (verified for v1.4.0), so existing apps see no change unless they
 * themselves upgrade sharp.
 */

function fixture(w: number, h: number): Promise<Buffer> {
  const data = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      let r = Math.round((x / w) * 255),
        g = Math.round((y / h) * 255),
        b = 128;
      if (((x >> 4) + (y >> 4)) % 2 === 0) {
        r = 255 - r;
        b = 200;
      }
      const dx = x - w * 0.7,
        dy = y - h * 0.35;
      if (dx * dx + dy * dy < (w * 0.16) ** 2) {
        r = 30;
        g = 200;
        b = 90;
      }
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
  return sharp(data, { raw: { width: w, height: h, channels: 3 } })
    .png()
    .toBuffer();
}

interface Golden {
  width: number;
  height: number;
  placeholder: string | null;
  urlLength: number | null;
  urlHash: string | null;
}

const GOLDENS: Record<string, Golden> = {
  "defaults-landscape": {
    "width": 240,
    "height": 160,
    "placeholder": null,
    "urlLength": 447,
    "urlHash": "17bd13d55a2fd75fec1385d7fc9930bc045aae24474544747bb4efac2abaa54f"
  },
  "defaults-portrait": {
    "width": 120,
    "height": 200,
    "placeholder": null,
    "urlLength": 427,
    "urlHash": "3ab9104fc32931f375bcc07ba0d05e7165b387480ea425a748a763d33d8fe34c"
  },
  "defaults-tiny": {
    "width": 10,
    "height": 10,
    "placeholder": null,
    "urlLength": 419,
    "urlHash": "3b236fd19cef9d11f9b3ec35356390e8d0180ebfff22ca32417c4258258fb587"
  },
  "positional-string-opts": {
    "width": 240,
    "height": 160,
    "placeholder": null,
    "urlLength": 203,
    "urlHash": "af7c91dbe3117c2eb721cccd5e64a09772b28f5fadca950fab79b92835b03072"
  },
  "format-jpeg": {
    "width": 240,
    "height": 160,
    "placeholder": null,
    "urlLength": 523,
    "urlHash": "8ab7444d8f58be4b55f467caeb920acd57e24f713fcd3bfa8eb458a5a1d17228"
  },
  "format-png": {
    "width": 240,
    "height": 160,
    "placeholder": null,
    "urlLength": 582,
    "urlHash": "901f495cac8b80e600b481ae3619c3690b29fd8d9776c3368ee67438d4a3f44b"
  },
  "format-webp-q80": {
    "width": 240,
    "height": 160,
    "placeholder": null,
    "urlLength": 279,
    "urlHash": "0cae9f010c28fe7ec5c4bf7d5c3ad85eba15a1908326a9f6972204ab2f96a7c8"
  },
  "size-object": {
    "width": 240,
    "height": 160,
    "placeholder": null,
    "urlLength": 471,
    "urlHash": "f39a664c496a1d1880ea6af441ba203b80e94fb6d3f8789d5ac13e44fa4bfa60"
  },
  "size-object-ratio": {
    "width": 240,
    "height": 160,
    "placeholder": null,
    "urlLength": 479,
    "urlHash": "c3d82d722706ce6d49a4aec1e786c87cf31d7138d9c06c38f8a5e0306078b8eb"
  },
  "scale-half": {
    "width": 240,
    "height": 160,
    "placeholder": null,
    "urlLength": 695,
    "urlHash": "648261fc8231a3e954578cef546be0ea58e2a72f882e50c3d5376831b4ea38e1"
  },
  "ratio-number": {
    "width": 240,
    "height": 160,
    "placeholder": null,
    "urlLength": 415,
    "urlHash": "004dccaa36c7ded4f81b6ff4cacb7fc5381a704b02b6b0dd57d0b870a7fbab8d"
  },
  "blur-off": {
    "width": 240,
    "height": 160,
    "placeholder": null,
    "urlLength": 519,
    "urlHash": "ab091b12dcb7ef01a2c3efc15c9d6b5329ec814b4a76658873b61c27046455a4"
  },
  "blur-small": {
    "width": 240,
    "height": 160,
    "placeholder": null,
    "urlLength": 471,
    "urlHash": "aa3605f82461b3da6b65c09dca5088776b9fbf7a4ca10ccf36f3ca979d49b532"
  },
  "blur-options": {
    "width": 240,
    "height": 160,
    "placeholder": null,
    "urlLength": 451,
    "urlHash": "d531598ace170efa9cca8a3baf161830fbb2497248241dfdac8fed88fd23c100"
  },
  "modulated": {
    "width": 240,
    "height": 160,
    "placeholder": null,
    "urlLength": 487,
    "urlHash": "79dd9074e8e2be60fd71468fc9afc33b071c99160e50e7a0153e1ab014fe7d4f"
  },
  "saturation-default-value-explicit": {
    "width": 240,
    "height": 160,
    "placeholder": null,
    "urlLength": 447,
    "urlHash": "17bd13d55a2fd75fec1385d7fc9930bc045aae24474544747bb4efac2abaa54f"
  },
  "fit-cover-kernel-nearest": {
    "width": 240,
    "height": 160,
    "placeholder": null,
    "urlLength": 451,
    "urlHash": "c8d97cdaf6aa5aa0580e2b5c4ecfc22c5f66bd38ac42e323ef4be369dfef27d5"
  },
  "next-defaults": {
    "width": 240,
    "height": 160,
    "placeholder": "blur",
    "urlLength": 447,
    "urlHash": "17bd13d55a2fd75fec1385d7fc9930bc045aae24474544747bb4efac2abaa54f"
  },
  "next-jpeg": {
    "width": 240,
    "height": 160,
    "placeholder": "blur",
    "urlLength": 487,
    "urlHash": "c416260a089c7018096e69f411a1c693d39103efcfe1c5cf181c482a155f6026"
  },
};

describe('golden outputs (reference: sharp 0.35.5)', () => {
  it('matches every captured case', async () => {
    const landscape = await fixture(240, 160);
    const portrait = await fixture(120, 200);
    const tiny = await fixture(10, 10);

    const cases: Record<string, () => Promise<{ width: number; height: number; blurDataURL?: string; placeholder?: string }>> = {
      'defaults-landscape': () => blur64Image(landscape),
      'defaults-portrait': () => blur64Image(portrait),
      'defaults-tiny': () => blur64Image(tiny),
      'positional-string-opts': () => blur64Image(landscape, { size: 32, format: 'webp' }),
      'format-jpeg': () => blur64Image({ src: landscape, format: 'jpeg' }),
      'format-png': () => blur64Image({ src: landscape, format: 'png' }),
      'format-webp-q80': () => blur64Image({ src: landscape, format: 'webp', quality: 80 }),
      'size-object': () => blur64Image({ src: landscape, size: { width: 64, height: 40 } }),
      'size-object-ratio': () => blur64Image({ src: landscape, size: { width: 64, height: 64 }, ratio: 16 / 9 }),
      'scale-half': () => blur64Image({ src: landscape, scale: 0.5 }),
      'ratio-number': () => blur64Image({ src: landscape, ratio: 1 }),
      'blur-off': () => blur64Image({ src: landscape, blurRadius: false }),
      'blur-small': () => blur64Image({ src: landscape, blurRadius: 1.5 }),
      'blur-options': () => blur64Image({ src: landscape, blurRadius: { sigma: 2 } }),
      'modulated': () => blur64Image({ src: landscape, saturation: 2, brightness: 1.1, hue: 15, lightness: 5 }),
      'saturation-default-value-explicit': () => blur64Image({ src: landscape, saturation: 1.2 }),
      'fit-cover-kernel-nearest': () =>
        blur64Image({ src: landscape, fit: 'cover', kernel: 'nearest', size: { width: 40, height: 40 } }),
      'next-defaults': () => blur64NextImageData(landscape),
      'next-jpeg': () => blur64NextImageData(landscape, { format: 'jpeg', size: 16 }),
    };

    for (const [name, golden] of Object.entries(GOLDENS)) {
      const run = cases[name];
      expect(run, `missing case ${name}`).toBeDefined();
      const result = await run!();
      expect(result.width, name).toBe(golden.width);
      expect(result.height, name).toBe(golden.height);
      expect(result.placeholder ?? null, name).toBe(golden.placeholder);
      expect(result.blurDataURL ? result.blurDataURL.length : null, name).toBe(golden.urlLength);
      expect(
        result.blurDataURL ? createHash('sha256').update(result.blurDataURL).digest('hex') : null,
        name
      ).toBe(golden.urlHash);
    }
  });
});
