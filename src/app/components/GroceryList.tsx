import { ShoppingCart, Check } from "lucide-react";
import { Card } from "./ui/card";

interface GroceryItem {
  id: string;
  name: string;
  quantity: string;
  category: string;
  checked?: boolean;
}

interface GroceryListProps {
  items: GroceryItem[];
  onToggleItem: (id: string) => void;
}

export function GroceryList({ items, onToggleItem }: GroceryListProps) {
  const categories = Array.from(new Set(items.map((item) => item.category)));

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <ShoppingCart className="w-5 h-5 text-green-600" />
        <h3 className="font-semibold text-gray-900">Grocery List</h3>
      </div>

      <div className="space-y-4">
        {categories.map((category) => (
          <div key={category}>
            <p className="text-sm font-medium text-gray-700 mb-2">{category}</p>
            <div className="space-y-2">
              {items
                .filter((item) => item.category === category)
                .map((item) => (
                  <button
                    key={item.id}
                    onClick={() => onToggleItem(item.id)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
                  >
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        item.checked
                          ? "bg-green-500 border-green-500"
                          : "border-gray-300"
                      }`}
                    >
                      {item.checked && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span
                      className={`flex-1 text-sm ${
                        item.checked
                          ? "text-gray-400 line-through"
                          : "text-gray-700"
                      }`}
                    >
                      {item.name}
                    </span>
                    <span className="text-sm text-gray-500">{item.quantity}</span>
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
