import { CalendarDays, TrendingUp, Heart } from "lucide-react";
import { Progress } from "./ui/progress";

interface WeeklyOutlookProps {
  currentWeek: number;
  weeklyGoals: {
    id: string;
    title: string;
    progress: number;
    total: number;
  }[];
  upcomingMilestones: string[];
}

export function WeeklyOutlook({
  currentWeek,
  weeklyGoals,
  upcomingMilestones,
}: WeeklyOutlookProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <CalendarDays className="w-5 h-5 text-green-600" />
        <h3 className="font-semibold text-gray-900">Week {currentWeek} Outlook</h3>
      </div>

      {/* Weekly Goals */}
      <div className="space-y-3">
        <p className="text-sm text-gray-600">This Week's Goals</p>
        {weeklyGoals.map((goal) => (
          <div key={goal.id} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">{goal.title}</span>
              <span className="text-gray-500">
                {goal.progress}/{goal.total}
              </span>
            </div>
            <Progress value={(goal.progress / goal.total) * 100} className="h-2" />
          </div>
        ))}
      </div>

      {/* Upcoming Milestones */}
      <div className="space-y-2 pt-2 border-t border-gray-200">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <p className="text-sm font-medium text-gray-700">What to Expect</p>
        </div>
        <ul className="space-y-2">
          {upcomingMilestones.map((milestone, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
              <Heart className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>{milestone}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
