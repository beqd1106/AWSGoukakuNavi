# -*- coding: utf-8 -*-
"""
どのレッスンからも辿れない問題を、いちばん近いレッスンのランダム演習プールへ入れる。

  python design/assign_orphans.py [--dry]

模試には出るのにレッスンからは出会えない問題が多数あったため、
service（テーマ名）の一致度で同じ分野のレッスンへ割り振る。
確認問題（quizIds）は既存の構成を壊さないよう触らず、drillQuizIds にだけ追加する。
"""
import json, os, sys, collections

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = os.path.join(ROOT, "Resources")
DRY = "--dry" in sys.argv


def main():
    qs = json.load(open(os.path.join(RES, "questions.json"), encoding="utf-8"))
    lessons = json.load(open(os.path.join(RES, "lessons.json"), encoding="utf-8"))
    by_id = {q["id"]: q for q in qs}

    used = set()
    for l in lessons:
        for k in ("quizIds", "challengeQuizIds", "drillQuizIds"):
            used |= set(l.get(k) or [])
    orphans = [q for q in qs if q["id"] not in used]

    # レッスンごとの「テーマ語彙」を、そのレッスンが既に持つ問題から作る
    profile = {}
    for l in lessons:
        c = collections.Counter()
        for k in ("quizIds", "challengeQuizIds", "drillQuizIds"):
            for qid in l.get(k) or []:
                q = by_id.get(qid)
                if q:
                    c[q["service"]] += 1
        profile[l["id"]] = c

    # 同じ分野の中で、service が一致するレッスンへ寄せる。
    # 一致が無ければ、その分野で問題数がいちばん少ないレッスンへ入れて偏りを防ぐ。
    size = {l["id"]: sum(len(l.get(k) or []) for k in
                         ("quizIds", "challengeQuizIds", "drillQuizIds")) for l in lessons}
    by_domain = collections.defaultdict(list)
    for l in lessons:
        by_domain[l["domain"]].append(l)

    assigned = collections.Counter()
    matched = fallback = 0
    for q in orphans:
        cands = by_domain.get(q["domain"], [])
        if not cands:
            continue
        best = max(cands, key=lambda l: profile[l["id"]].get(q["service"], 0))
        if profile[best["id"]].get(q["service"], 0) > 0:
            matched += 1
        else:
            best = min(cands, key=lambda l: size[l["id"]])
            fallback += 1
        best.setdefault("drillQuizIds", [])
        best["drillQuizIds"].append(q["id"])
        size[best["id"]] += 1
        profile[best["id"]][q["service"]] += 1
        assigned[best["id"]] += 1

    print(f"未割当だった問題     : {len(orphans)}問")
    print(f"  テーマ一致で配置   : {matched}問")
    print(f"  分野内の最小へ配置 : {fallback}問")
    print(f"追加されたレッスン数 : {len(assigned)}")
    top = assigned.most_common(5)
    print("  多い順:", ", ".join(f"{k}+{v}" for k, v in top))

    # 既存分を含め、同じ問題が複数の枠に入っている状態を解消する
    # （確認問題 > 腕試し > ドリル の優先順で1か所だけ残す）
    seen = set()
    removed = 0
    for field in ("quizIds", "challengeQuizIds", "drillQuizIds"):
        for l in lessons:
            ids = l.get(field)
            if not ids:
                continue
            kept = []
            for qid in ids:
                if qid in seen:
                    removed += 1
                    continue
                seen.add(qid)
                kept.append(qid)
            l[field] = kept
    print(f"重複していた配置を整理: {removed}件")

    # 検証
    used2 = set()
    for l in lessons:
        for k in ("quizIds", "challengeQuizIds", "drillQuizIds"):
            used2 |= set(l.get(k) or [])
    left = [q["id"] for q in qs if q["id"] not in used2]
    dup = [k for k, v in collections.Counter(
        qid for l in lessons for k2 in ("quizIds", "challengeQuizIds", "drillQuizIds")
        for qid in (l.get(k2) or [])).items() if v > 1]
    print(f"まだ未割当           : {len(left)}問")
    print(f"レッスン間の重複     : {len(dup)}件")

    if DRY:
        print("\n(--dry のため書き込みなし)")
        return
    json.dump(lessons, open(os.path.join(RES, "lessons.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)
    print("\n書き込み完了")


if __name__ == "__main__":
    main()
