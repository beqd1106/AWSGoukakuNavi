# 配布手順（TestFlight / App Store）— AWSnote

Macを持たずに、Codemagic（クラウドMac）でビルド・署名してTestFlightへ配信する手順です。
GitHub Actions では署名なしビルド＋テストを自動実行し、Codemagic で署名ありの配信を行います。

- アプリ表示名：**AWSnote**
- Bundle ID：`com.beqd1106.awsgoukakunavi`
- スキーム / プロジェクト名：`AWSGoukakuNavi`
- 対応：iPhone 専用 / iOS 17 以上

---

## 0. 必要なもの
- Apple Developer Program（有償・登録済み前提）
- App Store Connect にアクセスできる Apple ID
- Codemagic アカウント（GitHubリポジトリ `beqd1106/AWSGoukakuNavi` と連携）

---

## 1. Apple Developer で Bundle ID を登録（初回のみ）
1. https://developer.apple.com/account → 「Certificates, Identifiers & Profiles」
2. Identifiers → ＋ → App IDs → App
3. Description: `AWSnote`、Bundle ID（明示）: `com.beqd1106.awsgoukakunavi`
4. Capabilities は特別な追加不要（SwiftData/標準機能のみ）。保存。

## 2. App Store Connect でアプリを作成（初回のみ）
1. https://appstoreconnect.apple.com → 「マイApp」→ ＋ → 新規App
2. プラットフォーム：iOS、名前：`AWSnote`（※ストア表示名。重複不可なので取得済みなら調整）
3. プライマリ言語：日本語、Bundle ID：`com.beqd1106.awsgoukakunavi` を選択
4. SKU：任意（例 `awsnote-001`）。作成。

## 3. App Store Connect API キーを発行（初回のみ）
1. App Store Connect → ユーザーとアクセス → 「Integrations / キー」→ App Store Connect API
2. ＋ で新規キー。アクセス権：**App Manager**
3. 発行された **Issuer ID / Key ID / .p8 ファイル** を控える（.p8は再DL不可なので保管）
   - 手元の `AuthKey_XXXX.p8` を流用する場合は、その Key ID / Issuer ID を使う

## 4. Codemagic に App Store Connect を連携（初回のみ）
1. Codemagic → Teams → Integrations → App Store Connect → Connect
2. 名前は **`AppStoreConnect`**（codemagic.yaml の `integrations:` と一致させる）
3. 上記 Issuer ID / Key ID / .p8 を登録
4. 署名は Codemagic 管理（automatic）。証明書・プロビジョニングは初回ビルド時に自動生成される

## 5. ビルド＆配信
1. Codemagic でリポジトリ `beqd1106/AWSGoukakuNavi` を追加（codemagic.yaml を自動検出）
2. まず **`ios-build-check`** が push で走り、コンパイル確認（署名不要）
3. 問題なければ **`ios-testflight`** を画面から手動 Start
4. 成功すると `.ipa` が生成され、TestFlight へ自動アップロード（`submit_to_testflight: true`）
5. App Store Connect → TestFlight に数分〜十数分でビルドが出現

## 6. TestFlightでテスト
1. App Store Connect → TestFlight → 内部テスター（自分のApple ID）を追加
2. iPhone に「TestFlight」アプリを入れ、招待を受けて AWSnote をインストール
3. 暗号化に関する輸出コンプライアンス質問は、標準的な通信(HTTPS)のみのため
   「該当する暗号化方式は標準的なもの」を選択（`ITSAppUsesNonExemptEncryption=NO` を
   Info.plist に明示しておくと毎回聞かれない → 必要なら project.yml に追記可）

## 7. 本番リリース（任意・後日）
- ストア掲載情報（説明文・スクリーンショット・プライバシー・年齢制限）を入力
- スクリーンショットは実機/シミュレータの画面（6.7インチ等）を用意
- 「審査へ提出」。**合格を保証する表現や、AWS公式問題の転載は不可**（本アプリは
  オリジナル問題・非公式の学習支援アプリである旨を説明文に明記）

---

## メモ
- ビルド番号は `agvtool` で BUILD_NUMBER+1 を自動採番（codemagic.yaml）。手動更新不要。
- バージョン（MARKETING_VERSION）は `project.yml` の `1.0.0` を編集して更新。
- AppIcon は `App/Assets.xcassets/AppIcon.appiconset/AppIcon-1024.png`（1024² / RGB / アルファなし）。
- 署名なしで「ビルドが通るか」だけ見たい時は GitHub Actions / Codemagic の build-check を使う。
