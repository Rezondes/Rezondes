// Prüft die Inhalte der Seite: node tools/check.mjs
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const root = new URL("../", import.meta.url);
const projects = JSON.parse(readFileSync(new URL("projects.json", root), "utf8"));

assert.deepEqual(
  projects.map(p => p.name),
  ["SurvivorsForge", "OpenVoiceSpeak", "RezondesStreamTools", "PersonalEinsatzPlanung", "ClaudeDeck", "Rezondes Enhanced Arma"],
  "Reihenfolge der Projekte",
);

for (const p of projects) {
  assert.match(p.repo, /^https:\/\/github\.com\//, `${p.name}: repo`);
  if (p.url !== undefined) assert.match(p.url, /^https:\/\//, `${p.name}: url`);
  assert.ok(Array.isArray(p.stack) && p.stack.length, `${p.name}: stack`);
  assert.ok(p.status, `${p.name}: status`);
  assert.ok(p.description, `${p.name}: description`);
}

console.log(`OK: ${projects.length} Projekte`);
