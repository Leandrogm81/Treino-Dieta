
import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { AuthView } from './components/Auth';
import { Layout } from './components/Layout';
import { Dashboard } from './features/Dashboard';
import { Nutrition } from './features/Nutrition';
import { Workout } from './features/Workout';
import { Cardio } from './features/Cardio';
import { Analysis } from './features/Analysis';
import { NAV_ITEMS } from './constants';
import type { NavItemType } from './constants';
// App.tsx
import { migrateLocalToFirestore } from './services/migrateLocal';

// ...
React.useEffect(() => {
  if (authState.status === 'LOGGED_IN') {
    migrateLocalToFirestore();
  }
}, [authState.status]);


const App: React.FC = () => {
  const { authState, login, logout, createAdmin, createUser, changePassword, changeOwnPassword, resetUserPassword } = useAuth();
  const [activePage, setActivePage] = useState<NavItemType>('Dashboard');

  if (authState.status === 'NO_USERS') {
    return <AuthView mode="ADMIN_SETUP" createAdmin={createAdmin} />;
  }

  if (authState.status === 'LOGGED_OUT') {
    return <AuthView mode="LOGIN" login={login} />;
  }

  if (authState.status === 'FORCE_PASSWORD_CHANGE') {
    return <AuthView mode="CHANGE_PASSWORD" changePassword={changePassword} currentUser={authState.currentUser} />;
  }

  if (authState.status === 'LOGGED_IN' && authState.currentUser) {
    const renderContent = () => {
      switch (activePage) {
        case 'Dashboard':
          return <Dashboard currentUser={authState.currentUser} />;
        case 'Nutrição':
          return <Nutrition currentUser={authState.currentUser} />;
        case 'Treino':
          return <Workout currentUser={authState.currentUser} />;
        case 'Cardio':
          return <Cardio currentUser={authState.currentUser} />;
        case 'Progresso':
          return <Analysis currentUser={authState.currentUser} allUsers={authState.users} createUser={createUser} resetUserPassword={resetUserPassword} />;
        default:
          return <Dashboard currentUser={authState.currentUser} />;
      }
    };
    
    return (
      <Layout 
        currentUser={authState.currentUser} 
        logout={logout}
        activePage={activePage}
        setActivePage={setActivePage}
        changeOwnPassword={changeOwnPassword}
      >
        {renderContent()}
      </Layout>
    );
  }

  return <div className="flex items-center justify-center h-screen bg-background text-text-primary">Carregando...</div>;
};

export default App;
