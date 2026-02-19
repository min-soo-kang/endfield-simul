import type {
  Operator,
  Weapon,
  Skill,
  Enemy,
  BuffSet,
  GearSet,
  SpecialEffects,
  DamageResult,
  CalcStep,
  OperatorStats,
} from '../types';
import type { SkillType } from '../data/constants';
import { calculateAtk } from './atkCalculator';
import { calculateDefense } from './defenseCalc';
import { calculateCrit } from './critCalc';
import { calculateSpecialEffects } from './specialEffects';

function inferSkillType(skillId: string): SkillType {
  if (skillId.includes('basic')) return 'basic';
  if (skillId.includes('battle')) return 'battle';
  if (skillId.includes('combo')) return 'combo';
  if (skillId.includes('ultimate')) return 'ultimate';
  return 'battle';
}

function mergePotentialBuffs(
  base: BuffSet,
  operator: Operator,
  weapon: Weapon | null,
  operatorPotentialLevel: number,
  weaponPotentialLevel: number,
  effects: SpecialEffects
): BuffSet {
  const opBonus = operator.potentialBonuses?.find(p => p.level === operatorPotentialLevel);
  const wpBonus = weapon?.potentialBonuses?.find(p => p.level === weaponPotentialLevel);

  const lowHpBonus = effects.lowHpTarget ? (opBonus?.skillDmgBonus || 0) : 0;

  return {
    ...base,
    atkPercent: base.atkPercent + (opBonus?.atkPercent || 0) + (wpBonus?.atkPercent || 0),
    atkFlat: base.atkFlat + (opBonus?.atkFlat || 0) + (wpBonus?.atkFlat || 0),
    critRate: base.critRate + (opBonus?.critRate || 0) + (wpBonus?.critRate || 0),
    critDmg: base.critDmg + (opBonus?.critDmg || 0) + (wpBonus?.critDmg || 0),
    defPenFlat: base.defPenFlat + (opBonus?.defPenFlat || 0) + (wpBonus?.defPenFlat || 0),
    defPenPercent: base.defPenPercent + (opBonus?.defPenPercent || 0) + (wpBonus?.defPenPercent || 0),
    resPen: base.resPen,
    physDmgBonus: base.physDmgBonus + (opBonus?.physDmgBonus || 0),
    artsDmgBonus: base.artsDmgBonus + (opBonus?.artsDmgBonus || 0),
    skillDmgBonus: base.skillDmgBonus + lowHpBonus + (opBonus?.level === 1 && !effects.lowHpTarget ? 0 : 0),
  };
}

function applyOperatorPotentialStats(stats: OperatorStats, operator: Operator, operatorPotentialLevel: number): OperatorStats {
  const opBonus = operator.potentialBonuses?.find(p => p.level === operatorPotentialLevel);
  const agiFlat = opBonus?.agiFlat || 0;
  if (!agiFlat) return stats;

  return {
    ...stats,
    attributes: {
      ...stats.attributes,
      agi: stats.attributes.agi + agiFlat,
    },
  };
}

function getPotentialSkillMultiplierBonus(operator: Operator, operatorPotentialLevel: number, skillType: SkillType): number {
  const opBonus = operator.potentialBonuses?.find(p => p.level === operatorPotentialLevel);
  if (!opBonus) return 0;
  if (skillType === 'battle') return opBonus.battleSkillMultiplierBonus || 0;
  if (skillType === 'combo') return opBonus.comboSkillMultiplierBonus || 0;
  if (skillType === 'ultimate') return opBonus.ultimateSkillMultiplierBonus || 0;
  return 0;
}

function getBuyoThirdOptionBonus(weapon: Weapon | null, weaponPotentialLevel: number, skillType: SkillType, effects: SpecialEffects): number {
  if (!weapon || weapon.id !== 'buyo') return 0;
  const wp = weapon.potentialBonuses?.find(p => p.level === weaponPotentialLevel);
  if (!wp) return 0;

  let bonus = 0;
  if (skillType === 'battle' || skillType === 'ultimate') {
    bonus += wp.physDmgBonus || 0;
  }

  if (effects.unbalancedTarget) {
    const unbalancedByLevel = [0.9, 1.0, 1.1, 1.2, 1.4, 1.4];
    bonus += unbalancedByLevel[weaponPotentialLevel] || 0;
  }

  return bonus;
}

export function calculateDamage(
  operator: Operator,
  weapon: Weapon | null,
  skill: Skill,
  skillLevel: number,
  enemy: Enemy,
  buffs: BuffSet,
  effects: SpecialEffects,
  gearSet: GearSet | null,
  operatorPotentialLevel: number,
  weaponPotentialLevel: number
): DamageResult {
  const allSteps: CalcStep[] = [];
  const skillType = inferSkillType(skill.id);
  const effectiveStats = applyOperatorPotentialStats(operator.stats, operator, operatorPotentialLevel);
  const mergedBuffs = mergePotentialBuffs(buffs, operator, weapon, operatorPotentialLevel, weaponPotentialLevel, effects);

  allSteps.push({ label: '── 공격력 계산 ──', formula: '', value: 0 });
  const atkResult = calculateAtk(effectiveStats, weapon, mergedBuffs);
  allSteps.push(...atkResult.steps);

  const levelData = skill.levels.find(l => l.level === skillLevel)
    || skill.levels[skill.levels.length - 1];
  const skillPotentialMult = getPotentialSkillMultiplierBonus(operator, operatorPotentialLevel, skillType);
  const multiplier = levelData.multiplier * (1 + skillPotentialMult);

  allSteps.push({ label: '── 스킬 배율 ──', formula: '', value: 0 });
  allSteps.push({
    label: `${skill.nameKo} (Lv${levelData.level})`,
    formula: `${(levelData.multiplier * 100).toFixed(0)}%${skillPotentialMult > 0 ? ` × ${(1 + skillPotentialMult).toFixed(2)}` : ''}`,
    value: parseFloat(multiplier.toFixed(4)),
  });

  const baseDmg = atkResult.totalAtk * multiplier;
  allSteps.push({
    label: '기본 피해',
    formula: `${atkResult.totalAtk} × ${multiplier.toFixed(2)}`,
    value: Math.round(baseDmg),
  });

  allSteps.push({ label: '── 방어/저항 계산 ──', formula: '', value: 0 });
  const defResult = calculateDefense(enemy, mergedBuffs, skill.damageType, skill.element);
  allSteps.push(...defResult.steps);

  let afterDef: number;
  if (skill.damageType === 'Physical') {
    afterDef = baseDmg * defResult.defMultiplier;
  } else if (skill.damageType === 'Arts') {
    afterDef = baseDmg * defResult.resMultiplier;
  } else {
    afterDef = baseDmg;
  }

  allSteps.push({
    label: '방어/저항 적용 후',
    formula: `${Math.round(baseDmg)} × ${
      skill.damageType === 'Physical'
        ? defResult.defMultiplier.toFixed(4)
        : skill.damageType === 'Arts'
          ? defResult.resMultiplier.toFixed(4)
          : '1.0000'
    }`,
    value: Math.round(afterDef),
  });

  allSteps.push({ label: '── 피해 증가 보정 ──', formula: '', value: 0 });

  const wpnPhys = weapon ? weapon.physDmgBonus : 0;
  const wpnArts = weapon ? weapon.artsDmgBonus : 0;

  let gearCritRate = 0;
  let gearPhys = 0;
  let gearArts = 0;
  let gearSkill = 0;
  if (gearSet) {
    for (const bonus of gearSet.bonuses) {
      gearCritRate += bonus.critRate || 0;
      gearPhys += bonus.physDmgBonus || 0;
      gearArts += bonus.artsDmgBonus || 0;
      gearSkill += bonus.skillDmgBonus || 0;
    }
  }

  const effectsResult = calculateSpecialEffects(effects, skill.damageType, skillType);
  allSteps.push(...effectsResult.steps);

  let totalDmgBonus = 0;

  if (skill.damageType === 'Physical') {
    totalDmgBonus += wpnPhys + mergedBuffs.physDmgBonus + gearPhys;
    const buyoBonus = getBuyoThirdOptionBonus(weapon, weaponPotentialLevel, skillType, effects);
    totalDmgBonus += buyoBonus;
    if (buyoBonus > 0) {
      allSteps.push({
        label: '부요 3옵 보정',
        formula: `+${(buyoBonus * 100).toFixed(1)}%`,
        value: parseFloat(buyoBonus.toFixed(4)),
      });
    }
  } else if (skill.damageType === 'Arts') {
    totalDmgBonus += wpnArts + mergedBuffs.artsDmgBonus + gearArts;
  }

  totalDmgBonus += mergedBuffs.skillDmgBonus + gearSkill;
  totalDmgBonus += effectsResult.dmgBonusFromEffects;

  const dmgBonusMult = 1 + totalDmgBonus;
  allSteps.push({
    label: '총 피해 보너스',
    formula: `1 + ${(totalDmgBonus * 100).toFixed(1)}%`,
    value: parseFloat(dmgBonusMult.toFixed(4)),
  });

  const afterBonus = afterDef * dmgBonusMult;
  allSteps.push({
    label: '피해 보정 후',
    formula: `${Math.round(afterDef)} × ${dmgBonusMult.toFixed(4)}`,
    value: Math.round(afterBonus),
  });

  allSteps.push({ label: '── 치명타 계산 ──', formula: '', value: 0 });

  const effectiveBuffs = { ...mergedBuffs, critRate: mergedBuffs.critRate + gearCritRate };
  const critResult = calculateCrit(weapon, effectiveBuffs);
  allSteps.push(...critResult.steps);

  const nonCritDamage = Math.round(afterBonus);
  const critDamage = Math.round(afterBonus * critResult.critMultiplier);
  const expectedDamage = Math.round(
    nonCritDamage * (1 - critResult.critRate) + critDamage * critResult.critRate
  );

  allSteps.push({ label: '── 최종 결과 ──', formula: '', value: 0 });
  allSteps.push({ label: '비치명타 피해', formula: `${nonCritDamage.toLocaleString()}`, value: nonCritDamage });
  allSteps.push({
    label: '치명타 피해',
    formula: `${nonCritDamage.toLocaleString()} × ${critResult.critMultiplier.toFixed(2)}`,
    value: critDamage,
  });
  allSteps.push({
    label: '기대 피해',
    formula: `비치명타 × ${((1 - critResult.critRate) * 100).toFixed(1)}% + 치명타 × ${(critResult.critRate * 100).toFixed(1)}%`,
    value: expectedDamage,
  });

  const finalDamage = effects.isCrit ? critDamage : nonCritDamage;
  const hitCount = Math.max(skill.hits || 1, 1);
  const perHitDamage = Math.round(finalDamage / hitCount);

  return {
    finalDamage,
    isCrit: effects.isCrit,
    hitCount,
    perHitDamage,
    steps: allSteps,
    nonCritDamage,
    critDamage,
    expectedDamage,
    critRate: critResult.critRate,
    critMultiplier: critResult.critMultiplier,
  };
}
