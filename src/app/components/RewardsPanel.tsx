import { Award, Star, Trophy, Target, Zap } from "lucide-react";

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: "award" | "star" | "trophy" | "target" | "zap";
  earned: boolean;
  color: string;
}

interface RewardsPanelProps {
  points: number;
  streak: number;
  badges: Badge[];
}

export function RewardsPanel({ points, streak, badges }: RewardsPanelProps) {
  const iconMap = {
    award: Award,
    star: Star,
    trophy: Trophy,
    target: Target,
    zap: Zap,
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
      <h3 className="font-semibold text-gray-900">Your Rewards</h3>

      {/* Points & Streak */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-yellow-50 to-amber-50 rounded-lg p-3 border border-yellow-200">
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            <div>
              <p className="text-2xl font-bold text-amber-600">{points}</p>
              <p className="text-xs text-amber-700">Points</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-3 border border-orange-200">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-500" />
            <div>
              <p className="text-2xl font-bold text-orange-600">{streak}</p>
              <p className="text-xs text-orange-700">Day Streak</p>
            </div>
          </div>
        </div>
      </div>

      {/* Badges */}
      <div>
        <p className="text-sm text-gray-600 mb-2">Achievements</p>
        <div className="grid grid-cols-3 gap-2">
          {badges.map((badge) => {
            const Icon = iconMap[badge.icon];
            return (
              <div
                key={badge.id}
                className={`rounded-lg p-3 flex flex-col items-center justify-center transition-all ${
                  badge.earned
                    ? `bg-gradient-to-br ${badge.color} shadow-sm`
                    : "bg-gray-100 opacity-50"
                }`}
                title={badge.description}
              >
                <Icon
                  className={`w-6 h-6 ${
                    badge.earned ? "text-white" : "text-gray-400"
                  }`}
                />
                <p
                  className={`text-xs mt-1 text-center ${
                    badge.earned ? "text-white" : "text-gray-400"
                  }`}
                >
                  {badge.name}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
