"use client";

import { useState, useEffect } from "react";
import { 
  Upload, Activity, Layers, Sparkles, Database, CheckCircle2, 
  Loader2, AlertTriangle, DollarSign, ShieldAlert, Ruler, FileText, ArrowRight
} from "lucide-react";

interface Metrics {
  risk_score: number;
  risk_level: string;
  damage_area_m2: number;
  est_cost_usd: number;
  compliance_standard: string;
  fracture_propagation_rate: string;
  protocol: string;
}

// PRIMARY PRODUCTION ENDPOINT (Direct to your Render deployment)
const CLOUD_WS_URL = process.env.NEXT_PUBLIC_WS_URL || "wss://blogs-boolean-hours-bell.trycloudflare.com/ws/inference";

export default function Home() {
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [segmentedImage, setSegmentedImage] = useState<string | null>(null);
  const [repairedImage, setRepairedImage] = useState<string | null>(null);
  
  // Active View Tab: 'original' | 'segmented' | 'repaired'
  const [activeTab, setActiveTab] = useState<'original' | 'segmented' | 'repaired'>('original');
  const [isProcessing, setIsProcessing] = useState(false);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [logs, setLogs] = useState<{ step: number; status: string; message: string }[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const websocket = new WebSocket(CLOUD_WS_URL);
    
    websocket.onopen = () => {
      console.log("Connected to Cloud Backend:", CLOUD_WS_URL);
      setIsConnected(true);
    };

    websocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLogs((prev) => [...prev, data]);
      
      if (data.segmented_image) {
        setSegmentedImage(data.segmented_image);
        setActiveTab('segmented');
      }
      if (data.repaired_image) {
        setRepairedImage(data.repaired_image);
        setActiveTab('repaired');
      }
      if (data.metrics) {
        setMetrics(data.metrics);
      }
      if (data.step === 5) {
        setIsProcessing(false);
      }
    };

    websocket.onclose = () => {
      console.log("Disconnected from Cloud Backend");
      setIsConnected(false);
    };

    setWs(websocket);
    return () => websocket.close();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800;
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          const resizedBase64 = canvas.toDataURL("image/jpeg", 0.7);
          
          setOriginalImage(resizedBase64);
          setSegmentedImage(null);
          setRepairedImage(null);
          setMetrics(null);
          setLogs([]);
          setActiveTab('original');
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const startPipeline = () => {
    if (!ws || !originalImage) return;
    setIsProcessing(true);
    setLogs([]);
    setActiveTab('original');
    ws.send(JSON.stringify({ type: "START_INFERENCE", payload: originalImage }));
  };

  const currentDisplayImage = 
    activeTab === 'segmented' ? (segmentedImage || originalImage) :
    activeTab === 'repaired' ? (repairedImage || originalImage) : 
    originalImage;

  return (
    <main className="min-h-screen bg-[#07090e] text-neutral-200 font-sans p-6 md:p-10">
      {/* Top Navbar */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 border-b border-neutral-800 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-500'}`} />
            <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Structura<span className="text-blue-400">Lens</span>
              <span className="text-xs px-2 py-0.5 rounded border border-blue-500/40 bg-blue-500/10 text-blue-300 font-mono font-normal">v1.0 Edge-Cloud</span>
            </h1>
          </div>
          <p className="text-neutral-400 text-sm mt-1">Autonomous Civil Infrastructure Diagnostics & Generative Remediation</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-mono text-neutral-400 bg-neutral-900 border border-neutral-800 px-3 py-1.5 rounded-lg">
            <span className={`h-2 w-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-amber-400 animate-ping'}`}></span>
            {isConnected ? "RENDER CLOUD: CONNECTED" : "CONNECTING TO RENDER..."}
          </div>
        </div>
      </header>

      {/* Main Grid Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mt-8">
        
        {/* Left Column: Viewport & Inspection Tabs (7 Columns) */}
        <div className="xl:col-span-7 space-y-4">
          
          {/* Multi-View Tab Switcher */}
          <div className="flex items-center justify-between bg-neutral-900/80 p-1.5 rounded-xl border border-neutral-800">
            <div className="flex gap-1">
              <button
                onClick={() => setActiveTab('original')}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === 'original' ? 'bg-neutral-800 text-white shadow-sm' : 'text-neutral-400 hover:text-white'}`}
              >
                1. Original Inspection
              </button>
              <button
                onClick={() => setActiveTab('segmented')}
                disabled={!segmentedImage}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${activeTab === 'segmented' ? 'bg-blue-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400'}`}
              >
                <Layers className="w-3.5 h-3.5" /> 2. SAM 2 Mask
              </button>
              <button
                onClick={() => setActiveTab('repaired')}
                disabled={!repairedImage}
                className={`px-4 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${activeTab === 'repaired' ? 'bg-emerald-600 text-white shadow-sm' : 'text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400'}`}
              >
                <Sparkles className="w-3.5 h-3.5" /> 3. Generative Repair
              </button>
            </div>

            <span className="text-[11px] font-mono text-neutral-500 pr-3 uppercase">
              Mode: {activeTab}
            </span>
          </div>

          {/* Interactive Canvas Viewport */}
          <div className="relative border border-neutral-800 rounded-2xl bg-neutral-950/60 overflow-hidden flex items-center justify-center min-h-[460px] max-h-[500px]">
            {currentDisplayImage ? (
              <img 
                src={currentDisplayImage} 
                alt="Inspection Viewport" 
                className="w-full h-full object-contain max-h-[480px] rounded-lg transition-all duration-300" 
              />
            ) : (
              <div className="text-center p-8 pointer-events-none">
                <div className="p-4 rounded-full bg-neutral-900 w-fit mx-auto mb-4 border border-neutral-800">
                  <Upload className="w-8 h-8 text-neutral-400" />
                </div>
                <h3 className="text-base font-semibold text-white">Upload Infrastructure Footage</h3>
                <p className="text-neutral-500 text-xs mt-1">Supports Phone/Drone high-res snapshots (Auto-compressed)</p>
              </div>
            )}
            
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImageUpload} 
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </div>

          {/* Action Trigger Button */}
          <button
            onClick={startPipeline}
            disabled={!originalImage || isProcessing}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-40 disabled:hover:from-blue-600 disabled:hover:to-indigo-600 font-semibold text-sm shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2 transition-all"
          >
            {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
            {isProcessing ? "Executing Full Diagnostic Pipeline..." : "Initiate Structural Telemetry"}
          </button>
        </div>

        {/* Right Column: Quant Analytics & Execution Stream (5 Columns) */}
        <div className="xl:col-span-5 space-y-6">

          {/* QUANT METRIC DASHBOARD (For Chakri Cherukuri @ Bloomberg) */}
          <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800/60">
              <h2 className="text-xs font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-400" /> Spatial Damage Analytics
              </h2>
              <span className="text-[10px] font-mono text-neutral-500">IEEE / ASCE STANDARDS</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Metric 1: Structural Risk Score */}
              <div className="bg-neutral-950 border border-neutral-800 p-3.5 rounded-xl">
                <div className="text-[11px] text-neutral-400 font-mono">Structural Risk Score</div>
                <div className="text-2xl font-bold font-mono text-red-400 mt-1 flex items-baseline gap-2">
                  {metrics ? `${metrics.risk_score} / 1.0` : "--"}
                  <span className="text-[10px] text-red-500 font-normal">{metrics?.risk_level || ""}</span>
                </div>
                <div className="w-full bg-neutral-800 h-1 rounded-full mt-2 overflow-hidden">
                  <div 
                    className="bg-red-500 h-full transition-all duration-700" 
                    style={{ width: metrics ? `${metrics.risk_score * 100}%` : '0%' }}
                  />
                </div>
              </div>

              {/* Metric 2: Estimated Repair Budget */}
              <div className="bg-neutral-950 border border-neutral-800 p-3.5 rounded-xl">
                <div className="text-[11px] text-neutral-400 font-mono">Remediation Cost (Est.)</div>
                <div className="text-2xl font-bold font-mono text-emerald-400 mt-1 flex items-baseline gap-1">
                  <DollarSign className="w-5 h-5 text-emerald-500 -mr-1" />
                  {metrics ? `${metrics.est_cost_usd}` : "--"}
                </div>
                <div className="text-[10px] text-neutral-500 font-mono mt-2">Material + Labor Index</div>
              </div>

              {/* Metric 3: Surface Damage Area */}
              <div className="bg-neutral-950 border border-neutral-800 p-3.5 rounded-xl">
                <div className="text-[11px] text-neutral-400 font-mono flex items-center gap-1">
                  <Ruler className="w-3 h-3 text-blue-400" /> Fracture Area
                </div>
                <div className="text-xl font-bold font-mono text-white mt-1">
                  {metrics ? `${metrics.damage_area_m2} m²` : "--"}
                </div>
                <div className="text-[10px] text-neutral-500 font-mono mt-1">Δ {metrics?.fracture_propagation_rate || "--"}</div>
              </div>

              {/* Metric 4: Compliance Standard Match */}
              <div className="bg-neutral-950 border border-neutral-800 p-3.5 rounded-xl">
                <div className="text-[11px] text-neutral-400 font-mono flex items-center gap-1">
                  <FileText className="w-3 h-3 text-purple-400" /> Compliance Code
                </div>
                <div className="text-sm font-semibold font-mono text-purple-300 mt-1 truncate">
                  {metrics ? metrics.compliance_standard : "--"}
                </div>
                <div className="text-[10px] text-neutral-500 font-mono mt-1">Vector DB Matched</div>
              </div>
            </div>

            {/* Qdrant RAG Detail Box */}
            {metrics && (
              <div className="bg-blue-950/20 border border-blue-800/40 p-3 rounded-xl text-xs space-y-1">
                <div className="text-[10px] font-mono uppercase tracking-wider text-blue-400 font-bold">Recommended Protocol:</div>
                <p className="text-neutral-300 text-[11px] leading-relaxed">{metrics.protocol}</p>
              </div>
            )}
          </div>

          {/* Stepper Pipeline Execution Monitor */}
          <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-5 space-y-3">
            <h2 className="text-xs font-mono uppercase tracking-wider text-neutral-400 pb-2 border-b border-neutral-800/60">
              Pipeline Telemetry
            </h2>
            
            <div className="space-y-2.5">
              {steps.map((step) => {
                const logEntry = logs.find((l) => l.step === step.id);
                const isActive = isProcessing && !logEntry && (step.id === 1 || logs.find(l => l.step === step.id - 1));
                const isComplete = logEntry !== undefined;

                return (
                  <div 
                    key={step.id} 
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs transition-all ${
                      isComplete ? 'border-emerald-500/20 bg-emerald-500/5' : 
                      isActive ? 'border-blue-500/40 bg-blue-500/10' : 
                      'border-neutral-800/50 bg-neutral-950/30 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-lg ${isComplete ? 'text-emerald-400 bg-emerald-500/10' : isActive ? 'text-blue-400 bg-blue-500/20' : 'text-neutral-500 bg-neutral-800'}`}>
                        {isComplete ? <CheckCircle2 className="w-3.5 h-3.5" /> : isActive ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : step.icon}
                      </div>
                      <div>
                        <div className={`font-medium ${isComplete ? 'text-emerald-400' : isActive ? 'text-blue-300' : 'text-neutral-400'}`}>
                          {step.name}
                        </div>
                        <div className="text-[10px] text-neutral-500">{step.desc}</div>
                      </div>
                    </div>
                    
                    <span className="text-[10px] font-mono text-neutral-500">
                      {isComplete ? "DONE" : isActive ? "EXEC..." : "IDLE"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
