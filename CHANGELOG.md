# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.4.0] - 2026-10-23

### Compatibility release

- Widened the `sharp` peer range to `^0.33.5 || ^0.34.2 || ^0.35.0`, each
  version verified against this code: the API and dimensions are identical
  on all three, and on sharp 0.34.5 the new code reproduces the original
  v1.3.0 outputs byte-for-byte — existing apps are unaffected unless they
  upgrade sharp themselves.
- The public API is unchanged and is now pinned by an explicit
  backward-compatibility test suite (`test/compat.test.ts`): export names,
  both call styles, the Next.js helpers' result shapes, the entry points,
  and the peer range.
- Reference outputs (golden tests) were recaptured on sharp 0.35.5: with
  the new libvips encoder, 15 of 19 cases produce slightly different
  bytes (the default AVIF placeholder grows from 423 to 447 characters).
  Sizes, dimensions, and behaviour are otherwise identical.

### Changed

- Updated the development toolchain to the latest releases: sharp 0.35.5,
  tsup 9, vitest 5, @types/node 26. TypeScript is 6.0.3 — TypeScript 7's
  native compiler is not yet compatible with tsup 9's declaration
  pipeline (verified), and will be adopted when it is.
- CI now also runs on Node 24 (matrix: 20, 22, 24).

## [1.3.3] - 2026-10-23

### Added

- Verified full compatibility with the current React and Next.js:
  blur64 1.3.2 was exercised end-to-end in a real Next.js 16.4 /
  React 19.3 app (Turbopack production build, static prerendering,
  route handlers, `next/image` blur placeholder) with no changes
  required. The README's Next.js section now states the verified
  versions, and the package keywords include `nextjs` and `react`.
  No code changes; outputs are identical to 1.3.1/1.3.2.

## [1.3.2] - 2026-10-23

### Changed

- Rewrote the README in a standard layout (badges, requirements,
  structured usage and API sections); the documented defaults and
  behaviour are unchanged, and the code is identical to 1.3.1.

## [1.3.1] - 2026-10-23

### Changed

- Internal refactor with **no behaviour change**: the core and Next.js
  pipelines now share one option-resolution and image-generation path, and
  the two URL fetch helpers share one retry implementation.
- Removed the redundant `@types/sharp` stub (sharp ships its own types)
  and the direct `esbuild` dev dependency (provided by tsup).

### Added

- Automated test suite (vitest), including golden-output tests: results
  for the default settings and a matrix of options are verified
  byte-for-byte against v1.3.0, so the defaults that define blur64's look
  cannot drift unnoticed.
- GitHub Actions CI (Node 20/22 plus a Bun build smoke job) and an
  automated npm publish workflow: publishing a GitHub Release now
  publishes to npm with provenance.
- Dependabot configuration: grouped weekly minor/patch updates, with
  major bumps held back for deliberate review.

## [1.3.0] - 2025-11-11

- Last release published manually to npm. Earlier version history is
  available on the npm page for `blur64`.
