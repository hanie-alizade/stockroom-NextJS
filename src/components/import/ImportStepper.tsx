import type { ReactElement } from "react";
import { CheckIcon } from "@/components/icons";
import { cn } from "@/helpers";
import type { ImportWizardStep } from "@/hooks";

export interface ImportStepperProps {
  currentStep: ImportWizardStep;
  className?: string;
}

interface StepItem {
  id: ImportWizardStep;
  label: string;
  number: number;
}

const STEPS: StepItem[] = [
  { id: "upload", label: "Upload", number: 1 },
  { id: "map", label: "Map columns", number: 2 },
  { id: "review", label: "Review", number: 3 },
  { id: "done", label: "Done", number: 4 },
];

const STEP_INDEX: Record<ImportWizardStep, number> = {
  upload: 0,
  map: 1,
  review: 2,
  done: 3,
};

export function ImportStepper({
  currentStep,
  className,
}: ImportStepperProps): ReactElement {
  const currentIndex = STEP_INDEX[currentStep] ?? 0;
  const isAllDone = currentStep === "done";

  return (
    <nav aria-label="Import progress" className={cn("w-full overflow-x-auto", className)}>
      <ol className="flex items-center gap-sm">
        {STEPS.map((step, index) => {
          const isDone = isAllDone || index < currentIndex;
          const isCurrent = !isAllDone && index === currentIndex;
          const isUpcoming = !isAllDone && index > currentIndex;
          const isCurrentLabel = isCurrent || (isAllDone && index === STEPS.length - 1);

          return (
            <li
              key={step.id}
              className="flex items-center"
              aria-current={isCurrentLabel ? "step" : undefined}
            >
              <div className="flex items-center gap-sm">
                {isDone && (
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-default text-text-on-accent">
                    <CheckIcon className="size-3.5" />
                  </span>
                )}
                {isCurrent && (
                  <span className="text-label flex size-6 shrink-0 items-center justify-center rounded-full bg-accent-default font-semibold text-text-on-accent">
                    {step.number}
                  </span>
                )}
                {isUpcoming && (
                  <span className="text-label border-border-default text-text-tertiary flex size-6 shrink-0 items-center justify-center rounded-full border">
                    {step.number}
                  </span>
                )}

                <span
                  className={cn(
                    "text-label whitespace-nowrap",
                    isCurrentLabel && "text-text-primary font-semibold",
                    isDone && !isCurrentLabel && "text-text-secondary font-medium",
                    isUpcoming && "text-text-tertiary",
                    // Under sm, show only the current step's label
                    !isCurrentLabel && "hidden sm:inline",
                  )}
                >
                  {step.label}
                </span>
              </div>

              {index < STEPS.length - 1 && (
                <div
                  aria-hidden="true"
                  className={cn(
                    "mx-sm h-[1px] w-10 shrink-0",
                    isDone ? "bg-accent-default" : "bg-border-default",
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
