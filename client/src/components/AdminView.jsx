import React, { useEffect, useState } from 'react';
import { useQueueStore } from '../store/useQueueStore';
import AdminLogin from './AdminLogin';
import { Users, CheckCircle, ArrowRightCircle, UserMinus, Clock, LogOut, History, ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const AdminView = () => {
  const { t, i18n } = useTranslation();
  const { entries, history, stats, settings, updateSetting, callNext, skipEntry, adminToken, adminUser, logout, fetchActive, fetchHistory, fetchStats } = useQueueStore();
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (adminToken) {
      fetchActive();
      fetchStats();
      fetchHistory();
    }
  }, [adminToken]);

  const handleToggleRequireReason = () => {
    updateSetting('requireReason', settings.requireReason === 'true' ? 'false' : 'true');
  };

  const handleSkip = (id) => {
    const reason = prompt(t('common.reason_placeholder'));
    if (reason !== null) skipEntry(id, reason);
  };

  if (!adminToken) {
    return <AdminLogin />;
  }

  const calledEntry = entries.find(e => e.status === 'called');
  const waitingEntries = entries.filter(e => e.status === 'waiting');

  return (
    <div className="space-y-8">
      {/* Admin Header */}
      <div className="flex flex-col md:flex-row items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm transition-colors gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-400 font-bold uppercase transition-colors">
            {adminUser?.username?.[0] || 'A'}
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-tighter">{t('admin.logged_in_as')}</p>
            <p className="font-bold text-gray-800 dark:text-gray-200 transition-colors">{adminUser?.username}</p>
          </div>
        </div>

        {/* Require Reason Toggle */}
        <div className="flex items-center gap-3 bg-gray-50 dark:bg-slate-800/50 px-4 py-2 rounded-xl border border-gray-100 dark:border-slate-800">
          <span className="text-sm font-bold text-gray-600 dark:text-gray-400">{t('client.reason_label')}</span>
          <button
            onClick={handleToggleRequireReason}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
              settings.requireReason === 'true' ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                settings.requireReason === 'true' 
                  ? (i18n.language === 'ar' ? '-translate-x-6' : 'translate-x-6') 
                  : (i18n.language === 'ar' ? '-translate-x-1' : 'translate-x-1')
              }`}
            />
          </button>
        </div>

        <button 
          onClick={logout}
          className="flex items-center gap-2 text-gray-500 hover:text-red-500 font-semibold px-4 py-2 rounded-xl transition-colors"
        >
          <LogOut size={18} />
          {t('common.logout')}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center transition-colors">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors">{t('admin.waiting')}</p>
            <p className="text-2xl font-bold dark:text-white transition-colors">{stats.currentWait}</p>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm flex items-center gap-4 transition-colors">
          <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-xl flex items-center justify-center transition-colors">
            <CheckCircle size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 transition-colors">{t('admin.served_today')}</p>
            <p className="text-2xl font-bold dark:text-white transition-colors">{stats.totalServed}</p>
          </div>
        </div>
      </div>

      {/* Main Controls */}
      <div className="bg-indigo-900 dark:bg-indigo-950 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 transition-colors">
        <div className="text-center md:text-left rtl:text-right">
          <h3 className="text-indigo-200 dark:text-indigo-300 font-bold uppercase tracking-widest text-xs mb-1">{t('admin.now_serving')}</h3>
          {calledEntry ? (
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-black">#{calledEntry.ticketNumber}</span>
              <div className="flex flex-col">
                <span className="text-xl font-medium text-indigo-100 dark:text-indigo-200">{calledEntry.clientName}</span>
                {calledEntry.clientReason && (
                   <span className="text-xs text-indigo-300 flex items-center gap-1">
                     <MessageSquare size={12} />
                     {calledEntry.clientReason}
                   </span>
                )}
              </div>
            </div>
          ) : (
            <p className="text-2xl font-bold text-indigo-100">{t('admin.no_one')}</p>
          )}
        </div>
        
        <button 
          onClick={callNext}
          disabled={waitingEntries.length === 0}
          className="bg-white dark:bg-indigo-100 text-indigo-900 hover:bg-indigo-50 dark:hover:bg-white px-8 py-4 rounded-2xl font-black text-lg flex items-center gap-3 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale"
        >
          {calledEntry ? t('admin.serve_next') : t('admin.call_next')}
          <ArrowRightCircle size={24} />
        </button>
      </div>

      {/* Queue List */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold flex items-center gap-2 dark:text-white transition-colors">
          <Users size={20} className="text-gray-400" />
          {t('admin.queue_list')}
        </h3>
        
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
          <table className="w-full text-left rtl:text-right">
            <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('admin.ticket')}</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('admin.name')}</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('admin.reason')}</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('admin.status')}</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-right rtl:text-left">{t('admin.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
              {entries.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">
                    {t('admin.empty_queue')}
                  </td>
                </tr>
              ) : (
                entries.map((entry) => (
                  <tr key={entry.id} className={entry.status === 'called' ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}>
                    <td className="px-6 py-4 font-mono font-bold text-gray-600 dark:text-gray-400 transition-colors">
                      #{entry.ticketNumber.toString().padStart(4, '0')}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-bold text-gray-900 dark:text-gray-100 transition-colors">{entry.clientName}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 transition-colors">{entry.clientPhone || 'No phone'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xs truncate" title={entry.clientReason}>
                        {entry.clientReason || '-'}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        entry.status === 'called' 
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
                          : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                      }`}>
                        {entry.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right rtl:text-left">
                      <button 
                        onClick={() => handleSkip(entry.id)}
                        className="text-gray-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                        title={t('admin.skip')}
                      >
                        <UserMinus size={18} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* History Toggle */}
      <div className="space-y-4">
        <button 
          onClick={() => setShowHistory(!showHistory)}
          className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 font-bold transition-colors"
        >
          <History size={20} />
          {showHistory ? t('admin.history_hide') : t('admin.history_show')}
          {showHistory ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </button>

        {showHistory && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
            <table className="w-full text-left rtl:text-right">
              <thead className="bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('admin.ticket')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('admin.name')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('admin.reason')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{t('admin.status')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-right rtl:text-left">{t('admin.completed_at')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-400 dark:text-gray-500">
                      {t('admin.history_empty')}
                    </td>
                  </tr>
                ) : (
                  history.map((entry) => (
                    <tr key={entry.id}>
                      <td className="px-6 py-4 font-mono font-bold text-gray-400 dark:text-gray-500">
                        #{entry.ticketNumber.toString().padStart(4, '0')}
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-bold text-gray-700 dark:text-gray-300 transition-colors">{entry.clientName}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs text-gray-500 dark:text-gray-500 truncate max-w-[150px]">
                          {entry.clientReason || '-'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          entry.status === 'served' 
                            ? 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400' 
                            : 'bg-red-50 dark:bg-red-900/10 text-red-500 dark:text-red-400'
                        }`}>
                          {entry.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right rtl:text-left text-xs text-gray-400 dark:text-gray-500">
                        {new Date(entry.servedAt || entry.calledAt || entry.joinedAt).toLocaleString(i18n.language)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminView;
