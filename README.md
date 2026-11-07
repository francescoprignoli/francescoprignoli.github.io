# Francesco Prignoli’s portfolio

A static HTML, CSS, and JavaScript site served directly by GitHub Pages. No build step is required.

## Formatting

Install the pinned development formatter with `npm ci`.

- `npm run format` formats the source files.
- `npm run format:check` checks formatting without changing files.

Prettier uses two-space indentation, a 100-character target line width, single quotes in JavaScript,
semicolons, and LF line endings. `.editorconfig` shares basic whitespace rules with compatible editors.
Images and the generated dependency lockfile are excluded from formatting.
