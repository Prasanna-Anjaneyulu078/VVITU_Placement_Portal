import React from 'react';
import { CheckCircle, AlertTriangle, XCircle } from 'lucide-react';

/**
 * EligibilityBadge
 * Renders an Eligible / Partially Eligible / Not Eligible badge with an optional match score.
 *
 * Props:
 *  - status: 'ELIGIBLE' | 'PARTIALLY_ELIGIBLE' | 'NOT_ELIGIBLE'
 *  - matchScore: number (0-100), optional
 *  - showScore: boolean (default true)
 */
export default function EligibilityBadge({ status, matchScore, showScore = true }) {
  const config = {
    ELIGIBLE: {
      bg: 'bg-green-100',
      text: 'text-green-700',
      icon: <CheckCircle size={13} />,
      label: 'Eligible',
    },
    PARTIALLY_ELIGIBLE: {
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      icon: <AlertTriangle size={13} />,
      label: 'Partially Eligible',
    },
    NOT_ELIGIBLE: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      icon: <XCircle size={13} />,
      label: 'Not Eligible',
    },
  };

  const c = config[status] || config.NOT_ELIGIBLE;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ${c.bg} ${c.text} text-[11px] font-semibold`}
    >
      {c.icon}
      {c.label}
      {showScore && matchScore != null && (
        <span className="ml-1 opacity-80">· {matchScore}%</span>
      )}
    </span>
  );
}