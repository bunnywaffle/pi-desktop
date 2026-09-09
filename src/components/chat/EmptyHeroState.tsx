import React from 'react';
import { Compass, Hammer, RefreshCw, Bug, Cloud } from 'lucide-react';

interface EmptyHeroStateProps {
  projectName: string;
  onSelectAction: (prompt: string) => void;
}

export const EmptyHeroState: React.FC<EmptyHeroStateProps> = ({ projectName, onSelectAction }) => {
  const cards = [
    {
      title: 'Explore and understand code',
      prompt: `Inspect the code structure and architecture in ${projectName}.`,
      icon: Compass,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10 hover:border-blue-500/40'
    },
    {
      title: 'Build a new feature, app, or tool',
      prompt: `Let's build a new feature for ${projectName}. What should we start with?`,
      icon: Hammer,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10 hover:border-purple-500/40'
    },
    {
      title: 'Review code and suggest changes',
      prompt: `Review recent changes in ${projectName} and check for quality and performance improvements.`,
      icon: RefreshCw,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 hover:border-emerald-500/40'
    },
    {
      title: 'Fix issues and failures',
      prompt: `Check for errors, broken tests, or bug fixes in ${projectName}.`,
      icon: Bug,
      color: 'text-orange-400',
      bgColor: 'bg-orange-500/10 hover:border-orange-500/40'
    }
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-3xl mx-auto">
      {/* Robot / Cloud Icon */}
      <div className="w-14 h-14 rounded-2xl bg-dark-800/80 border border-dark-700/60 flex items-center justify-center text-dark-400 mb-6 shadow-md">
        <Cloud size={28} className="text-dark-300" />
      </div>

      {/* Hero Headline */}
      <h1 className="text-2xl font-semibold text-white tracking-tight mb-8">
        What should we build in <span className="underline decoration-dark-600 underline-offset-4 font-bold">{projectName}</span>?
      </h1>

      {/* 4 Action Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <button
              key={idx}
              onClick={() => onSelectAction(card.prompt)}
              className={`flex flex-col items-start text-left p-4 rounded-xl border border-dark-700/60 bg-dark-900/60 hover:bg-dark-800/80 transition shadow-sm group ${card.bgColor}`}
            >
              <Icon size={18} className={`${card.color} mb-3 group-hover:scale-110 transition-transform`} />
              <span className="text-xs text-dark-200 font-medium leading-snug">
                {card.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
