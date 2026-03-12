import React, { useEffect } from 'react';
import { useQueueStore } from './store/useQueueStore';
import ClientView from './components/ClientView';
import AdminView from './components/AdminView';
import { User, ShieldCheck, Moon, Sun, Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';

function App() {
  const { isAdmin, setAdmin, initSocket, fetchActive, fetchStats, theme, toggleTheme } = useQueueStore();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    initSocket();
    fetchActive();
    fetchStats();
    // Initialize theme
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, []);

  const toggleLanguage = () => {
    const nextLng = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(nextLng);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 sticky top-0 z-10 transition-colors">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">Q</div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">{t('common.app_name')}</h1>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors text-sm font-bold"
            >
              <Languages size={18} />
              <span>{i18n.language === 'en' ? 'العربية' : 'English'}</span>
            </button>

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
              aria-label="Toggle Theme"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>

            <button 
              onClick={() => setAdmin(!isAdmin)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                isAdmin 
                  ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300' 
                  : 'bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-700'
              }`}
            >
              {isAdmin ? <ShieldCheck size={16} /> : <User size={16} />}
              {isAdmin ? t('common.admin_view') : t('common.client_view')}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {isAdmin ? <AdminView /> : <ClientView />}
      </main>

      <footer className="max-w-5xl mx-auto px-4 py-12 border-t border-gray-200 dark:border-slate-800 mt-12 text-center text-gray-500 dark:text-gray-400 text-sm transition-colors">
        <p>{t('common.footer')}</p>
      </footer>
    </div>
  );
}

export default App;
