#!/usr/bin/env pwsh

Write-Host "=== 完全デプロイスクリプト ===" -ForegroundColor Green

# Step 1: スタック存在確認
Write-Host "スタック状態確認中..." -ForegroundColor Yellow
$stackExists = $false
$stackStatus = aws cloudformation describe-stacks --stack-name AwsMicroservicesPortfolioStack --query "Stacks[0].StackStatus" --output text 2>$null

if ($LASTEXITCODE -eq 0) {
    Write-Host "既存スタック状態: $stackStatus" -ForegroundColor Yellow
    $stackExists = $true
    
    if ($stackStatus -like "*FAILED*" -or $stackStatus -like "*ROLLBACK*") {
        Write-Host "⚠️ スタックが失敗状態です" -ForegroundColor Yellow
        $choice = Read-Host "完全削除して再作成しますか？ (y/N)"
        
        if ($choice -eq 'y' -or $choice -eq 'Y') {
            Write-Host "完全削除実行中..." -ForegroundColor Red
            .\cleanup-ecr.ps1
            cdk destroy --force
            $stackExists = $false
        }
    }
}

# Step 2: 初回デプロイ（ECRリポジトリ作成）
if (-not $stackExists) {
    Write-Host "初回デプロイ実行中..." -ForegroundColor Yellow
    cdk deploy --require-approval never
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ 初回デプロイ失敗" -ForegroundColor Red
        exit 1
    }
}

# Step 3: ECRリポジトリ確認
Write-Host "ECRリポジトリ確認中..." -ForegroundColor Yellow
$repos = @("user-service", "product-service", "order-service")
foreach ($repo in $repos) {
    aws ecr describe-repositories --repository-names $repo >$null 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ リポジトリなし: $repo" -ForegroundColor Red
        Write-Host "CDKデプロイが完了していない可能性があります" -ForegroundColor Yellow
        exit 1
    }
}

# Step 4: Dockerイメージビルド・プッシュ
Write-Host "Dockerイメージ処理中..." -ForegroundColor Yellow
.\build-and-push-images.ps1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ イメージプッシュ失敗" -ForegroundColor Red
    exit 1
}

# Step 5: 最終デプロイ
Write-Host "最終デプロイ実行中..." -ForegroundColor Yellow
cdk deploy --require-approval never

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ 完全デプロイ成功!" -ForegroundColor Green
    
    # API Gateway URL取得
    $apiUrl = aws cloudformation describe-stacks --stack-name AwsMicroservicesPortfolioStack --query "Stacks[0].Outputs[?contains(OutputKey, 'ApiEndpoint')].OutputValue" --output text 2>$null
    if ($apiUrl) {
        Write-Host "🌐 API Gateway URL: $apiUrl" -ForegroundColor Cyan
        Write-Host "`nテスト用コマンド:" -ForegroundColor Yellow
        Write-Host "curl `"$apiUrl/users/health`"" -ForegroundColor White
    }
    
    # ECS状態確認
    Write-Host "`n📊 ECSサービス状態:" -ForegroundColor Yellow
    aws ecs describe-services --cluster MicroservicesCluster --services UserService ProductService OrderService --query "services[*].[serviceName,status,runningCount,desiredCount]" --output table
    
} else {
    Write-Host "❌ 最終デプロイ失敗" -ForegroundColor Red
}

Write-Host "`n=== 処理完了 ===" -ForegroundColor Green