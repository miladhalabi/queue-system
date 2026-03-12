import React, { useState } from 'react';
import { useQueueStore } from '../store/useQueueStore';
import { Lock, User, LogIn, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const AdminLogin = () => {
  const { t, i18n } = useTranslation();
  const { login } = useQueueStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-3">{t('admin.login_title')}</h2>
        <p className="text-gray-500 dark:text-gray-400">{t('admin.login_desc')}</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-gray-100 dark:border-slate-800 shadow-xl space-y-6 transition-colors">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-medium">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">{t('admin.username')}</label>
          <div className="relative">
            <User className={`absolute ${i18n.language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500`} size={20} />
            <input 
              type="text" 
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="admin"
              className={`w-full ${i18n.language === 'ar' ? 'pr-12 pl-5' : 'pl-12 pr-5'} py-4 rounded-2xl bg-gray-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500`}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">{t('admin.password')}</label>
          <div className="relative">
            <Lock className={`absolute ${i18n.language === 'ar' ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500`} size={20} />
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className={`w-full ${i18n.language === 'ar' ? 'pr-12 pl-5' : 'pl-12 pr-5'} py-4 rounded-2xl bg-gray-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500`}
            />
          </div>
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-gray-900 dark:bg-indigo-600 hover:bg-black dark:hover:bg-indigo-700 text-white font-bold py-5 rounded-2xl shadow-lg transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
        >
          <LogIn size={22} className={i18n.language === 'ar' ? 'rotate-180' : ''} />
          {loading ? t('admin.logging_in') : t('admin.login_button')}
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;
