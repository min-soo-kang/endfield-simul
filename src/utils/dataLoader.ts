import type { Operator, Weapon, GearSet, Enemy, BuffSet, SpecialEffects, WeaponCategory } from '../types';
import chenData from '../data/operators/chen.json';
import weaponsData from '../data/weapons/weapons.json';
import gearsetsData from '../data/gearsets.json';
import enemiesData from '../data/enemies.json';

const allOperators: Operator[] = [
  chenData as unknown as Operator,
];

const allWeapons: Weapon[] = weaponsData as unknown as Weapon[];
const allGearSets: GearSet[] = gearsetsData as unknown as GearSet[];
const allEnemies: Enemy[] = enemiesData as unknown as Enemy[];

export function loadAllOperators(): Operator[] {
  return allOperators;
}

export function getOperatorById(id: string): Operator | undefined {
  return allOperators.find(op => op.id === id);
}

export function getWeaponsForType(weaponType: WeaponCategory): Weapon[] {
  return allWeapons.filter(w => w.weaponType === weaponType);
}

export function getAllWeapons(): Weapon[] {
  return allWeapons;
}

export function getAllGearSets(): GearSet[] {
  return allGearSets;
}

export function getEnemyPresets(): Enemy[] {
  return allEnemies;
}

export function createDefaultEnemy(): Enemy {
  return {
    id: 'custom',
    name: 'Custom',
    def: 300,
    res: 15,
    elementRes: {},
    isVulnerable: false,
  };
}

export function createDefaultBuffs(): BuffSet {
  return {
    atkPercent: 0,
    atkFlat: 0,
    critRate: 0,
    critDmg: 0,
    defPenFlat: 0,
    defPenPercent: 0,
    resPen: 0,
    physDmgBonus: 0,
    artsDmgBonus: 0,
    skillDmgBonus: 0,
    ampBonus: 0,
    vulnBonus: 0,
    takenDmgBonus: 0,
    extraDmgBonus: 0,
  };
}

export function createDefaultEffects(): SpecialEffects {
  return {
    isCrit: false,
    isVulnerable: false,
    armorBreak: false,
    comboStack: 0,
    isBurning: false,
    isShocked: false,
    lowHpTarget: false,
    unbalancedTarget: false,
  };
}
