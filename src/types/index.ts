/** 오퍼레이터 클래스 (엔드필드 직군) */
export type OperatorClass =
  | 'Vanguard'    // 뱅가드
  | 'Guard'       // 가드
  | 'Sniper'      // 스나이퍼
  | 'Caster'      // 캐스터
  | 'Medic'       // 메딕
  | 'Defender';   // 디펜더

/** 무기 카테고리 */
export type WeaponCategory =
  | 'OneHandSword'   // 한손검
  | 'TwoHandSword'   // 양손검
  | 'Bow'            // 활
  | 'Staff'          // 지팡이
  | 'Pistol'         // 권총
  | 'Shield';        // 방패

/** 데미지 타입 */
export type DamageType = 'Physical' | 'Arts' | 'True';

/** 원소 타입 */
export type ElementType = 'None' | 'Fire' | 'Ice' | 'Electric' | 'Acid';

/** 속성 (능력치) */
export interface Attributes {
  str: number;   // 힘
  agi: number;   // 민첩
  int: number;   // 지능
  wil: number;   // 의지
}

/** 주/보조 능력치 */
export type MainAttribute = 'str' | 'agi' | 'int' | 'wil';

/** 스킬 레벨별 배율 */
export interface SkillLevel {
  level: number;
  multiplier: number;
}

/** 스킬 정의 */
export interface Skill {
  id: string;
  name: string;
  nameKo: string;
  damageType: DamageType;
  element: ElementType;
  /** 스킬 배율 목록 (레벨별) */
  levels: SkillLevel[];
  /** 히트 수 */
  hits: number;
  /** SP/쿨타임 비용 */
  cost?: number;
  /** 쿨타임 (초) */
  cooldown?: number;
  /** 스태거 수치 */
  stagger?: number;
  /** 스킬 설명 */
  description: string;
}

/** 오퍼레이터 스탯 (Lv90 기준) */
export interface OperatorStats {
  hp: number;
  baseAtk: number;
  def: number;
  res: number;
  attributes: Attributes;
  mainAttr: MainAttribute;
  subAttr: MainAttribute;
}

/** 오퍼레이터 */
export interface Operator {
  id: string;
  name: string;
  nameKo: string;
  operatorClass: OperatorClass;
  weaponType: WeaponCategory;
  element: ElementType;
  rarity: number;
  stats: OperatorStats;
  skills: Skill[];
  /** 재능/패시브 설명 */
  talents: string[];
}

/** 무기 */
export interface Weapon {
  id: string;
  name: string;
  nameKo: string;
  rarity: number;
  /** 이 무기의 카테고리 */
  weaponType: WeaponCategory;
  /** 기본 ATK (최대레벨 기준) */
  atk: number;
  /** 서브스탯 설명 */
  subStat: string;
  /** 퍼센트 ATK 보너스 */
  atkPercent: number;
  /** 추가 크리율 보너스 */
  critRate: number;
  /** 추가 크리뎀 보너스 */
  critDmg: number;
  /** 물리 데미지 보너스 */
  physDmgBonus: number;
  /** 아츠 데미지 보너스 */
  artsDmgBonus: number;
  /** 패시브 효과 설명 */
  passive: string;
}

/** 장비 세트 효과 */
export interface GearSetBonus {
  /** 필요 장착 수 */
  pieces: number;
  description: string;
  /** 효과 수치들 */
  atkPercent?: number;
  critRate?: number;
  physDmgBonus?: number;
  artsDmgBonus?: number;
  skillDmgBonus?: number;
}

/** 장비 세트 */
export interface GearSet {
  id: string;
  name: string;
  nameKo: string;
  /** 적합 직군 */
  recommendedFor: string;
  bonuses: GearSetBonus[];
}

/** 적 스탯 */
export interface Enemy {
  id: string;
  name: string;
  def: number;
  res: number;
  /** 원소 저항 (특정 원소) */
  elementRes: Partial<Record<ElementType, number>>;
  /** 방어 불능(Vulnerable) 상태 여부 */
  isVulnerable: boolean;
}

/** 버프/보너스 집계 */
export interface BuffSet {
  /** 퍼센트 ATK 보너스 합산 */
  atkPercent: number;
  /** 고정 ATK 보너스 합산 */
  atkFlat: number;
  /** 추가 크리율 */
  critRate: number;
  /** 추가 크리뎀 */
  critDmg: number;
  /** DEF 관통 (고정) */
  defPenFlat: number;
  /** DEF 관통 (퍼센트, 0.1 = 10%) */
  defPenPercent: number;
  /** RES 관통 */
  resPen: number;
  /** 물리 데미지 보너스 */
  physDmgBonus: number;
  /** 아츠 데미지 보너스 */
  artsDmgBonus: number;
  /** 스킬 데미지 보너스 */
  skillDmgBonus: number;
}

/** 특수 효과 상태 */
export interface SpecialEffects {
  isCrit: boolean;
  /** 방어 불능(Vulnerable) 상태 */
  isVulnerable: boolean;
  /** 갑옷 파괴 (물리 피해 증가) */
  armorBreak: boolean;
  /** 연타 (배틀 스킬 피해 +30%, 궁극기 피해 +20%) */
  comboHit: boolean;
  /** 연소 상태 */
  isBurning: boolean;
  /** 감전 상태 (아츠 피해 증가) */
  isShocked: boolean;
}

/** 계산 단계 하나 */
export interface CalcStep {
  label: string;
  formula: string;
  value: number;
}

/** 최종 데미지 결과 */
export interface DamageResult {
  finalDamage: number;
  isCrit: boolean;
  hitCount: number;
  perHitDamage: number;
  steps: CalcStep[];
  nonCritDamage: number;
  critDamage: number;
  expectedDamage: number;
  critRate: number;
  critMultiplier: number;
}

/** 전체 시뮬레이터 입력 상태 */
export interface SimulatorState {
  selectedOperator: Operator | null;
  selectedWeapon: Weapon | null;
  selectedSkill: Skill | null;
  selectedSkillLevel: number;
  selectedGearSet: GearSet | null;
  enemy: Enemy;
  buffs: BuffSet;
  effects: SpecialEffects;
}
