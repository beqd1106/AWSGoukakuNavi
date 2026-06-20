import SwiftUI
import SwiftData

/// 起動直後のルート。StudyStore を生成し、オンボーディング完了状態で分岐する。
struct RootView: View {
    @Environment(\.modelContext) private var context
    @StateObject private var store: StudyStoreHolder = .init()

    var body: some View {
        Group {
            if let store = store.store {
                if store.hasCompletedOnboarding {
                    MainTabView()
                        .environmentObject(store)
                } else {
                    OnboardingFlowView()
                        .environmentObject(store)
                }
            } else {
                // コンテキスト注入前の一瞬
                AppBackground()
            }
        }
        .onAppear { store.configure(context: context) }
    }
}

/// @StateObject で ModelContext を受け取るための薄いホルダ。
/// （StudyStore 自体は init に context が必要なため、onAppear で遅延生成する）
@MainActor
final class StudyStoreHolder: ObservableObject {
    @Published var store: StudyStore?
    func configure(context: ModelContext) {
        if store == nil { store = StudyStore(context: context) }
    }
}
