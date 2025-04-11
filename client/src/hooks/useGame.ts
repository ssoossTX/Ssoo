import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { GameData, UpgradeItem, AchievementItem } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

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

export function useGame(): GameState {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedUpgradeType, setSelectedUpgradeType] = useState<'autoTapper' | 'multiplier' | 'special'>('autoTapper');
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());
  const [clickSound] = useState<HTMLAudioElement | null>(null);

  // Fetch initial game state
  const { 
    data, 
    isLoading, 
    error 
  } = useQuery({
    queryKey: ['/api/game'],
    staleTime: 0, // Always fetch fresh data
  });

  // Handle click mutation
  const clickMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/click');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/game'], (oldData: any) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          gameState: data.gameState
        };
      });
      
      // Check for newly unlocked achievements
      if (data.newAchievements && data.newAchievements.length > 0) {
        data.newAchievements.forEach((achievement: AchievementItem) => {
          toast({
            title: '🏆 Achievement Unlocked!',
            description: achievement.name,
            duration: 3000,
          });
        });
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to process click',
        variant: 'destructive',
      });
    }
  });

  // Purchase upgrade mutation
  const upgradeMutation = useMutation({
    mutationFn: async (upgradeId: string) => {
      const res = await apiRequest('POST', '/api/upgrade', { upgradeId });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/game'], (oldData: any) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          gameState: data.gameState,
          upgrades: data.upgrades
        };
      });
      
      toast({
        title: 'Upgrade Purchased!',
        description: 'Your upgrade was successfully purchased.',
        duration: 2000,
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to purchase upgrade',
        variant: 'destructive',
      });
    }
  });

  // Update game state for passive income
  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/update', { lastUpdate });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/game'], (oldData: any) => {
        if (!oldData) return oldData;
        
        return {
          ...oldData,
          gameState: data.gameState
        };
      });
      
      setLastUpdate(data.lastUpdate);
    }
  });

  // Handle click
  const handleClick = useCallback(() => {
    clickMutation.mutate();
    if (clickSound) {
      clickSound.currentTime = 0;
      clickSound.play().catch(() => {
        // Ignore autoplay errors
      });
    }
  }, [clickMutation, clickSound]);

  // Purchase upgrade
  const purchaseUpgrade = useCallback((upgradeId: string) => {
    upgradeMutation.mutate(upgradeId);
  }, [upgradeMutation]);

  // Update passive income every second
  useEffect(() => {
    // Don't update if we don't have game data yet
    if (!data?.gameState || data.gameState.perSecond <= 0) return;
    
    const intervalId = setInterval(() => {
      updateMutation.mutate();
    }, 5000); // Update every 5 seconds to reduce API calls
    
    return () => clearInterval(intervalId);
  }, [data?.gameState, updateMutation]);

  return {
    gameState: data?.gameState || { score: 0, perSecond: 0, level: 1, clickValue: 1 },
    upgrades: data?.upgrades || [],
    achievements: data?.achievements || [],
    selectedUpgradeType,
    isLoading,
    error: error ? 'Failed to load game data' : null,
    lastUpdate,
    handleClick,
    purchaseUpgrade,
    setSelectedUpgradeType
  };
}
