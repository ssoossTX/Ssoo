import { AchievementItem } from "@shared/schema";

interface AchievementsProps {
  achievements: AchievementItem[];
}

export default function Achievements({ achievements }: AchievementsProps) {
  return (
    <section className="w-full max-w-xl mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">Achievements</h2>
        <button className="text-sm text-indigo-600 dark:text-indigo-400">View All</button>
      </div>
      
      <div className="flex overflow-x-auto pb-4 space-x-3 hide-scrollbar">
        {achievements.map((achievement) => (
          <div key={achievement.id} className="flex-shrink-0 w-24 flex flex-col items-center">
            <div className={`w-16 h-16 rounded-full ${achievement.unlocked ? 'bg-amber-100 dark:bg-amber-900/50' : 'bg-gray-200 dark:bg-gray-700'} flex items-center justify-center mb-2`}>
              <i className={`${achievement.icon} text-2xl ${achievement.unlocked ? 'text-amber-500' : 'text-gray-400'}`}></i>
            </div>
            <span className="text-xs text-center text-gray-600 dark:text-gray-400">
              {achievement.name}
            </span>
          </div>
        ))}
        
        {achievements.length === 0 && (
          <div className="flex-shrink-0 w-full text-center py-4 text-gray-500 dark:text-gray-400">
            No achievements yet
          </div>
        )}
      </div>
    </section>
  );
}
