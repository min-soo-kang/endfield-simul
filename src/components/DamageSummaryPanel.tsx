import React from 'react';
import type { SummaryCardItem } from '../types';

interface Props {
  items: SummaryCardItem[];
}

const DamageSummaryPanel: React.FC<Props> = ({ items }) => {
  if (items.length === 0) return null;

  // 증폭·취약처럼 값이 0인 카드는 compact 스타일로
  const compactKeys = new Set(['amp', 'vuln']);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
      {items.map((item) => {
        const isCompact = compactKeys.has(item.key);
        return (
          <div
            key={item.key}
            className={`bg-bg-panel border border-border rounded-lg p-3 ${
              isCompact ? '' : 'lg:col-span-2'
            }`}
          >
            <div className="text-text-dim text-xs">{item.title}</div>
            <div className={`text-accent font-bold font-mono mt-0.5 ${isCompact ? 'text-xl' : 'text-2xl'}`}>
              {item.valueText}
            </div>
            <div className="mt-1.5 space-y-0.5">
              {item.details.map((d, i) => (
                <div key={i} className="text-text-muted text-xs leading-tight">• {d}</div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default DamageSummaryPanel;
