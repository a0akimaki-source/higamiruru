
// 🌟【パスワード完全一致・通信復旧版】
// Vercelで確認した「redis://」から始まるURLを貼り付けてください
const REDIS_URL = "redis://default:nL0gsSSOYQIRBAbG9dSTeRHyhiHAlhK4@fuel-perfect-ultrapolished-46352.db.redis.io:14291";


export default async function handler(req, res) {
  // 🔐 1. パスワード制限（Basic認証）の完全一致化
  const auth = req.headers.authorization;
  if (!auth) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Secure Area"');
    return res.status(401).send('Authentication required.');
  }
  
  try {
    // 🌟 画面側から送られてくる「Basic c3RhZmY6Nzc3Nw==」(staff:7777の暗号)と完全に一致するか文字列で直接判定
    // これにより、環境によるデコード（解読）のズレを100%防ぎます
    if (auth !== "Basic c3RhZmY6Nzc3Nw==") {
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
    const kvRestUrl = `https://${host}`;

    if (req.method === 'POST') {
      const patientsData = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      
      const response = await fetch(`${kvRestUrl}/set/patients`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${password}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(patientsData)
      });
      await response.json();
      return res.status(200).json({ success: true });
    } else {
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
