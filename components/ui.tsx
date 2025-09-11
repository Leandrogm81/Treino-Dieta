import React, { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}
export const Card: React.FC<CardProps> = ({ children, className = '' }) => (
  <div className={`bg-surface p-4 sm:p-6 rounded-lg shadow-lg ${className}`}>
    {children}
  </div>
);

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
}
export const Button: React.FC<ButtonProps> = ({ children, className = '', variant = 'primary', ...props }) => {
  const baseClasses = 'px-4 py-2 rounded-md font-semibold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center';
  const variantClasses = {
    primary: 'bg-primary hover:bg-primary-focus focus:ring-primary',
    secondary: 'bg-secondary hover:bg-secondary-focus focus:ring-secondary',
    danger: 'bg-danger hover:bg-danger-focus focus:ring-danger',
  };
  return (
    <button className={`${baseClasses} ${variantClasses[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  list?: string;
  dataListOptions?: string[];
}
export const Input: React.FC<InputProps> = ({ label, id, list, dataListOptions, className = '', ...props }) => {
  const baseClasses = "w-full bg-surface border border-border rounded-md px-3 py-2 text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary";
  
  return (
    <div>
      {label && <label htmlFor={id} className="block text-sm font-medium text-text-secondary mb-1">{label}</label>}
      <input
        id={id}
        list={list}
        className={`${baseClasses} ${className}`}
        {...props}
      />
      {list && dataListOptions && (
        <datalist id={list}>
          {dataListOptions.map(option => <option key={option} value={option} />)}
        </datalist>
      )}
    </div>
  );
};


interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}
export const Textarea: React.FC<TextareaProps> = ({ label, id, ...props }) => (
  <div>
    {label && <label htmlFor={id} className="block text-sm font-medium text-text-secondary mb-1">{label}</label>}
    <textarea
      id={id}
      className="w-full bg-surface border border-border rounded-md px-3 py-2 text-text-primary placeholder-text-secondary focus:outline-none focus:ring-2 focus:ring-primary"
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
            className="w-full bg-surface border border-border rounded-md px-3 py-2 text-text-primary focus:outline-none focus:ring-2 focus:ring-primary"
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
  footer?: ReactNode;
}
export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-surface rounded-lg shadow-xl w-full max-w-lg flex flex-col max-h-[90vh]">
        {/* Header (Fixo) */}
        <div className="flex justify-between items-center p-6 pb-4 border-b border-border flex-shrink-0">
          <h2 className="text-xl font-bold text-text-primary">{title}</h2>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary text-2xl leading-none">&times;</button>
        </div>
        
        {/* Corpo (Rolável) */}
        <div className="p-6 overflow-y-auto flex-grow">
            {children}
        </div>
        
        {/* Rodapé (Fixo) */}
        {footer && (
          <div className="p-6 pt-4 border-t border-border flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export const Spinner: React.FC = () => (
    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
);

interface ProgressBarProps {
  value: number;
  max: number;
  colorClass: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({ value, max, colorClass }) => {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <div className="w-full bg-border rounded-full h-2.5">
      <div
        className={`${colorClass} h-2.5 rounded-full transition-all duration-300`}
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
};