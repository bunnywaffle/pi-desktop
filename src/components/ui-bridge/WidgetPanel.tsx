import React from 'react';

interface WidgetPanelProps {
  placement: 'aboveEditor' | 'belowEditor';
  widgets: Record<string, string[]>;
}

export const WidgetPanel: React.FC<WidgetPanelProps> = ({ placement, widgets }) => {
  const entries = Object.entries(widgets);
  if (entries.length === 0) return null;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 my-1 space-y-1">
      {entries.map(([key, lines]) => (
        <div
          key={key}
          className="bg-dark-900/80 border border-dark-750/80 rounded-lg p-2.5 text-xs font-mono text-dark-300 space-y-0.5 shadow-sm"
        >
          {lines.map((line, idx) => (
            <div key={idx} className="leading-snug">{line}</div>
          ))}
        </div>
      ))}
    </div>
  );
};
