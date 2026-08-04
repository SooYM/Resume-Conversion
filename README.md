# Resume Conversion Resume Converter

Browser-based résumé converter that maps uploaded content into the supplied Resume Conversion instructor résumé template, highlights missing attributes, and exports the edited result through the browser's PDF print flow.

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

Choose **Save as PDF**, then select **Save as PDF** in the browser print dialog. Print CSS fixes the document to A4 and removes editor-only blank indicators.

## Checks

```bash
npm test
npm run build
```
