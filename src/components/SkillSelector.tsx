import React from 'react';
import type { Skill } from '../types';

interface Props {
  skills: Skill[];
  selected: Skill | null;
  selectedLevel: number;
  onSelect: (skill: Skill) => void;
  onLevelChange: (level: number) => void;
}

const dmgTypeColor: Record<string, string> = {
  Physical: 'text-orange-400',
  Arts: 'text-blue-400',
  True: 'text-purple-400',
};

const SkillSelector: React.FC<Props> = ({ skills, selected, selectedLevel, onSelect, onLevelChange }) => {
  if (skills.length === 0) {
    return (
      <div>
        <label className="block text-text-muted text-xs uppercase tracking-wider mb-1.5">
          Skill
        </label>
        <div className="text-text-dim text-sm">Select an operator first</div>
      </div>
    );
  }

  const currentLevelData = selected?.levels.find(l => l.level === selectedLevel)
    || selected?.levels[selected.levels.length - 1];

  return (
    <div>
      <label className="block text-text-muted text-xs uppercase tracking-wider mb-1.5">
        Skill
      </label>
      <div className="space-y-1.5">
        {skills.map(skill => {
          const maxLevel = skill.levels[skill.levels.length - 1];
          return (
            <button
              key={skill.id}
              onClick={() => onSelect(skill)}
              className={`w-full text-left px-3 py-2 rounded border transition-colors ${
                selected?.id === skill.id
                  ? 'border-accent bg-accent/10 text-text'
                  : 'border-border bg-bg hover:border-border-light text-text-muted hover:text-text'
              }`}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm">{skill.nameKo}</span>
                <span className={`text-xs font-mono ${dmgTypeColor[skill.damageType] || 'text-text'}`}>
                  {skill.damageType} ×{maxLevel.multiplier}
                </span>
              </div>
              <div className="text-[11px] text-text-dim mt-0.5 leading-tight">{skill.description}</div>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="mt-3">
          <label className="block text-text-muted text-xs uppercase tracking-wider mb-1">
            Skill Level
          </label>
          <div className="flex items-center gap-2">
            <select
              className="bg-bg border border-border rounded px-2 py-1.5 text-text text-sm focus:border-accent focus:outline-none"
              value={selectedLevel}
              onChange={(e) => onLevelChange(parseInt(e.target.value))}
            >
              {selected.levels.map(l => (
                <option key={l.level} value={l.level}>
                  Lv.{l.level} — {(l.multiplier * 100).toFixed(0)}%
                </option>
              ))}
            </select>
            {currentLevelData && (
              <span className="text-accent font-mono text-sm font-bold">
                ×{currentLevelData.multiplier.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillSelector;
