# Architecture: Resume Conversion

## 1. High-Level System Design
The "Resume Conversion" project is a client-side only React Web Application designed to convert user-uploaded resumes (in various formats) into a standard Resume Conversion instructor template.

**Key Characteristics:**
- **Zero-Backend Architecture:** All file parsing, text extraction, OCR, and PDF generation are performed entirely within the user's browser. No data is sent to external servers, prioritizing privacy and simplicity.
- **Single Page Application (SPA):** Built with React and bundled using Vite.
- **Export Mechanism:** Relies on the native browser print engine (via `window.print()`) combined with strict Print CSS to generate the final A4 PDF.

## 2. File Parsing & Extraction Flows
The file processing logic resides primarily in `src/fileReader.js` and `src/parser.js`.

### 2.1 File Reader (`fileReader.js`)
Handles the reading and text extraction based on the uploaded file type:
- **PDFs:** Uses `pdfjs-dist` to extract embedded text. If the text density is low (indicating a scanned document), it renders the PDF pages onto HTML `<canvas>` elements and runs Optical Character Recognition (OCR) using `tesseract.js`. It also attempts to extract a portrait photo by looking for embedded images or by utilizing the `FaceDetector` API (with a custom heuristic fallback for regions of high pixel density).
- **DOCX:** Uses `mammoth` to convert the DOCX into HTML, extracting raw text and looking for embedded base64 images that might serve as a portrait.
- **Images (PNG, JPG, etc.):** Passes directly into `tesseract.js` for OCR and searches for a face via the `FaceDetector` API.
- **RTF / HTML / Plain Text:** Read via the browser's native `DOMParser` or plain string manipulation.

### 2.2 Text Parser (`parser.js`)
Takes the raw extracted text and maps it into structured data:
- **Section Splitting:** Uses regex (e.g., `sectionMatcher`) to divide the text into logical blocks: General, Education, Experience, Research, and Other.
- **Field Extraction:** Applies a dictionary of regex patterns (`fieldPatterns`) against the General section to deduce keys like Name, Gender, Nationality, Degree, etc.
- **Structured Sections:** 
  - *Education:* Searches for degree keywords (Ph.D, Master, Bachelor) and adjacent universities and years.
  - *Experience:* Looks for date ranges and organization names.
- **Missing Data Handling:** Identifies and counts missing required fields so the user interface can highlight them.

## 3. Component Hierarchy
The UI is composed in `src/main.jsx`.

- `App`
  - Manages top-level application state (`resume` data, `fileName`, `busy` status, `progress` text).
  - Conditionally renders `UploadScreen` or `Workspace`.
  - `UploadScreen`
    - Handles drag-and-drop file inputs. Triggers the extraction pipeline.
  - `Workspace`
    - Contains the split-pane layout for desktop.
    - `Editor`
      - Left pane. Renders interactive input forms for users to review, correct, and add missing information. Includes dynamic lists for Education and Working Experience.
    - `ResumePage`
      - Right pane. The live preview stage. Reconstructs the exact visual layout of the "Resumes_Template.pdf" using HTML and CSS. Contains specific styling intended for `@media print` to guarantee an accurate A4 export.

## 4. State Management
- Built entirely on standard React Hooks (`useState`, `useEffect`, `useMemo`, `useRef`).
- The canonical data structure is the `resume` object (instantiated via `emptyResume()` in `parser.js`).
- **Data Flow:** The `resume` state flows down from `App` -> `Workspace` -> `Editor` & `ResumePage`. The `Editor` uses mutator functions (e.g., `setField`, `setRow`, `addRow`) to update the `resume` state, which triggers an immediate re-render of the live `ResumePage` preview.
