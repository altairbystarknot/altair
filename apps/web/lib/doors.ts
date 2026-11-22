import "server-only";

// Door guards. Each public write goes through ONE database function that checks a secret only this server
// holds (env ALTAIR_GUARD_<NAME>); the database stores only its SHA-256 (app_private_config). One secret per
// door, so a leak opens one door, not all of them. Set by the installer per instance; never in the repo.

export type DoorName = "booking" | "lookup" | "install" | "oauth" | "mcp";

export class DoorNotConfiguredError extends Error {
  constructor(name: DoorName) {
    super(`Door guard ALTAIR_GUARD_${name.toUpperCase()} is not configured`);
    this.name = "DoorNotConfiguredError";
  }
}

export function guard(name: DoorName): string {
  const v = process.env[`ALTAIR_GUARD_${name.toUpperCase()}`] ?? "";
  if (v.length < 32) throw new DoorNotConfiguredError(name);
  return v;
}

export function hasGuard(name: DoorName): boolean {
  return (process.env[`ALTAIR_GUARD_${name.toUpperCase()}`] ?? "").length >= 32;
}
