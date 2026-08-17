$src = 'C:\Users\Yiheng.jin\demo\work\phase1_framework\final_patched.docx'
$pdf = 'C:\Users\Yiheng.jin\demo\work\phase1_framework\final_patched.pdf'
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
