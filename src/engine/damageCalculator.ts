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
import { calculateSpecialEffects } from './specialEffects';

function inferSkillType(skillId: string): SkillType {
  if (skillId.includes('basic')) return 'basic';
  if (skillId.includes('battle')) return 'battle';
  if (skillId.includes('combo')) return 'combo';
  if (skillId.includes('ultimate')) return 'ultimate';
  return 'battle';
}

function getOperatorCumulativeBonuses(operator: Operator, lv: number): PotentialBonus[] {
  return (operator.potentialBonuses || []).filter(p => p.level > 0 && p.level <= lv);
}

function sumOperatorPotentialValue(list: PotentialBonus[], key: keyof PotentialBonus, cond?: (b: PotentialBonus) => boolean): number {
  return list.reduce((acc, b) => {
    if (cond && !cond(b)) return acc;
    const v = b[key];
    return acc + (typeof v === 'number' ? v : 0);
  }, 0);
}

function applyOperatorPotentialStats(stats: OperatorStats, list: PotentialBonus[], weapon: Weapon | null): OperatorStats {
  const agiFlat = sumOperatorPotentialValue(list, 'agiFlat');
  const mainStatBonus = weapon?.mainStatFlatBonus || 0;
  const next = { ...stats, attributes: { ...stats.attributes } };
  if (agiFlat) next.attributes.agi += agiFlat;
  if (mainStatBonus) next.attributes[stats.mainAttr] += mainStatBonus;
  return next;
}

function getPotentialSkillMultiplierBonus(list: PotentialBonus[], skillType: SkillType): number {
  if (skillType === 'battle') return sumOperatorPotentialValue(list, 'battleSkillMultiplierBonus');
  if (skillType === 'combo') return sumOperatorPotentialValue(list, 'comboSkillMultiplierBonus');
  if (skillType === 'ultimate') return sumOperatorPotentialValue(list, 'ultimateSkillMultiplierBonus');
  return 0;
}

function getBuyoThirdOptionBonus(weapon: Weapon | null, lv: number, skillType: SkillType, enemy: Enemy): number {
  if (!weapon || weapon.id !== 'buyo') return 0;
  const wp = weapon.potentialBonuses?.find(p => p.level === lv);
  if (!wp) return 0;
  let bonus = 0;
  if (skillType === 'battle' || skillType === 'ultimate') bonus += wp.physDmgBonus || 0;
  if (enemy.isUnbalanced) {
    const unbalancedByLevel = [0.8, 0.9, 1.0, 1.1, 1.2, 1.4];
    bonus += unbalancedByLevel[lv] || 0;
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
  const steps: CalcStep[] = [];
  const skillType = inferSkillType(skill.id);
  const opBonuses = getOperatorCumulativeBonuses(operator, operatorPotentialLevel);
  const opStats = applyOperatorPotentialStats(operator.stats, opBonuses, weapon);

  const lowHpBonus = sumOperatorPotentialValue(opBonuses, 'skillDmgBonus', b => b.level !== 1 || enemy.hpPercent <= 50);
  const potentialPhys = sumOperatorPotentialValue(opBonuses, 'physDmgBonus');
  const potentialArts = sumOperatorPotentialValue(opBonuses, 'artsDmgBonus');

  const mergedBuffs: BuffSet = {
    ...buffs,
    atkPercent: buffs.atkPercent + sumOperatorPotentialValue(opBonuses, 'atkPercent'),
    atkFlat: buffs.atkFlat + sumOperatorPotentialValue(opBonuses, 'atkFlat'),
    critRate: buffs.critRate + sumOperatorPotentialValue(opBonuses, 'critRate'),
    critDmg: buffs.critDmg + sumOperatorPotentialValue(opBonuses, 'critDmg'),
    physDmgBonus: buffs.physDmgBonus + potentialPhys,
    artsDmgBonus: buffs.artsDmgBonus + potentialArts,
    skillDmgBonus: buffs.skillDmgBonus + lowHpBonus,
  };

  const atkResult = calculateAtk(opStats, weapon, mergedBuffs);
  const levelData = skill.levels.find(l => l.level === skillLevel) || skill.levels[skill.levels.length - 1];
  const multBonus = getPotentialSkillMultiplierBonus(opBonuses, skillType);
  const finalMultiplier = levelData.multiplier * (1 + multBonus);
  const preDefenseDamage = atkResult.totalAtk * finalMultiplier;

  const defense = calculateDefense(enemy, mergedBuffs, skill.damageType, skill.element);
  const defMult = skill.damageType === 'Physical' ? defense.defMultiplier : skill.damageType === 'Arts' ? defense.resMultiplier : 1;
  const afterDefense = preDefenseDamage * defMult;

  let gearPhys = 0, gearArts = 0, gearSkill = 0;
  if (gearSet) {
    for (const b of gearSet.bonuses) {
      gearPhys += b.physDmgBonus || 0;
      gearArts += b.artsDmgBonus || 0;
      gearSkill += b.skillDmgBonus || 0;
    }
  }

  const effectsResult = calculateSpecialEffects(effects, skill.damageType, skillType);
  const attributeBonus = skill.damageType === 'Physical'
    ? (weapon?.physDmgBonus || 0) + mergedBuffs.physDmgBonus + gearPhys
    : skill.damageType === 'Arts'
      ? (weapon?.artsDmgBonus || 0) + mergedBuffs.artsDmgBonus + gearArts
      : 0;

  const buyoBonus = getBuyoThirdOptionBonus(weapon, weaponPotentialLevel, skillType, enemy);
  const unbalancedTaken = enemy.isUnbalanced ? 0.3 : 0;
  const additionalDmg = attributeBonus + mergedBuffs.skillDmgBonus + buyoBonus + mergedBuffs.extraDmgBonus + gearSkill + effectsResult.dmgBonusFromEffects;

  const amp = mergedBuffs.ampBonus;
  const vuln = mergedBuffs.vulnBonus;
  const takenDmg = mergedBuffs.takenDmgBonus;

  const totalBeforeCrit = afterDefense * (1 + additionalDmg) * (1 + amp) * (1 + vuln) * (1 + takenDmg) * (1 + unbalancedTaken);

  const critRate = Math.min(1, 0.05 + (weapon?.critRate || 0) + mergedBuffs.critRate);
  const critDmg = 0.5 + (weapon?.critDmg || 0) + mergedBuffs.critDmg;
  const critExpectedMult = (1 + critRate) * (1 + critDmg);

  const nonCritDamage = Math.round(totalBeforeCrit);
  const critDamage = Math.round(totalBeforeCrit * (1 + critDmg));
  const expectedDamage = Math.round(totalBeforeCrit * critExpectedMult);

  steps.push({ label: '공격력 계산', formula: atkResult.steps[0].formula, value: atkResult.totalAtk });
  steps.push({ label: '스킬 배율', formula: `${(levelData.multiplier * 100).toFixed(0)}%${multBonus > 0 ? ` × ${(1 + multBonus).toFixed(2)}` : ''}`, value: parseFloat(finalMultiplier.toFixed(4)) });
  steps.push({ label: '방어/저항 적용', formula: `× ${defMult.toFixed(4)}`, value: Math.round(afterDefense) });
  steps.push({ label: '데미지 추가 수치', formula: `${(additionalDmg * 100).toFixed(1)}%`, value: parseFloat((1 + additionalDmg).toFixed(4)) });
  steps.push({ label: '증폭/취약/받피증/불균형', formula: `증폭 ${(amp * 100).toFixed(1)}% · 취약 ${(vuln * 100).toFixed(1)}% · 받피증 ${(takenDmg * 100).toFixed(1)}% · 불균형 ${(unbalancedTaken * 100).toFixed(1)}%`, value: parseFloat(((1 + amp) * (1 + vuln) * (1 + takenDmg) * (1 + unbalancedTaken)).toFixed(4)) });
  steps.push({ label: '치명타 기댓값 배율', formula: `(1+치확)×(1+치피) = ${critExpectedMult.toFixed(4)}`, value: parseFloat(critExpectedMult.toFixed(4)) });

  const finalDamage = effects.isCrit ? critDamage : nonCritDamage;
  const hitCount = Math.max(skill.hits || 1, 1);

  return {
    finalDamage,
    isCrit: effects.isCrit,
    hitCount,
    perHitDamage: Math.round(finalDamage / hitCount),
    steps,
    nonCritDamage,
    critDamage,
    expectedDamage,
    critRate,
    critMultiplier: 1 + critDmg,
  };
}
