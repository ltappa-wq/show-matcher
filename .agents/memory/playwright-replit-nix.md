---
name: Playwright on Replit Nix
description: Environment requirements for repeatable Playwright browser validation in this Replit project.
---

Playwright's npm package alone is not enough to run Chromium in this Replit Nix environment. Keep browser installation repeatable and ensure the native Chromium runtime libraries are declared in the project environment.

**Why:** Chromium launch failed first because the headless binary was absent, then because GLib, GBM, keyboard-common, and ALSA libraries were unavailable.

**How to apply:** When changing Playwright versions or validation setup, verify both browser installation and native library availability with a clean browser launch before diagnosing test assertions.

Playwright starts its configured `webServer` before `globalSetup`.

**Why:** A room-lifecycle fixture written in `globalSetup` was loaded too late; the already-running server had empty in-memory state and overwrote the fixture on its next save.

**How to apply:** When server startup must consume seeded files, create them in the `webServer.command` before launching the server. Reserve `globalSetup` for preparation the running server does not need at import time.