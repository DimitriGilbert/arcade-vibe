import { createHash } from "crypto";
import { encodingForModel, getEncoding } from "js-tiktoken";

export const getTokenCount = (
  content: string,
  tokenizer: string = "gpt-4",
): number => {
  try {
    const enc = encodingForModel(tokenizer as "gpt-4" | "gpt-3.5-turbo" | "gpt-4-turbo" | "gpt-4o");
    const tokens = enc.encode(content);
    return tokens.length;
  } catch (error) {
    console.error("Tokenization error:", error);
    const fallbackEnc = getEncoding("cl100k_base");
    const tokens = fallbackEnc.encode(content);
    return tokens.length;
  }
};

export const getSupportedTokenizers = (): string[] => {
  return ["gpt-4", "gpt-3.5-turbo", "gpt-4-turbo", "gpt-4o"];
};

export const generateContentHash = (content: string): string => {
  return createHash("sha256").update(content).digest("hex");
};
