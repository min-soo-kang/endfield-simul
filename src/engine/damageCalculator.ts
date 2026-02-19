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
} from '../types';
import type { SkillType } from '../data/constants';
import { calculateAtk } from './atkCalculator';
import { calculateDefense } from './defenseCalc';
import { calculateCrit } from './critCalc';
import { calculateSpecialEffects } from './specialEffects';

/** 스킬 ID에서 타입 추론 */
function inferSkillType(skillId: string): SkillType {
  if (skillId.includes('basic')) return 'basic';
  if (skillId.includes('battle')) return 'battle';
  if (skillId.includes('combo')) return 'combo';
  if (skillId.includes('ultimate')) return 'ultimate';
  return 'battle';
}

/**
 * 메인 데미지 계산 오케스트레이터
 *
 * 1. Total ATK (base + attr + weapon + buffs)
 * 2. Skill Multiplier → Base DMG
 * 3. DEF/RES Reduction
 * 4. DMG Bonus (weapon passive + gear + buffs + effects)
 * 5. Critical
 */
export function calculateDamage(
  operator: Operator,
  weapon: Weapon | null,
  skill: Skill,
  skillLevel: number,
  enemy: Enemy,
  buffs: BuffSet,
  effects: SpecialEffects,
  gearSet: GearSet | null
): DamageResult {
  const allSteps: CalcStep[] = [];
  const skillType = inferSkillType(skill.id);

  // 1. ATK 계산
  allSteps.push({ label: '── ATK Calculation ──', formula: '', value: 0 });
  const atkResult = calculateAtk(operator.stats, weapon, buffs);
  allSteps.push(...atkResult.steps);

  // 2. 스킬 배율 적용
  const levelData = skill.levels.find(l => l.level === skillLevel)
    || skill.levels[skill.levels.length - 1];
  const multiplier = levelData.multiplier;

  allSteps.push({ label: '── Skill Multiplier ──', formula: '', value: 0 });
  allSteps.push({
    label: `${skill.nameKo} (Lv${levelData.level})`,
    formula: `${(multiplier * 100).toFixed(0)}%`,
    value: parseFloat(multiplier.toFixed(4)),
  });

  const baseDmg = atkResult.totalAtk * multiplier;
  allSteps.push({
    label: 'Base Damage',
    formula: `${atkResult.totalAtk} × ${multiplier.toFixed(2)}`,
    value: Math.round(baseDmg),
  });

  // 3. 방어/저항 계산
  allSteps.push({ label: '── Defense Calculation ──', formula: '', value: 0 });
  const defResult = calculateDefense(enemy, buffs, skill.damageType, skill.element);
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
    label: 'After DEF/RES',
    formula: `${Math.round(baseDmg)} × ${
      skill.damageType === 'Physical'
        ? defResult.defMultiplier.toFixed(4)
        : skill.damageType === 'Arts'
          ? defResult.resMultiplier.toFixed(4)
          : '1.0000'
    }`,
    value: Math.round(afterDef),
  });

  // 4. 데미지 보너스 합산
  allSteps.push({ label: '── Damage Bonus ──', formula: '', value: 0 });

  // 무기 물리/아츠 보너스
  const wpnPhys = weapon ? weapon.physDmgBonus : 0;
  const wpnArts = weapon ? weapon.artsDmgBonus : 0;

  // 장비 보너스 집계
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
      // 장비 ATK%는 이미 ATK 계산에서 buffs.atkPercent로 입력
    }
  }

  // 특수 효과
  const effectsResult = calculateSpecialEffects(effects, skill.damageType, skillType);
  allSteps.push(...effectsResult.steps);

  // 총 데미지 보너스
  let totalDmgBonus = 0;

  if (skill.damageType === 'Physical') {
    totalDmgBonus += wpnPhys + buffs.physDmgBonus + gearPhys;
  } else if (skill.damageType === 'Arts') {
    totalDmgBonus += wpnArts + buffs.artsDmgBonus + gearArts;
  }
  totalDmgBonus += buffs.skillDmgBonus + gearSkill;
  totalDmgBonus += effectsResult.dmgBonusFromEffects;

  const dmgBonusMult = 1 + totalDmgBonus;
  allSteps.push({
    label: 'Total DMG Bonus',
    formula: `1 + ${(totalDmgBonus * 100).toFixed(1)}%`,
    value: parseFloat(dmgBonusMult.toFixed(4)),
  });

  const afterBonus = afterDef * dmgBonusMult;
  allSteps.push({
    label: 'After DMG Bonus',
    formula: `${Math.round(afterDef)} × ${dmgBonusMult.toFixed(4)}`,
    value: Math.round(afterBonus),
  });

  // 5. 크리티컬
  allSteps.push({ label: '── Critical ──', formula: '', value: 0 });

  // 장비 크리율 보너스를 buffs에 추가
  const effectiveBuffs = { ...buffs, critRate: buffs.critRate + gearCritRate };
  const critResult = calculateCrit(weapon, effectiveBuffs);
  allSteps.push(...critResult.steps);

  const nonCritDamage = Math.round(afterBonus);
  const critDamage = Math.round(afterBonus * critResult.critMultiplier);
  const expectedDamage = Math.round(
    nonCritDamage * (1 - critResult.critRate) + critDamage * critResult.critRate
  );

  allSteps.push({ label: '── Final Results ──', formula: '', value: 0 });
  allSteps.push({ label: 'Non-Crit Damage', formula: `${nonCritDamage.toLocaleString()}`, value: nonCritDamage });
  allSteps.push({
    label: 'Crit Damage',
    formula: `${nonCritDamage.toLocaleString()} × ${critResult.critMultiplier.toFixed(2)}`,
    value: critDamage,
  });
  allSteps.push({
    label: 'Expected Damage',
    formula: `non-crit × ${((1 - critResult.critRate) * 100).toFixed(1)}% + crit × ${(critResult.critRate * 100).toFixed(1)}%`,
    value: expectedDamage,
  });

  const finalDamage = effects.isCrit ? critDamage : nonCritDamage;

  return {
    finalDamage,
    isCrit: effects.isCrit,
    steps: allSteps,
    nonCritDamage,
    critDamage,
    expectedDamage,
    critRate: critResult.critRate,
    critMultiplier: critResult.critMultiplier,
  };
}
