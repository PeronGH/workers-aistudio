import { useCallback, useEffect, useReducer, useRef } from "react";
import type React from "react";
import {
  DEFAULT_IMAGE_SETTINGS,
  ImageSettingsSchema,
  MAX_REFERENCES,
  STEPS_RANGES,
  type ImageGenerationEntry,
  type ImageModel,
  type ImageSettings
} from "../../shared/images";

export type ImageReference =
  | { kind: "local"; clientKey: string; file: File; preview: string }
  | { kind: "remote"; id: string };

export interface ImageDraft extends ImageSettings {
  prompt: string;
  references: ImageReference[];
}

type Action =
  | { type: "setPrompt"; text: string }
  | { type: "setModel"; model: ImageModel }
  | { type: "setNumeric"; field: "width" | "height" | "steps"; value: number }
  | { type: "addReferences"; items: ImageReference[] }
  | { type: "removeReference"; ref: ImageReference }
  | { type: "clearReferences" }
  | { type: "loadFromEntry"; entry: ImageGenerationEntry }
  | { type: "clearComposer" }
  | { type: "resetSettings" };

function reducer(state: ImageDraft, action: Action): ImageDraft {
  switch (action.type) {
    case "setPrompt":
      return { ...state, prompt: action.text };
    case "setModel": {
      if (action.model === state.model) return state;
      return {
        ...state,
        model: action.model,
        steps: STEPS_RANGES[action.model].default
      };
    }
    case "setNumeric":
      return { ...state, [action.field]: action.value };
    case "addReferences": {
      const remaining = MAX_REFERENCES - state.references.length;
      if (remaining <= 0) return state;
      return {
        ...state,
        references: [...state.references, ...action.items.slice(0, remaining)]
      };
    }
    case "removeReference":
      return {
        ...state,
        references: state.references.filter((r) => !sameRef(r, action.ref))
      };
    case "clearReferences":
      return { ...state, references: [] };
    case "loadFromEntry":
      return {
        model: action.entry.model,
        width: action.entry.width,
        height: action.entry.height,
        steps: action.entry.steps,
        prompt: action.entry.prompt,
        references: action.entry.referenceIds.map((id) => ({
          kind: "remote",
          id
        }))
      };
    case "clearComposer":
      return { ...state, prompt: "", references: [] };
    case "resetSettings":
      return {
        ...DEFAULT_IMAGE_SETTINGS,
        prompt: state.prompt,
        references: state.references
      };
  }
}

function sameRef(a: ImageReference, b: ImageReference): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "local" && b.kind === "local")
    return a.clientKey === b.clientKey;
  if (a.kind === "remote" && b.kind === "remote") return a.id === b.id;
  return false;
}

const STORAGE_KEY = "wai-studio:image-settings";

function init(): ImageDraft {
  let settings: ImageSettings = DEFAULT_IMAGE_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = ImageSettingsSchema.safeParse(JSON.parse(raw));
      if (parsed.success) settings = parsed.data;
    }
  } catch {
    // ignore corrupt storage
  }
  return { ...settings, prompt: "", references: [] };
}

export function useImageDraft() {
  const [draft, dispatch] = useReducer(reducer, undefined, init);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  // Persist only the settings subset; prompt and references are session-only.
  useEffect(() => {
    try {
      const settings: ImageSettings = {
        model: draft.model,
        width: draft.width,
        height: draft.height,
        steps: draft.steps
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // ignore quota
    }
  }, [draft.model, draft.width, draft.height, draft.steps]);

  // Revoke object URLs for local references that have left the draft.
  const liveUrlsRef = useRef<Map<string, string>>(new Map());
  useEffect(() => {
    const next = new Map<string, string>();
    for (const r of draft.references) {
      if (r.kind === "local") next.set(r.clientKey, r.preview);
    }
    for (const [k, url] of liveUrlsRef.current) {
      if (!next.has(k)) URL.revokeObjectURL(url);
    }
    liveUrlsRef.current = next;
  }, [draft.references]);

  useEffect(() => {
    return () => {
      for (const url of liveUrlsRef.current.values()) {
        URL.revokeObjectURL(url);
      }
    };
  }, []);

  const setPrompt = useCallback(
    (text: string) => dispatch({ type: "setPrompt", text }),
    []
  );
  const setModel = useCallback(
    (model: ImageModel) => dispatch({ type: "setModel", model }),
    []
  );
  const setWidth = useCallback(
    (value: number) => dispatch({ type: "setNumeric", field: "width", value }),
    []
  );
  const setHeight = useCallback(
    (value: number) => dispatch({ type: "setNumeric", field: "height", value }),
    []
  );
  const setSteps = useCallback(
    (value: number) => dispatch({ type: "setNumeric", field: "steps", value }),
    []
  );

  const addLocalFiles = useCallback((files: FileList | File[]) => {
    const imgs = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (imgs.length === 0) return;
    const remaining = MAX_REFERENCES - draftRef.current.references.length;
    if (remaining <= 0) return;
    const items: ImageReference[] = imgs.slice(0, remaining).map((file) => ({
      kind: "local",
      clientKey: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      file,
      preview: URL.createObjectURL(file)
    }));
    dispatch({ type: "addReferences", items });
  }, []);

  const addRemoteReference = useCallback((id: string): boolean => {
    const current = draftRef.current.references;
    if (current.length >= MAX_REFERENCES) return false;
    if (current.some((r) => r.kind === "remote" && r.id === id)) return false;
    dispatch({ type: "addReferences", items: [{ kind: "remote", id }] });
    return true;
  }, []);

  const removeReference = useCallback(
    (ref: ImageReference) => dispatch({ type: "removeReference", ref }),
    []
  );

  const clearReferences = useCallback(
    () => dispatch({ type: "clearReferences" }),
    []
  );

  const loadFromEntry = useCallback(
    (entry: ImageGenerationEntry) => dispatch({ type: "loadFromEntry", entry }),
    []
  );

  const clearComposer = useCallback(
    () => dispatch({ type: "clearComposer" }),
    []
  );

  const resetSettings = useCallback(
    () => dispatch({ type: "resetSettings" }),
    []
  );

  const onPaste = useCallback(
    (e: React.ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const files: File[] = [];
      for (const item of items) {
        if (item.kind === "file") {
          const f = item.getAsFile();
          if (f) files.push(f);
        }
      }
      if (files.length > 0) {
        e.preventDefault();
        addLocalFiles(files);
      }
    },
    [addLocalFiles]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer.files.length > 0) addLocalFiles(e.dataTransfer.files);
    },
    [addLocalFiles]
  );

  return {
    draft,
    setPrompt,
    setModel,
    setWidth,
    setHeight,
    setSteps,
    addLocalFiles,
    addRemoteReference,
    removeReference,
    clearReferences,
    loadFromEntry,
    clearComposer,
    resetSettings,
    onPaste,
    onDragOver,
    onDrop
  };
}
