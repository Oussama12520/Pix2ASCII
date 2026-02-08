# OSAMA ASCII Art Studio

**Elevate your imagery with AI-driven ASCII precision.**

[![Project License](https://img.shields.io/badge/License-MIT-emerald.svg)](LICENSE)
[![Built with React](https://img.shields.io/badge/React-19.0.0-blue.svg)](https://reactjs.org/)
[![Vite Powered](https://img.shields.io/badge/Vite-6.0.0-646CFF.svg)](https://vitejs.dev/)
[![AI Powered](https://img.shields.io/badge/AI-Gemini%20Flash-orange.svg)](https://ai.google.dev/)
[![Deployment](https://img.shields.io/badge/Live-GitHub%20Pages-success.svg)](https://oussama12520.github.io/Pix2ASCII/)

---

## Overview

OSAMA ASCII Art Studio is a professional-grade web application designed to bridge the gap between digital photography and retro-terminal aesthetics. Leveraging the advanced reasoning capabilities of Google Gemini AI, OSAMA analyzes your images to suggest the most effective character palettes, ensuring every detail—from fine textures to complex lighting—is captured in text.

---

## Technical Features

- AI-Contextual Analysis – Gemini AI detects image content and recommends optimized character sets and resolutions.
- Multi-Style Rendering – Choose between Classic characters, Braille dots, Solid blocks, or Mathematical symbols.
- Full Color Depth – Render ASCII art in high-fidelity color or classic terminal green.
- Real-Time Engine – Instant feedback loop with GPU-accelerated canvas processing.
- High-Resolution Exports – Download your creations as optimized .png images or clean .txt files.
- Historical Persistence – Integrated session logging to track and restore your previous art sequences.
- Retro Aesthetics – Modern UI with CRT scanline overlays and a refined cyberpunk color palette.

---

## Quick Start

### 1. Installation
```bash
# Clone the repository
git clone https://github.com/Oussama12520/Pix2ASCII.git
cd Pix2ASCII

# Install dependencies
npm install
```

### 2. Configuration
Create a .env.local file in the root directory and add your Gemini API Key:
```env
API_KEY=your_gemini_api_key_here
```
*Get your key at [Google AI Studio](https://aistudio.google.com/).*

### 3. Launch
**Windows Users:**
Double-click start-project.bat to launch the dev server and open the UI automatically.

**Manual Launch:**
```bash
npm run dev
```
Navigate to http://localhost:10000.

---

## Performance Tech Stack

- Core: React 19 (Latest)
- Engine: Vite 6
- Processing: HTML5 Canvas API + Web Workers
- AI Backend: Google Generative AI (Gemini 1.5 Flash)
- Styling: Tailwind CSS + Custom CSS Variables
- Deployment: GitHub Actions + GitHub Pages

---

## Architecture

```text
OSAMA_CORE_V2.5/
├── src/
│   ├── App.tsx              # Reactive UI & Processing Logic
│   ├── index.tsx            # Entry Point
│   ├── types.ts             # Strict Typing System
│   └── services/            # AI & API Integrations
├── .github/workflows/       # CI/CD Deployment Pipelines
├── start-project.bat        # Simplified Launcher
└── vite.config.ts           # Build & Hosting Configuration
```

---

## Contribution & Support

OSAMA is an open-source project. If you'd like to contribute, please fork the repo and submit a PR.

- Author: [Oussama](https://github.com/Oussama12520)
- Deployment: [Live Studio](https://oussama12520.github.io/Pix2ASCII/)

---

Developed with precision and passion by OSAMA
[![Made with Emerald](https://img.shields.io/badge/Made%20with-Emerald-059669)](https://github.com/Oussama12520/Pix2ASCII)
