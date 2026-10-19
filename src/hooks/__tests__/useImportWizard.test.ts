import { describe, expect, it } from "vitest";
import {
  buildImportFormData,
  getPayloadMapping,
  importWizardReducer,
  type ImportWizardState,
  type WizardFileInfo,
} from "../useImportWizard";
import { IMPORT_FIELD } from "@/constants";
import type { ImportValidationResult } from "@/types";

describe("importWizardReducer", () => {
  const initialState: ImportWizardState = {
    step: "upload",
    storeId: "mont-kiara",
    file: null,
    mapping: {},
    validationResult: null,
    commitResult: null,
    idempotencyKey: null,
  };

  const sampleFile: WizardFileInfo = {
    file: new File(["sku,name,category,qty,cost"], "test.csv", {
      type: "text/csv",
    }),
    name: "test.csv",
    size: 1024,
    headers: ["sku", "name", "category", "qty", "cost", "barcode"],
    rows: [{ sku: "KL-1001", name: "Arabica", category: "Coffee", qty: "10", cost: "50.00" }],
    rowCount: 1,
  };

  const sampleValidationResult: ImportValidationResult = {
    summary: {
      total: 1,
      valid: 1,
      invalid: 0,
      willCreate: 0,
      willUpdate: 1,
    },
    rows: [
      {
        rowNumber: 1,
        status: "valid",
        action: "update",
        values: {
          sku: "KL-1001",
          name: "Arabica",
          category: "Coffee",
          quantity: "10",
          unitCost: "50.00",
        },
        errors: [],
      },
    ],
  };

  it("handles SELECT_FILE: stores file, auto-matches columns and resets validationResult", () => {
    const state = importWizardReducer(initialState, {
      type: "SELECT_FILE",
      file: sampleFile,
    });

    expect(state.file).toBe(sampleFile);
    expect(state.mapping.sku).toEqual({ field: IMPORT_FIELD.SKU, source: "auto" });
    expect(state.mapping.name).toEqual({ field: IMPORT_FIELD.NAME, source: "auto" });
    expect(state.mapping.category).toEqual({
      field: IMPORT_FIELD.CATEGORY,
      source: "auto",
    });
    expect(state.mapping.qty).toEqual({
      field: IMPORT_FIELD.QUANTITY,
      source: "auto",
    });
    expect(state.mapping.cost).toEqual({
      field: IMPORT_FIELD.UNIT_COST,
      source: "auto",
    });
    expect(state.mapping.barcode).toEqual({ field: null, source: "manual" });
    expect(state.validationResult).toBeNull();
  });

  it("handles REPLACE_FILE: clears file and mapping, resets step to upload", () => {
    const fileState = importWizardReducer(initialState, {
      type: "SELECT_FILE",
      file: sampleFile,
    });
    const reviewState: ImportWizardState = {
      ...fileState,
      step: "review",
      validationResult: sampleValidationResult,
    };

    const state = importWizardReducer(reviewState, { type: "REPLACE_FILE" });
    expect(state.step).toBe("upload");
    expect(state.file).toBeNull();
    expect(state.mapping).toEqual({});
    expect(state.validationResult).toBeNull();
  });

  it("handles CHANGE_STORE: changes storeId and clears validationResult", () => {
    const withResult: ImportWizardState = {
      ...initialState,
      validationResult: sampleValidationResult,
    };

    const state = importWizardReducer(withResult, {
      type: "CHANGE_STORE",
      storeId: "subang",
    });

    expect(state.storeId).toBe("subang");
    expect(state.validationResult).toBeNull();
  });

  it("handles CHANGE_MAPPING: sets field and source manual, clears validationResult", () => {
    const fileState = importWizardReducer(initialState, {
      type: "SELECT_FILE",
      file: sampleFile,
    });
    const withResult: ImportWizardState = {
      ...fileState,
      validationResult: sampleValidationResult,
    };

    const state = importWizardReducer(withResult, {
      type: "CHANGE_MAPPING",
      column: "barcode",
      field: IMPORT_FIELD.SKU,
    });

    expect(state.mapping.barcode).toEqual({
      field: IMPORT_FIELD.SKU,
      source: "manual",
    });
    expect(state.validationResult).toBeNull();
  });

  it("handles GO_BACK and GO_FORWARD", () => {
    const fileState = importWizardReducer(initialState, {
      type: "SELECT_FILE",
      file: sampleFile,
    });

    const stepMap = importWizardReducer(fileState, { type: "GO_FORWARD" });
    expect(stepMap.step).toBe("map");

    const stepReview = importWizardReducer(stepMap, { type: "GO_FORWARD" });
    expect(stepReview.step).toBe("review");

    const backToMap = importWizardReducer(stepReview, { type: "GO_BACK" });
    expect(backToMap.step).toBe("map");

    const backToUpload = importWizardReducer(backToMap, { type: "GO_BACK" });
    expect(backToUpload.step).toBe("upload");
  });

  it("handles RESET: restores to initial state", () => {
    const modifiedState: ImportWizardState = {
      step: "review",
      storeId: "cheras",
      file: sampleFile,
      mapping: { col: { field: IMPORT_FIELD.NAME, source: "manual" } },
      validationResult: sampleValidationResult,
      commitResult: null,
      idempotencyKey: "some-key",
    };

    const state = importWizardReducer(modifiedState, {
      type: "RESET",
      initialStoreId: "damansara",
    });

    expect(state.step).toBe("upload");
    expect(state.storeId).toBe("damansara");
    expect(state.file).toBeNull();
    expect(state.mapping).toEqual({});
    expect(state.validationResult).toBeNull();
  });

  it("getPayloadMapping and buildImportFormData format payload properly", () => {
    const mapping = {
      "Item code": { field: IMPORT_FIELD.SKU, source: "auto" as const },
      Description: { field: IMPORT_FIELD.NAME, source: "auto" as const },
      Group: { field: IMPORT_FIELD.CATEGORY, source: "manual" as const },
      Qty: { field: IMPORT_FIELD.QUANTITY, source: "auto" as const },
      Cost: { field: IMPORT_FIELD.UNIT_COST, source: "auto" as const },
      Barcode: { field: null, source: "manual" as const },
    };

    const payload = getPayloadMapping(mapping);
    expect(payload).toEqual({
      sku: "Item code",
      name: "Description",
      category: "Group",
      quantity: "Qty",
      unitCost: "Cost",
    });

    const dummyFile = new File(["dummy"], "dummy.csv");
    const formData = buildImportFormData(dummyFile, "mont-kiara", mapping);

    expect(formData.get("file")).toBe(dummyFile);
    expect(formData.get("storeId")).toBe("mont-kiara");
    expect(JSON.parse(formData.get("mapping") as string)).toEqual(payload);
  });

  describe("idempotencyKey lifecycle and commit", () => {
    it("creates key once when setting validation result and preserves it on subsequent results", () => {
      const step1 = importWizardReducer(initialState, {
        type: "SET_VALIDATION_RESULT",
        result: sampleValidationResult,
        key: "key-123",
      });
      expect(step1.idempotencyKey).toBe("key-123");
      expect(step1.validationResult).toBe(sampleValidationResult);

      // Re-running or setting new validation result preserves existing key
      const step2 = importWizardReducer(step1, {
        type: "SET_VALIDATION_RESULT",
        result: sampleValidationResult,
        key: "key-456",
      });
      expect(step2.idempotencyKey).toBe("key-123");
    });

    it("clears idempotencyKey when file, store or mapping changes", () => {
      const withKey: ImportWizardState = {
        ...initialState,
        idempotencyKey: "key-123",
        validationResult: sampleValidationResult,
      };

      // Change store clears key
      const changedStore = importWizardReducer(withKey, {
        type: "CHANGE_STORE",
        storeId: "damansara",
      });
      expect(changedStore.idempotencyKey).toBeNull();
      expect(changedStore.validationResult).toBeNull();

      // Change mapping clears key
      const withKey2: ImportWizardState = {
        ...initialState,
        mapping: { col: { field: IMPORT_FIELD.SKU, source: "auto" } },
        idempotencyKey: "key-123",
        validationResult: sampleValidationResult,
      };
      const changedMapping = importWizardReducer(withKey2, {
        type: "CHANGE_MAPPING",
        column: "col",
        field: IMPORT_FIELD.NAME,
      });
      expect(changedMapping.idempotencyKey).toBeNull();

      // Select file clears key
      const changedFile = importWizardReducer(withKey, {
        type: "SELECT_FILE",
        file: sampleFile,
      });
      expect(changedFile.idempotencyKey).toBeNull();
    });

    it("handles SET_COMMIT_RESULT: sets step to done and stores commitResult", () => {
      const commitRes = {
        created: 10,
        updated: 5,
        unchanged: 2,
        skipped: 1,
        skippedRows: [],
      };
      const state = importWizardReducer(initialState, {
        type: "SET_COMMIT_RESULT",
        result: commitRes,
      });
      expect(state.step).toBe("done");
      expect(state.commitResult).toEqual(commitRes);
    });
  });
});

