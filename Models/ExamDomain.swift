import SwiftUI

/// CLF-C02（AWS Certified Cloud Practitioner）の4つの試験分野。
/// 配点は公式試験ガイド（CLF-C02）に準拠：
///   Cloud Concepts 24% / Security & Compliance 30% /
///   Cloud Technology & Services 34% / Billing, Pricing & Support 12%
/// ※配点・範囲は変更されることがあるため、最新情報は必ず公式サイトで確認すること。
enum ExamDomain: String, CaseIterable, Codable, Identifiable {
    case cloudConcepts
    case security
    case technology
    case billing

    var id: String { rawValue }

    /// 公式の出題比率（合格可能性スコアや模試の出題配分に使用）
    var weight: Double {
        switch self {
        case .cloudConcepts: return 0.24
        case .security:      return 0.30
        case .technology:    return 0.34
        case .billing:       return 0.12
        }
    }

    var title: String {
        switch self {
        case .cloudConcepts: return "クラウドの概念"
        case .security:      return "セキュリティとコンプライアンス"
        case .technology:    return "クラウドテクノロジーとサービス"
        case .billing:       return "請求・料金・サポート"
        }
    }

    var shortTitle: String {
        switch self {
        case .cloudConcepts: return "概念"
        case .security:      return "セキュリティ"
        case .technology:    return "サービス"
        case .billing:       return "料金"
        }
    }

    /// 配点を百分率の整数で（UI表示用）
    var weightPercent: Int { Int((weight * 100).rounded()) }

    var color: Color {
        switch self {
        case .cloudConcepts: return Theme.blue
        case .security:      return Theme.navy
        case .technology:    return Theme.orange
        case .billing:       return Theme.teal
        }
    }

    var systemIcon: String {
        switch self {
        case .cloudConcepts: return "cloud.fill"
        case .security:      return "lock.shield.fill"
        case .technology:    return "square.stack.3d.up.fill"
        case .billing:       return "yensign.circle.fill"
        }
    }
}
