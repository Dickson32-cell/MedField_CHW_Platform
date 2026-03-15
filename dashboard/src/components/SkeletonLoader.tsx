import React from 'react';
import './SkeletonLoader.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  width = '100%', 
  height = '20px', 
  borderRadius = '4px',
  className = '' 
}) => {
  const style: React.CSSProperties = {
    width,
    height,
    borderRadius,
  };

  return (
    <div className={`skeleton ${className}`} style={style} />
  );
};

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ 
  lines = 1, 
  className = '' 
}) => {
  return (
    <div className={`skeleton-text ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height="16px" style={{ marginBottom: i < lines - 1 ? '8px' : '0' }} />
      ))}
    </div>
  );
};

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`skeleton-card ${className}`}>
      <Skeleton height="200px" borderRadius="8px" />
    </div>
  );
};

export const SkeletonStatCard: React.FC = () => {
  return (
    <div className="skeleton-stat-card">
      <div className="skeleton-stat-icon">
        <Skeleton width="48px" height="48px" borderRadius="50%" />
      </div>
      <div className="skeleton-stat-content">
        <Skeleton width="60px" height="32px" />
        <Skeleton width="80px" height="16px" style={{ marginTop: '8px' }} />
      </div>
    </div>
  );
};

export const SkeletonTable: React.FC<{ rows?: number; columns?: number }> = ({ 
  rows = 5, 
  columns = 4 
}) => {
  return (
    <div className="skeleton-table">
      <div className="skeleton-table-header">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} height="24px" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="skeleton-table-row">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} height="20px" />
          ))}
        </div>
      ))}
    </div>
  );
};

export const SkeletonDashboard: React.FC = () => {
  return (
    <div className="skeleton-dashboard">
      <div className="skeleton-stats-grid">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>
      
      <div className="skeleton-charts-grid">
        <SkeletonCard className="skeleton-chart-large" />
        <SkeletonCard className="skeleton-chart-small" />
      </div>
      
      <SkeletonCard />
    </div>
  );
};

export const SkeletonPage: React.FC = () => {
  return (
    <div className="skeleton-page">
      <Skeleton height="40px" width="200px" style={{ marginBottom: '20px' }} />
      <div className="skeleton-filters">
        <Skeleton height="40px" width="300px" />
      </div>
      
      <SkeletonTable rows={8} columns={5} />
    </div>
  );
};

// Default export with type support
interface SkeletonLoaderProps {
  type?: 'card' | 'text' | 'table';
  count?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ type = 'card', count = 1 }) => {
  if (type === 'text') {
    return <SkeletonText lines={count} />;
  }
  if (type === 'table') {
    return <SkeletonTable rows={count} columns={5} />;
  }
  return (
    <div>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
};

export default SkeletonLoader;
