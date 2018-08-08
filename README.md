# wright-webpack-config

A Webpack config for internal use, that **produces separate bundles for evergreen browsers and Internet Explorer**. This lets us exclude polyfills and Babel transforms for features that evergreen browsers support.

It also includes support for the following:

- TypeScript/TSX
- Imports of CSS files
- Bundle Tracker (important for Django integration!)
- `CleanWebpackPlugin` (helps avoid)

## Usage