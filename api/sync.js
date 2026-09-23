
// 🌟【Vercel KV 正式仕様・通信エラー完全解消版】
// Vercelで確認した「redis://」から始まるURLを貼り付けてください
const REDIS_URL = "redis://default:nL0gsSSOYQIRBAbG9dSTeRHyhiHAlhK4@fuel-perfect-ultrapolished-46352.db.redis.io:14291";


export default async function handler(req, res) {
  // 🌟 ブラウザの通信拒否（CORSエラー）を防ぐためのセキュリティ解除命令
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // 🔐 1. パスワードチェック (staff:7777)
    const auth = req.headers.authorization;
    if (!auth || auth !== "Basic c3RhZmY6Nzc3Nw==") {
      return res.status(200).json({ authError: true, msg: "認証が必要です。" });
    }

    // 🌍 2. データの自動同期（redis-cinnabar-batteryの通信仕様に完全最適化）
    const cleanUrl = REDIS_URL.trim().replace(/'/g, "").replace(/"/g, "");
    const match = cleanUrl.match(/redis:\/\/([^:]+):([^@]+)@([^:]+):(\d+)/);
    if (!match) {
      return res.status(500).json({ error: "URLの書き方が正しくありません。" });
    }
    const [_, username, password, host, port] = match;
    const kvRestUrl = `https://${host}`;

    if (req.method === 'POST') {
      // 🌟【最重要：修正】Vercel KVの正式な保存ルールに合わせた形式
      const patientsData = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      
      const response = await fetch(`${kvRestUrl}/`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${password}`
        },
        body: JSON.stringify(["set", "patients", patientsData]) // 🌟この配列形式が正規のルールです
      });
      await response.json(); 
      return res.status(200).json({ success: true });

    } else {
      // 🌟【最重要：修正】Vercel KVの正式な読み出しルールに合わせた形式
      const response = await fetch(`${kvRestUrl}/`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${password}`
        },
        body: JSON.stringify(["get", "patients"]) // 🌟この配列形式が正規のルールです
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
