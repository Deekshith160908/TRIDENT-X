import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const scans = sqliteTable("scans", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  originalUrl: text("original_url").notNull(),
  normalizedUrl: text("normalized_url").notNull(),
  domain: text("domain").notNull(),
  trustScore: integer("trust_score").notNull(),
  verdict: text("verdict").notNull(), // 'SAFE' | 'SUSPICIOUS' | 'MALICIOUS'
  deterministicSignals: text("deterministic_signals", { mode: "json" }).notNull(),
  aiAnalysis: text("ai_analysis", { mode: "json" }).notNull(),
  createdAt: text("created_at").notNull(),
});

export const insertScanSchema = createInsertSchema(scans).omit({ id: true, createdAt: true });
export type InsertScan = z.infer<typeof insertScanSchema>;
export type ScanRecord = typeof scans.$inferSelect;

export const UrlInputSchema = z.object({
  url: z.string().trim().min(3, "URL is too short").max(2048, "URL is too long"),
});

export const AiAnalysisResponseSchema = z.object({
  aiTrustScore: z.number().int().min(0).max(100),
  verdict: z.enum(["SAFE", "SUSPICIOUS", "MALICIOUS"]),
  summary: z.string(),
  threatVectors: z.array(z.object({
    name: z.string(),
    severity: z.enum(["CLEAN", "LOW", "MEDIUM", "HIGH", "CRITICAL"]),
    status: z.string(),
    evidence: z.array(z.string()),
    explanation: z.string()
  })),
  recommendations: z.array(z.string()),
  riskFactors: z.array(z.object({
    name: z.string(),
    impact: z.number(),
    severity: z.string(),
    reason: z.string(),
    evidence: z.string()
  })),
  securityEvidence: z.array(z.object({
    title: z.string(),
    evidence: z.array(z.string()),
    whyItMatters: z.string()
  })),
  confidence: z.number().min(0).max(100).default(85)
});

export type AiAnalysisResponse = z.infer<typeof AiAnalysisResponseSchema>;
