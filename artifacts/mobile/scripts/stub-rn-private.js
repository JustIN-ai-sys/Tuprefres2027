#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const STUB = "module.exports = {};\n";

function stubPrivateDir(rnPackageJson) {
  const rnRoot = path.dirname(rnPackageJson);
  const privateDir = path.join(rnRoot, "src/private");
  if (!fs.existsSync(privateDir)) {
    console.log("No src/private found at:", privateDir);
    return 0;
  }
  let count = 0;
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      if (!entry.name.endsWith(".js")) continue;
      fs.writeFileSync(full, STUB);
      count++;
    }
  };
  walk(privateDir);
  console.log(`Stubbed ${count} files in ${privateDir}`);
  return count;
}

// Resolve all react-native installations using Node module resolution
const searchFrom = [
  __dirname,
  path.resolve(__dirname, ".."),
  path.resolve(__dirname, "../.."),
  path.resolve(__dirname, "../../.."),
];

const seen = new Set();
let total = 0;
for (const from of searchFrom) {
  try {
    const resolved = require.resolve("react-native/package.json", { paths: [from] });
    if (seen.has(resolved)) continue;
    seen.add(resolved);
    console.log("Found react-native at:", resolved);
    total += stubPrivateDir(resolved);
  } catch (_) {}
}

console.log(`Done — ${total} files stubbed total.`);
