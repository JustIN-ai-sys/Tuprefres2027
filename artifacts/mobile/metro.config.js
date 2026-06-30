const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Custom transformer: skips babel codegen for virtualview files (RN 0.76+ new-arch only)
config.transformer.babelTransformerPath = require.resolve("./metro-babel-transformer.js");

// Double safety: resolve-level stub for virtualview modules (catches relative imports)
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const result = context.resolveRequest(context, moduleName, platform);
  if (
    result &&
    result.type === "sourceFile" &&
    result.filePath &&
    result.filePath.includes("components/virtualview/")
  ) {
    return { type: "empty" };
  }
  return result;
};

module.exports = config;
