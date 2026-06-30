const upstreamTransformer = require("@expo/metro-config/build/babel-transformer");

module.exports = {
  ...upstreamTransformer,
  transform(props) {
    try {
      return upstreamTransformer.transform(props);
    } catch (e) {
      // @react-native/babel-plugin-codegen fails on RN 0.81 native spec files
      // when event argument types can't be determined. Safe to stub — these
      // files are native-side specs not called directly from JS app code.
      if (e.message && e.message.includes("Unable to determine event arguments")) {
        return { code: "module.exports = {};", map: { version: 3, sources: [], mappings: "" } };
      }
      throw e;
    }
  },
};
