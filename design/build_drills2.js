// 反復ドリル増量＋文字数の癖是正（v2）統合ハーネス。
//   - 各ドメインモジュール（drills2/*.js）が { add:[...], fix:[...] } を返す。
//   - add: 新規問題（q() 由来・correctAnswers[0]）。ここで①〜④へローテーション分散する。
//   - fix: 既存問題の選択肢リライトパッチ { id, choices:[4], wrongChoiceExplanations?:{...} }。
//          正解位置・解説・タグ等は既存を保持し、choices（と任意で誤答理由）だけ差し替える。
//   実行: node design/build_drills2.js
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const file = path.join(ROOT, "Resources/questions.json");
const existing = JSON.parse(fs.readFileSync(file, "utf8"));

const MODULES = ["cc", "sec", "tec1", "tec2", "bil", "main"];
let addAll = [];
let fixAll = [];
for (const m of MODULES) {
  const p = path.join(__dirname, "drills2", m + ".js");
  if (!fs.existsSync(p)) { console.warn("skip(missing):", m); continue; }
  const mod = require(p);
  addAll = addAll.concat(mod.add || []);
  fixAll = fixAll.concat(mod.fix || []);
}

// ---- add: 正解位置をローテーションで①〜④へ均等分散（build_drills.js と同一） ----
function rotate(item, t) {
  if (t === 0) return item;
  const n = item.choices.length;
  const nc = new Array(n);
  for (let j = 0; j < n; j++) nc[(j + t) % n] = item.choices[j];
  const cor = item.correctAnswers.map((c) => (c + t) % n);
  const w = {};
  for (const [k, v] of Object.entries(item.wrongChoiceExplanations)) w[String((Number(k) + t) % n)] = v;
  return { ...item, choices: nc, correctAnswers: cor, wrongChoiceExplanations: w };
}
const rotatedAdd = addAll.map((item, i) => rotate(item, i % 4));

const byId = new Map(existing.map((x) => [x.id, x]));

// ---- fix: 既存の choices（と任意で wrongChoiceExplanations）だけ差し替え ----
let fixApplied = 0, fixMissing = 0;
for (const p of fixAll) {
  const base = byId.get(p.id);
  if (!base) { fixMissing++; console.warn("fix対象なし:", p.id); continue; }
  if (!Array.isArray(p.choices) || p.choices.length !== base.choices.length) {
    throw new Error(`fix ${p.id}: choices数が不一致（既存${base.choices.length}）`);
  }
  base.choices = p.choices;
  if (p.wrongChoiceExplanations) base.wrongChoiceExplanations = p.wrongChoiceExplanations;
  fixApplied++;
}

// ---- add をマージ（qd-*-e* は常に上書き） ----
let added = 0;
for (const item of rotatedAdd) { if (!byId.has(item.id)) added++; byId.set(item.id, item); }

const merged = Array.from(byId.values());
fs.writeFileSync(file, JSON.stringify(merged, null, 2) + "\n", "utf8");

// ---- レポート ----
const pos = [0, 0, 0, 0];
rotatedAdd.forEach((x) => pos[x.correctAnswers[0]]++);
console.log(`add: ${rotatedAdd.length}問（新規 ${added}） / fix: 適用${fixApplied} 欠番${fixMissing}`);
console.log("新規の正解位置 ①②③④:", pos.join(" / "));
console.log("合計問題数:", merged.length);
