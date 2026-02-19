import type { SpecialEffects, DamageType, CalcStep } from '../types';
import {
  COMBO_HIT_BATTLE_SKILL_BONUS,
  COMBO_HIT_ULTIMATE_BONUS,
  ARMOR_BREAK_PHYS_BONUS,
  SHOCK_ARTS_BONUS,
} from '../data/constants';
import type { SkillType } from '../data/constants';

export interface EffectsResult {
  /** 데미지 보너스 합산 (곱연산 아닌 합산) */
  dmgBonusFromEffects: number;
  steps: CalcStep[];
}

/**
 * 특수 효과 계산 (엔드필드 실제 시스템)
 * - 연타: 배틀 스킬 피해 +30%, 궁극기 피해 +20%
 * - 갑옷 파괴: 물리 피해 +18% (12~24% 중간값)
 * - 감전: 아츠 피해 +18% (12~24% 중간값)
 */
export function calculateSpecialEffects(
  effects: SpecialEffects,
  damageType: DamageType,
  skillType: SkillType
): EffectsResult {
  const steps: CalcStep[] = [];
  let dmgBonusFromEffects = 0;

  // 연타 (Combo Hit)
  if (effects.comboHit) {
    if (skillType === 'battle') {
      dmgBonusFromEffects += COMBO_HIT_BATTLE_SKILL_BONUS;
      steps.push({
        label: 'Combo Hit (Battle Skill)',
        formula: `+${(COMBO_HIT_BATTLE_SKILL_BONUS * 100).toFixed(0)}%`,
        value: COMBO_HIT_BATTLE_SKILL_BONUS,
      });
    } else if (skillType === 'ultimate') {
      dmgBonusFromEffects += COMBO_HIT_ULTIMATE_BONUS;
      steps.push({
        label: 'Combo Hit (Ultimate)',
        formula: `+${(COMBO_HIT_ULTIMATE_BONUS * 100).toFixed(0)}%`,
        value: COMBO_HIT_ULTIMATE_BONUS,
      });
    }
  }

  // 갑옷 파괴 (Armor Break)
  if (effects.armorBreak && damageType === 'Physical') {
    dmgBonusFromEffects += ARMOR_BREAK_PHYS_BONUS;
    steps.push({
      label: 'Armor Break (Phys DMG+)',
      formula: `+${(ARMOR_BREAK_PHYS_BONUS * 100).toFixed(0)}%`,
      value: ARMOR_BREAK_PHYS_BONUS,
    });
  }

  // 감전 (Shocked)
  if (effects.isShocked && damageType === 'Arts') {
    dmgBonusFromEffects += SHOCK_ARTS_BONUS;
    steps.push({
      label: 'Shocked (Arts DMG+)',
      formula: `+${(SHOCK_ARTS_BONUS * 100).toFixed(0)}%`,
      value: SHOCK_ARTS_BONUS,
    });
  }

  if (steps.length === 0) {
    steps.push({ label: 'Special Effects', formula: 'None active', value: 0 });
  }

  return { dmgBonusFromEffects, steps };
}
