// Prüft die Inhalte der Seite: node tools/check.mjs
import { readFileSync } from "node:fs";
import { runInNewContext } from "node:vm";
import assert from "node:assert/strict";

const root = new URL("../", import.meta.url);
const read = file => readFileSync(new URL(file, root), "utf8");
const projects = JSON.parse(read("projects.json"));

// i18n.js setzt window.STRINGS = { de: {...}, en: {...} }
const window = {};
runInNewContext(read("i18n.js"), { window });
const { de, en } = window.STRINGS;

// Beide Sprachen haben dieselben Schlüssel mit demselben Typ (Text, Funktion, Liste)
const shape = strings => Object.entries(strings).map(([k, v]) => `${k}:${Array.isArray(v) ? `list${v.length}` : typeof v}`).sort();
assert.deepEqual(shape(en), shape(de), "Schlüssel in de und en");

assert.deepEqual(
  projects.map(p => p.name),
  ["SurvivorsForge", "OpenVoiceSpeak", "RezondesStreamTools", "PersonalEinsatzPlanung", "ClaudeDeck", "Rezondes Enhanced Arma"],
  "Reihenfolge der Projekte",
);

for (const p of projects) {
  assert.match(p.repo, /^https:\/\/github\.com\//, `${p.name}: repo`);
  if (p.url !== undefined) assert.match(p.url, /^https:\/\//, `${p.name}: url`);
  assert.ok(Array.isArray(p.stack) && p.stack.length, `${p.name}: stack`);
  assert.ok(typeof de[`status_${p.status}`] === "string", `${p.name}: status '${p.status}' hat keinen Text`);
  assert.ok(p.description?.de && p.description?.en, `${p.name}: description in de und en`);
}

console.log(`OK: ${projects.length} Projekte, ${Object.keys(de).length} Texte je Sprache`);
