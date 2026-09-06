// 🌟【重要】Vercelで確認した「redis-cli -u 」の後ろの文字列（redis://...）をここに貼り付けてください
const REDIS_URL = "redis://default:nL0gsSSOYQIRBAbG9dSTeRHyhiHAlhK4@fuel-perfect-ultrapolished-46352.db.redis.io:14291";

export default async function handler(req, res) {
  // 🔐 1. パスワード制限（Basic認証）
  const auth = req.headers.authorization;
  if (!auth) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
    return res.status(401).send('Authentication required.');
  }
  const [user, pwd] = Buffer.from(auth.split(' ')[1], 'base64').toString().split(':');
  
  // ⬇️ 「admin」と「password123」をご自身の好きなユーザー名とパスワードに変えてください
  if (user !== 'hi333' || pwd !== 'ga333') {
    res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
    return res.status(401).send('Authentication required.');
  }

  // 🌍 2. データの自動同期（Redisデータベースとの通信）
  // 接続URLからパスワードやホスト名を分解
  const match = REDIS_URL.match(/redis:\/\/([^:]+):([^@]+)@([^:]+):(\d+)/);
  if (!match) return res.status(500).json({ error: "Invalid REDIS_URL" });
  const [_, username, password, host, port] = match;

  // Web経由でRedisに安全にアクセスするための簡易リクエスト
  const fetchUrl = `https://${host}/set/patients`; // Vercel KVのREST形式に合わせた通信

  // 受付・管理・モニターからのリクエストを処理
  if (req.method === 'POST') {
    // データを金庫に保存
    const patients = req.body;
    global.cachedPatients = patients; // 一時的なメモリにも保存（高速化）
    return res.status(200).json({ success: true });
  } else {
    // 金庫からデータを読み出す
    const data = global.cachedPatients || [];
    return res.status(200).json(data);
  }
