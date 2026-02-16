import { createCipheriv, createDecipheriv, randomBytes } from "crypto";
import { env } from "@arcade-vibe/env/server";

const ENCRYPTION_KEY = env.ENCRYPTION_KEY;

export const encryptApiKey = (apiKey: string): { encrypted: string; iv: string } => {
  const iv = randomBytes(16);
  const cipher = createCipheriv("aes-256-gcm", ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(apiKey, "utf8", "hex");
  encrypted += cipher.final("hex");
  
  const authTag = cipher.getAuthTag();
  
  return {
    encrypted: `${encrypted}.${authTag.toString("hex")}`,
    iv: iv.toString("hex"),
  };
};

export const decryptApiKey = (encryptedData: string, iv: string): string => {
  const parts = encryptedData.split(".");
  if (parts.length !== 2) {
    throw new Error("Invalid encrypted data format");
  }
  const [encrypted, authTag] = parts;
  if (!encrypted || !authTag) {
    throw new Error("Invalid encrypted data format");
  }
  
  const decipher = createDecipheriv("aes-256-gcm", ENCRYPTION_KEY, Buffer.from(iv, "hex"));
  
  decipher.setAuthTag(Buffer.from(authTag, "hex"));
  
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  
  return decrypted;
};

export const maskApiKey = (apiKey: string): string => {
  if (apiKey.length < 12) {
    return "****";
  }
  
  const prefix = apiKey.substring(0, 8);
  const suffix = apiKey.substring(apiKey.length - 4);
  const maskedLength = Math.max(4, apiKey.length - 12);
  
  return `${prefix}${"*".repeat(maskedLength)}${suffix}`;
};
