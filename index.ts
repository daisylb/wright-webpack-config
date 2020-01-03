var path = require("path")
var process = require("process")
var BundleTracker = require("webpack-bundle-tracker")
var CleanWebpackPlugin = require("clean-webpack-plugin")
import { Configuration, Options } from "webpack"

const EVERGREEN = "evergreen"
const IEXPLORE = "iexplore"
type Browser = typeof EVERGREEN | typeof IEXPLORE

type Params = {
  inDir?: string
  outDir: string
  publicPath?: string
  transformConfig?: (config: Configuration, browser: Browser) => Configuration
}

/// The defaults that are used if a parameter isn't specified.
const defaults = {
  publicPath: "/static/build/",
}

export default function makeConfig(p: Params): Configuration[] {
  // Use defaults if they're not overriden by the params object.
  const params = Object.assign({}, defaults, p)

  // This function takes a browser name, and returns a Webpack config for that
  // browser. We're doing it this way because it lets us define a single config
  // with conditional expressions in it for where the browsers differ, which is
  // easier to read than some sort of copy-and-override structure.
  const configMaker = (browser: Browser) => {
    // The Babel configuration is split out because it's used twice (see below).
    const babelConfig = {
      loader: "wright-webpack-config/node_modules/babel-loader",
      options: {
        presets: [
          [
            "wright-webpack-config/node_modules/@babel/preset-env",
            {
              targets: {
                browsers:
                  browser == IEXPLORE
                    ? // We only support IE 11.
                      "ie>=11"
                    : // Opera Mini is so far behind everything else, and is
                      // almost certainly not going to be used for our projects.
                      // I'm not sure why I can't just do "not ie all", but it
                      // seems I can't.
                      [">1%", "not ie <999", "not op_mini all"],
              },
              corejs: "3.6.1",
              useBuiltIns: "entry",
            },
          ],
          "wright-webpack-config/node_modules/@babel/preset-react",
        ],
        plugins: ["wright-webpack-config/node_modules/@babel/plugin-syntax-dynamic-import"],
      },
    }

    // This is the actual config we give Webpack.
    const config: Configuration = {
      name: browser,
      // We include corejs/stable before all our application code, on IE only.
      // This means that features that require more than just syntax transforms
      // will need to be supported by every supported browser that isn't IE;
      // in practice this doesn't seem to be a problem.
      entry: ["wright-webpack-config/in-browser/entry.js", "./js"],
      output: {
        path: params.outDir,
        filename: `[chunkhash].${browser}.js`,
        publicPath: params.publicPath,
      },
      plugins: [
        new BundleTracker({
          // BundleTracker has a bug where it effectively calls
          // path.resolve('.', filename)
          // so we have to give it a CWD-relative path.
          filename: path.relative(
            process.cwd(),
            path.resolve(params.outDir, `__webpack.${browser}.json`),
          ),
        }),
        new CleanWebpackPlugin(
          [path.resolve(params.outDir, `*.${browser}.*`)],
          // we can't use watch: true atm, because there seems to be a bug where
          // (at a guess) Webpack is not rewriting a bundle in watch mode
          // because it hasn't changed, and this plugin is deleting it
          { root: process.cwd(), exclude: [`__webpack.${browser}.json`] },
        ),
      ],
      module: {
        rules: [
          {
            test: /\.js$/,
            // node_modules should contain code that already runs in browsers
            // the project in question is supposed to be compatible with.
            // We need to include wright-webpack-config, though, because we want
            // @babel/preset-env's useBuiltIns feature to process the
            // @babel/polyfill import there.
            exclude: /node_modules(?!\/wright-webpack-config)/,
            use: babelConfig,
          },
          {
            test: /\.tsx?$/,
            exclude: /node_modules/,
            // By configuring TypeScript to output modern JS, then running it
            // through Babel, we get modern JS or IE-compatible JS just as with
            // JS input.
            use: [babelConfig, "wright-webpack-config/node_modules/ts-loader"],
          },
          {
            test: /\.module\.css$|\.icss$/,
            use: [
              "wright-webpack-config/node_modules/style-loader",
              { loader: "wright-webpack-config/node_modules/css-loader", options: { modules: true } },
            ],
          },
          {
            test: /(?<!\.module)\.css$/,
            use: ["wright-webpack-config/node_modules/style-loader", "wright-webpack-config/node_modules/css-loader"],
            // It seems to be annoyingly common for NPM packages to import CSS
            // themselves, so we don't exclude node_modules here.
          },
        ],
      },
      resolve: {
        // If there's pre-minified code, use that first.
        extensions: [".mjs", ".min.js", ".js", ".ts", ".tsx"],
      },
      // The current type definition for Webpack is missing 'module-source-map',
      // but this seems to keep TypeScript happy somehow.
      devtool: "source-map",
    }
    if (params.transformConfig) return params.transformConfig(config, browser)
    return config
  }
  return [configMaker(EVERGREEN), configMaker(IEXPLORE)]
}
