$ErrorActionPreference = 'Stop'
$docx = 'C:\Users\Yiheng.jin\demo\deliverables\金控并表系统业务功能需求说明书（一期）_页面说明精简版_格式优化版.docx'
$pdf = 'C:\Users\Yiheng.jin\demo\work\chapter4-page-intros\format_optimized_final.pdf'
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
    $doc = $word.Documents.Open($docx, $false, $true, $false)
    $pages = $doc.ComputeStatistics(2)
    $doc.ExportAsFixedFormat($pdf, 17)
    Write-Output "PAGES=$pages"
    Write-Output "PDF=$pdf"
    $doc.Close($false)
} finally {
    $word.Quit()
}
