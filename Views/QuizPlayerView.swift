import SwiftUI

/// 演習・復習・今日のタスクで使う問題プレイヤー（1問ずつ・即時解説）。
struct QuizPlayerView: View {
    let title: String
    let questions: [QuizQuestion]

    @EnvironmentObject var store: StudyStore
    @Environment(\.dismiss) private var dismiss

    @State private var index = 0
    @State private var selected: Set<Int> = []
    @State private var submitted = false
    @State private var correctCount = 0
    @State private var finished = false

    private var current: QuizQuestion { questions[index] }

    var body: some View {
        ZStack {
            AppBackground()
            if finished {
                summaryView
            } else if questions.isEmpty {
                EmptyStateView(icon: "tray", title: "問題がありません",
                               message: "別の分野を選んでみてください。")
            } else {
                quizView
            }
        }
        .navigationTitle(title)
        .navigationBarTitleDisplayMode(.inline)
    }

    // MARK: - 出題

    private var quizView: some View {
        VStack(spacing: 0) {
            // 進捗
            VStack(spacing: 6) {
                HStack {
                    Text("\(index + 1) / \(questions.count)問")
                        .font(.system(size: 13, weight: .semibold)).foregroundStyle(Theme.inkSoft)
                    Spacer()
                    DomainChip(domain: current.domain)
                }
                ProgressBar(value: Double(index) / Double(questions.count))
            }
            .padding(Theme.Space.l)

            ScrollView {
                VStack(alignment: .leading, spacing: Theme.Space.l) {
                    // 問題文
                    Card {
                        VStack(alignment: .leading, spacing: Theme.Space.s) {
                            if current.isMultipleSelect {
                                TagChip(text: "複数選択（\(current.correctAnswers.count)つ選ぶ）", color: Theme.teal)
                            }
                            Text(current.question)
                                .font(.system(size: 17, weight: .semibold))
                                .foregroundStyle(Theme.ink)
                                .fixedSize(horizontal: false, vertical: true)
                        }
                    }

                    // 選択肢
                    VStack(spacing: Theme.Space.s) {
                        ForEach(Array(current.choices.enumerated()), id: \.offset) { i, choice in
                            choiceRow(i, choice)
                        }
                    }

                    if submitted { explanationCard }
                }
                .padding(.horizontal, Theme.Space.l)
                .padding(.bottom, 120)
            }

            // 下部アクション
            VStack(spacing: Theme.Space.s) {
                if !submitted {
                    PrimaryButton(title: "答え合わせ", enabled: !selected.isEmpty) { submit() }
                } else {
                    PrimaryButton(title: index + 1 < questions.count ? "次の問題へ" : "結果を見る",
                                  icon: "arrow.right") { goNext() }
                }
            }
            .padding(Theme.Space.l)
            .background(.ultraThinMaterial)
        }
    }

    private func choiceRow(_ i: Int, _ choice: String) -> some View {
        let isSelected = selected.contains(i)
        let isCorrect = current.correctAnswers.contains(i)
        var bg = Theme.card
        var border = Theme.line
        var icon = "circle"
        var iconColor = Theme.line
        if submitted {
            if isCorrect { bg = Theme.green.opacity(0.10); border = Theme.green; icon = "checkmark.circle.fill"; iconColor = Theme.green }
            else if isSelected { bg = Theme.red.opacity(0.10); border = Theme.red; icon = "xmark.circle.fill"; iconColor = Theme.red }
        } else if isSelected {
            bg = Theme.blueSoft; border = Theme.blue; icon = "largecircle.fill.circle"; iconColor = Theme.blue
        }
        return Button {
            guard !submitted else { return }
            toggle(i)
        } label: {
            HStack(alignment: .top, spacing: Theme.Space.m) {
                Image(systemName: icon).foregroundStyle(iconColor).font(.system(size: 20))
                Text(choice).font(.system(size: 15)).foregroundStyle(Theme.ink)
                    .fixedSize(horizontal: false, vertical: true)
                Spacer(minLength: 0)
            }
            .padding(Theme.Space.m)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(bg)
            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.chip))
            .overlay(RoundedRectangle(cornerRadius: Theme.Radius.chip).stroke(border, lineWidth: 1.2))
        }
        .buttonStyle(.plain)
    }

    // MARK: - 解説

    private var explanationCard: some View {
        let isCorrect = current.isCorrect(selected: selected)
        return Card {
            VStack(alignment: .leading, spacing: Theme.Space.m) {
                HStack(spacing: Theme.Space.s) {
                    Image(systemName: isCorrect ? "checkmark.seal.fill" : "xmark.seal.fill")
                        .foregroundStyle(isCorrect ? Theme.green : Theme.red)
                    Text(isCorrect ? "正解！" : "残念、不正解")
                        .font(.system(size: 17, weight: .bold))
                        .foregroundStyle(isCorrect ? Theme.green : Theme.red)
                    Spacer()
                    bookmarkButton
                }

                Divider()

                labeledBlock("解説", current.explanation, color: Theme.navy)

                // 不正解選択肢の理由
                if !current.wrongChoiceExplanations.isEmpty {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("他の選択肢").font(.system(size: 13, weight: .bold)).foregroundStyle(Theme.inkSoft)
                        ForEach(current.choices.indices, id: \.self) { i in
                            if let reason = current.wrongReason(for: i) {
                                HStack(alignment: .top, spacing: 6) {
                                    Text("×").foregroundStyle(Theme.red).font(.system(size: 14, weight: .bold))
                                    Text(reason).font(.system(size: 13)).foregroundStyle(Theme.ink)
                                }
                            }
                        }
                    }
                }

                if let note = current.beginnerNote {
                    HStack(alignment: .top, spacing: 6) {
                        Image(systemName: "lightbulb.fill").foregroundStyle(Theme.orange).font(.system(size: 13))
                        Text(note).font(.system(size: 13)).foregroundStyle(Theme.ink)
                    }
                    .padding(Theme.Space.s)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Theme.orangeSoft)
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                }
            }
        }
    }

    private func labeledBlock(_ label: String, _ text: String, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label).font(.system(size: 13, weight: .bold)).foregroundStyle(color)
            Text(text).font(.system(size: 14)).foregroundStyle(Theme.ink)
                .fixedSize(horizontal: false, vertical: true)
        }
    }

    private var bookmarkButton: some View {
        Button {
            store.toggleBookmark(current.id)
        } label: {
            Image(systemName: store.isBookmarked(current.id) ? "star.fill" : "star")
                .foregroundStyle(store.isBookmarked(current.id) ? Theme.orange : Theme.inkSoft)
        }
    }

    // MARK: - サマリ

    private var summaryView: some View {
        let rate = questions.isEmpty ? 0 : Double(correctCount) / Double(questions.count)
        return ScrollView {
            VStack(spacing: Theme.Space.xl) {
                ScoreRing(value: rate, color: rate >= 0.7 ? Theme.green : Theme.orange,
                          label: "\(Int(rate*100))%",
                          caption: "\(correctCount)/\(questions.count)問正解")
                    .frame(width: 180, height: 180)
                    .padding(.top, Theme.Space.xxl)

                Text(rate >= 0.7 ? "よくできました！この調子です。" : "間違えた問題は復習キューに入りました。")
                    .font(.system(size: 16, weight: .semibold)).foregroundStyle(Theme.navy)
                    .multilineTextAlignment(.center)

                if store.dueReviewCount > 0 {
                    Text("復習待ち：\(store.dueReviewCount)問").captionStyle()
                }

                PrimaryButton(title: "終わる", icon: "checkmark") { dismiss() }
                    .padding(.horizontal, Theme.Space.xl)
            }
            .padding(Theme.Space.l)
        }
    }

    // MARK: - 操作

    private func toggle(_ i: Int) {
        if current.isMultipleSelect {
            if selected.contains(i) { selected.remove(i) } else { selected.insert(i) }
        } else {
            selected = [i]
        }
    }

    private func submit() {
        submitted = true
        let correct = current.isCorrect(selected: selected)
        if correct { correctCount += 1 }
        store.recordAnswer(question: current, correct: correct)
    }

    private func goNext() {
        if index + 1 < questions.count {
            index += 1
            selected = []
            submitted = false
        } else {
            finished = true
        }
    }
}
