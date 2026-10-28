# PaperEdit — Professional Client-Side PDF Editor

**PaperEdit** is a production-quality, 100% in-browser PDF editor built with **React**, **Vite**, **Mozilla PDF.js**, **pdf-lib**, and **Fabric.js**. 

It allows users to upload existing PDFs, edit existing text visually, insert new text, create and manage clickable hyperlinks, draw shapes and freehand annotations, insert images and stamps, manage pages (reorder, rotate, add, duplicate, delete), and download modified PDFs locally.

**Zero backend, zero cloud storage, zero tracking. All processing runs entirely in browser memory.**

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install --omit=optional
```

### 2. Run Locally in Development Mode
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Run Automated Tests
```bash
npm test
```

### 4. Build for Production
```bash
npm run build
```

---

## 🛠️ Architecture & Tech Stack

- **React 18 & Vite 5**: High-performance UI framework and bundler.
- **Mozilla PDF.js (`pdfjs-dist@3.11.174`)**: High-DPI canvas page rendering, text extraction with bounding boxes, font metadata, and link annotation inspection. Configured with a dedicated local web worker.
- **pdf-lib (`pdf-lib@1.17.1`)**: Local PDF modification and vector export engine. Rebuilds modified pages, applies text whiteouts and vector text, embeds images, attaches standard PDF Link Annotations (`/Annot /Link`), and preserves original vector quality without rasterization.
- **Fabric.js (`fabric@5.3.0`)**: Canvas editing layer for object selection, movement, resizing, rotation, and freehand drawing.
- **Lucide React**: Modern iconography.
- **Vanilla CSS**: Clean, modern design tokens inspired by modern desktop productivity software.

---

## ✨ Implemented Core Features

### 1. Document Upload & In-Memory Loading
- Prominent drag-and-drop zone with instant file validation (magic `%PDF-` byte verification, 50MB size limit, MIME validation).
- **"Load Multi-Page Sample Document"** button: instantly generates and loads a rich 2-page sample PDF with pre-existing text, clickable hyperlinks, and vector shapes for immediate testing.
- Local memory safety: no files are uploaded to any external server.

### 2. Existing Text Editing & Replacement
- PDF.js text layer extracts existing text runs and their precise bounding boxes.
- Clickable text boxes highlight on hover when "Edit Existing Text" mode is active.
- Clicking any text run opens the **Text Editor Modal** with live preview.
- **Hybrid Editing Strategy**: Automatically overlays a background-matched whiteout rectangle over the original text and draws crisp, matching vector text in its exact position.
- Full control over replacement text, font family (`Helvetica`, `Times-Roman`, `Courier`, `Inter`), font size, font color, background color, bold, and italic styles.

### 3. Clickable Hyperlink Management
- Automatically inspects and highlights existing PDF link annotations.
- Allows clicking any existing link to view and edit its destination URL.
- "Add Hyperlink Region" button allows placing new clickable link zones anywhere on any page.
- Exports actual PDF link annotations (`/Type /Annot /Subtype /Link /A << /S /URI >>`) that remain clickable in Acrobat, Preview, Chrome, Firefox, and Edge.

### 4. Text, Shapes, and Freehand Annotations
- **Text Boxes**: Add customizable text boxes with font sizing, colors, alignment (left/center/right), bold/italic/underline, rotation, and multiline support.
- **Shapes**: Draw Rectangles, Circles/Ellipses, Lines, and Arrows with stroke width, stroke color, fill color, and opacity sliders.
- **Drawing Tools**: Freehand Pen and semi-transparent Highlighter for signing or marking documents.
- **Stamps**: One-click vector stamps (`APPROVED`, `CONFIDENTIAL`, `DRAFT`, `PAID`).

### 5. Image Editing
- Upload PNG and JPEG images directly from your device.
- Move, resize, rotate, and adjust opacity while preserving aspect ratio.
- Exported directly into the PDF using `pdf-lib` image embedding (`embedPng` / `embedJpg`).

### 6. Page Management
- Left sidebar thumbnail strip rendering actual previews of every page.
- Direct navigation by clicking any thumbnail.
- Rotate pages 90° clockwise or counter-clockwise.
- Reorder pages up/down.
- Duplicate existing pages.
- Add blank pages.
- Delete pages (with confirmation modal).

### 7. Universal Undo / Redo & Keyboard Shortcuts
- Unified history stack tracking all additions, modifications, text formatting changes, link updates, and page operations.
- Keyboard shortcuts:
  - `Ctrl / ⌘ + Z`: Undo
  - `Ctrl / ⌘ + Shift + Z` or `Ctrl + Y`: Redo
  - `Ctrl / ⌘ + S`: Export & Download
  - `Delete / Backspace`: Delete selected object
  - `Escape`: Deselect active object
  - `Arrow Keys`: Nudge selected object by 1 pt (Shift + Arrow for 10 pt)

### 8. High-Fidelity PDF Export & Download
- Generates valid modified PDF Blobs using `pdf-lib`.
- Preserves original page order and vector resolution without screenshot flattening.
- Download triggered instantly via standard browser download (`document-edited.pdf`).

---

## 🧪 Automated Test Suite

Run the automated test suite with:
```bash
npm test
```

Tests verify:
1. Coordinate conversions between canvas pixels and bottom-left PDF points.
2. 90°, 180°, and 270° page rotation coordinate mappings.
3. Text baseline vertical calculation.
4. Hyperlink URL validation and normalization.
5. Standard font mapping and hex/rgb color conversion.
6. Sample PDF generation and page structure validation.
7. End-to-end PDF export with text replacements, clickable links, vector shapes, page rotations, and new blank pages.

---

## 📑 Known PDF Compatibility Limitations

1. **Arbitrary Embedded Fonts**: Standard PDF fonts (`Helvetica`, `Times-Roman`, `Courier`) are used for text replacements and new text boxes. When editing text with non-standard proprietary embedded fonts, PaperEdit matches the closest standard font style (sans-serif, serif, monospace) to ensure cross-reader compatibility without font corruption.
2. **Text Reflow across Paragraphs**: As in standard PDF editors (like Acrobat Pro), PDF text is stored as positioned glyph runs rather than a reflowing word processor document. PaperEdit uses the robust hybrid whiteout + vector replacement strategy to maintain pixel-perfect bounding box alignment without altering surrounding page graphics.
3. **Encrypted / Password-Protected PDFs**: PDFs encrypted with user/owner passwords must be decrypted prior to uploading.
