# ==================== AUTO COMMIT ALIAS ====================
function gacp {
    param([string]$m = "Auto commit $(Get-Date -Format 'HH:mm:ss')")
    
    $scriptPath = "D:\Newfolder\Ky6\7. Công nghệ web\ngay14_4\BaseCore\BaseCore\commit.ps1"   # ←←← SỬA ĐƯỜNG DẪN NÀY CHO ĐÚNG
    
    if (Test-Path $scriptPath) {
        & $scriptPath $m
    } else {
        Write-Host "❌ Không tìm thấy file commit.ps1 tại: $scriptPath" -ForegroundColor Red
        Write-Host "Hãy sửa đường dẫn cho đúng!" -ForegroundColor Yellow
    }
}

# Alias cho BaseCore Auto Commit
function gacp { 
    param([string]$m = "Auto commit $(Get-Date -Format 'HH:mm')")
    & "$PSScriptRoot\commit.ps1" $m 
}