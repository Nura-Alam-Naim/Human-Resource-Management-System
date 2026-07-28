import React from 'react';

const PageHeader = ({ title, subtitle, action }) => {
  return (
    <div className="header-section flex justify-between align-center">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action && action}
    </div>
  );
};

export default PageHeader;
