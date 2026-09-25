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
  
  urlForensics: {
    protocol: string;
    subdomains: string[];
    domain: string;
    tld: string;
    path: string;
    query: string;
    checks: { name: string; status: "CLEAN" | "WARNING" | "HIGH RISK"; explanation: string; }[];
  };
  brandAnalysis: {
    detectedPattern: string | null;
    confidence: number;
    notes: string;
  };
  timeline: { step: string; status: "Pending" | "Scanning" | "Completed" | "Warning" | "Unavailable" }[];
}

const HIGH_RISK_TLDS = new Set([".zip", ".mov", ".top", ".tk", ".xyz", ".fit", ".pw", ".cc", ".su"]);
const PHISHING_KEYWORDS = ["paypal", "security", "login", "apple", "support", "account", "verify", "update", "bank", "secure"];
const URL_SHORTENERS = new Set(["bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "buff.ly"]);

export async function analyzeUrl(rawUrl: string): Promise<{
  normalizedUrl: string;
  domain: string;
  signals: DeterministicSignals;
}> {
  // Normalization
  let normalizedUrl = rawUrl.trim();
  if (!/^https?:\/\//i.test(normalizedUrl)) {
    normalizedUrl = `http://${normalizedUrl}`;
  }

  // Ensure it's valid immediately, or throw
  if (!URL.canParse(normalizedUrl)) {
      throw new Error("Invalid URL format");
  }
  const urlObj = new URL(normalizedUrl);
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
  
  const timeline: { step: string; status: "Pending" | "Scanning" | "Completed" | "Warning" | "Unavailable" }[] = [
    { step: "URL Received", status: "Completed" },
    { step: "URL Normalization", status: "Completed" }
  ];

  const subdomains = domainParts.length > 2 ? domainParts.slice(0, domainParts.length - 2) : [];
  const rootDomain = domainParts.length > 1 ? domainParts[domainParts.length - 2] + tld : hostname;

  // URL Forensics Checks
  const checks: { name: string; status: "CLEAN" | "WARNING" | "HIGH RISK"; explanation: string; }[] = [];
  
  if (hasSSL) {
    checks.push({ name: "Protocol", status: "CLEAN", explanation: "Uses secure HTTPS protocol." });
  } else {
    checks.push({ name: "Protocol", status: "HIGH RISK", explanation: "Uses unencrypted HTTP protocol." });
  }

  if (rawUrl.length > 100) {
    checks.push({ name: "URL Length", status: "WARNING", explanation: `URL is unusually long (${rawUrl.length} characters).` });
  } else {
    checks.push({ name: "URL Length", status: "CLEAN", explanation: "Standard URL length." });
  }

  if (rawUrl.includes("@")) {
    checks.push({ name: "Suspicious Characters", status: "HIGH RISK", explanation: "Contains '@' symbol, which can be used to obfuscate the true destination." });
  } else if (/%[0-9a-f]{2}/i.test(rawUrl)) {
    checks.push({ name: "Suspicious Characters", status: "WARNING", explanation: "Contains URL-encoded characters often used to hide malicious payloads." });
  } else {
    checks.push({ name: "Suspicious Characters", status: "CLEAN", explanation: "No obfuscation characters detected." });
  }

  if (isIpHostname) {
    checks.push({ name: "Hostname", status: "HIGH RISK", explanation: "Uses an IP address instead of a domain name." });
  } else {
    checks.push({ name: "Hostname", status: "CLEAN", explanation: "Standard domain name format." });
  }

  if (subdomainCount >= 3) {
    checks.push({ name: "Subdomains", status: "HIGH RISK", explanation: `Excessive subdomains (${subdomainCount}) often used in phishing.` });
  } else {
    checks.push({ name: "Subdomains", status: "CLEAN", explanation: "Normal subdomain structure." });
  }

  if (hasPunycode) {
    checks.push({ name: "Homograph/Punycode", status: "HIGH RISK", explanation: "Uses internationalized characters to mimic legitimate domains." });
  } else {
    checks.push({ name: "Homograph/Punycode", status: "CLEAN", explanation: "Standard ASCII characters." });
  }
  
  timeline.push({ step: "URL Forensics", status: "Completed" });

  // Brand / Phishing Analysis
  let brandPattern: string | null = null;
  let brandConfidence = 0;
  let brandNotes = "No major brand similarity detected.";

  if (hasPhishingKeywords) {
    brandPattern = "Brand Keyword in Subdomain/Path";
    brandConfidence = 85;
    brandNotes = "Misleading use of security or brand keywords found in the URL structure.";
  } else if (hasPunycode) {
    brandPattern = "Unicode Substitution (Homograph)";
    brandConfidence = 95;
    brandNotes = "Detected attempt to visually spoof a domain using non-standard characters.";
  } else if (rootDomain.includes("-") && URL_SHORTENERS.has(hostname.toLowerCase()) === false) {
    // Simple heuristic for hyphenated domains targeting brands (e.g. secure-paypal.com)
    brandPattern = "Hyphenated Typosquatting";
    brandConfidence = 60;
    brandNotes = "Uses hyphens, a common tactic to bypass basic filter rules.";
  }
  timeline.push({ step: "Brand/Phishing Analysis", status: "Completed" });
  timeline.push({ step: "Threat Intelligence", status: "Scanning" });

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
      baseScore,
      urlForensics: {
        protocol: urlObj.protocol.replace(":", ""),
        subdomains,
        domain: rootDomain,
        tld,
        path: urlObj.pathname,
        query: urlObj.search,
        checks
      },
      brandAnalysis: {
        detectedPattern: brandPattern,
        confidence: brandConfidence,
        notes: brandNotes
      },
      timeline
    }
  };
}
