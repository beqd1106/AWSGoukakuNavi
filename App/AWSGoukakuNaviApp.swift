import SwiftUI
import SwiftData

@main
struct AWSGoukakuNaviApp: App {
    /// SwiftData コンテナ（ローカル完結）。将来 CloudKit へ拡張する場合はここを差し替える。
    let container: ModelContainer

    init() {
        let schema = Schema([
            UserProfile.self,
            AnswerRecord.self,
            ReviewItem.self,
            QuestionMeta.self,
            MockExamResult.self,
            StudyDayLog.self,
        ])
        do {
            container = try ModelContainer(for: schema)
        } catch {
            fatalError("SwiftData コンテナの初期化に失敗しました: \(error)")
        }
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .modelContainer(container)
                .tint(Theme.blue)
        }
    }
}
