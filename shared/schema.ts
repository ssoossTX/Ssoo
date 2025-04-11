import { pgTable, text, serial, integer, boolean, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Game state table
export const gameStates = pgTable("game_states", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  score: doublePrecision("score").notNull().default(0),
  perSecond: doublePrecision("per_second").notNull().default(0),
  level: integer("level").notNull().default(1),
  clickValue: doublePrecision("click_value").notNull().default(1),
});

export const insertGameStateSchema = createInsertSchema(gameStates).omit({
  id: true
});

export type InsertGameState = z.infer<typeof insertGameStateSchema>;
export type GameState = typeof gameStates.$inferSelect;

// Upgrades table
export const upgrades = pgTable("upgrades", {
  id: serial("id").primaryKey(),
  gameStateId: integer("game_state_id").notNull().references(() => gameStates.id),
  type: text("type").notNull(), // 'autoTapper', 'multiplier', 'special'
  upgradeId: text("upgrade_id").notNull(),
  count: integer("count").notNull().default(0),
});

export const insertUpgradeSchema = createInsertSchema(upgrades).omit({
  id: true
});

export type InsertUpgrade = z.infer<typeof insertUpgradeSchema>;
export type Upgrade = typeof upgrades.$inferSelect;

// Achievements table
export const achievements = pgTable("achievements", {
  id: serial("id").primaryKey(),
  gameStateId: integer("game_state_id").notNull().references(() => gameStates.id),
  achievementId: text("achievement_id").notNull(),
  unlocked: boolean("unlocked").notNull().default(false),
  unlockedAt: text("unlocked_at"),
});

export const insertAchievementSchema = createInsertSchema(achievements).omit({
  id: true
});

export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type Achievement = typeof achievements.$inferSelect;

// These are the game data types that will be used in the frontend
export type GameData = {
  score: number;
  perSecond: number;
  level: number;
  clickValue: number;
};

export type UpgradeType = 'autoTapper' | 'multiplier' | 'special';

export type UpgradeItem = {
  id: string;
  type: UpgradeType;
  name: string;
  description: string;
  cost: number;
  baseValue: number;
  icon: string;
  count: number;
};

export type AchievementItem = {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
};
