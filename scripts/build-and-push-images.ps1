#!/usr/bin/env pwsh

Write-Host "=== Docker Image Build & Push ===" -ForegroundColor Green

# AWS Account ID取得
$AWS_ACCOUNT_ID = aws sts get-caller-identity --query Account --output text
Write-Host "AWS Account ID: $AWS_ACCOUNT_ID" -ForegroundColor Yellow

# ECRログイン
Write-Host "ECRログイン中..." -ForegroundColor Yellow
aws ecr get-login-password --region ap-northeast-1 | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.ap-northeast-1.amazonaws.com"

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ ECRログイン失敗" -ForegroundColor Red
    exit 1
}

# サービス一覧
$services = @("user-service", "product-service", "order-service")

foreach ($service in $services) {
    Write-Host "`n=== $service 処理開始 ===" -ForegroundColor Cyan
    
    $servicePath = "services/$service"
    if (!(Test-Path $servicePath)) {
        Write-Host "❌ ディレクトリなし: $servicePath" -ForegroundColor Red
        continue
    }
    
    Set-Location $servicePath
    
    try {
        # 依存関係インストール
        if (Test-Path "package.json") {
            Write-Host "npm install実行中..." -ForegroundColor Yellow
            npm install --production --silent
        }
        
        # Dockerビルド
        Write-Host "Dockerビルド中..." -ForegroundColor Yellow
        docker build -t $service . --quiet
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "❌ $service ビルド失敗" -ForegroundColor Red
            Set-Location ../..
            continue
        }
        
        # タグ付け
        docker tag "${service}:latest" "$AWS_ACCOUNT_ID.dkr.ecr.ap-northeast-1.amazonaws.com/${service}:latest"
        
        # プッシュ
        Write-Host "ECRプッシュ中..." -ForegroundColor Yellow
        docker push "$AWS_ACCOUNT_ID.dkr.ecr.ap-northeast-1.amazonaws.com/${service}:latest"
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ $service 完了" -ForegroundColor Green
        } else {
            Write-Host "❌ $service プッシュ失敗" -ForegroundColor Red
        }
        
    } catch {
        Write-Host "❌ $service エラー: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Set-Location ../..
}

# 結果確認
Write-Host "`n=== ECRイメージ確認 ===" -ForegroundColor Green
foreach ($service in $services) {
    $imageCount = aws ecr describe-images --repository-name $service --query "length(imageDetails)" --output text 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "$service : $imageCount イメージ" -ForegroundColor Green
    } else {
        Write-Host "$service : 確認エラー" -ForegroundColor Red
    }
}

Write-Host "`n=== 処理完了 ===" -ForegroundColor Green