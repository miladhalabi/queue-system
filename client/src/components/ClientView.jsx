import React, { useState, useEffect } from 'react';
import { useQueueStore } from '../store/useQueueStore';
import { UserPlus, LogOut, Info, CheckCircle, Bell } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ClientView = () => {
  const { t, i18n } = useTranslation();
  const { myEntry, joinQueue, leaveQueue, refreshMyStatus } = useQueueStore();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async (e) => {
    e.preventDefault();
    if (!name) return;
    setLoading(true);
    try {
      await joinQueue(name, phone);
    } catch (err) {
      alert('Failed to join queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (myEntry) {
      const interval = setInterval(refreshMyStatus, 10000); // Periodic poll as fallback
      return () => clearInterval(interval);
    }
  }, [myEntry?.id]);

  if (myEntry) {
    const isCalled = myEntry.status === 'called';
    const isWaiting = myEntry.status === 'waiting';
    const isNext = myEntry.position === 1 && isWaiting;

    return (
      <div className="max-w-md mx-auto space-y-6">
        {/* Status Card */}
        <div className={`rounded-3xl p-8 text-center shadow-xl transition-all ${
          isCalled 
            ? 'bg-green-600 text-white ring-8 ring-green-100 dark:ring-green-900/30' 
            : isNext 
              ? 'bg-indigo-600 text-white animate-pulse'
              : 'bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 text-gray-900 dark:text-white'
        }`}>
          {isCalled ? (
            <>
              <CheckCircle className="mx-auto mb-4 w-16 h-16" />
              <h2 className="text-3xl font-black mb-2">{t('client.turn_title')}</h2>
              <p className="opacity-90 text-lg">{t('client.turn_desc')}</p>
            </>
          ) : (
            <>
              <p className="text-sm font-bold uppercase tracking-widest opacity-60 mb-2">{t('client.your_position')}</p>
              <div className="text-8xl font-black mb-4">#{myEntry.position || '?'}</div>
              <h2 className="text-2xl font-bold mb-2">
                {isNext ? t('client.next_title') : t('client.hello', { name: myEntry.clientName })}
              </h2>
              <p className={isNext ? 'opacity-90' : 'text-gray-500 dark:text-gray-400'}>
                {isNext 
                  ? t('client.next_desc') 
                  : t('client.ahead_desc', { count: myEntry.position - 1 })}
              </p>
            </>
          )}
        </div>

        {/* Ticket Details */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-gray-100 dark:border-slate-800 shadow-sm flex items-center justify-between transition-colors">
          <div className={i18n.language === 'ar' ? 'text-right' : 'text-left'}>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-bold uppercase tracking-tighter">{t('client.ticket_number')}</p>
            <p className="text-xl font-mono font-bold text-gray-700 dark:text-gray-300">{myEntry.ticketNumber.toString().padStart(4, '0')}</p>
          </div>
          <button 
            onClick={leaveQueue}
            className="flex items-center gap-2 text-red-500 font-semibold hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-xl transition-colors"
          >
            <LogOut size={18} className={i18n.language === 'ar' ? 'rotate-180' : ''} />
            {t('client.leave_button')}
          </button>
        </div>

        {isNext && (
          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-4 flex gap-3 items-start transition-colors text-right rtl:text-right">
            <Bell className="text-indigo-600 dark:text-indigo-400 mt-1 shrink-0" />
            <p className="text-indigo-800 dark:text-indigo-300 text-sm leading-relaxed">
              <strong>{t('client.stay_close')}</strong> {t('client.stay_close_desc')}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="text-center mb-10">
        <h2 className="text-4xl font-black text-gray-900 dark:text-white mb-3">{t('client.join_title')}</h2>
        <p className="text-gray-500 dark:text-gray-400">{t('client.join_desc')}</p>
      </div>

      <form onSubmit={handleJoin} className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-gray-100 dark:border-slate-800 shadow-xl space-y-6 transition-colors">
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">{t('client.name_label')}</label>
          <input 
            type="text" 
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700 dark:text-gray-300 ml-1">{t('client.phone_label')}</label>
          <input 
            type="tel" 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="555-0123"
            className="w-full px-5 py-4 rounded-2xl bg-gray-50 dark:bg-slate-800 border-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500"
          />
        </div>

        <button 
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-5 rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-none transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
        >
          <UserPlus size={22} />
          {loading ? t('client.joining') : t('client.join_button')}
        </button>

        <div className="flex items-center gap-2 justify-center text-xs text-gray-400 dark:text-gray-500">
          <Info size={14} />
          <span>{t('client.realtime_info')}</span>
        </div>
      </form>
    </div>
  );
};

export default ClientView;
