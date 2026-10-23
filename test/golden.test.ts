import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import sharp from 'sharp';

import { blur64Image } from '../src/index';
import { blur64NextImageData } from '../src/nextjs';

/**
 * Golden-output tests. The hashes below were captured from v1.3.0 before
 * the internal refactor: the defaults and the processing pipeline define
 * blur64's output, so any drift in a default value, the dimension maths,
 * or the pipeline order fails these tests byte-for-byte.
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
    "urlLength": 423,
    "urlHash": "17197cbdd71502efa37234f09c65fd675bf2cccd57aeb34f0509b5b031a5064e"
  },
  "defaults-portrait": {
    "width": 120,
    "height": 200,
    "placeholder": null,
    "urlLength": 419,
    "urlHash": "1ad62d4ef6fe011d4c8b707147321872ee4526380453ffd76571146842f87bd4"
  },
  "defaults-tiny": {
    "width": 10,
    "height": 10,
    "placeholder": null,
    "urlLength": 407,
    "urlHash": "850163bc5600da468c6a288201a6166dcdbe2e3debb1c3b0fcbd4a383ca3953e"
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
    "urlHash": "4da26fc935de442ee159bffbe9f64762a9d803611fc5b16e1eb29758a50fef6b"
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
    "urlLength": 459,
    "urlHash": "2e73cd9106b1f29555f7efbae08d1a3b3271769353d9914a9b4995db124dd5c0"
  },
  "size-object-ratio": {
    "width": 240,
    "height": 160,
    "placeholder": null,
    "urlLength": 463,
    "urlHash": "fa0dca8e66e2b8670d20b6253b001f2c873aca6d35cc4c3abf1b4ce4eb440c07"
  },
  "scale-half": {
    "width": 240,
    "height": 160,
    "placeholder": null,
    "urlLength": 647,
    "urlHash": "daf49c781aadae4833a35eabaae840ad137379baeae70af269dc8dd1ad017b8e"
  },
  "ratio-number": {
    "width": 240,
    "height": 160,
    "placeholder": null,
    "urlLength": 403,
    "urlHash": "e84906d8b4e63e3e03f16609e7fc259beac6704516f091c3e913854d336c5778"
  },
  "blur-off": {
    "width": 240,
    "height": 160,
    "placeholder": null,
    "urlLength": 567,
    "urlHash": "32660e39d241660148d70101f27ed9d3bc500d841282308c47e054ea874998f1"
  },
  "blur-small": {
    "width": 240,
    "height": 160,
    "placeholder": null,
    "urlLength": 459,
    "urlHash": "a01fcb9e45a8e88b5e0ec3c4fe70be8a2095e75f5c3049553afc019cac662a3f"
  },
  "blur-options": {
    "width": 240,
    "height": 160,
    "placeholder": null,
    "urlLength": 447,
    "urlHash": "a11fc5b9b092f4b92303d4dd45773cb2c81da927f2350e27910befd358ad287e"
  },
  "modulated": {
    "width": 240,
    "height": 160,
    "placeholder": null,
    "urlLength": 459,
    "urlHash": "c55729b3ea1510d0998977ae6590aa811664859e1dbfb1889d115258913596de"
  },
  "saturation-default-value-explicit": {
    "width": 240,
    "height": 160,
    "placeholder": null,
    "urlLength": 423,
    "urlHash": "17197cbdd71502efa37234f09c65fd675bf2cccd57aeb34f0509b5b031a5064e"
  },
  "fit-cover-kernel-nearest": {
    "width": 240,
    "height": 160,
    "placeholder": null,
    "urlLength": 435,
    "urlHash": "87f421db15e0eeb4d5394c628bce3df2ee357a09be55760fd87e7e1b30585367"
  },
  "next-defaults": {
    "width": 240,
    "height": 160,
    "placeholder": "blur",
    "urlLength": 423,
    "urlHash": "17197cbdd71502efa37234f09c65fd675bf2cccd57aeb34f0509b5b031a5064e"
  },
  "next-jpeg": {
    "width": 240,
    "height": 160,
    "placeholder": "blur",
    "urlLength": 487,
    "urlHash": "c416260a089c7018096e69f411a1c693d39103efcfe1c5cf181c482a155f6026"
  }
};

describe('golden outputs (must match v1.3.0 byte-for-byte)', () => {
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
