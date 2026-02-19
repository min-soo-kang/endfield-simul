import React from 'react';
import type { DamageResult } from '../types';

interface Props {
  result: DamageResult | null;
}

const ResultCard: React.FC<Props> = ({ result }) => {
  if (!result) {
    return (
      <div className="bg-bg-panel border border-border rounded-lg p-6 text-center">
        <div className="text-text-dim text-sm">
          Select an operator and skill to see damage
        </div>
      </div>
    );
  }

  return (
    <div className="bg-bg-panel border border-border rounded-lg p-6">
      <div className="text-center mb-4">
        <div className="text-text-dim text-xs uppercase tracking-wider mb-1">
          {result.isCrit ? 'Critical Hit' : 'Normal Hit'}
        </div>
        <div
          className={`text-5xl font-bold font-mono tracking-tight ${
            result.isCrit ? 'text-highlight' : 'text-text'
          }`}
        >
          {result.finalDamage.toLocaleString()}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="text-center bg-bg rounded px-2 py-2">
          <div className="text-text-dim text-xs">Non-Crit</div>
          <div className="text-text font-mono text-sm mt-0.5">
            {result.nonCritDamage.toLocaleString()}
          </div>
        </div>
        <div className="text-center bg-bg rounded px-2 py-2">
          <div className="text-text-dim text-xs">Crit</div>
          <div className="text-highlight font-mono text-sm mt-0.5">
            {result.critDamage.toLocaleString()}
          </div>
        </div>
        <div className="text-center bg-bg rounded px-2 py-2">
          <div className="text-text-dim text-xs">Expected</div>
          <div className="text-accent font-mono text-sm mt-0.5">
            {result.expectedDamage.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-3 text-xs text-text-muted px-1">
        <span>Crit Rate: {(result.critRate * 100).toFixed(1)}%</span>
        <span>Crit Multi: {result.critMultiplier.toFixed(2)}x</span>
      </div>
    </div>
  );
};

export default ResultCard;
