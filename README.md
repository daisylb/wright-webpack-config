# wright-webpack-config

A Webpack config for internal use (but it's CC0, so you can use it too if you want!), that **supports every feature in every published ECMAScript version** (even those that use polyfills), and **produces separate bundles for evergreen browsers and Internet Explorer**. This lets us exclude polyfills and Babel transforms for features that evergreen browsers support, reducing file size.

It also includes support for the following:

- React/JSX
- TypeScript/TSX
- Imports of CSS files
- CSS Modules (with the recommended `.module.css` or alternative `.icss` file extensions)
- Bundle Tracker (important for Django integration!)
- `CleanWebpackPlugin` (helps avoid filling up your disk and/or crashing Webpack due to too many files.)

## Usage

Install `wright-webpack-config`. You'll also need to install `webpack`, `core-js`, and (if you're using it) `typescript` yourself.

Then, in your `webpack.config.js`:

```js
const config = require("wright-webpack-config").default
const path = require("path")

module.exports = config({
  inDir: path.resolve(__dirname, "js"),
  outDir: path.resolve(__dirname, "myproject", "static", "build"),
})
```

If you're using TypeScript, you'll also want to add the following to your `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "esnext",
    "module": "es2015"
  }
}
```

This stops TypeScript from producing ES3 output unconditionally, instead letting `babel-preset-env` produce the appropriate code for the appropriate browsers. (If you're using Relay, it also prevents TypeScript from munging the names of imported identifiers in a way that prevents Relay from working.)

Then, run `webpack --mode development`, or `webpack --mode production`. **Don't** run `webpack -d` or `webpack -p`, they are **not** shorthand for the above!

### Parameters

- `inDir`: **Required.** Root directory of your frontend code.
- `outDir`: **Required.** Directory to output code to.
- `publicPath`: Path that Webpack output will be available from on the server. Defaults to `/static/build/`.
- `transformConfig`: Function that takes the generated config and potentially makes changes to it.

### Example usage with Django

Install `django-webpack-loader`, then edit your `settings.py`:

```diff
 INSTALLED_APPS = (
     # ...
+    'webpack_loader',
 )

 # ...

+WEBPACK_LOADER = {
+    'evergreen': {
+        'BUNDLE_DIR_NAME': 'build/',
+        'STATS_FILE': os.path.join(STATIC_DIR, 'build',
+                                   '__webpack.evergreen.json'),
+    },
+    'iexplore': {
+        'BUNDLE_DIR_NAME': 'build/',
+        'STATS_FILE': os.path.join(STATIC_DIR, 'build',
+                                   '__webpack.iexplore.json'),
+    },
+}
```

Then, in your templates, add the following:

```django
{% load webpack_loader %}
{# ... #}
{% if 'Trident/' in request.META.HTTP_USER_AGENT %}
    {% render_bundle 'main' config='iexplore' %}
{% else %}
    {% render_bundle 'main' config='evergreen' %}
{% endif %}
```

## License

<p xmlns:dct="http://purl.org/dc/terms/" xmlns:vcard="http://www.w3.org/2001/vcard-rdf/3.0#">
  <a rel="license"
     href="http://creativecommons.org/publicdomain/zero/1.0/">
    <img src="http://i.creativecommons.org/p/zero/1.0/88x31.png" style="border-style: none;" alt="CC0" />
  </a>
  <br />
  To the extent possible under law,
  <span resource="[_:publisher]" rel="dct:publisher">
    <span property="dct:title">Commercial Motor Vehicles Pty Ltd</span></span>
  have waived all copyright and related or neighboring rights to
  <span property="dct:title">cookiecutter-django</span>.
This work is published from:
<span property="vcard:Country" datatype="dct:ISO3166"
      content="AU" about="[_:publisher]">
  Australia</span>.
</p>
