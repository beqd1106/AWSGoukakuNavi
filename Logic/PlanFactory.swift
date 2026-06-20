import Foundation

/// 8週間標準カリキュラムをベースに、選択プランの週数へスケールして
/// 週ごとの学習テーマ（ロードマップ）を生成する。
struct WeekGoal: Identifiable, Hashable {
    let id = UUID()
    let week: Int
    let title: String
    let detail: String
    let domains: [ExamDomain]
}

enum PlanFactory {

    /// 完全初心者向け 8週間の標準ロードマップ（公式範囲に沿う）
    private static let baseEightWeeks: [WeekGoal] = [
        .init(week: 1, title: "クラウドの基礎", detail: "クラウドとは何か／AWSとは／クラウドの価値", domains: [.cloudConcepts]),
        .init(week: 2, title: "主要サービスの全体像", detail: "EC2・S3・RDS・Lambdaなど中心サービスの役割", domains: [.technology]),
        .init(week: 3, title: "セキュリティの基本", detail: "責任共有モデル・IAM・コンプライアンス", domains: [.security]),
        .init(week: 4, title: "ネットワークと配信", detail: "VPC・CloudFront・Route 53・グローバルインフラ", domains: [.technology]),
        .init(week: 5, title: "料金とサポート", detail: "料金モデル・請求・コスト管理・サポートプラン", domains: [.billing]),
        .init(week: 6, title: "分野別の問題演習", detail: "4分野を横断して演習し、苦手を洗い出す", domains: ExamDomain.allCases),
        .init(week: 7, title: "模擬試験と弱点補強", detail: "模試→間違い集中復習のサイクル", domains: ExamDomain.allCases),
        .init(week: 8, title: "試験直前対策", detail: "頻出用語・比較・責任共有モデルの総仕上げ", domains: ExamDomain.allCases),
    ]

    /// プラン週数に合わせてロードマップを生成する。
    /// 8週以外は週数に応じて圧縮/伸長する（テーマの順序は保つ）。
    static func roadmap(for plan: StudyPlanType) -> [WeekGoal] {
        let weeks = plan.durationWeeks
        if weeks == 8 { return baseEightWeeks }

        var result: [WeekGoal] = []
        for w in 1...weeks {
            // 8週カリキュラム上の対応位置を比例で求める
            let srcIndex = min(baseEightWeeks.count - 1,
                               Int((Double(w - 1) / Double(weeks - 1)) * Double(baseEightWeeks.count - 1)))
            let base = baseEightWeeks[srcIndex]
            result.append(.init(week: w, title: base.title, detail: base.detail, domains: base.domains))
        }
        return result
    }

    /// 現在の経過日数から「今が何週目か」を返す（1始まり）。
    static func currentWeek(startedAt: Date, plan: StudyPlanType, now: Date = .now) -> Int {
        let days = Calendar.current.dateComponents([.day],
            from: Calendar.current.startOfDay(for: startedAt),
            to: Calendar.current.startOfDay(for: now)).day ?? 0
        let week = days / 7 + 1
        return min(max(week, 1), plan.durationWeeks)
    }
}
