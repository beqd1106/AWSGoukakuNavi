/*
 * 選択肢の正解位置を均等化するツール。
 * 元データは「正解が常に選択肢①」で作られているため、選択肢順をシャッフルして
 * 正解の位置を①〜④へ均等に分散させる。correctAnswers と wrongChoiceExplanations の
 * キー（選択肢インデックス）も正しく再マッピングする。
 *
 * 使い方: node design/balance_choices.js <jsonファイル> [seed]
 * 例:     node design/balance_choices.js Resources/questions.json 12345
 *
 * 冪等性: 実行のたびに再シャッフルされる。位置分布の均等化が目的なので、
 *        確定したら追加問題にだけ適用する運用を推奨。
 */
const fs = require('fs');

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function balance(file, seed) {
  const rng = mulberry32(seed);
  const arr = JSON.parse(fs.readFileSync(file, 'utf8'));
  const counts = {}; // n(選択肢数) -> 各位置の採用回数

  for (const q of arr) {
    const n = q.choices.length;
    const old = q.choices.slice();
    const correct = q.correctAnswers.slice();
    const mapping = new Array(n); // old index -> new index

    if (correct.length === 1) {
      // 単一選択：最も使われていない位置へ正解を置く（均等化）
      if (!counts[n]) counts[n] = new Array(n).fill(0);
      const c = counts[n];
      let target = 0, min = Infinity;
      for (let i = 0; i < n; i++) if (c[i] < min) { min = c[i]; target = i; }
      c[target]++;

      const co = correct[0];
      const rest = [];
      for (let i = 0; i < n; i++) if (i !== co) rest.push(i);
      for (let i = rest.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [rest[i], rest[j]] = [rest[j], rest[i]]; }

      const newOldAt = new Array(n); // new index -> old index
      newOldAt[target] = co;
      let p = 0;
      for (let i = 0; i < n; i++) { if (i === target) continue; newOldAt[i] = rest[p++]; }
      for (let ni = 0; ni < n; ni++) mapping[newOldAt[ni]] = ni;
    } else {
      // 複数選択：全体をシャッフル
      const idx = [...Array(n).keys()];
      for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(rng() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
      for (let ni = 0; ni < n; ni++) mapping[idx[ni]] = ni;
    }

    // 適用
    const newChoices = new Array(n);
    for (let oldI = 0; oldI < n; oldI++) newChoices[mapping[oldI]] = old[oldI];
    q.choices = newChoices;
    q.correctAnswers = correct.map(o => mapping[o]).sort((x, y) => x - y);
    if (q.wrongChoiceExplanations) {
      const nw = {};
      for (const k of Object.keys(q.wrongChoiceExplanations)) nw[String(mapping[+k])] = q.wrongChoiceExplanations[k];
      q.wrongChoiceExplanations = nw;
    }
  }

  fs.writeFileSync(file, JSON.stringify(arr, null, 2) + '\n', 'utf8');

  // 検証用：分布を返す
  const single = arr.filter(q => q.correctAnswers.length === 1);
  const c4 = [0, 0, 0, 0];
  single.forEach(q => { if (q.choices.length === 4) c4[q.correctAnswers[0]]++; });
  return { total: arr.length, single: single.length, pos: c4 };
}

const file = process.argv[2];
const seed = parseInt(process.argv[3] || '1106', 10);
if (!file) { console.error('usage: node balance_choices.js <file> [seed]'); process.exit(1); }
console.log(JSON.stringify(balance(file, seed)));
