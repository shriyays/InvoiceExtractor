import { useEffect, useState } from "react";

const STEPS = ["Reading invoice...", "Extracting data...", "Structuring results..."];

export default function LoadingState() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s + 1) % STEPS.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20">
      {/* Spinner */}
      <div className="relative h-16 w-16">
        <div className="absolute inset-0 rounded-full border-4 border-indigo-500/20" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 animate-spin" />
        <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-indigo-400/60 animate-spin [animation-duration:0.7s]" />
      </div>

      {/* Step text */}
      <div className="text-center">
        <p className="text-lg font-medium text-slate-200 transition-all duration-500">
          {STEPS[step]}
        </p>
        <p className="mt-1 text-sm text-slate-500">Using AI Vision API</p>
      </div>

      {/* Progress dots */}
      <div className="flex gap-2">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={`h-2 w-2 rounded-full transition-all duration-300 ${
              i === step ? "bg-indigo-500 scale-125" : "bg-slate-700"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
