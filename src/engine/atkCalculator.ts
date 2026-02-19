import type { OperatorStats, Weapon, BuffSet, CalcStep } from '../types';
import { MAIN_ATTR_ATK_RATIO, SUB_ATTR_ATK_RATIO } from '../data/constants';

export interface AtkResult {
  totalAtk: number;
  steps: CalcStep[];
}

/**
 * ATK 계산
 * 1. 기본 ATK = 오퍼레이터 baseAtk
 * 2. 속성 보너스 ATK = 주능력치 × 1% + 부능력치 × 0.4%
 * 3. 무기 ATK 합산
 * 4. 퍼센트 보너스 적용
 * 5. 고정 보너스 적용
 */
export function calculateAtk(
  stats: OperatorStats,
  weapon: Weapon | null,
  buffs: BuffSet
): AtkResult {
  const steps: CalcStep[] = [];

  const opAtk = stats.baseAtk;
  steps.push({ label: 'Base ATK (Lv90)', formula: `${opAtk}`, value: opAtk });

  // 속성 보너스
  const mainAttrVal = stats.attributes[stats.mainAttr];
  const subAttrVal = stats.attributes[stats.subAttr];
  const attrAtkBonus = opAtk * (mainAttrVal * MAIN_ATTR_ATK_RATIO + subAttrVal * SUB_ATTR_ATK_RATIO);
  steps.push({
    label: 'Attribute ATK Bonus',
    formula: `${opAtk} × (${mainAttrVal} × ${MAIN_ATTR_ATK_RATIO * 100}% + ${subAttrVal} × ${SUB_ATTR_ATK_RATIO * 100}%)`,
    value: Math.round(attrAtkBonus),
  });

  const atkAfterAttr = opAtk + attrAtkBonus;
  steps.push({
    label: 'ATK After Attributes',
    formula: `${opAtk} + ${Math.round(attrAtkBonus)}`,
    value: Math.round(atkAfterAttr),
  });

  const wpnAtk = weapon ? weapon.atk : 0;
  if (weapon) {
    steps.push({ label: `Weapon ATK (${weapon.nameKo})`, formula: `+${wpnAtk}`, value: wpnAtk });
  }

  const baseSum = atkAfterAttr + wpnAtk;
  steps.push({
    label: 'ATK + Weapon',
    formula: `${Math.round(atkAfterAttr)} + ${wpnAtk}`,
    value: Math.round(baseSum),
  });

  // 퍼센트 보너스 합산
  const wpnAtkPct = weapon ? weapon.atkPercent : 0;
  const totalAtkPct = wpnAtkPct + buffs.atkPercent;
  const percentMultiplier = 1 + totalAtkPct;

  if (totalAtkPct > 0) {
    steps.push({
      label: 'ATK % Bonus',
      formula: `1 + ${(totalAtkPct * 100).toFixed(1)}%`,
      value: parseFloat(percentMultiplier.toFixed(4)),
    });
  }

  const afterPercent = baseSum * percentMultiplier;
  const totalAtk = afterPercent + buffs.atkFlat;

  steps.push({
    label: 'Total ATK',
    formula: `${Math.round(baseSum)} × ${percentMultiplier.toFixed(3)} + ${buffs.atkFlat}`,
    value: Math.round(totalAtk),
  });

  return { totalAtk: Math.round(totalAtk), steps };
}
