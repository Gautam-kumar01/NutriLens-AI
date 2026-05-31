import React, { useState } from 'react';
import { Camera, History, BarChart2, Sun, Moon, User, Target } from 'lucide-react';
import { useStore } from './context/StoreContext';
import HomePage from './pages/HomePage';
import HistoryPage from './pages/HistoryPage';
import StatsPage from './pages/StatsPage';
import AnalysisPage from './pages/AnalysisPage';
import OnboardingPage from './pages/OnboardingPage';
import GoalsPage from './pages/GoalsPage';
import './App.css';

const NAV_ITEMS = [
  { id: 'home',    label: 'Scan',   Icon: Camera   },
  { id: 'history', label: 'Diary',  Icon: History  },
  { id: 'stats',   label: 'Stats',  Icon: BarChart2 },
  { id: 'goals',   label: 'Goals',  Icon: Target   },
];

function App() {
  const { state, setTheme } = useStore();
  const [activeTab, setActiveTab] = useState('home');

  if (!state.hasOnboarded) {
    return (
      <div className="app-container">
        <OnboardingPage />
      </div>
    );
  }

  const toggleTheme = () => setTheme(state.theme === 'dark' ? 'light' : 'dark');

  const TAB_TITLES = {
    home:    'Cal AI',
    history: 'My Diary',
    stats:   'Analytics',
    goals:   'My Goals',
  };

  return (
    <div className="app-container">
      {/* Ambient blobs */}
      <div className="bg-gradient-blob bg-blob-1" aria-hidden="true" />
      <div className="bg-gradient-blob bg-blob-2" aria-hidden="true" />

      {/* Topbar – hidden only on analysis */}
      {activeTab !== 'analysis' && (
        <header className="app-topbar">
          <div>
            <p className="eyebrow topbar-date">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
            </p>
            <h1 className="topbar-title">
              {activeTab === 'home'
                ? <>Cal <span className="gradient-text">AI</span></>
                : TAB_TITLES[activeTab]
              }
            </h1>
          </div>
          <div className="topbar-actions">
            <button onClick={toggleTheme} className="icon-btn" aria-label="Toggle theme">
              {state.theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
            </button>
            <button className="icon-btn avatar-btn" aria-label="Profile">
              {state.profile?.gender === 'female' ? '👩' : '👨'}
            </button>
          </div>
        </header>
      )}

      {/* Pages */}
      <main className="app-main">
        {activeTab === 'home'     && <HomePage onScan={() => setActiveTab('analysis')} onAddMeal={() => setActiveTab('history')} />}
        {activeTab === 'history'  && <HistoryPage />}
        {activeTab === 'stats'    && <StatsPage />}
        {activeTab === 'goals'    && <GoalsPage />}
        {activeTab === 'analysis' && <AnalysisPage onBack={() => setActiveTab('home')} />}
      </main>

      {/* Bottom Nav */}
      {activeTab !== 'analysis' && (
        <nav className="bottom-nav" role="navigation" aria-label="Primary navigation">
          <div className="bottom-nav-inner glass-panel">
            {NAV_ITEMS.map(({ id, label, Icon }) => {
              const isActive = activeTab === id;
              const isScan   = id === 'home';
              return (
                <button
                  key={id}
                  className={`nav-item ${isActive ? 'active' : ''}`}
                  onClick={() => setActiveTab(id)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {isScan ? (
                    <div className={`nav-scan-btn ${isActive ? 'active' : ''}`}>
                      <Icon size={22} />
                    </div>
                  ) : (
                    <Icon size={22} />
                  )}
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

export default App;
