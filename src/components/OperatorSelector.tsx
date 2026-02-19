import React from 'react';
import type { Operator } from '../types';

interface Props {
  operators: Operator[];
  selected: Operator | null;
  onSelect: (op: Operator) => void;
}

const OperatorSelector: React.FC<Props> = ({ operators, selected, onSelect }) => {
  return (
    <div>
      <label className="block text-text-muted text-xs uppercase tracking-wider mb-1.5">
        Operator
      </label>
      <select
        className="w-full bg-bg border border-border rounded px-3 py-2 text-text focus:border-accent focus:outline-none"
        value={selected?.id || ''}
        onChange={(e) => {
          const op = operators.find(o => o.id === e.target.value);
          if (op) onSelect(op);
        }}
      >
        <option value="" disabled>Select operator...</option>
        {operators.map(op => (
          <option key={op.id} value={op.id}>
            {op.name} ({op.nameKo}) - {'★'.repeat(op.rarity)} {op.operatorClass}
          </option>
        ))}
      </select>
      {selected && (
        <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-0.5 text-xs text-text-muted">
          <div>ATK: <span className="text-text font-mono">{selected.stats.baseAtk}</span></div>
          <div>HP: <span className="text-text font-mono">{selected.stats.hp}</span></div>
          <div>Class: <span className="text-text">{selected.operatorClass}</span></div>
          <div>Weapon: <span className="text-text">{selected.weaponType}</span></div>
          <div>STR: <span className="text-text font-mono">{selected.stats.attributes.str}</span></div>
          <div>AGI: <span className="text-text font-mono">{selected.stats.attributes.agi}</span></div>
          <div>INT: <span className="text-text font-mono">{selected.stats.attributes.int}</span></div>
          <div>WIL: <span className="text-text font-mono">{selected.stats.attributes.wil}</span></div>
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
