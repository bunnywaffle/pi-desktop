import React from 'react';
import { Compass, Hammer, RefreshCw, Bug } from 'lucide-react';
import { PiLogo } from '../common/PiLogo';

interface EmptyHeroStateProps {
  projectName: string;
  onSelectAction: (prompt: string) => void;
}

export const EmptyHeroState: React.FC<EmptyHeroStateProps> = ({ projectName, onSelectAction }) => {
  const cards = [
    {
      title: 'Explore and understand code',
      prompt: `Inspect the code structure and architecture in ${projectName}.`,
      icon: Compass
    },
    {
      title: 'Build a new feature, app, or tool',
      prompt: `Let's build a new feature for ${projectName}. What should we start with?`,
      icon: Hammer
    },
    {
      title: 'Review code and suggest changes',
      prompt: `Review recent changes in ${projectName} and check for quality and performance improvements.`,
      icon: RefreshCw
    },
    {
      title: 'Fix issues and failures',
      prompt: `Check for errors, broken tests, or bug fixes in ${projectName}.`,
      icon: Bug
    }
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-3xl mx-auto">
      {/* Official Pi Agent Icon */}
      <div className="mb-6 shadow-xl hover:scale-105 transition-transform">
        <PiLogo size={56} withBackground className="rounded-2xl" />
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
              className="flex flex-col items-start text-left p-4 rounded-xl border border-dark-800 bg-dark-900 hover:bg-dark-850 hover:border-dark-700 transition shadow-sm group"
            >
              <Icon size={18} className="text-dark-400 group-hover:text-pi-accent mb-3 group-hover:scale-110 transition-all" />
              <span className="text-xs text-dark-200 group-hover:text-white font-medium leading-snug transition-colors">
                {card.title}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
