---
name: React version pinning
description: Any non-Expo dep can pull a newer React and break the "Invalid hook call" error due to duplicate React instances.
---

## Rule
After installing any package in this monorepo, verify `ls node_modules/.pnpm | grep "^react@"` shows only one version.

**Why:** `html-to-image` (and other non-Expo packages) list `react` as a peer dep with a loose range. pnpm resolves it to the latest matching version, creating a second React copy. Expo requires exactly `react@19.1.0`. Two React instances cause "Invalid hook call" at runtime.

**How to apply:** `pnpm-workspace.yaml` → `overrides:` section now pins `react: "19.1.0"` and `react-dom: "19.1.0"`. This forces all transitive deps to use the same instance.
