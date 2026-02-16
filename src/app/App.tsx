import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Menu, X, LogOut } from "lucide-react";
import { ChatMessage } from "./components/ChatMessage";
import { RewardsPanel } from "./components/RewardsPanel";
import { WeeklyOutlook } from "./components/WeeklyOutlook";
import { GroceryList } from "./components/GroceryList";
import { MealPlanner } from "./components/MealPlanner";
import { InventoryPanel, InventoryItem } from "./components/InventoryPanel";
import { Button } from "./components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs";
import { useAuth } from "../contexts/AuthContext";
import { api, UserPreferences, ProgressEntry, UserStats, Badge } from "../lib/api";
import { Auth } from "../components/Auth";
import {
  DEFAULT_GROCERY_ITEMS,
  DEFAULT_INVENTORY_ITEMS,
  DEFAULT_WEEKLY_MEAL_PLAN,
  WEEKLY_GOALS,
  UPCOMING_MILESTONES,
} from "./mockData";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const ONBOARDING_KEYS: (keyof UserPreferences)[] = [
  "food_allergies",
  "foods_dislike",
  "foods_like",
  "meals_per_day",
  "meal_preference",
  "goals",
  "bad_habits",
  "body_scan_info",
];

export default function App() {
  const { user, logout, isLoading: authLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [stats, setStats] = useState<UserStats>({ points: 0, streak: 0 });
  const [badges, setBadges] = useState<Badge[]>([]);
  const [recentProgress, setRecentProgress] = useState<ProgressEntry[]>([]);
  const [groceryItems, setGroceryItems] = useState(DEFAULT_GROCERY_ITEMS);
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>(DEFAULT_INVENTORY_ITEMS);

  useEffect(() => {
    if (user && !authLoading) {
      loadUserData();
      setMessages([
        {
          id: "1",
          role: "assistant",
          content: preferences?.onboarding_complete
            ? "Hi! 👋 Welcome back. How can I help today?"
            : "Hi! 👋 Let's get started. Do you have any food allergies? (e.g. nuts, dairy)",
          timestamp: new Date(),
        },
      ]);
    }
  }, [user, authLoading]);

  const loadUserData = async () => {
    try {
      const [prefsRes, statsRes, progressRes] = await Promise.all([
        api.getPreferences(),
        api.getStats(),
        api.getProgressEntries(),
      ]);
      setPreferences(prefsRes.preferences);
      setStats(statsRes.stats);
      setBadges(statsRes.badges);
      setRecentProgress(progressRes.entries);
    } catch (e) {
      console.error("Load user data:", e);
    }
  };

  const applyOnboardingStep = (current: UserPreferences, message: string): UserPreferences => {
    const next = { ...current };
    const lower = message.toLowerCase();
    const idx = ONBOARDING_KEYS.findIndex((k) => !next[k]);
    if (idx === -1) {
      next.onboarding_complete = true;
      return next;
    }
    const key = ONBOARDING_KEYS[idx];
    const isLast = idx === ONBOARDING_KEYS.length - 1;
    if (isLast && (lower.includes("skip") || lower.includes("none"))) {
      next.onboarding_complete = true;
      return next;
    }
    if (key === "meals_per_day") {
      const n = parseInt(message.replace(/\D/g, ""), 10);
      if (!isNaN(n)) next.meals_per_day = n;
    } else if (key === "meal_preference") {
      if (lower.includes("quick")) next.meal_preference = "quick";
      else if (lower.includes("both")) next.meal_preference = "both";
      else if (lower.includes("cooked")) next.meal_preference = "cooked";
    } else {
      (next as Record<string, unknown>)[key] = key === "food_allergies" && (lower.includes("none") || lower.includes("no ")) ? "None" : message;
    }
    if (isLast) next.onboarding_complete = true;
    return next;
  };

  const getAIResponse = async (userMessage: string): Promise<string> => {
    try {
      const { response } = await api.sendMessage(userMessage);
      if (!preferences?.onboarding_complete) {
        const nextPrefs = applyOnboardingStep(preferences || {}, userMessage);
        await api.updatePreferences(nextPrefs);
        setPreferences(nextPrefs);
      }
      const lower = userMessage.toLowerCase();
      const isCheckIn =
        ["ate", "had", "breakfast", "lunch", "dinner", "snack"].some((w) => lower.includes(w));
      if (isCheckIn) {
        await api.addProgressEntry(new Date().toISOString().split("T")[0], userMessage);
        await loadUserData();
      }
      return response;
    } catch (e) {
      console.error("AI response:", e);
      return "Something went wrong. Please try again.";
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    const text = inputValue.trim();
    setInputValue("");
    setMessages((prev) => [...prev, { id: String(Date.now()), role: "user", content: text, timestamp: new Date() }]);
    setIsTyping(true);
    try {
      const response = await getAIResponse(text);
      setMessages((prev) => [
        ...prev,
        { id: String(Date.now() + 1), role: "assistant", content: response, timestamp: new Date() },
      ]);
      await loadUserData();
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: String(Date.now() + 1), role: "assistant", content: "Something went wrong. Try again?", timestamp: new Date() },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const iconOrder: Array<"star" | "target" | "trophy" | "zap" | "award"> = ["star", "target", "trophy", "zap", "award"];
  const formattedBadges = badges.map((b, i) => ({
    id: String(b.id),
    name: b.badge_name,
    description: b.badge_description || "",
    icon: iconOrder[i % iconOrder.length],
    earned: true,
    color: ["from-yellow-400 to-amber-500", "from-green-400 to-emerald-500", "from-purple-400 to-purple-500"][i % 3],
  }));

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (authLoading) {
    return (
      <div className="h-screen bg-gradient-to-br from-green-50 to-teal-50 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }
  if (!user) return <Auth />;

  const sidebarContent = (
    <>
      <RewardsPanel points={stats.points} streak={stats.streak} badges={formattedBadges} />
      <WeeklyOutlook
        currentWeek={Math.floor(stats.streak / 7) + 1}
        weeklyGoals={WEEKLY_GOALS}
        upcomingMilestones={UPCOMING_MILESTONES}
      />
    </>
  );

  return (
    <div className="h-screen bg-gradient-to-br from-green-50 to-teal-50 flex">
      <div
        className={`fixed inset-y-0 left-0 z-50 w-80 bg-white shadow-xl transition-transform lg:hidden ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold">Dashboard</h2>
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </Button>
        </div>
        <div className="p-4 space-y-4 overflow-y-auto h-[calc(100vh-73px)]">{sidebarContent}</div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row max-w-[1800px] mx-auto w-full">
        <div className="hidden lg:block w-80 p-4 space-y-4 overflow-y-auto">{sidebarContent}</div>

        <div className="flex-1 flex flex-col min-w-0">
          <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2 flex-1">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h1 className="font-semibold text-gray-900">Nutrition Coach</h1>
                <p className="text-xs text-green-600">Here to support you</p>
              </div>
              <Button variant="ghost" size="sm" onClick={logout}>
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>

          <Tabs defaultValue="chat" className="flex-1 flex flex-col min-h-0">
            <TabsList className="mx-4 mt-4 grid grid-cols-4 w-auto">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="meals">Meal Plan</TabsTrigger>
              <TabsTrigger value="grocery">Grocery</TabsTrigger>
              <TabsTrigger value="inventory">Inventory</TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="flex-1 flex flex-col min-h-0 m-0">
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((m) => (
                  <ChatMessage key={m.id} role={m.role} content={m.content} timestamp={m.timestamp} />
                ))}
                {isTyping && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center flex-shrink-0">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div className="bg-gray-100 rounded-2xl px-4 py-2.5 flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }} />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
              <div className="p-4 bg-white border-t flex gap-2">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                  placeholder="Ask about meals, progress, or support..."
                  className="flex-1 px-4 py-2.5 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <Button onClick={handleSendMessage} disabled={!inputValue.trim()} className="bg-gradient-to-r from-green-500 to-emerald-600">
                  <Send className="w-5 h-5" />
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="meals" className="flex-1 overflow-y-auto p-4 m-0">
              <MealPlanner weeklyPlan={DEFAULT_WEEKLY_MEAL_PLAN} />
            </TabsContent>
            <TabsContent value="grocery" className="flex-1 overflow-y-auto p-4 m-0">
              <GroceryList
                items={groceryItems}
                onToggleItem={(id) =>
                  setGroceryItems((prev) => prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)))
                }
              />
            </TabsContent>
            <TabsContent value="inventory" className="flex-1 overflow-y-auto p-4 m-0">
              <InventoryPanel
                items={inventoryItems}
                onUpdateQuantity={(id, qty) =>
                  setInventoryItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i)))
                }
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
    </div>
  );
}
