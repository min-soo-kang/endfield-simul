import React from 'react';

interface StatDisplayProps {
  label: string;
  value: string | number;
  highlight?: boolean;
}

const StatDisplay: React.FC<StatDisplayProps> = ({ label, value, highlight }) => (
  <div className="flex justify-between items-center py-1">
    <span className="text-text-muted text-sm">{label}</span>
    <span className={`font-mono text-sm ${highlight ? 'text-highlight font-bold' : 'text-text'}`}>
      {value}
    </span>
  </div>
);

export default StatDisplay;
