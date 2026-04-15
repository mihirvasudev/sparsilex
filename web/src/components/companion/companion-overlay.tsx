"use client";

import { useState, useCallback } from "react";
import type { CompanionState } from "@/lib/types";
import { CompanionBuddy } from "./companion-buddy";
import { SpeechBubble } from "./speech-bubble";

interface CompanionOverlayProps {
  /** Current buddy state from useCompanion */
  state: CompanionState;
  /** Latest response text from the agent */
  responseText: string;
  /** Whether the agent is currently streaming text */
  isStreaming: boolean;
  /** Audio power level 0-1 for waveform visualization */
  audioLevel?: number;
  /** Active tool name (shown as badge) */
  activeTool?: string | null;
  /** Click handler for buddy (toggles listening, wakes from sleep, etc.) */
  onBuddyClick: () => void;
  /** Dismiss the speech bubble */
  onDismissBubble: () => void;
}

/**
 * Full-screen overlay (pointer-events: none) that hosts the companion buddy
 * and its speech bubble. Positioned fixed above the workspace.
 * Only the buddy and speech bubble are interactive.
 */
export function CompanionOverlay({
  state,
  responseText,
  isStreaming,
  audioLevel = 0,
  activeTool,
  onBuddyClick,
  onDismissBubble,
}: CompanionOverlayProps) {
  const [bubbleVisible, setBubbleVisible] = useState(false);

  // Show bubble when responding or when there's text
  const showBubble =
    state === "responding" ||
    state === "pointing" ||
    (responseText.length > 0 && state !== "sleeping" && state !== "idle" && bubbleVisible);

  const handleBuddyClick = useCallback(() => {
    if (state === "idle" && responseText) {
      // Toggle bubble visibility when idle with existing text
      setBubbleVisible((v) => !v);
    }
    onBuddyClick();
  }, [state, responseText, onBuddyClick]);

  const handleDismiss = useCallback(() => {
    setBubbleVisible(false);
    onDismissBubble();
  }, [onDismissBubble]);

  return (
    <div className="fixed inset-0 z-40 pointer-events-none">
      {/* Buddy sits in bottom-right of the workspace area (accounting for right panel) */}
      <div
        className="absolute pointer-events-auto"
        style={{
          bottom: "80px",
          right: "440px", // Clear the 420px right panel
        }}
      >
        {/* Speech bubble (above buddy) */}
        <SpeechBubble
          text={responseText}
          visible={showBubble || isStreaming}
          isStreaming={isStreaming}
          position="left"
          onDismiss={!isStreaming ? handleDismiss : undefined}
        />

        {/* Tool badge */}
        {activeTool && (state === "tool_active" || state === "processing") && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full mb-1 pointer-events-none">
            <div className="bg-primary/10 border border-primary/20 text-primary text-[9px] px-2 py-0.5 rounded-full whitespace-nowrap animate-fade-in">
              {activeTool}
            </div>
          </div>
        )}

        {/* The buddy */}
        <CompanionBuddy
          state={state}
          onClick={handleBuddyClick}
          audioLevel={audioLevel}
        />
      </div>
    </div>
  );
}
