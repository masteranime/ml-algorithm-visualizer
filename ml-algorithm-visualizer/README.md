# 🧠 ML Algorithm Visualizer

**Interactive, animated visualizations of core Machine Learning algorithms built with React + Canvas.**

[![Live Demo](https://img.shields.io/badge/Live-Demo-00d4ff?style=for-the-badge&logo=vercel)](https://ml-algorithm-visualizer.vercel.app)
[![License: MIT](https://img.shields.io/badge/License-MIT-a855f7?style=for-the-badge)](./LICENSE)
[![React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react)](https://react.dev)

---

## ✨ Algorithms

### ◎ K-Means Clustering
Watch centroids converge in real-time as data points are assigned to clusters. Features Voronoi region shading, adjustable K (2–5), step-by-step or auto-run modes.

### ▼ Gradient Descent
Navigate a 3D loss landscape rendered as a heatmap with contour lines. See the gradient arrow, descent trail, and how learning rate affects convergence.

### ⚡ Neural Network
Animated forward pass through a fully-connected network. Add/remove hidden layers, watch activation values flow through connections with real-time intensity mapping.

### ◉ K-Nearest Neighbors (KNN)
Drag a query point across a multi-class dataset. See the K-radius boundary, voting results, and classification decision update live. Adjustable K (1–15).

---

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/shaheerawan3/ml-algorithm-visualizer.git
cd ml-algorithm-visualizer

# Install
npm install

# Run locally
npm run dev
```

Open `http://localhost:5173` in your browser.

## 📦 Build & Deploy

```bash
# Build for production
npm run build

# Preview build
npm run preview
```

### Deploy to Vercel (recommended)
```bash
npm i -g vercel
vercel
```

### Deploy to GitHub Pages
```bash
npm run build
# Push the dist/ folder to gh-pages branch
```

---

## 🛠 Tech Stack

| Layer | Tech |
|-------|------|
| Framework | React 18 |
| Rendering | HTML5 Canvas API |
| Build Tool | Vite 5 |
| Styling | Inline CSS (zero dependencies) |
| Animations | requestAnimationFrame + setInterval |

---

## 📁 Project Structure

```
ml-algorithm-visualizer/
├── public/
│   └── favicon.svg
├── src/
│   ├── App.jsx          # All 4 algorithm visualizations
│   └── main.jsx         # React entry point
├── index.html
├── package.json
├── vite.config.js
└── README.md
```

---

## 🎮 Controls

| Algorithm | Controls |
|-----------|----------|
| K-Means | ▶ Auto Run, Step →, Reset, K slider (2–5) |
| Gradient Descent | ▶ Descend, Step →, Reset, Learning Rate slider |
| Neural Network | ⚡ Fire (continuous), Pulse Once, +/− Layers |
| KNN | Click/drag query point, K slider (1–15) |

---

## 📝 License

MIT © [Muhammad_Shaheer]([https://github.com/shaheerawan3](https://github.com/masteranime))

---

<p align="center">
  <b>⭐ Star this repo if you find it useful!</b>
</p>
