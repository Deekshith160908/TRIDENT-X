export interface VirusTotalStats {
  malicious: number;
  suspicious: number;
  undetected: number;
  harmless: number;
  timeout: number;
}

export async function checkVirusTotal(url: string): Promise<VirusTotalStats | null> {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  if (!apiKey) return null;

  try {
    // VirusTotal v3 requires URL-safe base64 without padding
    const urlId = Buffer.from(url).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
    
    const response = await fetch(`https://www.virustotal.com/api/v3/urls/${urlId}`, {
      headers: {
        "x-apikey": apiKey
      }
    });

    if (!response.ok) {
      if (response.status === 404) {
        // URL not found in VT database, we can either submit it or return null
        return null;
      }
      throw new Error(`VirusTotal API error: ${response.status}`);
    }

    const data = await response.json();
    return data.data.attributes.last_analysis_stats as VirusTotalStats;
  } catch (error) {
    console.error("VirusTotal lookup failed:", error);
    return null;
  }
}
