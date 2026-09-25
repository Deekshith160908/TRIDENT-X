import { URL } from "url";
import dns from "dns/promises";
import { VirusTotalStats } from "./virustotal-service";

export interface DeterministicSignals {
  hasSSL: boolean;
  isIpHostname: boolean;
  hasPunycode: boolean;
  subdomainCount: number;
  isHighRiskTld: boolean;
  hasPhishingKeywords: boolean;
  isUrlShortener: boolean;
  baseScore: number;
  virusTotalStats?: VirusTotalStats | null;
}

const HIGH_RISK_TLDS = new Set([".zip", ".mov", ".top", ".tk", ".xyz", ".fit", ".pw", ".cc", ".su"]);
const PHISHING_KEYWORDS = ["paypal", "security", "login", "apple", "support", "account", "verify", "update", "bank", "secure"];
const URL_SHORTENERS = new Set(["bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "buff.ly"]);

export async function analyzeUrl(rawUrl: string): Promise<{
  normalizedUrl: string;
  domain: string;
  signals: DeterministicSignals;
}> {
  let urlObj: URL;
  
  // Normalization
  let normalizedUrl = rawUrl.trim();
  if (!/^https?:\/\//i.test(normalizedUrl)) {
    normalizedUrl = `http://${normalizedUrl}`;
  }

  try {
    urlObj = new URL(normalizedUrl);
  } catch (e) {
    throw new Error("Invalid URL format");
  }

  const hostname = urlObj.hostname;
  
  // Deterministic Checks
  const hasSSL = urlObj.protocol === "https:";
  
  // IP Hostname check (IPv4 or IPv6)
  const isIpHostname = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.startsWith("[");
  
  // Punycode/Homograph Check
  const hasPunycode = hostname.includes("xn--") || /[^\x00-\x7F]/.test(rawUrl);

  const domainParts = hostname.split(".");
  const tld = domainParts.length > 1 ? `.${domainParts[domainParts.length - 1].toLowerCase()}` : "";
  const isHighRiskTld = HIGH_RISK_TLDS.has(tld);
  
  const subdomainCount = domainParts.length > 2 ? domainParts.length - 2 : 0;
  
  const hasPhishingKeywords = PHISHING_KEYWORDS.some(kw => 
    hostname.toLowerCase().includes(kw) && domainParts.length > 2
  );

  const isUrlShortener = URL_SHORTENERS.has(hostname.toLowerCase());

  // Base score calculation (starts at 100)
  let baseScore = 100;
  if (!hasSSL) baseScore -= 20;
  if (isIpHostname) baseScore -= 60;
  if (hasPunycode) baseScore -= 70;
  if (isHighRiskTld) baseScore -= 30;
  if (subdomainCount >= 3) baseScore -= (subdomainCount * 10);
  if (hasPhishingKeywords) baseScore -= 40;
  if (isUrlShortener) baseScore -= 10;

  baseScore = Math.max(0, Math.min(100, baseScore));

  return {
    normalizedUrl: urlObj.href,
    domain: hostname,
    signals: {
      hasSSL,
      isIpHostname,
      hasPunycode,
      subdomainCount,
      isHighRiskTld,
      hasPhishingKeywords,
      isUrlShortener,
      baseScore
    }
  };
}
