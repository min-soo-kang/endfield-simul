import type { Weapon, BuffSet, CalcStep } from '../types';
import { BASE_CRIT_RATE, BASE_CRIT_DMG } from '../data/constants';

export interface CritResult {
  critRate: number;
  critMultiplier: number;
  steps: CalcStep[];
}

export function calculateCrit(
  weapon: Weapon | null,
  buffs: BuffSet
): CritResult {
  const steps: CalcStep[] = [];

  const wpnCritRate = weapon ? weapon.critRate : 0;
  const totalCritRate = Math.min(1, BASE_CRIT_RATE + wpnCritRate + buffs.critRate);
  steps.push({
    label: '치명타 확률',
    formula: `${(BASE_CRIT_RATE * 100).toFixed(0)}% + ${(wpnCritRate * 100).toFixed(1)}% + ${(buffs.critRate * 100).toFixed(0)}%`,
    value: parseFloat(totalCritRate.toFixed(4)),
  });

  const critMultiplier = 1 + BASE_CRIT_DMG + buffs.critDmg;
  steps.push({
    label: '치명타 배율',
    formula: `1 + ${(BASE_CRIT_DMG * 100).toFixed(0)}% + ${(buffs.critDmg * 100).toFixed(0)}%`,
    value: parseFloat(critMultiplier.toFixed(4)),
  });

  return { critRate: totalCritRate, critMultiplier, steps };
}
