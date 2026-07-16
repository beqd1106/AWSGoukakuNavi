// 本問（ドリル以外）の「正解だけ長い」癖を是正するパッチ束。
// ドメイン別 fix_main_<dom>.json を読み、build_drills2.js の fix 機構へ渡す。
// 各要素は { id, choices:[4] }（選択肢の順番は変えない＝正解位置・解説の対応を保つ）。
const add = [];
const fix = []
  .concat(require("./fix_main_cc.json"))
  .concat(require("./fix_main_sec.json"))
  .concat(require("./fix_main_tec.json"))
  .concat(require("./fix_main_bil.json"));
module.exports = { add, fix };
