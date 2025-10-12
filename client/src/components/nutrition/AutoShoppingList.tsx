import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ShoppingCart, 
  Check, 
  Copy, 
  Share, 
  Plus,
  Beef,
  Apple,
  Wheat,
  Milk,
  Fish
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

interface ShoppingItem {
  id: string;
  name: string;
  category: string;
  quantity: string;
  checked: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface AutoShoppingListProps {
  userId: number;
  selectedDate: Date;
}

export default function AutoShoppingList({
  userId,
  selectedDate
}: AutoShoppingListProps) {
  const { toast } = useToast();
  
  // Mock generated shopping list based on meal plans
  const [shoppingItems, setShoppingItems] = useState<ShoppingItem[]>([
    // Proteins
    { id: '1', name: 'Greek Yogurt (2 large containers)', category: 'Protein', quantity: '2x 500g', checked: false, priority: 'high' },
    { id: '2', name: 'Chicken Breast', category: 'Protein', quantity: '1.5 lbs', checked: false, priority: 'high' },
    { id: '3', name: 'Salmon Fillets', category: 'Protein', quantity: '4 pieces', checked: false, priority: 'high' },
    { id: '4', name: 'Eggs', category: 'Protein', quantity: '1 dozen', checked: false, priority: 'medium' },
    { id: '5', name: 'Lean Ground Beef', category: 'Protein', quantity: '1 lb', checked: false, priority: 'medium' },
    
    // Vegetables
    { id: '6', name: 'Mixed Berries', category: 'Produce', quantity: '2 cups', checked: false, priority: 'high' },
    { id: '7', name: 'Spinach', category: 'Produce', quantity: '1 bag', checked: false, priority: 'high' },
    { id: '8', name: 'Sweet Potatoes', category: 'Produce', quantity: '3 large', checked: false, priority: 'medium' },
    { id: '9', name: 'Avocados', category: 'Produce', quantity: '4 pieces', checked: false, priority: 'medium' },
    { id: '10', name: 'Asparagus', category: 'Produce', quantity: '1 bunch', checked: false, priority: 'medium' },
    { id: '11', name: 'Cucumber', category: 'Produce', quantity: '2 pieces', checked: false, priority: 'low' },
    
    // Grains & Carbs
    { id: '12', name: 'Quinoa', category: 'Grains', quantity: '1 bag', checked: false, priority: 'medium' },
    { id: '13', name: 'Brown Rice', category: 'Grains', quantity: '1 bag', checked: false, priority: 'medium' },
    { id: '14', name: 'Whole Grain Bread', category: 'Grains', quantity: '1 loaf', checked: false, priority: 'medium' },
    { id: '15', name: 'Oats', category: 'Grains', quantity: '1 container', checked: false, priority: 'low' },
    
    // Pantry Items
    { id: '16', name: 'Almond Butter', category: 'Pantry', quantity: '1 jar', checked: false, priority: 'medium' },
    { id: '17', name: 'Olive Oil', category: 'Pantry', quantity: '1 bottle', checked: false, priority: 'low' },
    { id: '18', name: 'Honey', category: 'Pantry', quantity: '1 bottle', checked: false, priority: 'low' },
    { id: '19', name: 'Protein Powder', category: 'Pantry', quantity: '1 container', checked: false, priority: 'high' },
    
    // Dairy
    { id: '20', name: 'Feta Cheese', category: 'Dairy', quantity: '1 container', checked: false, priority: 'low' },
    { id: '21', name: 'Almond Milk', category: 'Dairy', quantity: '1 carton', checked: false, priority: 'medium' }
  ]);

  const categories = [
    { name: 'Protein', icon: Beef, color: 'from-red-400 to-pink-400' },
    { name: 'Produce', icon: Apple, color: 'from-green-400 to-emerald-400' },
    { name: 'Grains', icon: Wheat, color: 'from-yellow-400 to-orange-400' },
    { name: 'Dairy', icon: Milk, color: 'from-blue-400 to-cyan-400' },
    { name: 'Pantry', icon: Fish, color: 'from-purple-400 to-indigo-400' }
  ];

  const toggleItem = (itemId: string) => {
    setShoppingItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, checked: !item.checked }
          : item
      )
    );
  };

  const getCategoryItems = (categoryName: string) => {
    return shoppingItems.filter(item => item.category === categoryName);
  };

  const getCompletionStats = () => {
    const total = shoppingItems.length;
    const checked = shoppingItems.filter(item => item.checked).length;
    return { total, checked, percentage: Math.round((checked / total) * 100) };
  };

  const copyList = () => {
    const listText = categories.map(category => {
      const items = getCategoryItems(category.name);
      if (items.length === 0) return '';
      
      return `${category.name.toUpperCase()}\n${items.map(item => 
        `${item.checked ? '✓' : '☐'} ${item.name} (${item.quantity})`
      ).join('\n')}\n`;
    }).filter(section => section !== '').join('\n');
    
    navigator.clipboard.writeText(listText);
    toast({
      title: 'Shopping list copied!',
      description: 'The list has been copied to your clipboard.'
    });
  };

  const shareList = async () => {
    if (navigator.share) {
      const listText = categories.map(category => {
        const items = getCategoryItems(category.name);
        if (items.length === 0) return '';
        
        return `${category.name}: ${items.map(item => item.name).join(', ')}`;
      }).filter(section => section !== '').join('\n\n');
      
      try {
        await navigator.share({
          title: 'My Thryvin\' Shopping List',
          text: listText
        });
      } catch (error) {
        copyList(); // Fallback to copy
      }
    } else {
      copyList(); // Fallback to copy
    }
  };

  const exportToPhone = () => {
    const listText = categories.map(category => {
      const items = getCategoryItems(category.name);
      if (items.length === 0) return '';
      
      return `${category.name.toUpperCase()}\n${items.map(item => 
        `☐ ${item.name} (${item.quantity})`
      ).join('\n')}\n`;
    }).filter(section => section !== '').join('\n');
    
    const smsBody = encodeURIComponent(`Thryvin' Shopping List:\n\n${listText}`);
    window.open(`sms:?body=${smsBody}`, '_blank');
    
    toast({
      title: 'Opening SMS app...',
      description: 'Your shopping list is ready to send as a text message.'
    });
  };

  const addCustomItem = () => {
    const newItem: ShoppingItem = {
      id: Date.now().toString(),
      name: 'Custom Item',
      category: 'Pantry',
      quantity: '1',
      checked: false,
      priority: 'medium'
    };
    
    setShoppingItems(prev => [...prev, newItem]);
    toast({
      title: 'Item added!',
      description: 'You can edit the item details by tapping on it.'
    });
  };

  const stats = getCompletionStats();

  return (
    <div className="w-full">
      {/* Enhanced Header with Gradient */}
      <div className="relative bg-gradient-to-br from-[#7A3CF3] via-purple-500 to-[#FF4FD8] p-6 rounded-3xl shadow-xl mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mr-3">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Smart Shopping List</h2>
              <p className="text-purple-100 text-sm">AI-generated from your meal plan</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              onClick={copyList}
              className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm h-8 text-xs"
            >
              <Copy className="w-3 h-3 mr-1" />
              Copy
            </Button>
            <Button
              size="sm"
              onClick={shareList}
              className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm h-8 text-xs"
            >
              <Share className="w-3 h-3 mr-1" />
              Share
            </Button>
          </div>
        </div>
        
        {/* Enhanced Progress Bar */}
        <div className="relative">
          <div className="flex items-center justify-between text-white/90 text-sm mb-3">
            <span className="font-medium">Shopping Progress</span>
            <span className="font-semibold">{stats.checked} of {stats.total} items</span>
          </div>
          <div className="w-full bg-white/20 rounded-full h-3 backdrop-blur-sm">
            <motion.div
              className="bg-gradient-to-r from-white to-white/90 h-3 rounded-full shadow-lg"
              initial={{ width: 0 }}
              animate={{ width: `${stats.percentage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <div className="text-right mt-2">
            <span className="text-white/90 text-xs font-medium">{stats.percentage}% Complete</span>
          </div>
        </div>
      </div>

      {/* Beautiful Shopping List Content */}
      <div className="space-y-6">
        {categories.map((category) => {
            const items = getCategoryItems(category.name);
            if (items.length === 0) return null;
            
            const IconComponent = category.icon;
            const checkedItems = items.filter(item => item.checked).length;
            
            return (
              <div key={category.name} className="space-y-3">
                {/* Category Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`p-2 rounded-xl bg-gradient-to-r ${category.color}`}>
                      <IconComponent className="w-4 h-4 text-white" />
                    </div>
                    <h3 className="font-semibold">{category.name}</h3>
                    <Badge variant="outline" className="text-xs">
                      {checkedItems}/{items.length}
                    </Badge>
                  </div>
                </div>

                {/* Category Items */}
                <div className="space-y-2 ml-6">
                  {items.map((item) => (
                    <motion.div
                      key={item.id}
                      whileHover={{ scale: 1.02 }}
                      className={`flex items-center justify-between p-3 rounded-xl transition-all duration-200 ${
                        item.checked 
                          ? 'bg-green-50' 
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          checked={item.checked}
                          onCheckedChange={() => toggleItem(item.id)}
                          className="rounded"
                        />
                        <div className={`${item.checked ? 'line-through text-gray-500' : ''}`}>
                          <div className="font-medium">{item.name}</div>
                          <div className="text-sm text-gray-500">{item.quantity}</div>
                        </div>
                      </div>
                      
                      {item.priority === 'high' && !item.checked && (
                        <Badge className="bg-red-100 text-red-700 text-xs">
                          Priority
                        </Badge>
                      )}
                      
                      {item.checked && (
                        <Check className="w-4 h-4 text-green-500" />
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Add Custom Item */}
          <div className="pt-4">
            <Button
              variant="outline"
              onClick={addCustomItem}
              className="w-full rounded-xl border-2 border-dashed border-green-200 hover:border-green-300 hover:bg-green-50 text-green-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Custom Item
            </Button>
          </div>

          {/* Quick Stats */}
          <div className="pt-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-green-50 rounded-xl">
                <div className="text-lg font-bold text-green-600">{stats.checked}</div>
                <div className="text-xs text-gray-500">Collected</div>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl">
                <div className="text-lg font-bold text-gray-600">{stats.total - stats.checked}</div>
                <div className="text-xs text-gray-500">Remaining</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <div className="text-lg font-bold text-blue-600">{stats.percentage}%</div>
                <div className="text-xs text-gray-500">Complete</div>
              </div>
            </div>
          </div>
      </div>
    </div>
  );
}