"use strict";
const path = require("path");
const WebpackNotifierPlugin = require("webpack-notifier");
const BrowserSyncPlugin = require("browser-sync-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
module.exports = {
  entry: {
    "react-twilio-chat": "./src/pages/index.js"
  },
  output: {
    path: path.resolve(__dirname, "./bundle"),
    filename: "[name]-bundle.js",
    publicPath: "/"
  },
  resolve: {
    alias: {
      src: path.resolve(__dirname, "src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@libs": path.resolve(__dirname, "./src/libs")
    }
  },
  optimization: {
    splitChunks: {
      automaticNameDelimiter: "-",
      cacheGroups: {
        commons: {
          test: /[\\/]node_modules[\\/]/,
          name: "vendors",
          chunks: "all"
        }
      }
    }
  },
  module: {
    rules: [
      {
        test: /\.jsx|js$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env", "@babel/preset-react"],
            plugins: ["@babel/plugin-proposal-object-rest-spread"]
          }
        }
      },
      {
        test: /\.css$/,
        use: ["style-loader", "css-loader"]
      },
      {
        test: /\.scss$/,
        use: [
          "style-loader", // creates style nodes from JS strings
          "css-loader", // translates CSS into CommonJS
          "sass-loader" // compiles Sass to CSS, using Node Sass by default
        ]
      },
      {
        test: /\.(woff(2)?|ttf|eot|png|jpe?g|svg)(\?v=\d+\.\d+\.\d+)?$/,
        use: [
          {
            loader: "file-loader",
            options: {
              name: "[name].[ext]",
              outputPath: "fonts/"
            }
          }
        ]
      }
    ]
  },
  externals: {
    fs: "{}",
    tls: "{}",
    net: "{}",
    console: "{}"
  },
  plugins: [new WebpackNotifierPlugin(), new BrowserSyncPlugin()]
};
