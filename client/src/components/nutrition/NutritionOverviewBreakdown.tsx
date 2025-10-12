import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight } from 'lucide-react';

interface Targets {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface Totals {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

interface MealContribution {
  name: string;
  amount: number;
}

interface NutritionOverviewBreakdownProps {
  targets: Targets;
  totals: Totals;
  mealContributions?: {
    protein: MealContribution[];
    carbs: MealContribution[];
    fat: MealContribution[];
  };
}

export default function NutritionOverviewBreakdown({
  targets,
  totals,
  mealContributions = { protein: [], carbs: [], fat: [] }
}: NutritionOverviewBreakdownProps) {
  const [expandedMacro, setExpandedMacro] = useState<string | null>(null);

  const macros = [
    {
      name: 'Protein',
      key: 'protein',
      consumed: totals.protein,
      target: targets.protein,
      remaining: Math.max(0, targets.protein - totals.protein),
      unit: 'g',
      color: 'bg-blue-500',
      lightColor: 'bg-blue-100'
    },
    {
      name: 'Carbs',
      key: 'carbs',
      consumed: totals.carbs,
      target: targets.carbs,
      remaining: Math.max(0, targets.carbs - totals.carbs),
      unit: 'g',
      color: 'bg-green-500',
      lightColor: 'bg-green-100'
    },
    {
      name: 'Fat',
      key: 'fat',
      consumed: totals.fat,
      target: targets.fat,
      remaining: Math.max(0, targets.fat - totals.fat),
      unit: 'g',
      color: 'bg-orange-500',
      lightColor: 'bg-orange-100'
    }
  ];

  const getProgressPercentage = (consumed: number, target: number) => {
    return Math.min((consumed / target) * 100, 100);
  };

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-slate-900">Nutrition overview (today)</h2>
      
      {/* Calories summary */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-slate-900">Calories</span>
          <div className="text-right">
            <div className="font-mono text-sm text-slate-900">
              {totals.kcal} / {targets.kcal} / {Math.max(0, targets.kcal - totals.kcal)}
            </div>
            <div className="text-xs text-slate-500">consumed / target / remaining</div>
          </div>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <motion.div
            className="bg-indigo-600 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${getProgressPercentage(totals.kcal, targets.kcal)}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Macro breakdown */}
      <div className="space-y-3">
        {macros.map((macro) => {
          const isExpanded = expandedMacro === macro.key;
          const contributions = mealContributions[macro.key as keyof typeof mealContributions] || [];
          
          return (
            <div key={macro.name} className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
              <motion.button
                className="w-full p-4 text-left hover:bg-slate-50 transition-colors"
                onClick={() => setExpandedMacro(isExpanded ? null : macro.key)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${macro.color}`} />
                    <span className="text-sm font-medium text-slate-900">{macro.name}</span>
                    {contributions.length > 0 && (
                      <motion.div
                        animate={{ rotate: isExpanded ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </motion.div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm text-slate-900">
                      {macro.consumed} / {macro.target} / {macro.remaining}
                    </div>
                    <div className="text-xs text-slate-500">consumed / target / remaining</div>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <motion.div
                    className={macro.color + " h-2 rounded-full"}
                    initial={{ width: 0 }}
                    animate={{ width: `${getProgressPercentage(macro.consumed, macro.target)}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                </div>
              </motion.button>

              {/* Expanded meal contributions */}
              <AnimatePresence>
                {isExpanded && contributions.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="border-t border-slate-100"
                  >
                    <div className="p-4 space-y-2">
                      <div className="text-xs font-medium text-slate-600 mb-3">Contributing meals:</div>
                      {contributions.map((contribution, index) => (
                        <div key={index} className="flex items-center justify-between text-xs">
                          <span className="text-slate-600">{contribution.name}</span>
                          <span className="font-mono text-slate-900">{contribution.amount}{macro.unit}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Optional micro-metrics */}
      <div className="flex gap-2">
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-600">
          Fiber: 12g
        </span>
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-600">
          Sugar: 45g
        </span>
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-slate-100 text-slate-600">
          Sodium: 1800mg
        </span>
      </div>
    </div>
  );
}