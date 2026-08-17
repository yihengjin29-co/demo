$src = 'C:\Users\Yiheng.jin\demo\work\risk-structure-opt\scenario-flow-revision.docx'
$pdf = 'C:\Users\Yiheng.jin\demo\work\risk-structure-opt\scenario-flow-render\scenario-flow-revision.pdf'
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
    $pages = $doc.ComputeStatistics(2)
    Write-Output "PAGES=$pages"
    $doc.Close($false)
}
finally {
    if ($null -ne $word) { $word.Quit() }
}
