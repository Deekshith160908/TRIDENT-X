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

Return your response strictly matching the schema provided, and output as JSON.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            aiTrustScore: { type: "INTEGER" },
            verdict: { type: "STRING", enum: ["SAFE", "SUSPICIOUS", "MALICIOUS"] },
            summary: { type: "STRING" },
            threatVectors: { type: "ARRAY", items: { type: "STRING" } },
            recommendations: { type: "ARRAY", items: { type: "STRING" } }
          },
          required: ["aiTrustScore", "verdict", "summary", "threatVectors", "recommendations"]
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
      threatVectors: ["AI Service Unavailable"],
      recommendations: ["Exercise caution and manually verify the domain."]
    };
  }
}
