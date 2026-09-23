# -*- coding: utf-8 -*-
"""
重複している問題を1問にまとめる。

  python design/dedupe.py [--dry]

同じ問題が2回出てくると学習の妨げになるため、
「設問と正解が実質同じ」ものを1問に寄せる。
残す側は、解説・誤答解説が充実しているほうを選ぶ。
消した側を参照しているレッスンは、残した側のIDへ張り替える。
"""
import json, re, os, sys, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = os.path.join(ROOT, "Resources")
DRY = "--dry" in sys.argv


def norm(s):
    """表記ゆれ（記号・空白・かっこ書き）を落として比較する"""
    s = re.sub(r"[（(][^）)]*[）)]", "", s or "")
    return re.sub(r"[^ぁ-んァ-ヶ一-龠A-Za-z0-9%]", "", s)


def score(q):
    """残す価値のスコア。解説が厚く、誤答解説が揃っているものを優先。"""
    return (len(q.get("explanation", "")),
            len(q.get("wrongChoiceExplanations") or {}),
            len(q.get("beginnerNote") or ""),
            len(q.get("tags") or []))


def main():
    qs = json.load(open(os.path.join(RES, "questions.json"), encoding="utf-8"))
    lessons = json.load(open(os.path.join(RES, "lessons.json"), encoding="utf-8"))

    groups = collections.defaultdict(list)
    for q in qs:
        key = (norm(q["question"]), norm(q["choices"][q["correctAnswers"][0]]))
        groups[key].append(q)

    remap, drop = {}, set()
    for key, g in groups.items():
        if len(g) < 2:
            continue
        g.sort(key=score, reverse=True)
        keep = g[0]
        for other in g[1:]:
            remap[other["id"]] = keep["id"]
            drop.add(other["id"])

    kept = [q for q in qs if q["id"] not in drop]

    # レッスンの参照を張り替える（重複で同じIDが並ばないよう順序を保って重複排除）
    relinked = 0
    for l in lessons:
        for field in ("quizIds", "challengeQuizIds", "drillQuizIds"):
            ids = l.get(field)
            if not ids:
                continue
            new, seen = [], set()
            for qid in ids:
                mapped = remap.get(qid, qid)
                if mapped != qid:
                    relinked += 1
                if mapped not in seen:
                    seen.add(mapped)
                    new.append(mapped)
            l[field] = new

    print(f"重複していた組     : {len(set(remap.values()))}組")
    print(f"削除した問題       : {len(drop)}問")
    print(f"レッスンの張り替え : {relinked}件")
    print(f"問題数             : {len(qs)} → {len(kept)}")

    valid = {q["id"] for q in kept}
    broken = [(l["id"], f, qid) for l in lessons
              for f in ("quizIds", "challengeQuizIds", "drillQuizIds")
              for qid in (l.get(f) or []) if qid not in valid]
    print(f"参照切れ           : {len(broken)}件")
    if broken[:5]:
        for b in broken[:5]:
            print("   ", b)

    if DRY:
        print("\n(--dry のため書き込みなし)")
        return
    json.dump(kept, open(os.path.join(RES, "questions.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    json.dump(lessons, open(os.path.join(RES, "lessons.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    print("\n書き込み完了")


if __name__ == "__main__":
    main()
