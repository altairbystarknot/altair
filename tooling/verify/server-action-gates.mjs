#!/usr/bin/env node
// SERVER-ACTION GATE CHECK.
//
// Every exported function in a "use server" file is a public HTTP endpoint: anyone can call it with any
// arguments, whatever the UI shows. So each one must call requireStaff(...) itself. This check parses
// every .ts/.tsx file of apps/web with the TypeScript compiler and fails when:
//   * an exported server action does not call requireStaff (unless allow-listed below with a reason);
//   * a "use server" file exports something other than an async function declaration (arrow functions
//     and re-exports hide from this check, so they are not allowed);
//   * a "use server" directive appears inside a function (inline actions are not allowed: they are
//     harder to audit).
//
// Usage: npm run verify:gates

import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const ts = require("typescript");

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const SCAN = [path.join(ROOT, "apps", "web", "app"), path.join(ROOT, "apps", "web", "lib")];

/** Actions that run before a staff session exists. Every entry needs a reason. */
export const ALLOW = {
  "apps/web/app/(auth)/actions.ts": {
    login: "signs the user in; there is no session yet",
    submitChallenge: "second factor at sign-in; the session is aal1 by definition",
    submitEnrollment: "first second-factor activation; the session is aal1 by definition",
    logout: "ends the session; harmless without one",
    claimInstance: "the business owner claims a NEW instance; no staff exists yet; the instance_claim door checks the one-time install token",
    acceptInvite: "a person accepts the owner's invitation; not staff yet; the staff_invite_accept door checks the token and the email",
  },
};

function isUseServer(node) {
  return ts.isExpressionStatement(node) && ts.isStringLiteral(node.expression) && node.expression.text === "use server";
}

function hasModifier(node, kind) {
  return Boolean(node.modifiers?.some((m) => m.kind === kind));
}

function callsRequireStaff(body) {
  let found = false;
  const visit = (n) => {
    if (found) return;
    if (ts.isCallExpression(n) && ts.isIdentifier(n.expression) && n.expression.text === "requireStaff") {
      found = true;
      return;
    }
    ts.forEachChild(n, visit);
  };
  visit(body);
  return found;
}

/** Check one file's source. Returns a list of human-readable problems. */
export function checkSource(relPath, text, allow = ALLOW) {
  const sf = ts.createSourceFile(relPath, text, ts.ScriptTarget.Latest, true, relPath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const problems = [];
  const fileIsServer = sf.statements.length > 0 && isUseServer(sf.statements[0]);

  // Inline "use server" inside any function body.
  const visit = (n) => {
    if ((ts.isFunctionDeclaration(n) || ts.isFunctionExpression(n) || ts.isArrowFunction(n) || ts.isMethodDeclaration(n)) && n.body && ts.isBlock(n.body)) {
      const first = n.body.statements[0];
      if (first && isUseServer(first)) problems.push(`${relPath}: inline "use server" inside a function is not allowed; move it to a "use server" file`);
    }
    ts.forEachChild(n, visit);
  };
  visit(sf);

  if (!fileIsServer) return problems;

  const allowed = allow[relPath.replaceAll("\\", "/")] ?? {};
  for (const st of sf.statements.slice(1)) {
    const exported = hasModifier(st, ts.SyntaxKind.ExportKeyword);
    if (ts.isFunctionDeclaration(st) && exported) {
      const name = st.name?.text ?? "(anonymous)";
      if (!hasModifier(st, ts.SyntaxKind.AsyncKeyword)) problems.push(`${relPath}: ${name} must be async`);
      if (allowed[name]) continue;
      if (!st.body || !callsRequireStaff(st.body)) problems.push(`${relPath}: server action ${name} does not call requireStaff()`);
      continue;
    }
    if (exported && (ts.isVariableStatement(st) || ts.isClassDeclaration(st))) {
      problems.push(`${relPath}: "use server" files may only export async function declarations`);
    }
    if (ts.isExportDeclaration(st) && !st.isTypeOnly) {
      problems.push(`${relPath}: re-exports from a "use server" file are not allowed`);
    }
    if (ts.isExportAssignment(st)) {
      problems.push(`${relPath}: default exports from a "use server" file are not allowed`);
    }
  }
  return problems;
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (entry === "node_modules" || entry === ".next") continue;
    const p = path.join(dir, entry);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(entry) && !/\.test\.(ts|tsx)$/.test(entry)) out.push(p);
  }
  return out;
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const problems = [];
  let actions = 0;
  for (const file of SCAN.flatMap((d) => walk(d))) {
    const rel = path.relative(ROOT, file).replaceAll("\\", "/");
    const text = readFileSync(file, "utf8");
    if (/^\s*["']use server["']/.test(text)) actions++;
    problems.push(...checkSource(rel, text));
  }
  if (problems.length) {
    console.error(problems.map((p) => `GATE  ${p}`).join("\n"));
    console.error(`\n${problems.length} problem(s). Every server action must call requireStaff() (see tooling/verify/server-action-gates.mjs).`);
    process.exit(1);
  }
  console.log(`Server-action gates OK (${actions} "use server" file(s) checked).`);
}
