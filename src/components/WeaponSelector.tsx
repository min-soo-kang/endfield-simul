import React from 'react';
import type { Weapon } from '../types';

interface Props {
  weapons: Weapon[];
  selected: Weapon | null;
  onSelect: (wp: Weapon | null) => void;
  potentialLevel: number;
  onPotentialChange: (level: number) => void;
}

const WeaponSelector: React.FC<Props> = ({ weapons, selected, onSelect, potentialLevel, onPotentialChange }) => {
  return (
    <div>
      <label className="block text-text-muted text-xs uppercase tracking-wider mb-2">
        무기 선택
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
          <div className="text-[11px] text-text-dim mt-1">무기 보너스 없음</div>
        </button>

        {weapons.map(wp => {
          const isSelected = selected?.id === wp.id;
          return (
            <button
              key={wp.id}
              onClick={() => onSelect(wp)}
              className={`text-left p-3 rounded border transition-colors ${
                isSelected
                  ? 'border-accent bg-accent/10 text-text'
                  : 'border-border bg-bg hover:border-border-light text-text-muted hover:text-text'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{wp.nameKo}</span>
                <span className="text-xs">{'★'.repeat(wp.rarity)}</span>
              </div>
              <div className="text-[11px] text-text-dim mt-1">공격력 {wp.atk}</div>
            </button>
          );
        })}
      </div>

      {selected && (
        <>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="text-text-dim">무기 잠재</span>
            <select
              className="bg-bg border border-border rounded px-2 py-1 text-text"
              value={potentialLevel}
              onChange={(e) => onPotentialChange(parseInt(e.target.value, 10))}
            >
              {[0, 1, 2, 3, 4, 5].map(level => <option key={level} value={level}>잠재 {level}</option>)}
            </select>
          </div>

          <div className="mt-2 text-xs text-text-muted space-y-0.5">
            <div>공격력: <span className="text-text font-mono">{selected.atk}</span></div>
            <div className="text-text-dim italic text-[11px]">{selected.passive}</div>
          </div>
        </>
      )}
    </div>
  );
};

export default WeaponSelector;
