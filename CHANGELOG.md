# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
