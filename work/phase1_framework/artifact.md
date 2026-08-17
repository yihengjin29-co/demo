# Template contract — 上海国际集团系统功能需求说明书

## Source and use

- Retained reference: `reference.docx`, copied byte-for-byte from the user-provided current requirements document.
- The final artifact must be created from a working copy of this reference so its styles, theme, numbering, header/footer relationships, and table defaults are retained.
- The reference is never overwritten.

## Page geometry and repeated elements

- A4 portrait: 21.00 × 29.70 cm.
- Margins: top/bottom 2.54 cm; left/right 3.175 cm.
- Header/footer distance: 1.499 cm.
- Header uses a single centered horizontal rule near the upper margin.
- Footer contains the centered Arabic page number. The cover is numbered in the source and this behavior is retained.
- Landscape is permitted only for the 14-column permissions matrices. Landscape sections must preserve the source margins, header rule, and linked page-number footer, then return to portrait for subsequent chapters.

## Cover pattern

- Sparse formal cover with centered text and generous vertical whitespace.
- Centered lines: “上海国际集团”, document title, business scope.
- Bottom-center metadata: version and year/month.
- Keep the original top horizontal rule and footer page number.
- Final title wording: “业务功能需求说明书（一期）”; scope line: “风险并表板块”.

## Front matter patterns

- Page 2: centered “文档信息” heading, followed by a 4-column bordered table.
- Page 3: centered “修订记录” heading, followed by a 4-column bordered table.
- Page 4 onward: centered “目录” heading followed by an automatic Word TOC using `toc 1`–`toc 3` styles.
- Front-matter tables use `Table Grid`, black 0.5 pt borders, bold centered headers, and vertically centered cells.

## Typography and paragraph hierarchy

- Primary Chinese font: 华文细黑.
- Normal style: 华文细黑 14 pt, 1.5-line spacing, 6 pt after.
- Body narrative style: `样式2`, based on Normal, first-line indent 0.988 cm, justified appearance inherited from source.
- Heading 1: bold, numbered through the source multilevel numbering, 10 pt before, approximately 2.4-line spacing, keep with next.
- Heading 2: bold, numbered, 10 pt before, keep with next.
- Heading 3: bold, numbered, 6 pt before, keep with next.
- Heading 4: bold italic, numbered, 6 pt before, keep with next.
- TOC 1/2/3: 11 pt with dot leaders and page numbers; TOC 2 and TOC 3 use progressively deeper left indents.

## Table patterns

- Base style: `Table Grid`; all borders black and thin.
- All final table body text, including permission and function-description tables, is explicitly set to 华文细黑 11 pt.
- Header rows are bold, centered horizontally and vertically, and repeat on subsequent pages.
- Body rows are vertically centered; narrative cells align left, ordinal and permission cells align center.
- Prevent row splitting where practical. Long description rows may split only if Word otherwise produces severe whitespace.
- Permission matrix: 14 columns with two header rows. Top headers merge four role columns each for 集团、国资公司、各金融机构. Use landscape orientation and compact column widths while retaining 11 pt text.
- Function-description tables: 4 columns, portrait orientation; widths prioritize 功能描述.

## Content and pagination rules

- Each Heading 1 chapter begins on a new page.
- Keep headings with the first following paragraph or table row.
- Insert explicit page breaks before front-matter pages and major chapters where needed; avoid manual blank paragraphs as page-positioning substitutes.
- Use Word fields for TOC and page numbers, refresh fields before delivery, and verify the exported PDF.
- No UI screenshots or interface prototypes are included in the rewritten document.

## Visual verification set

- Reference patterns inspected: cover, document information, revision record, TOC, numbered Heading 1/body narrative page, and bordered multi-row tables.
- Final verification must inspect every rendered page for clipped text, broken merged headers, table overflow, orphan headings, unexpected blank pages, and stale TOC page numbers.
