# Altair at the Dojo AI Hackathon (Nov 20–22, 2026)

**Track:** Build for Business · **Platform:** Web · **Built with:** Claude Code (Claude Opus) as the main
AI coding tool, directed by Starknot's founder.

## The problem

Small tourism businesses (private transfers, tours) sell through WhatsApp, spreadsheets and generic
booking plugins that do not understand zones, vehicles, seats or hotel pickups. The owner spends the day
quoting by hand, and every price is a guess.

## What Altair is

Altair gives each tourism business its own booking system: a branded booking website with two pricing
engines (private transfers priced by zone and vehicle; activities by date, time and seats), an operations
panel for the team, and a secure connector so the owner can run the business from **their own Claude**
(drafts that a person approves; Claude never touches money). Each business gets its own isolated
database, site and domain — no data is shared between businesses.

## State before the hackathon (documented as the rules ask)

- Starknot's founder had years of experience building custom booking sites for real tourism operators.
  That know-how, and some UI patterns and code from Starknot's own earlier work (reused by its author),
  informed Altair.
- There was **no Altair code** before November 20: no repository, no database, no product site.

## Built during the hackathon (Nov 20–22)

- Architecture and security model: one dedicated instance per business; Row Level Security with explicit
  grants on every table; guarded `SECURITY DEFINER` database doors with per-door secrets; two-step
  sign-in (aal2) for every staff action; 272 database access checks run in two grant modes.
- The business instance (`apps/web`): public booking site (Spanish/English), transfer engine with map
  search and road routes (OpenStreetMap), activity engine with calendar and seats, cart and booking
  receipts; the owner's panel (bookings, dispatch, suppliers, rates, activities, payments, team, site and
  brand, Excel import); the guided setup wizard; the remote MCP connector with OAuth 2.1 so the owner's
  own Claude can query and prepare drafts.
- Altair's own site (`apps/hub`): bilingual product site with a live WebGL hero, the sign-up request and
  Starknot's approval console.
- Tests: unit tests (Vitest), database access tests, server-action gate checks, production builds.

## How to try it

See **README.md → Live demo** for the links and the demo access.
