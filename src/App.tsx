import React, { useState, useCallback } from 'react';
import type { Operator, Weapon, Skill, Enemy, BuffSet, GearSet, SpecialEffects } from './types';
import {
  loadAllOperators,
  getWeaponsForType,
  getAllGearSets,
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
import GearSetSelector from './components/GearSetSelector';
import ResultCard from './components/ResultCard';
import DamageBreakdown from './components/DamageBreakdown';

const operators = loadAllOperators();
const gearSets = getAllGearSets();

function App() {
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);
  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null);
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [selectedSkillLevel, setSelectedSkillLevel] = useState<number>(1);
  const [selectedGearSet, setSelectedGearSet] = useState<GearSet | null>(null);
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
  }, []);

  const handleSkillSelect = useCallback((skill: Skill) => {
    setSelectedSkill(skill);
    setSelectedSkillLevel(skill.levels[skill.levels.length - 1].level);
  }, []);

  const result = useCalculation(
    selectedOperator,
    selectedWeapon,
    selectedSkill,
    selectedSkillLevel,
    enemy,
    buffs,
    effects,
    selectedGearSet
  );

  return (
    <div className="min-h-screen bg-bg text-text">
      <header className="border-b border-border bg-bg-panel">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              Endfield <span className="text-accent">Damage Simulator</span>
            </h1>
            <p className="text-text-dim text-xs">Single-hit damage calculator</p>
          </div>
          <div className="text-text-dim text-xs">v0.2</div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Inputs */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-bg-panel border border-border rounded-lg p-4 space-y-4">
              <OperatorSelector
                operators={operators}
                selected={selectedOperator}
                onSelect={handleOperatorSelect}
              />

              <WeaponSelector
                weapons={availableWeapons}
                selected={selectedWeapon}
                onSelect={setSelectedWeapon}
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
              <GearSetSelector
                gearSets={gearSets}
                selected={selectedGearSet}
                onSelect={setSelectedGearSet}
              />
            </div>

            <div className="bg-bg-panel border border-border rounded-lg p-4">
              <EffectToggles effects={effects} onChange={setEffects} />
            </div>

            {/* Buff Inputs */}
            <div className="bg-bg-panel border border-border rounded-lg p-4">
              <label className="block text-text-muted text-xs uppercase tracking-wider mb-2">
                Additional Buffs
              </label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-text-dim text-xs mb-0.5">ATK %</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    className="w-full bg-bg border border-border rounded px-2 py-1.5 text-text text-sm font-mono focus:border-accent focus:outline-none"
                    value={Math.round(buffs.atkPercent * 100)}
                    onChange={(e) => setBuffs(b => ({ ...b, atkPercent: (parseInt(e.target.value) || 0) / 100 }))}
                  />
                </div>
                <div>
                  <label className="block text-text-dim text-xs mb-0.5">ATK Flat</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full bg-bg border border-border rounded px-2 py-1.5 text-text text-sm font-mono focus:border-accent focus:outline-none"
                    value={buffs.atkFlat}
                    onChange={(e) => setBuffs(b => ({ ...b, atkFlat: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <label className="block text-text-dim text-xs mb-0.5">DEF Pen (flat)</label>
                  <input
                    type="number"
                    min={0}
                    className="w-full bg-bg border border-border rounded px-2 py-1.5 text-text text-sm font-mono focus:border-accent focus:outline-none"
                    value={buffs.defPenFlat}
                    onChange={(e) => setBuffs(b => ({ ...b, defPenFlat: parseInt(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <label className="block text-text-dim text-xs mb-0.5">DEF Pen %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    className="w-full bg-bg border border-border rounded px-2 py-1.5 text-text text-sm font-mono focus:border-accent focus:outline-none"
                    value={Math.round(buffs.defPenPercent * 100)}
                    onChange={(e) => setBuffs(b => ({ ...b, defPenPercent: (parseInt(e.target.value) || 0) / 100 }))}
                  />
                </div>
                <div>
                  <label className="block text-text-dim text-xs mb-0.5">Crit Rate %</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    className="w-full bg-bg border border-border rounded px-2 py-1.5 text-text text-sm font-mono focus:border-accent focus:outline-none"
                    value={Math.round(buffs.critRate * 100)}
                    onChange={(e) => setBuffs(b => ({ ...b, critRate: (parseInt(e.target.value) || 0) / 100 }))}
                  />
                </div>
                <div>
                  <label className="block text-text-dim text-xs mb-0.5">Crit DMG %</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    className="w-full bg-bg border border-border rounded px-2 py-1.5 text-text text-sm font-mono focus:border-accent focus:outline-none"
                    value={Math.round(buffs.critDmg * 100)}
                    onChange={(e) => setBuffs(b => ({ ...b, critDmg: (parseInt(e.target.value) || 0) / 100 }))}
                  />
                </div>
                <div>
                  <label className="block text-text-dim text-xs mb-0.5">Phys DMG %</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    className="w-full bg-bg border border-border rounded px-2 py-1.5 text-text text-sm font-mono focus:border-accent focus:outline-none"
                    value={Math.round(buffs.physDmgBonus * 100)}
                    onChange={(e) => setBuffs(b => ({ ...b, physDmgBonus: (parseInt(e.target.value) || 0) / 100 }))}
                  />
                </div>
                <div>
                  <label className="block text-text-dim text-xs mb-0.5">Skill DMG %</label>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    className="w-full bg-bg border border-border rounded px-2 py-1.5 text-text text-sm font-mono focus:border-accent focus:outline-none"
                    value={Math.round(buffs.skillDmgBonus * 100)}
                    onChange={(e) => setBuffs(b => ({ ...b, skillDmgBonus: (parseInt(e.target.value) || 0) / 100 }))}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Results */}
          <div className="lg:col-span-7 space-y-4">
            <ResultCard result={result} />
            {result && <DamageBreakdown steps={result.steps} />}
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
