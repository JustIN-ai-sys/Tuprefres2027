const upstreamTransformer = require("@expo/metro-config/build/babel-transformer");

const STUB = { code: "module.exports = {};", map: { version: 3, sources: [], mappings: "" } };

// RN 0.81 private spec files break @react-native/babel-plugin-codegen — stub them all.
function isPrivateRNSpec(filename) {
  return (
    filename.includes("react-native/src/private/") ||
    filename.includes("react-native\\src\\private\\")
  );
}

module.exports = {
  ...upstreamTransformer,
  transform(props) {
    if (isPrivateRNSpec(props.filename)) return STUB;
    try {
      return upstreamTransformer.transform(props);
    } catch (e) {
      // Catch any remaining codegen failures from @react-native/babel-plugin-codegen
      if (
        e.message &&
        (e.message.includes("Unable to determine event arguments") ||
          e.message.includes("Unknown property type") ||
          e.message.includes("@react-native/codegen") ||
          (e.stack && e.stack.includes("babel-plugin-codegen")))
      ) {
        return STUB;
      }
      throw e;
    }
  },
};
