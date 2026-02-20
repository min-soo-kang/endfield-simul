import React, { useMemo } from 'react';
import type { GearItem, GearSet, GearSlot, GearStats, GearType } from '../types';

interface GearLoadout {
  Armor: GearItem | null;
  Gloves: GearItem | null;
  Part1: GearItem | null;
  Part2: GearItem | null;
}

interface Props {
  gearItems: GearItem[];
  gearSets: GearSet[];
  loadout: GearLoadout;
  onChange: (slot: GearSlot, item: GearItem | null) => void;
}

const slotLabel: Record<GearSlot, string> = {
  Armor: '방어구',
  Gloves: '글러브',
  Part1: '부품1',
  Part2: '부품2',
};

const slotToType: Record<GearSlot, GearType> = {
  Armor: 'Armor',
  Gloves: 'Gloves',
  Part1: 'Part',
  Part2: 'Part',
};

function renderStatRows(stats: GearStats): string[] {
  const rows: string[] = [];
  if (stats.str) rows.push(`힘 +${stats.str}`);
  if (stats.agi) rows.push(`민첩 +${stats.agi}`);
  if (stats.int) rows.push(`지능 +${stats.int}`);
  if (stats.wil) rows.push(`의지 +${stats.wil}`);
  if (stats.atkFlat) rows.push(`고정 공격력 +${stats.atkFlat}`);
  if (stats.atkPercent) rows.push(`공격력 +${(stats.atkPercent * 100).toFixed(1)}%`);
  if (stats.critRate) rows.push(`치명타 확률 +${(stats.critRate * 100).toFixed(1)}%`);
  if (stats.physDmgBonus) rows.push(`물리 피해 +${(stats.physDmgBonus * 100).toFixed(1)}%`);
  if (stats.artsDmgBonus) rows.push(`아츠 피해 +${(stats.artsDmgBonus * 100).toFixed(1)}%`);
  if (stats.skillDmgBonus) rows.push(`스킬 피해 +${(stats.skillDmgBonus * 100).toFixed(1)}%`);
  return rows;
}

const GearLoadoutSelector: React.FC<Props> = ({ gearItems, gearSets, loadout, onChange }) => {
  const setSummary = useMemo(() => {
    const countMap: Record<string, number> = {};
    Object.values(loadout).forEach(item => {
      if (!item) return;
      countMap[item.setId] = (countMap[item.setId] || 0) + 1;
    });

    return Object.entries(countMap)
      .map(([setId, count]) => ({ setId, count, set: gearSets.find(s => s.id === setId) }))
      .filter(v => v.set)
      .sort((a, b) => b.count - a.count)[0];
  }, [loadout, gearSets]);

  return (
    <div>
      <label className="block text-text-muted text-xs uppercase tracking-wider mb-2">장비 선택 (방어구/글러브/부품2개)</label>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {(Object.keys(slotLabel) as GearSlot[]).map((slot) => {
          const items = gearItems.filter(g => g.type === slotToType[slot]);
          return (
            <div key={slot} className="bg-bg rounded border border-border p-2">
              <div className="text-xs text-text-dim mb-1">{slotLabel[slot]}</div>
              <select
                className="w-full bg-bg border border-border rounded px-2 py-1.5 text-text text-sm"
                value={loadout[slot]?.id || ''}
                onChange={(e) => {
                  const item = items.find(i => i.id === e.target.value) || null;
                  onChange(slot, item);
                }}
              >
                <option value="">미장착</option>
                {items.map(item => (
                  <option key={item.id} value={item.id}>{item.nameKo}</option>
                ))}
              </select>

              {loadout[slot] && (
                <div className="mt-1 space-y-1">
                  {loadout[slot]!.options.map((opt) => (
                    <div key={opt.kind} className="text-[11px] text-text-muted">
                      <div className="text-text-dim">• {opt.nameKo}</div>
                      {renderStatRows(opt.stats).map((st) => (
                        <div key={`${opt.kind}-${st}`} className="pl-2">- {st}</div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-2 text-xs text-text-muted">
        {setSummary?.set ? (
          <>
            <div>현재 세트: <span className="text-text">{setSummary.set.nameKo}</span> ({setSummary.count}부위)</div>
            {setSummary.set.bonuses.map((b, i) => (
              <div key={i} className={setSummary.count >= b.pieces ? 'text-accent' : ''}>
                • {b.pieces}세트: {b.description}
              </div>
            ))}
          </>
        ) : (
          <div>활성 세트 없음</div>
        )}
      </div>
    </div>
  );
};

export default GearLoadoutSelector;
