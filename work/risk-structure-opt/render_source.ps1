$src = 'C:\Users\Yiheng.jin\demo\work\risk-structure-opt\source.docx'
$pdf = 'C:\Users\Yiheng.jin\demo\work\risk-structure-opt\source-render\source.pdf'
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $pdf) | Out-Null
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
    $doc = $word.Documents.Open($src, $false, $true)
    $doc.Repaginate()
    $doc.ExportAsFixedFormat($pdf, 17)
    $doc.Close($false)
}
finally {
    $word.Quit()
}
