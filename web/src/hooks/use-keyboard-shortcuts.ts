"use client";
import { useEffect } from "react";

interface ShortcutHandlers {
  onSave?: () => void;
  onUndo?: () => void;
  onRun?: () => void;
  onToggleAgent?: () => void;
}

export function useKeyboardShortcuts(handlers: ShortcutHandlers) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key === "s") {
        e.preventDefault();
        handlers.onSave?.();
      }
      if (mod && e.key === "z" && !e.shiftKey) {
        // Don't prevent default — let native undo work in inputs
        handlers.onUndo?.();
      }
      if (mod && e.key === "Enter") {
        e.preventDefault();
        handlers.onRun?.();
      }
      if (mod && e.key === "j") {
        e.preventDefault();
        handlers.onToggleAgent?.();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handlers]);
}
