# Libresomnia

**Libresomnia** is a local-first fork of [Kong/insomnia](https://github.com/Kong/insomnia)
(the "Insomnia API Client", Apache License 2.0). It is not affiliated with Kong Inc.;
"Insomnia" is a trademark of Kong Inc.

Everything that required an insomnia.rest / Kong cloud account, telemetry, or
automatic updates has been removed or replaced with local equivalents. The app
runs 100% offline; the only network traffic is what you explicitly configure
(your API targets, Git remotes, and an optional OpenAI-compatible LLM endpoint).

## What was changed compared to upstream

Based on upstream tag `core@13.4.0`. All changes are maintained as individual
commits on branches `local/<version>` (e.g. `local/13.4.0`). Every modified
source file carries a
`LOCAL BUILD` comment marking it as changed relative to upstream.

### Removed (cloud & telemetry)
- **Telemetry:** Segment analytics, Sentry crash reporting and Customer.io
  product telemetry are removed entirely — SDKs dropped from the dependency
  tree, init code reduced to no-ops, proxy-bypass entries deleted. The
  "Send Anonymous Usage Statistics" setting is gone.
- **Automatic updates** (updates.insomnia.rest) disabled.
- **Cloud login / sign-up surface:** `/auth/login` redirects to the local
  scratchpad; sign-up buttons, "join/create organization", upgrade tips and
  the upstream GitHub star button are removed.
- **Proprietary `@kong/*` plugins** (AI, external-vault) dropped — they were
  only available from Kong's authenticated private npm registry.
- **Kong CI/CD:** the Kong release pipeline, SAST actions and Homebrew tap
  updater were replaced by a single `release.yml` workflow.

### Replaced / added
- **`libresomnia-plugin-ai`** (new workspace package): local AI replacement
  for the proprietary Kong AI plugin. Talks to any OpenAI-compatible
  `/chat/completions` endpoint you configure yourself (Settings → AI,
  "URL" backend). Provides mock-route generation from OpenAPI specs,
  commit-message generation from git diffs, and MCP sampling responses.
  No default endpoint is shipped; nothing is sent anywhere until you
  configure one.
- **Scratchpad (local) organization fully functional:** local and Git
  projects can be created, deleted and used without any session; the
  tutorial panels open real create dialogs instead of "Sign up to …".
- **Rebrand to Libresomnia:** product name, appId `de.backbord.libresomnia`,
  user data folder `Libresomnia` (with one-time migration from
  `~/.config/Insomnia`), deep-link scheme `libresomnia://`, own icons,
  RPM package name `libresomnia`.
- **GitHub Actions release workflow:** publishing a release (tag) builds
  rpm / tar.gz / AppImage (Linux), nsis / zip (Windows) and dmg / zip
  (macOS) and attaches them plus SHA256SUMS to the release. Builds are
  unsigned and un-notarized.

### Unchanged
Everything else — request debugging (REST, GraphQL, gRPC, WebSockets, SSE),
OpenAPI design & import, test suites, Git sync, environments, the plugin
system — is upstream Insomnia, unmodified.

## Building

Requires Node 24+ (`nvmrc`), ~3 GB free RAM for the renderer build:

```shell
npm ci --allow-git=all
cd packages/insomnia
npm run build
USE_HARD_LINKS=false npx electron-builder build --config electron-builder.config.js --linux tar.gz rpm
```

## Acknowledgments

This fork was created using [Hermes Agent](https://hermes-agent.nousresearch.com)
running on the Qwen3.8-Flash-Next model.

## License

[Apache License 2.0](LICENSE) (same as upstream), © Kong Inc. for the
upstream portions. This distribution is an original work based on
Kong/insomnia `core@13.4.0`. Attribution is provided via the [NOTICE](NOTICE)
file (also shipped inside the installed package), and every modified file is
marked with a `LOCAL BUILD` comment as required under section 4(b) of the
license.
