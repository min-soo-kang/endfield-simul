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
  PotentialBonus,
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

function getOperatorCumulativeBonuses(operator: Operator, operatorPotentialLevel: number): PotentialBonus[] {
  return (operator.potentialBonuses || []).filter(p => p.level > 0 && p.level <= operatorPotentialLevel);
}

function getWeaponSelectedBonus(weapon: Weapon | null, weaponPotentialLevel: number): PotentialBonus | undefined {
  return weapon?.potentialBonuses?.find(p => p.level === weaponPotentialLevel);
}

function sumOperatorPotentialValue(
  operatorBonuses: PotentialBonus[],
  key: keyof PotentialBonus,
  conditional?: (bonus: PotentialBonus) => boolean
): number {
  return operatorBonuses.reduce((acc, b) => {
    if (conditional && !conditional(b)) return acc;
    const val = b[key];
    return acc + (typeof val === 'number' ? val : 0);
  }, 0);
}

function mergePotentialBuffs(
  base: BuffSet,
  operatorBonuses: PotentialBonus[],
  weaponBonus: PotentialBonus | undefined,
  effects: SpecialEffects
): BuffSet {
  const lowHpConditionalBonus = sumOperatorPotentialValue(
    operatorBonuses,
    'skillDmgBonus',
    (b) => b.level !== 1 || effects.lowHpTarget
  );

  return {
    ...base,
    atkPercent: base.atkPercent
      + sumOperatorPotentialValue(operatorBonuses, 'atkPercent')
      + (weaponBonus?.atkPercent || 0),
    atkFlat: base.atkFlat
      + sumOperatorPotentialValue(operatorBonuses, 'atkFlat')
      + (weaponBonus?.atkFlat || 0),
    critRate: base.critRate
      + sumOperatorPotentialValue(operatorBonuses, 'critRate')
      + (weaponBonus?.critRate || 0),
    critDmg: base.critDmg
      + sumOperatorPotentialValue(operatorBonuses, 'critDmg')
      + (weaponBonus?.critDmg || 0),
    defPenFlat: base.defPenFlat
      + sumOperatorPotentialValue(operatorBonuses, 'defPenFlat')
      + (weaponBonus?.defPenFlat || 0),
    defPenPercent: base.defPenPercent
      + sumOperatorPotentialValue(operatorBonuses, 'defPenPercent')
      + (weaponBonus?.defPenPercent || 0),
    resPen: base.resPen,
    physDmgBonus: base.physDmgBonus + sumOperatorPotentialValue(operatorBonuses, 'physDmgBonus'),
    artsDmgBonus: base.artsDmgBonus + sumOperatorPotentialValue(operatorBonuses, 'artsDmgBonus'),
    skillDmgBonus: base.skillDmgBonus + lowHpConditionalBonus,
  };
}

function applyOperatorPotentialStats(stats: OperatorStats, operatorBonuses: PotentialBonus[]): OperatorStats {
  const agiFlat = sumOperatorPotentialValue(operatorBonuses, 'agiFlat');
  if (!agiFlat) return stats;

  return {
    ...stats,
    attributes: {
      ...stats.attributes,
      agi: stats.attributes.agi + agiFlat,
    },
  };
}

function getPotentialSkillMultiplierBonus(operatorBonuses: PotentialBonus[], skillType: SkillType): number {
  if (skillType === 'battle') return sumOperatorPotentialValue(operatorBonuses, 'battleSkillMultiplierBonus');
  if (skillType === 'combo') return sumOperatorPotentialValue(operatorBonuses, 'comboSkillMultiplierBonus');
  if (skillType === 'ultimate') return sumOperatorPotentialValue(operatorBonuses, 'ultimateSkillMultiplierBonus');
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
    const unbalancedByLevel = [0.9, 1.0, 1.1, 1.2, 1.2, 1.4];
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

  const operatorBonuses = getOperatorCumulativeBonuses(operator, operatorPotentialLevel);
  const weaponBonus = getWeaponSelectedBonus(weapon, weaponPotentialLevel);

  const effectiveStats = applyOperatorPotentialStats(operator.stats, operatorBonuses);
  const mergedBuffs = mergePotentialBuffs(buffs, operatorBonuses, weaponBonus, effects);

  allSteps.push({ label: '── 공격력 계산 ──', formula: '', value: 0 });
  const atkResult = calculateAtk(effectiveStats, weapon, mergedBuffs);
  allSteps.push(...atkResult.steps);

  const levelData = skill.levels.find(l => l.level === skillLevel)
    || skill.levels[skill.levels.length - 1];
  const skillPotentialMult = getPotentialSkillMultiplierBonus(operatorBonuses, skillType);
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
