
import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}
export const Card: React.FC<CardProps> = ({ children, className = '' }) => (
  <div className={`bg-surface p-6 rounded-lg shadow-lg ${className}`}>
    {children}
  </div>
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
}
export const Button: React.FC<ButtonProps> = ({ children, className = '', variant = 'primary', ...props }) => {
  const baseClasses = 'px-4 py-2 rounded-md font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
  const variantClasses = {
    primary: 'bg-primary hover:bg-primary-focus focus:ring-primary',
    secondary: 'bg-secondary hover:bg-indigo-600 focus:ring-secondary',
    danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
  };
  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}
export const Input: React.FC<InputProps> = ({ label, id, ...props }) => (
  <div>
    {label && <label htmlFor={id} className="block text-sm font-medium text-text-secondary mb-1">{label}</label>}
    <input
      id={id}
      className="w-full bg-background border border-gray-600 rounded-md px-3 py-2 text-text-primary placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
      {...props}
    />
  </div>
);

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  children: ReactNode;
}
export const Select: React.FC<SelectProps> = ({ label, id, children, ...props }) => (
    <div>
        {label && <label htmlFor={id} className="block text-sm font-medium text-text-secondary mb-1">{label}</label>}
        <select
            id={id}
            className="w-full bg-background border border-gray-600 rounded-md px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
            {...props}
        >
            {children}
        </select>
    </div>
);


interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-surface rounded-lg shadow-xl p-6 w-full max-w-md m-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-text-primary">{title}</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary">&times;</button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
};

export const Spinner: React.FC = () => (
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
);
