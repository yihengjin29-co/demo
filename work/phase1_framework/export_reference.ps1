$src = 'C:\Users\Yiheng.jin\demo\work\phase1_framework\reference.docx'
$pdf = 'C:\Users\Yiheng.jin\demo\work\phase1_framework\reference.pdf'
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$word.DisplayAlerts = 0
try {
    $doc = $word.Documents.Open($src, $false, $true)
    $doc.ExportAsFixedFormat($pdf, 17)
    $doc.Close($false)
}
finally {
    $word.Quit()
}
