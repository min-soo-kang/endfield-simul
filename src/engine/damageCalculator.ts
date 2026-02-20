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
  bonus += wp.physDmgBonus || 0;
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

  const potentialSkillDmg = sumOperatorPotentialValue(opBonuses, 'skillDmgBonus');
  const potentialPhys = sumOperatorPotentialValue(opBonuses, 'physDmgBonus');
  const potentialArts = sumOperatorPotentialValue(opBonuses, 'artsDmgBonus');
  const talentBuffs = operator.talentBuffs || {};

  // 세트 효과 전체 추출 (mergedBuffs 이전에 수행해야 ATK/크리율에 반영됨)
  let gearPhys = 0, gearArts = 0, gearSkill = 0, gearBattle = 0, gearCombo = 0, gearUltimate = 0;
  let gearSetAtkPercent = 0, gearSetCritRate = 0;
  if (gearSet) {
    for (const b of gearSet.bonuses) {
      gearSetAtkPercent += b.atkPercent || 0;
      gearSetCritRate += b.critRate || 0;
      gearPhys += b.physDmgBonus || 0;
      gearArts += b.artsDmgBonus || 0;
      gearSkill += b.skillDmgBonus || 0;
      gearBattle += b.battleSkillDmgBonus || 0;
      gearCombo += b.comboSkillDmgBonus || 0;
      gearUltimate += b.ultimateSkillDmgBonus || 0;
    }
  }

  const mergedBuffs: BuffSet = {
    ...buffs,
    atkPercent: buffs.atkPercent + sumOperatorPotentialValue(opBonuses, 'atkPercent') + (talentBuffs.atkPercent || 0) + gearSetAtkPercent,
    atkFlat: buffs.atkFlat + sumOperatorPotentialValue(opBonuses, 'atkFlat') + (talentBuffs.atkFlat || 0),
    critRate: buffs.critRate + sumOperatorPotentialValue(opBonuses, 'critRate') + (talentBuffs.critRate || 0) + gearSetCritRate,
    critDmg: buffs.critDmg + sumOperatorPotentialValue(opBonuses, 'critDmg') + (talentBuffs.critDmg || 0),
    physDmgBonus: buffs.physDmgBonus + potentialPhys + (talentBuffs.physDmgBonus || 0),
    artsDmgBonus: buffs.artsDmgBonus + potentialArts + (talentBuffs.artsDmgBonus || 0),
    skillDmgBonus: buffs.skillDmgBonus + potentialSkillDmg + (talentBuffs.skillDmgBonus || 0),
  };

  const atkResult = calculateAtk(opStats, weapon, mergedBuffs);
  const levelData = skill.levels.find(l => l.level === skillLevel) || skill.levels[skill.levels.length - 1];
  const multBonus = getPotentialSkillMultiplierBonus(opBonuses, skillType);
  const finalMultiplier = levelData.multiplier * (1 + multBonus);
  const preDefenseDamage = atkResult.totalAtk * finalMultiplier;

  const defense = calculateDefense(enemy, mergedBuffs, skill.damageType, skill.element);
  const defMult = skill.damageType === 'Physical' ? defense.defMultiplier : skill.damageType === 'Arts' ? defense.resMultiplier : 1;
  const afterDefense = preDefenseDamage * defMult;

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

  const skillTypeLabel = getSkillTypeLabel(skillType);
  const dmgTypeLabel = skill.damageType === 'Physical' ? '물리' : skill.damageType === 'Arts' ? '아츠' : '진실';

  // 피해 증가 출처별 분류
  const weaponAttrBonus = skill.damageType === 'Physical' ? (weapon?.physDmgBonus || 0)
    : skill.damageType === 'Arts' ? (weapon?.artsDmgBonus || 0) : 0;
  const potentialAttrBonus = skill.damageType === 'Physical' ? potentialPhys
    : skill.damageType === 'Arts' ? potentialArts : 0;
  const talentAttrBonus = skill.damageType === 'Physical' ? (talentBuffs.physDmgBonus || 0)
    : skill.damageType === 'Arts' ? (talentBuffs.artsDmgBonus || 0) : 0;
  const externalAttrBonus = skill.damageType === 'Physical' ? buffs.physDmgBonus
    : skill.damageType === 'Arts' ? buffs.artsDmgBonus : 0;
  const gearAttrBonus = skill.damageType === 'Physical' ? gearPhys
    : skill.damageType === 'Arts' ? gearArts : 0;
  const talentSkillDmg = talentBuffs.skillDmgBonus || 0;
  const externalSkillBonus = buffs.skillDmgBonus;
  const externalSkillTypeBonus = skillType === 'battle' ? buffs.battleSkillDmgBonus
    : skillType === 'combo' ? buffs.comboSkillDmgBonus
    : skillType === 'ultimate' ? buffs.ultimateSkillDmgBonus : 0;
  const gearSkillTypeBonus = skillType === 'battle' ? gearBattle
    : skillType === 'combo' ? gearCombo
    : skillType === 'ultimate' ? gearUltimate : 0;
  const setName = gearSet?.nameKo || '';

  const dmgSourceLines: string[] = [];
  if (weaponAttrBonus > 0) dmgSourceLines.push(`[무기] ${dmgTypeLabel} 피해 +${fmtPct(weaponAttrBonus)}`);
  if (potentialAttrBonus > 0) dmgSourceLines.push(`[잠재] ${dmgTypeLabel} 피해 +${fmtPct(potentialAttrBonus)}`);
  if (talentAttrBonus > 0) dmgSourceLines.push(`[재능] ${dmgTypeLabel} 피해 +${fmtPct(talentAttrBonus)}`);
  if (externalAttrBonus > 0) dmgSourceLines.push(`[버프] ${dmgTypeLabel} 피해 +${fmtPct(externalAttrBonus)}`);
  if (gearAttrBonus > 0) dmgSourceLines.push(`[세트·${setName}] ${dmgTypeLabel} 피해 +${fmtPct(gearAttrBonus)}`);
  if (potentialSkillDmg > 0) dmgSourceLines.push(`[잠재] 스킬 피해 +${fmtPct(potentialSkillDmg)}`);
  if (talentSkillDmg > 0) dmgSourceLines.push(`[재능] 스킬 피해 +${fmtPct(talentSkillDmg)}`);
  if (externalSkillBonus > 0) dmgSourceLines.push(`[버프] 스킬 피해 +${fmtPct(externalSkillBonus)}`);
  if (gearSkill > 0) dmgSourceLines.push(`[세트·${setName}] 스킬 피해 +${fmtPct(gearSkill)}`);
  if (externalSkillTypeBonus > 0) dmgSourceLines.push(`[버프] ${skillTypeLabel} 피해 +${fmtPct(externalSkillTypeBonus)}`);
  if (gearSkillTypeBonus > 0) dmgSourceLines.push(`[세트·${setName}] ${skillTypeLabel} 피해 +${fmtPct(gearSkillTypeBonus)}`);
  if (buyoBonus > 0) dmgSourceLines.push(`[부요 3옵] +${fmtPct(buyoBonus)}`);
  if (mergedBuffs.extraDmgBonus > 0) dmgSourceLines.push(`[기타] +${fmtPct(mergedBuffs.extraDmgBonus)}`);
  for (const st of effectsResult.steps) {
    if (st.value > 0) dmgSourceLines.push(`[상태효과] ${st.label} +${fmtPct(st.value)}`);
  }
  if (dmgSourceLines.length === 0) dmgSourceLines.push('피해 증가 없음');

  const amp = mergedBuffs.ampBonus;
  const vuln = mergedBuffs.vulnBonus;
  const takenDmg = mergedBuffs.takenDmgBonus;

  const comboFinal = effectsResult.comboFinalBonus;
  const totalBeforeCrit = afterDefense * (1 + additionalDmg) * (1 + amp) * (1 + vuln) * (1 + takenDmg) * (1 + unbalancedTaken) * (1 + comboFinal);

  const critRate = Math.min(1, 0.05 + (weapon?.critRate || 0) + mergedBuffs.critRate);
  const critDmg = 0.5 + (weapon?.critDmg || 0) + mergedBuffs.critDmg;
  const critExpectedMult = 1 + (critRate * critDmg);

  const nonCritDamage = Math.round(totalBeforeCrit);
  const critDamage = Math.round(totalBeforeCrit * (1 + critDmg));
  const expectedDamage = Math.round(totalBeforeCrit * critExpectedMult);

  const atkPct = mergedBuffs.atkPercent + (weapon?.atkPercent || 0);
  const statBonus = opStats.attributes[opStats.mainAttr] * 0.005 + opStats.attributes[opStats.subAttr] * 0.002;

  const summaryCards: SummaryCardItem[] = [
    {
      key: 'atk',
      title: '공격력',
      valueText: atkResult.totalAtk.toLocaleString(),
      details: [
        `기초공 (${opStats.baseAtk} + 무기 ${weapon?.atk || 0}) = ${opStats.baseAtk + (weapon?.atk || 0)}`,
        `공격력% ${fmtPct(atkPct)}${talentBuffs.atkPercent ? ` (재능 ${fmtPct(talentBuffs.atkPercent)} 포함)` : ''}${gearSetAtkPercent > 0 ? ` (세트 ${fmtPct(gearSetAtkPercent)} 포함)` : ''}`,
        `스탯 보너스 ${fmtPct(statBonus)} (${opStats.mainAttr} ${opStats.attributes[opStats.mainAttr]}×0.5% + ${opStats.subAttr} ${opStats.attributes[opStats.subAttr]}×0.2%)`,
        ...(mergedBuffs.strFlat || mergedBuffs.agiFlat || mergedBuffs.intFlat || mergedBuffs.wilFlat
          ? [`장비 스탯 힘+${mergedBuffs.strFlat} 민+${mergedBuffs.agiFlat} 지+${mergedBuffs.intFlat} 의+${mergedBuffs.wilFlat}`]
          : []),
      ],
    },
    {
      key: 'dmg_increase',
      title: `${dmgTypeLabel} 피해 증가 (피증)`,
      valueText: `+${(additionalDmg * 100).toFixed(1)}%`,
      details: dmgSourceLines,
    },
    {
      key: 'def_res',
      title: skill.damageType === 'Physical' ? '방어 감소' : skill.damageType === 'Arts' ? '저항 감소' : '방어/저항',
      valueText: skill.damageType === 'True' ? '×1.000' : `×${defMult.toFixed(3)}`,
      details: skill.damageType === 'Physical'
        ? [
            `적 방어력 ${enemy.def}${mergedBuffs.defPenFlat > 0 ? ` · 고정 관통 -${mergedBuffs.defPenFlat}` : ''}${mergedBuffs.defPenPercent > 0 ? ` · % 관통 ${fmtPct(mergedBuffs.defPenPercent)}` : ''}`,
            `배율 = 100 / (실효방어력+100) = ×${defMult.toFixed(4)}`,
          ]
        : skill.damageType === 'Arts'
        ? [
            `적 저항 ${enemy.res}%${mergedBuffs.resPen > 0 ? ` · 저항 관통 ${fmtPct(mergedBuffs.resPen)}` : ''}`,
            `배율 = 1 - 실효저항/100 = ×${defMult.toFixed(4)}`,
          ]
        : ['진실 피해 — 방어/저항 무시'],
    },
    {
      key: 'crit',
      title: '치명타',
      valueText: `×${critExpectedMult.toFixed(3)}`,
      details: [
        `치명타 확률 ${fmtPct(critRate)} (기본 5% + 무기 ${fmtPct(weapon?.critRate || 0)} + 버프 ${fmtPct(mergedBuffs.critRate)}${gearSetCritRate > 0 ? ` (세트 ${fmtPct(gearSetCritRate)} 포함)` : ''})`,
        `치명타 피해 +${fmtPct(critDmg)} (기본 50% + 무기 ${fmtPct(weapon?.critDmg || 0)} + 버프 ${fmtPct(mergedBuffs.critDmg)})`,
        `기댓값 배율 = 1 + (치확×치피) = ×${critExpectedMult.toFixed(3)}`,
      ],
    },
    {
      key: 'taken_dmg',
      title: '받는 피해 증가 (받피증)',
      valueText: `+${(((1 + takenDmg) * (1 + unbalancedTaken) - 1) * 100).toFixed(1)}%`,
      details: [
        `받피증 +${(takenDmg * 100).toFixed(1)}%`,
        `불균형 +${(unbalancedTaken * 100).toFixed(1)}% ${enemy.isUnbalanced ? '(활성)' : '(비활성)'}`,
        `합산 배율 ×${((1 + takenDmg) * (1 + unbalancedTaken)).toFixed(4)}`,
      ],
    },
    {
      key: 'amp',
      title: '증폭',
      valueText: `+${(amp * 100).toFixed(1)}%`,
      details: [`배율 ×${(1 + amp).toFixed(4)}`],
    },
    {
      key: 'vuln',
      title: '취약',
      valueText: `+${(vuln * 100).toFixed(1)}%`,
      details: [`배율 ×${(1 + vuln).toFixed(4)}`],
    },
    {
      key: 'combo',
      title: '연타',
      valueText: `+${(comboFinal * 100).toFixed(1)}%`,
      details: [
        comboFinal > 0
          ? `배율 ×${(1 + comboFinal).toFixed(4)}`
          : '적용 없음',
      ],
    },
  ];

  // 피해 계산 단계 (정보.md 공식 순서: ATK × 계수 × 피증 × 방어 × 받피증 × 불균형 × 증폭 × 취약 × 치명타)
  steps.push({ label: '공격력', formula: atkResult.steps[0].formula, value: atkResult.totalAtk });
  steps.push({ label: '스킬 계수', formula: `${(levelData.multiplier * 100).toFixed(0)}%${multBonus > 0 ? ` × (1+${(multBonus * 100).toFixed(1)}% 잠재)` : ''}`, value: parseFloat(finalMultiplier.toFixed(4)) });
  steps.push({ label: `${dmgTypeLabel} 피해 증가 (피증)`, formula: `+${(additionalDmg * 100).toFixed(1)}% → ×${(1 + additionalDmg).toFixed(4)}`, value: parseFloat((1 + additionalDmg).toFixed(4)) });
  steps.push({ label: skill.damageType === 'Physical' ? '방어 감소' : skill.damageType === 'Arts' ? '저항 감소' : '방어/저항', formula: `×${defMult.toFixed(4)}`, value: Math.round(afterDefense) });
  steps.push({ label: '받는 피해 증가 (받피증)', formula: `+${(takenDmg * 100).toFixed(1)}% → ×${(1 + takenDmg).toFixed(4)}`, value: parseFloat((1 + takenDmg).toFixed(4)) });
  steps.push({ label: '불균형 받피증', formula: enemy.isUnbalanced ? '+30.0% → ×1.3000' : '+0.0% (비활성)', value: parseFloat((1 + unbalancedTaken).toFixed(4)) });
  if (amp > 0) steps.push({ label: '증폭', formula: `+${(amp * 100).toFixed(1)}% → ×${(1 + amp).toFixed(4)}`, value: parseFloat((1 + amp).toFixed(4)) });
  if (vuln > 0) steps.push({ label: '취약', formula: `+${(vuln * 100).toFixed(1)}% → ×${(1 + vuln).toFixed(4)}`, value: parseFloat((1 + vuln).toFixed(4)) });
  if (comboFinal > 0) steps.push({ label: '연타', formula: `+${(comboFinal * 100).toFixed(1)}% → ×${(1 + comboFinal).toFixed(4)}`, value: parseFloat((1 + comboFinal).toFixed(4)) });
  steps.push({ label: '치명타 기댓값', formula: `1 + (${fmtPct(critRate)}×${fmtPct(critDmg)}) = ×${critExpectedMult.toFixed(4)}`, value: parseFloat(critExpectedMult.toFixed(4)) });

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
