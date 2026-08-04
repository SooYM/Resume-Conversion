import test from 'node:test'
import assert from 'node:assert/strict'
import { buildDocumentXml, safeFileName } from './docxExport.js'

test('builds editable title and resume sections into DOCX XML', () => {
  const document = buildDocumentXml({
    chineseTitle: '自定义中文标题', documentTitle: 'Curriculum & Vitae', name: 'Aisha Rahman', gender: '', nationality: '', degree: '', professionalTitle: '', studyField: '', department: '', teachingTime: '', email: '',
    education: [{ degree: 'Master', university: 'QIU', year: '2024', specialization: 'Food Studies' }],
    experience: [{ period: '2024 - Present', organization: 'QIU', role: 'Lecturer' }], researchResults: 'Published research'
  })
  assert.match(document, /Curriculum &amp; Vitae/)
  assert.match(document, /自定义中文标题/)
  assert.match(document, /Published research/)
  assert.match(document, /w:tbl/)
  assert.equal(safeFileName('CV: Aisha / 2026'), 'CV Aisha 2026')
})
