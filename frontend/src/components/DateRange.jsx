import React from 'react';
import { Calendar } from 'lucide-react';

const DateRange = ({ start, end }) => {
  return (
    <div className="date-cell">
      <Calendar size={14} />
      <span>
        {new Date(start).toLocaleDateString()} - {new Date(end).toLocaleDateString()}
      </span>
    </div>
  );
};

export default DateRange;
