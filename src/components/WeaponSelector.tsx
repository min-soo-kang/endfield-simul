import React from 'react';
import type { Weapon } from '../types';

interface Props {
  weapons: Weapon[];
  selected: Weapon | null;
  onSelect: (wp: Weapon | null) => void;
}

const WeaponSelector: React.FC<Props> = ({ weapons, selected, onSelect }) => {
  return (
    <div>
      <label className="block text-text-muted text-xs uppercase tracking-wider mb-1.5">
        Weapon
      </label>
      <select
        className="w-full bg-bg border border-border rounded px-3 py-2 text-text focus:border-accent focus:outline-none"
        value={selected?.id || ''}
        onChange={(e) => {
          if (e.target.value === '') {
            onSelect(null);
          } else {
            const wp = weapons.find(w => w.id === e.target.value);
            if (wp) onSelect(wp);
          }
        }}
      >
        <option value="">None</option>
        {weapons.map(wp => (
          <option key={wp.id} value={wp.id}>
            {'★'.repeat(wp.rarity)} {wp.name} ({wp.nameKo}) - ATK {wp.atk}
          </option>
        ))}
      </select>
      {selected && (
        <div className="mt-2 text-xs text-text-muted space-y-0.5">
          <div>ATK: <span className="text-text font-mono">{selected.atk}</span></div>
          {selected.atkPercent > 0 && (
            <div>ATK%: <span className="text-text font-mono">+{(selected.atkPercent * 100).toFixed(0)}%</span></div>
          )}
          {selected.critRate > 0 && (
            <div>Crit Rate: <span className="text-text font-mono">+{(selected.critRate * 100).toFixed(1)}%</span></div>
          )}
          {selected.physDmgBonus > 0 && (
            <div>Phys DMG: <span className="text-text font-mono">+{(selected.physDmgBonus * 100).toFixed(1)}%</span></div>
          )}
          {selected.artsDmgBonus > 0 && (
            <div>Arts DMG: <span className="text-text font-mono">+{(selected.artsDmgBonus * 100).toFixed(1)}%</span></div>
          )}
          <div className="text-text-dim italic text-[11px]">{selected.passive}</div>
        </div>
      )}
    </div>
  );
};

export default WeaponSelector;
