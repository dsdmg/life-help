import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import http from 'http';
import jwt from 'jsonwebtoken';
import { WebSocket, WebSocketServer } from 'ws';
import db from './database.js';

const app = express();
const server = http.createServer(app);
const PORT = 3000;
const JWT_SECRET = 'life-help-secret-key';
const WS_PATH = '/ws';
const HEARTBEAT_INTERVAL = 25000;
const CLIENT_TIMEOUT = 60000;
const wsClients = new Set();
const wss = new WebSocketServer({ server, path: WS_PATH });

app.use(cors());
app.use(express.json());

const sendWsMessage = (client, payload) => {
  if (client.readyState === WebSocket.OPEN) {
    client.send(JSON.stringify(payload));
  }
};

const broadcastPushMessage = (message, sender = '系统') => {
  const payload = {
    type: 'push_message',
    message,
    sender,
    timestamp: new Date().toISOString()
  };

  wsClients.forEach((client) => {
    sendWsMessage(client, payload);
  });
};

const parseSocketUser = (req) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const token = requestUrl.searchParams.get('token');

  if (!token) {
    return { username: '访客' };
  }

  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return { username: '访客' };
  }
};

wss.on('connection', (ws, req) => {
  ws.user = parseSocketUser(req);
  ws.clientId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  ws.lastHeartbeat = Date.now();
  wsClients.add(ws);

  sendWsMessage(ws, {
    type: 'connection_ack',
    message: 'WebSocket 连接成功',
    clientId: ws.clientId,
    username: ws.user.username || '访客',
    timestamp: new Date().toISOString()
  });

  ws.on('message', (rawMessage) => {
    let payload;

    try {
      payload = JSON.parse(rawMessage.toString());
    } catch (error) {
      sendWsMessage(ws, {
        type: 'error',
        message: '消息格式错误，仅支持 JSON',
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (payload.type === 'ping') {
      ws.lastHeartbeat = Date.now();
      sendWsMessage(ws, {
        type: 'pong',
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (payload.type === 'request_push') {
      const message = String(payload.message || '').trim();

      if (!message) {
        sendWsMessage(ws, {
          type: 'error',
          message: '推送内容不能为空',
          timestamp: new Date().toISOString()
        });
        return;
      }

      sendWsMessage(ws, {
        type: 'push_ack',
        message: '后端已接收推送请求',
        content: message,
        timestamp: new Date().toISOString()
      });

      broadcastPushMessage(message, ws.user.username || '访客');
      return;
    }

    sendWsMessage(ws, {
      type: 'error',
      message: `不支持的消息类型: ${payload.type || 'unknown'}`,
      timestamp: new Date().toISOString()
    });
  });

  ws.on('close', () => {
    wsClients.delete(ws);
  });

  ws.on('error', (error) => {
    console.error('WebSocket 连接异常:', error);
  });
});

setInterval(() => {
  const now = Date.now();

  wsClients.forEach((client) => {
    if (now - client.lastHeartbeat > CLIENT_TIMEOUT) {
      sendWsMessage(client, {
        type: 'disconnect_notice',
        message: '心跳超时，连接已关闭',
        timestamp: new Date().toISOString()
      });
      client.close();
      wsClients.delete(client);
    }
  });
}, HEARTBEAT_INTERVAL);

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: '未提供认证令牌' });
  }
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: '令牌无效或已过期' });
    }
    req.user = user;
    next();
  });
};

app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ error: '用户名和密码不能为空' });
  }
  
  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, user) => {
    if (err) {
      return res.status(500).json({ error: '数据库查询失败' });
    }
    
    if (!user) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    
    try {
      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return res.status(401).json({ error: '用户名或密码错误' });
      }
      
      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ token, user: { id: user.id, username: user.username } });
    } catch (error) {
      res.status(500).json({ error: '登录处理失败' });
    }
  });
});

app.get('/api/warehouses', authenticateToken, (req, res) => {
  db.all('SELECT * FROM warehouses ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: '查询仓库失败' });
    }
    res.json(rows);
  });
});

app.post('/api/warehouses', authenticateToken, (req, res) => {
  const { name, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: '仓库名称不能为空' });
  }
  
  db.run('INSERT INTO warehouses (name, description) VALUES (?, ?)', [name, description || ''], function(err) {
    if (err) {
      return res.status(500).json({ error: '创建仓库失败' });
    }
    res.status(201).json({ id: this.lastID, name, description });
  });
});

app.get('/api/items', authenticateToken, (req, res) => {
  db.all('SELECT * FROM items ORDER BY created_at DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: '查询物品失败' });
    }
    res.json(rows);
  });
});

app.get('/api/items/search', authenticateToken, (req, res) => {
  const { keyword } = req.query;
  
  if (!keyword) {
    return res.status(400).json({ error: '搜索关键词不能为空' });
  }
  
  db.all('SELECT * FROM items WHERE name = ? OR barcode = ?', [keyword, keyword], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: '查询物品失败' });
    }
    res.json(rows);
  });
});

app.post('/api/items', authenticateToken, (req, res) => {
  const { name, category, unit, shelf_life, barcode } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: '物品名称不能为空' });
  }
  
  db.run('INSERT INTO items (name, category, unit, shelf_life, barcode) VALUES (?, ?, ?, ?, ?)', [name, category || '', unit || '', shelf_life || null, barcode || ''], function(err) {
    if (err) {
      return res.status(500).json({ error: '创建物品失败' });
    }
    res.status(201).json({ id: this.lastID, name, category, unit, shelf_life, barcode });
  });
});

app.put('/api/items/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, category, unit, shelf_life, barcode } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: '物品名称不能为空' });
  }
  
  db.run('UPDATE items SET name = ?, category = ?, unit = ?, shelf_life = ?, barcode = ? WHERE id = ?', 
    [name, category || '', unit || '', shelf_life || null, barcode || '', id], 
    function(err) {
      if (err) {
        return res.status(500).json({ error: '更新物品失败' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: '物品不存在' });
      }
      res.json({ id, name, category, unit, shelf_life, barcode });
    });
});

app.get('/api/inventory', authenticateToken, (req, res) => {
  const { warehouse_id } = req.query;

  let sql = `
    SELECT i.id, i.warehouse_id, i.item_id, i.batch_number, i.quantity, i.updated_at,
           w.name as warehouse_name, it.name as item_name, it.category, it.unit
    FROM inventory i
    LEFT JOIN warehouses w ON i.warehouse_id = w.id
    LEFT JOIN items it ON i.item_id = it.id
  `;

  const params = [];
  if (warehouse_id) {
    sql += ' WHERE i.warehouse_id = ?';
    params.push(warehouse_id);
  }

  sql += ' ORDER BY it.name ASC, i.batch_number ASC';

  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: '查询库存失败' });
    }
    res.json(rows);
  });
});

app.get('/api/records', authenticateToken, (req, res) => {
  const { warehouse_id, type } = req.query;
  
  let sql = `
    SELECT r.id, r.type, r.warehouse_id, r.item_id, r.quantity, r.operator, r.remark, r.batch_number, r.shelf_life, r.created_at,
           w.name as warehouse_name, it.name as item_name
    FROM records r
    LEFT JOIN warehouses w ON r.warehouse_id = w.id
    LEFT JOIN items it ON r.item_id = it.id
  `;
  
  const conditions = [];
  const params = [];
  
  if (warehouse_id) {
    conditions.push('r.warehouse_id = ?');
    params.push(warehouse_id);
  }
  
  if (type) {
    conditions.push('r.type = ?');
    params.push(type);
  }
  
  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  
  sql += ' ORDER BY r.created_at DESC';
  
  db.all(sql, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: '查询记录失败' });
    }
    res.json(rows);
  });
});

app.post('/api/records', authenticateToken, (req, res) => {
  const { type, warehouse_id, item_id, quantity, operator, remark, batch_number, shelf_life } = req.body;

  if (!type || !warehouse_id || !item_id || quantity === undefined) {
    return res.status(400).json({ error: '缺少必要参数' });
  }

  if (!['in', 'out'].includes(type)) {
    return res.status(400).json({ error: '类型必须是 in 或 out' });
  }

  const batch = batch_number || '';

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    db.get('SELECT * FROM inventory WHERE warehouse_id = ? AND item_id = ? AND batch_number = ?', [warehouse_id, item_id, batch], (err, inventory) => {
      if (err) {
        db.run('ROLLBACK');
        return res.status(500).json({ error: '查询库存失败' });
      }

      const qty = parseInt(quantity);
      let newQuantity = inventory ? inventory.quantity : 0;

      if (type === 'in') {
        newQuantity += qty;
      } else {
        newQuantity -= qty;
        if (newQuantity < 0) {
          db.run('ROLLBACK');
          return res.status(400).json({ error: '该批号库存不足' });
        }
      }

      if (inventory) {
        if (newQuantity === 0) {
          db.run('DELETE FROM inventory WHERE id = ?', [inventory.id], (err) => {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: '删除库存记录失败' });
            }
            insertRecord();
          });
        } else {
          db.run('UPDATE inventory SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newQuantity, inventory.id], (err) => {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: '更新库存失败' });
            }
            insertRecord();
          });
        }
      } else if (type === 'in') {
        db.run('INSERT INTO inventory (warehouse_id, item_id, batch_number, quantity) VALUES (?, ?, ?, ?)', [warehouse_id, item_id, batch, newQuantity], (err) => {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: '创建库存记录失败' });
          }
          insertRecord();
        });
      } else {
        db.run('ROLLBACK');
        return res.status(400).json({ error: '该批号不存在库存' });
      }

      function insertRecord() {
        db.run('INSERT INTO records (type, warehouse_id, item_id, quantity, operator, remark, batch_number, shelf_life) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [type, warehouse_id, item_id, qty, operator || '', remark || '', batch, shelf_life || null], function(err) {
            if (err) {
              db.run('ROLLBACK');
              return res.status(500).json({ error: '创建出入库记录失败' });
            }

            db.run('COMMIT');
            res.status(201).json({
              id: this.lastID,
              type,
              warehouse_id,
              item_id,
              quantity: qty,
              operator,
              remark,
              batch_number: batch,
              shelf_life,
              new_quantity: newQuantity
            });
          });
      }
    });
  });
});

app.get('/api/inventory/expiring', authenticateToken, (req, res) => {
  const days = parseInt(req.query.days) || 5;

  const sql = `
    SELECT
      i.id,
      it.name,
      w.name as warehouse,
      i.batch_number,
      i.quantity,
      r.shelf_life,
      r.created_at as entry_date,
      CASE
        WHEN r.shelf_life IS NOT NULL THEN
          r.shelf_life - CAST((julianday('now') - julianday(r.created_at)) AS INTEGER)
        ELSE NULL
      END as daysLeft
    FROM inventory i
    LEFT JOIN items it ON i.item_id = it.id
    LEFT JOIN warehouses w ON i.warehouse_id = w.id
    LEFT JOIN (
      SELECT item_id, warehouse_id, batch_number, shelf_life, created_at,
             ROW_NUMBER() OVER (PARTITION BY item_id, warehouse_id, batch_number ORDER BY created_at DESC) as rn
      FROM records
      WHERE type = 'in'
    ) r ON i.item_id = r.item_id AND i.warehouse_id = r.warehouse_id AND i.batch_number = r.batch_number AND r.rn = 1
    WHERE i.quantity > 0
      AND r.shelf_life IS NOT NULL
      AND (r.shelf_life - CAST((julianday('now') - julianday(r.created_at)) AS INTEGER)) BETWEEN 0 AND ?
    ORDER BY daysLeft ASC
  `;

  db.all(sql, [days], (err, rows) => {
    if (err) {
      console.error('查询快过期物品失败:', err);
      return res.status(500).json({ error: '查询快过期物品失败' });
    }
    res.json(rows);
  });
});

server.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
  console.log(`WebSocket 服务运行在 ws://localhost:${PORT}${WS_PATH}`);
});
