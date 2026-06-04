import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useClips, getClipStats, clipsToJSON, type Clip, type ClipType } from "./store";
import { useCanvasTransform } from "./canvas";

const TYPE_COLORS: Record<ClipType, string> = {
  text: "#3b82f6",
  link: "#22c55e",
  code: "#eab308",
  image: "#ec4899",
};

const TYPE_ICONS: Record<ClipType, string> = {
  text: "T",
  link: "L",
  code: "C",
  image: "I",
};

const TYPE_LABELS: Record<ClipType, string> = {
  text: "Text",
  link: "Link",
  code: "Code",
  image: "Image",
};

function ageLabel(ms: number): string {
  if (ms < 60000) return `${Math.floor(ms / 1000)}s ago`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
  if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
  return `${Math.floor(ms / 86400000)}d ago`;
}

interface ContextMenuState {
  clipId: string;
  x: number;
  y: number;
}

function App() {
  const { clips, addClip, removeClip, moveClip, pinClip, toggleExpand, clearAll } = useClips();
  const { transform, handleWheel, screenToWorld, resetView } = useCanvasTransform();
  const [search, setSearch] = useState("");
  const [gridView, setGridView] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<ContextMenuState | null>(null);
  const [dragClip, setDragClip] = useState<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const lastClipboard = useRef("");
  const canvasRef = useRef<HTMLDivElement>(null);
  const [entering, setEntering] = useState<Set<string>>(new Set());
  const [exiting, setExiting] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    if (!search.trim()) return clips;
    const q = search.toLowerCase();
    return clips.filter((c) => c.content.toLowerCase().includes(q));
  }, [clips, search]);

  const stats = useMemo(() => getClipStats(clips), [clips]);

  const clipBounds = useMemo(() => {
    if (clips.length === 0) return { minX: 0, minY: 0, maxX: 1, maxY: 1 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const c of clips) {
      if (c.x < minX) minX = c.x;
      if (c.y < minY) minY = c.y;
      if (c.x + 260 > maxX) maxX = c.x + 260;
      if (c.y + 90 > maxY) maxY = c.y + 90;
    }
    const pad = 40;
    return { minX: minX - pad, minY: minY - pad, maxX: maxX + pad, maxY: maxY + pad };
  }, [clips]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        if (!(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
          e.preventDefault();
          setShowShortcuts((v) => !v);
        }
      }
      if (e.key === "Escape") {
        setCtxMenu(null);
        if (showShortcuts) setShowShortcuts(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showShortcuts]);

  useEffect(() => {
    const poll = setInterval(async () => {
      try {
        const text = await navigator.clipboard.readText();
        if (text && text !== lastClipboard.current) {
          lastClipboard.current = text;
          const id = crypto.randomUUID();
          setEntering((p) => new Set(p).add(id));
          setTimeout(() => setEntering((p) => { const n = new Set(p); n.delete(id); return n; }), 400);
          addClip(text);
        }
      } catch {
        /* clipboard access denied - app is likely in background */
      }
    }, 1000);
    return () => clearInterval(poll);
  }, [addClip]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!dragClip || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const world = screenToWorld(sx, sy);
      moveClip(dragClip, world.x - dragOffset.current.x, world.y - dragOffset.current.y);
    };
    const onMouseUp = () => {
      if (!dragClip) return;
      setDragClip(null);
    };
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [dragClip, screenToWorld, moveClip]);

  const startDrag = useCallback(
    (clip: Clip, e: React.MouseEvent) => {
      if (clip.pinned) return;
      e.preventDefault();
      e.stopPropagation();
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const world = screenToWorld(sx, sy);
      dragOffset.current = { x: world.x - clip.x, y: world.y - clip.y };
      setDragClip(clip.id);
    },
    [screenToWorld]
  );

  const handleContextMenu = useCallback((clip: Clip, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCtxMenu({ clipId: clip.id, x: e.clientX, y: e.clientY });
  }, []);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
    setCtxMenu(null);
  };

  const removeWithAnim = (id: string) => {
    setExiting((p) => new Set(p).add(id));
    setTimeout(() => {
      removeClip(id);
      setExiting((p) => { const n = new Set(p); n.delete(id); return n; });
    }, 300);
    setCtxMenu(null);
  };

  const handleExportJSON = () => {
    const json = clipsToJSON(clips);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `clipboard-canvas-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderMinimap = () => {
    const MM_W = 160, MM_H = 100;
    const bw = clipBounds.maxX - clipBounds.minX || 1;
    const bh = clipBounds.maxY - clipBounds.minY || 1;
    const sx = MM_W / bw;
    const sy = MM_H / bh;
    const scale = Math.min(sx, sy);
    const offsetX = (MM_W - bw * scale) / 2;
    const offsetY = (MM_H - bh * scale) / 2;

    const vpW = (window.innerWidth / transform.scale);
    const vpH = (window.innerHeight / transform.scale);
    const vpX = -transform.x / transform.scale;
    const vpY = -transform.y / transform.scale;

    return (
      <svg
        width={MM_W}
        height={MM_H}
        style={{ background: "rgba(0,0,0,0.4)", borderRadius: 6, border: "1px solid #333" }}
      >
        {clips.map((c) => (
          <rect
            key={c.id}
            x={offsetX + (c.x - clipBounds.minX) * scale}
            y={offsetY + (c.y - clipBounds.minY) * scale}
            width={Math.max(3, 260 * scale)}
            height={Math.max(3, 90 * scale)}
            fill={TYPE_COLORS[c.type]}
            opacity={0.6}
            rx={2}
          />
        ))}
        <rect
          x={offsetX + (vpX - clipBounds.minX) * scale}
          y={offsetY + (vpY - clipBounds.minY) * scale}
          width={vpW * scale}
          height={vpH * scale}
          fill="none"
          stroke="#fff"
          strokeWidth={1}
          opacity={0.5}
          rx={1}
        />
      </svg>
    );
  };

  const renderClipCard = (clip: Clip) => {
    const color = TYPE_COLORS[clip.type];
    const isDragging = dragClip === clip.id;
    const isEntering = entering.has(clip.id);
    const isExiting = exiting.has(clip.id);
    const maxPreview = clip.expanded ? 2000 : 140;

    return (
      <div
        key={clip.id}
        onMouseDown={(e) => startDrag(clip, e)}
        onContextMenu={(e) => handleContextMenu(clip, e)}
        onDoubleClick={() => toggleExpand(clip.id)}
        style={{
          position: "absolute",
          left: clip.x,
          top: clip.y,
          width: 260,
          minHeight: 80,
          background: "rgba(22,22,36,0.95)",
          backdropFilter: "blur(12px)",
          border: `2px solid ${clip.pinned ? "#fff" : color}`,
          borderLeft: `4px solid ${color}`,
          borderRadius: 10,
          padding: "12px 14px",
          cursor: clip.pinned ? "default" : isDragging ? "grabbing" : "grab",
          userSelect: "none",
          boxShadow: isDragging
            ? `0 0 24px ${color}44, 0 8px 32px rgba(0,0,0,0.5)`
            : clip.pinned
            ? "0 2px 12px rgba(255,255,255,0.08), 0 4px 16px rgba(0,0,0,0.3)"
            : "0 2px 8px rgba(0,0,0,0.3)",
          zIndex: isDragging ? 1000 : clip.pinned ? 100 : 10,
          transition: isDragging ? "none" : "box-shadow 0.2s, transform 0.15s",
          opacity: isExiting ? 0 : isEntering ? 0 : 1,
          transform: isEntering ? "scale(0.8)" : isExiting ? "scale(0.9)" : "scale(1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span
            style={{
              width: 22,
              height: 22,
              borderRadius: 6,
              background: `${color}22`,
              border: `1px solid ${color}44`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 11,
              fontWeight: 700,
              color,
            }}
          >
            {TYPE_ICONS[clip.type]}
          </span>
          <span style={{ fontSize: 11, color: "#666", flex: 1 }}>
            {TYPE_LABELS[clip.type]}
          </span>
          <span style={{ fontSize: 10, color: "#555" }}>
            {ageLabel(Date.now() - clip.time)}
          </span>
          {clip.pinned && (
            <span style={{ fontSize: 10, color: "#fff" }} title="Pinned">&#x1f4cc;</span>
          )}
        </div>
        <div
          style={{
            fontSize: 12,
            lineHeight: 1.5,
            color: "#ccc",
            wordBreak: "break-all",
            whiteSpace: "pre-wrap",
            maxHeight: clip.expanded ? "none" : 40,
            overflow: "hidden",
            fontFamily: clip.type === "code" ? "'Fira Code', 'Cascadia Code', monospace" : "inherit",
            background: clip.type === "code" ? "rgba(0,0,0,0.3)" : "transparent",
            padding: clip.type === "code" ? "4px 6px" : 0,
            borderRadius: clip.type === "code" ? 4 : 0,
            position: "relative",
          }}
        >
          {clip.content.slice(0, maxPreview)}
          {clip.content.length > maxPreview && !clip.expanded && (
            <span style={{ color: "#555", marginLeft: 4 }}>…</span>
          )}
          {clip.expanded && clip.content.length > maxPreview && (
            <div
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: 24,
                background: "linear-gradient(transparent, rgba(22,22,36,0.95))",
              }}
            />
          )}
        </div>
        {clip.expanded && clip.content.length > maxPreview && (
          <div
            onClick={() => toggleExpand(clip.id)}
            style={{ fontSize: 10, color: "#555", marginTop: 2, cursor: "pointer", textAlign: "center" }}
          >
            collapse
          </div>
        )}
        {!clip.expanded && clip.content.length > maxPreview && (
          <div
            onClick={(e) => { e.stopPropagation(); toggleExpand(clip.id); }}
            style={{ fontSize: 10, color: color, marginTop: 2, cursor: "pointer", textAlign: "center" }}
          >
            expand
          </div>
        )}
      </div>
    );
  };

  const renderGridCard = (clip: Clip) => {
    const color = TYPE_COLORS[clip.type];
    return (
      <div
        key={clip.id}
        onDoubleClick={() => toggleExpand(clip.id)}
        style={{
          background: "rgba(22,22,36,0.95)",
          border: `1px solid #2a2a3a`,
          borderLeft: `3px solid ${color}`,
          borderRadius: 8,
          padding: "8px 12px",
          fontSize: 12,
          display: "flex",
          alignItems: "center",
          gap: 10,
          transition: "background 0.15s",
        }}
      >
        <span
          style={{
            width: 20,
            height: 20,
            borderRadius: 5,
            background: `${color}22`,
            border: `1px solid ${color}44`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            fontWeight: 700,
            color,
            flexShrink: 0,
          }}
        >
          {TYPE_ICONS[clip.type]}
        </span>
        <span style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#aaa" }}>
          {clip.content.slice(0, clip.expanded ? 9999 : 80).replace(/\n/g, " ")}
        </span>
        <span style={{ fontSize: 10, color: "#555", whiteSpace: "nowrap" }}>{ageLabel(Date.now() - clip.time)}</span>
        <button
          onClick={() => copyToClipboard(clip.content)}
          title="Copy"
          style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 14, padding: "2px 4px" }}
        >
          &#x2398;
        </button>
        <button
          onClick={() => removeWithAnim(clip.id)}
          title="Delete"
          style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 14, padding: "2px 4px" }}
        >
          &#x2715;
        </button>
      </div>
    );
  };

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#0a0a14", display: "flex", flexDirection: "column", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", overflow: "hidden" }}>
      {/* ---- TOOLBAR ---- */}
      <div
        style={{
          height: 44,
          background: "rgba(14,14,24,0.95)",
          backdropFilter: "blur(8px)",
          borderBottom: "1px solid #1e1e30",
          display: "flex",
          alignItems: "center",
          padding: "0 14px",
          gap: 10,
          zIndex: 2000,
          flexShrink: 0,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 14, color: "#e0e0e0", letterSpacing: "-0.3px" }}>Clipboard Canvas</span>

        <div style={{ position: "relative", flex: 1, maxWidth: 320 }}>
          <input
            type="text"
            placeholder="Search clips..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              background: "#12121e",
              border: "1px solid #2a2a3a",
              borderRadius: 6,
              color: "#ccc",
              padding: "5px 10px 5px 28px",
              fontSize: 12,
              outline: "none",
            }}
            onKeyDown={(e) => e.stopPropagation()}
          />
          <span style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", fontSize: 12, color: "#555" }}>
            &#x1F50D;
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#666" }}>
          <span title="Total clips">{stats.total} clips</span>
          {stats.total > 0 && (
            <span title="Oldest clip">
              | oldest: {ageLabel(stats.oldestAge)}
            </span>
          )}
          {Object.entries(stats.types).map(([k, v]) => (
            <span key={k} style={{ color: TYPE_COLORS[k as ClipType] }} title={`${k}: ${v}`}>
              {k}:{v}
            </span>
          ))}
        </div>

        <button
          onClick={() => setGridView(!gridView)}
          title={gridView ? "Switch to Canvas" : "Switch to Grid"}
          style={{
            background: "#1e1e30",
            border: "1px solid #333",
            borderRadius: 6,
            color: "#aaa",
            padding: "4px 10px",
            cursor: "pointer",
            fontSize: 12,
          }}
        >
          {gridView ? "Canvas" : "Grid"}
        </button>

        <button
          onClick={() => resetView()}
          title="Reset View"
          style={{ background: "#1e1e30", border: "1px solid #333", borderRadius: 6, color: "#aaa", padding: "4px 10px", cursor: "pointer", fontSize: 12 }}
        >
          Reset
        </button>

        <button
          onClick={handleExportJSON}
          title="Export as JSON"
          style={{ background: "#1e1e30", border: "1px solid #333", borderRadius: 6, color: "#aaa", padding: "4px 10px", cursor: "pointer", fontSize: 12 }}
        >
          Export
        </button>

        <button
          onClick={() => { if (confirm("Clear all clips?")) clearAll(); }}
          title="Clear all clips"
          style={{ background: "#2a1515", border: "1px solid #442222", borderRadius: 6, color: "#e55", padding: "4px 10px", cursor: "pointer", fontSize: 12 }}
        >
          Clear
        </button>

        <button
          onClick={() => setShowShortcuts(true)}
          title="Keyboard Shortcuts"
          style={{ background: "#1e1e30", border: "1px solid #333", borderRadius: 6, color: "#aaa", padding: "4px 8px", cursor: "pointer", fontSize: 12, fontFamily: "monospace" }}
        >
          ?
        </button>
      </div>

      {/* ---- MAIN AREA ---- */}
      {gridView ? (
        /* ---- GRID VIEW ---- */
        <div
          style={{
            flex: 1,
            overflow: "auto",
            padding: "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
          onClick={() => setCtxMenu(null)}
        >
          {filtered.length === 0 && (
            <div style={{ textAlign: "center", color: "#444", marginTop: 60, fontSize: 14 }}>
              {search ? "No clips match search." : "No clips yet. Copy something (Ctrl+C) to start."}
            </div>
          )}
          {filtered.map(renderGridCard)}
        </div>
      ) : (
        /* ---- CANVAS VIEW ---- */
        <div
          ref={canvasRef}
          onWheel={handleWheel}
          onClick={() => setCtxMenu(null)}
          style={{
            flex: 1,
            overflow: "hidden",
            position: "relative",
            cursor: dragClip ? "grabbing" : "default",
          }}
        >
          {/* World */}
          <div
            style={{
              position: "absolute",
              transformOrigin: "0 0",
              transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
              width: 0,
              height: 0,
            }}
          >
            {filtered.map(renderClipCard)}
          </div>

          {/* Empty state */}
          {clips.length === 0 && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                gap: 10,
                color: "#333",
                pointerEvents: "none",
              }}
            >
              <div style={{ fontSize: 48 }}>&#x1F4CB;</div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#444" }}>Clipboard Canvas</div>
              <div style={{ fontSize: 13, color: "#333" }}>Copy text (Ctrl+C) to capture clips. Press ? for shortcuts.</div>
            </div>
          )}

          {/* Minimap */}
          {clips.length > 0 && (
            <div style={{ position: "absolute", bottom: 12, right: 12, zIndex: 1500 }}>
              {renderMinimap()}
            </div>
          )}

          {/* Zoom indicator */}
          <div
            style={{
              position: "absolute",
              bottom: 12,
              left: 12,
              zIndex: 1500,
              background: "rgba(0,0,0,0.5)",
              borderRadius: 6,
              padding: "3px 8px",
              fontSize: 11,
              color: "#888",
              border: "1px solid #222",
            }}
          >
            {Math.round(transform.scale * 100)}%
          </div>
        </div>
      )}

      {/* ---- CONTEXT MENU ---- */}
      {ctxMenu && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 9998 }}
            onClick={() => setCtxMenu(null)}
            onContextMenu={(e) => { e.preventDefault(); setCtxMenu(null); }}
          />
          <div
            style={{
              position: "fixed",
              left: ctxMenu.x,
              top: ctxMenu.y,
              zIndex: 9999,
              background: "#16161e",
              border: "1px solid #2a2a3a",
              borderRadius: 8,
              padding: "4px 0",
              minWidth: 170,
              boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
            }}
          >
            {[
              {
                label: "Copy again",
                icon: "\u2398",
                action: () => {
                  const c = clips.find((x) => x.id === ctxMenu.clipId);
                  if (c) copyToClipboard(c.content);
                },
              },
              {
                label: "Pin to top",
                icon: "\u{1F4CC}",
                action: () => { pinClip(ctxMenu.clipId); setCtxMenu(null); },
              },
              {
                label: "Expand",
                icon: "\u{2195}",
                action: () => { toggleExpand(ctxMenu.clipId); setCtxMenu(null); },
              },
              {
                label: "Export as text",
                icon: "\u{1F4E5}",
                action: () => {
                  const c = clips.find((x) => x.id === ctxMenu.clipId);
                  if (!c) return;
                  const blob = new Blob([c.content], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `clip-${c.id.slice(0, 8)}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);
                  setCtxMenu(null);
                },
              },
              {
                label: "Delete",
                icon: "\u2715",
                action: () => removeWithAnim(ctxMenu.clipId),
                danger: true,
              },
            ].map((item, i) => (
              <button
                key={i}
                onClick={item.action}
                style={{
                  display: "block",
                  width: "100%",
                  textAlign: "left",
                  background: "none",
                  border: "none",
                  color: item.danger ? "#f55" : "#ccc",
                  padding: "6px 14px",
                  fontSize: 12,
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = item.danger ? "#331111" : "#222236";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "none";
                }}
              >
                <span style={{ marginRight: 8, fontSize: 13 }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* ---- SHORTCUTS MODAL ---- */}
      {showShortcuts && (
        <>
          <div
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 9998 }}
            onClick={() => setShowShortcuts(false)}
          />
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 9999,
              background: "#14141e",
              border: "1px solid #2a2a3a",
              borderRadius: 12,
              padding: "24px 28px",
              width: 420,
              boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#e0e0e0" }}>Keyboard Shortcuts</h2>
              <button
                onClick={() => setShowShortcuts(false)}
                style={{ background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 18 }}
              >
                &#x2715;
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                ["Ctrl+C anywhere", "Capture clipboard text to canvas"],
                ["W A S D / Arrow keys", "Pan the canvas"],
                ["Scroll wheel", "Zoom in/out"],
                ["Drag cards", "Move clips on canvas"],
                ["Double-click card", "Expand/collapse clip"],
                ["Right-click card", "Context menu"],
                ["? key", "Toggle this shortcuts panel"],
                ["Escape", "Close menus / modals"],
                ["Grid toggle", "Switch between canvas & list view"],
                ["Export button", "Save all clips as JSON"],
              ].map(([key, desc], i) => (
                <div key={i} style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
                  <kbd
                    style={{
                      background: "#1e1e30",
                      border: "1px solid #333",
                      borderRadius: 4,
                      padding: "2px 7px",
                      fontSize: 11,
                      fontFamily: "monospace",
                      color: "#aaa",
                      whiteSpace: "nowrap",
                      minWidth: 130,
                      textAlign: "center",
                    }}
                  >
                    {key}
                  </kbd>
                  <span style={{ fontSize: 12, color: "#888" }}>{desc}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default App;
