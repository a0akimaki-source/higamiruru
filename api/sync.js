// 🌟【完全連動版】Vercelで確認したURL（redis:// から始まる文字列）を貼り付けます
const REDIS_URL = "ここに redis:// から始まるURLを貼り付け";

export default async function handler(req, res) {
  // 🔐 1. パスワード制限（Basic認証）
  const auth = req.headers.authorization;
  if (!auth) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
    return res.status(401).send('Authentication required.');
  }
  
  try {
    const base64Token = auth.split(' ')[1] || auth.split(' ')[0];
    const decoded = Buffer.from(base64Token, 'base64').toString('utf-8');
    const [user, pwd] = decoded.split(':');
    
    if (user.trim() !== 'staff' || pwd.trim() !== '7777') {
      res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
      return res.status(401).send('Authentication required.');
    }

    // 🌍 2. データの自動同期（Redisに直接読み書きする安全な通信）
    const cleanUrl = REDIS_URL.trim().replace(/'/g, "").replace(/"/g, "");
    
    // redis://[:password]@host:port から認証情報とホストを分解
    const match = cleanUrl.match(/redis:\/\/([^:]+):([^@]+)@([^:]+):(\d+)/);
    if (!match) {
      return res.status(500).json({ error: "URLの書き方が正しくありません。" });
    }
    const [_, username, password, host, port] = match;

    // Upstash / Vercel KV の REST API 形式へリクエストを送るためのURL
    const kvRestUrl = `https://${host}`;

    if (req.method === 'POST') {
      // 🌟 金庫（Redis）へデータを確実に保存
      const response = await fetch(`${kvRestUrl}/set/patients`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${password}` },
        body: JSON.stringify(req.body)
      });
      return res.status(200).json({ success: true });
    } else {
      // 🌟 金庫（Redis）からデータを確実に読み出し
      const response = await fetch(`${kvRestUrl}/get/patients`, {
        headers: { Authorization: `Bearer ${password}` }
      });
      const data = await response.json();
      
      let patientsList = [];
      if (data && data.result) {
        // 保存されているデータがあれば解析
        patientsList = typeof data.result === 'string' ? JSON.parse(data.result) : data.result;
      }
      return res.status(200).json(patientsList || []);
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
