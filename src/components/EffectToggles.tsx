import React from 'react';
import type { SpecialEffects } from '../types';

interface Props {
  effects: SpecialEffects;
  onChange: (effects: SpecialEffects) => void;
}

interface ToggleItem {
  key: keyof SpecialEffects;
  label: string;
  desc: string;
  color: string;
}

const toggles: ToggleItem[] = [
  { key: 'isCrit', label: 'Critical Hit', desc: 'Show crit damage as final result', color: 'bg-highlight' },
  { key: 'isVulnerable', label: 'Vulnerable', desc: '방어 불능 (Vulnerable) 상태', color: 'bg-orange-500' },
  { key: 'armorBreak', label: 'Armor Break', desc: '갑옷 파괴: 물리 피해 +12~24%', color: 'bg-red-500' },
  { key: 'comboHit', label: 'Combo Hit', desc: '연타: 배틀스킬 +30%, 궁극기 +20%', color: 'bg-yellow-500' },
  { key: 'isBurning', label: 'Burn', desc: '연소 상태', color: 'bg-amber-600' },
  { key: 'isShocked', label: 'Shocked', desc: '감전: 아츠 피해 +12~24%', color: 'bg-blue-500' },
];

const EffectToggles: React.FC<Props> = ({ effects, onChange }) => {
  const toggle = (key: keyof SpecialEffects) => {
    onChange({ ...effects, [key]: !effects[key] });
  };

  return (
    <div>
      <label className="block text-text-muted text-xs uppercase tracking-wider mb-1.5">
        Status Effects
      </label>
      <div className="space-y-1.5">
        {toggles.map(t => (
          <button
            key={t.key}
            onClick={() => toggle(t.key)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded border transition-colors ${
              effects[t.key]
                ? 'border-border-light bg-bg-hover'
                : 'border-border bg-bg hover:border-border-light'
            }`}
          >
            <div
              className={`w-3 h-3 rounded-sm flex-shrink-0 transition-colors ${
                effects[t.key] ? t.color : 'bg-bg border border-border-light'
              }`}
            />
            <div className="text-left">
              <div className={`text-sm ${effects[t.key] ? 'text-text' : 'text-text-muted'}`}>
                {t.label}
              </div>
              <div className="text-xs text-text-dim">{t.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default EffectToggles;
