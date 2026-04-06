---
name: build-control-ui
description: "Rebuild the Control UI if missing after an OpenClaw update"
---

# build-control-ui

Checks on gateway startup whether `dist/control-ui/index.html` exists inside
the installed OpenClaw package. If it's missing (e.g. after an `openclaw update`),
clones the matching source tag, builds the UI with pnpm, and copies the output
into the package directory.

Runs silently if the UI is already present.
