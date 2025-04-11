import { useState, useCallback, useEffect } from "react";
import { GameData, UpgradeItem, AchievementItem } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

// Начальное статическое состояние игры
const DEFAULT_GAME_STATE: GameData = {
  score: 0,
  perSecond: 0,
  level: 1,
  clickValue: 1
};

const DEFAULT_UPGRADES: UpgradeItem[] = [
  {
    id: "autotapper-1",
    type: "autoTapper",
    name: "Автокликер",
    description: "Кликает автоматически каждую секунду",
    cost: 10,
    baseValue: 0.1,
    icon: "⚡",
    count: 0
  },
  {
    id: "autotapper-2",
    type: "autoTapper",
    name: "Мини-робот",
    description: "Маленький робот, который помогает кликать",
    cost: 50,
    baseValue: 0.5,
    icon: "🤖",
    count: 0
  },
  {
    id: "multiplier-1",
    type: "multiplier",
    name: "Усилитель кликов",
    description: "Увеличивает стоимость каждого клика",
    cost: 25,
    baseValue: 1,
    icon: "💪",
    count: 0
  },
  {
    id: "special-1",
    type: "special",
    name: "Бонус x2",
    description: "Удваивает все клики на 30 секунд",
    cost: 100,
    baseValue: 2,
    icon: "⭐",
    count: 0
  }
];

const DEFAULT_ACHIEVEMENTS: AchievementItem[] = [
  {
    id: "first-click",
    name: "Первый клик",
    description: "Сделайте свой первый клик",
    icon: "🎯",
    unlocked: false
  },
  {
    id: "first-upgrade",
    name: "Первое улучшение",
    description: "Купите первое улучшение",
    icon: "🔧",
    unlocked: false
  },
  {
    id: "score-100",
    name: "Сотня",
    description: "Наберите 100 очков",
    icon: "💯",
    unlocked: false
  }
];

interface GameState {
  gameState: GameData;
  upgrades: UpgradeItem[];
  achievements: AchievementItem[];
  selectedUpgradeType: 'autoTapper' | 'multiplier' | 'special';
  isLoading: boolean;
  error: string | null;
  lastUpdate: number;
  handleClick: () => void;
  purchaseUpgrade: (upgradeId: string) => void;
  setSelectedUpgradeType: (type: 'autoTapper' | 'multiplier' | 'special') => void;
}

export function useStaticGame(): GameState {
  const { toast } = useToast();
  const [gameData, setGameData] = useState<GameData>({ ...DEFAULT_GAME_STATE });
  const [upgrades, setUpgrades] = useState<UpgradeItem[]>(DEFAULT_UPGRADES);
  const [achievements, setAchievements] = useState<AchievementItem[]>(DEFAULT_ACHIEVEMENTS);
  const [selectedUpgradeType, setSelectedUpgradeType] = useState<'autoTapper' | 'multiplier' | 'special'>('autoTapper');
  const [lastUpdate] = useState<number>(Date.now());

  // Обработка клика в статическом режиме
  const handleClick = useCallback(() => {
    setGameData(prevState => {
      const newScore = prevState.score + prevState.clickValue;
      
      // Проверка на достижения
      const newAchievements = [...achievements];
      
      // Проверка на первый клик
      if (!newAchievements[0].unlocked) {
        newAchievements[0].unlocked = true;
        toast({
          title: '🏆 Достижение разблокировано!',
          description: 'Первый клик',
          duration: 3000,
        });
      }
      
      // Проверка на 100 очков
      if (newScore >= 100 && !newAchievements[2].unlocked) {
        newAchievements[2].unlocked = true;
        toast({
          title: '🏆 Достижение разблокировано!',
          description: 'Сотня',
          duration: 3000,
        });
      }
      
      setAchievements(newAchievements);
      
      return {
        ...prevState,
        score: newScore,
      };
    });
  }, [achievements, toast]);
  
  // Автоматическое обновление счета от пассивного дохода
  useEffect(() => {
    if (gameData.perSecond <= 0) return;
    
    const intervalId = setInterval(() => {
      setGameData(prevState => {
        const newScore = prevState.score + (prevState.perSecond / 10); // Делим на 10, так как интервал 100мс
        
        // Проверка на достижение 100 очков
        if (newScore >= 100) {
          const newAchievements = [...achievements];
          
          if (!newAchievements[2].unlocked) {
            newAchievements[2].unlocked = true;
            setAchievements(newAchievements);
            toast({
              title: '🏆 Достижение разблокировано!',
              description: 'Сотня',
              duration: 3000,
            });
          }
        }
        
        return {
          ...prevState,
          score: newScore,
        };
      });
    }, 100);
    
    return () => clearInterval(intervalId);
  }, [gameData.perSecond, achievements, toast]);

  // Покупка улучшения в статическом режиме
  const purchaseUpgrade = useCallback((upgradeId: string) => {
    const upgradeIndex = upgrades.findIndex(upgrade => upgrade.id === upgradeId);
    
    if (upgradeIndex === -1) return;
    
    const upgrade = upgrades[upgradeIndex];
    
    if (gameData.score < upgrade.cost) {
      toast({
        title: 'Недостаточно средств',
        description: `Вам нужно еще ${upgrade.cost - gameData.score} очков`,
        variant: 'destructive',
      });
      return;
    }
    
    // Обновляем состояние игры и улучшения
    setGameData(prevState => {
      const newState = { ...prevState };
      
      // Вычитаем стоимость покупки
      newState.score -= upgrade.cost;
      
      // Применяем эффект улучшения
      if (upgrade.type === 'autoTapper') {
        newState.perSecond += upgrade.baseValue;
      } else if (upgrade.type === 'multiplier') {
        newState.clickValue += upgrade.baseValue;
      }
      
      return newState;
    });
    
    setUpgrades(prevUpgrades => {
      const newUpgrades = [...prevUpgrades];
      newUpgrades[upgradeIndex] = {
        ...newUpgrades[upgradeIndex],
        count: newUpgrades[upgradeIndex].count + 1,
        cost: Math.floor(newUpgrades[upgradeIndex].cost * 1.2) // Увеличиваем стоимость
      };
      return newUpgrades;
    });
    
    // Проверка на достижение "Первое улучшение"
    const newAchievements = [...achievements];
    if (!newAchievements[1].unlocked) {
      newAchievements[1].unlocked = true;
      setAchievements(newAchievements);
      toast({
        title: '🏆 Достижение разблокировано!',
        description: 'Первое улучшение',
        duration: 3000,
      });
    }
    
    toast({
      title: 'Улучшение куплено!',
      description: `Вы приобрели ${upgrade.name}`,
      duration: 2000,
    });
  }, [gameData.score, upgrades, achievements, toast]);

  return {
    gameState: gameData,
    upgrades,
    achievements,
    selectedUpgradeType,
    isLoading: false,
    error: null,
    lastUpdate,
    handleClick,
    purchaseUpgrade,
    setSelectedUpgradeType
  };
}