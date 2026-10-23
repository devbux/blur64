# blur64

[![npm version](https://img.shields.io/npm/v/blur64.svg)](https://www.npmjs.com/package/blur64)
[![CI](https://github.com/devbux/blur64/actions/workflows/ci.yml/badge.svg)](https://github.com/devbux/blur64/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/npm/l/blur64.svg)](LICENSE)

Generate tiny, base64-encoded blurred image placeholders from images — a file
path, a URL, or a `Buffer` — using [Sharp](https://sharp.pixelplumbing.com/).
The result is a small data URL you can inline as an image placeholder (for
example as a Next.js `blurDataURL`) while the full image loads.

## Features

- **Flexible input** — file path, URL, or `Buffer`
- **Tiny output** — downscale, re-encode, and blur yields very small data URLs
- **Configurable** — size/scale, blur strength, format (`avif`, `webp`, `jpeg`,
  `png`), quality, color adjustments, and more
- **Next.js helpers** — server actions with ISR support, tailored for the App
  Router, via `blur64/nextjs`
- **Network resilience** — automatic retries with exponential backoff for URL
  fetches

## Requirements

- Node.js **>= 20**
- `sharp` (a peer dependency — install it alongside `blur64`)

## Installation

```bash
npm install blur64 sharp
```

## Usage

### Quick start

```ts
import { blur64Image } from "blur64";

const { width, height, blurDataURL } = await blur64Image(
  "https://example.com/image.jpg"
);

console.log(blurDataURL); // data:image/avif;base64,...
console.log(width, height); // original image dimensions
```

With no options, `blur64Image` downscales the image so its smaller side is
24px, re-encodes it as AVIF at quality 20, and applies a light blur — the
defaults that give blur64 placeholders their smooth look (see
[Options](#options-blur64options)).

### File path and Buffer inputs

```ts
// From a local file
const fromFile = await blur64Image("./photo.jpg");

// From a Buffer
import { readFile } from "node:fs/promises";
const buffer = await readFile("./photo.jpg");
const fromBuffer = await blur64Image(buffer);
```

### With options

```ts
const result = await blur64Image({
  src: "https://example.com/image.jpg",
  size: 32,
  blurRadius: 8,
  format: "webp",
  quality: 30,
});
```

### Error handling

Invalid options throw a `Blur64Error`. A URL that cannot be fetched (after
retries) does not throw — it resolves to
`{ width: 0, height: 0, blurDataURL: undefined }` instead.

```ts
import { blur64Image, Blur64Error } from "blur64";

try {
  const result = await blur64Image("invalid/path.jpg");
  console.log(result);
} catch (error) {
  if (error instanceof Blur64Error) console.error(error.message);
  else console.error("Unexpected error:", error);
}
```

## Next.js (App Router)

**Compatibility:** built for the App Router and React Server Components, and
verified end-to-end on **Next.js 16.4** with **React 19.3** — Turbopack
production build, static prerendering, route handlers, and the `next/image`
blur placeholder all exercised against the published package. The helpers run
entirely on the server and need no client-side JavaScript.

Import the helpers from `blur64/nextjs`:

```tsx
// app/page.tsx
import Image from "next/image";
import { blur64NextImageData } from "blur64/nextjs";

export default async function Page() {
  const placeholder = await blur64NextImageData("https://example.com/image.jpg");
  return <Image src="https://example.com/image.jpg" alt="Demo" {...placeholder} />;
}
```

- `blur64NextImageData(input, options?)` returns `Blur64ImageData` plus a
  `placeholder` field — `"blur"` when a valid `blurDataURL` was produced,
  `"empty"` otherwise — ready to spread onto Next.js's `Image` component.
- `blur64Action(input, options?)` is a plain server action that returns
  `Blur64ImageData` and resolves to empty data instead of throwing on error.
- The Next.js variant accepts one extra option, `revalidate` (ISR cache
  lifetime for URL fetches; see below).

## API

### `blur64Image(input, options?)`

```ts
blur64Image(
  input: string | Buffer | Blur64Options,
  options?: Omit<Blur64Options, "src">
): Promise<Blur64ImageData>
```

Pass the source and options either as a single object or positionally.

### Options (`Blur64Options`)

| Option          | Type                                                              | Default    | Description                                                                 |
| --------------- | ----------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------- |
| `src`           | `string` \| `Buffer`                                              | —          | Image source (file path, URL, or buffer).                                   |
| `scale`         | `number` (0 < scale ≤ 1)                                          | —          | Scale factor relative to the original dimensions.                           |
| `size`          | `number` \| `{ width: number; height: number }`                   | `24`       | Target size of the placeholder; the smaller side when a number.             |
| `ratio`         | `number` \| `{ width: number; height: number }`                   | original   | Target aspect ratio.                                                        |
| `blurRadius`    | `number` (> 0) \| `false` \| `BlurOptions`                        | `4`        | Blur strength; `false` disables blurring.                                   |
| `quality`       | `number` (0–100)                                                  | `20`       | Quality for lossy formats.                                                  |
| `format`        | `"avif"` \| `"webp"` \| `"jpeg"` \| `"png"`                       | `"avif"`   | Output format.                                                              |
| `formatOptions` | `object`                                                          | —          | Extra options for the selected format (see the Sharp docs).                 |
| `brightness`    | `number`                                                          | `1`        | Brightness multiplier.                                                      |
| `saturation`    | `number`                                                          | `1.2`      | Saturation multiplier.                                                      |
| `hue`           | `number`                                                          | `0`        | Hue rotation in degrees.                                                    |
| `lightness`     | `number`                                                          | `0`        | Lightness adjustment.                                                       |
| `fit`           | `"contain"` \| `"cover"` \| `"fill"` \| `"inside"` \| `"outside"` | `"inside"` | Resize fit mode.                                                            |
| `kernel`        | `"nearest"` \| `"cubic"` \| `"mitchell"` \| `"lanczos2"` \| `"lanczos3"` | `"lanczos3"` | Resize kernel.                                                          |
| `retries`       | `number`                                                          | `2`        | Retry attempts for URL fetches.                                             |
| `retryDelay`    | `number` (ms)                                                     | `300`      | Base delay between retries (doubles each attempt).                          |
| `timeout`       | `number` (ms)                                                     | `30000`    | Request timeout for URL fetches.                                            |

### Next.js options (`Blur64NextOptions`)

Extends `Blur64Options` with:

| Option       | Type                | Default | Description                                                            |
| ------------ | ------------------- | ------- | ---------------------------------------------------------------------- |
| `revalidate` | `number` \| `false` | `86400` | ISR revalidation time in seconds (24 hours); `false` disables caching. |

### Returns (`Blur64ImageData`)

| Field         | Type                  | Description                                   |
| ------------- | --------------------- | --------------------------------------------- |
| `width`       | `number`              | Original image width.                         |
| `height`      | `number`              | Original image height.                        |
| `blurDataURL` | `string` \| `undefined` | Base64 data URL, or `undefined` on failure. |

## Notes

- Server-side only — `blur64` uses `sharp` and runs in Node.js and Next.js
  server runtimes, not in the browser.
- URL fetches are retried with exponential backoff (`retries`, `retryDelay`,
  `timeout`); a fetch that still fails resolves to empty data rather than
  throwing.

## Development

```bash
npm install
npm run typecheck  # tsc --noEmit
npm test           # vitest, including golden-output tests
npm run build      # bundle CJS + ESM + types to dist/ with tsup
```

The test suite includes **golden-output tests**: the exact output of the
default settings (and a matrix of options) is pinned byte-for-byte, so
changes cannot silently alter the placeholders the package generates.

## Releasing

Releases are published to npm by the **Publish to npm** GitHub Action:
create a GitHub Release for the new version tag (or run the workflow
manually), and the workflow typechecks, tests, builds, and publishes with
provenance. It expects an `NPM_TOKEN` repository secret.

## License

[MIT](LICENSE) © devbux
