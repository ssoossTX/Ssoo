import { 
  users, upgrades, achievements, gameStates, 
  type User, type InsertUser, type GameData, type UpgradeItem, type AchievementItem 
} from "@shared/schema";
import { db } from "./db";
import { eq, and, sql } from "drizzle-orm";
import { IStorage } from "./storage";

// Определяем данные для улучшений (это должно соответствовать тому, что есть в MemStorage)
const UPGRADE_DATA: Record<string, Omit<UpgradeItem, 'count'>> = {
  basicTapper: {
    id: 'basicTapper',
    type: 'autoTapper',
    name: 'Базовый кликер',
    description: 'Генерирует 0.1 кликов в секунду',
    cost: 10,
    baseValue: 0.1,
    icon: 'ri-mouse-line'
  },
  fastTapper: {
    id: 'fastTapper',
    type: 'autoTapper',
    name: 'Быстрый кликер',
    description: 'Генерирует 0.5 кликов в секунду',
    cost: 50,
    baseValue: 0.5,
    icon: 'ri-speed-up-line'
  },
  autoClicker: {
    id: 'autoClicker',
    type: 'autoTapper',
    name: 'Авто-кликер',
    description: 'Генерирует 2 клика в секунду',
    cost: 200,
    baseValue: 2,
    icon: 'ri-robot-line'
  },
  tapFarm: {
    id: 'tapFarm',
    type: 'autoTapper',
    name: 'Ферма кликов',
    description: 'Генерирует 10 кликов в секунду',
    cost: 1000,
    baseValue: 10,
    icon: 'ri-server-line'
  },
  doubleClick: {
    id: 'doubleClick',
    type: 'multiplier',
    name: 'Двойной клик',
    description: 'Увеличивает значение клика на +1',
    cost: 25,
    baseValue: 1,
    icon: 'ri-add-circle-line'
  },
  superClick: {
    id: 'superClick',
    type: 'multiplier',
    name: 'Супер клик',
    description: 'Увеличивает значение клика на +3',
    cost: 150,
    baseValue: 3,
    icon: 'ri-add-circle-fill'
  }
};

// Определяем данные для достижений
const ACHIEVEMENT_DATA: Record<string, Omit<AchievementItem, 'unlocked'>> = {
  firstClick: {
    id: 'firstClick',
    name: 'Первый клик',
    description: 'Сделать первый клик',
    icon: 'ri-trophy-line'
  },
  hundredClicks: {
    id: 'hundredClicks',
    name: '100 кликов',
    description: 'Сделать 100 кликов',
    icon: 'ri-medal-line'
  },
  firstUpgrade: {
    id: 'firstUpgrade',
    name: 'Первое улучшение',
    description: 'Купить первое улучшение',
    icon: 'ri-vip-crown-line'
  },
  levelFive: {
    id: 'levelFive',
    name: 'Уровень 5',
    description: 'Достичь 5 уровня',
    icon: 'ri-rocket-line'
  },
  tenCps: {
    id: 'tenCps',
    name: '10 CPS',
    description: 'Генерировать 10 кликов в секунду',
    icon: 'ri-light-bulb-line'
  }
};

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getGameState(userId: number): Promise<GameData | undefined> {
    const [gameState] = await db
      .select()
      .from(gameStates)
      .where(eq(gameStates.userId, userId));

    if (!gameState) return undefined;

    return {
      score: gameState.score,
      perSecond: gameState.perSecond,
      level: gameState.level,
      clickValue: gameState.clickValue
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

    const [gameState] = await db
      .insert(gameStates)
      .values(initialState)
      .returning();

    // Создаем начальные улучшения для пользователя
    await this.initializeUserUpgrades(userId);
    // Создаем начальные достижения для пользователя
    await this.initializeUserAchievements(userId);

    return {
      score: gameState.score,
      perSecond: gameState.perSecond,
      level: gameState.level,
      clickValue: gameState.clickValue
    };
  }

  async updateGameState(userId: number, gameData: Partial<GameData>): Promise<GameData> {
    const [updatedGameState] = await db
      .update(gameStates)
      .set(gameData)
      .where(eq(gameStates.userId, userId))
      .returning();

    return {
      score: updatedGameState.score,
      perSecond: updatedGameState.perSecond,
      level: updatedGameState.level,
      clickValue: updatedGameState.clickValue
    };
  }

  async getUpgrades(userId: number): Promise<UpgradeItem[]> {
    // Сначала нужно получить gameStateId
    const [gameState] = await db
      .select()
      .from(gameStates)
      .where(eq(gameStates.userId, userId));

    if (!gameState) return [];

    // Теперь получаем все улучшения для этого gameStateId
    const userUpgrades = await db
      .select()
      .from(upgrades)
      .where(eq(upgrades.gameStateId, gameState.id));

    // Трансформируем данные из БД в формат, ожидаемый фронтендом
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
    upgrades?: UpgradeItem[];
  }> {
    // Получаем текущее состояние игры
    const [gameState] = await db
      .select()
      .from(gameStates)
      .where(eq(gameStates.userId, userId));

    if (!gameState) {
      return { success: false, message: "Игровое состояние не найдено" };
    }

    // Получаем информацию об улучшении из константных данных
    const upgradeData = UPGRADE_DATA[upgradeId];
    if (!upgradeData) {
      return { success: false, message: "Улучшение не найдено" };
    }

    // Получаем текущее количество этого улучшения у пользователя
    const [userUpgrade] = await db
      .select()
      .from(upgrades)
      .where(and(
        eq(upgrades.gameStateId, gameState.id),
        eq(upgrades.upgradeId, upgradeId)
      ));

    if (!userUpgrade) {
      return { success: false, message: "Улучшение не найдено для пользователя" };
    }

    // Рассчитываем стоимость с учётом количества уже купленных улучшений
    const actualCost = Math.floor(upgradeData.cost * Math.pow(1.15, userUpgrade.count));

    // Проверяем, может ли пользователь позволить себе улучшение
    if (gameState.score < actualCost) {
      return { success: false, message: "Недостаточно очков" };
    }

    // Обновляем баланс пользователя
    const newScore = gameState.score - actualCost;
    
    // Обновляем игровые показатели в зависимости от типа улучшения
    let newPerSecond = gameState.perSecond;
    let newClickValue = gameState.clickValue;

    if (upgradeData.type === 'autoTapper') {
      newPerSecond += upgradeData.baseValue;
    } else if (upgradeData.type === 'multiplier') {
      newClickValue += upgradeData.baseValue;
    }
    // Тип 'special' обрабатывается отдельно (не реализовано пока)

    // Обновляем данные в базе
    const [updatedGameState] = await db
      .update(gameStates)
      .set({ 
        score: newScore,
        perSecond: newPerSecond,
        clickValue: newClickValue
      })
      .where(eq(gameStates.userId, userId))
      .returning();

    // Увеличиваем счетчик купленных улучшений
    await db
      .update(upgrades)
      .set({ count: userUpgrade.count + 1 })
      .where(and(
        eq(upgrades.gameStateId, gameState.id),
        eq(upgrades.upgradeId, upgradeId)
      ));

    // Проверяем достижения связанные с покупкой улучшений
    // Например, достижение за первое купленное улучшение
    if (userUpgrade.count === 0) {
      const [firstUpgradeAchievement] = await db
        .select()
        .from(achievements)
        .where(and(
          eq(achievements.gameStateId, gameState.id),
          eq(achievements.achievementId, 'firstUpgrade')
        ));

      if (firstUpgradeAchievement && !firstUpgradeAchievement.unlocked) {
        await db
          .update(achievements)
          .set({ unlocked: true, unlockedAt: new Date().toISOString() })
          .where(and(
            eq(achievements.gameStateId, gameState.id),
            eq(achievements.achievementId, 'firstUpgrade')
          ));
      }
    }

    // Получаем обновленный список улучшений
    const updatedUpgrades = await this.getUpgrades(userId);

    return {
      success: true,
      gameState: {
        score: updatedGameState.score,
        perSecond: updatedGameState.perSecond,
        level: updatedGameState.level,
        clickValue: updatedGameState.clickValue
      },
      upgrades: updatedUpgrades
    };
  }

  async getAchievements(userId: number): Promise<AchievementItem[]> {
    // Сначала нужно получить gameStateId
    const [gameState] = await db
      .select()
      .from(gameStates)
      .where(eq(gameStates.userId, userId));

    if (!gameState) return [];

    // Теперь получаем все достижения для этого gameStateId
    const userAchievements = await db
      .select()
      .from(achievements)
      .where(eq(achievements.gameStateId, gameState.id));

    // Трансформируем данные из БД в формат, ожидаемый фронтендом
    return Object.entries(ACHIEVEMENT_DATA).map(([achievementId, achievementData]) => {
      const userAchievement = userAchievements.find(a => a.achievementId === achievementId);
      return {
        ...achievementData,
        unlocked: userAchievement?.unlocked || false
      };
    });
  }

  async checkAndUpdateAchievements(userId: number): Promise<AchievementItem[]> {
    // Получаем текущее состояние игры и достижения пользователя
    const [gameState] = await db
      .select()
      .from(gameStates)
      .where(eq(gameStates.userId, userId));

    if (!gameState) return [];

    // Получаем все достижения для этого gameStateId
    const userAchievements = await db
      .select()
      .from(achievements)
      .where(eq(achievements.gameStateId, gameState.id));

    if (!userAchievements.length) return [];

    const newAchievements: AchievementItem[] = [];

    // Проверяем условия для разблокировки достижений
    for (const achievementPair of Object.entries(ACHIEVEMENT_DATA)) {
      const [achievementId, achievementData] = achievementPair;
      const userAchievement = userAchievements.find(a => a.achievementId === achievementId);
      
      if (!userAchievement || userAchievement.unlocked) continue;

      let shouldUnlock = false;

      // Проверка условий разблокировки достижений
      if (achievementId === 'firstClick' && gameState.score > 0) {
        shouldUnlock = true;
      }
      else if (achievementId === 'hundredClicks' && gameState.score >= 100) {
        shouldUnlock = true;
      }
      else if (achievementId === 'levelFive' && gameState.level >= 5) {
        shouldUnlock = true;
      }
      else if (achievementId === 'tenCps' && gameState.perSecond >= 10) {
        shouldUnlock = true;
      }

      if (shouldUnlock) {
        // Разблокируем достижение в базе данных
        await db
          .update(achievements)
          .set({ unlocked: true, unlockedAt: new Date().toISOString() })
          .where(and(
            eq(achievements.gameStateId, gameState.id),
            eq(achievements.achievementId, achievementId)
          ));

        newAchievements.push({
          ...achievementData,
          unlocked: true
        });
      }
    }

    return newAchievements;
  }

  // Вспомогательный метод для инициализации улучшений пользователя
  private async initializeUserUpgrades(userId: number): Promise<void> {
    // Сначала получаем gameStateId для этого пользователя
    const [gameState] = await db
      .select()
      .from(gameStates)
      .where(eq(gameStates.userId, userId));

    if (!gameState) return;

    // Подготавливаем улучшения для вставки в базу данных
    const initialUpgrades = Object.entries(UPGRADE_DATA).map(([upgradeId, upgradeData]) => ({
      gameStateId: gameState.id,
      upgradeId,
      type: upgradeData.type,
      count: 0
    }));

    await db.insert(upgrades).values(initialUpgrades);
  }

  // Вспомогательный метод для инициализации достижений пользователя
  private async initializeUserAchievements(userId: number): Promise<void> {
    // Сначала получаем gameStateId для этого пользователя
    const [gameState] = await db
      .select()
      .from(gameStates)
      .where(eq(gameStates.userId, userId));

    if (!gameState) return;

    // Подготавливаем достижения для вставки в базу данных
    const initialAchievements = Object.entries(ACHIEVEMENT_DATA).map(([achievementId, achievementData]) => ({
      gameStateId: gameState.id,
      achievementId,
      unlocked: false
    }));

    await db.insert(achievements).values(initialAchievements);
  }
}