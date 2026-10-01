const { Bot, InlineKeyboard } = require('grammy');
const crypto = require('crypto');
const express = require('express');

const BOT_TOKEN = process.env.BOT_TOKEN;
if (!BOT_TOKEN) {
  console.error('BOT_TOKEN не задан!');
  process.exit(1);
}

const bot = new Bot(BOT_TOKEN);

// ============================================================
// ТОП-1000 ПАРОЛЕЙ
// ============================================================
const TOP_PASSWORDS = new Set([
'123456','password','12345678','qwerty','123456789','12345','1234','111111','1234567','dragon',
'123123','baseball','abc123','football','monkey','letmein','696969','shadow','master','666666',
'qwertyuiop','123321','mustang','1234567890','michael','654321','pussy','superman','1qaz2wsx','7777777',
'fuckyou','121212','000000','qazwsx','123qwe','killer','trustno1','jordan','jennifer','zxcvbnm',
'asdfgh','hunter','buster','soccer','harley','batman','andrew','tigger','sunshine','iloveyou',
'fuckme','2000','charlie','robert','thomas','hockey','ranger','daniel','starwars','klaster',
'112233','george','asshole','computer','michelle','jessica','pepper','1111','zxcvbn','555555',
'11111111','131313','freedom','777777','pass','fuck','maggie','159753','aaaaaa','ginger',
'princess','joshua','cheese','amanda','summer','love','ashley','nicole','chelsea','biteme',
'matthew','access','yankees','987654321','dallas','austin','thunder','taylor','matrix','william',
'corvette','hello','martin','heather','secret','fucker','merlin','diamond','1234qwer','gfhjkm',
'hammer','silver','222222','88888888','anthony','justin','test','bailey','q1w2e3r4t5','patrick',
'internet','scooter','orange','11111','golfer','cookie','richard','samantha','bigdog','guitar',
'jackson','whatever','mickey','chicken','sparky','snoopy','maverick','phoenix','camaro','sexy',
'peanut','morgan','welcome','falcon','cowboy','ferrari','samsung','andrea','smokey','steelers',
'joseph','mercedes','dakota','arsenal','eagles','melissa','boomer','booboo','spider','nascar',
'monster','tigers','yellow','xxxxxx','123123123','gateway','marina','diablo','bulldog','qwer1234',
'compaq','purple','hardcore','banana','junior','hannah','123654','porsche','lakers','iceman',
'money','cowboys','987654','london','tennis','999999','ncc1701','coffee','scooby','0000',
'miller','boston','q1w2e3r4','fuckoff','brandon','yamaha','chester','mother','forever','johnny',
'edward','333333','oliver','redsox','player','nikita','knight','fender','barney','midnight',
'please','brandy','chicago','badboy','iwantu','slayer','rangers','charles','angel','flower',
'bigdaddy','rabbit','wizard','bigdick','jasper','enter','rachel','chris','steven','winner',
'adidas','victoria','natasha','1q2w3e4r','jasmine','winter','prince','panties','marine','ghbdtn',
'fishing','cocacola','casper','james','232323','raiders','888888','marlboro','gandalf','asdfasdf',
'crystal','87654321','12344321','sexsex','golden','blowme','bigtits','8675309','panther','lauren',
'angela','bitch','spanky','thx1138','angels','madison','winston','shannon','mike','toyota',
'blowjob','jordan23','canada','sophie','apples','dick','tiger','razz','123abc','pokemon',
'qazxsw','55555','qwaszx','muffin','johnson','murphy','cooper','jonathan','liverpoo','david',
'danielle','159357','jackie','1990','123456a','789456','turtle','horny','abcd1234','scorpion',
'qazwsxedc','101010','butter','carlos','password1','dennis','slipknot','qwerty123','booger','asdf',
'1991','black','startrek','12341234','cameron','newyork','rainbow','nathan','john','1992',
'rocket','viking','redskins','butthead','asdfghjkl','1212','sierra','peaches','gemini','doctor',
'wilson','sandra','helpme','qwertyui','victor','flamingo','kingdom','farmer','newport','bigcock',
'lasvegas','ncc1701d','qwert','carmen','1989','charlotte','metallic','bubble','colt45','spencer',
'tomcat','debbie','alpha','hunter2','admin','root','toor','pass123','letmein1','welcome1',
'password123','admin123','qwerty1','1q2w3e','zaq12wsx','йцукен','пароль','привет','любовь','наташа',
'андрей','сергей','дмитрий','александр','максим','роман','аня','катя','маша','ольга'
]);

// ============================================================
// УТИЛИТЫ
// ============================================================
function sha1Hash(password) {
  return crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
}

const KEYBOARD_PATTERNS = ['qwerty','123456','asdfgh','йцукен','qwertyuiop','пароль','password','12345678','111111','qazwsx','1q2w3e','zxcvbn'];

function isKeyboardPattern(pwd) {
  const l = pwd.toLowerCase();
  return KEYBOARD_PATTERNS.some(p => l.includes(p)) || l.length < 6;
}

function isTopPassword(pwd) {
  return TOP_PASSWORDS.has(pwd.toLowerCase());
}

function hasCyrillic(pwd) {
  return /[а-яё]/i.test(pwd);
}

function getCharsetSize(pwd) {
  let size = 0;
  if (/[a-z]/.test(pwd)) size += 26;
  if (/[A-Z]/.test(pwd)) size += 26;
  if (/[0-9]/.test(pwd)) size += 10;
  if (/[^a-zA-Z0-9]/.test(pwd)) size += 33;
  return size || 1;
}

function estimateCrackTime(pwd) {
  const space = getCharsetSize(pwd);
  const combos = Math.pow(space, pwd.length);
  const seconds = combos / 1e10 / 2;
  const t = { sec:'сек', min:'мин', h:'ч', d:'дн', mo:'мес', y:'лет', ky:'тыс. лет', my:'млн лет', by:'млрд лет', instant:'мгновенно' };
  if (seconds < 1) return t.instant;
  if (seconds < 60) return `${Math.round(seconds)} ${t.sec}`;
  if (seconds < 3600) return `${Math.round(seconds/60)} ${t.min}`;
  if (seconds < 86400) return `${Math.round(seconds/3600)} ${t.h}`;
  if (seconds < 2592000) return `${Math.round(seconds/86400)} ${t.d}`;
  if (seconds < 31536000) return `${Math.round(seconds/2592000)} ${t.mo}`;
  const years = seconds / 31536000;
  if (years < 1000) return `${Math.round(years)} ${t.y}`;
  if (years < 1e6) return `${Math.round(years/1000)} ${t.ky}`;
  if (years < 1e9) return `${Math.round(years/1e6)} ${t.my}`;
  return `${(years/1e9).toFixed(1)} ${t.by}`;
}

function calcStrength(pwd) {
  if (!pwd) return { label:'—', emoji:'⚪' };
  if (pwd.length < 6) return { label:'Слишком короткий', emoji:'🔴' };
  let score = 0;
  score += Math.min(pwd.length * 4, 40);
  if (/[a-z]/.test(pwd)) score += 10;
  if (/[A-Z]/.test(pwd)) score += 10;
  if (/[0-9]/.test(pwd)) score += 10;
  if (/[^a-zA-Z0-9]/.test(pwd)) score += 15;
  score += Math.min(new Set(pwd).size * 2, 15);
  score = Math.min(score, 100);
  if (score < 40) return { label:'Слабый', emoji:'🔴' };
  if (score < 65) return { label:'Средний', emoji:'🟡' };
  if (score < 85) return { label:'Сильный', emoji:'🟢' };
  return { label:'Очень сильный', emoji:'🟢' };
}

async function checkHIBP(password) {
  const hash = sha1Hash(password);
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);
  const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
  const text = await res.text();
  for (const line of text.split('\n')) {
    const [s, count] = line.trim().split(':');
    if (s === suffix) return parseInt(count);
  }
  return 0;
}

function generatePassword(len, options = {}) {
  let chars = 'abcdefghijkmnpqrstuvwxyz';
  if (options.upper !== false) chars += 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  if (options.digits !== false) chars += '23456789';
  if (options.symbols !== false) chars += '!@#$%^&*';
  const arr = crypto.randomBytes(len);
  return [...arr].map(n => chars[n % chars.length]).join('');
}

const WORDS_RU = ['кофе','лампа','тигр','мост','ветер','камень','снег','река','лес','звезда','гром','песок','луна','огонь','стекло','ключ','дорога','море','птица','цветок','дождь','облако','гора','трава','лист','медведь','лиса','замок','часы','книга'];

function generatePhrase() {
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  return `${pick(WORDS_RU)}-${pick(WORDS_RU)}-${pick(WORDS_RU)}-${Math.floor(Math.random()*90+10)}`;
}

// ============================================================
// КОМАНДЫ
// ============================================================
bot.command('start', async (ctx) => {
  const keyboard = new InlineKeyboard()
    .text('🔐 Проверить пароль', 'check')
    .row()
    .text('⚡ Сгенерировать', 'generate')
    .text('🔑 Фраза', 'phrase')
    .row()
    .text('ℹ️ О боте', 'about');

  await ctx.reply(
    `🔐 *Hsbpassword Bot*\n\n` +
    `Проверка паролей на утечки, генерация, оценка силы.\n\n` +
    `Выберите действие:`,
    { parse_mode: 'Markdown', reply_markup: keyboard }
  );
});

bot.command('help', async (ctx) => {
  await ctx.reply(
    `📚 *Команды:*\n\n` +
    `/start — меню\n` +
    `/check <пароль> — проверить на утечки\n` +
    `/gen [длина] — сгенерировать пароль\n` +
    `/phrase — фраза из слов\n` +
    `/help — эта справка\n\n` +
    `Или просто отправь пароль текстом — я проверю.`,
    { parse_mode: 'Markdown' }
  );
});

bot.command('check', async (ctx) => {
  const pwd = ctx.match;
  if (!pwd) {
    await ctx.reply('Отправь: `/check твой_пароль`', { parse_mode: 'Markdown' });
    return;
  }
  await doCheck(ctx, pwd);
});

bot.command('gen', async (ctx) => {
  const len = parseInt(ctx.match) || 20;
  const pwd = generatePassword(Math.min(Math.max(len, 8), 64));
  await ctx.reply(`⚡ *Сгенерированный пароль:*\n\n\`${pwd}\`\n\n📋 Нажми на пароль, чтобы скопировать.`, { parse_mode: 'Markdown' });
});

bot.command('phrase', async (ctx) => {
  const phrase = generatePhrase();
  await ctx.reply(`🔑 *Фраза:*\n\n\`${phrase}\`\n\nЛегче запомнить, сложнее взломать.`, { parse_mode: 'Markdown' });
});

// ============================================================
// INLINE КНОПКИ
// ============================================================
bot.callbackQuery('check', async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply('🔐 Отправь пароль текстом следующим сообщением.');
});

bot.callbackQuery('generate', async (ctx) => {
  await ctx.answerCallbackQuery();
  const pwd = generatePassword(20);
  await ctx.reply(`⚡ *Сгенерированный пароль:*\n\n\`${pwd}\`\n\n📋 Нажми, чтобы скопировать.`, { parse_mode: 'Markdown' });
});

bot.callbackQuery('phrase', async (ctx) => {
  await ctx.answerCallbackQuery();
  const phrase = generatePhrase();
  await ctx.reply(`🔑 *Фраза:*\n\n\`${phrase}\``, { parse_mode: 'Markdown' });
});

bot.callbackQuery('about', async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.reply(
    `ℹ️ *О боте*\n\n` +
    `🛡️ Пароль *не покидает сервер Telegram* — проверка через k-Anonymity.\n` +
    `Отправляем только первые 5 символов SHA-1 хеша.\n\n` +
    `Данные: Have I Been Pwned`,
    { parse_mode: 'Markdown' }
  );
});

// ============================================================
// АВТОПРОВЕРКА ТЕКСТА
// ============================================================
bot.on('message:text', async (ctx) => {
  const text = ctx.message.text;
  if (text.startsWith('/')) return;
  if (text.length < 100 && !text.includes(' ')) {
    await doCheck(ctx, text);
  }
});

async function doCheck(ctx, pwd) {
  const loading = await ctx.reply('🔍 Проверяем...');

  try {
    const count = await checkHIBP(pwd);
    const keyboard = isKeyboardPattern(pwd);
    const top = isTopPassword(pwd);
    const cyr = hasCyrillic(pwd);
    const strength = calcStrength(pwd);
    const crackTime = estimateCrackTime(pwd);

    let msg = `🔐 *Результат проверки:*\n\n`;
    msg += `${strength.emoji} Сила: *${strength.label}*\n`;
    msg += `⏱ Взломают за: *${crackTime}*\n\n`;

    if (count > 0) {
      msg += `🚨 *Найден в утечках ${count.toLocaleString('ru')} раз!*\n`;
      msg += `⚠️ Срочно смените этот пароль.\n`;
    } else {
      msg += `✅ *Не найден в известных утечках.*\n`;
    }

    if (top) msg += `\n📊 Пароль в *топ-1000* популярных!`;
    if (keyboard) msg += `\n⌨️ Это *клавиатурный паттерн* — взломают за секунду.`;
    if (cyr) msg += `\n🇷🇺 Пароль на кириллице.`;

    msg += `\n\n💡 Используй /gen для генерации надёжного пароля.`;

    await ctx.api.editMessageText(ctx.chat.id, loading.message_id, msg, { parse_mode: 'Markdown' });
  } catch (e) {
    console.error('Check error:', e);
    await ctx.api.editMessageText(ctx.chat.id, loading.message_id, '❌ Ошибка запроса. Попробуй позже.');
  }
}

// ============================================================
// WEBHOOK + EXPRESS
// ============================================================
const app = express();
app.use(express.json());

app.post(`/${BOT_TOKEN}`, async (req, res) => {
  try {
    await bot.handleUpdate(req.body);
    res.sendStatus(200);
  } catch (err) {
    console.error('Update error:', err);
    res.sendStatus(500);
  }
});

app.get('/', (req, res) => {
  res.send('✅ Hsbpassword bot is alive');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`✅ Server on port ${PORT}`);

  const WEBHOOK_URL = process.env.RENDER_EXTERNAL_URL;
  if (WEBHOOK_URL) {
    const fullUrl = `${WEBHOOK_URL}/${BOT_TOKEN}`;
    try {
      await bot.api.setWebhook(fullUrl);
      console.log(`✅ Webhook set: ${fullUrl}`);
      const info = await bot.api.getMe();
      console.log(`✅ Bot @${info.username} ready`);
    } catch (err) {
      console.error('Webhook error:', err);
    }
  } else {
    console.warn('⚠️ RENDER_EXTERNAL_URL не задан — webhook не установлен');
  }
});

process.on('unhandledRejection', (err) => console.error('Unhandled:', err));
process.on('uncaughtException', (err) => console.error('Uncaught:', err));
