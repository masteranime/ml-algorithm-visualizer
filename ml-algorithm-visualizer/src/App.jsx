import { useState, useEffect, useRef, useCallback } from "react";

const COLORS = {
  bg: "#0a0a0f",
  surface: "#12121a",
  surfaceHover: "#1a1a25",
  border: "#1e1e2e",
  text: "#e2e2f0",
  textDim: "#6b6b80",
  accent1: "#00d4ff",
  accent2: "#ff3d71",
  accent3: "#00e096",
  accent4: "#ffaa00",
  accent5: "#a855f7",
  glow1: "rgba(0,212,255,0.15)",
  glow2: "rgba(255,61,113,0.15)",
  glow3: "rgba(0,224,150,0.15)",
};

const CLUSTER_COLORS = ["#00d4ff", "#ff3d71", "#00e096", "#ffaa00", "#a855f7"];

// ==================== K-MEANS ====================
function KMeansViz() {
  const canvasRef = useRef(null);
  const [points, setPoints] = useState([]);
  const [centroids, setCentroids] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [k, setK] = useState(3);
  const [step, setStep] = useState(0);
  const [running, setRunning] = useState(false);
  const animRef = useRef(null);

  const generate = useCallback(() => {
    const pts = [];
    const centers = [
      [150, 150], [350, 250], [200, 380], [420, 120], [450, 400]
    ];
    for (let c = 0; c < k; c++) {
      for (let i = 0; i < 25; i++) {
        pts.push({
          x: centers[c][0] + (Math.random() - 0.5) * 140,
          y: centers[c][1] + (Math.random() - 0.5) * 140,
        });
      }
    }
    setPoints(pts);
    const inits = [];
    for (let i = 0; i < k; i++) {
      inits.push({ x: Math.random() * 500 + 25, y: Math.random() * 450 + 25 });
    }
    setCentroids(inits);
    setAssignments(new Array(pts.length).fill(0));
    setStep(0);
    setRunning(false);
  }, [k]);

  useEffect(() => { generate(); }, [generate]);

  const stepForward = useCallback(() => {
    if (points.length === 0 || centroids.length === 0) return;
    const newAssign = points.map((p) => {
      let minD = Infinity, minI = 0;
      centroids.forEach((c, i) => {
        const d = Math.hypot(p.x - c.x, p.y - c.y);
        if (d < minD) { minD = d; minI = i; }
      });
      return minI;
    });
    setAssignments(newAssign);

    const sums = centroids.map(() => ({ x: 0, y: 0, n: 0 }));
    points.forEach((p, i) => {
      sums[newAssign[i]].x += p.x;
      sums[newAssign[i]].y += p.y;
      sums[newAssign[i]].n += 1;
    });
    const newCentroids = centroids.map((c, i) =>
      sums[i].n > 0 ? { x: sums[i].x / sums[i].n, y: sums[i].y / sums[i].n } : c
    );
    setCentroids(newCentroids);
    setStep((s) => s + 1);
  }, [points, centroids]);

  useEffect(() => {
    if (running) {
      animRef.current = setInterval(stepForward, 800);
    }
    return () => clearInterval(animRef.current);
  }, [running, stepForward]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 0.5;
    for (let x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

    // Voronoi-like regions
    if (centroids.length > 0) {
      for (let px = 0; px < w; px += 6) {
        for (let py = 0; py < h; py += 6) {
          let minD = Infinity, minI = 0;
          centroids.forEach((c, i) => {
            const d = Math.hypot(px - c.x, py - c.y);
            if (d < minD) { minD = d; minI = i; }
          });
          ctx.fillStyle = CLUSTER_COLORS[minI] + "08";
          ctx.fillRect(px, py, 6, 6);
        }
      }
    }

    // Points
    points.forEach((p, i) => {
      const color = CLUSTER_COLORS[assignments[i] % CLUSTER_COLORS.length];
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = color + "cc";
      ctx.fill();
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    });

    // Centroids
    centroids.forEach((c, i) => {
      const color = CLUSTER_COLORS[i % CLUSTER_COLORS.length];
      // Glow
      ctx.beginPath();
      ctx.arc(c.x, c.y, 20, 0, Math.PI * 2);
      ctx.fillStyle = color + "22";
      ctx.fill();
      // Diamond
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.rotate(Math.PI / 4);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 15;
      ctx.fillRect(-8, -8, 16, 16);
      ctx.restore();
      ctx.shadowBlur = 0;
      // Label
      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(`C${i + 1}`, c.x, c.y - 16);
    });
  }, [points, centroids, assignments]);

  return (
    <div>
      <canvas ref={canvasRef} width={550} height={480} style={{ width: "100%", height: "auto", borderRadius: 12, background: COLORS.bg, border: `1px solid ${COLORS.border}` }} />
      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={() => setRunning(!running)} style={btnStyle(COLORS.accent1)}>
          {running ? "⏸ Pause" : "▶ Auto Run"}
        </button>
        <button onClick={stepForward} style={btnStyle(COLORS.accent3)}>Step →</button>
        <button onClick={generate} style={btnStyle(COLORS.accent2)}>↻ Reset</button>
        <label style={{ color: COLORS.textDim, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
          K:
          <input type="range" min={2} max={5} value={k} onChange={(e) => setK(+e.target.value)}
            style={{ accentColor: COLORS.accent1, width: 80 }} />
          <span style={{ color: COLORS.accent1, fontWeight: 700 }}>{k}</span>
        </label>
        <span style={{ color: COLORS.textDim, fontSize: 12, marginLeft: "auto" }}>Iteration: {step}</span>
      </div>
    </div>
  );
}

// ==================== GRADIENT DESCENT ====================
function GradientDescentViz() {
  const canvasRef = useRef(null);
  const [pos, setPos] = useState({ x: -3.5, y: 3.5 });
  const [trail, setTrail] = useState([]);
  const [lr, setLr] = useState(0.08);
  const [running, setRunning] = useState(false);
  const animRef = useRef(null);

  const f = (x, y) => Math.sin(x) * Math.cos(y) * 0.5 + (x * x + y * y) * 0.1;
  const gradX = (x, y) => Math.cos(x) * Math.cos(y) * 0.5 + 0.2 * x;
  const gradY = (x, y) => -Math.sin(x) * Math.sin(y) * 0.5 + 0.2 * y;

  const toCanvas = (x, y, w, h) => ({
    cx: ((x + 5) / 10) * w,
    cy: ((y + 5) / 10) * h,
  });

  const reset = () => {
    const nx = (Math.random() - 0.5) * 8;
    const ny = (Math.random() - 0.5) * 8;
    setPos({ x: nx, y: ny });
    setTrail([]);
    setRunning(false);
  };

  const stepOnce = useCallback(() => {
    setPos((p) => {
      const gx = gradX(p.x, p.y);
      const gy = gradY(p.x, p.y);
      const nx = p.x - lr * gx;
      const ny = p.y - lr * gy;
      setTrail((t) => [...t, { x: p.x, y: p.y }]);
      return { x: nx, y: ny };
    });
  }, [lr]);

  useEffect(() => {
    if (running) animRef.current = setInterval(stepOnce, 120);
    return () => clearInterval(animRef.current);
  }, [running, stepOnce]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Heatmap
    const imgData = ctx.createImageData(w, h);
    for (let px = 0; px < w; px++) {
      for (let py = 0; py < h; py++) {
        const x = (px / w) * 10 - 5;
        const y = (py / h) * 10 - 5;
        const v = f(x, y);
        const norm = Math.max(0, Math.min(1, (v + 2) / 6));
        const idx = (py * w + px) * 4;
        imgData.data[idx] = norm * 60;
        imgData.data[idx + 1] = (1 - norm) * 180 + 20;
        imgData.data[idx + 2] = 255 - norm * 150;
        imgData.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(imgData, 0, 0);

    // Contour lines
    ctx.strokeStyle = "rgba(255,255,255,0.08)";
    ctx.lineWidth = 0.5;
    for (let level = -2; level < 4; level += 0.4) {
      ctx.beginPath();
      for (let px = 0; px < w; px += 3) {
        for (let py = 0; py < h; py += 3) {
          const x = (px / w) * 10 - 5;
          const y = (py / h) * 10 - 5;
          if (Math.abs(f(x, y) - level) < 0.08) {
            ctx.rect(px, py, 1, 1);
          }
        }
      }
      ctx.stroke();
    }

    // Trail
    if (trail.length > 1) {
      for (let i = 1; i < trail.length; i++) {
        const a = toCanvas(trail[i - 1].x, trail[i - 1].y, w, h);
        const b = toCanvas(trail[i].x, trail[i].y, w, h);
        const alpha = 0.3 + (i / trail.length) * 0.7;
        ctx.beginPath();
        ctx.moveTo(a.cx, a.cy);
        ctx.lineTo(b.cx, b.cy);
        ctx.strokeStyle = `rgba(255,170,0,${alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // Current position
    const cp = toCanvas(pos.x, pos.y, w, h);
    ctx.beginPath();
    ctx.arc(cp.cx, cp.cy, 12, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,170,0,0.2)";
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cp.cx, cp.cy, 6, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.accent4;
    ctx.shadowColor = COLORS.accent4;
    ctx.shadowBlur = 20;
    ctx.fill();
    ctx.shadowBlur = 0;

    // Gradient arrow
    const gx = gradX(pos.x, pos.y);
    const gy = gradY(pos.x, pos.y);
    const mag = Math.hypot(gx, gy);
    if (mag > 0.01) {
      const scale = 40;
      ctx.beginPath();
      ctx.moveTo(cp.cx, cp.cy);
      ctx.lineTo(cp.cx - (gx / mag) * scale, cp.cy - (gy / mag) * scale);
      ctx.strokeStyle = COLORS.accent2;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      // Arrowhead
      const ax = cp.cx - (gx / mag) * scale;
      const ay = cp.cy - (gy / mag) * scale;
      const angle = Math.atan2(-(gy / mag), -(gx / mag));
      ctx.beginPath();
      ctx.moveTo(ax, ay);
      ctx.lineTo(ax - 8 * Math.cos(angle - 0.4), ay - 8 * Math.sin(angle - 0.4));
      ctx.lineTo(ax - 8 * Math.cos(angle + 0.4), ay - 8 * Math.sin(angle + 0.4));
      ctx.closePath();
      ctx.fillStyle = COLORS.accent2;
      ctx.fill();
    }
  }, [pos, trail]);

  return (
    <div>
      <canvas ref={canvasRef} width={550} height={480} style={{ width: "100%", height: "auto", borderRadius: 12, border: `1px solid ${COLORS.border}` }} />
      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={() => setRunning(!running)} style={btnStyle(COLORS.accent4)}>
          {running ? "⏸ Pause" : "▶ Descend"}
        </button>
        <button onClick={stepOnce} style={btnStyle(COLORS.accent3)}>Step →</button>
        <button onClick={reset} style={btnStyle(COLORS.accent2)}>↻ Reset</button>
        <label style={{ color: COLORS.textDim, fontSize: 13, display: "flex", alignItems: "center", gap: 6 }}>
          LR:
          <input type="range" min={1} max={25} value={lr * 100} onChange={(e) => setLr(+e.target.value / 100)}
            style={{ accentColor: COLORS.accent4, width: 80 }} />
          <span style={{ color: COLORS.accent4, fontWeight: 700 }}>{lr.toFixed(2)}</span>
        </label>
        <span style={{ color: COLORS.textDim, fontSize: 12, marginLeft: "auto" }}>
          Loss: {f(pos.x, pos.y).toFixed(4)}
        </span>
      </div>
    </div>
  );
}

// ==================== NEURAL NETWORK ====================
function NeuralNetViz() {
  const canvasRef = useRef(null);
  const [layers, setLayers] = useState([3, 5, 4, 2]);
  const [activations, setActivations] = useState([]);
  const [firing, setFiring] = useState(false);
  const animRef = useRef(null);
  const [pulsePhase, setPulsePhase] = useState(0);

  const fireNetwork = useCallback(() => {
    const acts = layers.map((n) => Array.from({ length: n }, () => Math.random()));
    setActivations(acts);
  }, [layers]);

  useEffect(() => { fireNetwork(); }, [fireNetwork]);

  useEffect(() => {
    if (firing) {
      animRef.current = setInterval(() => {
        fireNetwork();
        setPulsePhase((p) => p + 1);
      }, 600);
    }
    return () => clearInterval(animRef.current);
  }, [firing, fireNetwork]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const padX = 70, padY = 40;
    const layerSpacing = (w - padX * 2) / (layers.length - 1);

    const getNodePos = (li, ni) => ({
      x: padX + li * layerSpacing,
      y: padY + ((h - padY * 2) / (layers[li] + 1)) * (ni + 1),
    });

    // Connections
    for (let li = 0; li < layers.length - 1; li++) {
      for (let ni = 0; ni < layers[li]; ni++) {
        for (let nj = 0; nj < layers[li + 1]; nj++) {
          const a = getNodePos(li, ni);
          const b = getNodePos(li + 1, nj);
          const actA = activations[li]?.[ni] || 0;
          const actB = activations[li + 1]?.[nj] || 0;
          const strength = (actA + actB) / 2;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.strokeStyle = `rgba(0,212,255,${strength * 0.35})`;
          ctx.lineWidth = strength * 2.5 + 0.3;
          ctx.stroke();
        }
      }
    }

    // Nodes
    const layerLabels = ["Input", ...layers.slice(1, -1).map((_, i) => `Hidden ${i + 1}`), "Output"];
    for (let li = 0; li < layers.length; li++) {
      // Layer label
      const lx = padX + li * layerSpacing;
      ctx.fillStyle = COLORS.textDim;
      ctx.font = "11px monospace";
      ctx.textAlign = "center";
      ctx.fillText(layerLabels[li], lx, h - 10);

      for (let ni = 0; ni < layers[li]; ni++) {
        const p = getNodePos(li, ni);
        const act = activations[li]?.[ni] || 0;
        const color = li === 0 ? COLORS.accent1 : li === layers.length - 1 ? COLORS.accent2 : COLORS.accent5;

        // Glow
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 20 + act * 10);
        grad.addColorStop(0, color + Math.floor(act * 60).toString(16).padStart(2, "0"));
        grad.addColorStop(1, "transparent");
        ctx.beginPath();
        ctx.arc(p.x, p.y, 20 + act * 10, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();

        // Node circle
        ctx.beginPath();
        ctx.arc(p.x, p.y, 10 + act * 4, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.surface;
        ctx.fill();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();

        // Value
        ctx.fillStyle = color;
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(act.toFixed(1), p.x, p.y);
      }
    }
  }, [layers, activations, pulsePhase]);

  const addLayer = () => {
    if (layers.length < 7) {
      const nl = [...layers];
      nl.splice(nl.length - 1, 0, 4);
      setLayers(nl);
    }
  };

  const removeLayer = () => {
    if (layers.length > 3) {
      const nl = [...layers];
      nl.splice(nl.length - 2, 1);
      setLayers(nl);
    }
  };

  return (
    <div>
      <canvas ref={canvasRef} width={550} height={480} style={{ width: "100%", height: "auto", borderRadius: 12, background: COLORS.bg, border: `1px solid ${COLORS.border}` }} />
      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={() => setFiring(!firing)} style={btnStyle(COLORS.accent5)}>
          {firing ? "⏸ Pause" : "⚡ Fire"}
        </button>
        <button onClick={fireNetwork} style={btnStyle(COLORS.accent1)}>Pulse Once</button>
        <button onClick={addLayer} style={btnStyle(COLORS.accent3)}>+ Layer</button>
        <button onClick={removeLayer} style={btnStyle(COLORS.accent2)}>− Layer</button>
        <span style={{ color: COLORS.textDim, fontSize: 12, marginLeft: "auto" }}>
          Architecture: [{layers.join(", ")}]
        </span>
      </div>
    </div>
  );
}

// ==================== KNN ====================
function KNNViz() {
  const canvasRef = useRef(null);
  const [points, setPoints] = useState([]);
  const [query, setQuery] = useState({ x: 275, y: 240 });
  const [kVal, setKVal] = useState(5);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const pts = [];
    for (let i = 0; i < 40; i++) {
      pts.push({ x: Math.random() * 200 + 50, y: Math.random() * 200 + 50, cls: 0 });
    }
    for (let i = 0; i < 40; i++) {
      pts.push({ x: Math.random() * 200 + 300, y: Math.random() * 200 + 250, cls: 1 });
    }
    for (let i = 0; i < 30; i++) {
      pts.push({ x: Math.random() * 150 + 350, y: Math.random() * 150 + 50, cls: 2 });
    }
    // Scatter some noise
    for (let i = 0; i < 15; i++) {
      pts.push({ x: Math.random() * 500 + 25, y: Math.random() * 430 + 25, cls: Math.floor(Math.random() * 3) });
    }
    setPoints(pts);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || points.length === 0) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 0.5;
    for (let x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

    // Find k nearest
    const dists = points.map((p, i) => ({
      i, d: Math.hypot(p.x - query.x, p.y - query.y),
    })).sort((a, b) => a.d - b.d);
    const nearest = dists.slice(0, kVal);
    const radius = nearest[nearest.length - 1]?.d || 0;
    const nearestSet = new Set(nearest.map((n) => n.i));

    // K-radius circle
    ctx.beginPath();
    ctx.arc(query.x, query.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(168,85,247,0.06)";
    ctx.fill();
    ctx.strokeStyle = "rgba(168,85,247,0.3)";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Lines to nearest
    nearest.forEach((n) => {
      const p = points[n.i];
      ctx.beginPath();
      ctx.moveTo(query.x, query.y);
      ctx.lineTo(p.x, p.y);
      ctx.strokeStyle = "rgba(168,85,247,0.25)";
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Points
    const clsColors = [COLORS.accent1, COLORS.accent2, COLORS.accent3];
    points.forEach((p, i) => {
      const isNearest = nearestSet.has(i);
      ctx.beginPath();
      ctx.arc(p.x, p.y, isNearest ? 7 : 4, 0, Math.PI * 2);
      ctx.fillStyle = clsColors[p.cls] + (isNearest ? "ff" : "88");
      ctx.fill();
      if (isNearest) {
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });

    // Vote
    const votes = [0, 0, 0];
    nearest.forEach((n) => votes[points[n.i].cls]++);
    const predicted = votes.indexOf(Math.max(...votes));

    // Query point
    ctx.beginPath();
    ctx.arc(query.x, query.y, 12, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.surface;
    ctx.fill();
    ctx.strokeStyle = clsColors[predicted];
    ctx.lineWidth = 3;
    ctx.shadowColor = clsColors[predicted];
    ctx.shadowBlur = 20;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#fff";
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", query.x, query.y);

    // Legend
    ctx.font = "11px monospace";
    ctx.textAlign = "left";
    votes.forEach((v, i) => {
      ctx.fillStyle = clsColors[i];
      ctx.fillRect(w - 110, 15 + i * 22, 10, 10);
      ctx.fillText(`Class ${i}: ${v} votes`, w - 94, 24 + i * 22);
    });
    ctx.fillStyle = clsColors[predicted];
    ctx.font = "bold 12px monospace";
    ctx.fillText(`→ Class ${predicted}`, w - 110, 15 + 3 * 22 + 5);
  }, [points, query, kVal]);

  const handleMouseMove = (e) => {
    if (!dragging) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = 550 / rect.width;
    const scaleY = 480 / rect.height;
    setQuery({
      x: Math.max(10, Math.min(540, (e.clientX - rect.left) * scaleX)),
      y: Math.max(10, Math.min(470, (e.clientY - rect.top) * scaleY)),
    });
  };

  return (
    <div>
      <canvas ref={canvasRef} width={550} height={480}
        style={{ width: "100%", height: "auto", borderRadius: 12, background: COLORS.bg, border: `1px solid ${COLORS.border}`, cursor: "crosshair" }}
        onMouseDown={() => setDragging(true)}
        onMouseUp={() => setDragging(false)}
        onMouseLeave={() => setDragging(false)}
        onMouseMove={handleMouseMove}
        onClick={(e) => {
          const rect = canvasRef.current.getBoundingClientRect();
          const scaleX = 550 / rect.width;
          const scaleY = 480 / rect.height;
          setQuery({
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY,
          });
        }}
      />
      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ color: COLORS.textDim, fontSize: 13 }}>Click/drag to move query point</span>
        <label style={{ color: COLORS.textDim, fontSize: 13, display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
          K:
          <input type="range" min={1} max={15} value={kVal} onChange={(e) => setKVal(+e.target.value)}
            style={{ accentColor: COLORS.accent5, width: 100 }} />
          <span style={{ color: COLORS.accent5, fontWeight: 700 }}>{kVal}</span>
        </label>
      </div>
    </div>
  );
}

// ==================== STYLES ====================
const btnStyle = (color) => ({
  background: color + "18",
  color,
  border: `1px solid ${color}44`,
  borderRadius: 8,
  padding: "6px 14px",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
  fontFamily: "monospace",
  transition: "all 0.2s",
});

const TABS = [
  { id: "kmeans", label: "K-Means", icon: "◎", color: COLORS.accent1, desc: "Unsupervised clustering" },
  { id: "gradient", label: "Gradient Descent", icon: "▼", color: COLORS.accent4, desc: "Optimization" },
  { id: "neural", label: "Neural Network", icon: "⚡", color: COLORS.accent5, desc: "Deep learning" },
  { id: "knn", label: "KNN", icon: "◉", color: COLORS.accent3, desc: "Classification" },
];

export default function MLVisualizer() {
  const [tab, setTab] = useState("kmeans");

  return (
    <div style={{
      background: COLORS.bg,
      minHeight: "100vh",
      color: COLORS.text,
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      padding: "24px 16px",
    }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: `linear-gradient(135deg, ${COLORS.accent1}, ${COLORS.accent5})`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, fontWeight: 900, color: "#fff",
          }}>ML</div>
          <h1 style={{
            fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: -0.5,
            background: `linear-gradient(90deg, ${COLORS.accent1}, ${COLORS.accent5}, ${COLORS.accent2})`,
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>Algorithm Visualizer</h1>
        </div>
        <p style={{ color: COLORS.textDim, fontSize: 13, margin: 0 }}>
          Interactive visualizations of core ML algorithms
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: "flex", gap: 6, marginBottom: 20, justifyContent: "center", flexWrap: "wrap",
      }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            background: tab === t.id ? t.color + "20" : "transparent",
            border: `1px solid ${tab === t.id ? t.color + "66" : COLORS.border}`,
            borderRadius: 10, padding: "8px 16px", cursor: "pointer",
            color: tab === t.id ? t.color : COLORS.textDim,
            fontSize: 13, fontWeight: 600, fontFamily: "inherit",
            transition: "all 0.25s",
            display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
          }}>
            <span style={{ fontSize: 16 }}>{t.icon}</span>
            <span>{t.label}</span>
            <span style={{ fontSize: 9, opacity: 0.7 }}>{t.desc}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{
        maxWidth: 580, margin: "0 auto",
        background: COLORS.surface,
        borderRadius: 16,
        border: `1px solid ${COLORS.border}`,
        padding: 16,
        boxShadow: `0 0 40px ${tab === "kmeans" ? COLORS.glow1 : tab === "gradient" ? COLORS.glow2 : COLORS.glow3}`,
      }}>
        {tab === "kmeans" && <KMeansViz />}
        {tab === "gradient" && <GradientDescentViz />}
        {tab === "neural" && <NeuralNetViz />}
        {tab === "knn" && <KNNViz />}
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", marginTop: 24, color: COLORS.textDim, fontSize: 11 }}>
        Built with React • shaheerawan3
      </div>
    </div>
  );
}
