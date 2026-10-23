import { defineConfig } from 'tsup';

// Two separate configs on purpose: building each entry in its own pass
// keeps the emitted type declarations self-contained per entry (a single
// shared pass produces a shared types-*.d.ts chunk instead).
export default defineConfig([
  {
    entry: ['src/index.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: false,
    clean: true,
    external: ['sharp'],
    minify: true,
    treeshake: true,
    platform: 'node',
    outDir: 'dist',
    outExtension({ format }) {
      return {
        js: format === 'cjs' ? '.cjs' : '.mjs',
      };
    },
  },
  {
    entry: ['src/nextjs.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: false,
    external: ['sharp'],
    minify: true,
    treeshake: true,
    platform: 'node',
    outDir: 'dist',
    outExtension({ format }) {
      return {
        js: format === 'cjs' ? '.cjs' : '.mjs',
      };
    },
  },
]);
