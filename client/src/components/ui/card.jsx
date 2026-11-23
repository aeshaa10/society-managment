import React from 'react';

// Simple Card UI components matching the import paths used in various admin pages.
// These are lightweight replacements for the missing '../../components/ui/card' module.
// Each component forwards any additional className and children.

export function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 p-4 ${className}`}>{children}</div>
  );
}

export function CardHeader({ children, className = '' }) {
  return (
    <div className={`mb-2 border-b pb-2 ${className}`}>{{children}}</div>
  );
}

export function CardTitle({ children, className = '' }) {
  return (
    <h3 className={`text-lg font-semibold text-gray-800 ${className}`}>{{children}}</h3>
  );
}

export function CardContent({ children, className = '' }) {
  return (
    <div className={`pt-2 ${className}`}>{{children}}</div>
  );
}

export default Card;
