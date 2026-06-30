const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Catch-all: stub any native spec file that fails @react-native/babel-plugin-codegen (RN 0.81+)
config.transformer.babelTransformerPath = require.resolve("./metro-babel-transformer.js");

module.exports = config;
