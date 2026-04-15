"use client";

import type { CompanionState } from "@/lib/types";

interface CompanionBuddyProps {
  state: CompanionState;
  onClick?: () => void;
  audioLevel?: number; // 0-1 for waveform
}

/**
 * The blue triangle buddy character — SparsileX's Clicky-inspired companion.
 * State-driven visuals: idle float, listening glow + waveform, processing spin, responding pulse.
 */
export function CompanionBuddy({ state, onClick, audioLevel = 0 }: CompanionBuddyProps) {
  const isListening = state === "listening";
  const isProcessing = state === "processing" || state === "tool_active";
  const isResponding = state === "responding" || state === "pointing";
  const isSleeping = state === "sleeping";

  return (
    <button
      onClick={onClick}
      className={`
        relative group cursor-pointer transition-all duration-300 select-none outline-none
        ${isSleeping ? "opacity-40 scale-75" : "opacity-100 scale-100"}
        ${isListening ? "companion-glow" : ""}
      `}
      aria-label="SparsileX companion buddy"
      title={
        isSleeping
          ? "Click to wake buddy"
          : isListening
            ? "Listening... click to stop"
            : "Click to talk"
      }
    >
      {/* Listening ring */}
      {isListening && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="rounded-full border-2 border-primary/40 transition-all duration-75"
            style={{
              width: `${44 + audioLevel * 28}px`,
              height: `${44 + audioLevel * 28}px`,
              opacity: 0.3 + audioLevel * 0.5,
            }}
          />
        </div>
      )}

      {/* Processing spinner ring */}
      {isProcessing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className="w-12 h-12 rounded-full border-2 border-primary/20 border-t-primary/60"
            style={{ animation: "companion-spin 1s linear infinite" }}
          />
        </div>
      )}

      {/* The triangle */}
      <div
        className={`
          companion-float
          ${isResponding ? "companion-glow" : ""}
        `}
        style={{
          animationPlayState: isListening || isProcessing ? "paused" : "running",
        }}
      >
        <svg
          width="36"
          height="36"
          viewBox="0 0 36 36"
          fill="none"
          className={`
            transition-transform duration-200
            ${!isSleeping ? "group-hover:scale-110" : ""}
          `}
          style={{ transform: "rotate(-35deg)" }}
        >
          {/* Triangle body */}
          <path
            d="M18 4L32 30H4L18 4Z"
            fill="#3380FF"
            stroke="#3380FF"
            strokeWidth="1.5"
            strokeLinejoin="round"
            className="transition-all duration-200"
          />
          {/* Eye (small circle) */}
          <circle
            cx="18"
            cy="18"
            r="2.5"
            fill="white"
            className={`
              transition-all duration-300
              ${isListening ? "opacity-0" : "opacity-100"}
            `}
          />
          {/* Listening state: open mouth */}
          {isListening && (
            <ellipse
              cx="18"
              cy="20"
              rx="3"
              ry="2.5"
              fill="white"
              opacity="0.9"
            />
          )}
        </svg>
      </div>

      {/* Status dot */}
      <div
        className={`
          absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-card transition-colors duration-200
          ${isListening ? "bg-red-400" : ""}
          ${isProcessing ? "bg-amber-400" : ""}
          ${isResponding ? "bg-green-400" : ""}
          ${state === "idle" ? "bg-primary/50" : ""}
          ${isSleeping ? "bg-muted-foreground/30" : ""}
        `}
      />
    </button>
  );
}
