import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from './database.js';

const app = express();
const PORT = 3000;
const JWT_SECRET = 'life-help-secret-key';

app.use(cors());
app.use(express.json());

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

app.post('/api/items', authenticateToken, (req, res) => {
  const { name, category, unit, shelf_life } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: '物品名称不能为空' });
  }
  
  db.run('INSERT INTO items (name, category, unit, shelf_life) VALUES (?, ?, ?, ?)', [name, category || '', unit || '', shelf_life || null], function(err) {
    if (err) {
      return res.status(500).json({ error: '创建物品失败' });
    }
    res.status(201).json({ id: this.lastID, name, category, unit, shelf_life });
  });
});

app.put('/api/items/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, category, unit, shelf_life } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: '物品名称不能为空' });
  }
  
  db.run('UPDATE items SET name = ?, category = ?, unit = ?, shelf_life = ? WHERE id = ?', 
    [name, category || '', unit || '', shelf_life || null, id], 
    function(err) {
      if (err) {
        return res.status(500).json({ error: '更新物品失败' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: '物品不存在' });
      }
      res.json({ id, name, category, unit, shelf_life });
    });
});

app.get('/api/inventory', authenticateToken, (req, res) => {
  const { warehouse_id } = req.query;
  
  let sql = `
    SELECT i.id, i.warehouse_id, i.item_id, i.quantity, i.updated_at,
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
  
  sql += ' ORDER BY i.updated_at DESC';
  
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
  
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    
    db.get('SELECT * FROM inventory WHERE warehouse_id = ? AND item_id = ?', [warehouse_id, item_id], (err, inventory) => {
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
          return res.status(400).json({ error: '库存不足' });
        }
      }
      
      if (inventory) {
        db.run('UPDATE inventory SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newQuantity, inventory.id], (err) => {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: '更新库存失败' });
          }
          insertRecord();
        });
      } else {
        db.run('INSERT INTO inventory (warehouse_id, item_id, quantity) VALUES (?, ?, ?)', [warehouse_id, item_id, newQuantity], (err) => {
          if (err) {
            db.run('ROLLBACK');
            return res.status(500).json({ error: '创建库存记录失败' });
          }
          insertRecord();
        });
      }
      
      function insertRecord() {
        db.run('INSERT INTO records (type, warehouse_id, item_id, quantity, operator, remark, batch_number, shelf_life) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
          [type, warehouse_id, item_id, qty, operator || '', remark || '', batch_number || '', shelf_life || null], function(err) {
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
              batch_number,
              shelf_life,
              new_quantity: newQuantity
            });
          });
      }
    });
  });
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
