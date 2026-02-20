import React from 'react';
import type { SpecialEffects } from '../types';

interface Props {
  effects: SpecialEffects;
  onChange: (effects: SpecialEffects) => void;
}

interface ToggleItem {
  key: keyof Omit<SpecialEffects, 'comboStack' | 'comboBattlePerStack' | 'comboUltimatePerStack'>;
  label: string;
  desc: string;
  color: string;
}

const toggles: ToggleItem[] = [
  { key: 'isCrit', label: '치명타 적용', desc: '최종 결과를 치명타 피해로 표시', color: 'bg-highlight' },
  { key: 'isVulnerable', label: '방어 불능', desc: '방어 불능 상태', color: 'bg-orange-500' },
  { key: 'armorBreak', label: '갑옷 파괴', desc: '물리 피해 +12~24%', color: 'bg-red-500' },
  { key: 'isBurning', label: '연소', desc: '연소 상태', color: 'bg-amber-600' },
  { key: 'isShocked', label: '감전', desc: '아츠 피해 +12~24%', color: 'bg-blue-500' },
];

const EffectToggles: React.FC<Props> = ({ effects, onChange }) => {
  const toggle = (key: keyof Omit<SpecialEffects, 'comboStack' | 'comboBattlePerStack' | 'comboUltimatePerStack'>) => {
    onChange({ ...effects, [key]: !effects[key] });
  };

  return (
    <div>
      <label className="block text-text-muted text-xs uppercase tracking-wider mb-1.5">상태 효과</label>

      <div className="grid grid-cols-3 gap-2 mb-2">
        <div>
          <label className="block text-text-dim text-xs mb-0.5">연타 스택</label>
          <select className="w-full bg-bg border border-border rounded px-2 py-1.5 text-text text-sm" value={effects.comboStack} onChange={(e) => onChange({ ...effects, comboStack: parseInt(e.target.value, 10) as 0 | 1 | 2 | 3 | 4 })}>
            <option value={0}>0</option><option value={1}>1</option><option value={2}>2</option><option value={3}>3</option><option value={4}>4</option>
          </select>
        </div>
        <div>
          <label className="block text-text-dim text-xs mb-0.5">배틀 스킬 기본% (×스택+1)</label>
          <input type="number" min={0} step={1} className="w-full bg-bg border border-border rounded px-2 py-1.5 text-text text-sm font-mono" value={Math.round(effects.comboBattlePerStack * 100)} onChange={(e) => onChange({ ...effects, comboBattlePerStack: (parseInt(e.target.value) || 0) / 100 })} />
        </div>
        <div>
          <label className="block text-text-dim text-xs mb-0.5">궁극기 기본% (×스택+1)</label>
          <input type="number" min={0} step={1} className="w-full bg-bg border border-border rounded px-2 py-1.5 text-text text-sm font-mono" value={Math.round(effects.comboUltimatePerStack * 100)} onChange={(e) => onChange({ ...effects, comboUltimatePerStack: (parseInt(e.target.value) || 0) / 100 })} />
        </div>
      </div>

      <div className="space-y-1.5">
        {toggles.map(t => (
          <button key={t.key} onClick={() => toggle(t.key)} className={`w-full flex items-center gap-2.5 px-3 py-2 rounded border transition-colors ${effects[t.key] ? 'border-border-light bg-bg-hover' : 'border-border bg-bg hover:border-border-light'}`}>
            <div className={`w-3 h-3 rounded-sm flex-shrink-0 ${effects[t.key] ? t.color : 'bg-bg border border-border-light'}`} />
            <div className="text-left">
              <div className={`text-sm ${effects[t.key] ? 'text-text' : 'text-text-muted'}`}>{t.label}</div>
              <div className="text-xs text-text-dim">{t.desc}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default EffectToggles;
