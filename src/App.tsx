import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  FileText,
  Copy,
  Check,
  Download,
  Loader2,
  Trash2,
  Globe,
  Sliders,
  CheckSquare,
  ArrowRight,
  Clock,
  Info,
  Calendar,
  Users,
  Plus
} from "lucide-react";
import Markdown from "react-markdown";
import { MEETING_SAMPLES, MeetingSample } from "./samples";

export default function App() {
  const [transcript, setTranscript] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("none");
  const [styleOption, setStyleOption] = useState("standard");
  const [provider, setProvider] = useState("gemini");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [selectedSampleId, setSelectedSampleId] = useState<string | null>(null);

  // Auto-scroll to result on generation
  const resultRef = useRef<HTMLDivElement>(null);

  const wordCount = transcript.trim() ? transcript.trim().length : 0;

  // Pre-load the first sample on first open to give immediate value
  useEffect(() => {
    if (!transcript) {
      handleSelectSample(MEETING_SAMPLES[0]);
    }
  }, []);

  const handleSelectSample = (sample: MeetingSample) => {
    setTranscript(sample.transcript);
    setSelectedSampleId(sample.id);
    setError("");
  };

  const handleClear = () => {
    setTranscript("");
    setSelectedSampleId(null);
    setError("");
  };

  const handleSummarize = async () => {
    if (!transcript.trim()) {
      setError("請貼上或輸入會議逐字稿內容後再開始。");
      return;
    }

    setIsLoading(true);
    setError("");
    setResult("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript,
          targetLanguage,
          styleOption,
          provider,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "伺服器處理失敗");
      }

      setResult(data.result);
      
      // Smooth scroll to results
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);

    } catch (err: any) {
      console.error(err);
      setError(err?.message || "網路連線異常，或者伺服器忙碌中。請確認 API 密鑰已設定。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback
      const textArea = document.createElement("textarea");
      textArea.value = result;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (e) {
        console.error("Failed to copy", e);
      }
      document.body.removeChild(textArea);
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const blob = new Blob([result], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    
    // Generate descriptive file title
    const dateStr = new Date().toISOString().split("T")[0];
    const activeSample = MEETING_SAMPLES.find(s => s.id === selectedSampleId);
    const titleClean = activeSample ? activeSample.title.replace(/[^\u4e00-\u9fa5a-zA-Z0-9-]/g, "") : "會議記錄";
    
    link.setAttribute("download", `${dateStr}_${titleClean || "AI會議會議記錄"}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col lg:flex-row min-h-screen bg-[#FCFBF9] text-[#1A1A1A] font-sans">
      
      {/* Sidebar (ASIDE) Component with Editorial styling */}
      <aside className="w-full lg:w-72 bg-[#1A1A1A] text-white flex flex-col p-6 lg:p-8 border-b lg:border-b-0 lg:border-r border-black shrink-0 justify-between">
        <div className="space-y-10">
          
          {/* Logo Brand Title */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#FF6B35] rounded-full flex items-center justify-center font-bold text-black font-sans text-lg">
              Σ
            </div>
            <span className="text-xl font-bold tracking-tight uppercase font-sans">Linguist AI</span>
          </div>

          {/* Sidebar Menu sections */}
          <nav className="space-y-8">
            <div className="space-y-3">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold font-mono">WORKSPACE / 工作區</p>
              
              <div className="flex items-center gap-3 text-[#FF6B35] font-semibold cursor-pointer py-1 text-sm bg-zinc-900/50 -mx-2 px-2 rounded">
                <div className="w-1.5 h-1.5 bg-[#FF6B35] rounded-full"></div>
                <span>當前會議轉譯</span>
              </div>
              
              <div className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors cursor-pointer text-sm py-1">
                <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full"></div>
                <span>歷史紀錄備存</span>
              </div>

              <div className="flex items-center gap-3 text-zinc-400 hover:text-white transition-colors cursor-pointer text-sm py-1">
                <div className="w-1.5 h-1.5 bg-zinc-600 rounded-full"></div>
                <span>商務翻譯字典</span>
              </div>
            </div>

            {/* Recent files list styled like raw index cards */}
            <div className="space-y-3">
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold font-mono">RECENT SAMPLES / 經典範例</p>
              <ul className="space-y-2.5 text-xs">
                {MEETING_SAMPLES.map((sample) => (
                  <li 
                    key={sample.id}
                    onClick={() => handleSelectSample(sample)}
                    className={`cursor-pointer transition-colors p-2.5 border rounded-sm flex flex-col gap-1 ${
                      selectedSampleId === sample.id 
                        ? "bg-zinc-805 bg-zinc-800 border-zinc-700 text-white" 
                        : "border-transparent text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/40"
                    }`}
                  >
                    <span className="font-bold truncate">{sample.title}</span>
                    <span className="text-[10px] text-zinc-500 font-serif italic truncate">{sample.category}</span>
                  </li>
                ))}
              </ul>
            </div>
          </nav>
        </div>

        {/* Sidebar Info footer */}
        <div className="pt-8 border-t border-zinc-800 text-[11px] text-zinc-500 font-mono space-y-1 mt-8 lg:mt-0">
          <div>ENGINE: {provider === "gemini" ? "GEMINI_2.5_LITE" : "NVIDIA_NEMOTRON"}</div>
          <div>LOCALE: ZH_TW_TAIWAN</div>
          <div className="text-[10px] text-emerald-500 flex items-center gap-1.5 mt-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            STATUS: ACTIVE / READY
          </div>
        </div>
      </aside>

      {/* Main Container Area */}
      <main className="flex-1 flex flex-col h-full bg-[#FCFBF9]">
        
        {/* Editorial style top banner header */}
        <header className="px-6 lg:px-10 py-6 lg:py-8 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-3xl lg:text-5xl font-serif font-black tracking-tight text-[#1A1A1A]">
              會議記錄轉譯助手
            </h1>
            <p className="text-zinc-400 text-2xs lg:text-xs font-bold uppercase tracking-[0.2em] font-mono">
              AI-POWERED MEETING SYNTHESIS & TRANSLATION SYSTEM
            </p>
          </div>
          
          {/* Top navigation subtle tabs */}
          <div className="flex gap-4 font-mono text-xs border-b border-zinc-200 sm:border-0 pb-1 shrink-0">
            <button className="font-black border-b-2 border-zinc-900 pb-1 text-zinc-900">
              MAIN INTERFACE / 主工作區
            </button>
            <span className="text-zinc-300">/</span>
            <span className="text-zinc-400 font-medium">DOCUMENTATION</span>
          </div>
        </header>

        {/* Body Workspace Grid */}
        <div className="flex-1 p-6 lg:p-10 flex flex-col gap-8 max-w-7xl w-full mx-auto">
          
          {/* Middle Main split pane */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-stretch">
            
            {/* LEFT PANE: Input Section */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <label 
                  htmlFor="transcriptInput" 
                  className="text-xs font-bold uppercase tracking-widest text-zinc-500 font-mono flex items-center gap-1.5"
                >
                  <span>INPUT WORKSPACE / 會議逐字稿輸入</span>
                  {wordCount > 0 && <span className="text-zinc-450 text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded font-mono">UTF-8 / {wordCount.toLocaleString()} 字</span>}
                </label>
                
                {transcript && (
                  <button 
                    onClick={handleClear}
                    className="text-2xs text-[#FF6B35] hover:text-[#E55A25] font-black uppercase tracking-wider transition"
                  >
                    [ CLEAR / 清空 ]
                  </button>
                )}
              </div>

              {/* Textarea beautifully styled in serif editorial layout */}
              <div className="relative group flex-1 min-h-[380px] flex flex-col">
                <textarea
                  id="transcriptInput"
                  value={transcript}
                  onChange={(e) => {
                    setTranscript(e.target.value);
                    setSelectedSampleId(null);
                    setError("");
                  }}
                  placeholder="請在此處貼上您的會議文字、錄音口述或草稿，亦可點擊左側範例套入..."
                  className="w-full flex-1 p-6 bg-white border border-zinc-200 focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 outline-none transition-all resize-y font-serif leading-relaxed text-lg text-[#1A1A1A] placeholder:text-zinc-300 shadow-xs"
                />
                <div className="absolute bottom-3 right-3 text-[9px] text-zinc-305 text-zinc-300 font-mono tracking-widest uppercase pointer-events-none">
                  RAW INPUT / TEXT CONTAINER
                </div>
              </div>

              {/* Controls Box below input */}
              <div className="bg-white border border-zinc-200 p-5 rounded shadow-2xs space-y-4">
                <div className="flex items-center gap-1.5 pb-2.5 border-b border-zinc-100">
                  <Sliders className="w-4 h-4 text-[#FF6B35]" />
                  <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 font-mono">
                    SYNTHESIS OPTIONS / 總結與外語翻譯設定
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Summary Type radio style */}
                  <div className="space-y-2">
                    <span className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono">
                      📝 REPORT STYLE / 報告風格
                    </span>
                    <div className="space-y-1.5 text-xs">
                      {[
                        { id: "standard", label: "標準平衡報告 (最適中)" },
                        { id: "detailed", label: "技術紀實詳錄 (最還原)" },
                        { id: "executive", label: "高階主管簡報 (極精煉)" }
                      ].map((opt) => (
                        <label 
                          key={opt.id}
                          className={`flex items-center gap-2 cursor-pointer py-1 px-2 rounded transition ${
                            styleOption === opt.id 
                              ? "bg-zinc-100 font-bold text-zinc-900" 
                              : "text-zinc-600 hover:text-zinc-900"
                          }`}
                        >
                          <input
                            type="radio"
                            name="styleOption"
                            value={opt.id}
                            checked={styleOption === opt.id}
                            onChange={() => setStyleOption(opt.id)}
                            className="text-zinc-900 focus:ring-zinc-900 border-zinc-300 w-3.5 h-3.5"
                          />
                          <span>{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Language Selector in elegant minimal styling */}
                  <div className="space-y-2">
                    <span className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono flex items-center gap-1">
                      <Globe className="w-3 h-3 text-zinc-600" />
                      CROSS-TRANSLATION / 外語附註
                    </span>
                    
                    <select
                      value={targetLanguage}
                      onChange={(e) => setTargetLanguage(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white border border-zinc-200 rounded-sm focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 outline-none text-zinc-800 font-sans"
                    >
                      <option value="none">不加對照翻譯 (純中文報告)</option>
                      <option value="英文 (English)">英商對照 (English Mapping)</option>
                      <option value="日文 (Japanese)">日商對照 (Japanese Mapping)</option>
                      <option value="韓文 (Korean)">韓商對照 (Korean Mapping)</option>
                    </select>

                    <p className="text-[10px] text-zinc-400 font-serif italic leading-relaxed pt-1.5">
                      * 勾選後，AI 會自動在中文會議記錄的尾端附上針對主題與大綱的精美商務語言對講。
                    </p>
                  </div>

                  {/* AI Provider selector */}
                  <div className="space-y-2">
                    <span className="block text-[11px] font-bold text-zinc-500 uppercase tracking-wider font-mono flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#FF6B35]" />
                      AI PROVIDER / 服務商選擇
                    </span>
                    
                    <select
                      value={provider}
                      onChange={(e) => setProvider(e.target.value)}
                      className="w-full text-xs p-2.5 bg-white border border-zinc-200 rounded-sm focus:border-zinc-950 focus:ring-1 focus:ring-zinc-950 outline-none text-zinc-800 font-sans"
                    >
                      <option value="gemini">Google Gemini (2.5 Flash Lite)</option>
                      <option value="nvidia">NVIDIA (Nemotron Mini 4B)</option>
                    </select>

                    <p className="text-[10px] text-zinc-400 font-serif italic leading-relaxed pt-1.5">
                      * {provider === "gemini" ? "採用最新 Gemini 2.5 Flash Lite，兼具超快速度與優異的長文總結推理能力。" : "採用 NVIDIA Nemotron Mini 4B 模型，提供高效率、極致輕量之精準指令遵循體驗。"}
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT PANE: Output Result section */}
            <div className="flex flex-col gap-4">
              
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold uppercase tracking-widest text-zinc-500 font-mono">
                  OUTPUT CONTEXT / 智慧轉譯報告明細
                </label>

                {result && (
                  <div className="flex items-center gap-2.5">
                    {/* Copy Button styled minimalistically like editorial tags */}
                    <button
                      onClick={handleCopy}
                      className={`text-[10px] font-bold px-3 py-1 border transition-all uppercase tracking-wider ${
                        copied 
                          ? "bg-zinc-900 text-white border-zinc-900" 
                          : "bg-white hover:bg-zinc-50 text-zinc-800 border-zinc-200"
                      }`}
                    >
                      {copied ? "已複製 / Copied✓" : "一鍵複製 / Copy"}
                    </button>

                    {/* Export file button */}
                    <button
                      onClick={handleDownload}
                      className="text-[10px] font-bold px-3 py-1 bg-[#1A1A1A] hover:bg-zinc-800 text-white transition-all uppercase tracking-wider"
                    >
                      匯出檔案 / MD
                    </button>
                  </div>
                )}
              </div>

              {/* Box for Output matching Editorial design style template */}
              <div className="flex-1 bg-white border border-zinc-200 p-6 lg:p-8 overflow-y-auto max-h-[580px] min-h-[380px] flex flex-col shadow-xs" id="outputArea">
                
                {!result && !isLoading ? (
                  // Empty State - styled like a pristine book page
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <div className="w-12 h-12 border border-zinc-300 flex items-center justify-center font-serif italic text-2xl text-zinc-400 mb-4 bg-zinc-50">
                      §
                    </div>
                    <h3 className="font-serif font-bold text-lg text-zinc-700 italic">尚無生成內容</h3>
                    <p className="text-xs text-zinc-400 mt-2 max-w-xs leading-relaxed font-serif">
                      本工具配備高效率排版大腦，請輸入並點擊右下角生成，即可呈現兼具極致商務美感的報表格。
                    </p>
                  </div>
                ) : isLoading ? (
                  // High quality editorial loading indicator
                  <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                    <div className="w-12 h-12 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin mb-4" />
                    <h3 className="font-serif text-lg font-bold italic tracking-tight text-zinc-800 animate-pulse">
                      智慧排版中 (Processing Synthesis)
                    </h3>
                    <p className="text-2xs text-zinc-400 font-mono uppercase tracking-widest mt-2">
                      IDENTIFYING SPEAKERS & RE-FORMATTING TEXT
                    </p>
                    
                    <div className="mt-8 p-4 border border-zinc-100 bg-[#FCFBF9] text-left max-w-sm space-y-2 text-2xs font-serif text-zinc-500">
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-3 bg-[#FF6B35]"></div>
                        <span>[步驟 1] 深入判讀上下文並抽絲剝繭論點</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1 h-3 bg-[#FF6B35]"></div>
                        <span>[步驟 2] 提取具有法律效用、商機、明確時程的決議</span>
                      </div>
                      {targetLanguage !== "none" && (
                        <div className="flex items-center gap-2">
                          <div className="w-1 h-3 bg-[#FF6B35]"></div>
                          <span>[步驟 3] 英/日/韓高階對照轉譯生成中...</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  // Markdown output area
                  <div className="prose prose-zinc max-w-none text-zinc-900 leading-relaxed font-serif text-base flex-1" ref={resultRef}>
                    <div className="space-y-1">
                      <Markdown
                        components={{
                          h1: ({ ...props }) => (
                            <h1 
                              className="text-2xl font-serif font-black text-zinc-950 mt-6 pb-2.5 border-b border-zinc-900 tracking-tight flex items-center gap-2" 
                              {...props} 
                            />
                          ),
                          h2: ({ ...props }) => (
                            <h2 
                              className="text-xl font-serif font-bold italic text-zinc-900 mt-6 mb-3 border-l-4 border-zinc-900 pl-3.5" 
                              {...props} 
                            />
                          ),
                          h3: ({ ...props }) => (
                            <h3 
                              className="text-base font-bold text-zinc-950 mt-5 mb-2 flex items-center gap-2 font-serif" 
                              {...props} 
                            />
                          ),
                          p: ({ ...props }) => (
                            <p 
                              className="text-zinc-800 leading-relaxed mb-4 text-justify first-letter:text-zinc-900 text-[15px]" 
                              {...props} 
                            />
                          ),
                          ul: ({ ...props }) => (
                            <ul 
                              className="list-disc pl-5 mb-4 text-zinc-800 space-y-2 list-outside" 
                              {...props} 
                            />
                          ),
                          ol: ({ ...props }) => (
                            <ol 
                              className="list-decimal pl-5 mb-4 text-zinc-805 space-y-2 list-outside" 
                              {...props} 
                            />
                          ),
                          li: ({ ...props }) => (
                            <li 
                              className="leading-relaxed" 
                              {...props} 
                            />
                          ),
                          blockquote: ({ ...props }) => (
                            <blockquote 
                              className="border-l-4 border-[#FF6B35] bg-[#FFF8F5] p-4 italic my-4 text-zinc-700 tracking-wide text-xs font-serif" 
                              {...props} 
                            />
                          ),
                          pre: ({ ...props }) => (
                            <pre 
                              className="bg-zinc-50 border border-zinc-200 p-4 rounded overflow-x-auto text-[13px] my-4 font-mono text-zinc-800" 
                              {...props} 
                            />
                          ),
                          code: ({ ...props }) => (
                            <code 
                              className="bg-zinc-100 text-rose-700 px-1.5 py-0.5 rounded font-mono text-xs font-semibold" 
                              {...props} 
                            />
                          ),
                          table: ({ ...props }) => (
                            <div className="overflow-x-auto my-4 border border-zinc-300">
                              <table className="min-w-full divide-y divide-zinc-200 bg-white text-xs" {...props} />
                            </div>
                          ),
                          th: ({ ...props }) => (
                            <th className="px-4 py-2 bg-zinc-100 font-bold text-zinc-800 text-left" {...props} />
                          ),
                          td: ({ ...props }) => (
                            <td className="px-4 py-2 border-t border-zinc-200 text-zinc-700" {...props} />
                          ),
                        }}
                      >
                        {result}
                      </Markdown>
                    </div>
                  </div>
                )}

              </div>

            </div>

          </div>

          {/* Error Message Box if errors found */}
          {error && (
            <div className="border-l-4 border-rose-600 bg-rose-50 text-rose-905 p-4 rounded-r-md text-xs font-serif flex items-start gap-2 animate-pulse mt-1">
              <Info className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <span className="font-bold">❌ 系統警報：</span>
                {error}
              </div>
            </div>
          )}

          {/* Sticky Bottom Action bar representing intense editorial contrast */}
          <div className="h-auto md:h-20 py-4 md:py-0 flex flex-col md:flex-row items-center justify-between bg-zinc-900 rounded-sm px-6 lg:px-8 text-white gap-4 shadow-md">
            
            <div className="flex flex-wrap items-center gap-4 lg:gap-6 text-xs font-mono">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="uppercase tracking-widest text-zinc-400">
                  {provider === "gemini" ? "Gemini 2.5 Lite Active" : "NVIDIA Nemotron Active"}
                </span>
              </div>
              <div className="hidden sm:block h-4 w-px bg-zinc-755 bg-zinc-750"></div>
              
              <div className="hidden md:flex items-center gap-1.5 text-zinc-400">
                <span>安全保護模式</span>
                <span className="bg-zinc-800 text-zinc-400 px-1 rounded text-[10px]">Active</span>
              </div>
            </div>

            <button
              onClick={handleSummarize}
              disabled={isLoading}
              className={`w-full md:w-auto bg-[#FF6B35] hover:bg-[#E55A25] text-black font-black py-3.5 px-10 text-sm uppercase tracking-tighter transition-all flex items-center justify-center gap-3 group shrink-0 ${
                isLoading ? "opacity-60 cursor-not-allowed" : ""
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>整理編目中...</span>
                </>
              ) : (
                <>
                  <span>生成總結與翻譯</span>
                  <span className="group-hover:translate-x-1 transition-transform font-bold">→</span>
                </>
              )}
            </button>
          </div>

          {/* Security details & user workspace notice card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-2xs text-zinc-400 font-serif italic border-t border-zinc-200 pt-6">
            <p>
              * 關於安全保障：本工具是在安全嚴密的 Express 伺服器端守護 API 配置，所有文字發送皆經過 HTTPS 阻絕外洩，確保您的商業機敏對談受到完整保密。
            </p>
            <p className="md:text-right">
              強大驅動核心：Google Cloud Run & React TypeScript & Tailwind CSS.
            </p>
          </div>

        </div>
      </main>
      
    </div>
  );
}
