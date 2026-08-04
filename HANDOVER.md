# Handover Guide: Resume Conversion

Welcome to the **Resume Conversion** project. This document serves as a guide for incoming developers to get started, deploy the application, and understand known constraints and future improvement paths.

## 1. Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm or yarn

### Installation & Local Development
1. Navigate to the project directory:
   ```bash
   cd "/Users/sooyauming/Desktop/Intern/Resume Conversion"
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the local Vite development server:
   ```bash
   npm run dev
   ```
4. Open the provided `localhost` URL in your browser.

### Available Scripts
- `npm run dev`: Starts the local dev server.
- `npm run build`: Compiles and bundles the application for production.
- `npm run preview`: Locally previews the production build.
- `npm test`: Runs the test suite (via Node's native test runner on `src/parser.test.js`).

## 2. Deployment Instructions

This is a static client-side application. It can be hosted on any static file server or CDN (e.g., Vercel, Netlify, GitHub Pages, AWS S3).

1. Build the project:
   ```bash
   npm run build
   ```
2. The output will be generated in the `dist/` directory.
3. Upload the contents of the `dist/` directory to your chosen hosting provider. Since there is no server-side logic or database routing, no environment variables or backend configurations are required.

## 3. Known Constraints

- **Client-Side OCR Performance:** The application relies on `tesseract.js` for Optical Character Recognition when processing images or scanned PDFs. This happens in the browser and can be CPU-intensive and slow, particularly on lower-end devices or with large multi-page PDFs.
- **Portrait Extraction Heuristics:** Face detection attempts to use the experimental `FaceDetector` Web API. If unsupported, it falls back to analyzing canvas pixel darkness densities. This is a best-effort approach and may occasionally grab logos or decorative graphics instead of human faces.
- **Print Export Reliability:** The PDF generation relies completely on the user triggering their browser's "Save as PDF" dialog (`window.print()`). Users must ensure they have backgrounds enabled and margins set to default/none in their browser print settings to ensure the QIU template matches the original exactly.
- **Parsing Inaccuracies:** The `parser.js` relies heavily on Regular Expressions (`fieldPatterns`). It expects conventional resume formats. Unconventional layouts or highly creative resumes might result in poorly parsed fields. Users are explicitly expected to manually review and correct data in the Editor.

## 4. Future Considerations

- **LLM-based Parsing:** If accuracy becomes a severe bottleneck, consider replacing the regex parser with a lightweight local LLM (like WebLLM) or providing an opt-in API integration to a cloud LLM to map unstructured resume text into a strict JSON schema.
- **PDF Generation Library:** To bypass browser print inconsistencies, consider implementing a client-side PDF generation library (like `jspdf` or `@react-pdf/renderer`) to programmatically draw the exact A4 template without relying on the user's browser print dialog.
- **Web Worker Offloading:** Ensure that `pdfjs-dist` and `tesseract.js` are fully utilizing web workers to prevent the main thread from locking up during heavy extractions. A progress bar UI is present but deeper integration with Service Workers could improve caching of OCR models.
