#!/usr/bin/env pwsh

Write-Host "=== ECR イメージクリーンアップ ===" -ForegroundColor Green

$repositories = @("user-service", "product-service", "order-service")

foreach ($repo in $repositories) {
    Write-Host "処理中: $repo" -ForegroundColor Yellow
    
    try {
        $repoInfo = aws ecr describe-repositories --repository-names $repo 2>$null
        if ($LASTEXITCODE -ne 0) {
            Write-Host "  スキップ: $repo (リポジトリが存在しません)" -ForegroundColor Gray
            continue
        }
        
        $images = aws ecr list-images --repository-name $repo --query "imageIds[*]" --output json | ConvertFrom-Json
        
        if ($images.Count -gt 0) {
            Write-Host "  削除対象: $($images.Count) イメージ" -ForegroundColor Yellow
            
            $tempFile = "$repo-images.json"
            $images | ConvertTo-Json | Out-File -FilePath $tempFile -Encoding utf8
            
            aws ecr batch-delete-image --repository-name $repo --image-ids file://$tempFile
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  ✅ $repo 削除完了" -ForegroundColor Green
            } else {
                Write-Host "  ❌ $repo 削除失敗" -ForegroundColor Red
            }
            
            Remove-Item $tempFile -ErrorAction SilentlyContinue
        } else {
            Write-Host "  ✅ $repo (イメージなし)" -ForegroundColor Green
        }
    }
    catch {
        Write-Host "  ❌ $repo エラー: $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "=== クリーンアップ完了 ===" -ForegroundColor Green