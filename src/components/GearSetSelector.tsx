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
      <label className="block text-text-muted text-xs uppercase tracking-wider mb-1.5">
        Gear Set
      </label>
      <select
        className="w-full bg-bg border border-border rounded px-3 py-2 text-text focus:border-accent focus:outline-none"
        value={selected?.id || ''}
        onChange={(e) => {
          if (e.target.value === '') {
            onSelect(null);
          } else {
            const set = gearSets.find(g => g.id === e.target.value);
            if (set) onSelect(set);
          }
        }}
      >
        <option value="">None</option>
        {gearSets.map(set => (
          <option key={set.id} value={set.id}>
            {set.nameKo} ({set.name}) - {set.recommendedFor}
          </option>
        ))}
      </select>
      {selected && (
        <div className="mt-2 text-xs space-y-1">
          <div className="text-text-dim">Recommended: {selected.recommendedFor}</div>
          {selected.bonuses.map((b, i) => (
            <div key={i} className="text-text-muted bg-bg rounded px-2 py-1.5 text-[11px] leading-tight">
              <span className="text-accent">{b.pieces}pc:</span> {b.description}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GearSetSelector;
