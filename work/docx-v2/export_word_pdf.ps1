param(
  [Parameter(Mandatory=$true)][string]$DocxPath,
  [Parameter(Mandatory=$true)][string]$PdfPath,
  [switch]$UpdateFields
)

New-Item -ItemType Directory -Force -Path (Split-Path -Parent $PdfPath) | Out-Null
$word = $null
$document = $null
try {
  $word = New-Object -ComObject Word.Application
  $word.Visible = $false
  $word.DisplayAlerts = 0
  $document = $word.Documents.Open($DocxPath)
  if ($UpdateFields) {
    foreach ($story in $document.StoryRanges) {
      try { $story.Fields.Update() | Out-Null } catch {}
    }
    if ($document.TablesOfContents.Count -gt 0) {
      foreach ($toc in $document.TablesOfContents) { $toc.Update() | Out-Null }
    }
    $document.Save()
  }
  $document.ExportAsFixedFormat($PdfPath, 17)
  $document.Close($false)
  $document = $null
  Get-Item -LiteralPath $PdfPath | Select-Object FullName, Length
}
finally {
  if ($document -ne $null) { try { $document.Close($false) } catch {} }
  if ($word -ne $null) { try { $word.Quit() } catch {} }
}
