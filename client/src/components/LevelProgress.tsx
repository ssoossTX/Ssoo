import { Progress } from "@/components/ui/progress";

interface LevelProgressProps {
  level: number;
  score: number;
}

export default function LevelProgress({ level, score }: LevelProgressProps) {
  // Calculate progress to next level
  const nextLevelThreshold = Math.pow(level, 1.5) * 100;
  const progress = Math.min((score / nextLevelThreshold) * 100, 100);
  
  return (
    <div className="w-full max-w-md mb-6">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm text-gray-500 dark:text-gray-400">Level</span>
        <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
          {level}
        </span>
      </div>
      <Progress value={progress} className="h-2" />
    </div>
  );
}
