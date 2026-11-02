# Third-party notices

Chánh Điện Tịnh Tâm Desktop bundles Electron (MIT) and the Node.js live server
with its runtime dependencies. Their license texts are distributed with the
corresponding files in the application bundle. In particular:

| Dependency | License | Project |
|---|---|---|
| Electron | MIT | https://github.com/electron/electron |
| `msedge-tts` 2.1.1 | MIT | https://www.npmjs.com/package/msedge-tts |
| `tiktok-live-connector` 2.5.0 | AGPL-3.0-only | https://github.com/zerodytrash/TikTok-Live-Connector |
| `ws` 8.18.0 | MIT | https://github.com/websockets/ws |

The live server uses `tiktok-live-connector`, which is licensed under the GNU
AGPL version 3 only. The source is available at the project URL above. Review
that license and its obligations before redistributing builds or modifying
the connector. Transitive runtime package notices are preserved in the
bundled `live/node_modules` tree.

Build-only tools are not included as runtime dependencies: `electron-builder`
is MIT licensed and Playwright (used by packaged smoke checks) is Apache-2.0.
