import type { DatasetResponse, PreviewResponse, AnalysisResult } from "./types";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function uploadDataset(file: File): Promise<DatasetResponse> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API}/api/data/upload`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Upload failed: ${res.statusText}`);
  return res.json();
}

export async function getPreview(
  datasetId: string,
  offset = 0,
  limit = 100
): Promise<PreviewResponse> {
  const res = await fetch(
    `${API}/api/data/${datasetId}/preview?offset=${offset}&limit=${limit}`
  );
  if (!res.ok) throw new Error(`Preview failed: ${res.statusText}`);
  return res.json();
}

export async function runAnalysis(
  datasetId: string,
  testName: string,
  variables: Record<string, string>,
  options: Record<string, unknown> = {}
): Promise<AnalysisResult> {
  const res = await fetch(`${API}/api/analysis/run`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      dataset_id: datasetId,
      test_name: testName,
      variables,
      options,
    }),
  });
  if (!res.ok) throw new Error(`Analysis failed: ${res.statusText}`);
  return res.json();
}

export async function loadProject(file: File): Promise<{
  dataset_id: string;
  filename: string;
  rows: number;
  columns: import("./types").ColumnInfo[];
  preview: Record<string, unknown>[];
  analyses: AnalysisResult[];
}> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch(`${API}/api/project/load`, { method: "POST", body: form });
  if (!res.ok) throw new Error(`Load failed: ${res.statusText}`);
  return res.json();
}

export function streamAgentChat(
  datasetId: string,
  message: string,
  conversationId?: string
): EventSource {
  // Use fetch + ReadableStream for POST SSE
  const url = `${API}/api/agent/chat`;
  const body = JSON.stringify({
    dataset_id: datasetId,
    message,
    conversation_id: conversationId,
  });

  // We'll use a custom EventSource-like approach since native EventSource doesn't support POST
  // The component will handle this directly with fetch
  // This is a placeholder — actual streaming is in useAgent hook
  throw new Error("Use useAgent hook for streaming");
}

export async function fetchAgentChat(
  datasetId: string,
  message: string,
  conversationId?: string,
  onEvent: (event: Record<string, unknown>) => void = () => {},
  mode?: "menu" | "code"
): Promise<void> {
  const res = await fetch(`${API}/api/agent/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      dataset_id: datasetId,
      message,
      conversation_id: conversationId,
      mode,
    }),
  });

  if (!res.ok) throw new Error(`Agent chat failed: ${res.statusText}`);
  if (!res.body) throw new Error("No response body");

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const data = JSON.parse(line.slice(6));
          onEvent(data);
        } catch {
          // skip malformed lines
        }
      }
    }
  }
}
