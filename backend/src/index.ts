import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import { db, client } from "./db";
import { scans, UrlInputSchema } from "./shared/schema";
import { eq, and, gt, sql } from "drizzle-orm";
import { analyzeUrl } from "./services/url-analyzer";
import { analyzeUrlWithGemini } from "./services/gemini-service";
import { checkVirusTotal } from "./services/virustotal-service";

const app = express();
app.use(cors());
app.use(express.json());

app.post("/api/analyze", async (req: Request, res: Response) => {
  try {
    const { url } = UrlInputSchema.parse(req.body);
    const { normalizedUrl, domain, signals } = await analyzeUrl(url);

    // 1. Check for recent cached scan (within last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { rows } = await client.execute({
      sql: `SELECT * FROM scans WHERE normalized_url = ? AND created_at > ? LIMIT 1`,
      args: [normalizedUrl, twentyFourHoursAgo]
    });
    
    if (rows.length > 0) {
      const row = rows[0] as any;
      const cachedScan = {
        id: row.id,
        originalUrl: row.original_url,
        normalizedUrl: row.normalized_url,
        domain: row.domain,
        trustScore: row.trust_score,
        verdict: row.verdict,
        deterministicSignals: typeof row.deterministic_signals === 'string' ? JSON.parse(row.deterministic_signals) : row.deterministic_signals,
        aiAnalysis: typeof row.ai_analysis === 'string' ? JSON.parse(row.ai_analysis) : row.ai_analysis,
        createdAt: row.created_at
      };
      return res.status(200).json(cachedScan);
    }
    
    // 2. Perform live analysis if no recent cache exists
    const vtStats = await checkVirusTotal(normalizedUrl);
    signals.virusTotalStats = vtStats;
    if (vtStats) {
      if (vtStats.malicious > 0) signals.baseScore -= (vtStats.malicious * 30);
      if (vtStats.suspicious > 0) signals.baseScore -= (vtStats.suspicious * 10);
      signals.baseScore = Math.max(0, Math.min(100, signals.baseScore));
    }

    const aiAnalysis = await analyzeUrlWithGemini(normalizedUrl, signals);

    // Compute composite trust score (40% deterministic, 60% AI)
    // Override: if homograph or IP hostname, max score is 25
    let finalScore = Math.round((signals.baseScore * 0.4) + (aiAnalysis.aiTrustScore * 0.6));
    if (signals.hasPunycode || signals.isIpHostname) {
      finalScore = Math.min(finalScore, 25);
    }
    
    // Overall verdict synthesis
    let finalVerdict = aiAnalysis.verdict;
    if (finalScore <= 25) finalVerdict = "MALICIOUS";
    else if (finalScore <= 75) finalVerdict = "SUSPICIOUS";
    else finalVerdict = "SAFE";

    const createdAtStr = new Date().toISOString();
    await client.execute({
      sql: `INSERT INTO scans (original_url, normalized_url, domain, trust_score, verdict, deterministic_signals, ai_analysis, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [url, normalizedUrl, domain, finalScore, finalVerdict, JSON.stringify(signals), JSON.stringify(aiAnalysis), createdAtStr]
    });
    
    const { rows: insertedRows } = await client.execute({
      sql: `SELECT * FROM scans WHERE normalized_url = ? ORDER BY created_at DESC LIMIT 1`,
      args: [normalizedUrl]
    });
    const row = insertedRows[0] as any;
    const scanRecord = {
      id: row.id,
      originalUrl: row.original_url,
      normalizedUrl: row.normalized_url,
      domain: row.domain,
      trustScore: row.trust_score,
      verdict: row.verdict,
      deterministicSignals: typeof row.deterministic_signals === 'string' ? JSON.parse(row.deterministic_signals) : row.deterministic_signals,
      aiAnalysis: typeof row.ai_analysis === 'string' ? JSON.parse(row.ai_analysis) : row.ai_analysis,
      createdAt: row.created_at
    };

    res.status(200).json(scanRecord);
  } catch (error: any) {
    console.error("Analyze error:", error);
    if (error.name === "ZodError") {
      res.status(400).json({ error: error.errors });
    } else {
      res.status(500).json({ error: error.message || "Internal Server Error" });
    }
  }
});

app.get("/api/scans", async (req: Request, res: Response) => {
  try {
    const { rows } = await client.execute({
      sql: `SELECT * FROM scans ORDER BY created_at DESC LIMIT 50`,
      args: []
    });
    const recentScans = rows.map((r: any) => ({
      id: r.id,
      originalUrl: r.original_url,
      normalizedUrl: r.normalized_url,
      domain: r.domain,
      trustScore: r.trust_score,
      verdict: r.verdict,
      deterministicSignals: typeof r.deterministic_signals === 'string' ? JSON.parse(r.deterministic_signals) : r.deterministic_signals,
      aiAnalysis: typeof r.ai_analysis === 'string' ? JSON.parse(r.ai_analysis) : r.ai_analysis,
      createdAt: r.created_at
    }));
    res.status(200).json(recentScans);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch scans" });
  }
});

app.delete("/api/scans/:id", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id as string);
    if (isNaN(id)) {
      return res.status(400).json({ error: "Invalid ID" });
    }
    
    await client.execute({
      sql: `DELETE FROM scans WHERE id = ?`,
      args: [id]
    });
    
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete scan" });
  }
});

app.post("/api/chat", async (req: Request, res: Response) => {
  try {
    const { scanId, message } = req.body;
    
    if (!scanId || !message) {
      return res.status(400).json({ error: "scanId and message are required" });
    }

    const { rows } = await client.execute({
      sql: `SELECT * FROM scans WHERE id = ? LIMIT 1`,
      args: [scanId]
    });

    if (rows.length === 0) {
      return res.status(404).json({ error: "Scan not found" });
    }

    const row = rows[0] as any;
    const aiAnalysis = typeof row.ai_analysis === 'string' ? JSON.parse(row.ai_analysis) : row.ai_analysis;
    const originalUrl = row.original_url;

    const { chatWithSecurityCopilot } = await import("./services/gemini-service");
    const reply = await chatWithSecurityCopilot(originalUrl, aiAnalysis, message);

    res.status(200).json({ reply });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "Failed to process chat" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`TrustLens AI backend running on port ${PORT}`);
});
