# Template execution contract

## Reference

- Retained source: `C:\Users\Yiheng.jin\Desktop\SHGJ\业务功能说明书\系统开发需求说明书.docx`
- Writable retained copy: `C:\Users\Yiheng.jin\demo\work\docx-v2\reference.docx`
- SHA-256 of retained copy: `816BA24E73E621F7CB18FEA482986BA17CB33793D25780E93206D352E32B61F9`
- Source size: 26,169,611 bytes.
- High-level structure: 2 sections, 527 body paragraphs, 72 tables, 38 inline images, 18 floating/anchored drawing objects.
- Evidence: `template-inspection.json`, `template-style-evidence.json`, packaged section/style/heading/image/field audit output.
- Reference rendering: unresolved because LibreOffice is not installed and the local Word COM export timed out while the source document was already open in the user's Word session.

## Page system

- Distinct source patterns: cover; document-information table; revision-history page; directory/front matter; narrative chapters; operation-rule pages with screenshots; permission matrices; five-column field-rule tables; two-column operation tables; workflow/status tables.
- Source section 1 is A4 portrait, 8.27 x 11.69 inches, margins L/R 1.25 inches and T/B 1.00 inch.
- Source section 2 is Letter portrait, 8.50 x 11.00 inches with the same margins. The user explicitly overrides this variation: the V2.0 result must use A4 portrait throughout, 2.54 cm top/bottom and 3.175 cm left/right.
- Source header/footer paragraphs contain no visible text. Footer page numbers are represented through document fields/drawings rather than plain paragraph text.
- The V2.0 result will use the source A4 geometry on every page, preserve restrained blank headers, and place centered page-number fields in the footer.

## Typography

- Dominant source font: 华文细黑.
- Cover title block: 华文细黑 26 pt, bold, centered.
- Revision title: 华文细黑 16 pt, bold, centered.
- Body and operational page headings: 华文细黑 14 pt; headings bold; body regular with 1.5 line spacing and justified alignment.
- Business tables: 华文细黑 11 pt; header rows bold, horizontally and vertically centered; narrative cells left aligned; short values centered.
- Reusable roles in V2.0: CoverTitle, RevisionTitle, BodyText, Heading1, Heading2, Heading3, PageTitle, PromptHeading, TableText, TableHeader, TableRegion.

## Lists and tables

- Narrative rules use real Word list paragraphs or complete prose paragraphs; no Markdown markers.
- Permission matrix columns: 28%, 24%, 24%, 24%.
- Five-column field-rule tables: 20%, 10%, 15%, 23%, 32%.
- Two-column operation tables: 18%, 82%.
- All business tables use full thin black borders, explicit column geometry inside the 15.2 cm text area, repeat header rows, no fixed row heights, and row-level `cantSplit` where practical.
- Region rows are merged across all columns and bold.

## Components

- Cover has only the three confirmed lines: 上海国际集团 / 系统功能需求说明书 / 风险并表板块.
- Front matter includes document information, revision record, and a Word TOC field for Heading 1-3 with `w:updateFields=true`.
- Each detailed page repeats the source writing sequence: page title; 界面样式：; current-screen image or mandated placeholder; 界面规则; 权限清单 when permissions differ; 一、操作界面字段规则及要求; 二、操作功能说明; 三、状态说明 when applicable; 四、流程说明 when applicable.
- Page screenshots must be current. Because no Browser instance is available, the permitted fallback is an inline gray placeholder reading `请插入当前原型截图：页面名称`; no original screenshot is preserved.

## Content flow and slot map

- Preserve the source document as the style authority, but replace all old substantive body content because the user explicitly requests a complete clean V2.0 rewrite.
- Keep/recreate: cover pattern, document-information table pattern, revision-history table pattern, table border treatment, title/body/table typography, page geometry, field-based TOC, footer page numbers.
- Rewrite: all narrative chapters, page inventory, permissions, fields, buttons, statuses, workflows, role names, institution names, menu names, screenshots.
- Remove: old four-role permission columns, old screenshots, old report-upload center positioning, old dashboard quick links, legacy role terminology, obsolete fields and placeholders.
- Add: three-role permission system, latest indicator status and cumulative light history, rule-level letter-delivery mode, major-event definition management, current route-modal pages, current institution overview, special-risk work-order traceability.

## Package preservation

- Preserve-only source evidence: styles/theme font system, base numbering relationships where compatible, page geometry values, table visual treatment.
- Editable/rebuilt parts: `word/document.xml`, numbering used by headings/lists, relationships for replaced images, settings update-fields flag, footer page-number field.
- Remove comments and tracked revisions from final package; source inspection reports no comments but contains footnote/endnote package parts that are not substantively used by the new document.

## Fidelity gates

- Source remains byte-for-byte unchanged at the retained-copy SHA-256 above.
- Final uses A4 portrait and specified margins throughout.
- Cover, revision title, body, headings and business tables match the exact font and size contract.
- Every formal page follows the mandated sequence and every button/field in the final inventory appears in its tables.
- No old screenshot is copied.
- Final structural audit checks TOC field, heading levels, page fields, table geometry, image placeholders, comments/tracked changes and prohibited text.
- Final rendering will be attempted with the packaged renderer first and local Word export second. If both remain unavailable, structural QA is authoritative and the absence of visual rendering is disclosed.
