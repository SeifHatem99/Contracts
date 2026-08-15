# Vercel Deployment

This project is designed to run as a static frontend on Vercel.

## What Works on Vercel

- Dashboard and contract form
- Template loading from `/templates/*.docx`
- CSS and JavaScript assets from relative paths
- DOCX generation and download
- Word-only generation when PDF conversion is unavailable

## What Stays Local on Mac

- PDF conversion through the local launcher
- LibreOffice or Microsoft Word based DOCX-to-PDF conversion

Vercel does not have access to the user's Mac applications, so the deployed site must treat PDF conversion as optional.

## Deployment Behavior

The frontend calls the PDF converter endpoint when the user requests PDF output.

- On local Mac launch, the Python server exposes `/api/converters/status` and `/api/convert-pdf`.
- On Vercel, those endpoints are not present, so the app should report that PDF conversion is unavailable and continue with DOCX download.

If PDF conversion cannot be reached, the app must still:

- Generate the DOCX file
- Allow the DOCX download to complete
- Show a clear PDF-unavailable message

## Local Mac Workflow

1. Open the app with the local launcher.
2. Create or open a contract.
3. Choose Word, PDF, or Word + PDF.
4. If LibreOffice or Microsoft Word is installed, the launcher will convert the DOCX to PDF locally.

## Vercel Workflow

1. Deploy the repository as a static site.
2. Open the deployed URL.
3. Create or open a contract.
4. Download the DOCX file.
5. If PDF is unavailable, use the Word download and the in-app warning.

## Validation Notes

- Template paths are relative and resolve from the deployed origin.
- No hard-coded localhost port is required for the frontend.
- PDF conversion is intentionally local-only until a hosted converter is added later.

