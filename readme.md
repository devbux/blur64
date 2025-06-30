# blur64

A lightweight package for generating base64-encoded blurred image placeholders from image sources (file path, buffer, or URL) using [Sharp](https://sharp.pixelplumbing.com/).

## Features

- **Input Flexibility**: Supports file paths, buffers, or URLs.
- **Customizable Output**: Adjust size, scale, blur radius, format (`avif`, `jpeg`, `png`, `webp`), quality, and color adjustments (brightness, saturation, hue, lightness).
- **Server-Side Usage Only** : Since it's using `sharp`.

## Installation

```bash
npm install blur64 sharp
```

**Note**: `sharp` is a peer dependency and must be installed separately.

## Usage

### Basic Example

```javascript
import { blur64Image } from "blur64";

async function example() {
  const result = await blur64Image({
    src: "https://example.com/image.jpg", // or 'local/path/to/image.jpg' or Buffer
    scale: 0.1,
    blurRadius: 8,
    format: "avif",
    retries: 3, // only when using URL as src
  });

  console.log(result.blurDataURL); // data:image/avif;base64,...
  console.log(result.width, result.height); // Original dimensions
}
```

### Next.js (App Router) Example

Use `blur64` in a Next.js app to generate blurred image placeholders server-side.

```tsx
// app/page.tsx
import Image from "next/image";
import { blur64NextImageData } from "blur64";

export default async function Home() {
  const placeholderData = await blur64NextImageData("https://example.com/image.jpg");

  return (
    <div>
      <Image
        src="https://example.com/image.jpg"
        alt="Example image"
        {...placeholderData}
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
    error instanceof Blur64Error ? console.error(error.message) : console.error("Unexpected error:", error);
  }
}
```

## API Reference

### Functions

#### Main: `blur64Image(input: string (file path or URL) | Buffer | Blur64Options, options?: Omit<Blur64Options, 'src'>): Promise<Blur64ImageData>`

#### React Server Function/Action for React Server Components (uses `use server` directive): `blur64Action(input: string | Buffer | Blur64Options, options?: Omit<Blur64Options, 'src'>): Promise<Blur64ImageData>`

#### Next.js (App Router) Server Function/Action (uses `use server` directive): `blur64NextImageData(input: string | Buffer | Blur64Options, options?: Omit<Blur64Options, 'src'>): Promise<Blur64ImageData & { placeholder?: "blur" | "empty" }>`

- The returned `placeholder` property is intended for use with Next.js's `<Image />` component; it will be set to `"blur"` if a blurred placeholder is generated, or `undefined` if not.

### Parameters

- `input`: Image source (`string` for file path or URL, `Buffer` for raw image data) or `Blur64Options` object.
- `options` (optional): Configuration options when `input` is a `string` or `Buffer`.

### Options (`Blur64Options`)

| Option          | Type                                                             | Default      | Description                                                           |
| --------------- | ---------------------------------------------------------------- | ------------ | --------------------------------------------------------------------- |
| `src`           | `string` \| `Buffer`                                             | -            | **Required**. Image source (file path, URL, or buffer).               |
| `scale`         | `number` (0 < scale ≤ 1)                                         | -            | Scaling factor for output size relative to original dimensions.       |
| `size`          | `number` \| `{ width: number, height: number }`                  | `24`         | Target dimensions. If omitted, uses `scale` with original dimensions. |
| `ratio`         | `number` \| `{ width: number, height: number }`                  | -            | Target aspect ratio. Defaults to original image ratio.                |
| `blurRadius`    | `number` (≥ 0)                                                   | `4`          | Blur radius for Gaussian blur effect.                                 |
| `quality`       | `number` (0–100)                                                 | `20`         | Quality for lossy formats (`avif`, `webp`, `jpeg`).                   |
| `format`        | `"avif" \| "jpeg" \| "png" \| "webp"`                            | `"avif"`     | Output image format.                                                  |
| `formatOptions` | `object`                                                         | -            | Options for the output format (see `sharp` docs).                     |
| `brightness`    | `number`                                                         | `1`          | Brightness adjustment multiplier.                                     |
| `saturation`    | `number`                                                         | `1.2`        | Saturation adjustment multiplier.                                     |
| `hue`           | `number`                                                         | `0`          | Hue rotation in degrees.                                              |
| `lightness`     | `number`                                                         | `0`          | Lightness adjustment.                                                 |
| `fit`           | `"contain" \| "cover" \| "fill" \| "inside" \| "outside"`        | `"inside"`   | Resize fit mode (see `sharp` docs).                                   |
| `kernel`        | `"nearest" \| "cubic" \| "mitchell" \| "lanczos2" \| "lanczos3"` | `"lanczos3"` | Resize kernel (see `sharp` docs).                                     |
| `retries`       | `number`                                                         | `2`          | Number of retry attempts for URL fetches.                             |
| `retryDelay`    | `number`                                                         | `300`        | Delay (ms) between URL fetch retries.                                 |

### Returns (`Blur64ImageData`)

- `width`: `number` - Original image width.
- `height`: `number` - Original image height.
- `blurDataURL`: `string | undefined` - Base64-encoded blurred image (e.g., `data:image/webp;base64,...`).

## License

Licensed under the [MIT LICENSE](LICENSE).
