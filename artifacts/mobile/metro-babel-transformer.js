const upstreamTransformer = require("@expo/metro-config/build/babel-transformer");

module.exports = {
  ...upstreamTransformer,
  transform(props) {
    // Skip babel codegen for all virtualview components that break old-arch Flow codegen (RN 0.76+)
    if (props.filename.includes("/react-native/src/private/components/virtualview/")) {
      return { code: "module.exports = {};", map: { version: 3, sources: [], mappings: "" } };
    }
    return upstreamTransformer.transform(props);
  },
};
