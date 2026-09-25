import React, { useState, useEffect } from "react";
import { Shield, ShieldAlert, ShieldCheck, Search, Activity, Lock, AlertTriangle, AlertCircle, ChevronRight, Server, Link2, Clock } from "lucide-react";
import { analyzeUrl, getRecentScans } from "./lib/api";
import { ScanRecord } from "./shared/schema";
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
    <div className="min-h-screen flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Shield className="w-12 h-12 text-primary" />
          <h1 className="text-5xl font-extrabold tracking-tight text-white bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">
            TrustLens AI
          </h1>
        </div>
        <p className="text-lg text-gray-400 max-w-2xl mx-auto">
          Advanced threat intelligence and AI-driven URL analysis to protect against phishing, homograph attacks, and malicious payloads.
        </p>
      </div>

      {/* Main Search */}
      <div className="w-full max-w-3xl mb-12 relative group">
        <div className="absolute -inset-1 bg-gradient-to-r from-primary to-purple-600 rounded-2xl blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
        <form onSubmit={handleScan} className="relative flex items-center bg-card rounded-2xl border border-gray-800 p-2 shadow-2xl">
          <Search className="w-6 h-6 text-gray-500 ml-4" />
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className="flex-1 bg-transparent border-none text-white px-4 py-4 text-lg focus:outline-none focus:ring-0 placeholder-gray-600"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-primary hover:bg-blue-600 text-white px-8 py-3 rounded-xl font-medium transition-all flex items-center disabled:opacity-50"
          >
            {loading ? (
              <Activity className="w-5 h-5 animate-spin" />
            ) : (
              <span>Scan URL</span>
            )}
          </button>
        </form>
        {error && (
          <div className="mt-4 flex items-center space-x-2 text-danger bg-danger/10 px-4 py-3 rounded-lg border border-danger/20">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Results Section */}
      {result && (
        <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-6 mb-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Score Card */}
          <div className={cn("col-span-1 rounded-2xl border p-8 flex flex-col items-center justify-center text-center", getVerdictColor(result.verdict))}>
            {getVerdictIcon(result.verdict)}
            <div className="text-7xl font-black mt-6 mb-2">{result.trustScore}</div>
            <div className="text-xl font-bold tracking-widest uppercase opacity-90">{result.verdict}</div>
            <p className="mt-4 text-sm opacity-80">{result.domain}</p>
          </div>

          {/* AI Analysis */}
          <div className="col-span-1 md:col-span-2 bg-card rounded-2xl border border-gray-800 p-8 shadow-xl">
            <h3 className="text-2xl font-bold mb-4 flex items-center text-white">
              <Activity className="w-6 h-6 mr-3 text-primary" />
              AI Threat Analysis
            </h3>
            <p className="text-gray-300 text-lg leading-relaxed mb-6">
              {/* @ts-ignore - JSON parsing issue workaround */}
              {result.aiAnalysis?.summary || "No summary available."}
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold text-gray-400 uppercase tracking-wider text-sm mb-3">Threat Vectors</h4>
                <ul className="space-y-2">
                  {/* @ts-ignore */}
                  {result.aiAnalysis?.threatVectors?.map((threat: string, i: number) => (
                    <li key={i} className="flex items-start text-sm text-gray-300">
                      <AlertTriangle className="w-4 h-4 text-warning mr-2 mt-0.5 shrink-0" />
                      <span>{threat}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-400 uppercase tracking-wider text-sm mb-3">Recommendations</h4>
                <ul className="space-y-2">
                  {/* @ts-ignore */}
                  {result.aiAnalysis?.recommendations?.map((rec: string, i: number) => (
                    <li key={i} className="flex items-start text-sm text-gray-300">
                      <ShieldCheck className="w-4 h-4 text-success mr-2 mt-0.5 shrink-0" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Deterministic Signals */}
          <div className="col-span-1 md:col-span-3 bg-card rounded-2xl border border-gray-800 p-8 shadow-xl">
            <h3 className="text-xl font-bold mb-6 flex items-center text-white">
              <Server className="w-6 h-6 mr-3 text-blue-400" />
              Heuristic Signals
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* @ts-ignore */}
              <SignalCard label="SSL/TLS Status" value={result.deterministicSignals.hasSSL ? "Secure" : "Missing"} safe={result.deterministicSignals.hasSSL} icon={<Lock className="w-5 h-5" />} />
              {/* @ts-ignore */}
              <SignalCard label="IP Hostname" value={result.deterministicSignals.isIpHostname ? "Detected" : "Clean"} safe={!result.deterministicSignals.isIpHostname} icon={<Server className="w-5 h-5" />} />
              {/* @ts-ignore */}
              <SignalCard label="Homograph/Punycode" value={result.deterministicSignals.hasPunycode ? "Detected" : "Clean"} safe={!result.deterministicSignals.hasPunycode} icon={<AlertCircle className="w-5 h-5" />} />
              {/* @ts-ignore */}
              <SignalCard label="Subdomains" value={result.deterministicSignals.subdomainCount.toString()} safe={result.deterministicSignals.subdomainCount < 3} icon={<Link2 className="w-5 h-5" />} />
              {/* @ts-ignore */}
              {result.deterministicSignals.virusTotalStats && (
                <SignalCard 
                  label="VirusTotal" 
                  // @ts-ignore
                  value={`${result.deterministicSignals.virusTotalStats.malicious}/${result.deterministicSignals.virusTotalStats.malicious + result.deterministicSignals.virusTotalStats.suspicious + result.deterministicSignals.virusTotalStats.harmless + result.deterministicSignals.virusTotalStats.undetected} flagged`}
                  // @ts-ignore
                  safe={result.deterministicSignals.virusTotalStats.malicious === 0 && result.deterministicSignals.virusTotalStats.suspicious === 0} 
                  icon={<ShieldAlert className="w-5 h-5" />} 
                />
              )}
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

function SignalCard({ label, value, safe, icon }: { label: string, value: string, safe: boolean, icon: React.ReactNode }) {
  return (
    <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 flex flex-col">
      <div className="flex items-center text-gray-400 mb-2">
        {icon}
        <span className="ml-2 text-sm font-medium">{label}</span>
      </div>
      <div className={cn("text-lg font-semibold mt-auto", safe ? "text-success" : "text-danger")}>
        {value}
      </div>
    </div>
  );
}

export default App;
