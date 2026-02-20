import React, { useState, useCallback } from 'react';
import type { Operator, Weapon, Skill, Enemy, BuffSet, GearSet, SpecialEffects, GearItem, GearSlot } from './types';
import {
  loadAllOperators,
  getWeaponsForType,
  getAllGearSets,
  getAllGearItems,
  createDefaultEnemy,
  createDefaultBuffs,
  createDefaultEffects,
} from './utils/dataLoader';
import { useCalculation } from './hooks/useCalculation';
import OperatorSelector from './components/OperatorSelector';
import WeaponSelector from './components/WeaponSelector';
import SkillSelector from './components/SkillSelector';
import EnemyPanel from './components/EnemyPanel';
import EffectToggles from './components/EffectToggles';
import GearLoadoutSelector from './components/GearLoadoutSelector';
import ResultCard from './components/ResultCard';
import DamageBreakdown from './components/DamageBreakdown';
import DamageSummaryPanel from './components/DamageSummaryPanel';
import PotentialSummaryTabs from './components/PotentialSummaryTabs';

const operators = loadAllOperators();
const gearSets = getAllGearSets();
const gearItems = getAllGearItems();

function App() {
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [selectedSkillLevel, setSelectedSkillLevel] = useState<number>(1);
  const [gearLoadout, setGearLoadout] = useState<{ Armor: GearItem | null; Gloves: GearItem | null; Part1: GearItem | null; Part2: GearItem | null; }>({ Armor: null, Gloves: null, Part1: null, Part2: null });
  const [operatorPotentialLevel, setOperatorPotentialLevel] = useState<number>(0);
  const [weaponPotentialLevel, setWeaponPotentialLevel] = useState<number>(0);
  const [enemy, setEnemy] = useState<Enemy>(createDefaultEnemy());
  const [buffs, setBuffs] = useState<BuffSet>(createDefaultBuffs());
  const [effects, setEffects] = useState<SpecialEffects>(createDefaultEffects());

  const availableWeapons = selectedOperator
    ? getWeaponsForType(selectedOperator.weaponType)
    : [];

  const handleOperatorSelect = useCallback((op: Operator) => {
    setSelectedOperator(op);
    setSelectedWeapon(null);
    setSelectedSkill(null);
    setSelectedSkillLevel(1);
    setOperatorPotentialLevel(0);
    setWeaponPotentialLevel(0);
  }, []);

  const handleSkillSelect = useCallback((skill: Skill) => {
    setSelectedSkill(skill);
    setSelectedSkillLevel(skill.levels[skill.levels.length - 1].level);
  }, []);


  const derivedGear = React.useMemo(() => {
    const selected = Object.values(gearLoadout).filter(Boolean) as GearItem[];
    const gearBuffs: Partial<BuffSet> = {
      atkPercent: 0, atkFlat: 0, critRate: 0, critDmg: 0, defPenFlat: 0, defPenPercent: 0,
      resPen: 0, physDmgBonus: 0, artsDmgBonus: 0, skillDmgBonus: 0, ampBonus: 0, vulnBonus: 0, takenDmgBonus: 0, extraDmgBonus: 0,
      strFlat: 0, agiFlat: 0, intFlat: 0, wilFlat: 0,
    };

    selected.forEach(g => {
      g.options.forEach(({ stats }) => {
        gearBuffs.strFlat! += stats.str || 0;
        gearBuffs.agiFlat! += stats.agi || 0;
        gearBuffs.intFlat! += stats.int || 0;
        gearBuffs.wilFlat! += stats.wil || 0;
        gearBuffs.atkPercent! += stats.atkPercent || 0;
        gearBuffs.atkFlat! += stats.atkFlat || 0;
        gearBuffs.critRate! += stats.critRate || 0;
        gearBuffs.physDmgBonus! += stats.physDmgBonus || 0;
        gearBuffs.artsDmgBonus! += stats.artsDmgBonus || 0;
        gearBuffs.skillDmgBonus! += stats.skillDmgBonus || 0;
      });
    });

    const countMap: Record<string, number> = {};
    selected.forEach(g => { countMap[g.setId] = (countMap[g.setId] || 0) + 1; });
    const active = Object.entries(countMap)
      .map(([setId, count]) => ({ set: gearSets.find(s => s.id === setId), count }))
      .filter(v => v.set)
      .sort((a, b) => b.count - a.count)[0];

    let activeSet: GearSet | null = null;
    if (active?.set) {
      const activeBonuses = active.set.bonuses.filter(b => active.count >= b.pieces && active.count >= 3);
      if (activeBonuses.length > 0) {
        activeSet = { ...active.set, bonuses: activeBonuses };
      }
    }

    return { gearBuffs: gearBuffs as BuffSet, activeSet };
  }, [gearLoadout]);

  const combinedBuffs = React.useMemo(() => ({
    ...buffs,
    atkPercent: buffs.atkPercent + derivedGear.gearBuffs.atkPercent,
    atkFlat: buffs.atkFlat + derivedGear.gearBuffs.atkFlat,
    critRate: buffs.critRate + derivedGear.gearBuffs.critRate,
    critDmg: buffs.critDmg + derivedGear.gearBuffs.critDmg,
    defPenFlat: buffs.defPenFlat + derivedGear.gearBuffs.defPenFlat,
    defPenPercent: buffs.defPenPercent + derivedGear.gearBuffs.defPenPercent,
    resPen: buffs.resPen + derivedGear.gearBuffs.resPen,
    physDmgBonus: buffs.physDmgBonus + derivedGear.gearBuffs.physDmgBonus,
    artsDmgBonus: buffs.artsDmgBonus + derivedGear.gearBuffs.artsDmgBonus,
    skillDmgBonus: buffs.skillDmgBonus + derivedGear.gearBuffs.skillDmgBonus,
    ampBonus: buffs.ampBonus + derivedGear.gearBuffs.ampBonus,
    vulnBonus: buffs.vulnBonus + derivedGear.gearBuffs.vulnBonus,
    takenDmgBonus: buffs.takenDmgBonus + derivedGear.gearBuffs.takenDmgBonus,
    extraDmgBonus: buffs.extraDmgBonus + derivedGear.gearBuffs.extraDmgBonus,
    strFlat: buffs.strFlat + derivedGear.gearBuffs.strFlat,
    agiFlat: buffs.agiFlat + derivedGear.gearBuffs.agiFlat,
    intFlat: buffs.intFlat + derivedGear.gearBuffs.intFlat,
    wilFlat: buffs.wilFlat + derivedGear.gearBuffs.wilFlat,
  }), [buffs, derivedGear]);

  const result = useCalculation(
    selectedOperator,
    selectedWeapon,
    selectedSkill,
    selectedSkillLevel,
    enemy,
    combinedBuffs,
    effects,
    derivedGear.activeSet,
    operatorPotentialLevel,
    weaponPotentialLevel
  );

  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="border-b border-border bg-bg-panel">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              엔드필드 <span className="text-accent">데미지 시뮬레이터</span>
            </h1>
            <p className="text-text-dim text-xs">단일 공격 피해 계산기</p>
          </div>
          <div className="text-text-dim text-xs">버전 0.3</div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-bg-panel border border-border rounded-lg p-4 space-y-4">
              <OperatorSelector
                operators={operators}
                selected={selectedOperator}
                onSelect={handleOperatorSelect}
                potentialLevel={operatorPotentialLevel}
                onPotentialChange={setOperatorPotentialLevel}
              />

              <WeaponSelector
                weapons={availableWeapons}
                selected={selectedWeapon}
                onSelect={setSelectedWeapon}
                potentialLevel={weaponPotentialLevel}
                onPotentialChange={setWeaponPotentialLevel}
              />

              <SkillSelector
                skills={selectedOperator?.skills || []}
                selected={selectedSkill}
                selectedLevel={selectedSkillLevel}
                onSelect={handleSkillSelect}
                onLevelChange={setSelectedSkillLevel}
              />
            </div>

            <div className="bg-bg-panel border border-border rounded-lg p-4 space-y-4">
              <EnemyPanel enemy={enemy} onChange={setEnemy} />
            </div>

            <div className="bg-bg-panel border border-border rounded-lg p-4">
              <GearLoadoutSelector
                gearItems={gearItems}
                gearSets={gearSets}
                loadout={gearLoadout}
                onChange={(slot: GearSlot, item: GearItem | null) => setGearLoadout(prev => ({ ...prev, [slot]: item }))}
              />
            </div>

            <div className="bg-bg-panel border border-border rounded-lg p-4">
              <EffectToggles effects={effects} onChange={setEffects} />
            </div>

            <div className="bg-bg-panel border border-border rounded-lg p-4">
              <label className="block text-text-muted text-xs uppercase tracking-wider mb-2">
                추가 버프
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-text-dim text-xs mb-0.5">공격력 %</label>
                  <input type="number" min={0} step={1} className="w-full bg-bg border border-border rounded px-2 py-1.5 text-text text-sm font-mono focus:border-accent focus:outline-none" value={Math.round(buffs.atkPercent * 100)} onChange={(e) => setBuffs(b => ({ ...b, atkPercent: (parseInt(e.target.value) || 0) / 100 }))} />
                </div>
                <div>
                  <label className="block text-text-dim text-xs mb-0.5">고정 공격력</label>
                  <input type="number" min={0} className="w-full bg-bg border border-border rounded px-2 py-1.5 text-text text-sm font-mono focus:border-accent focus:outline-none" value={buffs.atkFlat} onChange={(e) => setBuffs(b => ({ ...b, atkFlat: parseInt(e.target.value) || 0 }))} />
                </div>
                <div>
                  <label className="block text-text-dim text-xs mb-0.5">방어력 관통 (고정)</label>
                  <input type="number" min={0} className="w-full bg-bg border border-border rounded px-2 py-1.5 text-text text-sm font-mono focus:border-accent focus:outline-none" value={buffs.defPenFlat} onChange={(e) => setBuffs(b => ({ ...b, defPenFlat: parseInt(e.target.value) || 0 }))} />
                </div>
                <div>
                  <label className="block text-text-dim text-xs mb-0.5">방어력 관통 %</label>
                  <input type="number" min={0} max={100} step={1} className="w-full bg-bg border border-border rounded px-2 py-1.5 text-text text-sm font-mono focus:border-accent focus:outline-none" value={Math.round(buffs.defPenPercent * 100)} onChange={(e) => setBuffs(b => ({ ...b, defPenPercent: (parseInt(e.target.value) || 0) / 100 }))} />
                </div>
                <div>
                  <label className="block text-text-dim text-xs mb-0.5">치명타 확률 %</label>
                  <input type="number" min={0} max={100} step={1} className="w-full bg-bg border border-border rounded px-2 py-1.5 text-text text-sm font-mono focus:border-accent focus:outline-none" value={Math.round(buffs.critRate * 100)} onChange={(e) => setBuffs(b => ({ ...b, critRate: (parseInt(e.target.value) || 0) / 100 }))} />
                </div>
                <div>
                  <label className="block text-text-dim text-xs mb-0.5">치명타 피해 %</label>
                  <input type="number" min={0} step={1} className="w-full bg-bg border border-border rounded px-2 py-1.5 text-text text-sm font-mono focus:border-accent focus:outline-none" value={Math.round(buffs.critDmg * 100)} onChange={(e) => setBuffs(b => ({ ...b, critDmg: (parseInt(e.target.value) || 0) / 100 }))} />
                </div>
                <div>
                  <label className="block text-text-dim text-xs mb-0.5">물리 피해 %</label>
                  <input type="number" min={0} step={1} className="w-full bg-bg border border-border rounded px-2 py-1.5 text-text text-sm font-mono focus:border-accent focus:outline-none" value={Math.round(buffs.physDmgBonus * 100)} onChange={(e) => setBuffs(b => ({ ...b, physDmgBonus: (parseInt(e.target.value) || 0) / 100 }))} />
                </div>
                <div>
                  <label className="block text-text-dim text-xs mb-0.5">스킬 피해 %</label>
                  <input type="number" min={0} step={1} className="w-full bg-bg border border-border rounded px-2 py-1.5 text-text text-sm font-mono focus:border-accent focus:outline-none" value={Math.round(buffs.skillDmgBonus * 100)} onChange={(e) => setBuffs(b => ({ ...b, skillDmgBonus: (parseInt(e.target.value) || 0) / 100 }))} />
                </div>

                <div>
                  <label className="block text-text-dim text-xs mb-0.5">증폭 %</label>
                  <input type="number" min={0} step={1} className="w-full bg-bg border border-border rounded px-2 py-1.5 text-text text-sm font-mono focus:border-accent focus:outline-none" value={Math.round(buffs.ampBonus * 100)} onChange={(e) => setBuffs(b => ({ ...b, ampBonus: (parseInt(e.target.value) || 0) / 100 }))} />
                </div>
                <div>
                  <label className="block text-text-dim text-xs mb-0.5">취약 %</label>
                  <input type="number" min={0} step={1} className="w-full bg-bg border border-border rounded px-2 py-1.5 text-text text-sm font-mono focus:border-accent focus:outline-none" value={Math.round(buffs.vulnBonus * 100)} onChange={(e) => setBuffs(b => ({ ...b, vulnBonus: (parseInt(e.target.value) || 0) / 100 }))} />
                </div>
                <div>
                  <label className="block text-text-dim text-xs mb-0.5">받는 피해 증가 %</label>
                  <input type="number" min={0} step={1} className="w-full bg-bg border border-border rounded px-2 py-1.5 text-text text-sm font-mono focus:border-accent focus:outline-none" value={Math.round(buffs.takenDmgBonus * 100)} onChange={(e) => setBuffs(b => ({ ...b, takenDmgBonus: (parseInt(e.target.value) || 0) / 100 }))} />
                </div>
                <div>
                  <label className="block text-text-dim text-xs mb-0.5">기타 추가 데미지 %</label>
                  <input type="number" min={0} step={1} className="w-full bg-bg border border-border rounded px-2 py-1.5 text-text text-sm font-mono focus:border-accent focus:outline-none" value={Math.round(buffs.extraDmgBonus * 100)} onChange={(e) => setBuffs(b => ({ ...b, extraDmgBonus: (parseInt(e.target.value) || 0) / 100 }))} />
                </div>

              </div>
            </div>
          </div>

          <div className="lg:col-span-7 space-y-4">
            <ResultCard result={result} />
            <PotentialSummaryTabs
              operator={selectedOperator}
              weapon={selectedWeapon}
              operatorPotentialLevel={operatorPotentialLevel}
              weaponPotentialLevel={weaponPotentialLevel}
            />
            {result && <DamageSummaryPanel items={result.summaryCards} />}
            {result && <DamageBreakdown steps={result.steps} />}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
