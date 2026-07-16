// 反復ドリル増量（v2）共通ヘルパ。build_drills.js の q() と同一仕様。
// add 用：正解は index 0 に置く（統合ハーネス build_drills2.js が①〜④へローテーション分散）。
// q(id, domain, service, difficulty, 質問, [正解,誤1,誤2,誤3], 解説, [誤1理由,誤2理由,誤3理由], tags, beginnerNote)
const q = (id, domain, service, difficulty, question, choices, explanation, wrongs, tags, beginnerNote) => ({
  id, question, choices, correctAnswers: [0], explanation,
  wrongChoiceExplanations: { "1": wrongs[0], "2": wrongs[1], "3": wrongs[2] },
  domain, service, difficulty, tags: [...tags, "ドリル"], beginnerNote,
});
module.exports = { q };
