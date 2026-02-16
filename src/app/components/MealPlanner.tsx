import { ChefHat, Clock, Flame, BookOpen } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "./ui/dialog";
import { useState } from "react";

interface Meal {
  id: string;
  name: string;
  time: string;
  calories: number;
  prepTime: string;
  ingredients?: string[];
  instructions?: string[];
}

interface MealPlan {
  day: string;
  meals: Meal[];
}

interface MealPlannerProps {
  weeklyPlan: MealPlan[];
}

export function MealPlanner({ weeklyPlan }: MealPlannerProps) {
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <ChefHat className="w-5 h-5 text-green-600" />
        <h3 className="font-semibold text-gray-900">Weekly Meal Plan</h3>
      </div>

      <div className="space-y-4">
        {weeklyPlan.map((dayPlan) => (
          <div key={dayPlan.day} className="border-b border-gray-200 last:border-0 pb-4 last:pb-0">
            <h4 className="font-medium text-gray-900 mb-3">{dayPlan.day}</h4>
            <div className="space-y-2">
              {dayPlan.meals.map((meal) => (
                <Dialog key={meal.id}>
                  <DialogTrigger asChild>
                    <button
                      onClick={() => setSelectedMeal(meal)}
                      className="w-full flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-left"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">{meal.name}</p>
                        <p className="text-xs text-gray-500">{meal.time}</p>
                      </div>
                      <div className="flex gap-3 items-center">
                        <div className="flex items-center gap-1">
                          <Flame className="w-3.5 h-3.5 text-orange-500" />
                          <span className="text-xs text-gray-600">{meal.calories}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-blue-500" />
                          <span className="text-xs text-gray-600">{meal.prepTime}</span>
                        </div>
                        {meal.ingredients && (
                          <BookOpen className="w-4 h-4 text-green-600" />
                        )}
                      </div>
                    </button>
                  </DialogTrigger>
                  
                  {meal.ingredients && (
                    <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <ChefHat className="w-5 h-5 text-green-600" />
                          {meal.name}
                        </DialogTitle>
                      </DialogHeader>
                      
                      <div className="space-y-4 mt-4">
                        {/* Meal Info */}
                        <div className="flex gap-4 p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-2">
                            <Flame className="w-4 h-4 text-orange-500" />
                            <span className="text-sm text-gray-700">{meal.calories} calories</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-500" />
                            <span className="text-sm text-gray-700">{meal.prepTime}</span>
                          </div>
                        </div>

                        {/* Ingredients */}
                        <div>
                          <h4 className="font-semibold text-gray-900 mb-2">Ingredients</h4>
                          <ul className="space-y-2">
                            {meal.ingredients.map((ingredient, index) => (
                              <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                                <span className="text-green-600 mt-1">•</span>
                                <span>{ingredient}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Instructions */}
                        {meal.instructions && (
                          <div>
                            <h4 className="font-semibold text-gray-900 mb-2">Instructions</h4>
                            <ol className="space-y-3">
                              {meal.instructions.map((instruction, index) => (
                                <li key={index} className="flex gap-3 text-sm text-gray-700">
                                  <span className="font-semibold text-green-600 flex-shrink-0">
                                    {index + 1}.
                                  </span>
                                  <span>{instruction}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </div>
                    </DialogContent>
                  )}
                </Dialog>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}