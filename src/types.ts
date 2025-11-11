import sharp from 'sharp';

export const supportedFormats = ['avif', 'webp', 'jpeg', 'png'] as const;

export interface Blur64Options {
  src: string | Buffer;
  scale?: number;
  size?: number | { width: number; height: number };
  ratio?: number | { width: number; height: number };
  blurRadius?: number | false | sharp.BlurOptions;
  format?: (typeof supportedFormats)[number];
  formatOptions?: sharp.OutputOptions | sharp.AvifOptions | sharp.WebpOptions | sharp.JpegOptions | sharp.PngOptions;
  quality?: number;
  brightness?: number;
  saturation?: number;
  hue?: number;
  lightness?: number;
  fit?: keyof sharp.FitEnum;
  kernel?: keyof sharp.KernelEnum;
  retries?: number;
  retryDelay?: number;
  timeout?: number;
}

export interface Blur64NextOptions extends Blur64Options {
  revalidate?: number | false;
}

export interface Blur64ImageData {
  height: number;
  width: number;
  blurDataURL?: string;
}

export class Blur64Error extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'Blur64Error';
  }
}
