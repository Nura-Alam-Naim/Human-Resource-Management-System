import React from 'react';

const PageHeader = ({ title, subtitle, action }) => {
  return (
    <div className="header-section" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action && action}
    </div>
  );
};

export default PageHeader;
