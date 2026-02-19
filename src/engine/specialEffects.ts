import type { SpecialEffects, DamageType, CalcStep } from '../types';
import {
  ARMOR_BREAK_PHYS_BONUS,
  SHOCK_ARTS_BONUS,
} from '../data/constants';
import type { SkillType } from '../data/constants';

export interface EffectsResult {
  dmgBonusFromEffects: number;
  steps: CalcStep[];
}

export function calculateSpecialEffects(
  effects: SpecialEffects,
  damageType: DamageType,
  skillType: SkillType
): EffectsResult {
  const steps: CalcStep[] = [];
  let dmgBonusFromEffects = 0;

  if (effects.comboStack > 0) {
    if (skillType === 'battle') {
      const v = effects.comboStack * effects.comboBattlePerStack;
      dmgBonusFromEffects += v;
      steps.push({ label: '연타 보정(배틀 스킬)', formula: `${effects.comboStack}스택 × ${(effects.comboBattlePerStack * 100).toFixed(0)}%`, value: v });
    } else if (skillType === 'ultimate') {
      const v = effects.comboStack * effects.comboUltimatePerStack;
      dmgBonusFromEffects += v;
      steps.push({ label: '연타 보정(궁극기)', formula: `${effects.comboStack}스택 × ${(effects.comboUltimatePerStack * 100).toFixed(0)}%`, value: v });
    }
  }

  if (effects.armorBreak && damageType === 'Physical') {
    dmgBonusFromEffects += ARMOR_BREAK_PHYS_BONUS;
    steps.push({ label: '갑옷 파괴', formula: `+${(ARMOR_BREAK_PHYS_BONUS * 100).toFixed(0)}%`, value: ARMOR_BREAK_PHYS_BONUS });
  }

  if (effects.isShocked && damageType === 'Arts') {
    dmgBonusFromEffects += SHOCK_ARTS_BONUS;
    steps.push({ label: '감전', formula: `+${(SHOCK_ARTS_BONUS * 100).toFixed(0)}%`, value: SHOCK_ARTS_BONUS });
  }

  if (steps.length === 0) {
    steps.push({ label: '상태 효과', formula: '적용 없음', value: 0 });
  }

  return { dmgBonusFromEffects, steps };
}
