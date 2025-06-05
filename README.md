# AWS マイクロサービス

## 必要条件

---

- Node.js (v16 以上)
- AWS CLI (設定済み)
- Docker Desktop
- PowerShell Core (pwsh)
- AWS 認証情報（ECR プッシュ権限必要）

## プロジェクト構成

---

```
.
├── bin/                  # CDKアプリケーションのエントリーポイント
├── config/               # 環境設定ファイル
├── scripts/              # デプロイ・管理スクリプト
└── services/             # マイクロサービス実装
    ├── user-service/     # ユーザー管理サービス
    ├── product-service/  # 商品管理サービス
    └── order-service/    # 注文管理サービス
```

## コマンド

---

### 基本（デフォルト）

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `npx cdk deploy` deploy this stack to your default AWS account/region
- `npx cdk diff` compare deployed stack with current state
- `npx cdk synth` emits the synthesized CloudFormation template

### デプロイ

- `npm run deploy:dev` 開発用デプロイ（コスト削減用）
- `npm run deploy:demo` デモ環境デプロイ

### 更新・メンテナンス

- `npm run deploy:update` Docker イメージの更新とデプロイ
- `npm run deploy:reset` 環境のリセットと再デプロイ
- `npm run ecr:clean` ECR リポジトリのクリーンアップ

### モニタリング

- `npm run check:stack` CloudFormation スタックの状態確認
- `npm run check:ecs` ECS サービスの状態確認
- `npm run check:ecr` ECR リポジトリの状態確認

## デプロイプロセスの詳細

---

### 完全デプロイ (deploy:complete)

1. スタック状態の確認
2. ECR リポジトリの作成
3. Docker イメージのビルドとプッシュ
4. ECS サービスのデプロイ

### 更新デプロイ (deploy:update)

1. Docker イメージの更新
2. スタックの更新

### 環境リセット (deploy:reset)

1. ECR リポジトリのクリーンアップ
2. スタックの削除
3. 完全デプロイの実行
