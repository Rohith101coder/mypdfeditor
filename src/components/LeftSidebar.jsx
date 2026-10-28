import React, { useState } from 'react';
import {
  Layers,
  Type,
  Square,
  Image as ImageIcon,
  Link,
  Info,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import PageThumbnails from './PageThumbnails';
import TextTools from './TextTools';
import ShapeTools from './ShapeTools';
import ImageTools from './ImageTools';
import LinkTools from './LinkTools';
import DocumentInfo from './DocumentInfo';

export default function LeftSidebar({
  pdfDocProxy,
  pages,
  activePageIndex,
  onSelectPage,
  onRotatePage,
  onDuplicatePage,
  onDeletePage,
  onMovePage,
  onAddBlankPage,
  // Text tools props
  isEditTextMode,
  onToggleEditTextMode,
  onAddTextBox,
  // Shape tools props
  activeDrawingTool,
  onSelectDrawingTool,
  onAddShape,
  // Image props
  onAddImage,
  onAddStamp,
  // Link props
  links,
  onAddNewLink,
  onSelectLink,
  onDeleteLink,
  selectedLinkId,
  // Doc Info props
  filename,
  fileSize,
  metadata,
}) {
  const [activeTab, setActiveTab] = useState('thumbnails'); // 'thumbnails', 'text', 'shapes', 'images', 'links', 'info'
  const [isCollapsed, setIsCollapsed] = useState(false);

  const tabs = [
    { id: 'thumbnails', label: 'Pages', icon: Layers },
    { id: 'text', label: 'Text Tools', icon: Type },
    { id: 'shapes', label: 'Shapes & Draw', icon: Square },
    { id: 'images', label: 'Images & Stamps', icon: ImageIcon },
    { id: 'links', label: 'Hyperlinks', icon: Link },
    { id: 'info', label: 'Document Info', icon: Info },
  ];

  const handleTabClick = (tabId) => {
    if (activeTab === tabId && !isCollapsed) {
      // Toggle collapse if clicking the current active tab
      setIsCollapsed(true);
    } else {
      setActiveTab(tabId);
      setIsCollapsed(false);
    }
  };

  return (
    <aside className="left-sidebar">
      {/* Vertical Icon Tab Strip */}
      <div className="sidebar-tab-strip">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id && !isCollapsed;

          return (
            <button
              key={tab.id}
              type="button"
              className={`tab-strip-btn ${isActive ? 'active' : ''}`}
              onClick={() => handleTabClick(tab.id)}
              title={tab.label}
            >
              <Icon size={18} />
            </button>
          );
        })}

        <div style={{ marginTop: 'auto' }}>
          <button
            type="button"
            className="tab-strip-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </div>

      {/* Expanded Tab Drawer */}
      {!isCollapsed && (
        <div className="sidebar-drawer">
          <div className="sidebar-header">
            <span className="sidebar-title">
              {tabs.find((t) => t.id === activeTab)?.label}
            </span>
          </div>

          <div className="sidebar-body">
            {activeTab === 'thumbnails' && (
              <PageThumbnails
                pdfDocProxy={pdfDocProxy}
                pages={pages}
                activePageIndex={activePageIndex}
                onSelectPage={onSelectPage}
                onRotatePage={onRotatePage}
                onDuplicatePage={onDuplicatePage}
                onDeletePage={onDeletePage}
                onMovePage={onMovePage}
                onAddBlankPage={onAddBlankPage}
              />
            )}

            {activeTab === 'text' && (
              <TextTools
                isEditTextMode={isEditTextMode}
                onToggleEditTextMode={onToggleEditTextMode}
                onAddTextBox={onAddTextBox}
              />
            )}

            {activeTab === 'shapes' && (
              <ShapeTools
                activeDrawingTool={activeDrawingTool}
                onSelectTool={onSelectDrawingTool}
                onAddShape={onAddShape}
              />
            )}

            {activeTab === 'images' && (
              <ImageTools onAddImage={onAddImage} onAddStamp={onAddStamp} />
            )}

            {activeTab === 'links' && (
              <LinkTools
                links={links}
                onAddNewLink={onAddNewLink}
                onSelectLink={onSelectLink}
                onDeleteLink={onDeleteLink}
                selectedLinkId={selectedLinkId}
              />
            )}

            {activeTab === 'info' && (
              <DocumentInfo
                filename={filename}
                fileSize={fileSize}
                pageCount={pages.length}
                metadata={metadata}
              />
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
