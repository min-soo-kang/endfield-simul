/** 기본 크리티컬 확률 (5%) */
export const BASE_CRIT_RATE = 0.05;

/** 기본 크리티컬 데미지 (150% = 1.5 배율) */
export const BASE_CRIT_DMG = 0.5;

/** 방어 계산 기준 상수 */
export const DEF_CONSTANT = 100;

/** 연타 - 배틀 스킬 피해 증가 (30%) */
export const COMBO_HIT_BATTLE_SKILL_BONUS = 0.3;

/** 연타 - 궁극기 피해 증가 (20%) */
export const COMBO_HIT_ULTIMATE_BONUS = 0.2;

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

/** 능력치 → ATK 변환: 주능력치 1pt = ATK 1% */
export const MAIN_ATTR_ATK_RATIO = 0.01;

/** 능력치 → ATK 변환: 부능력치 1pt = ATK 0.4% */
export const SUB_ATTR_ATK_RATIO = 0.004;

/** 스킬 타입 식별용 */
export type SkillType = 'basic' | 'battle' | 'combo' | 'ultimate';
