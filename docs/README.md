<div align="center">

# ⚡ ParallelRC-3D-Lab

[![Typing SVG](https://readme-typing-svg.herokuapp.com?font=Fira+Code&weight=600&size=24&pause=1000&color=00E5FF&center=true&vCenter=true&width=650&lines=Interactive+3D+RC+Circuit+Laboratory;Visualizing+Phase+%26+Current+Summation;Built+with+React+%2B+Three.js;Explore+Impedance+in+Real+Time+%E2%9A%A1)](https://git.io/typing-svg)

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=180&section=header&text=&fontSize=0" width="100%"/>

**A browser-based virtual laboratory for exploring how resistors and capacitors behave — together — in parallel.**
See the phase shift. Watch the currents sum. Feel the physics.

[![React](https://img.shields.io/badge/React-18.2-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-0.160-000000?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![React Three Fiber](https://img.shields.io/badge/R3F-8.15-FF61F6?style=for-the-badge&logo=react&logoColor=white)](https://docs.pmnd.rs/react-three-fiber)
[![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

![Stars](https://img.shields.io/github/stars/ankush-dev-eng/ParallelRC-3D-Lab?style=social)
![Forks](https://img.shields.io/github/forks/ankush-dev-eng/ParallelRC-3D-Lab?style=social)
![Last Commit](https://img.shields.io/github/last-commit/ankush-dev-eng/ParallelRC-3D-Lab?color=00E5FF&style=flat-square)

</div>

---

### 🔊 What is this?

> Real circuits don't behave like the flat diagrams in a textbook — current and voltage twist out of phase, magnitudes rotate, and the math (phasors, impedance, vector sums) can feel abstract until you can *see* it move.

**ParallelRC-3D-Lab** renders a parallel **RC circuit** as a live, rotating **3D phasor scene**, letting you manipulate resistance and capacitance and watch:

- ⚙️ The **resistive current** and **capacitive current** vectors rotate in real time
- 🔺 The **vector sum** (total current) trace itself out as a triangle in 3D space
- 📐 The **phase angle** shift as you tune component values
- 🌊 Impedance and admittance respond instantly to your inputs

No labs, no breadboards, no multimeters — just drag, tune, and watch electricity think.

---

### ✨ Features

<table>
<tr>
<td width="50%">

**🧪 Live 3D Phasor Visualization**
Watch resistive and capacitive current vectors rotate and sum in real time, rendered with Three.js.

**🎛️ Interactive Circuit Controls**
Adjust R, C, frequency and voltage on the fly — the whole scene reacts instantly.

</td>
<td width="50%">

**📊 Phase Relationship Insights**
See exactly how far capacitive current leads resistive current — no more mental math.

**🌐 Runs Entirely in the Browser**
Zero installs, zero backend. Built as a single-file Vite bundle you can open anywhere.

</td>
</tr>
</table>

---

### 🛠️ Tech Stack

<div align="center">

| Layer | Technology |
|---|---|
| ⚛️ **UI / Framework** | React 18 |
| 🎮 **3D Rendering** | Three.js + `@react-three/fiber` |
| 📡 **HTTP** | Axios |
| ⚡ **Build Tool** | Vite 5 (`vite-plugin-singlefile`) |

</div>

---

### 🚀 Getting Started

```bash
# 1. Clone the lab
git clone https://github.com/ankush-dev-eng/ParallelRC-3D-Lab.git
cd ParallelRC-3D-Lab

# 2. Install dependencies
npm install

# 3. Fire it up
npm run dev
```

Then open the local dev URL Vite prints — and start dragging sliders. ⚡

<details>
<summary>📦 Building for production</summary>

```bash
npm run build     # bundles into a single-file distributable
npm run preview   # preview the production build locally
```

</details>

---

### 🖥️ How It Works (Under the Hood)

```mermaid
flowchart LR
    A[User Input: R, C, V, f] --> B[Circuit Math Engine]
    B --> C{Compute Phasors}
    C --> D[I_R — Resistive Current]
    C --> E[I_C — Capacitive Current]
    D --> F[React Three Fiber Scene]
    E --> F
    F --> G[Rotating 3D Vector Sum]
```

The circuit math computes instantaneous phasors for resistive and capacitive current, then hands them to a `react-three-fiber` scene that animates the vectors and their triangle sum on every frame.

---

### 🗂️ Project Structure

```
ParallelRC-3D-Lab/
├── src/          # React + Three.js source
├── docs/         # Notes & supporting docs
├── index.html    # App entry point
├── vite.config.js
└── package.json
```

---

### 🤝 Contributing

Pull requests, issue reports, and circuit-nerd feedback are all welcome!

1. 🍴 Fork the repo
2. 🌿 Create your feature branch (`git checkout -b feature/amazing-thing`)
3. 💾 Commit your changes
4. 📤 Push and open a PR

---

### 📄 License

Licensed under the **MIT License** — see [`LICENSE`](LICENSE) for details.

---

<div align="center">

### 💡 If this helped you *see* electricity differently, drop a ⭐!

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=100&section=footer"/>

</div>
