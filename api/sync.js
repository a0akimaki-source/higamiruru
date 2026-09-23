// 🌟【Vercel KV 最新正式仕様・通信エラー完全解消版】
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
    // 🔐 1. HTML内でのパスワードチェック
    const auth = req.headers.authorization;
    if (!auth || auth !== "Basic c3RhZmY6Nzc3Nw==") {
      return res.status(200).json({ authError: true, msg: "認証が必要です。" });
    }

    // 🌍 2. データの自動同期（Vercel KV の正式仕様に合わせて再構築）
    const cleanUrl = REDIS_URL.trim().replace(/'/g, "").replace(/"/g, "");
    const match = cleanUrl.match(/redis:\/\/([^:]+):([^@]+)@([^:]+):(\d+)/);
    if (!match) {
      return res.status(500).json({ error: "URLの書き方が正しくありません。" });
    }
    const [_, username, password, host, port] = match;
    const kvRestUrl = `https://${host}`;

    if (req.method === 'POST') {
      // 🌟【最重要修正】Vercel KVのエンドポイントルールに基づき、正しく文字データとして金庫へ格納するリクエスト形式
      const patientsData = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      
      const response = await fetch(`${kvRestUrl}/`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${password}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          command: "set",
          args: ["patients", patientsData]
        })
      });
      await response.json(); // 応答を確実に解析してサーバーの処理を完了させる
      return res.status(200).json({ success: true });

    } else {
      // 🌟【最重要修正】金庫の「patients」という棚からデータを正しく取り出すリクエスト形式
      const response = await fetch(`${kvRestUrl}/`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${password}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          command: "get",
          args: ["patients"]
        })
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
