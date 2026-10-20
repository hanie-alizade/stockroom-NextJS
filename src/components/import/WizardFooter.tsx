import type { ReactElement } from "react";
import { Button } from "@/components/ui/button";
import { DownloadIcon } from "@/components/icons";
import { cn } from "@/helpers";
import type { ImportWizardStep } from "@/hooks";

export interface WizardFooterProps {
  step: ImportWizardStep;
  canContinue: boolean;
  storeName: string;
  validRowCount?: number;
  hasErrors?: boolean;
  onCancel: () => void;
  onBack: () => void;
  onContinue: () => void;
  onDownloadErrors?: () => void;
  isSubmitting?: boolean;
  className?: string;
}

export function WizardFooter({
  step,
  canContinue,
  storeName,
  validRowCount = 0,
  hasErrors = false,
  onCancel,
  onBack,
  onContinue,
  onDownloadErrors,
  isSubmitting = false,
  className,
}: WizardFooterProps): ReactElement | null {
  if (step === "done") {
    return null;
  }

  return (
    <footer
      className={cn(
        "mt-auto flex flex-col-reverse items-stretch justify-between gap-3 pt-6 md:flex-row md:items-center md:gap-0",
        className,
      )}
    >
      {/* Left button */}
      <div className="flex items-center gap-2">
        {step === "upload" && (
          <Button
            type="button"
            variant="ghost"
            onClick={onCancel}
            className="w-full md:w-auto text-text-secondary hover:text-text-primary"
          >
            Cancel
          </Button>
        )}
        {(step === "map" || step === "review") && (
          <>
            <Button
              type="button"
              variant="secondary"
              disabled={isSubmitting}
              onClick={onBack}
              className="w-full md:w-auto"
            >
              Back
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={isSubmitting}
              onClick={onCancel}
              className="w-full md:w-auto text-text-secondary hover:text-text-primary"
            >
              Cancel
            </Button>
          </>
        )}
      </div>

      {/* Right controls */}
      <div className="flex flex-col-reverse items-stretch gap-3 md:flex-row md:items-center">
        {step === "upload" && (
          <>
            {!canContinue && (
              <span className="text-body-small text-text-tertiary text-center md:text-right">
                Choose a file to continue
              </span>
            )}
            <Button
              type="button"
              variant="default"
              disabled={!canContinue || isSubmitting}
              onClick={onContinue}
              className="w-full md:w-auto"
            >
              Continue
            </Button>
          </>
        )}

        {step === "map" && (
          <Button
            type="button"
            variant="default"
            disabled={!canContinue || isSubmitting}
            onClick={onContinue}
            className="w-full md:w-auto"
          >
            Continue to review
          </Button>
        )}

        {step === "review" && (
          <>
            {hasErrors && (
              <>
                <span className="text-body-small text-text-tertiary text-center md:text-right">
                  Rows with errors are skipped
                </span>
                {onDownloadErrors && (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isSubmitting}
                    onClick={onDownloadErrors}
                    className="w-full md:w-auto inline-flex items-center gap-1.5"
                  >
                    <DownloadIcon className="size-4 shrink-0" />
                    <span>Download errors (CSV)</span>
                  </Button>
                )}
              </>
            )}

            <Button
              type="button"
              variant="default"
              disabled={validRowCount === 0 || isSubmitting}
              onClick={onContinue}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <svg
                    className="size-4 animate-spin text-current"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Saving...</span>
                </>
              ) : (
                `Import ${validRowCount} ${validRowCount === 1 ? "row" : "rows"} into ${storeName}`
              )}
            </Button>
          </>
        )}
      </div>
    </footer>
  );
}

