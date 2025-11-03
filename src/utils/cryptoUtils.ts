// utils/cryptoUtils.ts

import { createCipheriv, randomBytes, createDecipheriv } from "crypto";

// Function to encrypt data
export const encryptData = (data: string, secretKey: string): string => {
  const iv = randomBytes(16); // Initialization vector
  const cipher = createCipheriv("aes-256-cbc", Buffer.from(secretKey), iv);
  let encrypted = cipher.update(data, "utf-8", "hex");
  encrypted += cipher.final("hex");
  return iv.toString("hex") + ":" + encrypted;
};

// Function to decrypt data
export const decryptData = (
  encryptedData: string,
  secretKey: string
): string => {
  const [iv, encrypted] = encryptedData.split(":");
  const decipher = createDecipheriv(
    "aes-256-cbc",
    Buffer.from(secretKey),
    Buffer.from(iv, "hex")
  );
  let decrypted = decipher.update(encrypted, "hex", "utf-8");
  decrypted += decipher.final("utf-8");
  return decrypted;
};
