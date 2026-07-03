import Foundation

/// バンドル内JSONから学習コンテンツを読み込み、メモリにキャッシュする。
/// オフラインで完全に動作する（ネットワーク不要）。
final class ContentRepository {
    static let shared = ContentRepository()

    let questions: [QuizQuestion]
    let terms: [TermCard]
    let lessons: [Lesson]
    let services: [AWSServiceItem]
    /// 用語集（長い語を優先マッチできるよう term.count 降順で保持）
    let glossary: [GlossaryEntry]

    private let questionsById: [String: QuizQuestion]

    private init() {
        self.questions = Self.load("questions", as: [QuizQuestion].self)
        self.terms     = Self.load("terms", as: [TermCard].self)
        self.lessons   = Self.load("lessons", as: [Lesson].self)
        self.services  = Self.load("services", as: [AWSServiceItem].self)
        // glossary.json が無い環境でも落ちないよう任意ロード
        let g = Self.loadOptional("glossary", as: [GlossaryEntry].self) ?? []
        self.glossary  = g.sorted { $0.term.count > $1.term.count }
        self.questionsById = Dictionary(uniqueKeysWithValues: questions.map { ($0.id, $0) })
    }

    // MARK: - 検索ヘルパ

    func question(id: String) -> QuizQuestion? { questionsById[id] }

    func questions(in domain: ExamDomain) -> [QuizQuestion] {
        questions.filter { $0.domain == domain }
    }

    func lessons(in domain: ExamDomain) -> [Lesson] {
        lessons.filter { $0.domain == domain }
    }

    func terms(in domain: ExamDomain) -> [TermCard] {
        terms.filter { $0.domain == domain }
    }

    func searchTerms(_ keyword: String) -> [TermCard] {
        let k = keyword.trimmingCharacters(in: .whitespaces).lowercased()
        guard !k.isEmpty else { return terms }
        return terms.filter {
            $0.term.lowercased().contains(k)
            || $0.shortDescription.lowercased().contains(k)
            || $0.beginnerExplanation.lowercased().contains(k)
        }
    }

    /// 模擬試験用：公式配点に近い比率で出題を組み立てる。
    /// 問題数が限られていても各分野の比率を保つよう抽選する。
    func buildMockExam(count: Int) -> [QuizQuestion] {
        var picked: [QuizQuestion] = []
        for domain in ExamDomain.allCases {
            let target = max(1, Int((Double(count) * domain.weight).rounded()))
            let pool = questions(in: domain).shuffled()
            picked.append(contentsOf: pool.prefix(target))
        }
        // 不足・超過を調整
        if picked.count > count {
            picked = Array(picked.shuffled().prefix(count))
        } else if picked.count < count {
            let remaining = questions.filter { q in !picked.contains(where: { $0.id == q.id }) }
            picked.append(contentsOf: remaining.shuffled().prefix(count - picked.count))
        }
        return picked.shuffled()
    }

    // MARK: - ローダ

    private static func load<T: Decodable>(_ name: String, as type: T.Type) -> T {
        guard let url = Bundle.main.url(forResource: name, withExtension: "json") else {
            fatalError("リソース \(name).json が見つかりません。project.yml のResources設定を確認してください。")
        }
        do {
            let data = try Data(contentsOf: url)
            return try JSONDecoder().decode(T.self, from: data)
        } catch {
            fatalError("\(name).json のデコードに失敗しました: \(error)")
        }
    }

    /// 任意リソース（無ければ nil を返す。glossary など後付けデータ用）
    private static func loadOptional<T: Decodable>(_ name: String, as type: T.Type) -> T? {
        guard let url = Bundle.main.url(forResource: name, withExtension: "json"),
              let data = try? Data(contentsOf: url) else { return nil }
        return try? JSONDecoder().decode(T.self, from: data)
    }
}
