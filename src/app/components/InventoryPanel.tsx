import { Package, Plus, Minus } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";

export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  plannedQuantity: number;
}

interface InventoryPanelProps {
  items: InventoryItem[];
  onUpdateQuantity: (id: string, newQuantity: number) => void;
}

export function InventoryPanel({ items, onUpdateQuantity }: InventoryPanelProps) {
  const categories = Array.from(new Set(items.map((item) => item.category)));

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Package className="w-5 h-5 text-green-600" />
        <h3 className="font-semibold text-gray-900">Current Inventory</h3>
      </div>

      <div className="space-y-4">
        {categories.map((category) => (
          <div key={category}>
            <p className="text-sm font-medium text-gray-700 mb-2">{category}</p>
            <div className="space-y-2">
              {items
                .filter((item) => item.category === category)
                .map((item) => {
                  const isShort = item.quantity < item.plannedQuantity;
                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        isShort
                          ? "bg-red-50 border-red-200"
                          : "bg-gray-50 border-gray-200"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex-1">
                          <p className="font-medium text-gray-900 text-sm">
                            {item.name}
                          </p>
                          <p className="text-xs text-gray-600">
                            Planned: {item.plannedQuantity} {item.unit}
                          </p>
                        </div>
                        {isShort && (
                          <span className="text-xs font-medium text-red-600 bg-red-100 px-2 py-1 rounded">
                            {item.plannedQuantity - item.quantity} {item.unit} short
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() =>
                            onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))
                          }
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <div className="flex-1 text-center">
                          <span className="font-semibold text-gray-900">
                            {item.quantity}
                          </span>
                          <span className="text-sm text-gray-600 ml-1">
                            {item.unit}
                          </span>
                        </div>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-xs text-blue-900">
          💡 Tip: You can also tell me in the chat about your inventory changes,
          like "I only have 2 salmon fillets" and I'll adjust your plan!
        </p>
      </div>
    </Card>
  );
}
