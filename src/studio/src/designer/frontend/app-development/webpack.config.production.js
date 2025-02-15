const TerserPlugin = require('terser-webpack-plugin');
const commonConfig = require('./webpack.common');

module.exports = {
  ...commonConfig,
  mode: 'production',
  devtool: false,
  performance: {
    hints: false,
  },
  optimization: {
    ...commonConfig.optimization,
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
      }),
    ],
  },
  module: {
    rules: [
      ...commonConfig.module.rules,
      {
        test: /\.tsx?/,
        use: [
          {
            loader: 'ts-loader',
          },
        ],
      },
    ],
  },
};
