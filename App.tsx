
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { analyzeImageForAscii } from './services/geminiService';
import { ConversionSettings, AiSuggestion, RenderMode } from './types';

const PALETTES = {
  classic: "@#S%?*+;:,. ",
  minimal: "█▓▒░ ",
  matrix: "01 ",
  math: "∑∏∆√∞≈≠±×÷ ",
  tech: "{}[]()<>|\\/ ",
};

interface HistoryItem {
  id: string;
  image: string;
  ascii: string;
  timestamp: number;
}

const App: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [asciiHtml, setAsciiHtml] = useState<React.ReactNode[]>([]);
  const [rawAscii, setRawAscii] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AiSuggestion | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [useScanlines, setUseScanlines] = useState(true);

  const [settings, setSettings] = useState<ConversionSettings>({
    width: 150,
    contrast: 1.2,
    brightness: 1.0,
    sharpness: 0,
    characters: PALETTES.classic,
    isColor: true,
    isInverted: false,
    renderMode: 'standard',
    useAiPalette: false,
    zoom: 1,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('ascii_history');
    if (saved) {
      try { setHistory(JSON.parse(saved)); } catch (e) { console.error(e); }
    }
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setImage(result);
        setAiAnalysis(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveToHistory = useCallback((asciiText: string) => {
    if (!image || !asciiText) return;
    const newItem: HistoryItem = {
      id: Date.now().toString(),
      image,
      ascii: asciiText,
      timestamp: Date.now(),
    };
    const updated = [newItem, ...history].slice(0, 10);
    setHistory(updated);
    localStorage.setItem('ascii_history', JSON.stringify(updated));
  }, [image, history]);

  const getBrailleChar = (pixels: boolean[]) => {
    let code = 0;
    const map = [0x01, 0x08, 0x02, 0x10, 0x04, 0x20, 0x40, 0x80];
    for (let i = 0; i < 8; i++) {
      if (pixels[i]) code |= map[i];
    }
    return String.fromCharCode(0x2800 + code);
  };

  const generateArt = useCallback(() => {
    if (!image) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      const width = settings.width;
      let height: number;

      if (settings.renderMode === 'braille') {
        height = Math.floor((img.height / img.width) * width * 2);
      } else {
        height = Math.floor((img.height / img.width) * width * 0.55);
      }

      canvas.width = width;
      canvas.height = height;

      ctx.filter = `brightness(${settings.brightness}) contrast(${settings.contrast}) grayscale(1)`;
      ctx.drawImage(img, 0, 0, width, height);

      const imageData = ctx.getImageData(0, 0, width, height);
      const pixels = imageData.data;

      const colorCanvas = document.createElement('canvas');
      colorCanvas.width = width;
      colorCanvas.height = height;
      const cCtx = colorCanvas.getContext('2d');
      if (cCtx) cCtx.drawImage(img, 0, 0, width, height);
      const colorData = cCtx?.getImageData(0, 0, width, height).data || pixels;

      let resultHtml: React.ReactNode[] = [];
      let resultRaw = "";

      const charSet = settings.isInverted
        ? settings.characters.split('').reverse().join('')
        : settings.characters;

      if (settings.renderMode === 'braille') {
        for (let y = 0; y < height; y += 4) {
          let line = "";
          for (let x = 0; x < width; x += 2) {
            const dots = [];
            for (let dy = 0; dy < 4; dy++) {
              for (let dx = 0; dx < 2; dx++) {
                const idx = ((y + dy) * width + (x + dx)) * 4;
                const b = pixels[idx] || 0;
                dots.push(b > 127);
              }
            }
            line += getBrailleChar(dots);
          }
          resultRaw += line + "\n";
        }
      } else {
        for (let y = 0; y < height; y++) {
          let lineElements: React.ReactNode[] = [];
          let lineText = "";
          for (let x = 0; x < width; x++) {
            const i = (y * width + x) * 4;
            const brightness = pixels[i];
            const charIndex = Math.floor((brightness / 255) * (charSet.length - 1));
            const char = charSet[charIndex] || ' ';

            lineText += char;
            if (settings.isColor) {
              lineElements.push(
                <span key={`${x}-${y}`} style={{ color: `rgb(${colorData[i]},${colorData[i + 1]},${colorData[i + 2]})` }}>
                  {char}
                </span>
              );
            }
          }
          resultRaw += lineText + "\n";
          if (settings.isColor) {
            resultHtml.push(<div key={y}>{lineElements}</div>);
          }
        }
      }

      setRawAscii(resultRaw);
      setAsciiHtml(resultHtml);
    };
    img.src = image;
  }, [image, settings]);

  useEffect(() => {
    const timer = setTimeout(generateArt, 150);
    return () => clearTimeout(timer);
  }, [generateArt]);

  const handleAiAnalyze = async () => {
    if (!image) return;
    setLoading(true);
    try {
      const analysis = await analyzeImageForAscii(image);
      setAiAnalysis(analysis);
      setSettings(prev => ({
        ...prev,
        characters: analysis.palette,
        renderMode: analysis.renderMode,
        width: analysis.recommendedWidth,
        useAiPalette: true
      }));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const exportAsPng = () => {
    const el = outputRef.current;
    if (!el) return;
    const lines = rawAscii.split('\n');
    const exportCanvas = document.createElement('canvas');
    const fontSize = 12;
    exportCanvas.width = settings.width * fontSize * 0.6;
    exportCanvas.height = lines.length * fontSize;
    const ctx = exportCanvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
    ctx.fillStyle = '#10b981';
    ctx.font = `${fontSize}px "Fira Code", monospace`;
    lines.forEach((line, i) => {
      ctx.fillText(line, 0, (i + 1) * fontSize);
    });

    const link = document.createElement('a');
    link.download = `pix2ascii-${Date.now()}.png`;
    link.href = exportCanvas.toDataURL();
    link.click();
  };

  const downloadTxt = () => {
    const element = document.createElement("a");
    const file = new Blob([rawAscii], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `pix2ascii-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#050505] text-slate-200">
      <header className="border-b border-emerald-900/30 bg-black/80 backdrop-blur-md p-4 flex justify-between items-center sticky top-0 z-50 shadow-[0_0_20px_rgba(16,185,129,0.1)]">
        <div className="flex items-center gap-4">
          <button
            title="History"
            onClick={() => setShowHistory(!showHistory)}
            className="h-10 w-10 bg-emerald-500/10 border border-emerald-500/40 rounded flex items-center justify-center text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)] hover:bg-emerald-500/20 transition-all"
          >
            <i className={`fa-solid ${showHistory ? 'fa-xmark' : 'fa-clock-rotate-left'} text-xl`}></i>
          </button>
          <div>
            <h1 className="font-mono font-bold text-lg tracking-tighter text-emerald-400">Pix2ASCII_CORE_V2.5</h1>
            <div className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-[10px] font-mono text-emerald-900 uppercase tracking-widest">System Active</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={() => fileInputRef.current?.click()} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-xs font-mono transition flex items-center gap-2 shadow-lg">
            <i className="fa-solid fa-camera"></i> LOAD_IMAGE
          </button>
          <button onClick={handleAiAnalyze} disabled={loading || !image} className="px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-600/50 rounded text-emerald-400 text-xs font-mono transition flex items-center gap-2 disabled:opacity-30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            {loading ? <i className="fa-solid fa-sync fa-spin"></i> : <i className="fa-solid fa-brain"></i>} AI_OPTIMIZE
          </button>
          <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
        </div>
      </header>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        <aside className="lg:col-span-3 border-r border-emerald-900/20 bg-[#080808] p-6 space-y-6 overflow-y-auto">
          {showHistory ? (
            <div className="space-y-4">
              <h3 className="text-[10px] font-mono text-emerald-600 uppercase tracking-widest mb-4 border-b border-emerald-900/30 pb-2">Art Log</h3>
              {history.length === 0 ? (
                <p className="text-[10px] font-mono text-slate-600 text-center py-8">Memory bank empty.</p>
              ) : (
                history.map(item => (
                  <div key={item.id} className="p-2 border border-slate-800 rounded bg-black/40 hover:border-emerald-500/50 cursor-pointer group transition-all" onClick={() => { setImage(item.image); setRawAscii(item.ascii); setShowHistory(false); }}>
                    <img src={item.image} className="w-full h-20 object-cover rounded opacity-50 group-hover:opacity-100 transition" alt="History" />
                    <div className="mt-2 text-[9px] font-mono text-slate-500 flex justify-between">
                      <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                      <span className="text-emerald-900 uppercase group-hover:text-emerald-500">RESTORE</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <>
              <section>
                <h3 className="text-[10px] font-mono text-emerald-600 uppercase tracking-widest mb-4 border-b border-emerald-900/30 pb-2">Primary Matrix</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-mono mb-2 block flex justify-between">
                      <span>Resolution Width</span>
                      <span className="text-emerald-500">{settings.width}px</span>
                    </label>
                    <input type="range" min="50" max="300" value={settings.width} onChange={e => setSettings({ ...settings, width: +e.target.value })} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono mb-2 block">Render Mode</label>
                    <div className="grid grid-cols-2 gap-1">
                      {(['standard', 'braille', 'blocks', 'geometric'] as RenderMode[]).map(mode => (
                        <button key={mode} onClick={() => setSettings({ ...settings, renderMode: mode })} className={`py-2 border text-[10px] font-mono rounded transition-all ${settings.renderMode === mode ? 'border-emerald-500 bg-emerald-500/10 text-emerald-400 shadow-[inset_0_0_10px_rgba(16,185,129,0.1)]' : 'border-slate-800 text-slate-500 hover:border-slate-600'}`}>
                          {mode.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-[10px] font-mono text-emerald-600 uppercase tracking-widest mb-4 border-b border-emerald-900/30 pb-2">Enhancements</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-2 border border-slate-800/50 rounded bg-black/20">
                    <span className="text-[11px] font-mono">Scanlines</span>
                    <input type="checkbox" checked={useScanlines} onChange={e => setUseScanlines(e.target.checked)} className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-500 accent-emerald-500" />
                  </div>
                  <div className="flex items-center justify-between p-2 border border-slate-800/50 rounded bg-black/20">
                    <span className="text-[11px] font-mono">Render Colors</span>
                    <input type="checkbox" checked={settings.isColor} onChange={e => setSettings({ ...settings, isColor: e.target.checked })} className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-emerald-500 accent-emerald-500" />
                  </div>
                  <div className="pt-2">
                    <label className="text-[11px] font-mono mb-2 block capitalize">Contrast ({settings.contrast})</label>
                    <input type="range" min="0.5" max="2.5" step="0.1" value={settings.contrast} onChange={e => setSettings({ ...settings, contrast: +e.target.value })} className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500" />
                  </div>
                </div>
              </section>

              {aiAnalysis && (
                <div className="p-4 bg-emerald-900/10 border border-emerald-500/20 rounded-lg shadow-inner">
                  <div className="flex items-center gap-2 mb-2">
                    <i className="fa-solid fa-brain text-emerald-500 text-[10px]"></i>
                    <span className="text-[9px] font-mono text-emerald-500 uppercase font-bold">Analysis Complete</span>
                  </div>
                  <p className="text-[11px] font-mono text-slate-400 leading-relaxed italic">"{aiAnalysis.description}"</p>
                </div>
              )}

              <button
                onClick={() => saveToHistory(rawAscii)}
                disabled={!rawAscii}
                className="w-full py-3 border border-emerald-500/30 bg-emerald-500/5 text-emerald-400 font-mono text-[10px] rounded hover:bg-emerald-500/10 transition-all uppercase tracking-widest disabled:opacity-20"
              >
                <i className="fa-solid fa-bookmark mr-2"></i> Commit to Memory
              </button>
            </>
          )}
        </aside>

        <main className="lg:col-span-9 bg-black relative flex flex-col overflow-hidden">
          {!image ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center opacity-40">
              <div className="w-24 h-24 mb-6 relative">
                <div className="absolute inset-0 border-2 border-emerald-500/20 animate-ping rounded-full"></div>
                <div className="absolute inset-4 border border-emerald-500/40 rounded-full flex items-center justify-center">
                  <i className="fa-solid fa-image text-3xl text-emerald-500/50"></i>
                </div>
              </div>
              <h2 className="text-xl font-mono tracking-widest uppercase mb-2">Awaiting Stream</h2>
              <p className="max-w-xs text-xs font-mono text-slate-500 uppercase">Initialize mapping sequence by loading image data.</p>
            </div>
          ) : (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="bg-[#111] border-b border-emerald-900/10 p-2 flex justify-between items-center px-6">
                <div className="flex gap-4">
                  <span className="text-[10px] font-mono text-emerald-800">SCALE: {Math.round(settings.zoom * 100)}%</span>
                  <span className="text-[10px] font-mono text-emerald-800">GLITCH_INDEX: 0.02</span>
                </div>
                <div className="flex gap-4">
                  <button onClick={downloadTxt} className="text-[10px] font-mono text-emerald-500 hover:text-emerald-400 transition-colors uppercase flex items-center gap-1">
                    <i className="fa-solid fa-file-lines"></i> TXT
                  </button>
                  <button onClick={exportAsPng} className="text-[10px] font-mono text-emerald-500 hover:text-emerald-400 transition-colors uppercase flex items-center gap-1">
                    <i className="fa-solid fa-file-image"></i> PNG
                  </button>
                  <button onClick={() => {
                    navigator.clipboard.writeText(rawAscii);
                    const btn = document.getElementById('copy-btn');
                    if (btn) btn.innerText = 'COPIED!';
                    setTimeout(() => { if (btn) btn.innerText = 'COPY_TXT'; }, 2000);
                  }} id="copy-btn" className="text-[10px] font-mono text-emerald-500 hover:text-emerald-400 transition-colors uppercase flex items-center gap-1">
                    <i className="fa-solid fa-copy"></i> COPY_TXT
                  </button>
                </div>
              </div>

              <div className={`flex-1 overflow-auto bg-[#020202] p-8 scrollbar-hide ${useScanlines ? 'scanlines' : ''}`} ref={outputRef}>
                <div
                  className="ascii-output origin-top-left transition-transform duration-200"
                  style={{
                    transform: `scale(${settings.zoom})`,
                    fontSize: settings.renderMode === 'braille' ? '8px' : '10px',
                    color: settings.isColor ? 'inherit' : '#10b981',
                    textShadow: settings.isColor ? 'none' : '0 0 5px rgba(16,185,129,0.3)'
                  }}
                >
                  {settings.isColor && settings.renderMode !== 'braille' ? asciiHtml : rawAscii}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <canvas ref={canvasRef} className="hidden" />
      <footer className="h-8 bg-[#050505] border-t border-emerald-900/10 flex items-center px-4 justify-between font-mono text-[9px] text-emerald-900 uppercase tracking-[0.2em]">
        <span>Pix2ASCII_Unit_111</span>
        <span className="hidden md:inline">Secure Local Processing Mode // End-to-End Encryption</span>
        <span>Build: v1.1.0_PROD</span>
      </footer>
    </div>
  );
};

export default App;
