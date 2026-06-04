import { useState, useCallback, useRef, useEffect } from "react";

type Clip = {
  id: string;
  type: "text" | "image" | "link";
  content: string;
  x: number;
  y: number;
  w: number;
  h: number;
  time: number;
};

function App() {
  const [clips, setClips] = useState<Clip[]>([]);
  const [dragging, setDragging] = useState<string | null>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const addClip = (text: string) => {
    const id = crypto.randomUUID();
    const x = 50 + Math.random() * 400;
    const y = 50 + Math.random() * 300;
    const clip: Clip = {
      id,
      type: text.startsWith("http") ? "link" : "text",
      content: text,
      x, y,
      w: 200,
      h: 80,
      time: Date.now(),
    };
    setClips((prev) => [clip, ...prev]);
  };

  useEffect(() => {
    const onPaste = (e: Event) => {
      e.preventDefault();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === "v") {
        navigator.clipboard.readText().then(addClip);
      }
    };
    window.addEventListener("paste", onPaste);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("paste", onPaste);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const handleMouseDown = (id: string, e: React.MouseEvent) => {
    const clip = clips.find((c) => c.id === id);
    if (!clip) return;
    setDragging(id);
    setOffset({ x: e.clientX - clip.x, y: e.clientY - clip.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setClips((prev) =>
      prev.map((c) =>
        c.id === dragging
          ? { ...c, x: e.clientX - offset.x, y: e.clientY - offset.y }
          : c
      )
    );
  };

  const handleMouseUp = () => setDragging(null);

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#1a1a2e", overflow: "hidden", position: "relative" }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    >
      <div style={{ position: "absolute", top: 16, left: "50%", transform: "translateX(-50%)", color: "#888", fontFamily: "monospace", zIndex: 10 }}>
        Clipboard Canvas — Ctrl+V to add clips
        <span style={{ marginLeft: 16, color: "#4ade80" }}>{clips.length} clips</span>
        <button onClick={() => navigator.clipboard.readText().then(addClip)}
          style={{ marginLeft: 16, background: "#4ade80", color: "#000", border: "none", padding: "4px 12px", borderRadius: 4, cursor: "pointer" }}
        >+ Add Paste</button>
      </div>

      <div ref={canvasRef} style={{ width: "100%", height: "100%", position: "relative" }}>
        {clips.map((clip) => (
          <div
            key={clip.id}
            onMouseDown={(e) => handleMouseDown(clip.id, e)}
            style={{
              position: "absolute",
              left: clip.x, top: clip.y,
              width: clip.w, height: clip.h,
              background: clip.type === "link" ? "#3b82f6" : "#272757",
              border: "2px solid #4ade80",
              borderRadius: 8,
              padding: 12,
              color: "#e0e0e0",
              fontSize: 13,
              fontFamily: "monospace",
              cursor: dragging === clip.id ? "grabbing" : "grab",
              overflow: "hidden",
              wordBreak: "break-all",
              userSelect: "none",
              boxShadow: dragging === clip.id ? "0 0 20px rgba(74,222,128,0.4)" : "0 4px 12px rgba(0,0,0,0.3)",
              transition: "box-shadow 0.15s",
              zIndex: dragging === clip.id ? 100 : 1,
            }}
          >
            <div style={{ fontSize: 10, color: "#888", marginBottom: 4 }}>
              {new Date(clip.time).toLocaleTimeString()} · {clip.type}
            </div>
            {clip.content.length > 100
              ? clip.content.slice(0, 100) + "..."
              : clip.content}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
