import { useState, useEffect } from "react";
import Header from "@/components/Header";
import GameStats from "@/components/GameStats";
import LevelProgress from "@/components/LevelProgress";
import ClickArea from "@/components/ClickArea";
import UpgradesSection from "@/components/UpgradesSection";
import Achievements from "@/components/Achievements";
import Footer from "@/components/Footer";
import { useGame } from "@/hooks/useGame";

export default function Home() {
  const game = useGame();
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
    }
    return 'light';
  });

  // Toggle theme handler that will be passed to the Header component
  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Set initial theme based on system preference or stored preference
  useEffect(() => {
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, []);

  if (game.isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading game...</p>
        </div>
      </div>
    );
  }

  if (game.error) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 text-xl mb-4">Error: {game.error}</p>
          <button 
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-md"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-800 transition-colors duration-300">
      <Header theme={theme} toggleTheme={toggleTheme} />
      
      <main className="container mx-auto px-4 py-6 flex flex-col items-center">
        <GameStats 
          score={Math.floor(game.gameState.score)} 
          perSecond={game.gameState.perSecond} 
        />
        
        <LevelProgress 
          level={game.gameState.level} 
          score={game.gameState.score} 
        />
        
        <ClickArea 
          handleClick={game.handleClick} 
          clickValue={game.gameState.clickValue} 
        />
        
        <UpgradesSection 
          upgrades={game.upgrades}
          purchaseUpgrade={game.purchaseUpgrade}
          score={game.gameState.score}
          selectedUpgradeType={game.selectedUpgradeType}
          setSelectedUpgradeType={game.setSelectedUpgradeType}
        />
        
        <Achievements achievements={game.achievements} />
      </main>
      
      <Footer />
    </div>
  );
}
