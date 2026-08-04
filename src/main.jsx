import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { countMissing, emptyResume, parseResumeText } from './parser'
import { extractResume } from './fileReader'
import './styles.css'

const personalFields = [
  ['name', 'Name'], ['gender', 'Gender'], ['nationality', 'Nationality'], ['degree', 'Degree'],
  ['professionalTitle', 'Professional Title'], ['studyField', 'Study Field'], ['department', 'Department'],
  ['teachingTime', 'Teaching time'], ['email', 'Email']
]

const Icon = ({ name }) => {
  const paths = {
    upload: <><path d="M12 16V4m0 0L7 9m5-5 5 5"/><path d="M5 15v4h14v-4"/></>,
    file: <><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v5h5"/></>,
    print: <><path d="M7 8V3h10v5M7 17H4v-7h16v7h-3"/><path d="M7 14h10v7H7z"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    trash: <><path d="M5 7h14M9 7V4h6v3m2 0-1 14H8L7 7"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    edit: <><path d="m4 20 4.5-1 10-10-3.5-3.5-10 10z"/><path d="m13.5 6.5 3.5 3.5"/></>
  }
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>
}

function UploadScreen({ onUpload, busy, progress }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)
  const select = (files) => files?.[0] && onUpload(files[0])

  return <main className="upload-shell">
    <section className="intro">
      <div className="brand-mark" aria-hidden="true"><span>Q</span></div>
      <p className="kicker">Resume Conversion resume format</p>
      <h1>Bring the content.<br/>Keep the format.</h1>
      <p className="intro-copy">Upload an existing résumé. We’ll place what we can find into the supplied Resume Conversion instructor template, then show every missing field for you to finish.</p>
      <div className="privacy-note"><Icon name="check"/><span>Files stay in this browser</span></div>
    </section>
    <section className="upload-panel" aria-labelledby="upload-title">
      <div className="panel-index">01</div>
      <div className="panel-copy">
        <h2 id="upload-title">Choose your résumé</h2>
        <p>PDF, DOCX, TXT, RTF, HTML, Markdown, or an image.</p>
      </div>
      <button
        className={`drop-zone ${dragging ? 'is-dragging' : ''}`}
        type="button"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => { event.preventDefault(); setDragging(false); select(event.dataTransfer.files) }}
      >
        <span className="upload-icon"><Icon name="upload"/></span>
        <strong>{busy ? 'Reading your résumé…' : 'Drop file here'}</strong>
        <span>{busy ? progress || 'Extracting text and structure' : 'or click to browse'}</span>
      </button>
      <input ref={inputRef} className="sr-only" type="file" accept=".pdf,.docx,.txt,.rtf,.html,.htm,.md,.png,.jpg,.jpeg,.webp,.bmp,.tif,.tiff" onChange={(event) => select(event.target.files)} />
      <p className="fallback-note">Unrecognized format? You’ll still get a blank, fully editable template.</p>
    </section>
  </main>
}

function Field({ label, value, onChange, textarea = false }) {
  const Component = textarea ? 'textarea' : 'input'
  return <label className={`field ${!value ? 'is-missing' : ''}`}>
    <span>{label}{!value && <em>Missing</em>}</span>
    <Component value={value} onChange={(event) => onChange(event.target.value)} placeholder={`Enter ${label.toLowerCase()}`} rows={textarea ? 4 : undefined} />
  </label>
}

function Editor({ resume, setResume, fileName, onReset }) {
  const setField = (key, value) => setResume((current) => ({ ...current, [key]: value }))
  const setRow = (section, index, key, value) => setResume((current) => ({ ...current, [section]: current[section].map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row) }))
  const addRow = (section, row) => setResume((current) => ({ ...current, [section]: [...current[section], row] }))
  const removeRow = (section, index) => setResume((current) => ({ ...current, [section]: current[section].filter((_, rowIndex) => rowIndex !== index) }))

  const uploadPhoto = (file) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setField('photo', reader.result)
    reader.readAsDataURL(file)
  }

  return <aside className="editor-panel">
    <div className="source-file"><Icon name="file"/><span><small>Source file</small><strong>{fileName}</strong></span><button type="button" onClick={onReset}>Replace</button></div>
    <div className="editor-heading"><div><p>Review & complete</p><h2>Your information</h2></div><span>{countMissing(resume)} missing</span></div>
    <section className="form-section">
      <h3>Personal details</h3>
      <div className="field-grid">
        {personalFields.map(([key, label]) => <Field key={key} label={label} value={resume[key]} onChange={(value) => setField(key, value)} />)}
      </div>
      <label className="photo-control"><span>Portrait photo <small>Optional</small></span><input type="file" accept="image/*" onChange={(event) => uploadPhoto(event.target.files?.[0])}/></label>
    </section>
    <section className="form-section">
      <h3>Education</h3>
      {resume.education.map((row, index) => <div className="repeat-block" key={`education-${index}`}>
        <div className="repeat-title"><strong>Education {index + 1}</strong>{resume.education.length > 1 && <button aria-label={`Remove education ${index + 1}`} type="button" onClick={() => removeRow('education', index)}><Icon name="trash"/></button>}</div>
        <div className="field-grid"><Field label="Degree" value={row.degree} onChange={(value) => setRow('education', index, 'degree', value)}/><Field label="University" value={row.university} onChange={(value) => setRow('education', index, 'university', value)}/><Field label="Year obtained" value={row.year} onChange={(value) => setRow('education', index, 'year', value)}/><Field label="Area of specialization" value={row.specialization} onChange={(value) => setRow('education', index, 'specialization', value)}/></div>
      </div>)}
      <button className="add-button" type="button" onClick={() => addRow('education', { degree: '', university: '', year: '', specialization: '' })}><Icon name="plus"/>Add education</button>
    </section>
    <section className="form-section">
      <h3>Working experience</h3>
      {resume.experience.map((row, index) => <div className="repeat-block" key={`experience-${index}`}>
        <div className="repeat-title"><strong>Experience {index + 1}</strong>{resume.experience.length > 1 && <button aria-label={`Remove experience ${index + 1}`} type="button" onClick={() => removeRow('experience', index)}><Icon name="trash"/></button>}</div>
        <div className="field-grid"><Field label="Period" value={row.period} onChange={(value) => setRow('experience', index, 'period', value)}/><Field label="Organization" value={row.organization} onChange={(value) => setRow('experience', index, 'organization', value)}/><Field label="Role" value={row.role} onChange={(value) => setRow('experience', index, 'role', value)}/></div>
      </div>)}
      <button className="add-button" type="button" onClick={() => addRow('experience', { period: '', organization: '', role: '' })}><Icon name="plus"/>Add experience</button>
    </section>
    <section className="form-section"><h3>Research</h3><Field textarea label="Main research results" value={resume.researchResults} onChange={(value) => setField('researchResults', value)}/></section>
  </aside>
}

const visible = (value) => value || <span className="preview-blank">&nbsp;</span>

function ResumePage({ resume }) {
  return <article className="resume-page" aria-label="Formatted resume preview">
    {/*
      THESIS: The supplied Resume Conversion paper is the contract; this surface refuses theme-driven restyling.
      OWN-WORLD: White A4 paper, black Times body, heavy bilingual title, ruled education table.
      STORY: Review extracted facts, see blanks immediately, save a faithful Resume Conversion-formatted PDF.
      FIRST VIEWPORT: Fixed title above personal facts; portrait locks to upper-right; education follows.
      FORM: Exact supplied document reconstruction, ranked first because user pinned its format.
    */}
    <header className="resume-title">
      <h1>烹饪与餐饮管理专业外方骨干教师简介</h1>
      <h2>Resume of Resume Conversion Instructor—（{resume.name || <span className="name-blank">Name</span>})</h2>
    </header>
    <section className="personal-preview">
      <div className="personal-lines">
        {personalFields.map(([key, label]) => <div key={key}><strong>{label}:</strong> {visible(resume[key])}</div>)}
        <div><strong>Educational background:</strong></div>
      </div>
      {resume.photo ? <img src={resume.photo} alt={`${resume.name || 'Candidate'} portrait`}/> : <div className="photo-placeholder"><span>PHOTO</span></div>}
    </section>
    <table className="education-preview">
      <thead><tr><th>Degree</th><th>University</th><th>Year Obtained</th><th>Area of Specialization</th></tr></thead>
      <tbody>{resume.education.map((row, index) => <tr key={index}><td>{visible(row.degree)}</td><td>{visible(row.university)}</td><td>{visible(row.year)}</td><td>{visible(row.specialization)}</td></tr>)}</tbody>
    </table>
    <section className="experience-preview">
      <h3>Working experience:</h3>
      <ol>{resume.experience.map((row, index) => <li key={index}><div>{visible(row.period)}</div><div>{visible(row.organization)}{row.role ? ` (${row.role})` : ''}</div></li>)}</ol>
    </section>
    <section className="research-preview"><h3>Main research results:</h3>{resume.researchResults && <p>{resume.researchResults}</p>}</section>
  </article>
}

function Workspace({ initialResume, fileName, onReset }) {
  const [resume, setResume] = useState(initialResume)
  const missing = useMemo(() => countMissing(resume), [resume])
  useEffect(() => setResume(initialResume), [initialResume])
  return <div className="workspace">
    <header className="app-bar"><div className="wordmark"><span>Q</span><strong>Resume Converter</strong></div><div className="status"><span className={missing ? 'status-dot warning' : 'status-dot'}></span>{missing ? `${missing} fields need attention` : 'Ready to export'}</div><button className="export-button" type="button" onClick={() => window.print()}><Icon name="print"/>Save as PDF</button></header>
    <main className="workspace-body"><Editor resume={resume} setResume={setResume} fileName={fileName} onReset={onReset}/><section className="preview-stage"><div className="preview-label"><span>Live preview</span><small>A4 · Template matched</small></div><ResumePage resume={resume}/></section></main>
  </div>
}

function App() {
  const [resume, setResume] = useState(null)
  const [fileName, setFileName] = useState('')
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState('')

  const handleUpload = async (file) => {
    setBusy(true); setProgress('Opening file…')
    try {
      const { text, photo } = await extractResume(file, setProgress)
      const parsed = text.trim() ? parseResumeText(text) : emptyResume()
      parsed.photo = photo
      setResume(parsed)
      setFileName(file.name)
    } catch (error) {
      console.error(error)
      setResume(emptyResume())
      setFileName(file.name)
    } finally {
      setBusy(false); setProgress('')
    }
  }

  return resume
    ? <Workspace initialResume={resume} fileName={fileName} onReset={() => { setResume(null); setFileName('') }}/>
    : <UploadScreen onUpload={handleUpload} busy={busy} progress={progress}/>
}

createRoot(document.getElementById('root')).render(<React.StrictMode><App/></React.StrictMode>)
