import JSZip from 'jszip'

const escapeXml = (value = '') => String(value).replace(/[<>&"']/g, (character) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[character])
const run = (value, { bold = false, size = 22, font = 'Times New Roman', eastAsia = font } = {}) => `<w:r><w:rPr><w:rFonts w:ascii="${font}" w:hAnsi="${font}" w:eastAsia="${eastAsia}"/>${bold ? '<w:b/>' : ''}<w:sz w:val="${size}"/><w:szCs w:val="${size}"/></w:rPr><w:t xml:space="preserve">${escapeXml(value)}</w:t></w:r>`
const paragraph = (value = '', options = {}) => `<w:p><w:pPr>${options.align ? `<w:jc w:val="${options.align}"/>` : ''}${options.after === 0 ? '<w:spacing w:after="0"/>' : ''}</w:pPr>${run(value, options)}</w:p>`
const borders = '<w:tcBorders><w:top w:val="single" w:sz="4"/><w:left w:val="single" w:sz="4"/><w:bottom w:val="single" w:sz="4"/><w:right w:val="single" w:sz="4"/></w:tcBorders>'
const noBorders = '<w:tcBorders><w:top w:val="nil"/><w:left w:val="nil"/><w:bottom w:val="nil"/><w:right w:val="nil"/></w:tcBorders>'
const cell = (content, width, bordered = true) => `<w:tc><w:tcPr><w:tcW w:w="${width}" w:type="dxa"/>${bordered ? borders : noBorders}<w:vAlign w:val="center"/></w:tcPr>${content}</w:tc>`

export const safeFileName = (value) => (value || 'resume').trim().replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, ' ').slice(0, 80) || 'resume'

function imageDrawing() {
  return '<w:p><w:pPr><w:jc w:val="center"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="1066800" cy="1238250"/><wp:docPr id="1" name="Portrait"/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="0" name="portrait.jpg"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdPortrait"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="1066800" cy="1238250"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>'
}

function chineseTitleDrawing() {
  return '<w:p><w:pPr><w:jc w:val="center"/><w:spacing w:after="0"/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="4800000" cy="360000"/><wp:docPr id="2" name="Chinese heading"/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="0" name="heading.png"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="rIdChineseTitle"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="4800000" cy="360000"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>'
}

function personalTable(resume, hasPhoto) {
  const details = [
    ['Name', resume.name], ['Gender', resume.gender], ['Nationality', resume.nationality], ['Degree', resume.degree],
    ['Professional Title', resume.professionalTitle], ['Study Field', resume.studyField], ['Department', resume.department],
    ['Teaching time', resume.teachingTime], ['Email', resume.email]
  ].map(([label, value]) => paragraph(`${label}: ${value || ''}`, { after: 0 })).join('')
  return `<w:tbl><w:tblPr><w:tblW w:w="8366" w:type="dxa"/><w:tblLayout w:type="fixed"/></w:tblPr><w:tblGrid><w:gridCol w:w="6600"/><w:gridCol w:w="1766"/></w:tblGrid><w:tr>${cell(details, 6600, false)}${cell(hasPhoto ? imageDrawing() : paragraph('', { after: 0 }), 1766, false)}</w:tr></w:tbl>`
}

function educationTable(rows) {
  const widths = [1150, 1900, 1700, 3616]
  const values = (row) => [row.degree, row.university, row.year, row.specialization]
  const tableRow = (row, header = false) => `<w:tr>${values(row).map((value, index) => cell(paragraph(value || '', { bold: header, align: 'center', after: 0, size: header ? 21 : 20 }), widths[index])).join('')}</w:tr>`
  return `<w:tbl><w:tblPr><w:tblW w:w="8366" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblCellMar><w:top w:w="70" w:type="dxa"/><w:left w:w="80" w:type="dxa"/><w:bottom w:w="70" w:type="dxa"/><w:right w:w="80" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${widths.map((width) => `<w:gridCol w:w="${width}"/>`).join('')}</w:tblGrid>${tableRow({ degree: 'Degree', university: 'University', year: 'Year Obtained', specialization: 'Area of Specialization' }, true)}${rows.map((row) => tableRow(row)).join('')}</w:tbl>`
}

export function buildDocumentXml(resume, hasPhoto = false, imageTitle = false) {
  const experiences = resume.experience.map((row) => `<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr><w:spacing w:after="40"/></w:pPr>${run(row.period || '')}<w:r><w:br/></w:r>${run(`${row.organization || ''}${row.role ? ` (${row.role})` : ''}`)}</w:p>`).join('')
  const research = String(resume.researchResults || '').split(/\r?\n/).map((line) => paragraph(line, { after: 0 })).join('')
  const chineseTitle = imageTitle ? chineseTitleDrawing() : paragraph('烹饪与餐饮管理专业外方骨干教师简介', { bold: true, size: 30, align: 'center', after: 0, font: 'PingFang SC', eastAsia: 'PingFang SC' })
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>${chineseTitle}${paragraph(`${resume.documentTitle || 'Resume'}— (${resume.name || 'Name'})`, { bold: true, size: 30, align: 'center' })}${personalTable(resume, hasPhoto)}${paragraph('Educational background:', { after: 0 })}${educationTable(resume.education)}${paragraph('Working experience:', { after: 0 })}${experiences}${paragraph('Main research results:', { after: 0 })}${research}<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1168" w:right="1770" w:bottom="1049" w:left="1770" w:header="0" w:footer="0" w:gutter="0"/></w:sectPr></w:body></w:document>`
}

async function jpegPhoto(dataUrl) {
  if (!dataUrl) return ''
  const image = new Image()
  image.src = dataUrl
  await image.decode()
  const canvas = document.createElement('canvas')
  canvas.width = image.naturalWidth
  canvas.height = image.naturalHeight
  canvas.getContext('2d').drawImage(image, 0, 0)
  return canvas.toDataURL('image/jpeg', 0.9).split(',')[1]
}

function chineseTitlePng() {
  const canvas = document.createElement('canvas')
  canvas.width = 1200
  canvas.height = 90
  const context = canvas.getContext('2d')
  context.fillStyle = '#000'
  context.font = '700 42px "PingFang SC", "Microsoft YaHei", sans-serif'
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.fillText('烹饪与餐饮管理专业外方骨干教师简介', 600, 45)
  return canvas.toDataURL('image/png').split(',')[1]
}

export async function createResumeDocx(resume) {
  const portrait = await jpegPhoto(resume.photo)
  const titleImage = chineseTitlePng()
  const zip = new JSZip()
  zip.file('[Content_Types].xml', '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Default Extension="jpg" ContentType="image/jpeg"/><Default Extension="png" ContentType="image/png"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/></Types>')
  zip.file('_rels/.rels', '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/></Relationships>')
  zip.file('docProps/core.xml', `<?xml version="1.0" encoding="UTF-8"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>${escapeXml(resume.documentTitle || 'Resume')}</dc:title><dc:creator>Resume Converter</dc:creator></cp:coreProperties>`)
  zip.file('word/document.xml', buildDocumentXml(resume, Boolean(portrait), true))
  zip.file('word/styles.xml', '<?xml version="1.0" encoding="UTF-8"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman"/><w:sz w:val="22"/></w:rPr></w:style></w:styles>')
  zip.file('word/numbering.xml', '<?xml version="1.0" encoding="UTF-8"?><w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:abstractNum w:abstractNumId="0"><w:multiLevelType w:val="singleLevel"/><w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1."/><w:lvlJc w:val="left"/><w:pPr><w:tabs><w:tab w:val="num" w:pos="420"/></w:tabs><w:ind w:left="420" w:hanging="280"/></w:pPr></w:lvl></w:abstractNum><w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num></w:numbering>')
  zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rIdStyles" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/><Relationship Id="rIdNumbering" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/><Relationship Id="rIdChineseTitle" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/heading.png"/>${portrait ? '<Relationship Id="rIdPortrait" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/portrait.jpg"/>' : ''}</Relationships>`)
  zip.file('word/media/heading.png', titleImage, { base64: true })
  if (portrait) zip.file('word/media/portrait.jpg', portrait, { base64: true })
  return zip.generateAsync({ type: 'blob', mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', compression: 'DEFLATE' })
}

export function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = fileName
  anchor.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
