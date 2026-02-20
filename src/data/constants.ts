/** 기본 크리티컬 확률 (5%) */
export const BASE_CRIT_RATE = 0.05;

/** 기본 크리티컬 데미지 (150% = 1.5 배율) */
export const BASE_CRIT_DMG = 0.5;

/** 방어 계산 기준 상수 */
export const DEF_CONSTANT = 100;

/** 연타 - 배틀 스킬 기본 배율 ((스택+1)×15% → 30/45/60/75%) */
export const COMBO_HIT_BATTLE_SKILL_BONUS = 0.15;

/** 연타 - 궁극기 기본 배율 ((스택+1)×10% → 20/30/40/50%) */
export const COMBO_HIT_ULTIMATE_BONUS = 0.1;

/** 갑옷 파괴 - 물리 피해 증가 최소 (12%) */
export const ARMOR_BREAK_PHYS_BONUS_MIN = 0.12;

/** 갑옷 파괴 - 물리 피해 증가 최대 (24%) */
export const ARMOR_BREAK_PHYS_BONUS_MAX = 0.24;

/** 갑옷 파괴 - 시뮬레이터 기본값 (18% 중간값) */
export const ARMOR_BREAK_PHYS_BONUS = 0.18;

/** 감전 - 아츠 피해 증가 최소 (12%) */
export const SHOCK_ARTS_BONUS_MIN = 0.12;

/** 감전 - 아츠 피해 증가 최대 (24%) */
export const SHOCK_ARTS_BONUS_MAX = 0.24;

/** 감전 - 시뮬레이터 기본값 (18% 중간값) */
export const SHOCK_ARTS_BONUS = 0.18;

/** 능력치 → ATK 변환: 주능력치 2pt = ATK 1% */
export const MAIN_ATTR_ATK_RATIO = 0.005;

/** 능력치 → ATK 변환: 부능력치 5pt = ATK 1% */
export const SUB_ATTR_ATK_RATIO = 0.002;

/** 스킬 타입 식별용 */
export type SkillType = 'basic' | 'battle' | 'combo' | 'ultimate';
