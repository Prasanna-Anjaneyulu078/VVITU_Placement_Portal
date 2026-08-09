import React from 'react';
import Card from './Card';
import './StatsCard.css';

export default function StatsCard({ label, value, icon: Icon, trend, trendValue, variant = 'default' }) {
  const getVariantClass = () => {
    switch(variant) {
      case 'warning': return 'stats-card-warning';
      case 'success': return 'stats-card-success';
      case 'primary': return 'stats-card-primary';
      default: return '';
    }
  };

  const getTrendClass = () => {
    return trend === 'up' ? 'trend-up' : 'trend-down';
  };

  return (
    <Card className={`stats-card ${getVariantClass()}`}>
      <div className="stats-card-content">
        <div className="stats-info">
          <p className="stats-label">{label}</p>
          <p className="stats-value">{value}</p>
          {trendValue && (
            <p className={`stats-trend ${getTrendClass()}`}>
              {trend === 'up' ? '↑' : '↓'} {trendValue}
            </p>
          )}
        </div>
        {Icon && (
          <div className="stats-icon-wrapper">
            <Icon size={24} className="stats-icon" />
          </div>
        )}
      </div>
    </Card>
  );
}
