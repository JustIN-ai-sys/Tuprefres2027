const { getDefaultConfig } = require("expo/metro-config");
const exclusionList = require("metro-config/src/defaults/exclusionList");

const config = getDefaultConfig(__dirname);

// Exclude experimental new-arch component that breaks old-arch Flow codegen (RN 0.76+)
config.resolver.blockList = exclusionList([
  /.*\/react-native\/src\/private\/components\/virtualview\/.*/,
]);

module.exports = config;
