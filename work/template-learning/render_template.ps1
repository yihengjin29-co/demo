$src = 'C:\Users\Yiheng.jin\Desktop\SHGJ\业务功能说明书\并表系统需求说明书V1.2.docx'
$pdf = 'C:\Users\Yiheng.jin\demo\work\template-learning\render\template.pdf'
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $pdf) | Out-Null
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
    $doc = $word.Documents.Open($src, $true, $true)
    $doc.Repaginate()
    $pages = $doc.ComputeStatistics(2)
    $doc.ExportAsFixedFormat($pdf, 17)
    Write-Output "PAGES=$pages"
    $doc.Close($false)
}
finally {
    if ($null -ne $word) { $word.Quit() }
}
