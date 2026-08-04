import test from 'node:test'
import assert from 'node:assert/strict'
import { countMissing, emptyResume, parseResumeText, stripRtf } from './parser.js'
import { selectPortraitCandidate } from './fileReader.js'

test('provides independently editable English and Chinese titles', () => {
  const resume = emptyResume()
  assert.equal(resume.documentTitle, 'Resume of QIU Instructor')
  assert.equal(resume.chineseTitle, '烹饪与餐饮管理专业外方骨干教师简介')
})

test('extracts labelled fields and common sections', () => {
  const resume = parseResumeText(`Name: Noor Asneeda binti Ishak
Gender: Female
Nationality: Malaysia
Degree: Master
Study Field: Food Service Management
Email: noor@example.com
Educational background:
Master | Universiti Teknologi Mara | 2015 | Food Service Management
Working experience:
2016 - Current | Quest International University (Senior Lecturer)
Main research results:
Food-service education research`)

  assert.equal(resume.name, 'Noor Asneeda binti Ishak')
  assert.equal(resume.email, 'noor@example.com')
  assert.equal(resume.education[0].year, '2015')
  assert.equal(resume.experience[0].role, 'Senior Lecturer')
  assert.match(resume.researchResults, /Food-service education/)
  assert.ok(countMissing(resume) > 0)
})

test('strips basic RTF control words', () => {
  assert.equal(stripRtf('{\\rtf1 Name: Alex\\par Email: a@example.com}').trim(), 'Name: Alex\nEmail: a@example.com')
})

test('reconstructs split PDF table rows and work entries', () => {
  const resume = parseResumeText(`Name: Noor Asneeda
Educational background:
Degree University Year Obtained Area of Specialization
Universiti
Master 2015 Food Service Management
Teknologi Mara
Universiti
Degree 2013 Food Service Management
Teknologi Mara
Working experience:
2016- Current
Quest International University (Senior Lecturer and Programme Coordinator)
Main research results:`)

  assert.deepEqual(resume.education[0], {
    degree: 'Master',
    university: 'Universiti Teknologi Mara',
    year: '2015',
    specialization: 'Food Service Management'
  })
  assert.equal(resume.education[1].degree, 'Degree')
  assert.equal(resume.education[1].year, '2013')
  assert.deepEqual(resume.experience[0], {
    period: '2016- Current',
    organization: 'Quest International University',
    role: 'Senior Lecturer and Programme Coordinator'
  })
})

test('parses labelled blocks from a scanned multi-page resume', () => {
  const resume = parseResumeText(`AFIF NAIM BIN ABD RANI
Contact Info
E-mail Address : afifnaim81@gmail.com
Personal Particulars
Nationality : Malaysia
Gender : Male
Educational Background
Master
Field of Study
Major
Institute/University
Graduation Date
: Culinary/Hospitality/Tourism/Hotel Management
: Master in Gastronomy
: Universiti Teknologi Mara (UiTM) Shah Alam, Malaysia
: January 2016
Bachelor's Degree
Field of Study : Culinary/Hospitality/Tourism/Hotel Management
Institute/University : Universiti Teknologi Mara (UiTM) Shah Alam, Malaysia
Graduation Date : Mac 2012
Diploma
Field of Study : Hospitality/Tourism/Hotel Management
Institute/University : Universiti Teknologi Mara (UiTM) Dungun, Malaysia
Graduation Date : May 2003
Current Employment
City University, Petaling Jaya, Selangor
Position ttle |: Head of Department & Lecturer (Culinary Arts)
Duration. |: 05 July 2018 - present
Employment History
Universiti Utara Malaysia, Sintok, Kedah (UUM)
Position title : Lecturer (Culinary Arts)
Duration 20 Feb 2018 - 01 July 2018`)

  assert.equal(resume.name, 'AFIF NAIM BIN ABD RANI')
  assert.equal(resume.gender, 'Male')
  assert.equal(resume.nationality, 'Malaysia')
  assert.equal(resume.email, 'afifnaim81@gmail.com')
  assert.equal(resume.degree, 'Master')
  assert.equal(resume.studyField, 'Culinary/Hospitality/Tourism/Hotel Management')
  assert.equal(resume.professionalTitle, 'Head of Department & Lecturer (Culinary Arts)')
  assert.equal(resume.education.length, 3)
  assert.equal(resume.education[0].year, '2016')
  assert.equal(resume.education[0].university, 'Universiti Teknologi Mara (UiTM) Shah Alam, Malaysia')
  assert.equal(resume.experience.length, 2)
  assert.equal(resume.experience[0].organization, 'City University, Petaling Jaya, Selangor')
  assert.equal(resume.experience[1].period, '20 Feb 2018 - 01 July 2018')
})

test('collects research and publications without swallowing later sections', () => {
  const resume = parseResumeText(`Name: Aisha Rahman
Research & Publications
Rahman, A. (2024). Sustainable food systems.
Conference paper: Culinary education in Malaysia.
Awards
Best Lecturer Award 2025
References
Available upon request`)

  assert.match(resume.researchResults, /Sustainable food systems/)
  assert.match(resume.researchResults, /Culinary education/)
  assert.doesNotMatch(resume.researchResults, /Best Lecturer|Available upon request/)
})

test('collects research under OCR-damaged headings', () => {
  const resume = parseResumeText(`Name: Aisha Rahman
Main research result5
2025 Sustainable gastronomy education in Malaysian universities.
2024 Community food-waste reduction project.
Professional Memberships
Malaysian Culinary Association`)

  assert.match(resume.researchResults, /Sustainable gastronomy education/)
  assert.match(resume.researchResults, /food-waste reduction/)
  assert.doesNotMatch(resume.researchResults, /Malaysian Culinary Association/)
})

test('selects a portrait image and rejects logos or full-page scans', () => {
  assert.equal(selectPortraitCandidate([
    { dataUrl: 'logo', width: 600, height: 120, fullPage: false },
    { dataUrl: 'scan', width: 1400, height: 1960, fullPage: true },
    { dataUrl: 'portrait', width: 430, height: 500, fullPage: false }
  ]), 'portrait')
})
