import React from 'react';
import type { SpecialEffects } from '../types';

interface Props {
  effects: SpecialEffects;
  onChange: (effects: SpecialEffects) => void;
}

interface ToggleItem {
  key: keyof Omit<SpecialEffects, 'comboStack'>;
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
  { key: 'lowHpTarget', label: '적 체력 50% 이하', desc: '진천우 잠재 1 조건', color: 'bg-pink-500' },
  { key: 'unbalancedTarget', label: '불균형 대상', desc: '불균형 시 추가 피해', color: 'bg-violet-500' },
];

const EffectToggles: React.FC<Props> = ({ effects, onChange }) => {
  const toggle = (key: keyof Omit<SpecialEffects, 'comboStack'>) => {
    onChange({ ...effects, [key]: !effects[key] });
  };

  return (
    <div>
      <label className="block text-text-muted text-xs uppercase tracking-wider mb-1.5">상태 효과</label>

      <div className="mb-2">
        <label className="block text-text-dim text-xs mb-0.5">연타 스택</label>
        <select
          className="w-full bg-bg border border-border rounded px-2 py-1.5 text-text text-sm"
          value={effects.comboStack}
          onChange={(e) => onChange({ ...effects, comboStack: parseInt(e.target.value, 10) as 0 | 1 | 2 | 3 | 4 })}
        >
          <option value={0}>0스택</option>
          <option value={1}>1스택 (배틀 30% / 궁극기 20%)</option>
          <option value={2}>2스택 (배틀 45% / 궁극기 30%)</option>
          <option value={3}>3스택 (배틀 60% / 궁극기 40%)</option>
          <option value={4}>4스택 (배틀 75% / 궁극기 50%)</option>
        </select>
      </div>

      <div className="space-y-1.5">
        {toggles.map(t => (
          <button
            key={t.key}
            onClick={() => toggle(t.key)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded border transition-colors ${
              effects[t.key] ? 'border-border-light bg-bg-hover' : 'border-border bg-bg hover:border-border-light'
            }`}
          >
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
