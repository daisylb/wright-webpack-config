var path = require("path")
var webpack = require("webpack")
var BundleTracker = require("webpack-bundle-tracker")
var CleanWebpackPlugin = require("clean-webpack-plugin")
import { Configuration, Options } from 'webpack'

const EVERGREEN = "evergreen"
const IEXPLORE = "iexplore"
type Browser = typeof EVERGREEN | typeof IEXPLORE

type Params = {
  inDir?: string,
  outDir: string,
  publicPath?: string,
  transformConfig?: (config: Configuration, browser: Browser) => Configuration
}

/// The defaults that are used if a parameter isn't specified.
const defaults = {
  inDir: 'frontend/',
  publicPath: '/static/build/',
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
      loader: "babel-loader",
      options: {
        presets: [
          [
            "env",
            {
              targets: {
                browsers:
                  browser == IEXPLORE
                    // We only support IE 11.
                    ? "ie>=11"
                    // Opera Mini is so far behind everything else, and is
                    // almost certainly not going to be used for our projects.
                    // I'm not sure why I can't just do "not ie all", but it
                    // seems I can't.
                    : [">1%", "not ie <999", "not op_mini all"],
              },
            },
          ],
          "react",
        ],
      },
    }

    // This is the actual config we give Webpack.
    const config = {
      name: browser,
      // We include babel-polyfill before all our application code, on IE only.
      // This means that features that require more than just syntax transforms
      // will need to be supported by every supported browser that isn't IE;
      // in practice this doesn't seem to be a problem.
      entry: browser == IEXPLORE ? ["babel-polyfill", "./js"] : "./js",
      output: {
        path: params.outDir,
        filename: `[chunkhash].${browser}.js`,
        publicPath: params.publicPath,
      },
      plugins: [
        new BundleTracker({
          filename: path.resolve(params.outDir, `__webpack.${browser}.json`),
        }),
        new CleanWebpackPlugin([
          path.resolve(params.outDir, `*.${browser}.*`),
        ]),
      ],
      module: {
        rules: [
          {
            test: /\.js$/,
            // node_modules should contain code that already runs in browsers
            // the project in question is supposed to be compatible with.
            exclude: /node_modules/,
            use: babelConfig,
          },
          {
            test: /\.tsx?$/,
            exclude: /node_modules/,
            // By configuring TypeScript to output modern JS, then running it
            // through Babel, we get modern JS or IE-compatible JS just as with
            // JS input.
            use: [babelConfig, "ts-loader"],
          },
          {
            test: /\.css$/,
            use: ["style-loader", "css-loader"],
            // It seems to be annoyingly common for NPM packages to import CSS
            // themselves, so we don't exclude node_modules here.
          },
        ],
      },
      resolve: {
        // If there's pre-minified code, use that first.
        extensions: [".min.js", ".js", ".ts", ".tsx"],
      },
      // The current type definition for Webpack is missing 'module-source-map',
      // but this seems to keep TypeScript happy somehow.
      devtool: "module-source-map" as Options.Devtool,
    }
    if (params.transformConfig) return params.transformConfig(config, browser)
    return config
  }
  return [configMaker(EVERGREEN), configMaker(IEXPLORE)]
}
