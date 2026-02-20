import React from 'react';
import type { CalcStep } from '../types';

interface Props {
  steps: CalcStep[];
}

const DamageBreakdown: React.FC<Props> = ({ steps }) => {
  if (steps.length === 0) {
    return null;
  }

  return (
    <div className="bg-bg-panel border border-border rounded-lg overflow-hidden">
      <div className="px-4 py-2.5 border-b border-border">
        <h3 className="text-text text-sm font-medium">피해 계산 상세</h3>
      </div>
      <div className="divide-y divide-border">
        {steps.map((step, i) => {
          // 섹션 헤더 (── 로 감싸진 것)
          if (step.formula === '' && step.value === 0) {
            return (
              <div
                key={i}
                className="px-4 py-1.5 bg-bg text-text-dim text-xs font-medium uppercase tracking-wider"
              >
                {step.label.replace(/──/g, '').trim()}
              </div>
            );
          }

          return (
            <div key={i} className="px-4 py-1.5 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="text-text text-sm truncate">{step.label}</div>
                <div className="text-text-dim text-xs font-mono truncate">{step.formula}</div>
              </div>
              <div className="text-text font-mono text-sm font-medium flex-shrink-0">
                {typeof step.value === 'number' && step.value >= 1000
                  ? step.value.toLocaleString()
                  : step.value}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DamageBreakdown;
