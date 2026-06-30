const upstreamTransformer = require("@expo/metro-config/build/babel-transformer");

module.exports = {
  ...upstreamTransformer,
  transform(props) {
    // Skip babel codegen for experimental new-arch component that breaks old-arch (RN 0.76+)
    if (props.filename.includes("VirtualViewExperimentalNativeComponent")) {
      return { code: "module.exports = {};", map: { version: 3, sources: [], mappings: "" } };
    }
    return upstreamTransformer.transform(props);
  },
};
