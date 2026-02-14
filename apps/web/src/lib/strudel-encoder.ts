export function encodeStrudelUrl(code: string): string {
  if (typeof window !== "undefined") {
    const base64 = btoa(unescape(encodeURIComponent(code)));
    return `https://strudel.cc/#${encodeURIComponent(base64)}`;
  }
  
  const base64 = Buffer.from(code).toString("base64");
  return `https://strudel.cc/#${encodeURIComponent(base64)}`;
}

export function decodeStrudelUrl(url: string): string {
  const hash = url.split("#")[1];
  if (!hash) return "";
  
  if (typeof window !== "undefined") {
    const decoded = decodeURIComponent(hash);
    return decodeURIComponent(escape(atob(decoded)));
  }
  
  const decoded = decodeURIComponent(hash);
  return Buffer.from(decoded, "base64").toString("utf-8");
}

export function isValidStrudelCode(code: string): boolean {
  if (!code || typeof code !== "string") return false;
  
  const trimmed = code.trim();
  if (trimmed.length === 0) return false;
  
  const hasPattern = /[sn]\s*\(|note\s*\(|stack\s*\(|setcps|setcpm|\.cpm|\.cps/.test(trimmed);
  
  return hasPattern;
}