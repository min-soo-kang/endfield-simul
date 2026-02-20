import type { Operator, Weapon, GearSet, Enemy, BuffSet, SpecialEffects, WeaponCategory, GearItem, GearType } from '../types';
import chenData from '../data/operators/chen.json';
import weaponsData from '../data/weapons/weapons.json';
import gearsetsData from '../data/gearsets.json';
import enemiesData from '../data/enemies.json';
import gearsData from '../data/gears.json';

const allOperators: Operator[] = [
  chenData as unknown as Operator,
];

const allWeapons: Weapon[] = weaponsData as unknown as Weapon[];
const allGearSets: GearSet[] = gearsetsData as unknown as GearSet[];
const allEnemies: Enemy[] = enemiesData as unknown as Enemy[];
const allGearItems: GearItem[] = gearsData as unknown as GearItem[];

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
  return allEnemies.map(e => ({ ...e, hpPercent: e.hpPercent ?? 100, isUnbalanced: e.isUnbalanced ?? false }));
}

export function createDefaultEnemy(): Enemy {
  return {
    id: 'custom',
    name: 'Custom',
    def: 300,
    res: 15,
    elementRes: {},
    isVulnerable: false,
    hpPercent: 100,
    isUnbalanced: false,
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
    strFlat: 0,
    agiFlat: 0,
    intFlat: 0,
    wilFlat: 0,
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
    comboBattlePerStack: 0.3,
    comboUltimatePerStack: 0.2,
  };
}


export function getAllGearItems(): GearItem[] {
  return allGearItems;
}

export function getGearItemsByType(type: GearType): GearItem[] {
  return allGearItems.filter(g => g.type === type);
}
