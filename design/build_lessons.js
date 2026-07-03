// レッスン生成スクリプト
// 分野別レッスンを定義し、既存 questions.json（543問）から service / tags に基づいて
// 各レッスンの確認問題（quizIds）を自動割当する。存在する問題IDのみを参照するため、
// 壊れた参照は生成されない。
//   node design/build_lessons.js
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const questions = JSON.parse(fs.readFileSync(path.join(ROOT, "Resources/questions.json"), "utf8"));

// ---- マッチング ----
const norm = (s) => String(s).toLowerCase().replace(/amazon|aws|[\s\-・()（）]/g, "");
function qMatches(q, keys) {
  const cands = [q.service, ...(q.tags || [])].map(norm);
  return keys.some((k) => {
    const nk = norm(k);
    return cands.some((c) => c === nk || c.includes(nk));
  });
}

// ---- レッスン定義（domain順＝cloudConcepts / security / technology / billing）----
// match: 確認問題を集めるための service / tag キーワード
const LESSONS = [
  // ===================== cloudConcepts（概念）=====================
  {
    id: "l-cc-01", domain: "cloudConcepts", minutes: 6,
    title: "そもそもクラウドとは？",
    summary: "クラウド＝必要なときに、必要なだけ、ネット経由で借りる仕組み。買わずに借りる発想が出発点。",
    sections: [
      { heading: "身近な例えで理解する", body: "電気を使うのに自宅で発電する人はいません。電力会社から「使った分だけ」買いますよね。クラウドも同じで、サーバーやストレージを自分で買わず、AWSから必要な分だけ借りて、使った分だけ払います。" },
      { heading: "買う（オンプレミス）との違い", body: "従来は自社でサーバーを購入し、置き場所・電源・故障対応まで自前で行いました（オンプレミス）。クラウドはこれらをAWSに任せ、数分で増やしたり減らしたりできます。" },
      { heading: "ここがポイント", body: "「初期投資が小さい」「使った分だけ課金」「すぐ増減できる」。この3つがクラウドの価値の核です。試験でも繰り返し問われます。" },
    ],
    match: ["従量課金", "クラウドの価値", "オンプレミス", "資本的支出", "変動費"],
  },
  {
    id: "l-cc-02", domain: "cloudConcepts", minutes: 7,
    title: "クラウドの6つのメリット",
    summary: "初期投資→変動費化、規模の経済、キャパシティ予測不要、俊敏性、運用負荷の削減、グローバル展開。この6つを言い回しごと覚える。",
    sections: [
      { heading: "クラウド導入の主なメリット", body: "①初期の大きな投資が不要（固定費を変動費に）②規模の経済で安くなる③将来の必要量を当てる必要がない④数分で調達できる俊敏性⑤データセンター運用から解放⑥数分で世界展開。これがAWS公式が挙げる6つの利点です。" },
      { heading: "言葉の言い換えに注意", body: "俊敏性＝アジリティ、弾力性＝エラスティシティ、規模の経済＝ボリュームディスカウント。試験では日本語・英語・言い換えのどれでも問われます。意味とセットで結び付けましょう。" },
      { heading: "ここがポイント", body: "「固定費を変動費に変える（trade capital expense for variable expense）」は最頻出フレーズ。設備を買い込む代わりに、使った分だけ払う――この一文を軸に6つを整理します。" },
    ],
    match: ["クラウドの価値", "規模の経済", "俊敏性", "弾力性", "変動費"],
  },
  {
    id: "l-cc-03", domain: "cloudConcepts", minutes: 6,
    title: "クラウドのデプロイモデル",
    summary: "すべてクラウド（クラウド）／自社設備のみ（オンプレミス）／両方つなぐ（ハイブリッド）。使い分けの理由を押さえる。",
    sections: [
      { heading: "3つの選び方", body: "クラウド（すべてAWS上）、オンプレミス（自社データセンターのみ）、ハイブリッド（両方を接続して使う）の3モデルがあります。まるごと移せない事情があるとき、まずハイブリッドで始めるのが現実的です。" },
      { heading: "ハイブリッドが選ばれる理由", body: "法規制でデータを社内に置く必要がある、既存の基幹システムと連携したい、段階的に移行したい――こうした場合に、社内とAWSをDirect ConnectやVPNでつなぐハイブリッド構成が使われます。" },
      { heading: "ここがポイント", body: "「既存資産を残しつつクラウドの利点も得たい＝ハイブリッド」が定番の問われ方。すべて新規ならクラウド、動かせない事情があればハイブリッド、と判断します。" },
    ],
    match: ["デプロイモデル", "ハイブリッド", "オンプレミス"],
  },
  {
    id: "l-cc-04", domain: "cloudConcepts", minutes: 7,
    title: "AWSグローバルインフラ（リージョン・AZ・エッジ）",
    summary: "世界＝リージョン、リージョンの中に複数のAZ（データセンター群）、利用者の近くにエッジロケーション。この3層構造で覚える。",
    sections: [
      { heading: "リージョンとアベイラビリティーゾーン", body: "リージョンは東京・大阪など地理的な大きなまとまり。各リージョンには物理的に離れた複数のアベイラビリティーゾーン（AZ）があります。AZをまたいで配置すると、片方のデータセンターが落ちてもサービスを続けられます。" },
      { heading: "エッジロケーション", body: "エッジロケーションは利用者のより近くにある拠点で、CloudFront（CDN）などが使います。コンテンツを近くから配信することで表示を速くします。" },
      { heading: "リージョンの選び方", body: "①利用者に近い（低遅延）②法令・データ所在地（コンプライアンス）③使いたいサービスがある④料金。この4観点でリージョンを選びます。" },
    ],
    match: ["グローバルインフラ", "リージョン", "アベイラビリティーゾーン", "エッジ", "リージョン選定"],
  },
  {
    id: "l-cc-05", domain: "cloudConcepts", minutes: 7,
    title: "可用性・弾力性・スケーラビリティ",
    summary: "止まらない＝可用性、需要に合わせ自動で増減＝弾力性、大きくできる＝スケーラビリティ。似た言葉を区別する。",
    sections: [
      { heading: "高可用性（高くする方法）", body: "1台が壊れても止まらないよう、複数のAZに分散し、ロードバランサーで振り分けます。「単一障害点をなくす」のが高可用性の基本の考え方です。" },
      { heading: "弾力性（エラスティシティ）", body: "アクセスが増えたら自動でサーバーを増やし、減ったら減らす――これが弾力性。Auto Scalingが代表例で、必要な分だけに調整してコストも抑えます。" },
      { heading: "スケールアップとスケールアウト", body: "スケールアップ＝1台を高性能にする（垂直）。スケールアウト＝台数を増やす（水平）。クラウドでは、台数を増やすスケールアウトが柔軟で相性が良いとされます。" },
    ],
    match: ["可用性", "弾力性", "スケーラビリティ", "スケールアウト", "単一障害点", "フォールトトレランス"],
  },
  {
    id: "l-cc-06", domain: "cloudConcepts", minutes: 8,
    title: "AWS Well-Architected フレームワーク",
    summary: "良い設計を点検する6つの柱：運用上の優秀性・セキュリティ・信頼性・パフォーマンス効率・コスト最適化・持続可能性。",
    sections: [
      { heading: "6つの柱とは", body: "Well-Architectedは「良いクラウド設計のチェックリスト」です。運用上の優秀性／セキュリティ／信頼性／パフォーマンス効率／コスト最適化／持続可能性――この6観点で設計を見直します。" },
      { heading: "それぞれのねらい", body: "信頼性＝障害から回復できるか、パフォーマンス効率＝資源を無駄なく使えるか、コスト最適化＝払いすぎていないか、持続可能性＝環境負荷を減らせるか。柱の名前と目的をペアで覚えます。" },
      { heading: "ここがポイント", body: "「この状況はどの柱に当たるか」を問う出題が典型です。例：バックアップや復旧の話→信頼性、無駄な支出の話→コスト最適化。柱の追加（持続可能性）も要チェック。" },
    ],
    match: ["Well-Architected", "設計の柱", "信頼性", "運用上の優秀性", "持続可能性"],
  },
  {
    id: "l-cc-07", domain: "cloudConcepts", minutes: 7,
    title: "クラウド導入フレームワーク（AWS CAF）",
    summary: "組織がクラウドへ移行するときの道しるべ。6つの視点（ビジネス／人／ガバナンス／プラットフォーム／セキュリティ／オペレーション）。",
    sections: [
      { heading: "AWS CAFとは", body: "AWS Cloud Adoption Framework（CAF）は、会社全体でクラウド移行を進めるための指針です。技術だけでなく、人や組織の準備も含めて整理します。" },
      { heading: "6つのパースペクティブ", body: "ビジネス・人材（People）・ガバナンスは「経営や組織」の視点、プラットフォーム・セキュリティ・オペレーションは「技術」の視点。前半3つと後半3つで役割が分かれます。" },
      { heading: "ここがポイント", body: "「従業員の再教育やスキル移行はどの視点か→People（人材）」のように、視点の担当範囲を問う出題が多いです。CAFは移行の進め方の枠組みだと押さえます。" },
    ],
    match: ["CAF", "導入フレームワーク", "移行の視点"],
  },
  {
    id: "l-cc-08", domain: "cloudConcepts", minutes: 7,
    title: "クラウド移行の戦略（6つのR）",
    summary: "既存システムをどうクラウドへ運ぶか。リホスト／リプラットフォーム／リファクタ／リパーチェス／リタイア／リテイン。",
    sections: [
      { heading: "代表的な移行方式", body: "リホスト（そのまま移す＝リフト＆シフト）、リプラットフォーム（少し手直しして移す）、リファクタリング（作り替える）。手をかけないほど速く、かけるほどクラウドの利点を活かせます。" },
      { heading: "残りの3R", body: "リパーチェス（SaaSなどに買い替え）、リタイア（不要なので廃止）、リテイン（今は残す）。すべてを移す必要はなく「やめる・残す」も立派な戦略です。" },
      { heading: "ここがポイント", body: "「まず速く移したい→リホスト」「クラウド最適化を優先→リファクタ」のように、目的と方式の対応を問われます。移行支援はMigration Hubなどが助けます。" },
    ],
    match: ["移行", "リホスト", "リフトアンドシフト", "Migration Hub", "移行戦略"],
  },

  // ===================== security（セキュリティ）=====================
  {
    id: "l-sec-01", domain: "security", minutes: 7,
    title: "責任共有モデル",
    summary: "AWSは「クラウドそのもの」の安全、利用者は「クラウドの中身」の安全。境界線を正しく引けるかが要。",
    sections: [
      { heading: "誰が何を守るのか", body: "AWSはデータセンター・ハードウェア・基盤ソフトなど「クラウドそのもの（of the cloud）」を守ります。利用者はデータ・アクセス権限・OSやアプリの設定など「クラウドの中身（in the cloud）」を守ります。" },
      { heading: "サービスで境界が動く", body: "EC2ではOSのパッチ当ては利用者の責任。一方、S3やLambdaのようなマネージドサービスでは、AWSが担う範囲が広がります。どこまでAWSが面倒を見るかはサービスで変わります。" },
      { heading: "ここがポイント", body: "「データの暗号化・IAM設定・ゲストOSの管理は利用者」「物理セキュリティ・ハイパーバイザーはAWS」が定番。迷ったら中身か・基盤かで切り分けます。" },
    ],
    match: ["責任共有モデル", "責任分界", "利用者の責任"],
  },
  {
    id: "l-sec-02", domain: "security", minutes: 8,
    title: "IAMの基本（ユーザー・グループ・ロール）",
    summary: "「誰が・何を・どこまで」できるかを管理する仕組み。ユーザー／グループ／ロール／ポリシーの4つを区別する。",
    sections: [
      { heading: "4つの登場人物", body: "ユーザー＝人やアプリのID、グループ＝ユーザーの束（権限をまとめて付与）、ロール＝一時的に権限を借りる仕組み、ポリシー＝許可の内容を書いた文書。この4つでアクセスを設計します。" },
      { heading: "ロールが便利な理由", body: "ロールはパスワードや長期キーを配らずに権限を渡せます。EC2にロールを付ければ、そのサーバーは鍵を持たずにS3へアクセスできます。サービス間の連携はロールが基本です。" },
      { heading: "ここがポイント", body: "「EC2からS3にアクセスさせたい→IAMロール」「複数ユーザーに同じ権限→グループ」が頻出。アクセスキーの直書きは避ける、が鉄則です。" },
    ],
    match: ["IAM", "ロール", "IAMグループ", "ユーザー"],
  },
  {
    id: "l-sec-03", domain: "security", minutes: 7,
    title: "IAMポリシーと最小権限の原則",
    summary: "許可はJSONのポリシーで表す。必要な権限だけを与える「最小権限」が全体を貫く原則。",
    sections: [
      { heading: "ポリシーの読み方", body: "ポリシーは「誰に（Principal）／何を（Action）／どのリソースに（Resource）／許可か拒否か（Effect）」を書いたルールです。明示的な拒否（Deny）は許可より常に優先されます。" },
      { heading: "最小権限の原則", body: "最初から広い権限を与えず、業務に必要な最小限だけを許可し、足りなければ足す――これが最小権限。事故や不正アクセスの被害を小さく抑えます。" },
      { heading: "ここがポイント", body: "「とりあえず管理者権限（AdministratorAccess）を全員に」はアンチパターン。役割ごとにポリシーを分け、グループで配るのが正解です。" },
    ],
    match: ["IAM", "ポリシー", "最小権限", "アクセス許可"],
  },
  {
    id: "l-sec-04", domain: "security", minutes: 7,
    title: "ルートユーザーの保護とMFA",
    summary: "アカウント最強のルートユーザーは金庫にしまう。MFAで二重ロック、普段は権限を絞ったIAMユーザーで作業。",
    sections: [
      { heading: "ルートユーザーとは", body: "アカウント作成時のメールアドレスでログインする最上位アカウント。すべての操作ができるため、日常業務には使わず、大事にしまっておくのが原則です。" },
      { heading: "MFA（多要素認証）", body: "MFAはパスワードに加えて、スマホアプリの数字コードなど2つ目の鍵を要求する仕組み。パスワードが漏れても、もう一つが無ければ入れません。ルートユーザーには必ず有効化します。" },
      { heading: "ここがポイント", body: "「ルートでしかできない作業」（アカウント解約・サポートプラン変更など）以外は、IAMユーザー／ロールで行う。ルートのアクセスキーは作らない・削除する、が定番です。" },
    ],
    match: ["ルートユーザー", "MFA", "多要素認証", "IAM"],
  },
  {
    id: "l-sec-05", domain: "security", minutes: 7,
    title: "認証とアクセスの集中管理",
    summary: "複数アカウント・大勢のユーザーをまとめて管理。IAM Identity Center／Cognito／Directory Service／STSの役割分担。",
    sections: [
      { heading: "社員のログインを一元化", body: "IAM Identity Center（旧AWS SSO）は、一度のログインで複数のAWSアカウントやアプリに入れるようにします。既存の社内IDと連携させ、管理を一つにまとめられます。" },
      { heading: "アプリ利用者の認証", body: "Amazon Cognitoは、自社アプリのサインアップ／ログイン機能を提供します。エンドユーザー（アプリの利用者）の認証はCognito、と覚えます。" },
      { heading: "一時的な権限とAD連携", body: "STSは短時間だけ有効な一時認証情報を発行します。Directory Serviceは社内のMicrosoft Active DirectoryをAWSと連携させるサービスです。" },
    ],
    match: ["Identity Center", "Cognito", "Directory Service", "STS", "シングルサインオン", "フェデレーション"],
  },
  {
    id: "l-sec-06", domain: "security", minutes: 8,
    title: "データの暗号化とKMS",
    summary: "保存中・通信中のデータを鍵で守る。鍵の管理はKMS、証明書はACM、パスワードなどはSecrets Manager。",
    sections: [
      { heading: "2種類の暗号化", body: "保存データの暗号化（at rest：S3やEBSに置いたまま暗号化）と、通信データの暗号化（in transit：HTTPS/TLSでやり取りを暗号化）。この2つを分けて考えます。" },
      { heading: "鍵を管理するKMS", body: "AWS KMS（Key Management Service）は暗号鍵の作成・管理・利用を一元化します。多くのサービスがKMSと連携し、チェック1つで暗号化できます。" },
      { heading: "証明書と機密情報", body: "ACM（Certificate Manager）はHTTPS用のTLS証明書を無料で発行・自動更新。Secrets Managerはデータベースのパスワードなどを安全に保管し、自動ローテーションもできます。" },
    ],
    match: ["暗号化", "KMS", "ACM", "Secrets Manager", "CloudHSM", "TLS"],
  },
  {
    id: "l-sec-07", domain: "security", minutes: 7,
    title: "脅威の検知（GuardDuty・Inspector・Macie）",
    summary: "怪しい動きを見張るGuardDuty、弱点を診断するInspector、個人情報を見つけるMacie。役割で区別する。",
    sections: [
      { heading: "GuardDuty＝不審な挙動の監視", body: "GuardDutyはログを自動で分析し、不正アクセスや異常な通信などの怪しい動きを検知します。見張り役の脅威検知サービス、と覚えます。" },
      { heading: "Inspector＝脆弱性の診断", body: "Amazon InspectorはEC2やコンテナイメージを自動スキャンし、既知の脆弱性や危険な設定を洗い出します。弱点の健康診断がInspectorです。" },
      { heading: "Macie＝機微データの発見", body: "Amazon MacieはS3の中から個人情報（氏名・クレカ番号など）を機械学習で見つけ出します。どこに大事なデータがあるかを教えてくれます。" },
    ],
    match: ["GuardDuty", "Inspector", "Macie", "脅威検知", "セキュリティサービス"],
  },
  {
    id: "l-sec-08", domain: "security", minutes: 7,
    title: "ネットワークとアプリの防御",
    summary: "サーバーの門番＝セキュリティグループ、Webの盾＝WAF、DDoS対策＝Shield。境界の守りを整理する。",
    sections: [
      { heading: "セキュリティグループとNACL", body: "セキュリティグループはインスタンス単位の仮想ファイアウォールで、許可した通信だけを通します（ステートフル）。ネットワークACLはサブネット単位で通信を制御します（ステートレス）。" },
      { heading: "WAFで攻撃を弾く", body: "AWS WAFはWebアプリを狙うSQLインジェクションやクロスサイトスクリプティングなどの攻撃をルールで遮断します。CloudFrontやALBの前に置いて使います。" },
      { heading: "ShieldでDDoS対策", body: "AWS ShieldはDDoS攻撃（大量アクセスでサービスを止める攻撃）から守ります。Standardは無料で自動適用、Advancedは高度な保護と支援が付きます。" },
    ],
    match: ["WAF", "Shield", "セキュリティグループ", "ネットワーク", "ファイアウォール", "DDoS", "Network Firewall"],
  },
  {
    id: "l-sec-09", domain: "security", minutes: 8,
    title: "監査とガバナンス",
    summary: "操作の記録＝CloudTrail、設定の監視＝Config、複数アカウント統制＝Organizations／Control Tower。",
    sections: [
      { heading: "誰が何をしたか（CloudTrail）", body: "AWS CloudTrailは「いつ・誰が・どのAPIを呼んだか」を記録します。不正操作の調査や監査証跡に使う操作の履歴です。" },
      { heading: "設定は正しいか（Config）", body: "AWS Configはリソースの設定変更を追跡し、ルール（例：S3は暗号化必須）に違反していないか継続的に評価します。あるべき状態からのズレを検知します。" },
      { heading: "複数アカウントの統制", body: "AWS Organizationsで複数アカウントを束ね、SCP（サービスコントロールポリシー）で全体の上限を決めます。Control Towerは安全な複数アカウント環境をひな形から自動構築します。" },
    ],
    match: ["CloudTrail", "Config", "Organizations", "Control Tower", "SCP", "ガバナンス", "監査"],
  },
  {
    id: "l-sec-10", domain: "security", minutes: 6,
    title: "コンプライアンスと監査資料（Artifact）",
    summary: "第三者認証の証拠はArtifactで入手。コンプライアンスもまた責任共有で成り立つ。",
    sections: [
      { heading: "AWS Artifactとは", body: "AWS Artifactは、SOCレポートやISO認証などAWSが取得した第三者監査の報告書をダウンロードできる場所です。監査対応でAWS側の証拠が必要なとき使います。" },
      { heading: "コンプライアンスの分担", body: "法令順守もまた責任共有です。AWSは基盤の認証を取得しますが、利用者は自分の使い方（データの扱い・設定）が規制に合っているかを担保します。" },
      { heading: "ここがポイント", body: "「監査人にAWSの準拠証明を提出したい→Artifact」が定番。準拠の対象範囲（自社設定は自社責任）も併せて問われます。" },
    ],
    match: ["Artifact", "コンプライアンス", "監査レポート", "準拠"],
  },

  // ===================== technology（テクノロジーとサービス）=====================
  {
    id: "l-tec-01", domain: "technology", minutes: 7,
    title: "まず押さえる主要サービス（EC2・S3・RDS・Lambda）",
    summary: "EC2＝仮想サーバー、S3＝保管箱、RDS＝管理を任せるSQL DB、Lambda＝サーバーレス実行。役割の違いで覚える。",
    sections: [
      { heading: "計算する：EC2とLambda", body: "EC2は自由度の高い仮想サーバーで、OSから自分で管理します。Lambdaはサーバーを意識せずコードを動かすサーバーレスで、使った分だけ課金。常時起動しない処理に向きます。" },
      { heading: "保存する：S3とRDS", body: "S3は画像やバックアップなどファイルを入れるオブジェクトストレージ。RDSはMySQLなど表形式のデータベースをAWSに管理してもらうサービスです。" },
      { heading: "ここがポイント", body: "「役割で覚える」のが攻略法。サーバー＝EC2/Lambda、ファイル＝S3、SQL DB＝RDS、NoSQL＝DynamoDB。混同しやすいので対比で整理します。" },
    ],
    match: ["コンピューティング", "主要サービス", "EC2", "サービスの選定"],
  },
  {
    id: "l-tec-02", domain: "technology", minutes: 8,
    title: "コンピューティング：EC2を理解する",
    summary: "EC2は自由度の高い仮想サーバー。インスタンスタイプ／AMI／EBSの関係と、責任範囲を押さえる。",
    sections: [
      { heading: "EC2の基本構成", body: "EC2はAMI（OSの雛形）からインスタンス（仮想サーバー）を起動し、EBS（仮想ディスク）を接続して使います。用途に応じて汎用・計算特化・メモリ特化などインスタンスタイプを選びます。" },
      { heading: "利用者の責任", body: "EC2はIaaS寄りで自由度が高い反面、OSのパッチ・ミドルウェア・アプリ・セキュリティグループ設定は利用者の責任です。責任共有モデルの中身を担当します。" },
      { heading: "軽く始めたいなら", body: "サーバー管理を最小限にしたいなら、簡単な構成の Lightsail や、コンテナ／サーバーレスも選択肢。まずEC2を基準に他と比較する視点を持ちます。" },
    ],
    match: ["EC2", "コンピューティング", "インスタンス", "AMI", "Lightsail"],
  },
  {
    id: "l-tec-03", domain: "technology", minutes: 8,
    title: "サーバーレスとコンテナ",
    summary: "サーバー管理ゼロ＝Lambda／Fargate。コンテナの入れ物＝ECS／EKS、置き場＝ECR。運用負荷で対比する。",
    sections: [
      { heading: "サーバーレスとは", body: "Lambdaはサーバーの用意・管理なしにコードを実行し、呼ばれたときだけ動いて使った分だけ課金。常時起動のコスト・運用が不要で、イベント駆動の処理に最適です。" },
      { heading: "コンテナサービス", body: "コンテナはアプリを箱に固めて動かす技術。ECSとEKS（Kubernetes）はコンテナの実行を管理し、ECRはコンテナイメージの保管庫です。" },
      { heading: "サーバー管理をなくす選択", body: "Fargateを使うと、ECS/EKSの土台となるサーバー管理も不要になります。「サーバーの面倒を見たくない＝Fargate/Lambda」と押さえます。" },
    ],
    match: ["Lambda", "Fargate", "ECS", "EKS", "ECR", "コンテナ", "サーバーレス", "App Runner", "Batch"],
  },
  {
    id: "l-tec-04", domain: "technology", minutes: 8,
    title: "ストレージの種類（S3・EBS・EFS・FSx）",
    summary: "オブジェクト＝S3、1台に付ける仮想ディスク＝EBS、複数から共有＝EFS/FSx。形と用途で区別する。",
    sections: [
      { heading: "3つのストレージ形式", body: "オブジェクトストレージ（S3：ファイルをまるごと保管）、ブロックストレージ（EBS：EC2に付ける仮想ディスク）、ファイルストレージ（EFS/FSx：複数サーバーから共有）。形が違えば用途も違います。" },
      { heading: "EBSとEFSの違い", body: "EBSは基本1つのEC2に接続する専用ディスク。EFSは多数のEC2から同時にマウントして共有できるファイル置き場です。共有したい＝EFSが判断の軸。" },
      { heading: "オンプレ連携と移行", body: "Storage Gatewayは社内システムとS3などをつなぐ橋渡し、DataSyncは大量データを高速にAWSへ転送します。物理輸送が要るほど巨大ならSnowファミリーを使います。" },
    ],
    match: ["ストレージ", "EBS", "EFS", "FSx", "Storage Gateway", "DataSync", "ブロックストレージ", "ファイルストレージ"],
  },
  {
    id: "l-tec-05", domain: "technology", minutes: 7,
    title: "S3を深掘り（ストレージクラスとGlacier）",
    summary: "S3は用途別のクラスで賢く節約。よく使う→標準、めったに見ない→Glacier。耐久性は非常に高い。",
    sections: [
      { heading: "ストレージクラスで最適化", body: "頻繁に使うデータは標準、たまにしか使わないなら低頻度アクセス、長期保管はGlacier系（取り出しに時間がかかる代わり激安）。アクセス頻度に合わせてコストを下げます。" },
      { heading: "自動で階層を移す", body: "アクセス頻度が読めないなら S3 Intelligent-Tiering が自動で最適なクラスへ移動。ライフサイクルルールで「90日後にGlacierへ」のような移行も設定できます。" },
      { heading: "S3の強み", body: "S3は非常に高い耐久性（イレブンナイン）を持ち、静的サイトのホスティングやバックアップ、データレイクの基盤にも使われます。まず入れ物として万能と押さえます。" },
    ],
    match: ["S3", "Glacier", "ストレージクラス", "オブジェクトストレージ", "ライフサイクル"],
  },
  {
    id: "l-tec-06", domain: "technology", minutes: 8,
    title: "データベースサービス",
    summary: "表形式のSQL＝RDS/Aurora、高速なNoSQL＝DynamoDB、超高速な一時置き＝ElastiCache、分析＝Redshift。",
    sections: [
      { heading: "リレーショナル（SQL）", body: "RDSはMySQL/PostgreSQLなどの管理をAWSに任せられるSQLデータベース。AuroraはAWSが最適化した高性能・高可用な互換DBです。表と行のデータ＝RDS/Aurora。" },
      { heading: "NoSQLとキャッシュ", body: "DynamoDBはキー・バリュー型のNoSQLで、超高速・自動スケール・サーバーレス。ElastiCache（Redis/Memcached）は超高速な一時記憶で、よく使うデータを手前に置いて高速化します。" },
      { heading: "用途特化のDB", body: "分析用の大規模データはRedshift（データウェアハウス）、グラフ構造はNeptune、ドキュメント型はDocumentDB。やりたいことに合わせて専用DBを選びます。" },
    ],
    match: ["データベース", "RDS", "Aurora", "DynamoDB", "Redshift", "ElastiCache", "Neptune", "DocumentDB", "NoSQL"],
  },
  {
    id: "l-tec-07", domain: "technology", minutes: 8,
    title: "ネットワークの基礎（VPC・Route 53）",
    summary: "自分専用の仮想ネットワーク＝VPC、その中の区画＝サブネット、名前解決＝Route 53。土台の地図を描く。",
    sections: [
      { heading: "VPCとサブネット", body: "VPCはAWS上に作る自分専用の仮想ネットワーク。中をパブリックサブネット（外に公開）とプライベートサブネット（内部専用）に分け、公開したいものだけ外に出します。" },
      { heading: "出入り口の部品", body: "インターネットゲートウェイで外とつなぎ、NATゲートウェイで内部サーバーから外へ安全に出ます。ルートテーブルで通信の経路を決めます。" },
      { heading: "DNSはRoute 53", body: "Route 53はドメイン名（example.com）をIPアドレスに変換するDNSサービス。ドメイン登録・ヘルスチェック・ルーティング制御もできます。" },
    ],
    match: ["VPC", "ネットワーク", "Route 53", "サブネット", "DNS"],
  },
  {
    id: "l-tec-08", domain: "technology", minutes: 7,
    title: "コンテンツ配信とハイブリッド接続",
    summary: "近くから速く届ける＝CloudFront、専用線で安定接続＝Direct Connect、暗号化トンネル＝VPN。",
    sections: [
      { heading: "CloudFront（CDN）", body: "CloudFrontは世界中のエッジロケーションからコンテンツを配信するCDN。利用者に近い拠点から届けるので表示が速く、オリジンの負荷も軽くなります。" },
      { heading: "オンプレとの接続", body: "Direct Connectはインターネットを介さない専用線で、安定・低遅延・大容量。VPNはインターネット上に暗号化トンネルを作る手軽な接続。安定重視＝Direct Connect、手軽さ＝VPN。" },
      { heading: "広域の高速化", body: "Global Acceleratorはユーザーからの通信をAWSの高速ネットワークに素早く載せ、遠距離アクセスを安定・高速化します。Transit Gatewayは多数のVPCや拠点を1点で束ねて接続します。" },
    ],
    match: ["CloudFront", "Direct Connect", "Global Accelerator", "Transit Gateway", "VPN", "CDN"],
  },
  {
    id: "l-tec-09", domain: "technology", minutes: 7,
    title: "高可用性とスケーリング（ELB・Auto Scaling）",
    summary: "アクセスを振り分ける＝ロードバランサー、台数を自動増減＝Auto Scaling。この2つで止まらない・溢れない。",
    sections: [
      { heading: "ロードバランサー（ELB）", body: "Elastic Load Balancingは複数のサーバーへアクセスを均等に振り分けます。1台が落ちても健全なサーバーへ回すので、可用性が上がります（ALB＝HTTP向け、NLB＝高速なTCP向け）。" },
      { heading: "Auto Scaling", body: "Auto Scalingは負荷に応じてEC2を自動で増減。混雑時は増やし、空いたら減らして、性能とコストを両立します。需要に合わせる＝弾力性の代表例です。" },
      { heading: "組み合わせで高可用性", body: "複数AZにサーバーを分散し、ELBで振り分け、Auto Scalingで増減――この3点セットが高可用性の王道パターンです。" },
    ],
    match: ["ELB", "Auto Scaling", "可用性", "ロードバランサ", "スケーリング"],
  },
  {
    id: "l-tec-10", domain: "technology", minutes: 8,
    title: "監視・自動化・IaC",
    summary: "計測と通知＝CloudWatch、構成をコード化＝CloudFormation、運用の自動化＝Systems Manager。",
    sections: [
      { heading: "CloudWatchで監視", body: "CloudWatchはメトリクス（CPU使用率など）やログを収集し、しきい値を超えたらアラームで通知します。サービスの健康状態を測る計器です。" },
      { heading: "IaC（コードでインフラ）", body: "CloudFormationはインフラ構成をテンプレート（コード）で定義し、同じ環境を何度でも自動で作れます。手作業のミスを防ぎ、再現性を高めます（IaC＝Infrastructure as Code）。" },
      { heading: "運用を自動化", body: "Systems Managerは多数のサーバーへのパッチ適用や設定をまとめて実行。X-Rayはアプリ内部の処理を追跡し、遅い箇所を可視化します。" },
    ],
    match: ["CloudWatch", "CloudFormation", "Systems Manager", "IaC", "監視", "X-Ray", "CDK", "Health Dashboard"],
  },
  {
    id: "l-tec-11", domain: "technology", minutes: 7,
    title: "アプリ連携（SQS・SNS・API Gateway）",
    summary: "処理を切り離す間の仕組み。キュー＝SQS、通知の配信＝SNS、APIの窓口＝API Gateway。疎結合を実現する。",
    sections: [
      { heading: "疎結合という考え方", body: "システム同士を直接つながず、間に仕組みを挟むことで、一方が遅れても全体が止まりにくくなります。これが疎結合。SQSやSNSがその要になります。" },
      { heading: "SQSとSNS", body: "SQS（キュー）は処理待ちのメッセージをためて、受け手が自分のペースで取り出せます。SNS（パブサブ）は1つの通知を複数の受け手へ一斉配信します。ためる＝SQS、配る＝SNS。" },
      { heading: "窓口とつなぎ役", body: "API GatewayはAPIの受付窓口となり、Lambdaなどのバックエンドとつなぎます。EventBridgeはイベントを条件で振り分け、Step Functionsは複数処理の流れを管理します。" },
    ],
    match: ["SQS", "SNS", "API Gateway", "EventBridge", "Step Functions", "疎結合", "MQ", "アプリケーション統合"],
  },
  {
    id: "l-tec-12", domain: "technology", minutes: 7,
    title: "分析サービス",
    summary: "S3を直接SQL＝Athena、大規模DWH＝Redshift、リアルタイム＝Kinesis、前処理＝Glue、可視化＝QuickSight。",
    sections: [
      { heading: "たまる→調べる", body: "S3にたまったデータをそのままSQLで調べるならAthena（サーバー不要）。継続的に大規模分析するならデータウェアハウスのRedshift。手軽＝Athena、本格＝Redshift。" },
      { heading: "流れるデータを扱う", body: "Kinesisはセンサーやログなど絶え間なく流れるデータをリアルタイムに取り込み・処理します。EMRはHadoop/Sparkで大規模なバッチ分析を行います。" },
      { heading: "整える・見せる", body: "Glueはデータの抽出・変換・統合（ETL）を行い分析の下ごしらえをします。QuickSightはグラフやダッシュボードでデータを見える化します。" },
    ],
    match: ["分析", "Athena", "Redshift", "Kinesis", "Glue", "QuickSight", "EMR", "OpenSearch", "Lake Formation", "データレイク"],
  },
  {
    id: "l-tec-13", domain: "technology", minutes: 7,
    title: "AI/MLと生成AI",
    summary: "モデルを作る土台＝SageMaker、すぐ使えるAI＝Rekognition等、生成AI＝Bedrock。用途で選ぶ。",
    sections: [
      { heading: "自分で作る：SageMaker", body: "SageMakerは機械学習モデルの構築・学習・デプロイを一気通貫で行う土台。自前でモデルを作りたい＝SageMakerと押さえます。" },
      { heading: "すぐ使えるAIサービス", body: "画像認識＝Rekognition、音声→文字＝Transcribe、文字→音声＝Polly、翻訳＝Translate、文章解析＝Comprehend、文書からデータ抽出＝Textract。用途名とサービス名をペアで覚えます。" },
      { heading: "生成AI：Bedrock", body: "Amazon Bedrockは、さまざまな基盤モデル（生成AI）をAPIで手軽に利用できるサービス。チャットや文章生成などをアプリに組み込めます。生成AIの入り口＝Bedrock。" },
    ],
    match: ["AI/ML", "生成AI", "SageMaker", "Rekognition", "Transcribe", "Polly", "Translate", "Comprehend", "Textract", "Lex", "Kendra", "Personalize", "Forecast", "Bedrock"],
  },
  {
    id: "l-tec-14", domain: "technology", minutes: 6,
    title: "AWSの操作方法とデプロイ支援",
    summary: "操作は3通り：画面（マネジメントコンソール）・コマンド（CLI）・プログラム（SDK）。手早く公開はElastic Beanstalk。",
    sections: [
      { heading: "3つの操作手段", body: "マネジメントコンソール（ブラウザのGUI）、AWS CLI（コマンドで操作・自動化向き）、SDK（プログラムから操作）。手作業＝コンソール、自動化＝CLI/SDKと使い分けます。" },
      { heading: "手早くアプリを公開", body: "Elastic Beanstalkはコードをアップするだけで、裏側のEC2やロードバランサーを自動で用意してくれるPaaS。インフラ構築を任せて素早く公開できます。" },
      { heading: "開発を支える", body: "CodePipeline/CodeBuild/CodeDeployは、テスト～デプロイの流れ（CI/CD）を自動化します。Amplifyはフロントエンド／モバイルアプリの開発・公開を手軽にします。" },
    ],
    match: ["開発者ツール", "Elastic Beanstalk", "CodePipeline", "Amplify", "CLI", "SDK", "マネジメントコンソール", "CI/CD", "App Runner"],
  },

  // ===================== billing（請求・料金・サポート）=====================
  {
    id: "l-bil-01", domain: "billing", minutes: 6,
    title: "料金の考え方と無料利用枠",
    summary: "基本は従量課金。使った分だけ・長く使うほど割引・データ転送は出る方に注意。無料利用枠で試せる。",
    sections: [
      { heading: "3つの料金原則", body: "AWS料金の基本は①使った分だけ払う（従量課金）②長期・大量ほど安くなる③必要に応じて増減。前払いや固定契約に縛られないのが特徴です。" },
      { heading: "データ転送のクセ", body: "AWSへ入れる通信（インバウンド）は基本無料、AWSから出る通信（アウトバウンド）は課金対象になりがち。出ていくデータにお金がかかると覚えます。" },
      { heading: "無料利用枠", body: "無料利用枠には、12か月無料・常に無料・トライアルの3種類があります。学習や検証は無料枠を活用しつつ、超過に注意します。" },
    ],
    match: ["料金モデル", "無料利用枠", "従量課金", "データ転送料金", "課金"],
  },
  {
    id: "l-bil-02", domain: "billing", minutes: 7,
    title: "EC2の購入オプションとSavings Plans",
    summary: "オンデマンド／リザーブド／スポットの3本柱＋Savings Plans。コミットするほど安くなる。",
    sections: [
      { heading: "EC2の3つの買い方", body: "オンデマンド＝いつでも使えるが割引なし。リザーブドインスタンス＝1〜3年コミットで大幅割引。スポット＝余剰を最大9割引で使えるが中断あり。用途に合わせて選びます。" },
      { heading: "Savings Plans", body: "Savings Plansは「1時間あたり◯ドル使う」と一定利用をコミットすることで、対象の料金を柔軟に割引。リザーブドより使い方の縛りがゆるいのが利点です。" },
      { heading: "使い分けの判断", body: "常時稼働で予測できる→リザーブド/Savings Plans、突発・短時間→オンデマンド、中断してもよいバッチ処理→スポット。継続度と中断可否で選びます。" },
    ],
    match: ["EC2料金", "Savings Plans", "リザーブド", "スポット", "オンデマンド", "料金モデル"],
  },
  {
    id: "l-bil-03", domain: "billing", minutes: 7,
    title: "コストを見積もる・管理する",
    summary: "事前見積り＝Pricing Calculator、予算アラート＝Budgets、分析＝Cost Explorer、明細＝CUR。ツールの役割を分ける。",
    sections: [
      { heading: "使う前に見積もる", body: "AWS Pricing Calculatorは、構成を入力して事前に月額を見積もるツール。導入前の予算組みに使います。これから作る費用の試算＝Calculator。" },
      { heading: "決める→振り返る", body: "AWS Budgetsは予算を決めて超過をアラート通知（＝先回りの管理）。Cost Explorerは過去のコストをグラフで分析（＝振り返り）。決める＝Budgets／振り返る＝Cost Explorer。" },
      { heading: "詳細な明細", body: "Cost and Usage Report（CUR）は最も詳しい利用明細を出力し、詳細分析に使います。コスト配分タグを付けると、部署やプロジェクト単位で費用を分けて見られます。" },
    ],
    match: ["Budgets", "Cost Explorer", "Pricing Calculator", "Cost and Usage Report", "コスト管理", "見積もり", "コスト配分タグ", "請求ダッシュボード"],
  },
  {
    id: "l-bil-04", domain: "billing", minutes: 6,
    title: "コスト最適化とTrusted Advisor",
    summary: "無駄を見つけて減らす。総合点検＝Trusted Advisor、最適なサイズ提案＝Compute Optimizer。",
    sections: [
      { heading: "Trusted Advisor", body: "Trusted Advisorはアカウントを自動点検し、コスト・セキュリティ・信頼性・性能・上限の観点で改善点を助言します。使っていない資源はないかなどを教えてくれます。" },
      { heading: "サイズの最適化", body: "Compute Optimizerは実際の使用状況から「このインスタンスは過大／過小」を分析し、最適なサイズを提案。無駄な性能への支払いを減らせます。" },
      { heading: "最適化の基本動作", body: "使っていない資源を止める、適正サイズに変える、割引プラン（リザーブド/Savings Plans）を使う、マネージド／サーバーレスで運用を減らす。この積み重ねがコスト最適化です。" },
    ],
    match: ["コスト最適化", "Trusted Advisor", "Compute Optimizer", "最適化"],
  },
  {
    id: "l-bil-05", domain: "billing", minutes: 6,
    title: "アカウント管理と一括請求（Organizations）",
    summary: "複数アカウントをまとめ、請求を1本化。ボリューム割引の合算とガバナンスを同時に得る。",
    sections: [
      { heading: "一括請求（Consolidated Billing）", body: "AWS Organizationsで複数アカウントを束ねると、請求をまとめて1つにできます。使用量が合算されるため、ボリューム割引が効きやすくなるメリットがあります。" },
      { heading: "統制も同時に", body: "OrganizationsはSCP（サービスコントロールポリシー）で全アカウント共通の上限を設定でき、コスト管理とガバナンスを両立します。組織全体のたがをはめる役です。" },
      { heading: "調達の窓口", body: "AWS Marketplaceはサードパーティ製ソフトを購入・従量課金でき、AWSの請求にまとめられます。調達と支払いを一本化できます。" },
    ],
    match: ["Organizations", "一括請求", "請求管理", "Marketplace", "コンソリデーテッド"],
  },
  {
    id: "l-bil-06", domain: "billing", minutes: 7,
    title: "サポートプランを比較する",
    summary: "Basic（無料）/Developer/Business/Enterpriseの4段階。上位ほど速く・手厚く、最上位は専任TAM付き。",
    sections: [
      { heading: "4つのプラン", body: "Basicは無料で誰でも利用（ドキュメント・フォーラム等）。Developerは開発時の技術サポート。Businessは本番運用向けで24時間365日の対応。Enterpriseは最上位で最速対応です。" },
      { heading: "TAMとサポート範囲", body: "Business以上ではTrusted Advisorの全項目や、電話・チャットのケース対応が使えます。Enterpriseには専任のTAM（テクニカルアカウントマネージャー）が付き、伴走支援を受けられます。" },
      { heading: "ここがポイント", body: "「本番環境で24時間対応が必要→Business以上」「専任担当（TAM）が欲しい→Enterprise」が定番の判断。プラン名と対応レベルの対応関係を押さえます。" },
    ],
    match: ["サポートプラン", "TAM", "Enterprise Support", "Business Support"],
  },
];

// ---- 中級チャレンジ（腕試し）の明示マッピング ----
// CLF-C02 範囲内のシナリオ型「中級」問題（design/build_intermediate.js で作成）を
// 各レッスンへ明示的に割り当てる。match のキーワード重複による誤配置を避けるため直接指定。
const CHALLENGE = {
  "l-cc-02": ["qm-cc-01", "qm-cc-02"],
  "l-cc-05": ["qm-cc-03", "qm-cc-04"],
  "l-cc-06": ["qm-cc-05", "qm-cc-06"],
  "l-sec-01": ["qm-sec-01", "qm-sec-02"],
  "l-sec-03": ["qm-sec-03", "qm-sec-04", "qm-sec-05"],
  "l-sec-06": ["qm-sec-06", "qm-sec-07"],
  "l-sec-08": ["qm-sec-08", "qm-sec-09"],
  "l-tec-02": ["qm-tec-01", "qm-tec-02"],
  "l-tec-03": ["qm-tec-03", "qm-tec-04"],
  "l-tec-05": ["qm-tec-05", "qm-tec-06"],
  "l-tec-06": ["qm-tec-07", "qm-tec-08"],
  "l-tec-08": ["qm-tec-09", "qm-tec-10"],
  "l-tec-09": ["qm-tec-11", "qm-tec-12"],
  "l-bil-01": ["qm-bil-01", "qm-bil-02"],
  "l-bil-02": ["qm-bil-03", "qm-bil-04", "qm-bil-05"],
  "l-bil-06": ["qm-bil-06", "qm-bil-07"],
};

// ---- quizIds 自動割当 ----
const TARGET = 5; // 1レッスンあたりの目標問題数
const MIN = 3;
const used = new Set();
const qIds = new Set(questions.map((q) => q.id));
const isChallenge = (q) => (q.tags || []).includes("中級");

const domainOrder = ["cloudConcepts", "security", "technology", "billing"];
LESSONS.sort((a, b) => domainOrder.indexOf(a.domain) - domainOrder.indexOf(b.domain));

let challengeTotal = 0;
const out = LESSONS.map((L) => {
  // 基本の確認問題は「中級」を除外（基礎は基礎のまま）
  const matched = questions.filter((q) => q.domain === L.domain && !isChallenge(q) && qMatches(q, L.match));
  // 難易度昇順→未使用優先で並べる
  const sorted = matched.slice().sort((a, b) => (a.difficulty || 2) - (b.difficulty || 2));
  const fresh = sorted.filter((q) => !used.has(q.id));
  let pick = fresh.slice(0, TARGET);
  if (pick.length < MIN) {
    const extra = sorted.filter((q) => !pick.includes(q)).slice(0, MIN - pick.length);
    pick = pick.concat(extra);
  }
  pick.forEach((q) => used.add(q.id));
  if (pick.length < MIN) {
    console.warn(`!! ${L.id} は確認問題が${pick.length}問しか集まりませんでした（match: ${L.match.join(",")}）`);
  }
  // 中級チャレンジ（存在する問題IDのみ・2問以上で採用）
  const chal = (CHALLENGE[L.id] || []).filter((id) => qIds.has(id));
  const challengeQuizIds = chal.length >= 2 ? chal : [];
  challengeTotal += challengeQuizIds.length;
  return {
    id: L.id,
    title: L.title,
    domain: L.domain,
    estimatedMinutes: L.minutes,
    summary: L.summary,
    sections: L.sections,
    quizIds: pick.map((q) => q.id),
    challengeQuizIds,
  };
});

fs.writeFileSync(path.join(ROOT, "Resources/lessons.json"), JSON.stringify(out, null, 2) + "\n", "utf8");

// ---- レポート ----
console.log(`レッスン数: ${out.length}`);
for (const d of domainOrder) {
  const ls = out.filter((l) => l.domain === d);
  const qsum = ls.reduce((s, l) => s + l.quizIds.length, 0);
  console.log(`  ${d}: ${ls.length}レッスン / 確認問題のべ${qsum}問`);
}
console.log(`ユニーク割当問題（基本）: ${used.size}`);
console.log(`中級チャレンジ: ${out.filter((l) => l.challengeQuizIds.length).length}レッスンに のべ${challengeTotal}問`);
