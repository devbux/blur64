# blur64

A lightweight package for generating base64-encoded blurred image placeholders from image sources (file path, buffer, or URL) using [Sharp](https://sharp.pixelplumbing.com/).

## Features

- **Input Flexibility**: Accepts image file paths, buffers, or URLs.
- **Customizable Output**: Adjust size, scale, blur radius, format (`avif`, `jpeg`, `png`, `webp`), quality, and color properties (brightness, saturation, hue, lightness).
- **Server-Side Usage Only** : Since it's using `sharp`.

## Installation

```bash
npm install blur64 sharp
```

**Note**: `sharp` are peer dependency and must be installed separately.

## Usage

### Basic Example

```javascript
import { blur64Image } from "blur64";

async function example() {
  const result = await blur64Image({
    src: "https://example.com/image.jpg", // or local path or Buffer
    scale: 0.1,
    blurRadius: 8,
    format: "avif",
    retries: 3, // only when using URL as src
  });

  console.log(result.base64); // data:image/avif;base64,...
  console.log(result.metadata); // { width, height, format }
}
```

### Next.js (App Router) Example

Use `blur64` in a Next.js app to generate blurred image placeholders server-side.

```tsx
// app/page.tsx
import Image from "next/image";
import { blur64Image } from "blur64";

async function getBlurredImage() {
  "use server";
  const result = await blur64Image({
    src: "https://example.com/image.jpg",
    scale: 0.1,
    blurRadius: 8,
    format: "webp",
    quality: 50,
  });

  return result;
}

export default async function Home() {
  const { base64, metadata } = await getBlurredImage();

  return (
    <div>
      <Image
        src="https://example.com/image.jpg"
        alt="Example image"
        width={metadata?.width ?? 800}
        height={metadata?.height ?? 800}
        placeholder={base64 ? "blur" : "empty"}
        blurDataURL={base64 || undefined}
      />
    </div>
  );
}
```

### Error Handling

```javascript
import { blur64Image, Blur64Error } from "blur64";

async function example() {
  try {
    const result = await blur64Image("invalid/path.jpg");
    console.log(result);
  } catch (error) {
    if (error instanceof Blur64Error) {
      console.error(error.message);
    } else {
      console.error("Unexpected error:", error);
    }
  }
}
```

## API Reference

#### `blur64Image(input: string | Buffer | Blur64Options, options?: Omit<Blur64Options, 'src'>): Promise<Blur64Output>`

Generates a base64-encoded blurred image placeholder.

#### Parameters

- `input`: Image source (`string` for file path or URL, `Buffer` for raw image data) or `Blur64Options` object.
- `options` (optional): Configuration options when `input` is a `string` or `Buffer`.

#### Options (`Blur64Options`)

| Option       | Type                                                             | Default      | Description                                                           |
| ------------ | ---------------------------------------------------------------- | ------------ | --------------------------------------------------------------------- |
| `src`        | `string` \| `Buffer`                                             | -            | **Required**. Image source (file path, URL, or buffer).               |
| `size`       | `{ width: number, height: number }`                              | -            | Target dimensions. If omitted, uses `scale` with original dimensions. |
| `scale`      | `number` (0 < scale ≤ 1)                                         | `0.1`        | Scaling factor for output size relative to original dimensions.       |
| `blurRadius` | `number` (≥ 0)                                                   | `10`         | Blur radius for Gaussian blur effect.                                 |
| `format`     | `"avif" \| "jpeg" \| "png" \| "webp"`                            | `"avif"`     | Output image format.                                                  |
| `quality`    | `number` (0–100)                                                 | `50`         | Quality for lossy formats (`jpeg`, `avif`, `webp`).                   |
| `brightness` | `number`                                                         | `1`          | Brightness adjustment multiplier.                                     |
| `saturation` | `number`                                                         | `1.2`        | Saturation adjustment multiplier.                                     |
| `hue`        | `number`                                                         | `0`          | Hue rotation in degrees.                                              |
| `lightness`  | `number`                                                         | `0`          | Lightness adjustment.                                                 |
| `fit`        | `"contain" \| "cover" \| "fill" \| "inside" \| "outside"`        | `"fill"`     | Resize fit mode (see `sharp` docs).                                   |
| `kernel`     | `"nearest" \| "cubic" \| "mitchell" \| "lanczos2" \| "lanczos3"` | `"lanczos2"` | Resize kernel (see `sharp` docs).                                     |
| `retries`    | `number`                                                         | `2`          | Number of retry attempts for URL fetches.                             |

#### Returns (`Blur64Output`)

- `base64`: `string | null` - Base64-encoded blurred image (e.g., `data:image/webp;base64,...`).
- `metadata`: `{ width: number, height: number, format: string } | null` - Original image metadata.

## License

[MIT](https://choosealicense.com/licenses/mit/) © [devbux](https://github.com/devbux)
