"use client";

import { useState, useEffect } from "react";

interface OnboardingStep {
  title: string;
  description: string;
  target?: string; // CSS selector to highlight
  position: "center" | "top-right" | "bottom-left" | "bottom-right";
}

const STEPS: OnboardingStep[] = [
  {
    title: "Your Data",
    description: "This is your data grid. Click any column header to see statistics, change types, or add labels. The data is ready for analysis.",
    position: "top-right",
  },
  {
    title: "Choose an Analysis",
    description: "Select an analysis from the ribbon menu. Try T-Tests > Independent Samples to compare scores between treatment and control groups.",
    position: "top-right",
  },
  {
    title: "Configure & Run",
    description: "Select your variables, adjust options, and click Run. Results appear below with statistics, plots, APA text, and reproducible code.",
    position: "center",
  },
  {
    title: "AI Agent",
    description: "Click the Agent button (or Cmd+J) to open the AI research assistant. Type a question like 'Compare scores between groups' and watch it work step by step.",
    position: "bottom-right",
  },
  {
    title: "Save & Export",
    description: "Cmd+S saves your project as a .sparx file. Results include APA text you can copy, R/Python code, and interactive plots you can export.",
    position: "top-right",
  },
];

interface OnboardingTourProps {
  active: boolean;
  onComplete: () => void;
}

export function OnboardingTour({ active, onComplete }: OnboardingTourProps) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (active) setStep(0);
  }, [active]);

  if (!active) return null;

  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  const positionClasses: Record<string, string> = {
    center: "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
    "top-right": "top-16 right-8",
    "bottom-left": "bottom-16 left-8",
    "bottom-right": "bottom-16 right-8",
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onComplete} />

      {/* Tour card */}
      <div className={`absolute ${positionClasses[current.position]} animate-slide-up`}>
        <div className="bg-card border border-border rounded-xl p-5 max-w-sm shadow-2xl">
          {/* Step indicator */}
          <div className="flex items-center gap-1 mb-3">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all ${
                  i === step ? "w-6 bg-primary" : i < step ? "w-3 bg-primary/40" : "w-3 bg-border"
                }`}
              />
            ))}
            <span className="ml-auto text-[10px] text-muted-foreground">
              {step + 1}/{STEPS.length}
            </span>
          </div>

          <h3 className="text-sm font-semibold mb-1">{current.title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{current.description}</p>

          <div className="flex items-center justify-between mt-4">
            <button
              onClick={onComplete}
              className="text-[11px] text-muted-foreground hover:text-foreground"
            >
              Skip tour
            </button>
            <div className="flex gap-2">
              {step > 0 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="text-[11px] text-muted-foreground hover:text-foreground px-2 py-1"
                >
                  Back
                </button>
              )}
              <button
                onClick={() => isLast ? onComplete() : setStep(step + 1)}
                className="text-[11px] bg-primary text-primary-foreground px-3 py-1 rounded-md hover:bg-primary/90 transition-colors"
              >
                {isLast ? "Get started" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
