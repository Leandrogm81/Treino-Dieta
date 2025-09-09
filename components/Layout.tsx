
import React, { useState } from 'react';
import type { User } from '../types';
import { NAV_ITEMS } from '../constants';
import type { NavItemType } from '../constants';

interface LayoutProps {
  currentUser: User;
  logout: () => void;
  children: React.ReactNode;
  activePage: NavItemType;
  setActivePage: (page: NavItemType) => void;
}

const Sidebar: React.FC<Omit<LayoutProps, 'children'>> = ({ currentUser, logout, activePage, setActivePage }) => {
  return (
    <aside className="w-64 bg-surface text-text-primary flex flex-col p-4">
      <div className="text-2xl font-bold text-primary mb-8">FitTrack AI</div>
      <nav className="flex-grow">
        <ul>
          {NAV_ITEMS.map(item => (
            <li key={item.name} className="mb-2">
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); setActivePage(item.name); }}
                className={`flex items-center space-x-3 p-3 rounded-md transition-colors ${activePage === item.name ? 'bg-primary text-white' : 'hover:bg-gray-700'}`}
              >
                {item.icon}
                <span>{item.name}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
      <div className="mt-auto">
        <div className="text-sm text-text-secondary">Logado como:</div>
        <div className="font-semibold">{currentUser.username} {currentUser.isAdmin && '👑'}</div>
        <button onClick={logout} className="w-full mt-4 text-left p-3 rounded-md hover:bg-red-800 transition-colors flex items-center space-x-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            <span>Sair</span>
        </button>
      </div>
    </aside>
  );
};

export const Layout: React.FC<LayoutProps> = ({ children, ...props }) => {
  return (
    <div className="flex h-screen bg-background text-text-primary">
      <Sidebar {...props} />
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};
