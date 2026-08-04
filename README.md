# Resume Conversion Resume Converter

Browser-based résumé converter that maps uploaded content into the supplied Resume Conversion instructor résumé template, highlights missing attributes, allows title editing, and exports the edited result as DOCX or PDF.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Supported input

- PDF
- DOCX
- TXT, Markdown, CSV, and JSON text
- RTF
- HTML
- PNG, JPEG, WebP, BMP, and TIFF through in-browser OCR

Unknown files still open a blank editable template. Extraction is best-effort; users should review every field before export. Files remain in the browser and are not uploaded to a server.

The converter also imports a likely portrait from PDF/DOCX files or a scanned first page when one can be identified confidently. Research, publication, conference-paper, and research-project sections are mapped into the template's main research results field. Anything uncertain remains editable or blank for the user to complete.

## Export

Edit the **English title** and **Chinese title** in the Document section. Choose **Download DOCX** for a Word file, or choose **Save as PDF** and select **Save as PDF** in the browser print dialog. Both outputs preserve the A4 template structure.

## Checks

```bash
npm test
npm run build
```
