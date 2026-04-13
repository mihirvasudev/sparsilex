"use client";
import { useState, useCallback } from "react";
import type { ColumnInfo, DatasetResponse } from "@/lib/types";
import { uploadDataset as apiUpload, getPreview } from "@/lib/api";

interface DatasetState {
  datasetId: string | null;
  filename: string | null;
  rows: number;
  columns: ColumnInfo[];
  preview: Record<string, unknown>[];
  isLoading: boolean;
  error: string | null;
}

export function useDataset() {
  const [state, setState] = useState<DatasetState>({
    datasetId: null,
    filename: null,
    rows: 0,
    columns: [],
    preview: [],
    isLoading: false,
    error: null,
  });

  const uploadFile = useCallback(async (file: File) => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const data: DatasetResponse = await apiUpload(file);
      setState({
        datasetId: data.dataset_id,
        filename: data.filename,
        rows: data.rows,
        columns: data.columns,
        preview: data.preview,
        isLoading: false,
        error: null,
      });
    } catch (err) {
      setState((s) => ({
        ...s,
        isLoading: false,
        error: err instanceof Error ? err.message : "Upload failed",
      }));
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      datasetId: null,
      filename: null,
      rows: 0,
      columns: [],
      preview: [],
      isLoading: false,
      error: null,
    });
  }, []);

  const refreshFromCleaningResult = useCallback((result: { rows: number; columns: ColumnInfo[]; preview: Record<string, unknown>[] }) => {
    setState((s) => ({
      ...s,
      rows: result.rows,
      columns: result.columns,
      preview: result.preview,
    }));
  }, []);

  const loadFromProject = useCallback((proj: {
    dataset_id: string;
    filename: string;
    rows: number;
    columns: ColumnInfo[];
    preview: Record<string, unknown>[];
  }) => {
    setState({
      datasetId: proj.dataset_id,
      filename: proj.filename,
      rows: proj.rows,
      columns: proj.columns,
      preview: proj.preview,
      isLoading: false,
      error: null,
    });
  }, []);

  return { ...state, uploadFile, reset, refreshFromCleaningResult, loadFromProject };
}
