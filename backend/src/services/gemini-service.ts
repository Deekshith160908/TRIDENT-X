import { GoogleGenAI } from "@google/genai";
import { AiAnalysisResponseSchema, AiAnalysisResponse } from "../shared/schema";
import { DeterministicSignals } from "./url-analyzer";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeUrlWithGemini(
  url: string,
  signals: DeterministicSignals
): Promise<AiAnalysisResponse> {
  const prompt = `
You are an elite Application Security Architect and AI Systems Engineer evaluating a URL for potential threats.

URL to analyze: ${url}

Deterministic signals gathered:
- Has SSL: ${signals.hasSSL}
- Is IP Hostname: ${signals.isIpHostname}
- Has Punycode/Homograph: ${signals.hasPunycode}
- Subdomain count: ${signals.subdomainCount}
- High-risk TLD: ${signals.isHighRiskTld}
- Contains Phishing Keywords: ${signals.hasPhishingKeywords}
- Is URL Shortener: ${signals.isUrlShortener}
- VirusTotal Stats: ${signals.virusTotalStats ? JSON.stringify(signals.virusTotalStats) : 'Not Available'}
- Baseline deterministic score: ${signals.baseScore}/100

Perform a comprehensive threat analysis. Evaluate contextual risk, look for brand impersonation attempts, and synthesize the deterministic signals.
Provide a transparent "Explainable Security" breakdown of exactly why the score was assigned, including risk factors, threat vectors with severity, and explicit security evidence explaining WHY it matters.
Make sure the confidence score reflects the number of active signals available.

Return your response strictly matching the schema provided, and output as JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            aiTrustScore: { type: "INTEGER" },
            verdict: { type: "STRING", enum: ["SAFE", "SUSPICIOUS", "MALICIOUS"] },
            summary: { type: "STRING" },
            threatVectors: { 
              type: "ARRAY", 
              items: { 
                type: "OBJECT",
                properties: {
                  name: { type: "STRING" },
                  severity: { type: "STRING", enum: ["CLEAN", "LOW", "MEDIUM", "HIGH", "CRITICAL"] },
                  status: { type: "STRING" },
                  evidence: { type: "ARRAY", items: { type: "STRING" } },
                  explanation: { type: "STRING" }
                },
                required: ["name", "severity", "status", "evidence", "explanation"]
              } 
            },
            recommendations: { type: "ARRAY", items: { type: "STRING" } },
            riskFactors: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  name: { type: "STRING" },
                  impact: { type: "INTEGER" },
                  severity: { type: "STRING" },
                  reason: { type: "STRING" },
                  evidence: { type: "STRING" }
                },
                required: ["name", "impact", "severity", "reason", "evidence"]
              }
            },
            securityEvidence: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  title: { type: "STRING" },
                  evidence: { type: "ARRAY", items: { type: "STRING" } },
                  whyItMatters: { type: "STRING" }
                },
                required: ["title", "evidence", "whyItMatters"]
              }
            },
            confidence: { type: "INTEGER" }
          },
          required: ["aiTrustScore", "verdict", "summary", "threatVectors", "recommendations", "riskFactors", "securityEvidence", "confidence"]
        }
      }
    });

    if (!response.text) {
      throw new Error("No text response from Gemini");
    }

    const parsed = JSON.parse(response.text);
    return AiAnalysisResponseSchema.parse(parsed);
  } catch (error) {
    console.error("Gemini AI Analysis failed:", error);
    // Fallback if AI fails
    return {
      aiTrustScore: signals.baseScore,
      verdict: signals.baseScore > 75 ? "SAFE" : signals.baseScore > 40 ? "SUSPICIOUS" : "MALICIOUS",
      summary: "AI analysis unavailable. Score based strictly on deterministic signals.",
      threatVectors: [
        {
          name: "AI Service Unavailable",
          severity: "MEDIUM",
          status: "Warning",
          evidence: ["API connection failed"],
          explanation: "The AI subsystem is currently offline. Relying on deterministic engine."
        }
      ],
      recommendations: ["Exercise caution and manually verify the domain.", "Rely on deterministic signals."],
      riskFactors: [],
      securityEvidence: [],
      confidence: 50
    };
  }
}

export async function chatWithSecurityCopilot(
  url: string,
  aiAnalysis: any,
  message: string
): Promise<string> {
  const prompt = `
You are the "Security Copilot" for TrustLens AI, an elite Application Security Architect.
You are assisting a user who is investigating a specific URL.

Context of the investigation:
URL: ${url}
AI Trust Score: ${aiAnalysis.aiTrustScore}
Verdict: ${aiAnalysis.verdict}
Summary: ${aiAnalysis.summary}

User's Question/Command:
${message}

Respond concisely and professionally as a cybersecurity expert. If they ask for a firewall rule, provide it (e.g. iptables, UFW, or WAF rules). If they ask why it's bad, explain the threat vectors clearly. Keep your response brief, authoritative, and helpful. Use markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
    });
    return response.text || "I am unable to process that request right now.";
  } catch (error) {
    console.error("Copilot chat failed:", error);
    return "Error: Security Copilot is currently unavailable.";
  }
}
