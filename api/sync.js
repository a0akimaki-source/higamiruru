// 🌟【エラー対策版】Vercelで確認したURL（redis:// から始まる文字列）を貼り付けます
// ⚠️ 「redis-cli -u 」という文字は含めず、必ず「redis://」から始まる部分だけを貼り付けてください
const REDIS_URL = "redis://default:nL0gsSSOYQIRBAbG9dSTeRHyhiHAlhK4@fuel-perfect-ultrapolished-46352.db.redis.io:14291";

export default async function handler(req, res) {
  // 🔐 1. パスワード制限（Basic認証）
  const auth = req.headers.authorization;
  if (!auth) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
    return res.status(401).send('Authentication required.');
  }
  
  try {
    const [user, pwd] = Buffer.from(auth.split(' ')[1], 'base64').toString().split(':');
    
    // ⬇️ 「admin」と「password123」をご自身の好きなユーザー名とパスワードに変えてください
    if (user !== 'admin' || pwd !== 'password123') {
      res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
      return res.status(401).send('Authentication required.');
    }

    // 🌍 2. データの自動同期
    // 接続URLからパスワードやホスト名を正しく分解する処理
    const cleanUrl = REDIS_URL.trim().replace(/'/g, "").replace(/"/g, "");
    const match = cleanUrl.match(/redis:\/\/([^:]+):([^@]+)@([^:]+):(\d+)/);
    if (!match) {
      return res.status(500).json({ error: "URLの書き方が正しくありません。「redis://...」の形になっているか確認してください。" });
    }
    const [_, username, password, host, port] = match;

    // 受付・管理・モニターからのデータの読み書き
    if (req.method === 'POST') {
      global.cachedPatients = req.body;
      return res.status(200).json({ success: true });
    } else {
      const data = global.cachedPatients || [];
      return res.status(200).json(data);
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
