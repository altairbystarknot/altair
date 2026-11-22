# Altair by Starknot

**The booking system for tourism businesses, run from your own Claude.**

Altair gives each private-transfer and tour company its own booking system: a branded booking website with
two pricing engines (transfers by zone and vehicle; activities by date, time and seats), an operations panel
for the team, and a secure connector so the owner can run the business from **their own Claude**. Each
business gets its own isolated database, site and domain. Claude only prepares drafts that a person
approves, and never touches money.

> **Proprietary software.** This repository is published for evaluation only — see [LICENSE](LICENSE).
> Altair's core (pricing and booking engine, money rules and database design) lives in a private repository
> and is available only under a commercial agreement with [Starknot](https://www.starknot.co/en).

## Live demo

| | |
|---|---|
| Altair (product site, request form) | https://altair-hub.vercel.app |
| Demo business "Costa Brisa (demo)" (booking site, sample data) | https://altair-demo.vercel.app |
| Demo business panel | https://altair-demo.vercel.app/login (judge access is in the hackathon submission) |
| Claude connector (MCP, OAuth 2.1) | `https://altair-demo.vercel.app/mcp` (add it in Claude → Settings → Connectors) |

Hackathon notes (state before the event and what was built during it): [HACKATHON.md](HACKATHON.md).

## Architecture

- **One dedicated instance per business**: its own Supabase project, Vercel project and domain. Isolation is
  physical: no business id column, no shared database, so no query can ever reach another business's data.
- **Security**: Row Level Security with explicit grants on every table; the public never writes tables
  directly (guarded `SECURITY DEFINER` doors, one secret per door, only its SHA-256 stored); every staff
  action requires two-step sign-in (aal2) and the person's current role; the server recomputes every price.
- **Claude**: a remote MCP server with OAuth 2.1 (PKCE, rotating refresh tokens). Each tool is a thin wrapper
  over one guarded database door; scope and role are checked in the database; every call is logged; catalog
  changes are drafts a person publishes. Altair never calls an AI model and never stores Claude credentials.
- **Stack**: Next.js 16, React 19, TypeScript, Tailwind v4, Supabase (Postgres, Auth, Storage), OpenStreetMap
  (Photon search, OSRM routes), three.js / React Three Fiber, Lenis, Vitest.

## In this repository

| Path | What it is |
|---|---|
| `apps/web/` | One business's instance (Next.js 16): public site, sign-in, panel, API, Claude connector (`/mcp`) and OAuth |
| `apps/hub/` | Altair's own site: product pages, sign-up request and Starknot's approval console |
| `packages/config/` | Contracts: business settings, site, catalog drafts, sample data |
| `packages/ui/` | Altair design system (CSS and components) |
| `tooling/` | Static checks and development helpers |
| `design/` | Design canvas source |
| `docs/` | Documentation (Spanish) |
| `core/` | **Not included** — Starknot's private core (pricing and booking engine, money rules, database, its tests) |

Without the private core this repository does not build; use the live demo to try Altair.

Built with Claude Code. © 2026 Starknot. All rights reserved.
