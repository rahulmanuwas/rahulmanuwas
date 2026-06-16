# CLAUDE.md

Guidance for Claude Code (claude.ai/code) when working in this repository.

## What this repo is

This is the GitHub **profile repository** (`rahulmanuwas/rahulmanuwas`). Because
the repo name matches the username, its `README.md` renders on the GitHub
profile page at https://github.com/rahulmanuwas.

## Structure

- `README.md` — the profile page shown on GitHub. Keep it tight and current.
- `github-metrics.svg` — generated stats image embedded in the README.
- `.github/workflows/metrics.yml` — GitHub Action that regenerates
  `github-metrics.svg` nightly (03:00 UTC) via `lowlighter/metrics`.

## Maintenance notes

- `github-metrics.svg` is **generated** — don't hand-edit it except as a quick
  stopgap; the next workflow run overwrites it. To refresh on demand, run the
  "Metrics" workflow manually (Actions tab → Run workflow).
- The workflow needs a `METRICS_TOKEN` repo secret: a **classic** GitHub PAT
  with `repo` and `read:org` scopes (fine-grained tokens break several plugins).
- `plugin_activity` and `plugin_achievements` are intentionally disabled — the
  achievements plugin is broken upstream (lowlighter/metrics#1479). Don't
  re-enable them unless that bug is fixed.
