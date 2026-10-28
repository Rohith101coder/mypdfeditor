import { useState, useCallback, useRef } from 'react';

const MAX_HISTORY_STEPS = 40;

/**
 * Universal Undo/Redo history stack hook for PaperEdit
 */
export function useEditorHistory(initialState) {
  const [history, setHistory] = useState({
    past: [],
    present: initialState,
    future: [],
  });

  const isPerformingHistoryAction = useRef(false);

  /**
   * Resets the entire history stack with a new initial state
   */
  const resetHistory = useCallback((newState) => {
    setHistory({
      past: [],
      present: JSON.parse(JSON.stringify(newState)),
      future: [],
    });
  }, []);

  /**
   * Records a new state transition into history
   */
  const recordChange = useCallback((newState) => {
    if (isPerformingHistoryAction.current) return;

    setHistory((curr) => {
      // Don't record if state hasn't meaningfully changed
      const presentStr = JSON.stringify(curr.present);
      const newStr = JSON.stringify(newState);
      if (presentStr === newStr) return curr;

      const newPast = [...curr.past, curr.present].slice(-MAX_HISTORY_STEPS);
      return {
        past: newPast,
        present: JSON.parse(newStr),
        future: [],
      };
    });
  }, []);

  /**
   * Undoes the last action
   */
  const undo = useCallback((applyStateCallback) => {
    setHistory((curr) => {
      if (curr.past.length === 0) return curr;

      isPerformingHistoryAction.current = true;
      const previous = curr.past[curr.past.length - 1];
      const newPast = curr.past.slice(0, curr.past.length - 1);
      const newFuture = [curr.present, ...curr.future];

      if (applyStateCallback) {
        applyStateCallback(previous);
      }

      setTimeout(() => {
        isPerformingHistoryAction.current = false;
      }, 50);

      return {
        past: newPast,
        present: previous,
        future: newFuture,
      };
    });
  }, []);

  /**
   * Redoes the last undone action
   */
  const redo = useCallback((applyStateCallback) => {
    setHistory((curr) => {
      if (curr.future.length === 0) return curr;

      isPerformingHistoryAction.current = true;
      const next = curr.future[0];
      const newFuture = curr.future.slice(1);
      const newPast = [...curr.past, curr.present];

      if (applyStateCallback) {
        applyStateCallback(next);
      }

      setTimeout(() => {
        isPerformingHistoryAction.current = false;
      }, 50);

      return {
        past: newPast,
        present: next,
        future: newFuture,
      };
    });
  }, []);

  return {
    state: history.present,
    canUndo: history.past.length > 0,
    canRedo: history.future.length > 0,
    recordChange,
    resetHistory,
    undo,
    redo,
  };
}
