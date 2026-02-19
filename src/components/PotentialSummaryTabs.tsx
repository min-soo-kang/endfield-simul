import React, { useMemo, useState } from 'react';
import type { Operator, Weapon, PotentialBonus } from '../types';

interface Props {
  operator: Operator | null;
  weapon: Weapon | null;
  operatorPotentialLevel: number;
  weaponPotentialLevel: number;
}

function formatBonusList(bonus?: PotentialBonus): string[] {
  if (!bonus) return [];
  const rows: string[] = [];
  if (bonus.atkPercent) rows.push(`공격력 +${(bonus.atkPercent * 100).toFixed(1)}%`);
  if (bonus.atkFlat) rows.push(`고정 공격력 +${bonus.atkFlat}`);
  if (bonus.critRate) rows.push(`치명타 확률 +${(bonus.critRate * 100).toFixed(1)}%`);
  if (bonus.critDmg) rows.push(`치명타 피해 +${(bonus.critDmg * 100).toFixed(1)}%`);
  if (bonus.physDmgBonus) rows.push(`물리 피해 +${(bonus.physDmgBonus * 100).toFixed(1)}%`);
  if (bonus.artsDmgBonus) rows.push(`아츠 피해 +${(bonus.artsDmgBonus * 100).toFixed(1)}%`);
  if (bonus.skillDmgBonus) rows.push(`스킬 피해 +${(bonus.skillDmgBonus * 100).toFixed(1)}%`);
  if (bonus.defPenFlat) rows.push(`방어력 고정 관통 +${bonus.defPenFlat}`);
  if (bonus.defPenPercent) rows.push(`방어력 % 관통 +${(bonus.defPenPercent * 100).toFixed(1)}%`);
  return rows;
}

const PotentialSummaryTabs: React.FC<Props> = ({
  operator,
  weapon,
  operatorPotentialLevel,
  weaponPotentialLevel,
}) => {
  const [tab, setTab] = useState<'operator' | 'weapon'>('operator');

  const opBonus = useMemo(
    () => operator?.potentialBonuses?.find(p => p.level === operatorPotentialLevel),
    [operator, operatorPotentialLevel]
  );
  const weaponBonus = useMemo(
    () => weapon?.potentialBonuses?.find(p => p.level === weaponPotentialLevel),
    [weapon, weaponPotentialLevel]
  );

  const current = tab === 'operator' ? opBonus : weaponBonus;
  const lines = formatBonusList(current);

  return (
    <div className="bg-bg-panel border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border">
        <h3 className="text-text text-sm font-medium">잠재 효과 정리</h3>
      </div>

      <div className="px-4 pt-3 flex gap-2">
        <button
          onClick={() => setTab('operator')}
          className={`px-3 py-1.5 text-xs rounded border ${
            tab === 'operator' ? 'border-accent text-text bg-accent/10' : 'border-border text-text-muted'
          }`}
        >
          캐릭터 잠재
        </button>
        <button
          onClick={() => setTab('weapon')}
          className={`px-3 py-1.5 text-xs rounded border ${
            tab === 'weapon' ? 'border-accent text-text bg-accent/10' : 'border-border text-text-muted'
          }`}
        >
          무기 잠재
        </button>
      </div>

      <div className="px-4 py-3 text-sm">
        <div className="text-text font-medium">
          {tab === 'operator' ? (operator?.nameKo || '선택 없음') : (weapon?.nameKo || '선택 없음')}
        </div>
        <div className="text-text-dim text-xs mt-1">{current?.description || '잠재 효과 없음'}</div>

        <div className="mt-2 space-y-1">
          {lines.length > 0 ? lines.map((line, i) => (
            <div key={i} className="text-text-muted text-xs">• {line}</div>
          )) : <div className="text-text-muted text-xs">• 수치 보너스 없음</div>}
        </div>
      </div>
    </div>
  );
};

export default PotentialSummaryTabs;
