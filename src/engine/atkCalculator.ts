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
  const attrs = {
    str: stats.attributes.str + buffs.strFlat,
    agi: stats.attributes.agi + buffs.agiFlat,
    int: stats.attributes.int + buffs.intFlat,
    wil: stats.attributes.wil + buffs.wilFlat,
  };
  const statBonus = attrs[stats.mainAttr] * MAIN_ATTR_ATK_RATIO
    + attrs[stats.subAttr] * SUB_ATTR_ATK_RATIO;
  const atkPct = buffs.atkPercent + (weapon?.atkPercent || 0);

  const totalAtk = baseAtk * (1 + atkPct) * (1 + statBonus);

  steps.push({ label: '공격력', formula: `(${stats.baseAtk}+${weapon?.atk || 0}) × (1+${(atkPct * 100).toFixed(1)}%) × (1+${(statBonus * 100).toFixed(1)}%)`, value: Math.round(totalAtk) });
  steps.push({ label: '장비 스탯 반영', formula: `힘+${buffs.strFlat}, 민첩+${buffs.agiFlat}, 지능+${buffs.intFlat}, 의지+${buffs.wilFlat}`, value: buffs.strFlat + buffs.agiFlat + buffs.intFlat + buffs.wilFlat });

  return { totalAtk: Math.round(totalAtk), steps };
}
