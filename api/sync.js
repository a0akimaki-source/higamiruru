
// 🌟【データ通信修正版】Vercelで確認した「redis://」から始まるURLを貼り付けてください
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

    // 🌍 2. データの自動同期（データのズレを完全に修正）
    const cleanUrl = REDIS_URL.trim().replace(/'/g, "").replace(/"/g, "");
    const match = cleanUrl.match(/redis:\/\/([^:]+):([^@]+)@([^:]+):(\d+)/);
    if (!match) {
      return res.status(500).json({ error: "URLの書き方が正しくありません。" });
    }
    const [_, username, password, host, port] = match;
    const kvRestUrl = `https://${host}`;

    if (req.method === 'POST') {
      // 🌟 受付画面や管理画面からのデータを正しい文字形式で金庫に保存
      const pData = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      await fetch(`${kvRestUrl}/set/patients`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${password}` },
        body: JSON.stringify(pData)
      });
      return res.status(200).json({ success: true });
    } else {
      // 🌟 金庫からデータを読み出し、正しい配列形式に直して各画面に送る
      const response = await fetch(`${kvRestUrl}/get/patients`, {
        headers: { Authorization: `Bearer ${password}` }
      });
      const data = await response.json();
      
      let patientsList = [];
      if (data && data.result) {
        let resData = data.result;
        // 文字列が二重に重なっている場合を考慮して2回解析
        if (typeof resData === 'string') {
          try { resData = JSON.parse(resData); } catch(e){}
        }
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
