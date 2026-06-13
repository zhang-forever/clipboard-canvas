import { createContext, useContext, useReducer, useState, useEffect, useCallback, useRef, type ReactNode } from "react";

export type ClipType = "text" | "link" | "code" | "image";

export interface Clip {
  id: string;
  type: ClipType;
  content: string;
  x: number;
  y: number;
  pinned: boolean;
  expanded: boolean;
  time: number;
}

/** Maximum content length per clip (100KB) */
export const MAX_CLIP_CONTENT_LENGTH = 100_000;
/** Maximum number of clips stored */
export const MAX_CLIP_COUNT = 500;

interface ClipState {
  clips: Clip[];
}

type ClipAction =
  | { type: "ADD_CLIP"; clip: Clip }
  | { type: "REMOVE_CLIP"; id: string }
  | { type: "MOVE_CLIP"; id: string; x: number; y: number }
  | { type: "PIN_CLIP"; id: string }
  | { type: "TOGGLE_EXPAND"; id: string }
  | { type: "CLEAR_ALL" }
  | { type: "LOAD_CLIPS"; clips: Clip[] };

function detectType(content: string): ClipType {
  const s = content.trim();
  if (/^https?:\/\/\S+\.(png|jpg|jpeg|gif|svg|webp|bmp|ico)(\?.*)?$/i.test(s)) return "image";
  if (/^https?:\/\//i.test(s)) return "link";
  if (/(^(function |const |let |var |import |export |class |interface |type |enum )|^[#.]include|^package |^use |^fn |^pub |^def |^<\w+[>\\s]|^```|^\/\*|^\/\/|[{}\(\);=<>])/m.test(s) && s.length < 2000) return "code";
  return "text";
}

function clipReducer(state: ClipState, action: ClipAction): ClipState {
  switch (action.type) {
    case "ADD_CLIP": {
      const exists = state.clips.some(
        (c) => c.content === action.clip.content && Date.now() - c.time < 5000
      );
      if (exists) return state;
      return { clips: [action.clip, ...state.clips].slice(0, MAX_CLIP_COUNT) };
    }
    case "REMOVE_CLIP":
      return { clips: state.clips.filter((c) => c.id !== action.id) };
    case "MOVE_CLIP":
      return {
        clips: state.clips.map((c) =>
          c.id === action.id ? { ...c, x: action.x, y: action.y } : c
        ),
      };
    case "PIN_CLIP":
      return {
        clips: state.clips.map((c) =>
          c.id === action.id ? { ...c, pinned: !c.pinned } : c
        ),
      };
    case "TOGGLE_EXPAND":
      return {
        clips: state.clips.map((c) =>
          c.id === action.id ? { ...c, expanded: !c.expanded } : c
        ),
      };
    case "CLEAR_ALL":
      return { clips: [] };
    case "LOAD_CLIPS":
      return { clips: action.clips };
    default:
      return state;
  }
}

const STORAGE_KEY = "clipboard-canvas-data";

function loadFromStorage(): Clip[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Validate and sanitize each clip
    return parsed.filter((c: unknown): c is Clip => {
      if (!c || typeof c !== "object") return false;
      const obj = c as Record<string, unknown>;
      return (
        typeof obj.id === "string" &&
        typeof obj.content === "string" &&
        typeof obj.x === "number" &&
        typeof obj.y === "number" &&
        typeof obj.time === "number" &&
        (obj.type === "text" || obj.type === "link" || obj.type === "code" || obj.type === "image")
      );
    }).slice(0, MAX_CLIP_COUNT);
  } catch {
    return [];
  }
}

function saveToStorage(clips: Clip[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clips));
  } catch {
    /* storage full */
  }
}

/** Snapshot of clips for undo/redo */
interface UndoEntry {
  clips: Clip[];
  description: string;
}

interface ClipContextValue {
  clips: Clip[];
  autoCapture: boolean;
  setAutoCapture: (v: boolean) => void;
  addClip: (content: string, x?: number, y?: number) => void;
  removeClip: (id: string) => void;
  moveClip: (id: string, x: number, y: number) => void;
  pinClip: (id: string) => void;
  toggleExpand: (id: string) => void;
  clearAll: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const ClipContext = createContext<ClipContextValue | null>(null);

export function ClipProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(clipReducer, { clips: loadFromStorage() });
  const [autoCapture, setAutoCapture] = useState(() => {
    return localStorage.getItem("clipboard-canvas-auto-capture") !== "false";
  });

  useEffect(() => {
    localStorage.setItem("clipboard-canvas-auto-capture", String(autoCapture));
  }, [autoCapture]);


  // Undo/redo stacks
  const undoStack = useRef<UndoEntry[]>([]);
  const redoStack = useRef<UndoEntry[]>([]);
  const lastSnapshot = useRef<string>("");

  // Take a snapshot before a mutating action (for undo)
  const snapshotForUndo = useCallback((description: string) => {
    const current = JSON.stringify(state.clips);
    if (current !== lastSnapshot.current) {
      undoStack.current.push({ clips: state.clips, description });
      lastSnapshot.current = current;
      redoStack.current = []; // clear redo on new action
      // Cap undo stack at 50
      if (undoStack.current.length > 50) {
        undoStack.current = undoStack.current.slice(-50);
      }
    }
  }, [state.clips]);

  useEffect(() => {
    saveToStorage(state.clips);
  }, [state.clips]);

  const addClip = useCallback((content: string, x?: number, y?: number) => {
    // Enforce size limit: truncate if too large
    const trimmed = content.length > MAX_CLIP_CONTENT_LENGTH
      ? content.slice(0, MAX_CLIP_CONTENT_LENGTH)
      : content;
    if (trimmed.length === 0) return;

    dispatch({
      type: "ADD_CLIP",
      clip: {
        id: crypto.randomUUID(),
        type: detectType(trimmed),
        content: trimmed,
        x: x ?? 100 + Math.random() * 500,
        y: y ?? 100 + Math.random() * 400,
        pinned: false,
        expanded: false,
        time: Date.now(),
      },
    });
  }, []);

  const removeClip = useCallback((id: string) => {
    snapshotForUndo("Remove clip");
    dispatch({ type: "REMOVE_CLIP", id });
  }, [snapshotForUndo]);

  const moveClip = useCallback((id: string, x: number, y: number) => dispatch({ type: "MOVE_CLIP", id, x, y }), []);

  const pinClip = useCallback((id: string) => dispatch({ type: "PIN_CLIP", id }), []);

  const toggleExpand = useCallback((id: string) => dispatch({ type: "TOGGLE_EXPAND", id }), []);

  const clearAll = useCallback(() => {
    snapshotForUndo("Clear all");
    dispatch({ type: "CLEAR_ALL" });
  }, [snapshotForUndo]);

  const undo = useCallback(() => {
    const entry = undoStack.current.pop();
    if (!entry) return;
    redoStack.current.push({ clips: state.clips, description: entry.description });
    dispatch({ type: "LOAD_CLIPS", clips: entry.clips });
  }, [state.clips]);

  const redo = useCallback(() => {
    const entry = redoStack.current.pop();
    if (!entry) return;
    undoStack.current.push({ clips: state.clips, description: entry.description });
    dispatch({ type: "LOAD_CLIPS", clips: entry.clips });
  }, [state.clips]);

  return (
    <ClipContext.Provider
      value={{
        clips: state.clips,
        autoCapture,
        setAutoCapture,
        addClip,
        removeClip,
        moveClip,
        pinClip,
        toggleExpand,
        clearAll,
        undo,
        redo,
        canUndo: undoStack.current.length > 0,
        canRedo: redoStack.current.length > 0,
      }}
    >
      {children}
    </ClipContext.Provider>
  );
}

export function useClips() {
  const ctx = useContext(ClipContext);
  if (!ctx) throw new Error("useClips must be used within ClipProvider");
  return ctx;
}

export interface ClipStats {
  total: number;
  oldestAge: number;
  types: Record<string, number>;
}

export function getClipStats(clips: Clip[]): ClipStats {
  const types: Record<string, number> = {};
  let oldest = Infinity;
  for (const c of clips) {
    types[c.type] = (types[c.type] || 0) + 1;
    if (c.time < oldest) oldest = c.time;
  }
  return {
    total: clips.length,
    oldestAge: clips.length > 0 ? Date.now() - oldest : 0,
    types,
  };
}

export function clipsToJSON(clips: Clip[]): string {
  return JSON.stringify(
    clips.map(({ id, type, content, time }) => ({ id, type, content, time })),
    null,
    2
  );
}
