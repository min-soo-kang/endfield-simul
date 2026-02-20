import React from 'react';
import type { GearSet } from '../types';

interface Props {
  gearSets: GearSet[];
  selected: GearSet | null;
  onSelect: (set: GearSet | null) => void;
}

const GearSetSelector: React.FC<Props> = ({ gearSets, selected, onSelect }) => {
  return (
    <div>
      <label className="block text-text-muted text-xs uppercase tracking-wider mb-2">
        장비 세트 선택
      </label>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <button
          onClick={() => onSelect(null)}
          className={`text-left p-3 rounded border transition-colors ${
            !selected
              ? 'border-accent bg-accent/10 text-text'
              : 'border-border bg-bg hover:border-border-light text-text-muted hover:text-text'
          }`}
        >
          <div className="font-medium text-sm">미장착</div>
          <div className="text-[11px] text-text-dim mt-1">세트 효과 없음</div>
        </button>

        {gearSets.map(set => {
          const isSelected = selected?.id === set.id;
          return (
            <button
              key={set.id}
              onClick={() => onSelect(set)}
              className={`text-left p-3 rounded border transition-colors ${
                isSelected
                  ? 'border-accent bg-accent/10 text-text'
                  : 'border-border bg-bg hover:border-border-light text-text-muted hover:text-text'
              }`}
            >
              <div className="font-medium text-sm">{set.nameKo}</div>
              <div className="text-[11px] text-text-dim mt-1">추천: {set.recommendedFor}</div>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="mt-2 text-xs space-y-1">
          <div className="text-text-dim">추천 직군: {selected.recommendedFor}</div>
          {selected.bonuses.map((b, i) => (
            <div key={i} className="text-text-muted bg-bg rounded px-2 py-1.5 text-[11px] leading-tight">
              <span className="text-accent">{b.pieces}세트:</span> {b.description}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GearSetSelector;
