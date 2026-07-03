import SwiftUI

struct LessonListView: View {
    let lessons = ContentRepository.shared.lessons
    @EnvironmentObject var store: StudyStore

    var body: some View {
        ZStack {
            AppBackground()
            ScrollView {
                VStack(spacing: Theme.Space.m) {
                    overallProgress
                    ForEach(ExamDomain.allCases) { domain in
                        let items = lessons.filter { $0.domain == domain }
                        if !items.isEmpty {
                            VStack(alignment: .leading, spacing: Theme.Space.s) {
                                HStack {
                                    DomainChip(domain: domain)
                                    Spacer()
                                    domainProgressLabel(domain, total: items.count)
                                }
                                ForEach(items) { lesson in
                                    NavigationLink { LessonDetailView(lesson: lesson) } label: {
                                        lessonRow(lesson)
                                    }.buttonStyle(.plain)
                                }
                            }
                        }
                    }
                }
                .padding(Theme.Space.l)
            }
        }
        .navigationTitle("レッスン")
        .navigationBarTitleDisplayMode(.inline)
    }

    // 全体の履修進捗バー
    private var overallProgress: some View {
        let done = store.completedLessonCount
        let total = lessons.count
        let rate = total == 0 ? 0 : Double(done) / Double(total)
        return Card(padding: Theme.Space.m) {
            VStack(alignment: .leading, spacing: Theme.Space.s) {
                HStack {
                    Text("学習の進み具合").font(.system(size: 14, weight: .bold)).foregroundStyle(Theme.navy)
                    Spacer()
                    Text("\(done) / \(total) レッスン").captionStyle()
                }
                ProgressView(value: rate).tint(Theme.orange)
                Text(done == total && total > 0 ? "全レッスン履修おつかれさまでした。"
                                                : "解説を読んで確認問題を解くと、履修済みになります。")
                    .captionStyle()
            }
        }
    }

    private func domainProgressLabel(_ domain: ExamDomain, total: Int) -> some View {
        let done = store.completedLessonCount(in: domain)
        let allDone = done == total && total > 0
        return HStack(spacing: 4) {
            if allDone {
                Image(systemName: "checkmark.seal.fill").font(.system(size: 12)).foregroundStyle(Theme.green)
            }
            Text("\(done)/\(total)")
                .font(.system(size: 12, weight: .semibold))
                .foregroundStyle(allDone ? Theme.green : Theme.inkSoft)
        }
    }

    private func lessonRow(_ lesson: Lesson) -> some View {
        let done = store.isLessonCompleted(lesson.id)
        return Card(padding: Theme.Space.m) {
            HStack(spacing: Theme.Space.m) {
                ZStack(alignment: .bottomTrailing) {
                    Image(systemName: "text.book.closed.fill").foregroundStyle(.white)
                        .frame(width: 40, height: 40).background(lesson.domain.color)
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                    if done {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 16))
                            .foregroundStyle(Theme.green)
                            .background(Circle().fill(.white).frame(width: 14, height: 14))
                            .offset(x: 5, y: 5)
                    }
                }
                VStack(alignment: .leading, spacing: 2) {
                    HStack(spacing: 6) {
                        Text(lesson.title)
                            .font(.system(size: 15, weight: .semibold))
                            .foregroundStyle(done ? Theme.inkSoft : Theme.ink)
                        if done {
                            Text("履修済み")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundStyle(Theme.green)
                                .padding(.horizontal, 6).padding(.vertical, 2)
                                .background(Theme.green.opacity(0.12))
                                .clipShape(Capsule())
                        }
                    }
                    Text("約\(lesson.estimatedMinutes)分・確認問題\(lesson.quizIds.count)問").captionStyle()
                }
                Spacer()
                Image(systemName: "chevron.right").foregroundStyle(Theme.inkSoft).font(.system(size: 13))
            }
        }
    }
}

struct LessonDetailView: View {
    let lesson: Lesson
    @EnvironmentObject var store: StudyStore
    @State private var showQuiz = false

    private var isDone: Bool { store.isLessonCompleted(lesson.id) }

    var body: some View {
        ZStack {
            AppBackground()
            ScrollView {
                VStack(alignment: .leading, spacing: Theme.Space.l) {
                    HStack {
                        DomainChip(domain: lesson.domain)
                        Spacer()
                        if isDone {
                            HStack(spacing: 4) {
                                Image(systemName: "checkmark.circle.fill").foregroundStyle(Theme.green)
                                Text("履修済み").font(.system(size: 12, weight: .bold)).foregroundStyle(Theme.green)
                            }
                        } else {
                            Text("約\(lesson.estimatedMinutes)分").captionStyle()
                        }
                    }
                    Text(lesson.title).titleStyle()

                    Card {
                        HStack(alignment: .top, spacing: Theme.Space.s) {
                            Image(systemName: "sparkles").foregroundStyle(Theme.orange)
                            GlossaryText(text: lesson.summary, size: 14, weight: .medium, color: Theme.ink)
                        }
                    }

                    ForEach(Array(lesson.sections.enumerated()), id: \.offset) { _, section in
                        Card {
                            VStack(alignment: .leading, spacing: 8) {
                                Text(section.heading).font(.system(size: 16, weight: .bold)).foregroundStyle(Theme.navy)
                                GlossaryText(text: section.body, size: 15, color: Theme.ink, lineSpacing: 4)
                            }
                        }
                    }

                    if !lesson.quizIds.isEmpty {
                        PrimaryButton(title: "確認問題に進む（\(lesson.quizIds.count)問）", icon: "checklist") {
                            showQuiz = true
                        }
                    }

                    // 履修済みマークの手動トグル
                    completionButton
                }
                .padding(Theme.Space.l)
            }
        }
        .navigationTitle("レッスン")
        .navigationBarTitleDisplayMode(.inline)
        .navigationDestination(isPresented: $showQuiz) {
            QuizPlayerView(title: lesson.title,
                           questions: lesson.quizIds.compactMap { ContentRepository.shared.question(id: $0) },
                           showLessonLink: false,
                           onComplete: { store.markLessonCompleted(lesson.id) })
        }
    }

    @ViewBuilder private var completionButton: some View {
        if isDone {
            Button {
                store.unmarkLessonCompleted(lesson.id)
            } label: {
                Label("履修済みを取り消す", systemImage: "arrow.uturn.left")
                    .font(.system(size: 14, weight: .semibold))
                    .foregroundStyle(Theme.inkSoft)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(RoundedRectangle(cornerRadius: 12).stroke(Theme.inkSoft.opacity(0.3), lineWidth: 1))
            }
        } else {
            Button {
                store.markLessonCompleted(lesson.id)
            } label: {
                Label("このレッスンを履修済みにする", systemImage: "checkmark.circle")
                    .font(.system(size: 15, weight: .semibold))
                    .foregroundStyle(Theme.green)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 12)
                    .background(RoundedRectangle(cornerRadius: 12).fill(Theme.green.opacity(0.10)))
            }
        }
    }
}
