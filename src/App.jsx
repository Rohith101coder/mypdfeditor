import React, { useState } from 'react';
import { usePDFDocument } from './hooks/usePDFDocument';
import UploadScreen from './components/UploadScreen';
import EditorLayout from './components/EditorLayout';
import './styles/global.css';
import './styles/toolbar.css';
import './styles/sidebar.css';
import './styles/properties.css';
import './styles/editor.css';

export default function App() {
  const {
    pdfBytes,
    pdfDocProxy,
    filename,
    fileSize,
    metadata,
    pages,
    setPages,
    activePageIndex,
    setActivePageIndex,
    isLoading,
    loadingMessage,
    error,
    loadFile,
    loadSamplePdf,
    closeDocument,
    addBlankPage,
    duplicatePage,
    deletePage,
    rotatePage,
    reorderPages,
  } = usePDFDocument();

  const [documentTitle, setDocumentTitle] = useState(filename);

  // Sync title when filename changes
  React.useEffect(() => {
    setDocumentTitle(filename);
  }, [filename]);

  if (!pdfBytes) {
    return (
      <UploadScreen
        onFileUpload={loadFile}
        onLoadSample={loadSamplePdf}
        isLoading={isLoading}
        loadingMessage={loadingMessage}
        error={error}
      />
    );
  }

  return (
    <EditorLayout
      pdfBytes={pdfBytes}
      pdfDocProxy={pdfDocProxy}
      filename={documentTitle}
      onFilenameChange={setDocumentTitle}
      fileSize={fileSize}
      metadata={metadata}
      pages={pages}
      setPages={setPages}
      activePageIndex={activePageIndex}
      setActivePageIndex={setActivePageIndex}
      onCloseDocument={closeDocument}
      onAddBlankPage={addBlankPage}
      onDuplicatePage={duplicatePage}
      onDeletePage={deletePage}
      onRotatePage={rotatePage}
      onMovePage={reorderPages}
    />
  );
}
