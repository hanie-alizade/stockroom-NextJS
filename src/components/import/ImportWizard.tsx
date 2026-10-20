"use client";

import { useEffect, useRef, useState, type ReactElement } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useMutationCommitImport, useQueryMeta } from "@/apiHooks";
import { Banner } from "@/components/common";
import { queryKeys } from "@/constants";
import { downloadImportErrors, getErrorInfo } from "@/helpers";
import {
  buildImportFormData,
  generateIdempotencyKey,
  useImportWizard,
} from "@/hooks";
import { DoneStep } from "./DoneStep";
import { ImportStepper } from "./ImportStepper";
import { MapColumnsStep } from "./MapColumnsStep";
import { ReviewStep } from "./ReviewStep";
import { UploadStep } from "./UploadStep";
import { WizardFooter } from "./WizardFooter";

export interface ImportWizardProps {
  store?: string;
  className?: string;
}

export function ImportWizard({ store, className }: ImportWizardProps): ReactElement {
  const router = useRouter();
  const queryClient = useQueryClient();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const { data: meta } = useQueryMeta();
  const stores = meta?.stores ?? [];

  const {
    state,
    dispatch,
    mappedFieldToCol,
    unmappedColumns,
    missingRequiredFields,
    allRequiredMapped,
  } = useImportWizard(store ?? "mont-kiara");

  const commitMutation = useMutationCommitImport();
  const [mappingErrorMessage, setMappingErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [state.step]);

  const currentStore = stores.find((s) => s.id === state.storeId);
  const storeName = currentStore ? currentStore.name : state.storeId;

  const handleDownloadErrors = (): void => {
    if (!state.file || !state.validationResult) return;
    downloadImportErrors(
      state.file.name,
      state.file.headers,
      state.file.rows,
      state.validationResult.rows,
    );
  };

  const handleCommit = (): void => {
    if (!state.file) return;
    const key = state.idempotencyKey ?? generateIdempotencyKey();
    if (!state.idempotencyKey) {
      dispatch({ type: "ENSURE_IDEMPOTENCY_KEY", key });
    }
    const formData = buildImportFormData(state.file.file, state.storeId, state.mapping);
    commitMutation.mutate(
      { formData, idempotencyKey: key },
      {
        onSuccess: (result) => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.products.all });
          dispatch({ type: "SET_COMMIT_RESULT", result });
        },
        onError: (err) => {
          const errInfo = getErrorInfo(err);
          if (errInfo.status === 403 || errInfo.kind === "forbidden") {
            window.location.reload();
            return;
          }
          if (errInfo.fieldErrors.some((f) => f.field === "mapping")) {
            setMappingErrorMessage(errInfo.message);
            dispatch({ type: "GO_BACK" });
          }
        },
      },
    );
  };

  const handleCancel = (): void => {
    if (state.step === "upload") {
      router.push("/products");
    } else {
      commitMutation.reset();
      dispatch({ type: "RESET", initialStoreId: store });
    }
  };

  const handleBack = (): void => {
    dispatch({ type: "GO_BACK" });
  };

  const handleContinue = (): void => {
    if (state.step === "review") {
      handleCommit();
      return;
    }
    dispatch({ type: "GO_FORWARD" });
  };

  let canContinue = false;
  if (state.step === "upload") {
    canContinue = state.file !== null;
  } else if (state.step === "map") {
    canContinue = allRequiredMapped;
  } else if (state.step === "review") {
    canContinue = (state.validationResult?.summary.valid ?? 0) > 0;
  }

  return (
    <div className={className ?? "flex flex-1 flex-col min-h-[calc(100vh-100px)]"}>
      {/* Header */}
      {state.step !== "done" ? (
        <header>
          <h1
            ref={headingRef}
            tabIndex={-1}
            className="text-page-title text-text-primary outline-none"
          >
            Import products
          </h1>
          <p className="text-body text-text-secondary mt-1">
            Add new products or update existing ones from a CSV. You can check every row before anything is saved.
          </p>

          <div className="mt-4">
            <ImportStepper currentStep={state.step} />
          </div>
        </header>
      ) : (
        <header className="mb-6">
          <div className="mt-2">
            <ImportStepper currentStep={state.step} />
          </div>
        </header>
      )}

      {/* Step Content */}
      <div className="mt-5 flex-1 flex flex-col">
        {state.step === "upload" && (
          <UploadStep
            file={state.file}
            storeId={state.storeId}
            stores={stores}
            onFileLoaded={(file) => dispatch({ type: "SELECT_FILE", file })}
            onReplaceFile={() => dispatch({ type: "REPLACE_FILE" })}
            onStoreChange={(storeId) => dispatch({ type: "CHANGE_STORE", storeId })}
          />
        )}

        {state.step === "map" && state.file && (
          <div className="flex flex-col gap-4 flex-1">
            {mappingErrorMessage && (
              <Banner
                variant="danger"
                title="Invalid column mapping"
                description={mappingErrorMessage}
              />
            )}
            <MapColumnsStep
              file={state.file}
              storeName={storeName}
              mapping={state.mapping}
              mappedFieldToCol={mappedFieldToCol}
              unmappedColumns={unmappedColumns}
              missingRequiredFields={missingRequiredFields}
              allRequiredMapped={allRequiredMapped}
              onReplaceFile={() => dispatch({ type: "REPLACE_FILE" })}
              onMappingChange={(column, field) => {
                setMappingErrorMessage(null);
                dispatch({ type: "CHANGE_MAPPING", column, field });
              }}
            />
          </div>
        )}

        {state.step === "review" && state.file && (
          <ReviewStep
            file={state.file}
            storeId={state.storeId}
            storeName={storeName}
            mapping={state.mapping}
            validationResult={state.validationResult}
            onValidated={(result) =>
              dispatch({ type: "SET_VALIDATION_RESULT", result })
            }
            onReplaceFile={() => dispatch({ type: "REPLACE_FILE" })}
            isCommitting={commitMutation.isPending}
            commitError={commitMutation.error}
            onRetryCommit={handleCommit}
          />
        )}

        {state.step === "done" && state.commitResult && state.file && (
          <DoneStep
            result={state.commitResult}
            storeId={state.storeId}
            storeName={storeName}
            file={state.file}
            onImportAnother={() => {
              commitMutation.reset();
              dispatch({ type: "RESET", initialStoreId: store });
            }}
          />
        )}
      </div>

      {/* Wizard Footer */}
      <WizardFooter
        step={state.step}
        canContinue={canContinue}
        storeName={storeName}
        validRowCount={state.validationResult?.summary.valid ?? 0}
        hasErrors={(state.validationResult?.summary.invalid ?? 0) > 0}
        onCancel={handleCancel}
        onBack={handleBack}
        onContinue={handleContinue}
        onDownloadErrors={handleDownloadErrors}
        isSubmitting={commitMutation.isPending}
      />
    </div>
  );
}
