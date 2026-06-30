const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Custom transformer that skips babel codegen for experimental new-arch component (RN 0.76+)
config.transformer.babelTransformerPath = require.resolve("./metro-babel-transformer.js");

module.exports = config;
