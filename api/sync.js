// 🌟【エラー対策版】Vercelで確認したURL（redis:// から始まる文字列）を貼り付けます
const REDIS_URL = "redis://default:nL0gsSSOYQIRBAbG9dSTeRHyhiHAlhK4@fuel-perfect-ultrapolished-46352.db.redis.io:14291";

export default async function handler(req, res) {
  // 🔐 1. パスワード制限（Basic認証）
  const auth = req.headers.authorization;
  if (!auth) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
    return res.status(401).send('Authentication required.');
  }
  
  try {
    const base64Token = auth.split(' ')[1];
    const decoded = Buffer.from(base64Token, 'base64').toString('utf-8');
    // 前後の余計な空白を自動で削除して分解
    const [rawUser, rawPwd] = decoded.split(':');
    const user = rawUser.trim();
    const pwd = rawPwd.trim();
    
    // ⬇️ ここで判定する「ユーザー名」と「パスワード」を設定します
    // 💡 今回は間違いが起きにくいよう、すべて小文字の「staff」と「7777」に設定しました
    // 💡 タブレットで入力する際も、すべて小文字で入力してください
    if (user !== 'staff' || pwd !== '7777') {
      res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
      return res.status(401).send('Authentication required.');
    }

    // 🌍 2. データの自動同期
    const cleanUrl = REDIS_URL.trim().replace(/'/g, "").replace(/"/g, "");
    const match = cleanUrl.match(/redis:\/\/([^:]+):([^@]+)@([^:]+):(\d+)/);
    if (!match) {
      return res.status(500).json({ error: "URLの書き方が正しくありません。" });
    }

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
