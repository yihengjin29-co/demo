$src = 'C:\Users\Yiheng.jin\demo\work\phase1_framework\draft.docx'
$dst = 'C:\Users\Yiheng.jin\demo\work\phase1_framework\final.docx'
$pdf = 'C:\Users\Yiheng.jin\demo\work\phase1_framework\final.pdf'
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
    $doc = $word.Documents.Open($src, $false, $false)
    $doc.TrackRevisions = $false
    foreach ($toc in $doc.TablesOfContents) { $toc.Update() }
    $doc.Fields.Update() | Out-Null
    foreach ($section in $doc.Sections) {
        foreach ($header in $section.Headers) { $header.Range.Fields.Update() | Out-Null }
        foreach ($footer in $section.Footers) { $footer.Range.Fields.Update() | Out-Null }
    }
    $doc.Repaginate()
    $doc.SaveAs2($dst, 16)
    $doc.ExportAsFixedFormat($pdf, 17)
    $doc.Close($false)
}
finally {
    $word.Quit()
}
