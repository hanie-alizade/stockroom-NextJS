import { useReducer, useMemo } from "react";
import { IMPORT_REQUIRED_FIELDS } from "@/constants";
import { autoMatchColumns } from "@/helpers";
import type { ImportCommitResult, ImportField, ImportValidationResult } from "@/types";

export type ImportWizardStep = "upload" | "map" | "review" | "done";

export type ColumnMappingSource = "auto" | "manual";

export interface ColumnMappingEntry {
  field: ImportField | null;
  source: ColumnMappingSource;
}

export type WizardMapping = Record<string, ColumnMappingEntry>;

export interface WizardFileInfo {
  file: File;
  name: string;
  size: number;
  headers: string[];
  rows: Record<string, string>[];
  rowCount: number;
}

export interface ImportWizardState {
  step: ImportWizardStep;
  storeId: string;
  file: WizardFileInfo | null;
  mapping: WizardMapping;
  validationResult: ImportValidationResult | null;
  commitResult: ImportCommitResult | null;
  idempotencyKey: string | null;
}

export type ImportWizardAction =
  | { type: "SELECT_FILE"; file: WizardFileInfo }
  | { type: "REPLACE_FILE" }
  | { type: "CHANGE_STORE"; storeId: string }
  | { type: "CHANGE_MAPPING"; column: string; field: ImportField | null }
  | { type: "SET_STEP"; step: ImportWizardStep }
  | { type: "GO_BACK" }
  | { type: "GO_FORWARD" }
  | { type: "SET_VALIDATION_RESULT"; result: ImportValidationResult; key?: string }
  | { type: "ENSURE_IDEMPOTENCY_KEY"; key?: string }
  | { type: "SET_COMMIT_RESULT"; result: ImportCommitResult }
  | { type: "RESET"; initialStoreId?: string };

export function generateIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return "uuid-" + Math.random().toString(36).substring(2, 11);
}

export function initMappingFromHeaders(headers: readonly string[]): WizardMapping {
  const matched = autoMatchColumns(headers);
  const colToField = new Map<string, ImportField>();
  for (const [field, col] of Object.entries(matched)) {
    if (col) colToField.set(col, field as ImportField);
  }
  const mapping: WizardMapping = {};
  for (const col of headers) {
    const field = colToField.get(col) ?? null;
    mapping[col] = { field, source: field ? "auto" : "manual" };
  }
  return mapping;
}

export function importWizardReducer(
  state: ImportWizardState,
  action: ImportWizardAction,
): ImportWizardState {
  switch (action.type) {
    case "SELECT_FILE":
      return {
        ...state,
        file: action.file,
        mapping: initMappingFromHeaders(action.file.headers),
        validationResult: null,
        commitResult: null,
        idempotencyKey: null,
      };
    case "REPLACE_FILE":
      return {
        ...state,
        step: "upload",
        file: null,
        mapping: {},
        validationResult: null,
        commitResult: null,
        idempotencyKey: null,
      };
    case "CHANGE_STORE":
      if (state.storeId === action.storeId) return state;
      return {
        ...state,
        storeId: action.storeId,
        validationResult: null,
        commitResult: null,
        idempotencyKey: null,
      };
    case "CHANGE_MAPPING": {
      const current = state.mapping[action.column];
      if (current?.field === action.field) return state;
      return {
        ...state,
        mapping: {
          ...state.mapping,
          [action.column]: { field: action.field, source: "manual" },
        },
        validationResult: null,
        commitResult: null,
        idempotencyKey: null,
      };
    }
    case "GO_BACK":
      if (state.step === "review") return { ...state, step: "map" };
      if (state.step === "map") return { ...state, step: "upload" };
      return state;
    case "GO_FORWARD":
      if (state.step === "upload" && state.file) return { ...state, step: "map" };
      if (state.step === "map") return { ...state, step: "review" };
      return state;
    case "SET_STEP":
      return { ...state, step: action.step };
    case "SET_VALIDATION_RESULT":
      return {
        ...state,
        validationResult: action.result,
        idempotencyKey: state.idempotencyKey ?? (action.key ?? generateIdempotencyKey()),
      };
    case "ENSURE_IDEMPOTENCY_KEY":
      if (state.idempotencyKey) return state;
      return { ...state, idempotencyKey: action.key ?? generateIdempotencyKey() };
    case "SET_COMMIT_RESULT":
      return { ...state, step: "done", commitResult: action.result };
    case "RESET":
      return {
        step: "upload",
        storeId: action.initialStoreId ?? state.storeId,
        file: null,
        mapping: {},
        validationResult: null,
        commitResult: null,
        idempotencyKey: null,
      };
    default:
      return state;
  }
}

export function getPayloadMapping(
  mapping: WizardMapping,
): Partial<Record<ImportField, string>> {
  const result: Partial<Record<ImportField, string>> = {};
  for (const [col, entry] of Object.entries(mapping)) {
    if (entry.field) result[entry.field] = col;
  }
  return result;
}

export function buildImportFormData(
  file: File,
  storeId: string,
  mapping: WizardMapping,
): FormData {
  const form = new FormData();
  form.append("file", file);
  form.append("storeId", storeId);
  form.append("mapping", JSON.stringify(getPayloadMapping(mapping)));
  return form;
}

export function useImportWizard(initialStoreId: string = "mont-kiara") {
  const [state, dispatch] = useReducer(importWizardReducer, {
    step: "upload",
    storeId: initialStoreId,
    file: null,
    mapping: {},
    validationResult: null,
    commitResult: null,
    idempotencyKey: null,
  });

  const { mappedFieldToCol, unmappedColumns, missingRequiredFields } = useMemo(() => {
    const fieldMap = new Map<ImportField, string>();
    const unmapped: string[] = [];
    for (const [col, entry] of Object.entries(state.mapping)) {
      if (entry.field) fieldMap.set(entry.field, col);
      else unmapped.push(col);
    }
    const missing = IMPORT_REQUIRED_FIELDS.filter((f) => !fieldMap.has(f));
    return {
      mappedFieldToCol: fieldMap,
      unmappedColumns: unmapped,
      missingRequiredFields: missing,
    };
  }, [state.mapping]);

  const allRequiredMapped = missingRequiredFields.length === 0;

  return {
    state,
    dispatch,
    mappedFieldToCol,
    unmappedColumns,
    missingRequiredFields,
    allRequiredMapped,
  };
}
