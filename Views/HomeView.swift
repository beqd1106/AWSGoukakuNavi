import SwiftUI

struct HomeView: View {
    @EnvironmentObject var store: StudyStore

    var body: some View {
        NavigationStack {
            ZStack {
                AppBackground()
                ScrollView {
                    VStack(alignment: .leading, spacing: Theme.Space.l) {
                        headerCard
                        examPrepBanner
                        todaySection
                        roadmapCard
                        passProbabilityCard
                    }
                    .padding(Theme.Space.l)
                }
            }
            .navigationTitle("ホーム")
            .navigationDestination(for: HomeRoute.self) { route in
                destination(for: route)
            }
        }
    }

    // MARK: - ヘッダ（あいさつ＋連続日数＋試験まで）

    private var headerCard: some View {
        Card {
            VStack(alignment: .leading, spacing: Theme.Space.m) {
                let name = store.profile?.name ?? ""
                Text(greeting + (name.isEmpty ? "" : "、\(name)さん"))
                    .font(.system(size: 15)).foregroundStyle(Theme.inkSoft)
                Text("今日も合格へ一歩進もう").font(.system(size: 20, weight: .bold)).foregroundStyle(Theme.navy)

                HStack(spacing: Theme.Space.m) {
                    statTile(icon: "flame.fill", color: Theme.orange,
                             value: "\(store.studyStreak())", unit: "日連続")
                    if let days = store.profile?.daysUntilExam {
                        statTile(icon: "calendar", color: Theme.blue,
                                 value: days >= 0 ? "\(days)" : "経過",
                                 unit: days >= 0 ? "日で試験" : "試験日")
                    } else {
                        statTile(icon: "checklist", color: Theme.teal,
                                 value: "\(store.totalAnswered)", unit: "問演習")
                    }
                }
            }
        }
    }

    private func statTile(icon: String, color: Color, value: String, unit: String) -> some View {
        HStack(spacing: Theme.Space.s) {
            Image(systemName: icon).foregroundStyle(color)
            HStack(alignment: .firstTextBaseline, spacing: 2) {
                Text(value).font(.system(size: 22, weight: .bold)).foregroundStyle(Theme.navy)
                Text(unit).font(.system(size: 12)).foregroundStyle(Theme.inkSoft)
            }
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, Theme.Space.s)
        .background(color.opacity(0.08))
        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.chip))
    }

    // MARK: - 試験直前バナー

    @ViewBuilder private var examPrepBanner: some View {
        if let days = store.profile?.daysUntilExam, days >= 0, days <= 7 {
            NavigationLink(value: HomeRoute.finalCheck) {
                Card {
                    HStack(spacing: Theme.Space.m) {
                        Image(systemName: "bolt.fill").font(.system(size: 22)).foregroundStyle(.white)
                            .frame(width: 44, height: 44)
                            .background(Theme.orange).clipShape(Circle())
                        VStack(alignment: .leading, spacing: 2) {
                            Text("試験直前モード").font(.system(size: 16, weight: .bold)).foregroundStyle(Theme.navy)
                            Text("残り\(days)日。頻出ポイントを総復習").captionStyle()
                        }
                        Spacer()
                        Image(systemName: "chevron.right").foregroundStyle(Theme.inkSoft)
                    }
                }
            }
            .buttonStyle(.plain)
        }
    }

    // MARK: - 今日の学習

    private var todaySection: some View {
        VStack(alignment: .leading, spacing: Theme.Space.m) {
            SectionHeader(title: "今日の学習")
            ForEach(store.todayTasks()) { task in
                NavigationLink(value: route(for: task)) {
                    taskRow(task)
                }
                .buttonStyle(.plain)
            }
        }
    }

    private func taskRow(_ task: TodayTask) -> some View {
        Card(padding: Theme.Space.m) {
            HStack(spacing: Theme.Space.m) {
                Image(systemName: icon(for: task.kind))
                    .font(.system(size: 18)).foregroundStyle(.white)
                    .frame(width: 40, height: 40)
                    .background(color(for: task.kind))
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                VStack(alignment: .leading, spacing: 2) {
                    Text(task.title).font(.system(size: 15, weight: .semibold)).foregroundStyle(Theme.ink)
                    Text(task.subtitle).captionStyle()
                }
                Spacer()
                Image(systemName: "chevron.right").foregroundStyle(Theme.inkSoft).font(.system(size: 13))
            }
        }
    }

    // MARK: - ロードマップ

    private var roadmapCard: some View {
        NavigationLink(value: HomeRoute.roadmap) {
            Card {
                VStack(alignment: .leading, spacing: Theme.Space.s) {
                    HStack {
                        Text("学習ロードマップ").font(.system(size: 16, weight: .bold)).foregroundStyle(Theme.navy)
                        Spacer()
                        Image(systemName: "chevron.right").foregroundStyle(Theme.inkSoft)
                    }
                    let plan = store.profile?.plan ?? .standard8
                    Text("\(plan.title)（全\(plan.durationWeeks)週）／今は\(store.currentWeek)週目")
                        .captionStyle()
                    ProgressBar(value: Double(store.currentWeek) / Double(plan.durationWeeks), color: Theme.blue)
                    if let goal = PlanFactory.roadmap(for: plan).first(where: { $0.week == store.currentWeek }) {
                        Text("今週：\(goal.title)").font(.system(size: 13, weight: .semibold)).foregroundStyle(Theme.blue)
                    }
                }
            }
        }
        .buttonStyle(.plain)
    }

    // MARK: - 合格可能性（簡易）

    private var passProbabilityCard: some View {
        let score = store.passProbabilityScore()
        return Card {
            HStack(spacing: Theme.Space.l) {
                ScoreRing(value: Double(score)/100, color: Theme.orange,
                          label: "\(score)", caption: "目安")
                    .frame(width: 92, height: 92)
                VStack(alignment: .leading, spacing: 6) {
                    Text("合格可能性スコア").font(.system(size: 15, weight: .bold)).foregroundStyle(Theme.navy)
                    Text(PassProbability.label(for: score)).font(.system(size: 13)).foregroundStyle(Theme.ink)
                    Text("※合格を保証するものではなく学習の目安です").font(.system(size: 11)).foregroundStyle(Theme.inkSoft)
                }
            }
        }
    }

    // MARK: - ルーティング

    private func route(for task: TodayTask) -> HomeRoute {
        switch task.kind {
        case .lesson: return .lesson(task.refId ?? "")
        case .terms:  return .terms(ExamDomain(rawValue: task.refId ?? "") ?? .cloudConcepts)
        case .quiz:   return .quiz(ExamDomain(rawValue: task.refId ?? "") ?? .cloudConcepts)
        case .review: return .review
        }
    }

    @ViewBuilder private func destination(for route: HomeRoute) -> some View {
        switch route {
        case .lesson(let id):
            if let lesson = ContentRepository.shared.lessons.first(where: { $0.id == id }) {
                LessonDetailView(lesson: lesson)
            }
        case .terms(let domain):
            TermListView(domain: domain)
        case .quiz(let domain):
            QuizPlayerView(title: domain.shortTitle + "の確認問題",
                           questions: Array(ContentRepository.shared.questions(in: domain).shuffled().prefix(5)))
        case .review:
            QuizPlayerView(title: "復習", questions: store.dueReviewQuestions(limit: 10))
        case .roadmap:
            RoadmapView()
        case .finalCheck:
            FinalCheckView()
        }
    }

    private var greeting: String {
        let h = Calendar.current.component(.hour, from: .now)
        switch h {
        case 5..<11: return "おはようございます"
        case 11..<17: return "こんにちは"
        default: return "こんばんは"
        }
    }

    private func icon(for kind: TodayTask.Kind) -> String {
        switch kind {
        case .lesson: return "text.book.closed.fill"
        case .terms: return "rectangle.on.rectangle.angled"
        case .quiz: return "checklist"
        case .review: return "arrow.clockwise"
        }
    }
    private func color(for kind: TodayTask.Kind) -> Color {
        switch kind {
        case .lesson: return Theme.blue
        case .terms: return Theme.teal
        case .quiz: return Theme.orange
        case .review: return Theme.navy
        }
    }
}

/// ホームからの遷移先
enum HomeRoute: Hashable {
    case lesson(String)
    case terms(ExamDomain)
    case quiz(ExamDomain)
    case review
    case roadmap
    case finalCheck
}
