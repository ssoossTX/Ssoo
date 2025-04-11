interface GameStatsProps {
  score: number;
  perSecond: number;
}

export default function GameStats({ score, perSecond }: GameStatsProps) {
  return (
    <div className="w-full max-w-md mb-6 p-4 bg-white dark:bg-gray-900 rounded-lg shadow-md">
      <div className="grid grid-cols-2 gap-4">
        {/* Score Display */}
        <div className="flex flex-col items-center p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <span className="text-sm text-gray-500 dark:text-gray-400">Score</span>
          <span className="text-2xl font-mono font-bold text-indigo-600 dark:text-indigo-400">
            {score.toLocaleString()}
          </span>
        </div>
        
        {/* Per Second Display */}
        <div className="flex flex-col items-center p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
          <span className="text-sm text-gray-500 dark:text-gray-400">Per Second</span>
          <span className="text-2xl font-mono font-bold text-amber-500 dark:text-amber-400">
            {perSecond.toFixed(1)}
          </span>
        </div>
      </div>
    </div>
  );
}
