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
  SummaryCardItem,
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


function fmtPct(v: number): string {
  return `${(v * 100).toFixed(1)}%`;
}

function getSkillTypeLabel(skillType: SkillType): string {
  if (skillType === 'battle') return '배틀 스킬';
  if (skillType === 'combo') return '연계 스킬';
  if (skillType === 'ultimate') return '궁극기';
  return '일반 스킬';
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

  let gearPhys = 0, gearArts = 0, gearSkill = 0, gearBattle = 0, gearCombo = 0, gearUltimate = 0;
  if (gearSet) {
    for (const b of gearSet.bonuses) {
      gearPhys += b.physDmgBonus || 0;
      gearArts += b.artsDmgBonus || 0;
      gearSkill += b.skillDmgBonus || 0;
      gearBattle += b.battleSkillDmgBonus || 0;
      gearCombo += b.comboSkillDmgBonus || 0;
      gearUltimate += b.ultimateSkillDmgBonus || 0;
    }
  }

  const effectsResult = calculateSpecialEffects(effects, skill.damageType, skillType);
  const attributeBonus = skill.damageType === 'Physical'
    ? (weapon?.physDmgBonus || 0) + mergedBuffs.physDmgBonus + gearPhys
    : skill.damageType === 'Arts'
      ? (weapon?.artsDmgBonus || 0) + mergedBuffs.artsDmgBonus + gearArts
      : 0;


  const skillTypeBonus =
    (skillType === 'battle' ? (mergedBuffs.battleSkillDmgBonus + gearBattle) : 0)
    + (skillType === 'combo' ? (mergedBuffs.comboSkillDmgBonus + gearCombo) : 0)
    + (skillType === 'ultimate' ? (mergedBuffs.ultimateSkillDmgBonus + gearUltimate) : 0);

  const buyoBonus = getBuyoThirdOptionBonus(weapon, weaponPotentialLevel, skillType, enemy);
  const unbalancedTaken = enemy.isUnbalanced ? 0.3 : 0;
  const additionalDmg = attributeBonus + mergedBuffs.skillDmgBonus + skillTypeBonus + buyoBonus + mergedBuffs.extraDmgBonus + gearSkill + effectsResult.dmgBonusFromEffects;

  const amp = mergedBuffs.ampBonus;
  const vuln = mergedBuffs.vulnBonus;
  const takenDmg = mergedBuffs.takenDmgBonus;

  const totalBeforeCrit = afterDefense * (1 + additionalDmg) * (1 + amp) * (1 + vuln) * (1 + takenDmg) * (1 + unbalancedTaken);

  const critRate = Math.min(1, 0.05 + (weapon?.critRate || 0) + mergedBuffs.critRate);
  const critDmg = 0.5 + (weapon?.critDmg || 0) + mergedBuffs.critDmg;
  const critExpectedMult = 1 + (critRate * critDmg);

  const nonCritDamage = Math.round(totalBeforeCrit);
  const critDamage = Math.round(totalBeforeCrit * (1 + critDmg));
  const expectedDamage = Math.round(totalBeforeCrit * critExpectedMult);

  const atkPct = mergedBuffs.atkPercent + (weapon?.atkPercent || 0);
  const statBonus = opStats.attributes[opStats.mainAttr] * 0.005 + opStats.attributes[opStats.subAttr] * 0.002;
  const atkIncreasePct = (1 + atkPct) * (1 + statBonus) - 1;

  const skillTypeLabel = getSkillTypeLabel(skillType);

  const summaryCards: SummaryCardItem[] = [
    {
      key: 'atk',
      title: '공격력 증가',
      valueText: fmtPct(atkIncreasePct),
      details: [
        `최종 공격력 ${atkResult.totalAtk.toLocaleString()}`,
        `공퍼 합산 ${fmtPct(atkPct)}`,
        `스탯 보너스 ${fmtPct(statBonus)} (주:${opStats.mainAttr} ${opStats.attributes[opStats.mainAttr]}, 부:${opStats.subAttr} ${opStats.attributes[opStats.subAttr]})`,
        `장비/버프로 추가된 스탯 힘+${mergedBuffs.strFlat} · 민첩+${mergedBuffs.agiFlat} · 지능+${mergedBuffs.intFlat} · 의지+${mergedBuffs.wilFlat}`,
      ],
    },
    {
      key: 'damage_add',
      title: '피해 증가 합산',
      valueText: fmtPct(additionalDmg),
      details: [
        `속성 피해 보너스 ${fmtPct(attributeBonus)}${skill.damageType === 'Physical' ? ` (무기 ${fmtPct(weapon?.physDmgBonus || 0)} + 버프 ${fmtPct(mergedBuffs.physDmgBonus)} + 세트 ${fmtPct(gearPhys)})` : skill.damageType === 'Arts' ? ` (무기 ${fmtPct(weapon?.artsDmgBonus || 0)} + 버프 ${fmtPct(mergedBuffs.artsDmgBonus)} + 세트 ${fmtPct(gearArts)})` : ''}`,
        `공통 스킬 피해 ${fmtPct(mergedBuffs.skillDmgBonus + gearSkill)} (버프 ${fmtPct(mergedBuffs.skillDmgBonus)} + 세트 ${fmtPct(gearSkill)})`,
        `${skillTypeLabel} 피해 ${fmtPct(skillTypeBonus)}${gearSet ? ` (활성 세트: ${gearSet.nameKo})` : ''}`,
        `추가 데미지 ${fmtPct(mergedBuffs.extraDmgBonus)} · 부요 보너스 ${fmtPct(buyoBonus)} · 상태 보너스 ${fmtPct(effectsResult.dmgBonusFromEffects)}`,
      ],
    },
    {
      key: 'crit_expected',
      title: '치명타 기댓값',
      valueText: fmtPct(critExpectedMult),
      details: [
        `치명타 확률 ${fmtPct(critRate)}`,
        `치명타 피해 ${fmtPct(critDmg)}`,
        `기댓 배율 = 1 + (치확×치피)`,
      ],
    },
    {
      key: 'amp',
      title: '증폭/취약/받피증',
      valueText: fmtPct((1 + amp) * (1 + vuln) * (1 + takenDmg) - 1),
      details: [
        `증폭 ${fmtPct(amp)}`,
        `취약 ${fmtPct(vuln)}`,
        `받피증 ${fmtPct(takenDmg)}`,
        `불균형 ${enemy.isUnbalanced ? '+30.0%' : '+0.0%'}`,
      ],
    },
    {
      key: 'status',
      title: '상태',
      valueText: fmtPct(effectsResult.dmgBonusFromEffects),
      details: effectsResult.steps.map(st => `${st.label} ${st.formula}`),
    },
  ];

  steps.push({ label: '공격력 계산', formula: atkResult.steps[0].formula, value: atkResult.totalAtk });
  steps.push({ label: '스킬 배율', formula: `${(levelData.multiplier * 100).toFixed(0)}%${multBonus > 0 ? ` × ${(1 + multBonus).toFixed(2)}` : ''}`, value: parseFloat(finalMultiplier.toFixed(4)) });
  steps.push({ label: '방어/저항 적용', formula: `× ${defMult.toFixed(4)}`, value: Math.round(afterDefense) });
  steps.push({ label: '데미지 추가 수치', formula: `속성 ${fmtPct(attributeBonus)} + 공통스킬 ${fmtPct(mergedBuffs.skillDmgBonus + gearSkill)} + ${skillTypeLabel} ${fmtPct(skillTypeBonus)} + 상태 ${fmtPct(effectsResult.dmgBonusFromEffects)}`, value: parseFloat((1 + additionalDmg).toFixed(4)) });
  steps.push({ label: '증폭/취약/받피증/불균형', formula: `증폭 ${(amp * 100).toFixed(1)}% · 취약 ${(vuln * 100).toFixed(1)}% · 받피증 ${(takenDmg * 100).toFixed(1)}% · 불균형 ${(unbalancedTaken * 100).toFixed(1)}%`, value: parseFloat(((1 + amp) * (1 + vuln) * (1 + takenDmg) * (1 + unbalancedTaken)).toFixed(4)) });
  steps.push({ label: '치명타 기댓값 배율', formula: `1 + (치확×치피) = ${critExpectedMult.toFixed(4)}`, value: parseFloat(critExpectedMult.toFixed(4)) });

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
    summaryCards,
  };
}
