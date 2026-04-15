"use client";

import { useEffect, useRef, useState } from "react";

interface SpeechBubbleProps {
  text: string;
  visible: boolean;
  isStreaming?: boolean;
  position?: "left" | "right";
  onDismiss?: () => void;
}

/**
 * Speech bubble that appears near the companion buddy.
 * Streams text character-by-character for a natural feel.
 */
export function SpeechBubble({
  text,
  visible,
  isStreaming = false,
  position = "left",
  onDismiss,
}: SpeechBubbleProps) {
  const [displayedText, setDisplayedText] = useState("");
  const prevTextRef = useRef("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Stream new characters as text grows
  useEffect(() => {
    if (!text) {
      setDisplayedText("");
      prevTextRef.current = "";
      return;
    }

    // If text grew (streaming), animate new chars
    if (text.length > prevTextRef.current.length && text.startsWith(prevTextRef.current)) {
      const newChars = text.slice(prevTextRef.current.length);
      let charIndex = 0;
      const baseText = prevTextRef.current;

      const timer = setInterval(() => {
        charIndex++;
        setDisplayedText(baseText + newChars.slice(0, charIndex));
        if (charIndex >= newChars.length) clearInterval(timer);
      }, 15); // 15ms per char = fast but visible

      prevTextRef.current = text;
      return () => clearInterval(timer);
    }

    // If text changed completely (new response), reset
    setDisplayedText(text);
    prevTextRef.current = text;
  }, [text]);

  // Auto-scroll to bottom as text streams
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayedText]);

  if (!visible) return null;

  return (
    <div
      className={`
        absolute bottom-full mb-3
        ${position === "left" ? "right-0 mr-2" : "left-0 ml-2"}
        animate-fade-in
      `}
    >
      <div className="relative max-w-[280px] min-w-[120px]">
        <div
          ref={scrollRef}
          className="bg-card/95 backdrop-blur-sm border border-border rounded-xl px-3 py-2.5 shadow-lg max-h-[200px] overflow-y-auto"
        >
          <p className="text-xs leading-relaxed text-foreground whitespace-pre-wrap">
            {displayedText}
            {isStreaming && (
              <span className="inline-block w-1.5 h-3 bg-primary/60 ml-0.5 animate-pulse rounded-sm" />
            )}
          </p>
        </div>
        {/* Tail pointing down toward buddy */}
        <div
          className={`
            absolute -bottom-1.5 w-3 h-3 bg-card/95 border-r border-b border-border
            transform rotate-45
            ${position === "left" ? "right-4" : "left-4"}
          `}
        />
        {/* Dismiss button */}
        {onDismiss && !isStreaming && (
          <button
            onClick={onDismiss}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-muted border border-border text-muted-foreground/50 hover:text-foreground text-[10px] flex items-center justify-center transition-colors"
          >
            x
          </button>
        )}
      </div>
    </div>
  );
}
