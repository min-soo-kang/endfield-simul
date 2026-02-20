import type { Operator, Weapon, GearSet, Enemy, BuffSet, SpecialEffects, WeaponCategory, GearItem, GearType } from '../types';
import chenData from '../data/operators/chen.json';
import endministratorData from '../data/operators/endministrator.json';
import lifengData from '../data/operators/lifeng.json';
import emberData from '../data/operators/ember.json';
import snowshineData from '../data/operators/snowshine.json';
import daPanData from '../data/operators/da_pan.json';
import perlicaData from '../data/operators/perlica.json';
import pogranichnikData from '../data/operators/pogranichnik.json';
import yvonneData from '../data/operators/yvonne.json';
import weaponsData from '../data/weapons/weapons.json';
import greatswordsData from '../data/weapons/greatswords.json';
import poleArmsData from '../data/weapons/polearms.json';
import handCannonsData from '../data/weapons/handcannons.json';
import artsUnitsData from '../data/weapons/arts_units.json';
import gearsetsData from '../data/gearsets.json';
import enemiesData from '../data/enemies.json';
import gearsData from '../data/gears.json';

const allOperators: Operator[] = [
  chenData as unknown as Operator,
  endministratorData as unknown as Operator,
  lifengData as unknown as Operator,
  emberData as unknown as Operator,
  snowshineData as unknown as Operator,
  daPanData as unknown as Operator,
  perlicaData as unknown as Operator,
  pogranichnikData as unknown as Operator,
  yvonneData as unknown as Operator,
];

const allWeapons: Weapon[] = [
  ...(weaponsData as unknown as Weapon[]),
  ...(greatswordsData as unknown as Weapon[]),
  ...(poleArmsData as unknown as Weapon[]),
  ...(handCannonsData as unknown as Weapon[]),
  ...(artsUnitsData as unknown as Weapon[]),
];
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
    battleSkillDmgBonus: 0,
    comboSkillDmgBonus: 0,
    ultimateSkillDmgBonus: 0,
    ampBonus: 0,
    physAmpBonus: 0,
    artsAmpBonus: 0,
    vulnBonus: 0,
    physVulnBonus: 0,
    artsVulnBonus: 0,
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
    comboBattlePerStack: 0.15,
    comboUltimatePerStack: 0.1,
  };
}


export function getAllGearItems(): GearItem[] {
  return allGearItems;
}

export function getGearItemsByType(type: GearType): GearItem[] {
  return allGearItems.filter(g => g.type === type);
}
