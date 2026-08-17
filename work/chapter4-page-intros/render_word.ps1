$docx = (Get-ChildItem 'C:\Users\Yiheng.jin\demo\deliverables' -Filter '*.docx' |
    Where-Object { -not $_.Name.StartsWith('~$') } |
    Sort-Object Length -Descending |
    Select-Object -First 1).FullName
$pdf = 'C:\Users\Yiheng.jin\demo\work\chapter4-page-intros\rendered.pdf'
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
$doc = $null
try {
    $doc = $word.Documents.Open($docx, $false, $false)
    foreach ($toc in $doc.TablesOfContents) {
        $toc.Update()
    }
    $doc.Fields.Update() | Out-Null
    $doc.Repaginate()
    $doc.Save()
    $doc.ExportAsFixedFormat($pdf, 17)
    Write-Output ('PAGES=' + $doc.ComputeStatistics(2))
    Write-Output ('TOC=' + $doc.TablesOfContents.Count)
    Write-Output ('PDF=' + $pdf)
}
finally {
    if ($null -ne $doc) {
        $doc.Close($false)
    }
    $word.Quit()
}
