# dsh-plugin-evidence-gate

**At task end, show requirement → evidence → verdict line by line. No test result, file diff or cited source means not done — model claims do not count.**

This is one of 14 read-only observability plugins for the DSH agent lifecycle (theme: **Evidence Acceptance Gate**). It reads only metadata from session events — never prompts, tool bodies, or file contents — and makes no network calls.

## Install

```powershell
dsh plugin --profile web add dsh-plugin-evidence-gate
```

Requires Node `^22.19.0 || >=24` and DSH `>=0.2.0-rc.2 <0.3.0`.

## 30-second demo

1. Use DSH normally for a few turns.
2. In any session, type `/evidence-gate`.
3. You get a compact, read-only report; use `/evidence-gate --json` for machine-readable output.

```text
[evidence-gate] 2 strong / 0 weak evidence · 0 completion claim(s) · EVIDENCED
  ✓ tool/result
  ✓ tool/result
```

## What it reads

Session event metadata only: event types, tool names, token counts, and route names. Credential-looking values are redacted before display. No file contents or prompts are read, stored, or transmitted.

## License

MIT — SSHOOTING.
