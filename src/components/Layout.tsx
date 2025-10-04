
import React, { useState } from 'react';
import type { User } from '../types';
import { NAV_ITEMS } from '../constants';
import type { NavItemType } from '../constants';
import { ThemeToggle } from './ThemeToggle';
import { ChangeOwnPasswordModal } from './Auth';

interface LayoutProps {
  currentUser: User;
  logout: () => void;
  children: React.ReactNode;
  activePage: NavItemType;
  setActivePage: (page: NavItemType) => void;
  changeOwnPassword: (current: string, newP: string) => Promise<{ success: boolean; message: string; }>;
}

const LogoutIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
    </svg>
);

const Sidebar: React.FC<Omit<LayoutProps, 'children'>> = ({ currentUser, logout, activePage, setActivePage, changeOwnPassword }) => {
  const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

  return (
    <>
      <aside className="w-64 bg-surface text-text-primary flex-col p-4 hidden md:flex">
        <div className="text-2xl font-bold text-primary mb-8">FitTrack</div>
        <nav className="flex-grow">
          <ul>
            {NAV_ITEMS.map(item => (
              <li key={item.name} className="mb-2">
                <a
                  href="#"
                  onClick={(e) => { e.preventDefault(); setActivePage(item.name); }}
                  className={`flex items-center p-3 rounded-md transition-colors text-lg ${
                    activePage === item.name
                      ? 'bg-primary text-white font-semibold'
                      : 'text-text-secondary hover:bg-background hover:text-text-primary'
                  }`}
                >
                  {item.icon}
                  <span className="ml-4">{item.name}</span>
                </a>
              </li>
            ))}
          </ul>
        </nav>
         <div className="border-t border-border pt-4">
              <div className="flex items-center">
                  <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center font-bold text-white">
                      {currentUser.username.charAt(0).toUpperCase()}
                  </div>
                  <span className="ml-3 font-semibold">{currentUser.username}</span>
              </div>
              <button 
                onClick={() => setIsChangePasswordOpen(true)}
                className="w-full text-left mt-2 text-sm text-text-secondary hover:text-primary p-1 rounded-md hover:bg-background transition-colors focus:outline-none"
              >
                Alterar Senha
              </button>
              <button onClick={logout} className="w-full mt-2 flex items-center justify-center text-text-secondary hover:text-primary p-2 rounded-md hover:bg-background transition-colors">
                  <LogoutIcon className="w-5 h-5 mr-2" /> Sair
              </button>
         </div>
      </aside>
      <ChangeOwnPasswordModal 
        isOpen={isChangePasswordOpen} 
        onClose={() => setIsChangePasswordOpen(false)} 
        changeOwnPassword={changeOwnPassword} 
      />
    </>
  );
};

const MobileBottomNav: React.FC<{ activePage: NavItemType; setActivePage: (page: NavItemType) => void; }> = ({ activePage, setActivePage }) => {
    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface border-t border-border z-10">
            <ul className="flex justify-around items-center h-16">
                {NAV_ITEMS.map(item => (
                    <li key={item.name}>
                        <a
                            href="#"
                            onClick={(e) => { e.preventDefault(); setActivePage(item.name); }}
                            className={`flex flex-col items-center justify-center w-16 transition-colors ${
                                activePage === item.name ? 'text-primary' : 'text-text-secondary'
                            }`}
                        >
                            {item.icon}
                            <span className="text-xs mt-1">{item.name}</span>
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
};

export const Layout: React.FC<LayoutProps> = ({ children, currentUser, logout, activePage, setActivePage, changeOwnPassword }) => {
    return (
        <div className="flex h-screen bg-background">
            <Sidebar currentUser={currentUser} logout={logout} activePage={activePage} setActivePage={setActivePage} changeOwnPassword={changeOwnPassword} />
            
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="md:hidden flex justify-between items-center p-4 bg-surface border-b border-border shadow-md">
                    <div className="text-xl font-bold text-primary">FitTrack</div>
                    <div className="flex items-center gap-2">
                        <ThemeToggle />
                        <button onClick={logout} className="p-2 rounded-full text-text-secondary hover:text-primary hover:bg-background transition-colors" aria-label="Sair">
                            <LogoutIcon className="w-6 h-6"/>
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 md:p-8 pb-20 md:pb-8">
                     <div className="hidden md:flex justify-end mb-4 items-center gap-4">
                        <div className="flex items-center">
                            <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center font-bold text-white text-sm">
                                {currentUser.username.charAt(0).toUpperCase()}
                            </div>
                            <span className="ml-2 font-semibold text-text-secondary">{currentUser.username}</span>
                        </div>
                        <ThemeToggle />
                    </div>
                    {children}
                </main>
            </div>
            
            <MobileBottomNav activePage={activePage} setActivePage={setActivePage} />
        </div>
    );
};
