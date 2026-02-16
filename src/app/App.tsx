import { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Menu, X } from "lucide-react";
import { ChatMessage } from "./components/ChatMessage";
import { RewardsPanel } from "./components/RewardsPanel";
import { WeeklyOutlook } from "./components/WeeklyOutlook";
import { GroceryList } from "./components/GroceryList";
import { MealPlanner } from "./components/MealPlanner";
import { InventoryPanel, InventoryItem } from "./components/InventoryPanel";
import { Button } from "./components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface GroceryItem {
  id: string;
  name: string;
  quantity: string;
  category: string;
  checked?: boolean;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        "Hi there! 👋 I'm your nutrition coach, and I'm here to support you on your health journey! Whether you need meal plans, grocery lists, or just some motivation - I've got you covered. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Rewards state
  const [points, setPoints] = useState(325);
  const [streak, setStreak] = useState(7);
  const [badges] = useState([
    {
      id: "1",
      name: "First Week",
      description: "Complete your first week",
      icon: "star" as const,
      earned: true,
      color: "from-yellow-400 to-amber-500",
    },
    {
      id: "2",
      name: "Healthy Habits",
      description: "Track meals for 5 days",
      icon: "target" as const,
      earned: true,
      color: "from-green-400 to-emerald-500",
    },
    {
      id: "3",
      name: "Meal Master",
      description: "Complete 3 meal plans",
      icon: "trophy" as const,
      earned: true,
      color: "from-purple-400 to-purple-500",
    },
    {
      id: "4",
      name: "Consistency King",
      description: "7-day streak",
      icon: "zap" as const,
      earned: true,
      color: "from-orange-400 to-red-500",
    },
    {
      id: "5",
      name: "Goal Getter",
      description: "Reach your first goal",
      icon: "award" as const,
      earned: false,
      color: "from-blue-400 to-indigo-500",
    },
    {
      id: "6",
      name: "30 Day Hero",
      description: "30-day streak",
      icon: "trophy" as const,
      earned: false,
      color: "from-pink-400 to-rose-500",
    },
  ]);

  // Weekly outlook
  const weeklyGoals = [
    { id: "1", title: "Meals tracked", progress: 5, total: 7 },
    { id: "2", title: "Water intake (glasses)", progress: 12, total: 14 },
    { id: "3", title: "Veggie servings", progress: 8, total: 10 },
  ];

  const upcomingMilestones = [
    "Week 2: You may notice increased energy levels",
    "Week 3: Your taste buds will start adapting to healthier foods",
    "Week 4: Congratulations! You'll hit your first month milestone",
  ];

  // Grocery list
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([
    {
      id: "1",
      name: "Spinach",
      quantity: "1 bunch",
      category: "Vegetables",
      checked: false,
    },
    {
      id: "2",
      name: "Cherry tomatoes",
      quantity: "1 pint",
      category: "Vegetables",
      checked: false,
    },
    {
      id: "3",
      name: "Bell peppers",
      quantity: "3",
      category: "Vegetables",
      checked: false,
    },
    {
      id: "4",
      name: "Chicken breast",
      quantity: "1.5 lbs",
      category: "Protein",
      checked: false,
    },
    {
      id: "5",
      name: "Salmon fillet",
      quantity: "2 pieces",
      category: "Protein",
      checked: false,
    },
    {
      id: "6",
      name: "Greek yogurt",
      quantity: "32 oz",
      category: "Dairy",
      checked: false,
    },
    {
      id: "7",
      name: "Almonds",
      quantity: "1 bag",
      category: "Nuts & Seeds",
      checked: false,
    },
    {
      id: "8",
      name: "Quinoa",
      quantity: "1 lb",
      category: "Grains",
      checked: false,
    },
    {
      id: "9",
      name: "Brown rice",
      quantity: "2 lbs",
      category: "Grains",
      checked: false,
    },
    {
      id: "10",
      name: "Blueberries",
      quantity: "1 pint",
      category: "Fruits",
      checked: false,
    },
  ]);

  // Inventory state
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([
    {
      id: "inv1",
      name: "Salmon fillet",
      quantity: 4,
      unit: "pieces",
      category: "Protein",
      plannedQuantity: 4,
    },
    {
      id: "inv2",
      name: "Chicken breast",
      quantity: 2,
      unit: "lbs",
      category: "Protein",
      plannedQuantity: 2,
    },
    {
      id: "inv3",
      name: "Greek yogurt",
      quantity: 32,
      unit: "oz",
      category: "Dairy",
      plannedQuantity: 32,
    },
    {
      id: "inv4",
      name: "Spinach",
      quantity: 1,
      unit: "bunch",
      category: "Vegetables",
      plannedQuantity: 1,
    },
    {
      id: "inv5",
      name: "Quinoa",
      quantity: 1,
      unit: "lb",
      category: "Grains",
      plannedQuantity: 1,
    },
    {
      id: "inv6",
      name: "Bell peppers",
      quantity: 3,
      unit: "pieces",
      category: "Vegetables",
      plannedQuantity: 3,
    },
    {
      id: "inv7",
      name: "Blueberries",
      quantity: 1,
      unit: "pint",
      category: "Fruits",
      plannedQuantity: 1,
    },
  ]);

  // Meal plan
  const weeklyMealPlan = [
    {
      day: "Monday",
      meals: [
        {
          id: "m1",
          name: "Greek Yogurt with Berries",
          time: "Breakfast",
          calories: 280,
          prepTime: "5 min",
          ingredients: [
            "1 cup Greek yogurt (plain, non-fat)",
            "1/2 cup mixed berries (blueberries, strawberries)",
            "1 tbsp honey",
            "2 tbsp granola",
            "1 tbsp chia seeds",
          ],
          instructions: [
            "Place Greek yogurt in a bowl",
            "Top with fresh berries",
            "Drizzle honey over the berries",
            "Sprinkle granola and chia seeds on top",
            "Serve immediately and enjoy!",
          ],
        },
        {
          id: "m2",
          name: "Grilled Chicken Salad",
          time: "Lunch",
          calories: 420,
          prepTime: "15 min",
          ingredients: [
            "6 oz grilled chicken breast",
            "2 cups mixed greens (spinach, arugula, romaine)",
            "1/2 cup cherry tomatoes, halved",
            "1/4 cucumber, sliced",
            "1/4 red onion, sliced",
            "2 tbsp balsamic vinaigrette",
            "Salt and pepper to taste",
          ],
          instructions: [
            "Season chicken breast with salt and pepper",
            "Grill chicken for 6-7 minutes per side until fully cooked",
            "Let chicken rest for 5 minutes, then slice",
            "In a large bowl, combine mixed greens, tomatoes, cucumber, and onion",
            "Top salad with sliced chicken",
            "Drizzle with balsamic vinaigrette and toss gently",
          ],
        },
        {
          id: "m3",
          name: "Salmon with Quinoa & Veggies",
          time: "Dinner",
          calories: 520,
          prepTime: "25 min",
          ingredients: [
            "6 oz salmon fillet",
            "1/2 cup quinoa (dry)",
            "1 cup broccoli florets",
            "1/2 bell pepper, sliced",
            "2 cloves garlic, minced",
            "1 tbsp olive oil",
            "1 lemon (juice and zest)",
            "Salt, pepper, and herbs (dill or parsley)",
          ],
          instructions: [
            "Rinse quinoa and cook according to package directions",
            "Preheat oven to 400°F (200°C)",
            "Place salmon on a baking sheet, drizzle with olive oil, lemon juice, and season",
            "Bake salmon for 12-15 minutes until cooked through",
            "Meanwhile, sauté broccoli and bell pepper with garlic in olive oil for 5-7 minutes",
            "Serve salmon over quinoa with sautéed vegetables on the side",
            "Garnish with fresh herbs and lemon zest",
          ],
        },
      ],
    },
    {
      day: "Tuesday",
      meals: [
        {
          id: "m4",
          name: "Oatmeal with Almonds",
          time: "Breakfast",
          calories: 310,
          prepTime: "10 min",
          ingredients: [
            "1/2 cup rolled oats",
            "1 cup almond milk",
            "1/4 cup sliced almonds",
            "1 banana, sliced",
            "1 tsp cinnamon",
            "1 tsp maple syrup",
          ],
          instructions: [
            "In a saucepan, bring almond milk to a simmer",
            "Add oats and cinnamon, reduce heat to low",
            "Cook for 5-7 minutes, stirring occasionally, until creamy",
            "Transfer to a bowl and top with banana slices",
            "Sprinkle with sliced almonds",
            "Drizzle with maple syrup and serve warm",
          ],
        },
        {
          id: "m5",
          name: "Turkey Wrap with Veggies",
          time: "Lunch",
          calories: 380,
          prepTime: "10 min",
          ingredients: [
            "1 whole wheat tortilla (10-inch)",
            "4 oz sliced turkey breast",
            "2 lettuce leaves",
            "3 slices tomato",
            "1/4 avocado, sliced",
            "2 tbsp hummus",
            "Handful of shredded carrots",
          ],
          instructions: [
            "Lay the tortilla flat on a clean surface",
            "Spread hummus evenly over the tortilla",
            "Layer turkey slices in the center",
            "Add lettuce, tomato, avocado, and carrots",
            "Fold in the sides and roll tightly from bottom to top",
            "Cut in half diagonally and serve",
          ],
        },
        {
          id: "m6",
          name: "Stir-fry Chicken with Brown Rice",
          time: "Dinner",
          calories: 490,
          prepTime: "20 min",
          ingredients: [
            "6 oz chicken breast, cubed",
            "3/4 cup brown rice (cooked)",
            "1 cup mixed vegetables (broccoli, carrots, snap peas)",
            "2 cloves garlic, minced",
            "1 tbsp ginger, grated",
            "2 tbsp low-sodium soy sauce",
            "1 tbsp sesame oil",
            "1 tsp cornstarch",
          ],
          instructions: [
            "Cook brown rice according to package directions and set aside",
            "Heat sesame oil in a wok or large skillet over high heat",
            "Add chicken and cook for 5-6 minutes until golden and cooked through",
            "Add garlic and ginger, stir-fry for 30 seconds",
            "Add mixed vegetables and stir-fry for 3-4 minutes",
            "Mix soy sauce with cornstarch and add to the pan",
            "Toss everything together until sauce thickens",
            "Serve over brown rice",
          ],
        },
      ],
    },
    {
      day: "Wednesday",
      meals: [
        {
          id: "m7",
          name: "Smoothie Bowl",
          time: "Breakfast",
          calories: 290,
          prepTime: "8 min",
          ingredients: [
            "1 frozen banana",
            "1/2 cup frozen mixed berries",
            "1/2 cup spinach",
            "1/2 cup almond milk",
            "1 tbsp almond butter",
            "Toppings: granola, coconut flakes, fresh fruit",
          ],
          instructions: [
            "Add frozen banana, berries, spinach, and almond milk to a blender",
            "Blend on high until smooth and thick",
            "Pour into a bowl",
            "Top with granola, coconut flakes, and fresh fruit",
            "Add a drizzle of almond butter on top",
            "Serve immediately with a spoon",
          ],
        },
        {
          id: "m8",
          name: "Quinoa Buddha Bowl",
          time: "Lunch",
          calories: 440,
          prepTime: "20 min",
          ingredients: [
            "1/2 cup quinoa (cooked)",
            "1/2 cup chickpeas, roasted",
            "1 cup mixed greens",
            "1/2 avocado, sliced",
            "1/4 cup shredded carrots",
            "1/4 cup red cabbage, shredded",
            "2 tbsp tahini dressing",
            "Sesame seeds for garnish",
          ],
          instructions: [
            "Cook quinoa according to package directions",
            "Toss chickpeas with olive oil, salt, and paprika, roast at 400°F for 15 min",
            "Arrange quinoa in a bowl as the base",
            "Add sections of mixed greens, roasted chickpeas, carrots, and cabbage",
            "Top with avocado slices",
            "Drizzle with tahini dressing",
            "Sprinkle sesame seeds on top and serve",
          ],
        },
        {
          id: "m9",
          name: "Baked Cod with Asparagus",
          time: "Dinner",
          calories: 410,
          prepTime: "30 min",
          ingredients: [
            "6 oz cod fillet",
            "1 bunch asparagus (about 10 spears)",
            "2 cloves garlic, minced",
            "1 lemon (juice and slices)",
            "2 tbsp olive oil",
            "1 tsp paprika",
            "Fresh dill for garnish",
            "Salt and pepper to taste",
          ],
          instructions: [
            "Preheat oven to 425°F (220°C)",
            "Trim asparagus ends and place on a baking sheet",
            "Place cod fillet on the same sheet",
            "Drizzle everything with olive oil",
            "Season cod with paprika, salt, pepper, and minced garlic",
            "Add lemon slices on top of the cod",
            "Bake for 15-18 minutes until fish flakes easily with a fork",
            "Squeeze fresh lemon juice over everything and garnish with dill",
          ],
        },
      ],
    },
  ];

  // AI Response Logic
  const getAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    // Check for inventory updates
    if (
      lowerMessage.includes("inventory") ||
      lowerMessage.includes("have") ||
      lowerMessage.includes("only") ||
      lowerMessage.includes("left") ||
      lowerMessage.includes("ran out") ||
      lowerMessage.includes("ate")
    ) {
      // Extract numbers and items (simple pattern matching)
      const salmonMatch = lowerMessage.match(/(\d+)\s*(salmon|salmons)/);
      const chickenMatch = lowerMessage.match(/(\d+)\s*(chicken|chickens)/);
      
      let response = "Got it! I've noted your inventory update. 📦\n\n";
      let foundUpdate = false;

      if (salmonMatch) {
        const qty = parseInt(salmonMatch[1]);
        handleInventoryUpdate("inv1", qty);
        response += `I've updated your salmon to ${qty} pieces. `;
        foundUpdate = true;
        
        if (qty < 4) {
          response += `Since you're short ${4 - qty} pieces, let me suggest some alternatives:\n\n`;
          response += "🐟 You can substitute with:\n";
          response += "• Cod or tilapia (similar nutrition profile)\n";
          response += "• Chicken breast (leaner protein option)\n";
          response += "• Tofu or tempeh (plant-based alternative)\n\n";
          response += "I've also added the missing salmon to your grocery list so you can restock! Would you like me to adjust your meal plan with these alternatives?";
        }
      } else if (chickenMatch) {
        const qty = parseInt(chickenMatch[1]);
        handleInventoryUpdate("inv2", qty);
        response += `I've updated your chicken to ${qty} lbs. `;
        foundUpdate = true;
        
        if (qty < 2) {
          response += `You need ${2 - qty} more lbs for this week's plan.\n\n`;
          response += "🍗 Alternative protein options:\n";
          response += "• Turkey breast\n";
          response += "• Lean ground beef\n";
          response += "• Salmon or other fish\n\n";
          response += "Check the 'Inventory' tab to update your other items too!";
        }
      }

      if (!foundUpdate) {
        response = "I can help you update your inventory! 📦\n\nYou can tell me things like:\n• \"I only have 2 salmon fillets\"\n• \"I ran out of chicken\"\n• \"Someone ate my quinoa\"\n\nOr visit the 'Inventory' tab to manually adjust your quantities. This helps me suggest meal plan alternatives and update your grocery list!";
      }

      return response;
    }

    if (
      lowerMessage.includes("meal plan") ||
      lowerMessage.includes("meal") ||
      lowerMessage.includes("food")
    ) {
      return "I've created a delicious and balanced meal plan for you! 🍽️\n\nCheck out the 'Meal Plan' tab to see your weekly menu. Each meal is designed to provide optimal nutrition while being easy to prepare. The plan includes a variety of proteins, whole grains, and colorful vegetables to keep things interesting!\n\nYour meals range from 280-520 calories and take 5-30 minutes to prepare. Would you like me to adjust anything?";
    }

    if (
      lowerMessage.includes("grocery") ||
      lowerMessage.includes("shopping") ||
      lowerMessage.includes("list")
    ) {
      return "Perfect! I've prepared your grocery list for this week! 🛒\n\nHead to the 'Grocery List' tab to see everything organized by category. I've calculated the exact quantities you need for your meal plan, so there's no waste. You can check off items as you shop!\n\nPro tip: Shopping on Sunday or Monday can help you prep for the week ahead!";
    }

    if (
      lowerMessage.includes("progress") ||
      lowerMessage.includes("reward") ||
      lowerMessage.includes("badge")
    ) {
      return "You're crushing it! 🌟\n\nYou've earned 325 points and maintained a 7-day streak - that's incredible! You've unlocked 4 badges already, including the 'Consistency King' badge for your amazing 7-day streak.\n\nKeep going and you'll unlock 'Goal Getter' next! Your dedication is truly inspiring. What would you like to focus on this week?";
    }

    if (
      lowerMessage.includes("week") ||
      lowerMessage.includes("expect") ||
      lowerMessage.includes("upcoming")
    ) {
      return "Great question! Let me share what's ahead for you! 📅\n\nYou're in Week 2, which is when many people start feeling increased energy levels. Your body is adjusting beautifully to your new nutrition habits!\n\nBy Week 3, your taste buds will adapt and you'll actually start craving healthier foods. And Week 4? That's your first month milestone - a huge achievement!\n\nYou're on track with 5 out of 7 meals logged this week. Keep it up!";
    }

    if (
      lowerMessage.includes("help") ||
      lowerMessage.includes("what can you") ||
      lowerMessage.includes("support")
    ) {
      return "I'm here to make your nutrition journey easy and fun! Here's what I can do for you:\n\n🍽️ Create personalized meal plans\n🛒 Generate organized grocery lists\n📊 Track your progress & goals\n🏆 Celebrate your wins with rewards\n📅 Show you what to expect in upcoming weeks\n💪 Provide motivation and support\n\nJust ask me anything! Whether you need a new meal plan, want to check your progress, or need some encouragement - I'm here for you!";
    }

    if (
      lowerMessage.includes("motivate") ||
      lowerMessage.includes("encourage") ||
      lowerMessage.includes("inspiration")
    ) {
      return "You are doing AMAZING! 💪✨\n\nEvery healthy choice you make is an investment in your future self. Your 7-day streak shows real commitment, and I'm so proud of you!\n\nRemember: progress isn't always linear, but consistency is key. You've already proven you have what it takes by showing up every single day this week.\n\nYour body is getting stronger, your habits are becoming automatic, and you're building a healthier, happier you. Keep going - you've got this! 🌟";
    }

    if (lowerMessage.includes("thank")) {
      return "You're so welcome! 😊 It's my pleasure to support you on this journey. Remember, I'm here whenever you need help, motivation, or just want to chat about your progress. You're doing great! 💚";
    }

    // Default response
    return "That's a great question! I'm here to help you with:\n\n• Creating meal plans tailored to your needs\n• Generating grocery lists\n• Tracking your nutrition progress\n• Providing motivation and support\n• Showing you what to expect in upcoming weeks\n\nWhat would you like to focus on today? 😊";
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsTyping(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: getAIResponse(inputValue),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
      setIsTyping(false);
      setPoints((prev) => prev + 5); // Award points for interaction
    }, 1000 + Math.random() * 1000);
  };

  const handleToggleGroceryItem = (id: string) => {
    setGroceryItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handleInventoryUpdate = (id: string, quantity: number) => {
    setInventoryItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex">
      {/* Sidebar for mobile */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-xl transform transition-transform duration-300 lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Your Dashboard</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="p-4 space-y-4 overflow-y-auto h-[calc(100vh-73px)]">
          <RewardsPanel points={points} streak={streak} badges={badges} />
          <WeeklyOutlook
            currentWeek={2}
            weeklyGoals={weeklyGoals}
            upcomingMilestones={upcomingMilestones}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-[1800px] mx-auto w-full">
        {/* Left Sidebar - Desktop */}
        <div className="hidden lg:block w-80 p-4 space-y-4 overflow-y-auto">
          <RewardsPanel points={points} streak={streak} badges={badges} />
          <WeeklyOutlook
            currentWeek={2}
            weeklyGoals={weeklyGoals}
            upcomingMilestones={upcomingMilestones}
          />
        </div>

        {/* Center Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2 flex-1">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-semibold text-gray-900">
                  Nutrition Coach AI
                </h1>
                <p className="text-xs text-green-600">Always here to support you</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="chat" className="flex-1 flex flex-col min-h-0">
            <TabsList className="mx-4 mt-4 grid grid-cols-4 w-auto">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="meals">Meal Plan</TabsTrigger>
              <TabsTrigger value="grocery">Grocery</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="flex-1 flex flex-col min-h-0 m-0">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <ChatMessage
                    key={message.id}
                    role={message.role}
                    content={message.content}
                    timestamp={message.timestamp}
                  />
                ))}
                {isTyping && (
                  <div className="flex gap-3 justify-start">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="bg-gray-100 text-gray-900 rounded-2xl px-4 py-2.5">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <span
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.2s" }}
                        />
                        <span
                          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                          style={{ animationDelay: "0.4s" }}
                        />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 bg-white border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                    placeholder="Ask about meal plans, inventory, or get support..."
                    className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim()}
                    className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
                  >
                    <Send className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="meals" className="flex-1 overflow-y-auto p-4 m-0">
              <MealPlanner weeklyPlan={weeklyMealPlan} />
            </TabsContent>

            <TabsContent value="grocery" className="flex-1 overflow-y-auto p-4 m-0">
              <GroceryList
                items={groceryItems}
                onToggleItem={handleToggleGroceryItem}
              />
            </TabsContent>

            <TabsContent value="inventory" className="flex-1 overflow-y-auto p-4 m-0">
              <InventoryPanel
                items={inventoryItems}
                onUpdateQuantity={handleInventoryUpdate}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}