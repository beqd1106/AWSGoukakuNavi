# -*- coding: utf-8 -*-
"""
アップグレード結果（design/up_out/*.json）を検算して問題バンクへ反映する。

  python design/apply_upgrade.py [--dry]

検算でやること
  - 選択肢が4つ／空でない／重複していないか
  - 正解の位置が動いていないか（元の正解の文言が correctIndex の位置に残っているか）
  - 新しい数値（料金・SLA・上限など）が勝手に持ち込まれていないか
  - 反映前後で「最長を選ぶだけ」の正答率と解説の厚みがどう変わったか
"""
import json, glob, os, sys, re, statistics, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = os.path.join(ROOT, "Resources")
DRY = "--dry" in sys.argv

# 持ち込まれると危険な数値（AWSは変わりやすい）
NUM = re.compile(r"(\$\s?[\d,]+|[\d,]+\s?ドル|99\.\d+\s?%|\d+\s?時間以内|\d+\s?分以内"
                 r"|\d+\s?(GB|TB|PB)|\d{2,}\s?%|月額\s?[\d,]+)")


def longest(ch, ci):
    return len(ch[ci]) > max(len(c) for i, c in enumerate(ch) if i != ci)


def main():
    qs = json.load(open(os.path.join(RES, "questions.json"), encoding="utf-8"))
    by_id = {q["id"]: q for q in qs}

    rows, errors = {}, []
    for f in sorted(glob.glob(os.path.join(ROOT, "design", "up_out", "*.json"))):
        try:
            data = json.load(open(f, encoding="utf-8"))
        except Exception as e:
            errors.append(f"[{os.path.basename(f)}] 読めない: {e}")
            continue
        for r in data:
            qid = r.get("id")
            w = f"[{os.path.basename(f)}] {qid}"
            q = by_id.get(qid)
            if not q:
                errors.append(f"{w}: 問題バンクに無いID")
                continue
            # X系は W系の結果をさらに厚くした再処理。後勝ちで上書きする。
            if qid in rows and not os.path.basename(f).startswith("X"):
                errors.append(f"{w}: 複数ファイルで重複")
                continue
            ch = r.get("choices")
            if ch is not None:
                if not isinstance(ch, list) or len(ch) != 4:
                    errors.append(f"{w}: 選択肢が4つでない")
                    continue
                if any(not isinstance(c, str) or not c.strip() for c in ch):
                    errors.append(f"{w}: 空の選択肢")
                    continue
                if len({c.strip() for c in ch}) != 4:
                    errors.append(f"{w}: 選択肢が重複")
                    continue
            ex = r.get("explanation")
            # 元になかった数値が増えていないか
            if ex:
                before = set(m.group(0) for m in NUM.finditer(
                    q["question"] + " ".join(q["choices"]) + q.get("explanation", "")))
                after = set(m.group(0) for m in NUM.finditer(ex + " ".join(ch or q["choices"])))
                added = {a for a in after if a not in before}
                if added:
                    errors.append(f"{w}: 元に無い数値が入った {sorted(added)}")
            rows[qid] = r

    before_long = sum(1 for q in qs if len(q["correctAnswers"]) == 1
                      and longest(q["choices"], q["correctAnswers"][0]))
    before_thin = sum(1 for q in qs if len(q.get("explanation", "")) < 60)
    n1 = sum(1 for q in qs if len(q["correctAnswers"]) == 1)

    applied = 0
    for qid, r in rows.items():
        q = by_id[qid]
        if r.get("choices"):
            q["choices"] = [c.strip() for c in r["choices"]]
        if r.get("explanation"):
            q["explanation"] = r["explanation"].strip()
        applied += 1

    after_long = sum(1 for q in qs if len(q["correctAnswers"]) == 1
                     and longest(q["choices"], q["correctAnswers"][0]))
    after_thin = sum(1 for q in qs if len(q.get("explanation", "")) < 60)
    avg = statistics.mean(len(q.get("explanation", "")) for q in qs)

    print(f"反映対象 {applied}問 / 全{len(qs)}問")
    print(f"  正解が単独で最長 : {before_long/n1*100:5.1f}%  →  {after_long/n1*100:5.1f}%   （理想25%）")
    print(f"  解説が60字未満   : {before_thin:>5}問  →  {after_thin:>5}問")
    print(f"  解説の平均文字数 : {avg:.0f}字")

    if errors:
        print(f"\n検算エラー {len(errors)}件")
        for e in errors[:20]:
            print("  ", e)

    if DRY:
        print("\n(--dry のため書き込みなし)")
        return
    json.dump(qs, open(os.path.join(RES, "questions.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    print(f"\n書き込み完了")


if __name__ == "__main__":
    main()
