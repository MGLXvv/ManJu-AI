Login artwork files:

- `login-bg-1.png`
- `login-bg-2.png`

The login route discovers these files through `import.meta.glob` and loads only one selected background at runtime. While the selected image is loading—or if it fails—the page renders a CSS gradient fallback.

New login backgrounds must satisfy `pnpm check:source-assets`. The two existing PNG files have explicit size ceilings and remain tracked for source recompression in Issue #17; do not raise those ceilings merely to pass CI.
