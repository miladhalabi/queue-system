const { Telegraf, Markup } = require('telegraf');
require('dotenv').config();

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

const botMessages = {
  en: {
    welcome: "Welcome to QueueFlow! 🚀\nJoin the queue and get real-time updates.",
    join_btn: "Join Queue ➕",
    join_reason_btn: "Join with Reason 📝",
    status_btn: "Check Status ℹ️",
    leave_btn: "Leave Queue ❌",
    ask_reason: "What is your reason for visiting? (Type it now)",
    already_in: "You are already in the queue!",
    joined: "✅ Joined! Your Ticket is #{{ticket}}. You are #{{pos}} in line.",
    not_in: "You are not in the queue.",
    status: "ℹ️ Ticket #{{ticket}}\nPosition: #{{pos}}\nStatus: {{status}}{{reason}}",
    left: "✅ You have left the queue.",
    next_alert: "🔔 You are now #1! Please stay close to the counter.",
    called_alert: "🚀 It's your turn! Please proceed to the counter now.",
    skipped_alert: "⚠️ You have been skipped. Reason: {{reason}}",
    reason_updated: "✅ Reason updated: {{reason}}",
    reason_required: "⚠️ A reason is required to join. Please click 'Join with Reason'."
  },
  ar: {
    welcome: "مرحباً بك في كيو فلو! 🚀\nانضم إلى الطابور واحصل على تحديثات مباشرة.",
    join_btn: "انضمام للطابور ➕",
    join_reason_btn: "انضمام مع ذكر السبب 📝",
    status_btn: "تحقق من الحالة ℹ️",
    leave_btn: "مغادرة الطابور ❌",
    ask_reason: "ما هو سبب زيارتك؟ (اكتب السبب الآن)",
    already_in: "أنت مسجل بالفعل في الطابور!",
    joined: "✅ تم الانضمام! تذكرتك رقم #{{ticket}}. ترتيبك هو #{{pos}} في الطابور.",
    not_in: "أنت لست في الطابور حالياً.",
    status: "ℹ️ تذكرة رقم #{{ticket}}\nالترتيب: #{{pos}}\nالحالة: {{status}}{{reason}}",
    left: "✅ لقد غادرت الطابور.",
    next_alert: "🔔 أنت الآن رقم #1! يرجى البقاء بالقرب من الكاونتر.",
    called_alert: "🚀 حان دورك! يرجى التوجه إلى الكاونتر الآن.",
    skipped_alert: "⚠️ تم تخطي دورك. السبب: {{reason}}",
    reason_updated: "✅ تم تحديث السبب: {{reason}}",
    reason_required: "⚠️ السبب مطلوب للانضمام. يرجى الضغط على 'انضمام مع ذكر السبب'."
  }
};

const getMsg = (lang, key, params = {}) => {
  let msg = botMessages[lang][key] || botMessages['en'][key];
  Object.keys(params).forEach(p => {
    msg = msg.replace(`{{${p}}}`, params[p]);
  });
  return msg;
};

const getBilingualMsg = (key, params = {}) => {
  return `${getMsg('en', key, params)}\n\n${getMsg('ar', key, params)}`;
};

module.exports = { bot, botMessages, getBilingualMsg };
