#!/usr/bin/env node
/**
 * Stubs out react-native virtualview components that fail to parse with old-arch
 * babel codegen (RN 0.76+). Runs as eas-build-post-install hook.
 */
const fs = require("fs");
const path = require("path");

const stub = "module.exports = {};\n";

const searchRoots = [
  path.resolve(__dirname, "../../node_modules"),
  path.resolve(__dirname, "../node_modules"),
];

for (const root of searchRoots) {
  const dir = path.join(root, "react-native/src/private/components/virtualview");
  if (!fs.existsSync(dir)) continue;
  for (const file of fs.readdirSync(dir)) {
    if (!file.endsWith(".js")) continue;
    const filePath = path.join(dir, file);
    console.log(`Stubbing ${filePath}`);
    fs.writeFileSync(filePath, stub);
  }
}
