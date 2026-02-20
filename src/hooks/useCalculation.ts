import { useMemo } from 'react';
import type { Operator, Weapon, Skill, Enemy, BuffSet, GearSet, SpecialEffects, DamageResult } from '../types';
import { calculateDamage } from '../engine/damageCalculator';

export function useCalculation(
  operator: Operator | null,
  weapon: Weapon | null,
  skill: Skill | null,
  skillLevel: number,
  enemy: Enemy,
  buffs: BuffSet,
  effects: SpecialEffects,
  gearSet: GearSet | null,
  operatorPotentialLevel: number,
  weaponPotentialLevel: number
): DamageResult | null {
  return useMemo(() => {
    if (!operator || !skill) return null;
    return calculateDamage(
      operator,
      weapon,
      skill,
      skillLevel,
      enemy,
      buffs,
      effects,
      gearSet,
      operatorPotentialLevel,
      weaponPotentialLevel
    );
  }, [operator, weapon, skill, skillLevel, enemy, buffs, effects, gearSet, operatorPotentialLevel, weaponPotentialLevel]);
}
