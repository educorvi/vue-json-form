const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const plugins = [];
if (process.env.ANALYZE === "true") {
  plugins.push(new BundleAnalyzerPlugin({analyzerHost: "0.0.0.0"}));
}


module.exports = {
  devServer: {
    disableHostCheck: true
  },
  publicPath: '',
  configureWebpack: {
    plugins
  }
};
