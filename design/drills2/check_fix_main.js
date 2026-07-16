// 本問の癖是正パッチ（fix_main_*.json）を questions.json へ当てる前に検証する（ドライラン）。
//   - 対象IDが存在し、選択肢数が一致するか
//   - 正解の選択肢テキストが元のままか（＝正解位置と解説の対応を壊していないか）
//   - 是正後に「明らかな癖」（正解が最長誤答より6字以上長く、かつ1.3倍以上）が消えたか
// 実行: node design/drills2/check_fix_main.js [cc|sec|tec|bil]
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "../..");
const all = JSON.parse(fs.readFileSync(path.join(ROOT, "Resources/questions.json"), "utf8"));
const byId = new Map(all.map((x) => [x.id, x]));

const doms = process.argv[2] ? [process.argv[2]] : ["cc", "sec", "tec", "bil"];
let errors = 0, remaining = 0, checked = 0;

for (const d of doms) {
  const p = path.join(__dirname, `fix_main_${d}.json`);
  const patches = JSON.parse(fs.readFileSync(p, "utf8"));
  for (const fix of patches) {
    const base = byId.get(fix.id);
    checked++;
    if (!base) { console.log(`[NG] ${fix.id}: 元の問題が見つからない`); errors++; continue; }
    if (fix.choices.length !== base.choices.length) {
      console.log(`[NG] ${fix.id}: 選択肢数が不一致（元${base.choices.length}→${fix.choices.length}）`); errors++; continue;
    }
    const ci = base.correctAnswers[0];
    // 原則、正解の選択肢テキストは触らない。誤植の修正など意図がある場合のみ
    // allowCorrectChange: "理由" を明記して例外を許可する。
    if (base.correctAnswers.length === 1 && fix.choices[ci] !== base.choices[ci] && !fix.allowCorrectChange) {
      console.log(`[NG] ${fix.id}: 正解の選択肢テキストが変わっている\n     元: ${base.choices[ci]}\n     新: ${fix.choices[ci]}`);
      errors++; continue;
    }
    const dup = new Set(fix.choices);
    if (dup.size !== fix.choices.length) { console.log(`[NG] ${fix.id}: 選択肢が重複`); errors++; continue; }
    if (base.correctAnswers.length !== 1) continue;
    const cl = fix.choices[ci].length;
    const wl = Math.max(...fix.choices.map((v, i) => (i === ci ? 0 : v.length)));
    if (cl - wl >= 6 && cl >= wl * 1.3) {
      console.log(`[癖残り] ${fix.id}: 正解${cl}字 / 最長誤答${wl}字（差${cl - wl}・比${(cl / wl).toFixed(2)}）`);
      remaining++;
    }
  }
}
console.log(`\n検証: ${checked}件 / エラー ${errors} / 癖残り ${remaining}`);
process.exit(errors || remaining ? 1 : 0);
