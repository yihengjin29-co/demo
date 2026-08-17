from __future__ import annotations

import copy
import hashlib
import json
import re
import zipfile
from pathlib import Path

from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Pt
from docx.text.paragraph import Paragraph


ROOT = Path(r"C:\Users\Yiheng.jin\demo")
SOURCE = ROOT / "work" / "chapter4-page-intros" / "source.docx"
OUTPUT_DIR = ROOT / "deliverables"
OUTPUT = OUTPUT_DIR / "金控并表系统业务功能需求说明书（一期）_页面说明精简版.docx"
QA_REPORT = ROOT / "work" / "chapter4-page-intros" / "rebuild_report.json"


def norm(text: str) -> str:
    return " ".join(text.split())


def has_drawing(paragraph: Paragraph) -> bool:
    return bool(paragraph._p.xpath(".//w:drawing|.//w:pict"))


def set_paragraph_text(paragraph: Paragraph, text: str, *, bold: bool | None = None) -> None:
    for child in list(paragraph._p):
        if child.tag != qn("w:pPr"):
            paragraph._p.remove(child)
    run = paragraph.add_run(text)
    if bold is not None:
        run.bold = bold


def remove_paragraph(paragraph: Paragraph) -> None:
    parent = paragraph._p.getparent()
    if parent is not None:
        parent.remove(paragraph._p)


def remove_table(table) -> None:
    parent = table._tbl.getparent()
    if parent is not None:
        parent.remove(table._tbl)


def strip_text_keep_drawing(paragraph: Paragraph) -> None:
    for node in paragraph._p.xpath(".//w:t"):
        node.text = ""
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER


def insert_after(reference: Paragraph, text: str, body_ppr) -> Paragraph:
    p = OxmlElement("w:p")
    reference._p.addnext(p)
    paragraph = Paragraph(p, reference._parent)
    if body_ppr is not None:
        paragraph._p.insert(0, copy.deepcopy(body_ppr))
    paragraph.add_run(text)
    return paragraph


def set_style(paragraph: Paragraph, doc: Document, style_name: str) -> None:
    paragraph.style = doc.styles[style_name]
    paragraph.paragraph_format.keep_with_next = True


def set_cell_text(cell, text: str, prototype_paragraph=None) -> None:
    p = cell.paragraphs[0]
    if prototype_paragraph is not None and prototype_paragraph._p.pPr is not None:
        if p._p.pPr is not None:
            p._p.remove(p._p.pPr)
        p._p.insert(0, copy.deepcopy(prototype_paragraph._p.pPr))
    for child in list(p._p):
        if child.tag != qn("w:pPr"):
            p._p.remove(child)
    run = p.add_run(text)
    run.font.name = "仿宋"
    run._element.get_or_add_rPr().rFonts.set(qn("w:eastAsia"), "仿宋")
    run.font.size = Pt(11)


def media_hashes(path: Path) -> dict[str, str]:
    with zipfile.ZipFile(path) as zf:
        return {
            name: hashlib.sha256(zf.read(name)).hexdigest()
            for name in zf.namelist()
            if name.startswith("word/media/")
        }


def chapter_block_c14n(doc: Document, start_text: str, end_text: str) -> list[bytes]:
    blocks = []
    active = False
    for child in doc.element.body.iterchildren():
        tag = child.tag.rsplit("}", 1)[-1]
        if tag == "p":
            text = norm(Paragraph(child, doc).text)
            if text == start_text:
                active = True
            if active and text == end_text:
                break
        if active:
            blocks.append(child)
    from lxml import etree

    return [etree.tostring(block, method="c14n", exclusive=True) for block in blocks]


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    doc = Document(SOURCE)
    source_media = media_hashes(SOURCE)
    original_ch2 = chapter_block_c14n(doc, "二、需求概述", "三、系统角色建议")
    original_ch3 = chapter_block_c14n(doc, "三、系统角色建议", "拟设功能需求")

    # 第一章：仅保留后文真实使用、且需要统一口径的复杂概念。
    intro = doc.paragraphs[31]
    set_paragraph_text(
        intro,
        "本部分对本说明书后续章节中实际使用且具有特定业务含义的主要概念进行解释，相关释义结合本期风险并表板块功能设计编制；如集团管理制度或业务口径发生调整，以最新发布的制度文件及管理要求为准。",
    )
    terms = [
        ("集团并表风险偏好", "集团在并表管理范围内，结合战略目标、监管要求和风险承受能力，对可接受风险类型、风险水平及管理边界作出的总体表述。"),
        ("风险偏好目标", "对集团并表风险偏好进行量化或可监测化分解后形成的阶段性管理目标。"),
        ("风险偏好指标", "用于反映风险偏好目标执行情况，并配置适用机构、监测频率、预警值及容忍值的指标。"),
        ("金融机构风险限额", "依据集团风险偏好和金融机构业务特征，对纳入并表管理的金融机构相关风险指标设定的管理边界。"),
        ("风险并表指标", "按照统一口径对纳入并表管理的金融机构相关风险数据进行计算、汇总、监测或展示的指标。"),
        ("预警规则", "围绕风险指标配置适用机构、监测频率、预警阈值、生效期间及赋灯条件，用于系统识别指标风险状态的规则。"),
        ("黄灯预警", "风险指标达到黄灯阈值后形成的提示性预警，用于提醒相关主体分析原因并采取必要管理措施。"),
        ("红灯预警", "风险指标达到红灯阈值后形成的较高等级预警，相关主体需及时反馈原因、制定处置方案并持续跟踪。"),
        ("风险指标重检", "因经营环境、指标口径或管理要求发生变化，对指标定义、阈值、监测频率等内容重新核实并提出调整申请的活动。"),
        ("重大风险事件", "对金融机构经营、财务、声誉、合规或持续稳健运行可能产生重大影响，并需按规定报告和处置的风险事项。"),
        ("首报", "重大风险事件发生或发现后，对事件基本情况、影响范围、初步研判及处置安排进行的首次报告。"),
        ("续报", "在重大风险事件处置过程中，对事件进展、风险变化及措施执行情况进行的持续更新报告。"),
        ("终报", "重大风险事件处置完成后，对事件结果、处置成效及后续安排进行总结并提交归档的报告。"),
        ("专项风险提示", "针对特定风险类型或管理事项向相关金融机构下发的风险提示，用于组织机构自查、反馈和后续评估。"),
        ("指标版本", "指标新增或维护后形成的阶段性信息记录，用于追溯指标定义、适用机构、监测频率及数据来源等内容的历次变化。"),
    ]
    term_table = doc.tables[2]
    prototype_row = copy.deepcopy(term_table.rows[1]._tr)
    prototype_left = copy.deepcopy(term_table.rows[1].cells[0].paragraphs[0]._p.pPr)
    prototype_right = copy.deepcopy(term_table.rows[1].cells[1].paragraphs[0]._p.pPr)
    for row in list(term_table.rows)[1:]:
        term_table._tbl.remove(row._tr)
    for term, explanation in terms:
        new_tr = copy.deepcopy(prototype_row)
        term_table._tbl.append(new_tr)
        row = term_table.rows[-1]
        set_cell_text(row.cells[0], term)
        set_cell_text(row.cells[1], explanation)
        if prototype_left is not None:
            p = row.cells[0].paragraphs[0]
            if p._p.pPr is not None:
                p._p.remove(p._p.pPr)
            p._p.insert(0, copy.deepcopy(prototype_left))
        if prototype_right is not None:
            p = row.cells[1].paragraphs[0]
            if p._p.pPr is not None:
                p._p.remove(p._p.pPr)
            p._p.insert(0, copy.deepcopy(prototype_right))

    # 第四章：标题、页面概述、截图；传导路径与流程图原样保留。
    paragraphs = list(doc.paragraphs)
    set_paragraph_text(paragraphs[69], "四、界面说明")
    set_style(paragraphs[69], doc, "Heading 1")
    set_paragraph_text(
        paragraphs[70],
        "本章按照系统功能界面介绍风险并表板块。系统可按并表看板、预警管理、指标管理、重大风险事件管理、报表中心、定期风险报告管理及专项风险管理等功能查看和维护相关业务信息；各页面说明聚焦其承载的主要功能，不展开具体字段、按钮及操作步骤。",
    )
    set_paragraph_text(paragraphs[72], "（一）集团并表风险偏好及目标")
    set_style(paragraphs[72], doc, "Heading 2")

    # 原“操作规则”标题不再保留。
    remove_paragraph(paragraphs[78])

    title_updates = {
        79: ("4.1 并表看板", "Heading 2"),
        80: ("4.1.1 并表管理驾驶舱", "Heading 3"),
        85: ("4.2 预警管理", "Heading 2"),
        101: ("4.2.1 风险偏好与预警管理", "Heading 3"),
        102: ("4.2.1.1 风险偏好及目标", "Heading 4"),
        113: ("4.2.1.2 风险偏好及目标—新建方案", "Heading 4"),
        127: ("4.2.1.3 风险偏好及目标—概览", "Heading 4"),
        136: ("4.2.1.4 风险偏好及目标—风险偏好指标明细", "Heading 4"),
        147: ("4.2.1.5 风险偏好及目标—重检申请", "Heading 4"),
        159: ("4.2.2 预警规则管理", "Heading 3"),
        160: ("4.2.2.1 预警规则管理", "Heading 4"),
        174: ("4.2.2.2 预警规则管理—规则配置（提交页面）", "Heading 4"),
        183: ("4.2.2.3 预警规则管理—规则配置（审批页面）", "Heading 4"),
        192: ("4.2.2.4 预警规则管理—状态编辑", "Heading 4"),
        200: ("4.2.3 预警提示与处置", "Heading 3"),
        201: ("4.2.3.1 预警提示与处置", "Heading 4"),
        217: ("4.2.3.2 预警提示与处置—重大风险提示函", "Heading 4"),
        226: ("4.2.3.3 预警提示与处置—重大风险提示函详情", "Heading 4"),
        237: ("4.2.3.4 预警提示与处置—预警提示函", "Heading 4"),
        246: ("4.2.3.5 预警提示与处置—预警提示函详情", "Heading 4"),
        258: ("4.3 指标管理", "Heading 2"),
        259: ("4.3.1 指标新增与维护", "Heading 3"),
        270: ("4.3.1.1 指标新增与维护—新增指标", "Heading 4"),
        282: ("4.3.1.2 指标新增与维护—维护指标", "Heading 4"),
        291: ("4.3.1.3 指标新增与维护—维护记录", "Heading 4"),
        302: ("4.3.2 指标版本管理", "Heading 3"),
        312: ("4.3.2.1 指标版本管理—查看历史版本", "Heading 4"),
        322: ("4.4 重大风险事件管理", "Heading 2"),
        328: ("4.4.1 重大风险事件列表", "Heading 3"),
        339: ("4.4.2 重大风险事件新增及报送", "Heading 3"),
        351: ("4.5 报表中心", "Heading 2"),
        362: ("4.5.1 报表中心—报送明细", "Heading 3"),
        373: ("4.5.2 报表中心—报表上传", "Heading 3"),
        384: ("4.6 定期风险报告管理", "Heading 2"),
        395: ("4.6.1 定期风险报告管理—报告上传", "Heading 3"),
        406: ("4.7 专项风险管理", "Heading 2"),
        407: ("4.7.1 新建专项风险提示", "Heading 3"),
        417: ("4.7.1.1 新建专项风险提示—新建提示", "Heading 4"),
        428: ("4.7.2 专项风险提示与管理", "Heading 3"),
        439: ("4.7.2.1 专项风险提示与管理—查看提示", "Heading 4"),
        449: ("4.7.3 专项风险查看与反馈", "Heading 3"),
        461: ("4.7.3.1 专项风险查看与反馈—反馈填写", "Heading 4"),
        472: ("4.7.3.2 专项风险提示与管理—反馈评估", "Heading 4"),
    }
    for index, (text, style_name) in title_updates.items():
        set_paragraph_text(paragraphs[index], text)
        set_style(paragraphs[index], doc, style_name)

    summaries = {
        80: "系统可按集团、国资公司及各金融机构的管理层级综合展示并表风险、指标预警、重大风险事件及报表报送等核心信息。系统支持集中查看关键指标与待关注事项，为管理层开展风险研判和业务督导提供统一入口。",
        102: "系统可按方案名称、覆盖机构、方案状态、生效期间及指标名称查询风险偏好方案。系统支持查看、维护、新增和导出方案，并查看方案流转情况。",
        113: "系统支持维护风险偏好方案基本信息、定性风险偏好陈述、风险偏好指标及方案附件，并可保存草稿或提交审核。",
        127: "系统支持查看风险偏好方案基本信息、定性风险偏好陈述、方案说明及相关附件，并可导出方案信息。",
        136: "系统支持查看方案内风险偏好指标的定义、适用机构、监测频率、预警值和容忍值等信息，并可针对相关指标发起重检。",
        147: "系统支持查看风险指标重检流程及指标基本信息，填写重检原因、调整建议和保障方案，并上传附件后提交申请。",
        160: "系统可按生效期间、规则编号、风险类型、适用机构、规则状态及指标名称查询预警规则。系统支持查看和维护规则、运行状态、阈值配置及重检信息。",
        174: "系统支持维护预警规则适用机构、指标、阈值节点及区间赋灯条件，查看历史阈值规则，并配置推送方式后提交审核。",
        183: "系统支持查看预警规则基本信息、历史规则及阈值配置结果，填写审批意见并完成通过或驳回处理。",
        192: "系统支持维护预警规则目标状态、生效时间和变更原因，上传相关附件并提交状态变更申请。",
        201: "系统可按预警等级、所属机构、风险类型、指标名称、处理状态及预警时间查询预警事项。系统支持查看预警详情、跟踪处置状态并导出查询结果。",
        217: "系统支持查看重大风险提示函的预警基本信息和处置进度，并可填写当前处置节点内容或查看已完成节点记录。",
        226: "系统支持查看重大风险预警处置流程及基本信息，填写原因分析、处置方案、评估意见、跟踪情况和解除预警评估，并上传相关附件。",
        237: "系统支持查看预警提示函的预警基本信息和处置进度，并可填写当前处置节点内容或查看已完成节点记录。",
        246: "系统支持查看预警提示处置流程及基本信息，填写情况分析、应对处置方案、持续跟踪情况和解除预警评估。",
        259: "系统可按指标编码、指标名称、指标状态及适用机构查询指标。系统支持新增和维护指标，并查看指标历次维护记录。",
        270: "系统支持维护指标名称、适用机构、指标类型、指标定义、生效日期、监测频率及数据来源，并提交新增指标。",
        282: "系统支持查看指标编码，并维护指标类型、名称、适用机构、定义、生效日期、监测频率及数据来源等信息。",
        291: "系统支持查看指标历次维护形成的变更记录及维护人信息，并可导出维护记录。",
        302: "系统可按指标编码、指标名称及版本号查询指标版本。系统支持查看指标当前版本信息及历次历史版本。",
        312: "系统支持按版本查看指标名称、定义、适用机构、监测频率、数据来源及生效停用日期等历史信息，并可导出版本记录。",
        328: "系统可按事件名称、所属机构、风险事件类型、事件状态及发生时间查询重大风险事件。系统支持新增、查看、续报和终报事件，并查看事件流转过程或导出事件信息。",
        339: "系统支持维护重大风险事件基本信息、首报内容、处置方案及相关附件，并可保存草稿或提交后续审核。",
        351: "系统可按报表名称、报送机构、报表类型及日期查询报表。系统支持查看报送明细、下载报表，并进入报表报送与上传管理。",
        362: "系统支持查看报表基本信息及历次报送记录，并可查看或下载相应报送文件。",
        373: "系统支持维护报表基本信息和报送说明，上传、预览、下载或移除报表附件，并提交形成报送记录。",
        384: "系统可按报告名称、报送期间、报送机构、报告类型及周期查询定期风险报告。系统支持上传、查看、下载和维护报告，并管理报告可见范围。",
        395: "系统支持维护定期风险报告基本信息、周期、概述及附件，设置可见范围和推送方式，并可保存草稿或提交报告。",
        407: "系统可按创建期间、专项风险类型及下发对象查询专项风险提示。系统支持新建、维护和删除提示信息，并查看提示下发记录。",
        417: "系统支持维护专项风险提示名称、类型、下发机构、提示内容及反馈要求，上传相关附件，并可保存草稿或提交下发。",
        428: "系统可按下发期间、专项风险类型、状态及下发对象查询专项风险提示。系统支持查看提示、机构反馈和管理报告，并跟踪提示处置状态。",
        439: "系统支持查看专项风险提示内容、金融机构反馈信息及评估结果，并可下载相关附件和专项风险管理报告。",
        449: "系统可按工单编号、下发期间、专项风险类型及状态查询专项风险事项。系统支持查看提示、填写或跟踪反馈，并查看专项风险管理报告。",
        461: "系统支持查看专项风险提示基本信息，填写反馈机构、联系人、自查问题及总结反馈等内容，并保存机构反馈。",
        472: "系统支持查看专项风险提示及机构反馈信息，填写评估结果、评估部门和分析总结，并保存评估内容。",
    }

    # 复制既有正文段落格式，保证字体、行距和缩进与前文一致。
    body_ppr = copy.deepcopy(paragraphs[70]._p.pPr)
    for title_index in sorted(summaries, reverse=True):
        summary_paragraph = insert_after(paragraphs[title_index], summaries[title_index], body_ppr)
        if title_index != 80:
            summary_paragraph.paragraph_format.keep_with_next = True

    # 删除界面标签、字段规则、按钮步骤及所有第四章操作明细表；图片段落仅清除混排标签文字。
    preserve_text_indices = {
        69, 70, 72, 73, 74,
        79, 80,
        85, 86, 87, 89, 91, 93, 94, 97, 98, 99,
        101, 102, 113, 127, 136, 147, 159, 160, 174, 183, 192, 200, 201, 217, 226, 237, 246,
        258, 259, 270, 282, 291, 302, 312,
        322, 323, 324, 325, 326, 328, 339,
        351, 362, 373, 384, 395, 406, 407, 417, 428, 439, 449, 461, 472,
    }
    flow_image_indices = {89, 94, 99, 326}
    chapter4_original = paragraphs[69:]
    for original_index, paragraph in enumerate(paragraphs):
        if original_index < 69:
            continue
        if original_index in preserve_text_indices:
            continue
        if has_drawing(paragraph):
            if original_index not in flow_image_indices:
                strip_text_keep_drawing(paragraph)
            continue
        remove_paragraph(paragraph)

    for table in list(doc.tables)[5:]:
        remove_table(table)

    # 标题与正文基础排版统一；仅处理第一、四章目标段落，不触碰第二、三章。
    for index in (73, 86, 323):
        for run in paragraphs[index].runs:
            run.bold = True

    doc.save(OUTPUT)

    # 结构完整性核验。
    out_doc = Document(OUTPUT)
    output_media = media_hashes(OUTPUT)
    output_ch2 = chapter_block_c14n(out_doc, "二、需求概述", "三、系统角色建议")
    output_ch3 = chapter_block_c14n(out_doc, "三、系统角色建议", "四、界面说明")
    all_text = "\n".join(p.text for p in out_doc.paragraphs)
    term_presence = {term: (term in all_text) for term, _ in terms}
    report = {
        "source": str(SOURCE),
        "output": str(OUTPUT),
        "source_media_count": len(source_media),
        "output_media_count": len(output_media),
        "media_hashes_identical": source_media == output_media,
        "source_inline_shapes": len(doc.inline_shapes),
        "output_inline_shapes": len(out_doc.inline_shapes),
        "chapter2_identical": original_ch2 == output_ch2,
        "chapter3_identical": original_ch3 == output_ch3,
        "remaining_tables": len(out_doc.tables),
        "remaining_operation_markers": {
            marker: all_text.count(marker)
            for marker in ["界面规则", "操作功能说明", "操作界面字段规则及要求", "点击“"]
        },
        "term_presence": term_presence,
        "paragraph_count": len(out_doc.paragraphs),
    }
    QA_REPORT.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(report, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
