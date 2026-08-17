$src = 'C:\Users\Yiheng.jin\demo\work\risk-structure-opt\optimized.docx'
$pdf = 'C:\Users\Yiheng.jin\demo\work\risk-structure-opt\final-render\optimized.pdf'
New-Item -ItemType Directory -Force -Path (Split-Path -Parent $pdf) | Out-Null
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
    $doc = $word.Documents.Open($src, $false, $false)
    foreach ($toc in $doc.TablesOfContents) { $toc.Update() }
    $doc.Fields.Update() | Out-Null
    $doc.Repaginate()
    $doc.Save()
    $doc.ExportAsFixedFormat($pdf, 17)
    $doc.Close($false)
}
finally {
    if ($null -ne $word) { $word.Quit() }
}
