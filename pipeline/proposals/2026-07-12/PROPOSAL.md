# KB Refresh Proposal — 2026-07-12

Abbreviated validation cycle (discovery capped at 10 candidates, per
pipeline/REFRESH.md). All proposals parse-checked against `dist/kb.js
loadKb`. Human: review below, move accepted files to
`kb/<category-dir>/<name>.yaml` (strip the `<dir>--` prefix), then run
`npm test && npm run eval` before committing.

## New (5)

| File | Category | Evidence (verified 2026-07-12) | Source |
|---|---|---|---|
| tools--polar.yaml | tool | Apache-2.0, 10k stars, release @polar-sh/checkout 0.4.0 on 2026-07-02; OSS merchant-of-record vs raw Stripe default | [polarsource/polar](https://github.com/polarsource/polar) |
| tools--unkey.yaml | tool | AGPL self-hostable, 5.4k stars, release "frontline 1.0.7" 2026-07-10; replaces hand-rolled api_keys + rate limiter | [unkeyed/unkey](https://github.com/unkeyed/unkey) |
| tools--novu.yaml | tool | MIT core, 39.3k stars, v3.18.0 released 2026-07-08; unified notification layer vs inline nodemailer wiring | [novuhq/novu](https://github.com/novuhq/novu) |
| tools--mailpit.yaml | tool | MIT, 9.8k stars, v1.30.4 released 2026-07-09; maintained successor to unmaintained MailHog | [axllent/mailpit](https://github.com/axllent/mailpit) |
| mcps--chrome-devtools-mcp.yaml | mcp | Google-maintained, 46.7k stars, v1.5.0 released 2026-07-03; official DevTools bridge models don't know exists | [ChromeDevTools/chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp) |

## Updated (0)

`npm run stale -- --days 60` unavailable (scripts/stale.ts missing);
manual check instead: all 49 kb entries have `last_verified: "2026-07-11"`
— nothing older than 60 days, no re-verification updates needed.

## Flagged dead/changed (0)

None.

## Rejected candidates (5 of 10 examined)

| Candidate | Reason |
|---|---|
| DesktopCommanderMCP (GitHub trending TS #1) | Out of v1 web-app scope: general desktop/terminal control |
| OmniRoute (trending) | Launch-week trending AI gateway, no adoption signal beyond launch |
| astryx (trending) | Launch-day design system, unproven; shadcn-ui already covers the slot |
| orca (trending) | Agent-fleet ADE, not a web-app build tool; out of scope |
| page-agent (trending) | Brand-new in-page GUI agent, no adoption signal yet |

## Notes for next run

- `mcp.so` returns 403 to automated fetch; use PulseMCP
  (https://www.pulsemcp.com/servers) as the scriptable MCP registry.
- `scripts/stale.ts` is declared in package.json but missing — consider
  adding it (separate change, not part of this proposal).
