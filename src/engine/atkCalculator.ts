import type { OperatorStats, Weapon, BuffSet, CalcStep } from '../types';
import { MAIN_ATTR_ATK_RATIO, SUB_ATTR_ATK_RATIO } from '../data/constants';

export interface AtkResult {
  totalAtk: number;
  steps: CalcStep[];
}

export function calculateAtk(
  stats: OperatorStats,
  weapon: Weapon | null,
  buffs: BuffSet
): AtkResult {
  const steps: CalcStep[] = [];

  const opAtk = stats.baseAtk;
  steps.push({ label: '기본 공격력 (Lv90)', formula: `${opAtk}`, value: opAtk });

  const mainAttrVal = stats.attributes[stats.mainAttr];
  const subAttrVal = stats.attributes[stats.subAttr];
  const attrAtkBonus = opAtk * (mainAttrVal * MAIN_ATTR_ATK_RATIO + subAttrVal * SUB_ATTR_ATK_RATIO);
  steps.push({
    label: '속성 기반 공격력 보너스',
    formula: `${opAtk} × (${mainAttrVal} × ${MAIN_ATTR_ATK_RATIO * 100}% + ${subAttrVal} × ${SUB_ATTR_ATK_RATIO * 100}%)`,
    value: Math.round(attrAtkBonus),
  });

  const atkAfterAttr = opAtk + attrAtkBonus;
  steps.push({
    label: '속성 적용 후 공격력',
    formula: `${opAtk} + ${Math.round(attrAtkBonus)}`,
    value: Math.round(atkAfterAttr),
  });

  const wpnAtk = weapon ? weapon.atk : 0;
  if (weapon) {
    steps.push({ label: `무기 공격력 (${weapon.nameKo})`, formula: `+${wpnAtk}`, value: wpnAtk });
  }

  const baseSum = atkAfterAttr + wpnAtk;
  steps.push({
    label: '기본 합산 공격력',
    formula: `${Math.round(atkAfterAttr)} + ${wpnAtk}`,
    value: Math.round(baseSum),
  });

  const wpnAtkPct = weapon ? weapon.atkPercent : 0;
  const totalAtkPct = wpnAtkPct + buffs.atkPercent;
  const percentMultiplier = 1 + totalAtkPct;

  if (totalAtkPct > 0) {
    steps.push({
      label: '공격력% 보너스',
      formula: `1 + ${(totalAtkPct * 100).toFixed(1)}%`,
      value: parseFloat(percentMultiplier.toFixed(4)),
    });
  }

  const afterPercent = baseSum * percentMultiplier;
  const totalAtk = afterPercent + buffs.atkFlat;

  steps.push({
    label: '최종 공격력',
    formula: `${Math.round(baseSum)} × ${percentMultiplier.toFixed(3)} + ${buffs.atkFlat}`,
    value: Math.round(totalAtk),
  });

  return { totalAtk: Math.round(totalAtk), steps };
}
