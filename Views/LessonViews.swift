import SwiftUI

struct LessonListView: View {
    let lessons = ContentRepository.shared.lessons
    var body: some View {
        ZStack {
            AppBackground()
            ScrollView {
                VStack(spacing: Theme.Space.m) {
                    ForEach(ExamDomain.allCases) { domain in
                        let items = lessons.filter { $0.domain == domain }
                        if !items.isEmpty {
                            VStack(alignment: .leading, spacing: Theme.Space.s) {
                                HStack { DomainChip(domain: domain); Spacer() }
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

    private func lessonRow(_ lesson: Lesson) -> some View {
        Card(padding: Theme.Space.m) {
            HStack(spacing: Theme.Space.m) {
                Image(systemName: "text.book.closed.fill").foregroundStyle(.white)
                    .frame(width: 40, height: 40).background(lesson.domain.color)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                VStack(alignment: .leading, spacing: 2) {
                    Text(lesson.title).font(.system(size: 15, weight: .semibold)).foregroundStyle(Theme.ink)
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

    var body: some View {
        ZStack {
            AppBackground()
            ScrollView {
                VStack(alignment: .leading, spacing: Theme.Space.l) {
                    HStack { DomainChip(domain: lesson.domain); Spacer()
                        Text("約\(lesson.estimatedMinutes)分").captionStyle() }
                    Text(lesson.title).titleStyle()

                    Card {
                        HStack(alignment: .top, spacing: Theme.Space.s) {
                            Image(systemName: "sparkles").foregroundStyle(Theme.orange)
                            Text(lesson.summary).font(.system(size: 14, weight: .medium)).foregroundStyle(Theme.ink)
                        }
                    }

                    ForEach(Array(lesson.sections.enumerated()), id: \.offset) { _, section in
                        Card {
                            VStack(alignment: .leading, spacing: 8) {
                                Text(section.heading).font(.system(size: 16, weight: .bold)).foregroundStyle(Theme.navy)
                                Text(section.body).font(.system(size: 15)).foregroundStyle(Theme.ink)
                                    .fixedSize(horizontal: false, vertical: true)
                                    .lineSpacing(4)
                            }
                        }
                    }

                    if !lesson.quizIds.isEmpty {
                        PrimaryButton(title: "確認問題に進む（\(lesson.quizIds.count)問）", icon: "checklist") {
                            showQuiz = true
                        }
                    }
                }
                .padding(Theme.Space.l)
            }
        }
        .navigationTitle("レッスン")
        .navigationBarTitleDisplayMode(.inline)
        .navigationDestination(isPresented: $showQuiz) {
            QuizPlayerView(title: lesson.title,
                           questions: lesson.quizIds.compactMap { ContentRepository.shared.question(id: $0) })
        }
    }
}
