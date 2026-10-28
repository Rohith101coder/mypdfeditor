import { useEffect } from 'react';

/**
 * Global Keyboard shortcuts handler for PaperEdit
 */
export function useKeyboardShortcuts({
  onUndo,
  onRedo,
  onDeleteSelected,
  onDeselect,
  onSave,
  onNudge,
  canUndo,
  canRedo,
}) {
  useEffect(() => {
    function handleKeyDown(e) {
      // Check if user is typing inside an input, textarea, or contentEditable element
      const activeEl = document.activeElement;
      const isInputFocused =
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.isContentEditable);

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl/Cmd + Z: Undo
      if (modifier && !e.shiftKey && e.key.toLowerCase() === 'z') {
        if (!isInputFocused && canUndo) {
          e.preventDefault();
          onUndo?.();
        }
        return;
      }

      // Ctrl/Cmd + Shift + Z or Ctrl + Y: Redo
      if (
        (modifier && e.shiftKey && e.key.toLowerCase() === 'z') ||
        (modifier && !e.shiftKey && e.key.toLowerCase() === 'y')
      ) {
        if (!isInputFocused && canRedo) {
          e.preventDefault();
          onRedo?.();
        }
        return;
      }

      // Ctrl/Cmd + S: Save / Export
      if (modifier && e.key.toLowerCase() === 's') {
        e.preventDefault();
        onSave?.();
        return;
      }

      // Escape: Deselect / Cancel
      if (e.key === 'Escape') {
        onDeselect?.();
        return;
      }

      // Delete or Backspace: Delete selected object
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (!isInputFocused) {
          e.preventDefault();
          onDeleteSelected?.();
        }
        return;
      }

      // Arrow Keys: Nudge selected object
      if (!isInputFocused && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        let dx = 0;
        let dy = 0;
        if (e.key === 'ArrowUp') dy = -step;
        if (e.key === 'ArrowDown') dy = step;
        if (e.key === 'ArrowLeft') dx = -step;
        if (e.key === 'ArrowRight') dx = step;
        onNudge?.(dx, dy);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onUndo, onRedo, onDeleteSelected, onDeselect, onSave, onNudge, canUndo, canRedo]);
}
