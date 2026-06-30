#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const STUB = "module.exports = {};\n";

// __dirname = <repo>/artifacts/mobile/scripts
// Try all likely node_modules locations in the EAS monorepo layout
const searchRoots = [
  path.resolve(__dirname, "../../../node_modules"), // repo root (EAS: /workingdir/build/node_modules)
  path.resolve(__dirname, "../../node_modules"),    // artifacts/node_modules
  path.resolve(__dirname, "../node_modules"),       // artifacts/mobile/node_modules
];

let count = 0;
for (const root of searchRoots) {
  const privateDir = path.join(root, "react-native/src/private");
  if (!fs.existsSync(privateDir)) continue;

  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { walk(full); continue; }
      if (!entry.name.endsWith(".js")) continue;
      fs.writeFileSync(full, STUB);
      console.log("stubbed:", full);
      count++;
    }
  };
  walk(privateDir);
}

console.log(`Done — ${count} files stubbed.`);
