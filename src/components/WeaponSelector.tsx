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
              <div className="text-[11px] text-text-dim mt-1">ATK {wp.atk}</div>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="mt-2 text-xs text-text-muted space-y-0.5">
          <div>공격력: <span className="text-text font-mono">{selected.atk}</span></div>
          {selected.atkPercent > 0 && (
            <div>공격력%: <span className="text-text font-mono">+{(selected.atkPercent * 100).toFixed(0)}%</span></div>
          )}
          {selected.critRate > 0 && (
            <div>치명타 확률: <span className="text-text font-mono">+{(selected.critRate * 100).toFixed(1)}%</span></div>
          )}
          {selected.physDmgBonus > 0 && (
            <div>물리 피해: <span className="text-text font-mono">+{(selected.physDmgBonus * 100).toFixed(1)}%</span></div>
          )}
          {selected.artsDmgBonus > 0 && (
            <div>아츠 피해: <span className="text-text font-mono">+{(selected.artsDmgBonus * 100).toFixed(1)}%</span></div>
          )}
          <div className="text-text-dim italic text-[11px]">{selected.passive}</div>
        </div>
      )}
    </div>
  );
};

export default WeaponSelector;
