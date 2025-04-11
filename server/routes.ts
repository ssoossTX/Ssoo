import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create a guest user for basic gameplay without registration
  // This is a temporary solution for the demo
  const createGuestUser = async () => {
    try {
      const guestUser = await storage.getUserByUsername("guest");
      if (!guestUser) {
        await storage.createUser({ username: "guest", password: "guest123" });
      }
    } catch (error) {
      console.error("Error creating guest user:", error);
    }
  };

  // Create a guest user on server start
  await createGuestUser();

  // Get the initial game state
  app.get("/api/game", async (req, res) => {
    try {
      const guestUser = await storage.getUserByUsername("guest");
      
      if (!guestUser) {
        return res.status(404).json({ message: "Guest user not found" });
      }
      
      const gameState = await storage.getGameState(guestUser.id);
      const upgrades = await storage.getUpgrades(guestUser.id);
      const achievements = await storage.getAchievements(guestUser.id);
      
      res.json({ gameState, upgrades, achievements });
    } catch (error) {
      res.status(500).json({ message: "Failed to load game state" });
    }
  });

  // Handle a click
  app.post("/api/click", async (req, res) => {
    try {
      const guestUser = await storage.getUserByUsername("guest");
      
      if (!guestUser) {
        return res.status(404).json({ message: "Guest user not found" });
      }
      
      const result = await (storage as any).handleClick(guestUser.id);
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to handle click" });
    }
  });

  // Purchase an upgrade
  app.post("/api/upgrade", async (req, res) => {
    try {
      const schema = z.object({
        upgradeId: z.string()
      });
      
      const { upgradeId } = schema.parse(req.body);
      
      const guestUser = await storage.getUserByUsername("guest");
      
      if (!guestUser) {
        return res.status(404).json({ message: "Guest user not found" });
      }
      
      const result = await storage.purchaseUpgrade(guestUser.id, upgradeId);
      
      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }
      
      res.json({ 
        gameState: result.gameState,
        upgrades: result.upgrades
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to purchase upgrade" });
    }
  });

  // Auto-update game state (for passive income)
  app.post("/api/update", async (req, res) => {
    try {
      const guestUser = await storage.getUserByUsername("guest");
      
      if (!guestUser) {
        return res.status(404).json({ message: "Guest user not found" });
      }
      
      const gameState = await storage.getGameState(guestUser.id);
      
      if (!gameState) {
        return res.status(404).json({ message: "Game state not found" });
      }
      
      // Calculate passive income since last update
      const schema = z.object({
        lastUpdate: z.number()
      });
      
      const { lastUpdate } = schema.parse(req.body);
      const now = Date.now();
      const timeDiff = (now - lastUpdate) / 1000; // in seconds
      
      // Only update if there's passive income
      if (gameState.perSecond > 0) {
        const passiveIncome = gameState.perSecond * timeDiff;
        const updatedScore = gameState.score + passiveIncome;
        
        // Check level progress
        const currentLevel = gameState.level;
        const nextLevelThreshold = Math.pow(currentLevel, 1.5) * 100;
        let updatedLevel = currentLevel;
        let updatedClickValue = gameState.clickValue;
        
        if (updatedScore >= nextLevelThreshold) {
          updatedLevel = currentLevel + 1;
          updatedClickValue = Math.floor(gameState.clickValue * 1.2);
        }
        
        const updatedState = await storage.updateGameState(guestUser.id, {
          score: updatedScore,
          level: updatedLevel,
          clickValue: updatedClickValue
        });
        
        // Check for achievements
        const achievements = await storage.checkAndUpdateAchievements(guestUser.id);
        
        res.json({ 
          gameState: updatedState,
          lastUpdate: now
        });
      } else {
        res.json({ 
          gameState,
          lastUpdate: now
        });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to update game state" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
