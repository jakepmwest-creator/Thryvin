import { motion } from 'framer-motion';

interface SegmentedTabsProps {
  tabs: { id: string; label: string }[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export default function SegmentedTabs({ tabs, activeTab, onTabChange }: SegmentedTabsProps) {
  return (
    <div className="flex justify-center mb-6">
      <div className="bg-white border border-slate-200 rounded-full p-1.5 shadow-lg">
        <div 
          role="tablist"
          className="flex relative"
        >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowLeft') {
                const currentIndex = tabs.findIndex(t => t.id === activeTab);
                const prevIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
                onTabChange(tabs[prevIndex].id);
              } else if (e.key === 'ArrowRight') {
                const currentIndex = tabs.findIndex(t => t.id === activeTab);
                const nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
                onTabChange(tabs[nextIndex].id);
              }
            }}
            className={`
              relative z-10 px-3 py-2 text-xs font-semibold rounded-full transition-all duration-200 min-w-[70px] whitespace-nowrap
              focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2
              ${activeTab === tab.id 
                ? 'text-white' 
                : 'text-slate-600 hover:text-slate-900'
              }
            `}
          >
            {activeTab === tab.id && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-gradient-to-r from-[#7A3CF3] to-[#FF4FD8] rounded-full shadow-lg"
                initial={false}
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
            <span className="relative z-10">{tab.label}</span>
          </button>
        ))}
        </div>
      </div>
    </div>
  );
}