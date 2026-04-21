"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { CodeFile } from "@/components/code/file-tree";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const AUTOSAVE_DEBOUNCE_MS = 800;

interface BackendFileMeta {
  path: string;
  language: string;
  bytes: number;
  updated_at: number;
}

interface BackendFileContent extends BackendFileMeta {
  content: string;
}

/**
 * Sync a CodeWorkspace's file state with the backend file store.
 *
 * - On mount: fetch the file list. If empty, seed with a starter file.
 *   If non-empty, fetch each file's content.
 * - On user edit: debounce an autosave (PUT) for 800ms.
 * - On agent write (polled every 2s when tab is visible): re-fetch the
 *   file list and pick up new/updated files.
 * - On add/delete: immediate PUT/DELETE.
 */
export function useProjectFiles(sessionId: string | null) {
  const [files, setFiles] = useState<CodeFile[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  const saveTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const latestContentRef = useRef<Map<string, string>>(new Map());

  const inferLang = (path: string): CodeFile["language"] => {
    const ext = path.split(".").pop()?.toLowerCase();
    return ext === "py" ? "python"
         : ext === "sql" ? "sql"
         : (ext === "md" || ext === "rmd" || ext === "qmd") ? "markdown"
         : "r";
  };

  // Initial hydrate
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;

    (async () => {
      try {
        const res = await fetch(`${API}/api/session/${sessionId}/files`);
        if (!res.ok) {
          setLoaded(true);
          return;
        }
        const data = await res.json() as { files: BackendFileMeta[] };
        if (data.files.length === 0) {
          // Seed a starter file locally; it'll be autosaved when the user edits
          const starter: CodeFile = {
            id: "analysis",
            name: "analysis.R",
            language: "r",
            content: [
              "# Welcome to sparx Code mode.",
              "# Cmd/Ctrl+Enter runs a line or selection.",
              "# Cmd/Ctrl+Shift+Enter runs the whole file.",
              "",
              "x <- 42",
              "print(x * 2)",
              "",
            ].join("\n"),
            modified: false,
          };
          if (!cancelled) {
            setFiles([starter]);
            setActiveId(starter.id);
            setLoaded(true);
          }
          return;
        }
        // Fetch content for each file
        const results = await Promise.all(
          data.files.map(async (f) => {
            const r = await fetch(`${API}/api/session/${sessionId}/files/${f.path}`);
            return r.ok ? (await r.json()) as BackendFileContent : null;
          })
        );
        if (cancelled) return;
        const hydrated: CodeFile[] = results
          .filter((x): x is BackendFileContent => x !== null)
          .map((f) => ({
            id: f.path,
            name: f.path,
            language: inferLang(f.path) as CodeFile["language"],
            content: f.content,
            modified: false,
          }));
        setFiles(hydrated);
        setActiveId(hydrated[0]?.id ?? null);
        setLoaded(true);
      } catch {
        if (!cancelled) setLoaded(true);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  // Poll every 3s for backend changes (agent writes) when page is visible
  useEffect(() => {
    if (!sessionId || !loaded) return;
    let stopped = false;
    const tick = async () => {
      if (stopped || document.hidden) return;
      try {
        const res = await fetch(`${API}/api/session/${sessionId}/files`);
        if (!res.ok) return;
        const data = await res.json() as { files: BackendFileMeta[] };
        const currentById = new Map(files.map((f) => [f.id, f]));
        let changed = false;
        const updates: CodeFile[] = [];

        for (const meta of data.files) {
          const existing = currentById.get(meta.path);
          if (!existing || existing.content !== (latestContentRef.current.get(meta.path) ?? "")) {
            // Fetch full content to compare
            const r = await fetch(`${API}/api/session/${sessionId}/files/${meta.path}`);
            if (!r.ok) continue;
            const f = await r.json() as BackendFileContent;
            const localContent = latestContentRef.current.get(meta.path);
            if (existing && localContent === f.content) continue;  // no real change
            updates.push({
              id: f.path,
              name: f.path,
              language: inferLang(f.path) as CodeFile["language"],
              content: f.content,
              modified: false,
            });
            changed = true;
          }
        }
        if (changed && !stopped) {
          setFiles((prev) => {
            const byId = new Map(prev.map((p) => [p.id, p]));
            for (const u of updates) byId.set(u.id, u);
            return Array.from(byId.values());
          });
        }
      } catch {
        // swallow
      }
    };
    const intv = setInterval(tick, 3000);
    return () => { stopped = true; clearInterval(intv); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, loaded]);

  // Autosave for a given file
  const scheduleSave = useCallback((file: CodeFile) => {
    if (!sessionId) return;
    const existing = saveTimers.current.get(file.id);
    if (existing) clearTimeout(existing);
    const t = setTimeout(async () => {
      setSaving(true);
      try {
        await fetch(`${API}/api/session/${sessionId}/files/${file.name}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: file.content, language: file.language }),
        });
        latestContentRef.current.set(file.name, file.content);
        setFiles((fs) =>
          fs.map((f) => (f.id === file.id ? { ...f, modified: false } : f))
        );
      } catch {
        // leave as unsaved — visual modified indicator will remain
      } finally {
        setSaving(false);
      }
    }, AUTOSAVE_DEBOUNCE_MS);
    saveTimers.current.set(file.id, t);
  }, [sessionId]);

  const updateContent = useCallback((fileId: string, content: string) => {
    setFiles((fs) => {
      const updated = fs.map((f) =>
        f.id === fileId ? { ...f, content, modified: true } : f
      );
      const changed = updated.find((f) => f.id === fileId);
      if (changed) scheduleSave(changed);
      return updated;
    });
  }, [scheduleSave]);

  const addFile = useCallback(async (name: string, language: CodeFile["language"]) => {
    if (!sessionId) return;
    const newFile: CodeFile = {
      id: name,
      name,
      language,
      content: "",
      modified: false,
    };
    setFiles((fs) => [...fs, newFile]);
    setActiveId(newFile.id);
    // Create on server
    try {
      await fetch(`${API}/api/session/${sessionId}/files/${name}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "", language }),
      });
    } catch {}
  }, [sessionId]);

  const deleteFile = useCallback(async (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    if (!file) return;
    setFiles((fs) => fs.filter((f) => f.id !== fileId));
    if (activeId === fileId) {
      const next = files.find((f) => f.id !== fileId);
      setActiveId(next?.id ?? null);
    }
    if (sessionId) {
      try {
        await fetch(`${API}/api/session/${sessionId}/files/${file.name}`, {
          method: "DELETE",
        });
      } catch {}
    }
  }, [files, activeId, sessionId]);

  return {
    files,
    activeId,
    setActiveId,
    updateContent,
    addFile,
    deleteFile,
    loaded,
    saving,
  };
}
