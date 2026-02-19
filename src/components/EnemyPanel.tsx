import React from 'react';
import type { Enemy } from '../types';
import { getEnemyPresets } from '../utils/dataLoader';

interface Props {
  enemy: Enemy;
  onChange: (enemy: Enemy) => void;
}

const EnemyPanel: React.FC<Props> = ({ enemy, onChange }) => {
  const presets = getEnemyPresets();

  const handlePreset = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) onChange({ ...preset });
  };

  return (
    <div>
      <label className="block text-text-muted text-xs uppercase tracking-wider mb-1.5">
        적 선택
      </label>

      <select
        className="w-full bg-bg border border-border rounded px-3 py-2 text-text focus:border-accent focus:outline-none mb-3"
        value={enemy.id}
        onChange={(e) => handlePreset(e.target.value)}
      >
        <option value="custom" disabled={enemy.id !== 'custom'}>사용자 설정</option>
        {presets.map(p => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </select>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-text-dim text-xs mb-0.5">방어력(DEF)</label>
          <input
            type="number"
            min={0}
            className="w-full bg-bg border border-border rounded px-2 py-1.5 text-text text-sm font-mono focus:border-accent focus:outline-none"
            value={enemy.def}
            onChange={(e) => onChange({ ...enemy, id: 'custom', def: Math.max(0, parseInt(e.target.value) || 0) })}
          />
        </div>
        <div>
          <label className="block text-text-dim text-xs mb-0.5">저항(RES)</label>
          <input
            type="number"
            min={0}
            max={100}
            className="w-full bg-bg border border-border rounded px-2 py-1.5 text-text text-sm font-mono focus:border-accent focus:outline-none"
            value={enemy.res}
            onChange={(e) => onChange({ ...enemy, id: 'custom', res: Math.max(0, parseInt(e.target.value) || 0) })}
          />
        </div>
      </div>
    </div>
  );
};

export default EnemyPanel;
