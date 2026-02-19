import type { Enemy, BuffSet, DamageType, ElementType, CalcStep } from '../types';
import { DEF_CONSTANT } from '../data/constants';

export interface DefenseResult {
  defMultiplier: number;
  resMultiplier: number;
  steps: CalcStep[];
}

/**
 * 방어력/저항 계산
 * Physical: DefMult = DEF_CONSTANT / (effectiveDef + DEF_CONSTANT)
 * Arts: ResMult = 1 - effectiveRes / 100
 * True: 1.0 (감소 없음)
 */
export function calculateDefense(
  enemy: Enemy,
  buffs: BuffSet,
  damageType: DamageType,
  element: ElementType
): DefenseResult {
  const steps: CalcStep[] = [];

  let defMultiplier = 1;
  let resMultiplier = 1;

  if (damageType === 'Physical') {
    let effectiveDef = enemy.def;
    steps.push({ label: 'Enemy DEF', formula: `${effectiveDef}`, value: effectiveDef });

    // DEF 퍼센트 관통
    if (buffs.defPenPercent > 0) {
      const reduced = effectiveDef * (1 - buffs.defPenPercent);
      steps.push({
        label: 'DEF % Penetration',
        formula: `${Math.round(effectiveDef)} × (1 - ${(buffs.defPenPercent * 100).toFixed(0)}%)`,
        value: Math.round(reduced),
      });
      effectiveDef = reduced;
    }

    // DEF 고정 관통
    if (buffs.defPenFlat > 0) {
      effectiveDef = Math.max(0, effectiveDef - buffs.defPenFlat);
      steps.push({
        label: 'DEF Flat Penetration',
        formula: `max(0, ${Math.round(effectiveDef + buffs.defPenFlat)} - ${buffs.defPenFlat})`,
        value: Math.round(effectiveDef),
      });
    }

    defMultiplier = DEF_CONSTANT / (effectiveDef + DEF_CONSTANT);
    steps.push({
      label: 'DEF Multiplier',
      formula: `${DEF_CONSTANT} / (${Math.round(effectiveDef)} + ${DEF_CONSTANT})`,
      value: parseFloat(defMultiplier.toFixed(4)),
    });
  } else if (damageType === 'Arts') {
    let effectiveRes = enemy.res;
    steps.push({ label: 'Enemy RES', formula: `${effectiveRes}`, value: effectiveRes });

    // 원소 저항 추가
    const elemRes = enemy.elementRes[element] || 0;
    if (elemRes > 0) {
      effectiveRes += elemRes;
      steps.push({
        label: `${element} Element RES`,
        formula: `${enemy.res} + ${elemRes}`,
        value: effectiveRes,
      });
    }

    // RES 관통
    if (buffs.resPen > 0) {
      effectiveRes = Math.max(0, effectiveRes - buffs.resPen);
      steps.push({
        label: 'RES Penetration',
        formula: `max(0, RES - ${buffs.resPen})`,
        value: effectiveRes,
      });
    }

    resMultiplier = Math.max(0, 1 - effectiveRes / 100);
    steps.push({
      label: 'RES Multiplier',
      formula: `1 - ${effectiveRes}/100`,
      value: parseFloat(resMultiplier.toFixed(4)),
    });
  } else {
    steps.push({ label: 'True Damage', formula: 'No DEF/RES reduction', value: 1 });
  }

  return { defMultiplier, resMultiplier, steps };
}
