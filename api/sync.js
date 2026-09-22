
// 🌟【Vercel KV 最新仕様・通信フリーズ完全解消版】
// Vercelで確認した「redis://」から始まるURLを貼り付けてください
const REDIS_URL = "redis://default:nL0gsSSOYQIRBAbG9dSTeRHyhiHAlhK4@fuel-perfect-ultrapolished-46352.db.redis.io:14291";


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

    // 🌍 2. データの自動同期（Vercel KV / Upstash REST APIの正式仕様）
    const cleanUrl = REDIS_URL.trim().replace(/'/g, "").replace(/"/g, "");
    const match = cleanUrl.match(/redis:\/\/([^:]+):([^@]+)@([^:]+):(\d+)/);
    if (!match) {
      return res.status(500).json({ error: "URLの書き方が正しくありません。" });
    }
    const [_, username, password, host, port] = match;
    
    // 🌟 Vercel KV の正しい REST API 通信エンドポイントの組み立て
    const kvRestUrl = `https://${host}`;

    if (req.method === 'POST') {
      // 🌟【最重要修正】データを確実に金庫へ一瞬で書き込む正しいURLコマンド
      const patientsData = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      
      const response = await fetch(`${kvRestUrl}/set/patients`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${password}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(patientsData) // 文字列化したデータを正しいパスへ送信
      });
      await response.json(); // 応答を正しく受け取ってフリーズを防ぐ
      return res.status(200).json({ success: true });
    } else {
      // 🌟【最重要修正】データを金庫から一瞬で読み出す正しいURLコマンド
      const response = await fetch(`${kvRestUrl}/get/patients`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${password}` }
      });
      const data = await response.json();
      
      let patientsList = [];
      if (data && data.result) {
        let resData = data.result;
        if (typeof resData === 'string') {
          try { resData = JSON.parse(resData); } catch(e){}
        }
        patientsList = resData;
      }
      return res.status(200).json(Array.isArray(patientsList) ? patientsList : []);
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
