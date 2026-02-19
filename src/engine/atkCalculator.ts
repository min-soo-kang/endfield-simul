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

  const baseAtk = stats.baseAtk + (weapon?.atk || 0);
  const statBonus = stats.attributes[stats.mainAttr] * MAIN_ATTR_ATK_RATIO
    + stats.attributes[stats.subAttr] * SUB_ATTR_ATK_RATIO;
  const atkPct = buffs.atkPercent + (weapon?.atkPercent || 0);

  const totalAtk = baseAtk * (1 + atkPct) * (1 + statBonus) + buffs.atkFlat;

  steps.push({ label: '공격력', formula: `(${stats.baseAtk}+${weapon?.atk || 0}) × (1+${(atkPct * 100).toFixed(1)}%) × (1+${(statBonus * 100).toFixed(1)}%) + ${buffs.atkFlat}`, value: Math.round(totalAtk) });

  return { totalAtk: Math.round(totalAtk), steps };
}
