import SwiftUI

/// 模擬試験のスタート画面
struct MockExamStartView: View {
    @EnvironmentObject var store: StudyStore
    @State private var running = false

    /// 本番同様65問。問題プールが足りない場合は利用可能数に丸める。
    private var available: Int { ContentRepository.shared.questions.count }
    private var count: Int { min(65, available) }

    var body: some View {
        ZStack {
            AppBackground()
            ScrollView {
                VStack(alignment: .leading, spacing: Theme.Space.l) {
                    Card {
                        VStack(alignment: .leading, spacing: Theme.Space.m) {
                            Text("模擬試験").font(.system(size: 20, weight: .bold)).foregroundStyle(Theme.navy)
                            infoRow("doc.text.fill", "出題数", "\(count)問（公式配点に近い比率で出題）")
                            infoRow("timer", "制限時間", "\(timeLimitMinutes)分")
                            infoRow("chart.pie.fill", "結果", "分野別スコアと弱点を表示")
                            Divider()
                            Text("※本番は65問・90分・合格スコア700/1000です。最新の試験情報は必ずAWS公式サイトでご確認ください。")
                                .font(.system(size: 12)).foregroundStyle(Theme.inkSoft)
                        }
                    }
                    Card {
                        VStack(alignment: .leading, spacing: 6) {
                            Label("注意", systemImage: "info.circle.fill").foregroundStyle(Theme.blue)
                                .font(.system(size: 14, weight: .bold))
                            Text("途中で各問の正誤は表示されません。最後にまとめて結果が出ます。本番のつもりで挑戦しましょう。")
                                .font(.system(size: 13)).foregroundStyle(Theme.ink)
                        }
                    }
                    PrimaryButton(title: "模擬試験を始める", icon: "play.fill") { running = true }
                }
                .padding(Theme.Space.l)
            }
        }
        .navigationTitle("模擬試験")
        .navigationBarTitleDisplayMode(.inline)
        .fullScreenCover(isPresented: $running) {
            MockExamRunView(questions: ContentRepository.shared.buildMockExam(count: count),
                            timeLimit: TimeInterval(timeLimitMinutes * 60))
        }
    }

    private var timeLimitMinutes: Int { max(5, count * 80 / 60) }

    private func infoRow(_ icon: String, _ label: String, _ value: String) -> some View {
        HStack(spacing: Theme.Space.s) {
            Image(systemName: icon).foregroundStyle(Theme.orange).frame(width: 24)
            Text(label).font(.system(size: 14, weight: .semibold)).foregroundStyle(Theme.inkSoft)
            Spacer()
            Text(value).font(.system(size: 14)).foregroundStyle(Theme.ink)
        }
    }
}

/// 模擬試験の本体（即時フィードバックなし・タイマーあり）
struct MockExamRunView: View {
    let questions: [QuizQuestion]
    let timeLimit: TimeInterval

    @EnvironmentObject var store: StudyStore
    @Environment(\.dismiss) private var dismiss

    @State private var index = 0
    @State private var answers: [String: Set<Int>] = [:]
    @State private var remaining: TimeInterval
    @State private var result: MockExamResult?

    private let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    init(questions: [QuizQuestion], timeLimit: TimeInterval) {
        self.questions = questions
        self.timeLimit = timeLimit
        _remaining = State(initialValue: timeLimit)
    }

    private var current: QuizQuestion { questions[index] }

    var body: some View {
        NavigationStack {
            ZStack {
                AppBackground()
                if let result {
                    MockExamResultView(result: result) { dismiss() }
                } else {
                    examBody
                }
            }
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    if result == nil {
                        Button("中断") { dismiss() }.foregroundStyle(Theme.red)
                    }
                }
                ToolbarItem(placement: .principal) {
                    if result == nil {
                        Label(timeString, systemImage: "timer")
                            .font(.system(size: 14, weight: .bold))
                            .foregroundStyle(remaining < 60 ? Theme.red : Theme.navy)
                    }
                }
            }
        }
        .onReceive(timer) { _ in
            guard result == nil else { return }
            remaining -= 1
            if remaining <= 0 { finish() }
        }
    }

    private var examBody: some View {
        VStack(spacing: 0) {
            ProgressBar(value: Double(index + 1) / Double(questions.count)).padding(Theme.Space.l)
            ScrollView {
                VStack(alignment: .leading, spacing: Theme.Space.l) {
                    HStack {
                        Text("第\(index + 1)問 / \(questions.count)").font(.system(size: 13, weight: .semibold)).foregroundStyle(Theme.inkSoft)
                        Spacer()
                        DomainChip(domain: current.domain)
                    }
                    Card {
                        VStack(alignment: .leading, spacing: 8) {
                            if current.isMultipleSelect {
                                TagChip(text: "複数選択（\(current.correctAnswers.count)つ）", color: Theme.teal)
                            }
                            Text(current.question).font(.system(size: 17, weight: .semibold)).foregroundStyle(Theme.ink)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }
                    ForEach(Array(current.choices.enumerated()), id: \.offset) { i, choice in
                        choiceRow(i, choice)
                    }
                }
                .padding(.horizontal, Theme.Space.l)
                .padding(.bottom, 120)
            }
            HStack(spacing: Theme.Space.m) {
                if index > 0 {
                    SecondaryButton(title: "前へ", icon: "chevron.left") { index -= 1 }
                }
                if index + 1 < questions.count {
                    PrimaryButton(title: "次へ", icon: "chevron.right") { index += 1 }
                } else {
                    PrimaryButton(title: "採点する", icon: "checkmark") { finish() }
                }
            }
            .padding(Theme.Space.l)
            .background(.ultraThinMaterial)
        }
    }

    private func choiceRow(_ i: Int, _ choice: String) -> some View {
        let sel = answers[current.id]?.contains(i) ?? false
        return Button { toggle(i) } label: {
            HStack(alignment: .top, spacing: Theme.Space.m) {
                Image(systemName: sel ? "largecircle.fill.circle" : "circle")
                    .foregroundStyle(sel ? Theme.blue : Theme.line).font(.system(size: 20))
                Text(choice).font(.system(size: 15)).foregroundStyle(Theme.ink)
                    .fixedSize(horizontal: false, vertical: true)
                Spacer(minLength: 0)
            }
            .padding(Theme.Space.m).frame(maxWidth: .infinity, alignment: .leading)
            .background(sel ? Theme.blueSoft : Theme.card)
            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.chip))
            .overlay(RoundedRectangle(cornerRadius: Theme.Radius.chip)
                .stroke(sel ? Theme.blue : Theme.line, lineWidth: 1.2))
        }.buttonStyle(.plain)
    }

    private func toggle(_ i: Int) {
        var set = answers[current.id] ?? []
        if current.isMultipleSelect {
            if set.contains(i) { set.remove(i) } else { set.insert(i) }
        } else {
            set = [i]
        }
        answers[current.id] = set
    }

    private func finish() {
        guard result == nil else { return }
        var correct = 0
        var byDomain: [ExamDomain: (Int, Int)] = [:]
        for q in questions {
            let sel = answers[q.id] ?? []
            let ok = q.isCorrect(selected: sel)
            if ok { correct += 1 }
            var t = byDomain[q.domain] ?? (0, 0)
            t.1 += 1; if ok { t.0 += 1 }
            byDomain[q.domain] = t
            store.recordAnswer(question: q, correct: ok, isMock: true)
        }
        let rate = questions.isEmpty ? 0 : Double(correct) / Double(questions.count)
        let scaled = Int((100 + rate * 900).rounded())
        let entries = ExamDomain.allCases.compactMap { d -> DomainScoreEntry? in
            guard let t = byDomain[d] else { return nil }
            return DomainScoreEntry(domainRaw: d.rawValue, correct: t.0, total: t.1)
        }
        let r = MockExamResult(scaledScore: scaled, correctCount: correct,
                               totalCount: questions.count, domainScores: entries)
        store.saveMockResult(r)
        result = r
    }

    private var timeString: String {
        let m = Int(remaining) / 60, s = Int(remaining) % 60
        return String(format: "%d:%02d", m, s)
    }
}

/// 模擬試験の結果
struct MockExamResultView: View {
    let result: MockExamResult
    var onClose: () -> Void

    var body: some View {
        ScrollView {
            VStack(spacing: Theme.Space.l) {
                ScoreRing(value: Double(result.scaledScore)/1000,
                          color: result.isPassingScore ? Theme.green : Theme.orange,
                          label: "\(result.scaledScore)", caption: "/ 1000")
                    .frame(width: 180, height: 180).padding(.top, Theme.Space.xl)

                Text(result.isPassingScore ? "合格ライン（目安700）を超えました！" : "合格ライン（目安700）まであと少し")
                    .font(.system(size: 16, weight: .bold))
                    .foregroundStyle(result.isPassingScore ? Theme.green : Theme.orange)
                    .multilineTextAlignment(.center)
                Text("正答 \(result.correctCount)/\(result.totalCount)問（\(Int(result.correctRate*100))%）")
                    .captionStyle()

                Card {
                    VStack(alignment: .leading, spacing: Theme.Space.m) {
                        Text("分野別スコア").font(.system(size: 16, weight: .bold)).foregroundStyle(Theme.navy)
                        ForEach(result.domainScores, id: \.domainRaw) { e in
                            VStack(alignment: .leading, spacing: 4) {
                                HStack {
                                    Text(e.domain.title).font(.system(size: 13, weight: .semibold)).foregroundStyle(Theme.ink)
                                    Spacer()
                                    Text("\(e.correct)/\(e.total)（\(Int(e.rate*100))%）")
                                        .font(.system(size: 13)).foregroundStyle(e.rate >= 0.7 ? Theme.green : Theme.orange)
                                }
                                ProgressBar(value: e.rate, color: e.domain.color, height: 8)
                            }
                        }
                    }
                }

                // 復習すべき項目
                Card {
                    VStack(alignment: .leading, spacing: Theme.Space.s) {
                        Text("おすすめの次の一手").font(.system(size: 16, weight: .bold)).foregroundStyle(Theme.navy)
                        ForEach(recommendations, id: \.self) { rec in
                            HStack(alignment: .top, spacing: 6) {
                                Image(systemName: "arrow.right.circle.fill").foregroundStyle(Theme.blue).font(.system(size: 14))
                                Text(rec).font(.system(size: 14)).foregroundStyle(Theme.ink)
                            }
                        }
                    }
                }

                PrimaryButton(title: "終わる", icon: "checkmark") { onClose() }
            }
            .padding(Theme.Space.l)
        }
    }

    private var recommendations: [String] {
        let weak = result.domainScores.filter { $0.rate < 0.7 }.sorted { $0.rate < $1.rate }
        if weak.isEmpty {
            return ["安定して合格ラインを超えています。間違えた問題の復習で仕上げましょう。"]
        }
        return weak.prefix(3).map { "「\($0.domain.title)」を重点復習しましょう（正答率\(Int($0.rate*100))%）。" }
    }
}
