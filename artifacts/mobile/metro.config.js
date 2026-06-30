const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Stub out experimental new-arch component that breaks old-arch Flow codegen (RN 0.76+)
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.includes("VirtualViewExperimentalNativeComponent")) {
    return { type: "empty" };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
