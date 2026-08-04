export const emptyResume = () => ({
  documentTitle: 'Resume of QIU Instructor',
  name: '',
  gender: '',
  nationality: '',
  degree: '',
  professionalTitle: '',
  studyField: '',
  department: '',
  teachingTime: '',
  email: '',
  photo: '',
  education: [{ degree: '', university: '', year: '', specialization: '' }],
  experience: [{ period: '', organization: '', role: '' }],
  researchResults: ''
})

const clean = (value = '') => value.replace(/\u00a0/g, ' ').replace(/[ \t]+/g, ' ').trim()

const fieldPatterns = {
  name: /^(?:full\s*)?name\s*[:\-]\s*(.+)$/i,
  gender: /^(?:gender|sex)\s*[:\-]\s*(.+)$/i,
  nationality: /^(?:nationality|citizenship)\s*[:\-]\s*(.+)$/i,
  degree: /^(?:highest\s+)?degree\s*[:\-]\s*(.+)$/i,
  professionalTitle: /^(?:professional\s+title|job\s+title|position)\s*[:\-]\s*(.+)$/i,
  studyField: /^(?:study\s+field|field\s+of\s+study|speciali[sz]ation)\s*[:\-]\s*(.+)$/i,
  department: /^(?:department|faculty|school)\s*[:\-]\s*(.+)$/i,
  teachingTime: /^(?:teaching\s+(?:time|experience)|years?\s+teaching)\s*[:\-]\s*(.+)$/i,
  email: /^(?:e-?mail(?: address)?)\s*[:\-]\s*(.+)$/i
}

const sectionMatcher = /^(education(?:al background)?|academic background|current employment|work(?:ing)? experience|employment(?: history)?|professional experience|(?:main\s+)?research(?: results| output| publications| experience| projects?| interests?)?|research\s*(?:&|and)\s*publications|(?:selected|academic)?\s*publications?|journal articles?|conference papers?)\s*:?$/i
const otherSectionMatcher = /^(?:awards?|honou?rs?|skills?|certifications?|languages?|references?|projects?|professional development|training|volunteer(?:ing)?|activities|interests?)\s*:?$/i

function splitSections(lines) {
  const sections = { general: [] }
  let current = 'general'
  for (const line of lines) {
    const heading = line.match(sectionMatcher)?.[1]?.toLowerCase()
    if (heading) {
      current = heading.includes('educ') || heading.includes('academic')
        ? 'education'
        : heading.includes('work') || heading.includes('employment') || heading.includes('professional')
          ? 'experience'
          : 'research'
      sections[current] ??= []
    } else if (otherSectionMatcher.test(line)) {
      current = 'other'
      sections.other ??= []
    } else {
      sections[current] ??= []
      sections[current].push(line)
    }
  }
  return sections
}

function parseEducation(lines) {
  const degreeHeading = /^(?:ph\.?d\.?|doctorate|master(?:'s)?|bachelor(?:'s)?(?: degree)?|diploma|certificate|degree)$/i
  const labelledEntries = []
  for (let index = 0; index < lines.length; index += 1) {
    const heading = clean(lines[index]).replace(/:$/, '')
    if (!degreeHeading.test(heading)) continue
    const block = []
    for (let cursor = index + 1; cursor < lines.length && !degreeHeading.test(clean(lines[cursor]).replace(/:$/, '')); cursor += 1) block.push(lines[cursor])
    const labels = [
      ['specialization', /^(?:field of study|study field|speciali[sz]ation)\s*(?:[:|=—-]+\s*(.*))?$/i],
      ['major', /^major\s*(?:[:|=—-]+\s*(.*))?$/i],
      ['university', /\b(?:institute\s*\/\s*university|university|institution|name of school)\s*(?:[:|=—-]+\s*(.*))?$/i],
      ['graduation', /^(?:graduation date|year obtained|year)\s*(?:[:|=—-]+\s*(.*))?$/i]
    ]
    const values = {}
    const pending = []
    const orphanValues = []
    for (const rawLine of block) {
      const line = clean(rawLine)
      const orphan = line.match(/^[:|=—-]+\s*(.+)$/)?.[1]
      if (orphan) { orphanValues.push(clean(orphan)); continue }
      for (const [key, pattern] of labels) {
        const match = line.match(pattern)
        if (!match) continue
        if (clean(match[1])) values[key] ??= clean(match[1])
        else pending.push(key)
        break
      }
    }
    pending.forEach((key, pendingIndex) => { values[key] ??= orphanValues[pendingIndex] || '' })
    const university = values.university || ''
    const specialization = values.specialization || values.major || ''
    const graduation = values.graduation || ''
    if (university || specialization || graduation) {
      labelledEntries.push({ degree: heading, university: clean(university), year: graduation.match(/\b(?:19|20)\d{2}\b/)?.[0] || clean(graduation), specialization: clean(specialization) })
    }
  }
  if (labelledEntries.length) return labelledEntries

  const entries = []
  for (let index = 0; index < lines.length; index += 1) {
    const raw = lines[index]
    const line = raw.replace(/^\s*(?:[•●▪*-]|\d+[.)])\s*/, '').trim()
    if (!line || /^(?:degree|university|institution|year|area(?: of specialization)?)$/i.test(line) || /degree.+(?:university|institution).+year/i.test(line)) continue
    const year = line.match(/\b(?:19|20)\d{2}\b/)?.[0] || ''
    const degree = line.match(/\b(?:ph\.?d\.?|doctorate|master(?:'s)?|bachelor(?:'s)?|diploma|certificate|degree)\b/i)?.[0] || ''
    if (!year && !degree) continue
    const parts = line.split(/\s*[|;]\s*|\s{2,}/).map(clean).filter(Boolean)
    const neighborUniversity = [lines[index - 1], lines[index + 1]]
      .map((part) => clean(part))
      .filter((part) => part && !/\b(?:19|20)\d{2}\b/.test(part) && !/\b(?:master|bachelor|diploma|degree|certificate|doctorate)\b/i.test(part))
      .join(' ')
    const afterYear = year ? clean(line.slice(line.indexOf(year) + year.length).replace(/^[|,;\s-]+/, '')) : ''
    entries.push({
      degree: clean(degree),
      university: parts.find((part) => /universit|college|institute|school/i.test(part)) || neighborUniversity,
      year,
      specialization: afterYear || parts.find((part) => part !== degree && part !== year && !/universit|college|institute|school/i.test(part)) || ''
    })
  }
  return entries
}

function parseLabelledExperience(lines) {
  const labelledEntries = []
  for (let index = 0; index < lines.length; index += 1) {
    const role = clean(lines[index].match(/^position\b.{0,18}?[:|=—-]+\s*(.+)$/i)?.[1])
    if (!role) continue
    let organization = ''
    for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
      const candidate = clean(lines[cursor])
      if (!candidate || /^(?:current employment|employment history|work description|duration|position title)\s*:?/i.test(candidate)) continue
      organization = candidate
      break
    }
    let period = ''
    for (let cursor = index + 1; cursor < Math.min(lines.length, index + 4); cursor += 1) {
      const durationLine = clean(lines[cursor])
      if (/^duration\b/i.test(durationLine)) {
        period = clean(durationLine.replace(/^duration\b/i, '').replace(/^[^A-Za-z0-9]+/, ''))
        break
      }
    }
    labelledEntries.push({ period, organization, role })
  }
  return labelledEntries
}

function parseExperience(lines) {
  const entries = []
  let current = null
  for (const raw of lines) {
    const line = raw.replace(/^\s*(?:[•●▪*-]|\d+[.)])\s*/, '').trim()
    if (!line) continue
    const period = line.match(/(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?|\b(?:19|20)\d{2}\b)[^|,;]*(?:present|current|\b(?:19|20)\d{2}\b)?/i)?.[0] || ''
    if (period || !current) {
      current = { period: clean(period), organization: '', role: '' }
      const remainder = clean(line.replace(period, '').replace(/^[-–—,:]+/, ''))
      const role = remainder.match(/\(([^)]+)\)\s*$/)?.[1] || ''
      current.organization = clean(remainder.replace(/\([^)]+\)\s*$/, ''))
      current.role = clean(role)
      entries.push(current)
    } else if (!current.organization) {
      const role = line.match(/\(([^)]+)\)\s*$/)?.[1] || ''
      current.organization = clean(line.replace(/\([^)]+\)\s*$/, ''))
      current.role = clean(role)
    } else {
      current.role = clean([current.role, line].filter(Boolean).join(', '))
    }
  }
  return entries
}

export function parseResumeText(rawText) {
  const result = emptyResume()
  const lines = rawText.split(/\r?\n/).map(clean).filter(Boolean)
  const sections = splitSections(lines)

  for (const line of sections.general) {
    for (const [key, pattern] of Object.entries(fieldPatterns)) {
      const value = line.match(pattern)?.[1]
      if (value && !result[key]) result[key] = clean(value)
    }
  }

  if (!result.email) result.email = rawText.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/)?.[0] || ''
  if (!result.name) {
    const ignoredHeading = /^(?:contact info|personal particulars|educational background|employment history|current employment|work description)$/i
    result.name = lines.find((line) => /^[A-Z][A-Z .'-]{4,60}$/.test(line) && /\s/.test(line) && !ignoredHeading.test(line))
      || lines.find((line) => /^[A-Za-z][A-Za-z .'-]{2,60}$/.test(line) && !sectionMatcher.test(line) && !ignoredHeading.test(line))
      || ''
  }

  const education = parseEducation(sections.education || [])
  const experience = parseLabelledExperience(lines)
  if (!experience.length) experience.push(...parseExperience(sections.experience || []))
  if (education.length) result.education = education
  if (experience.length) result.experience = experience
  if (!result.degree && education.length) result.degree = education[0].degree
  if (!result.studyField && education.length) result.studyField = education[0].specialization
  if (!result.professionalTitle && experience.length) result.professionalTitle = experience[0].role
  result.researchResults = clean((sections.research || []).join('\n'))
  return result
}

export const countMissing = (resume) => {
  const personal = ['name', 'gender', 'nationality', 'degree', 'professionalTitle', 'studyField', 'department', 'teachingTime', 'email']
  let count = personal.filter((key) => !clean(resume[key])).length
  count += resume.education.reduce((total, row) => total + ['degree', 'university', 'year', 'specialization'].filter((key) => !clean(row[key])).length, 0)
  count += resume.experience.reduce((total, row) => total + ['period', 'organization', 'role'].filter((key) => !clean(row[key])).length, 0)
  if (!clean(resume.researchResults)) count += 1
  return count
}

export function stripRtf(input) {
  return input
    .replace(/\\par[d]?/g, '\n')
    .replace(/\\'[0-9a-fA-F]{2}/g, '')
    .replace(/\\[a-z]+-?\d* ?/g, '')
    .replace(/[{}]/g, '')
    .replace(/\n[ \t]+/g, '\n')
}
