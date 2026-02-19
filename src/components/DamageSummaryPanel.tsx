import React from 'react';
import type { SummaryCardItem } from '../types';

interface Props {
  items: SummaryCardItem[];
}

const DamageSummaryPanel: React.FC<Props> = ({ items }) => {
  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {items.map((item) => (
        <div key={item.key} className="bg-bg-panel border border-border rounded-lg p-3">
          <div className="text-text-dim text-xs">{item.title}</div>
          <div className="text-accent text-2xl font-bold font-mono mt-1">{item.valueText}</div>
          <div className="mt-2 space-y-0.5">
            {item.details.map((d, i) => (
              <div key={i} className="text-text-muted text-xs leading-tight">• {d}</div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default DamageSummaryPanel;
