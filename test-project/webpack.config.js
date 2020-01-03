const config = require("wright-webpack-config").default
const path = require("path")

module.exports = config({
  inDir: path.resolve(__dirname, "index.js"),
  outDir: path.resolve(__dirname, "myproject", "static", "build"),
})
