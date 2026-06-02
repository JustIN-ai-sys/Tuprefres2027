---
name: pnpm phantom variant fix
description: Installing a new package mid-session can create an incomplete @expo/cli peer-variant directory that crashes Metro.
---

## Rule
If Metro crashes with `Cannot find module '@expo/metro/...'` and the path contains a hash that doesn't exist in `node_modules/.pnpm`, create a symlink pointing that phantom hash to the nearest same-version complete variant.

**Why:** pnpm creates per-peer-set variants of packages. If an install changes the peer graph mid-session and the new variant directory is never fully written (e.g. process interrupted), Metro loads from a dangling path.

**How to apply:**
1. `ls node_modules/.pnpm | grep "@expo+cli@54"` — find the existing complete variants.
2. `ln -s $(pwd)/<complete-variant> $(pwd)/<phantom-variant>` — create the missing symlink.
3. Restart the mobile workflow.
