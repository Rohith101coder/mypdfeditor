import React from 'react';
import {
  Square,
  Circle,
  Minus,
  MoveRight,
  PenTool,
  Highlighter,
  Eraser,
} from 'lucide-react';

export default function ShapeTools({
  activeDrawingTool,
  onSelectTool,
  onAddShape,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Freehand & Drawing Tools */}
      <div>
        <div className="tool-section-title">Freehand & Annotations</div>
        <div className="tool-grid">
          <button
            type="button"
            className={`tool-btn ${activeDrawingTool === 'pen' ? 'active' : ''}`}
            onClick={() => onSelectTool(activeDrawingTool === 'pen' ? 'select' : 'pen')}
          >
            <PenTool size={18} />
            <span>Draw Pen</span>
          </button>

          <button
            type="button"
            className={`tool-btn ${activeDrawingTool === 'highlighter' ? 'active' : ''}`}
            onClick={() =>
              onSelectTool(activeDrawingTool === 'highlighter' ? 'select' : 'highlighter')
            }
          >
            <Highlighter size={18} />
            <span>Highlight</span>
          </button>
        </div>
      </div>

      {/* Geometric Shapes */}
      <div>
        <div className="tool-section-title">Geometric Shapes</div>
        <div className="tool-grid">
          <button
            type="button"
            className="tool-btn"
            onClick={() => onAddShape('rect')}
          >
            <Square size={18} />
            <span>Rectangle</span>
          </button>

          <button
            type="button"
            className="tool-btn"
            onClick={() => onAddShape('circle')}
          >
            <Circle size={18} />
            <span>Circle</span>
          </button>

          <button
            type="button"
            className="tool-btn"
            onClick={() => onAddShape('line')}
          >
            <Minus size={18} />
            <span>Line</span>
          </button>

          <button
            type="button"
            className="tool-btn"
            onClick={() => onAddShape('arrow')}
          >
            <MoveRight size={18} />
            <span>Arrow</span>
          </button>
        </div>
      </div>

      {/* Quick Color Swatches */}
      <div>
        <div className="tool-section-title">Preset Colors</div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            '#000000',
            '#ef4444',
            '#3b82f6',
            '#10b981',
            '#f59e0b',
            '#8b5cf6',
            '#ffffff',
          ].map((color) => (
            <div
              key={color}
              className="color-swatch-circle"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
