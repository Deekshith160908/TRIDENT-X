import React, { useState, useEffect } from "react";
import { Shield, ShieldAlert, ShieldCheck, Search, Activity, AlertTriangle, AlertCircle, Clock, Trash2, TerminalSquare, Info } from "lucide-react";
import { analyzeUrl, getRecentScans } from "./lib/api";
import type { ScanRecord } from "./shared/schema";
import { cn } from "./lib/utils";

function App() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanRecord | null>(null);
  const [history, setHistory] = useState<ScanRecord[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const data = await getRecentScans();
      setHistory(data);
    } catch (err) {
      console.error("Failed to fetch history", err);
    }
  };

  const deleteScan = async (id: number) => {
    try {
      await fetch(`/api/scans/${id}`, { method: 'DELETE' });
      setHistory(history.filter(s => s.id !== id));
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };



  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;
    
    setLoading(true);
    setError("");
    setResult(null);

    
    try {
      const data = await analyzeUrl(url);
      setResult(data);
      fetchHistory(); // refresh history
    } catch (err: any) {
      setError(err.response?.data?.error?.[0]?.message || err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const getVerdictColor = (verdict: string) => {
    switch (verdict) {
      case "SAFE": return "text-success border-success/30 bg-success/10";
      case "SUSPICIOUS": return "text-warning border-warning/30 bg-warning/10";
      case "MALICIOUS": return "text-danger border-danger/30 bg-danger/10";
      default: return "text-gray-400 border-gray-700 bg-gray-800";
    }
  };

  const getVerdictIcon = (verdict: string) => {
    switch (verdict) {
      case "SAFE": return <ShieldCheck className="w-8 h-8 text-success" />;
      case "SUSPICIOUS": return <AlertTriangle className="w-8 h-8 text-warning" />;
      case "MALICIOUS": return <ShieldAlert className="w-8 h-8 text-danger" />;
      default: return <Shield className="w-8 h-8 text-gray-400" />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-[#03050c]">
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden flex justify-center">
        {/* Holographic Globe Rings */}
        <div className="absolute top-[-20%] w-[800px] h-[800px] holographic-globe animate-spin-slow opacity-60"></div>
        <div className="absolute top-[-10%] w-[1000px] h-[1000px] holographic-globe animate-spin-slow-reverse opacity-40"></div>
        {/* Volumetric Rays / Flare */}
        <div className="absolute top-0 w-[600px] h-[600px] bg-cyan-500/20 blur-[120px] rounded-full"></div>
        <div className="absolute top-20 w-[800px] h-[300px] bg-purple-600/20 blur-[150px] rounded-full"></div>
        {/* Cyber Grid Floor */}
        <div className="absolute bottom-0 left-0 right-0 h-[60vh] cyber-grid opacity-40"></div>
      </div>

      {/* Header */}
      <div className="text-center mb-16 relative z-10 mt-8">
        <div className="flex items-center justify-center space-x-3 mb-6">
          <Shield className="w-12 h-12 text-cyan-400 drop-shadow-[0_0_10px_rgba(0,255,255,0.8)]" />
          <h1 className="text-5xl font-black tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 drop-shadow-lg">
            TrustLens AI
          </h1>
        </div>
        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-6 leading-tight drop-shadow-md">
          NEXT-GENERATION THREAT DETECTION <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-blue-600">POWERED BY ADVANCED AI.</span>
        </h2>
        <p className="text-lg text-cyan-100/70 max-w-2xl mx-auto font-medium tracking-wide">
          Proactive Security, Real-Time Analysis, and Zero-Trust Intelligence for Enterprise Resilience.
        </p>
      </div>

      {/* Main Search (Anti-Gravity Platform) */}
      <div className="w-full max-w-4xl mb-24 relative group z-10 animate-float mt-12">
        
        {/* Anti-Gravity Platform Glow beneath the search bar */}
        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 w-[400px] h-[100px] bg-cyan-500/20 blur-[40px] rounded-[100%] pointer-events-none"></div>
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[300px] h-[40px] border border-cyan-400/50 rounded-[100%] animate-scan-wave pointer-events-none"></div>
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[300px] h-[40px] border-2 border-cyan-500/80 rounded-[100%] shadow-[0_0_20px_rgba(0,255,255,0.6)] pointer-events-none"></div>
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[180px] h-[20px] bg-cyan-400/50 blur-[15px] rounded-[100%] pointer-events-none"></div>

        {/* Floating Security Badges */}
        <div className="absolute -left-20 md:-left-36 -top-12 animate-float-delayed hidden md:block">
           <div className="glass-panel px-4 py-2 rounded-lg text-cyan-300 font-bold text-xs tracking-widest uppercase shadow-[0_0_15px_rgba(0,255,255,0.3)]">AI Analysis</div>
           <div className="absolute top-1/2 left-full w-24 h-[2px] bg-gradient-to-r from-cyan-500 to-transparent"></div>
        </div>
        <div className="absolute -left-16 md:-left-28 -bottom-16 animate-float hidden md:block">
           <div className="glass-panel px-4 py-2 rounded-lg text-purple-300 font-bold text-xs tracking-widest uppercase shadow-[0_0_15px_rgba(138,43,226,0.3)] border-purple-500/30">Domain Verified</div>
           <div className="absolute bottom-1/2 left-full w-20 h-[2px] bg-gradient-to-r from-purple-500 to-transparent transform -rotate-12 transform-origin-left"></div>
        </div>
        <div className="absolute -right-24 md:-right-40 -top-16 animate-float hidden md:block">
           <div className="glass-panel px-4 py-2 rounded-lg text-cyan-300 font-bold text-xs tracking-widest uppercase shadow-[0_0_15px_rgba(0,255,255,0.3)] text-right">Threat Intelligence</div>
           <div className="absolute top-1/2 right-full w-24 h-[2px] bg-gradient-to-l from-cyan-500 to-transparent"></div>
        </div>
        <div className="absolute -right-16 md:-right-28 -bottom-12 animate-float-delayed hidden md:block">
           <div className="glass-panel px-4 py-2 rounded-lg text-purple-300 font-bold text-xs tracking-widest uppercase shadow-[0_0_15px_rgba(138,43,226,0.3)] border-purple-500/30 text-right">Real-Time Scan</div>
           <div className="absolute bottom-1/2 right-full w-20 h-[2px] bg-gradient-to-l from-purple-500 to-transparent transform rotate-12 transform-origin-right"></div>
        </div>

        {/* Search Bar Container */}
        <div className="absolute -inset-2 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 rounded-2xl blur-lg opacity-40 group-hover:opacity-60 transition duration-1000 group-hover:duration-200"></div>
        
        <form onSubmit={handleScan} className="relative flex items-center glass-panel neon-border-glow rounded-2xl p-2 shadow-2xl overflow-hidden">
          <div className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-cyan-400/20 to-transparent -rotate-45 animate-light-streak pointer-events-none"></div>
          
          <Search className="w-7 h-7 text-cyan-400 ml-5 relative z-10" />
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Scan Domain or IP Address..."
            className="flex-1 bg-transparent border-none text-white px-5 py-5 text-xl font-medium focus:outline-none focus:ring-0 placeholder-cyan-700/60 relative z-10"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="btn-neon px-10 py-4 mr-1 rounded-xl font-bold tracking-widest flex items-center disabled:opacity-50 relative z-10"
          >
            {loading ? (
              <Activity className="w-6 h-6 animate-spin" />
            ) : (
              <span>START SCAN</span>
            )}
          </button>
        </form>
      </div>
        {error && (
          <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-full max-w-lg mt-8 flex items-center justify-center space-x-2 text-danger bg-danger/10 px-4 py-3 rounded-lg border border-danger/30 backdrop-blur-md">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

      {/* Results Section */}
      {result && (
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-3 gap-6 mb-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          {/* Main Score & Overview (Left Column) */}
          <div className="lg:col-span-1 space-y-6">
            <div className={cn("rounded-2xl border p-8 flex flex-col items-center justify-center text-center shadow-xl relative overflow-hidden", getVerdictColor(result.verdict))}>
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
              {getVerdictIcon(result.verdict)}
              <div className="text-8xl font-black mt-6 mb-2 tracking-tighter drop-shadow-md">{result.trustScore}</div>
              <div className="text-2xl font-bold tracking-widest uppercase opacity-90">{result.verdict}</div>
              <p className="mt-4 text-sm opacity-80 break-all">{result.domain}</p>
              
              <div className="mt-8 w-full pt-6 border-t border-current/20 flex justify-between items-center text-sm font-medium">
                <span className="opacity-70">Confidence Score</span>
                <span className="bg-current/10 px-3 py-1 rounded-full font-bold">{(result.aiAnalysis as any).confidence ?? 85}%</span>
              </div>
            </div>

            {/* Timeline */}
            {(result.deterministicSignals as any).timeline && (
              <div className="bg-card rounded-2xl border border-gray-800 p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-[40px]"></div>
                <h3 className="text-lg font-bold mb-5 flex items-center text-white relative z-10">
                  <Activity className="w-5 h-5 mr-2 text-purple-400" />
                  Scan Timeline
                </h3>
                <div className="space-y-4 relative z-10">
                  {(result.deterministicSignals as any).timeline.map((event: any, i: number) => (
                    <div key={i} className="flex items-start">
                      <div className="flex flex-col items-center mr-4">
                        <div className={cn("w-2.5 h-2.5 rounded-full mt-1.5 shadow-[0_0_8px_currentColor]", 
                          event.status === "Completed" ? "bg-success text-success" : 
                          event.status === "Scanning" ? "bg-cyan-400 text-cyan-400 animate-pulse" : 
                          "bg-gray-500 text-gray-500"
                        )} />
                        {i < (result.deterministicSignals as any).timeline.length - 1 && (
                          <div className="w-[1px] h-full bg-gray-700 my-1"></div>
                        )}
                      </div>
                      <div className="pb-4">
                        <p className="text-sm font-medium text-gray-200">{event.step}</p>
                        <p className="text-xs text-gray-500 uppercase tracking-wider">{event.status}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Detailed Investigation (Right Column) */}
          <div className="lg:col-span-2 space-y-6">
            


            {/* Raw Heuristic Signals (Restored Feature) */}
            <div className="bg-card rounded-2xl border border-gray-800 p-8 shadow-xl">
               <h3 className="text-xl font-bold mb-6 flex items-center text-white">
                <Search className="w-6 h-6 mr-3 text-emerald-400" />
                Raw Heuristic Signals
               </h3>
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                     { label: "Has SSL", value: (result.deterministicSignals as any).hasSSL },
                     { label: "Is IP Hostname", value: (result.deterministicSignals as any).isIpHostname },
                     { label: "Has Punycode/Homograph", value: (result.deterministicSignals as any).hasPunycode },
                     { label: "High-risk TLD", value: (result.deterministicSignals as any).isHighRiskTld },
                     { label: "Contains Phishing Keywords", value: (result.deterministicSignals as any).hasPhishingKeywords },
                     { label: "Is URL Shortener", value: (result.deterministicSignals as any).isUrlShortener }
                  ].map((signal, i) => (
                     <div key={i} className="flex justify-between items-center p-3 rounded-lg bg-gray-900/50 border border-gray-800">
                        <span className="text-xs text-gray-400 font-medium">{signal.label}</span>
                        <span className={cn(
                           "text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded",
                           signal.value ? (
                              signal.label === "Has SSL" ? "bg-success/20 text-success" : "bg-danger/20 text-danger"
                           ) : (
                              signal.label === "Has SSL" ? "bg-danger/20 text-danger" : "bg-gray-800 text-gray-500"
                           )
                        )}>
                           {signal.value ? "Yes" : "No"}
                        </span>
                     </div>
                  ))}
                  <div className="flex justify-between items-center p-3 rounded-lg bg-gray-900/50 border border-gray-800">
                     <span className="text-xs text-gray-400 font-medium">Subdomain Count</span>
                     <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-800 text-white">
                        {(result.deterministicSignals as any).subdomainCount}
                     </span>
                  </div>
               </div>
            </div>

            {/* URL Forensics */}
            {(result.deterministicSignals as any).urlForensics && (
               <div className="bg-card rounded-2xl border border-gray-800 p-8 shadow-xl">
                 <h3 className="text-xl font-bold mb-6 flex items-center text-white">
                  <TerminalSquare className="w-6 h-6 mr-3 text-blue-400" />
                  URL Forensics
                 </h3>
                 
                 <div className="flex flex-wrap gap-2 mb-6 p-4 bg-gray-900/60 rounded-lg border border-gray-800 font-mono text-sm break-all">
                    <span className={(result.deterministicSignals as any).urlForensics.protocol === 'https' ? 'text-success' : 'text-danger'}>{(result.deterministicSignals as any).urlForensics.protocol}://</span>
                    {(result.deterministicSignals as any).urlForensics.subdomains.length > 0 && <span className="text-warning">{(result.deterministicSignals as any).urlForensics.subdomains.join('.')}.</span>}
                    <span className="text-white font-bold">{(result.deterministicSignals as any).urlForensics.domain}</span>
                    <span className="text-gray-500">{(result.deterministicSignals as any).urlForensics.path}</span>
                    <span className="text-cyan-600">{(result.deterministicSignals as any).urlForensics.query}</span>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(result.deterministicSignals as any).urlForensics.checks.map((check: any, i: number) => (
                       <div key={i} className="flex flex-col p-3 rounded-lg bg-gray-800/30 border border-gray-700/50">
                          <div className="flex justify-between items-center mb-1">
                             <span className="text-sm font-semibold text-gray-300">{check.name}</span>
                             <span className={cn("text-[10px] font-bold uppercase tracking-wider px-2 rounded-sm", 
                               check.status === "CLEAN" ? "text-success bg-success/10" : 
                               check.status === "WARNING" ? "text-warning bg-warning/10" : "text-danger bg-danger/10"
                             )}>{check.status}</span>
                          </div>
                          <span className="text-xs text-gray-500">{check.explanation}</span>
                       </div>
                    ))}
                 </div>
               </div>
            )}

            {/* Risk Factors */}
            {(result.aiAnalysis as any)?.riskFactors && (result.aiAnalysis as any).riskFactors.length > 0 && (
               <div className="bg-card rounded-2xl border border-gray-800 p-8 shadow-xl">
                 <h3 className="text-xl font-bold mb-6 flex items-center text-white">
                  <Activity className="w-6 h-6 mr-3 text-purple-400" />
                  Risk Factors
                 </h3>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(result.aiAnalysis as any).riskFactors.map((risk: any, i: number) => (
                      <div key={i} className="bg-gray-900/50 p-4 rounded-xl border border-gray-800 relative overflow-hidden group">
                        <div className={cn("absolute top-0 left-0 w-1 h-full", 
                          risk.severity === "CRITICAL" || risk.severity === "HIGH" ? "bg-danger" : 
                          risk.severity === "MEDIUM" ? "bg-warning" : "bg-gray-500"
                        )}></div>
                        <div className="flex justify-between items-start mb-2">
                           <h4 className="font-semibold text-gray-200">{risk.name}</h4>
                           <span className="text-sm font-black text-gray-500">IMPACT: {risk.impact}</span>
                        </div>
                        <p className="text-xs text-gray-400 mb-2">{risk.reason}</p>
                        <div className="text-[10px] text-cyan-500/80 uppercase tracking-widest font-mono truncate">
                           EVIDENCE: {risk.evidence}
                        </div>
                      </div>
                    ))}
                 </div>
               </div>
            )}

            {/* Security Evidence / Recommendations */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {(result.aiAnalysis as any)?.securityEvidence && (result.aiAnalysis as any).securityEvidence.length > 0 && (
                <div className="bg-card rounded-2xl border border-gray-800 p-6 shadow-xl">
                  <h4 className="font-semibold text-gray-400 uppercase tracking-wider text-sm mb-4 flex items-center">
                     <Search className="w-4 h-4 mr-2" /> Security Evidence
                  </h4>
                  <ul className="space-y-4">
                    {(result.aiAnalysis as any).securityEvidence.map((ev: any, i: number) => (
                      <li key={i} className="text-sm">
                        <strong className="text-gray-200 block mb-1">{ev.title}</strong>
                        <p className="text-gray-400 text-xs mb-2">{ev.whyItMatters}</p>
                        <div className="space-y-1">
                          {ev.evidence.map((item: string, j: number) => (
                            <div key={j} className="flex items-start text-xs text-cyan-300/80 bg-cyan-900/20 px-2 py-1 rounded">
                              <Info className="w-3 h-3 mr-1.5 mt-0.5 shrink-0" /> {item}
                            </div>
                          ))}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="bg-card rounded-2xl border border-gray-800 p-6 shadow-xl">
                <h4 className="font-semibold text-gray-400 uppercase tracking-wider text-sm mb-4 flex items-center">
                   <ShieldCheck className="w-4 h-4 mr-2 text-success" /> Recommendations
                </h4>
                <ul className="space-y-3">
                  {/* @ts-ignore */}
                  {(result.aiAnalysis as any)?.recommendations?.map((rec: string, i: number) => (
                    <li key={i} className="flex items-start text-sm text-gray-300 bg-gray-800/40 p-3 rounded-lg border border-gray-700/50">
                      <div className="w-1.5 h-1.5 rounded-full bg-success mt-1.5 mr-3 shrink-0"></div>
                      <span className="leading-relaxed">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* History */}
      {history.length > 0 && (
        <div className="w-full max-w-5xl">
          <h3 className="text-xl font-bold mb-6 flex items-center text-white">
            <Clock className="w-6 h-6 mr-3 text-gray-400" />
            Recent Global Scans
          </h3>
          <div className="bg-card rounded-2xl border border-gray-800 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-900/50 text-gray-400 text-sm uppercase tracking-wider">
                  <th className="p-4 font-medium">Domain</th>
                  <th className="p-4 font-medium">Verdict</th>
                  <th className="p-4 font-medium">Score</th>
                  <th className="p-4 font-medium hidden md:table-cell">Scanned At</th>
                  <th className="p-4 font-medium"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {history.map((scan) => (
                  <tr key={scan.id} className="hover:bg-gray-800/50 transition-colors">
                    <td className="p-4 text-gray-300 font-medium break-all">{scan.domain}</td>
                    <td className="p-4">
                      <span className={cn("px-3 py-1 rounded-full text-xs font-bold border", getVerdictColor(scan.verdict))}>
                        {scan.verdict}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center">
                        <div className="w-full bg-gray-800 rounded-full h-2 mr-3 max-w-[100px]">
                          <div 
                            className={cn("h-2 rounded-full", scan.trustScore > 75 ? "bg-success" : scan.trustScore > 40 ? "bg-warning" : "bg-danger")}
                            style={{ width: `${scan.trustScore}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-400">{scan.trustScore}</span>
                      </div>
                    </td>
                    <td className="p-4 text-gray-500 text-sm hidden md:table-cell">
                      {new Date(scan.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => deleteScan(scan.id)}
                        className="text-gray-500 hover:text-danger p-2 rounded hover:bg-danger/10 transition-colors"
                        title="Delete Scan"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
