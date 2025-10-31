# blur64

Generate tiny, base64-encoded blurred placeholders from images (file path, URL, or Buffer) using [Sharp](https://sharp.pixelplumbing.com/).

## Features

- **Flexible input**: file path, URL, or `Buffer`
- **Tiny output**: downscale + blur yields very small data URLs
- **Configurable**: size/scale, blur strength, format (`avif`, `webp`, `jpeg`, `png`), quality, and color tweaks
- **Next.js helpers**: server actions tailored for App Router via `blur64/nextjs`

## Installation

```bash
npm install blur64 sharp
```

`sharp` is a peer dependency and must be installed in your project.

## Quick start (Node.js)

```ts
import { blur64Image } from "blur64";

const result = await blur64Image({
  src: "https://example.com/image.jpg", // file path or Buffer also supported
  size: 24,
  blurRadius: 8,
  format: "avif",
});

console.log(result.blurDataURL); // data:image/avif;base64,...
console.log(result.width, result.height);
```

## Next.js (App Router)

```tsx
// app/page.tsx
import Image from "next/image";
import { blur64NextImageData } from "blur64/nextjs";

export default async function Page() {
  const placeholder = await blur64NextImageData("https://example.com/image.jpg");
  return <Image src="https://example.com/image.jpg" alt="Demo" {...placeholder} />;
}
```

### Error handling

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

## API

### Core (from `blur64`)

`blur64Image(input: string | Buffer | Blur64Options, options?: Omit<Blur64Options, 'src'>): Promise<Blur64ImageData>`

### Next.js helpers (from `blur64/nextjs`)

- `blur64Action(input, options?)`
- `blur64NextImageData(input, options?): Promise<Blur64ImageData & { placeholder?: "blur" | "empty" }>`

`placeholder` is `"blur"` only when a valid `blurDataURL` is produced.

## Options (`Blur64Options`)

| Option          | Type                                                             | Default | Description                                                                 |
| --------------- | ---------------------------------------------------------------- | ------- | --------------------------------------------------------------------------- |
| `src`           | `string` \| `Buffer`                                             | —       | Image source (file path, URL, or buffer).                                   |
| `scale`         | `number` (0 < scale ≤ 1)                                         | —       | Scale factor relative to original dimensions.                                |
| `size`          | `number` \| `{ width: number, height: number }`                  | `24`    | Target size; when omitted, a small default is used.                          |
| `ratio`         | `number` \| `{ width: number, height: number }`                  | —       | Target aspect ratio; defaults to original.                                   |
| `blurRadius`    | `number` (> 0) \| `false` \| `BlurOptions`                        | `4`     | Blur strength; `false` disables blur.                                        |
| `quality`       | `number` (0–100)                                                 | `20`    | Quality for lossy formats.                                                   |
| `format`        | `"avif"` \| `"jpeg"` \| `"png"` \| `"webp"`                            | `"avif"` | Output format.                                                                |
| `formatOptions` | `object`                                                         | —       | Extra options for the selected format (see Sharp docs).                      |
| `brightness`    | `number`                                                         | `1`     | Brightness multiplier.                                                       |
| `saturation`    | `number`                                                         | `1.2`   | Saturation multiplier.                                                       |
| `hue`           | `number`                                                         | `0`     | Hue rotation in degrees.                                                     |
| `lightness`     | `number`                                                         | `0`     | Lightness adjustment.                                                        |
| `fit`           | `"contain"` \| `"cover"` \| `"fill"` \| `"inside"` \| `"outside"`       | `"inside"` | Resize fit mode.                                                              |
| `kernel`        | `"nearest"` \| `"cubic"` \| `"mitchell"` \| `"lanczos2"` \| `"lanczos3"` | `"lanczos3"` | Resize kernel.                                                                |
| `retries`       | `number`                                                         | `2`     | Retry attempts for URL fetches.                                              |
| `retryDelay`    | `number` (ms)                                                    | `300`   | Delay between retries for URL fetches.                                       |

### Returns (`Blur64ImageData`)

- `width`: original image width
- `height`: original image height
- `blurDataURL`: base64 data URL (or `undefined` on failure)

## Notes

- Server-side only (uses `sharp`). Works in Node.js and Next.js server runtimes.
- In plain Node.js, Next.js-specific fetch hints are ignored harmlessly.

## License

Licensed under the [MIT LICENSE](LICENSE).
