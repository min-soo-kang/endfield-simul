import React from 'react';
import type { Operator } from '../types';

interface Props {
  operators: Operator[];
  selected: Operator | null;
  onSelect: (op: Operator) => void;
}

const classLabel: Record<Operator['operatorClass'], string> = {
  Vanguard: '뱅가드',
  Guard: '가드',
  Sniper: '스나이퍼',
  Caster: '캐스터',
  Medic: '메딕',
  Defender: '디펜더',
};

const weaponLabel: Record<Operator['weaponType'], string> = {
  OneHandSword: '한손검',
  TwoHandSword: '양손검',
  Bow: '활',
  Staff: '지팡이',
  Pistol: '권총',
  Shield: '방패',
};

const OperatorSelector: React.FC<Props> = ({ operators, selected, onSelect }) => {
  return (
    <div>
      <label className="block text-text-muted text-xs uppercase tracking-wider mb-2">
        캐릭터 선택
      </label>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {operators.map(op => {
          const isSelected = selected?.id === op.id;
          return (
            <button
              key={op.id}
              onClick={() => onSelect(op)}
              className={`text-left p-3 rounded border transition-colors ${
                isSelected
                  ? 'border-accent bg-accent/10 text-text'
                  : 'border-border bg-bg hover:border-border-light text-text-muted hover:text-text'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{op.nameKo}</span>
                <span className="text-xs">{'★'.repeat(op.rarity)}</span>
              </div>
              <div className="text-[11px] text-text-dim mt-1">
                {classLabel[op.operatorClass]} · {weaponLabel[op.weaponType]} · ATK {op.stats.baseAtk}
              </div>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-text-muted">
          <div>공격력: <span className="text-text font-mono">{selected.stats.baseAtk}</span></div>
          <div>체력: <span className="text-text font-mono">{selected.stats.hp}</span></div>
          <div>직군: <span className="text-text">{classLabel[selected.operatorClass]}</span></div>
          <div>무기: <span className="text-text">{weaponLabel[selected.weaponType]}</span></div>
          <div>힘: <span className="text-text font-mono">{selected.stats.attributes.str}</span></div>
          <div>민첩: <span className="text-text font-mono">{selected.stats.attributes.agi}</span></div>
          <div>지능: <span className="text-text font-mono">{selected.stats.attributes.int}</span></div>
          <div>의지: <span className="text-text font-mono">{selected.stats.attributes.wil}</span></div>
          {selected.talents.length > 0 && (
            <div className="col-span-2 mt-1 text-text-dim italic text-[11px] leading-tight">
              {selected.talents.map((t, i) => <div key={i}>{t}</div>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default OperatorSelector;
