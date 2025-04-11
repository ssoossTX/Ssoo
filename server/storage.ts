import { 
  users, User, InsertUser, 
  gameStates, GameState, InsertGameState,
  upgrades, Upgrade, InsertUpgrade,
  achievements, Achievement, InsertAchievement,
  GameData, UpgradeItem, AchievementItem, UpgradeType
} from "@shared/schema";

// Define the upgrade constants
const UPGRADE_DATA: Record<string, Omit<UpgradeItem, 'count'>> = {
  basicTapper: {
    id: 'basicTapper',
    type: 'autoTapper',
    name: 'Basic Tapper',
    description: 'Generates 0.1 taps per second',
    cost: 10,
    baseValue: 0.1,
    icon: 'ri-mouse-line'
  },
  fastTapper: {
    id: 'fastTapper',
    type: 'autoTapper',
    name: 'Fast Tapper',
    description: 'Generates 0.5 taps per second',
    cost: 50,
    baseValue: 0.5,
    icon: 'ri-speed-up-line'
  },
  autoClicker: {
    id: 'autoClicker',
    type: 'autoTapper',
    name: 'Auto Clicker',
    description: 'Generates 2 taps per second',
    cost: 200,
    baseValue: 2,
    icon: 'ri-robot-line'
  },
  tapFarm: {
    id: 'tapFarm',
    type: 'autoTapper',
    name: 'Tap Farm',
    description: 'Generates 10 taps per second',
    cost: 1000,
    baseValue: 10,
    icon: 'ri-server-line'
  }
};

// Define the achievement constants
const ACHIEVEMENT_DATA: Record<string, Omit<AchievementItem, 'unlocked'>> = {
  firstClick: {
    id: 'firstClick',
    name: 'First Click',
    description: 'Click for the first time',
    icon: 'ri-trophy-line'
  },
  hundredClicks: {
    id: 'hundredClicks',
    name: '100 Clicks',
    description: 'Click 100 times',
    icon: 'ri-medal-line'
  },
  firstUpgrade: {
    id: 'firstUpgrade',
    name: 'First Upgrade',
    description: 'Purchase your first upgrade',
    icon: 'ri-vip-crown-line'
  },
  levelFive: {
    id: 'levelFive',
    name: 'Level 5',
    description: 'Reach level 5',
    icon: 'ri-rocket-line'
  },
  tenCps: {
    id: 'tenCps',
    name: '10 CPS',
    description: 'Generate 10 clicks per second',
    icon: 'ri-light-bulb-line'
  }
};

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Game state operations
  getGameState(userId: number): Promise<GameData | undefined>;
  createGameState(userId: number): Promise<GameData>;
  updateGameState(userId: number, gameData: Partial<GameData>): Promise<GameData>;
  
  // Upgrade operations
  getUpgrades(userId: number): Promise<UpgradeItem[]>;
  purchaseUpgrade(userId: number, upgradeId: string): Promise<{ success: boolean; message?: string; gameState?: GameData; upgrades?: UpgradeItem[] }>;
  
  // Achievement operations
  getAchievements(userId: number): Promise<AchievementItem[]>;
  checkAndUpdateAchievements(userId: number): Promise<AchievementItem[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private gameStates: Map<number, GameData>;
  private userUpgrades: Map<number, Map<string, number>>;
  private userAchievements: Map<number, Map<string, boolean>>;
  private userClickCount: Map<number, number>;
  currentId: number;

  constructor() {
    this.users = new Map();
    this.gameStates = new Map();
    this.userUpgrades = new Map();
    this.userAchievements = new Map();
    this.userClickCount = new Map();
    this.currentId = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    
    // Initialize game state for the new user
    await this.createGameState(id);
    
    return user;
  }

  // Game state operations
  async getGameState(userId: number): Promise<GameData | undefined> {
    return this.gameStates.get(userId);
  }

  async createGameState(userId: number): Promise<GameData> {
    const initialState: GameData = {
      score: 0,
      perSecond: 0,
      level: 1,
      clickValue: 1
    };
    
    this.gameStates.set(userId, initialState);
    this.userUpgrades.set(userId, new Map());
    this.userAchievements.set(userId, new Map());
    this.userClickCount.set(userId, 0);
    
    // Initialize achievements
    const achievements = Object.keys(ACHIEVEMENT_DATA);
    const userAchievements = this.userAchievements.get(userId)!;
    
    for (const achievementId of achievements) {
      userAchievements.set(achievementId, false);
    }
    
    return initialState;
  }

  async updateGameState(userId: number, gameData: Partial<GameData>): Promise<GameData> {
    const currentState = await this.getGameState(userId);
    
    if (!currentState) {
      throw new Error(`Game state not found for user ${userId}`);
    }
    
    const updatedState: GameData = {
      ...currentState,
      ...gameData
    };
    
    this.gameStates.set(userId, updatedState);
    
    // Check for achievements
    await this.checkAndUpdateAchievements(userId);
    
    return updatedState;
  }

  // Upgrade operations
  async getUpgrades(userId: number): Promise<UpgradeItem[]> {
    const userUpgrades = this.userUpgrades.get(userId);
    
    if (!userUpgrades) {
      return [];
    }
    
    return Object.entries(UPGRADE_DATA).map(([upgradeId, upgradeData]) => {
      return {
        ...upgradeData,
        count: userUpgrades.get(upgradeId) || 0
      };
    });
  }

  async purchaseUpgrade(
    userId: number, 
    upgradeId: string
  ): Promise<{ 
    success: boolean; 
    message?: string; 
    gameState?: GameData; 
    upgrades?: UpgradeItem[] 
  }> {
    const gameState = await this.getGameState(userId);
    
    if (!gameState) {
      return { success: false, message: 'Game state not found' };
    }
    
    const upgradeData = UPGRADE_DATA[upgradeId];
    
    if (!upgradeData) {
      return { success: false, message: 'Upgrade not found' };
    }
    
    const userUpgrades = this.userUpgrades.get(userId)!;
    const currentCount = userUpgrades.get(upgradeId) || 0;
    const cost = Math.floor(upgradeData.cost * Math.pow(1.15, currentCount));
    
    if (gameState.score < cost) {
      return { success: false, message: 'Not enough points' };
    }
    
    // Update the game state
    const updatedScore = gameState.score - cost;
    let updatedPerSecond = gameState.perSecond;
    
    if (upgradeData.type === 'autoTapper') {
      updatedPerSecond += upgradeData.baseValue;
    }
    
    const updatedState = await this.updateGameState(userId, {
      score: updatedScore,
      perSecond: updatedPerSecond
    });
    
    // Update the upgrade count
    userUpgrades.set(upgradeId, currentCount + 1);
    
    // Check for achievements
    const achievements = await this.checkAndUpdateAchievements(userId);
    
    // First upgrade achievement
    if (currentCount === 0) {
      const userAchievements = this.userAchievements.get(userId)!;
      userAchievements.set('firstUpgrade', true);
    }
    
    // 10 CPS achievement
    if (updatedPerSecond >= 10 && gameState.perSecond < 10) {
      const userAchievements = this.userAchievements.get(userId)!;
      userAchievements.set('tenCps', true);
    }
    
    const upgrades = await this.getUpgrades(userId);
    
    return { 
      success: true, 
      gameState: updatedState,
      upgrades
    };
  }

  // Achievement operations
  async getAchievements(userId: number): Promise<AchievementItem[]> {
    const userAchievements = this.userAchievements.get(userId);
    
    if (!userAchievements) {
      return [];
    }
    
    return Object.entries(ACHIEVEMENT_DATA).map(([achievementId, achievementData]) => {
      return {
        ...achievementData,
        unlocked: userAchievements.get(achievementId) || false
      };
    });
  }

  async checkAndUpdateAchievements(userId: number): Promise<AchievementItem[]> {
    const gameState = await this.getGameState(userId);
    const userAchievements = this.userAchievements.get(userId);
    
    if (!gameState || !userAchievements) {
      return [];
    }
    
    // Level 5 achievement
    if (gameState.level >= 5) {
      userAchievements.set('levelFive', true);
    }
    
    return this.getAchievements(userId);
  }

  // Handle click
  async handleClick(userId: number): Promise<{ 
    gameState: GameData; 
    newAchievements: AchievementItem[] 
  }> {
    const gameState = await this.getGameState(userId);
    
    if (!gameState) {
      throw new Error(`Game state not found for user ${userId}`);
    }
    
    // Increment click count
    const clickCount = this.userClickCount.get(userId) || 0;
    this.userClickCount.set(userId, clickCount + 1);
    
    // Update score
    const updatedScore = gameState.score + gameState.clickValue;
    
    // Check level progress
    const currentLevel = gameState.level;
    const nextLevelThreshold = Math.pow(currentLevel, 1.5) * 100;
    let updatedLevel = currentLevel;
    let updatedClickValue = gameState.clickValue;
    
    if (updatedScore >= nextLevelThreshold) {
      updatedLevel = currentLevel + 1;
      updatedClickValue = Math.floor(gameState.clickValue * 1.2);
    }
    
    const updatedState = await this.updateGameState(userId, {
      score: updatedScore,
      level: updatedLevel,
      clickValue: updatedClickValue
    });
    
    // Check for achievements
    const userAchievements = this.userAchievements.get(userId)!;
    const previousAchievements = await this.getAchievements(userId);
    
    // First click achievement
    if (clickCount === 0) {
      userAchievements.set('firstClick', true);
    }
    
    // 100 clicks achievement
    if (clickCount + 1 >= 100) {
      userAchievements.set('hundredClicks', true);
    }
    
    const currentAchievements = await this.getAchievements(userId);
    
    // Find newly unlocked achievements
    const newAchievements = currentAchievements.filter(
      achievement => achievement.unlocked && 
      !previousAchievements.find(a => a.id === achievement.id)?.unlocked
    );
    
    return {
      gameState: updatedState,
      newAchievements
    };
  }
}

import { db } from './db';
import { eq, and, sql } from 'drizzle-orm';

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    
    // Инициализируем игровое состояние для нового пользователя
    await this.createGameState(user.id);
    
    return user;
  }

  // Game state operations
  async getGameState(userId: number): Promise<GameData | undefined> {
    const [gameStateRecord] = await db
      .select()
      .from(gameStates)
      .where(eq(gameStates.userId, userId));
    
    if (!gameStateRecord) return undefined;
    
    return {
      score: gameStateRecord.score,
      perSecond: gameStateRecord.perSecond,
      level: gameStateRecord.level,
      clickValue: gameStateRecord.clickValue
    };
  }

  async createGameState(userId: number): Promise<GameData> {
    const initialState = {
      userId,
      score: 0,
      perSecond: 0,
      level: 1,
      clickValue: 1
    };
    
    const [gameStateRecord] = await db
      .insert(gameStates)
      .values(initialState)
      .returning();
    
    // Инициализируем улучшения
    await this.initializeUpgrades(gameStateRecord.id);
    
    // Инициализируем достижения
    await this.initializeAchievements(gameStateRecord.id);
    
    return {
      score: gameStateRecord.score,
      perSecond: gameStateRecord.perSecond,
      level: gameStateRecord.level,
      clickValue: gameStateRecord.clickValue
    };
  }

  async updateGameState(userId: number, gameData: Partial<GameData>): Promise<GameData> {
    const [gameStateRecord] = await db
      .select()
      .from(gameStates)
      .where(eq(gameStates.userId, userId));
    
    if (!gameStateRecord) {
      throw new Error(`Игровое состояние не найдено для пользователя ${userId}`);
    }
    
    const [updatedGameState] = await db
      .update(gameStates)
      .set(gameData)
      .where(eq(gameStates.userId, userId))
      .returning();
    
    // Проверяем достижения
    await this.checkAndUpdateAchievements(userId);
    
    return {
      score: updatedGameState.score,
      perSecond: updatedGameState.perSecond,
      level: updatedGameState.level,
      clickValue: updatedGameState.clickValue
    };
  }

  // Дополнительные методы для инициализации
  private async initializeUpgrades(gameStateId: number): Promise<void> {
    const upgradeIds = Object.keys(UPGRADE_DATA);
    
    // Добавляем все доступные улучшения для пользователя с нулевым счетчиком
    for (const upgradeId of upgradeIds) {
      const upgradeData = UPGRADE_DATA[upgradeId];
      await db.insert(upgrades).values({
        gameStateId,
        upgradeId,
        type: upgradeData.type,
        count: 0
      });
    }
  }

  private async initializeAchievements(gameStateId: number): Promise<void> {
    const achievementIds = Object.keys(ACHIEVEMENT_DATA);
    
    // Добавляем все достижения для пользователя как не разблокированные
    for (const achievementId of achievementIds) {
      await db.insert(achievements).values({
        gameStateId,
        achievementId,
        unlocked: false
      });
    }
  }

  // Upgrade operations
  async getUpgrades(userId: number): Promise<UpgradeItem[]> {
    const [gameStateRecord] = await db
      .select()
      .from(gameStates)
      .where(eq(gameStates.userId, userId));
    
    if (!gameStateRecord) return [];
    
    const gameStateId = gameStateRecord.id;
    
    const userUpgrades = await db
      .select()
      .from(upgrades)
      .where(eq(upgrades.gameStateId, gameStateId));
    
    return Object.entries(UPGRADE_DATA).map(([upgradeId, upgradeData]) => {
      const userUpgrade = userUpgrades.find(u => u.upgradeId === upgradeId);
      return {
        ...upgradeData,
        count: userUpgrade?.count || 0
      };
    });
  }

  async purchaseUpgrade(
    userId: number, 
    upgradeId: string
  ): Promise<{ 
    success: boolean; 
    message?: string; 
    gameState?: GameData; 
    upgrades?: UpgradeItem[] 
  }> {
    const gameState = await this.getGameState(userId);
    
    if (!gameState) {
      return { success: false, message: 'Игровое состояние не найдено' };
    }
    
    const upgradeData = UPGRADE_DATA[upgradeId];
    
    if (!upgradeData) {
      return { success: false, message: 'Улучшение не найдено' };
    }
    
    const [gameStateRecord] = await db
      .select()
      .from(gameStates)
      .where(eq(gameStates.userId, userId));
    
    const gameStateId = gameStateRecord.id;
    
    const [userUpgrade] = await db
      .select()
      .from(upgrades)
      .where(and(
        eq(upgrades.gameStateId, gameStateId),
        eq(upgrades.upgradeId, upgradeId)
      ));
    
    const currentCount = userUpgrade?.count || 0;
    const cost = Math.floor(upgradeData.cost * Math.pow(1.15, currentCount));
    
    if (gameState.score < cost) {
      return { success: false, message: 'Недостаточно очков' };
    }
    
    // Обновляем игровое состояние
    const updatedScore = gameState.score - cost;
    let updatedPerSecond = gameState.perSecond;
    
    if (upgradeData.type === 'autoTapper') {
      updatedPerSecond += upgradeData.baseValue;
    }
    
    const updatedState = await this.updateGameState(userId, {
      score: updatedScore,
      perSecond: updatedPerSecond
    });
    
    // Обновляем счетчик улучшения
    await db
      .update(upgrades)
      .set({ count: userUpgrade.count + 1 })
      .where(and(
        eq(upgrades.gameStateId, gameStateId),
        eq(upgrades.upgradeId, upgradeId)
      ));
    
    // Проверяем достижения
    
    // Первое улучшение
    if (currentCount === 0) {
      await this.unlockAchievement(gameStateId, 'firstUpgrade');
    }
    
    // 10 CPS достижение
    if (updatedPerSecond >= 10 && gameState.perSecond < 10) {
      await this.unlockAchievement(gameStateId, 'tenCps');
    }
    
    const upgrades = await this.getUpgrades(userId);
    
    return { 
      success: true, 
      gameState: updatedState,
      upgrades
    };
  }

  // Achievement operations
  async getAchievements(userId: number): Promise<AchievementItem[]> {
    const [gameStateRecord] = await db
      .select()
      .from(gameStates)
      .where(eq(gameStates.userId, userId));
    
    if (!gameStateRecord) return [];
    
    const gameStateId = gameStateRecord.id;
    
    const userAchievements = await db
      .select()
      .from(achievements)
      .where(eq(achievements.gameStateId, gameStateId));
    
    return Object.entries(ACHIEVEMENT_DATA).map(([achievementId, achievementData]) => {
      const userAchievement = userAchievements.find(a => a.achievementId === achievementId);
      return {
        ...achievementData,
        unlocked: userAchievement?.unlocked || false
      };
    });
  }

  async checkAndUpdateAchievements(userId: number): Promise<AchievementItem[]> {
    const gameState = await this.getGameState(userId);
    
    if (!gameState) {
      return [];
    }
    
    const [gameStateRecord] = await db
      .select()
      .from(gameStates)
      .where(eq(gameStates.userId, userId));
    
    if (!gameStateRecord) return [];
    
    const gameStateId = gameStateRecord.id;
    
    // Достижение Уровень 5
    if (gameState.level >= 5) {
      await this.unlockAchievement(gameStateId, 'levelFive');
    }
    
    return this.getAchievements(userId);
  }
  
  private async unlockAchievement(gameStateId: number, achievementId: string): Promise<void> {
    await db
      .update(achievements)
      .set({ 
        unlocked: true,
        unlockedAt: new Date().toISOString()
      })
      .where(and(
        eq(achievements.gameStateId, gameStateId),
        eq(achievements.achievementId, achievementId)
      ));
  }

  // Handle click
  async handleClick(userId: number): Promise<{ 
    gameState: GameData; 
    newAchievements: AchievementItem[] 
  }> {
    const gameState = await this.getGameState(userId);
    
    if (!gameState) {
      throw new Error(`Игровое состояние не найдено для пользователя ${userId}`);
    }
    
    const [gameStateRecord] = await db
      .select()
      .from(gameStates)
      .where(eq(gameStates.userId, userId));
    
    const gameStateId = gameStateRecord.id;
    
    // Обновляем счетчик кликов
    // Используем таблицу пользователя для хранения счетчика кликов
    // Это временное решение, в будущем можно добавить отдельную таблицу
    const [userRecord] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId));
    
    const clickCount = parseInt(userRecord.password) || 0;
    
    // Обновляем счетчик в поле password (временное решение)
    await db
      .update(users)
      .set({ password: (clickCount + 1).toString() })
      .where(eq(users.id, userId));
    
    // Получаем список текущих достижений до обновления
    const previousAchievements = await this.getAchievements(userId);
    
    // Первый клик достижение
    if (clickCount === 0) {
      await this.unlockAchievement(gameStateId, 'firstClick');
    }
    
    // 100 кликов достижение
    if (clickCount + 1 >= 100) {
      await this.unlockAchievement(gameStateId, 'hundredClicks');
    }
    
    // Обновляем счет
    const updatedScore = gameState.score + gameState.clickValue;
    
    // Проверяем прогресс уровня
    const currentLevel = gameState.level;
    const nextLevelThreshold = Math.pow(currentLevel, 1.5) * 100;
    let updatedLevel = currentLevel;
    let updatedClickValue = gameState.clickValue;
    
    if (updatedScore >= nextLevelThreshold) {
      updatedLevel = currentLevel + 1;
      updatedClickValue = Math.floor(gameState.clickValue * 1.2);
    }
    
    const updatedState = await this.updateGameState(userId, {
      score: updatedScore,
      level: updatedLevel,
      clickValue: updatedClickValue
    });
    
    // Получаем обновленный список достижений
    const currentAchievements = await this.getAchievements(userId);
    
    // Находим новые разблокированные достижения
    const newAchievements = currentAchievements.filter(
      achievement => achievement.unlocked && 
      !previousAchievements.find(a => a.id === achievement.id)?.unlocked
    );
    
    return {
      gameState: updatedState,
      newAchievements
    };
  }
}

// Используем MemStorage для разработки, а DatabaseStorage для продакшена
// Можно будет переключиться на DatabaseStorage, когда будем готовы к использованию базы данных
// import { DatabaseStorage } from "./storage.db";
// export const storage = new DatabaseStorage();
export const storage = new MemStorage();
