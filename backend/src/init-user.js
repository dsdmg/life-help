import bcrypt from 'bcrypt';
import db from './database.js';

async function initTestUser() {
  try {
    const username = 'admin';
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);
    
    db.get('SELECT id FROM users WHERE username = ?', [username], (err, row) => {
      if (err) {
        console.error('查询用户失败:', err.message);
        return;
      }
      
      if (row) {
        console.log('测试用户已存在:', username);
      } else {
        db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], function(err) {
          if (err) {
            console.error('创建用户失败:', err.message);
          } else {
            console.log('✅ 测试用户创建成功!');
            console.log('用户名:', username);
            console.log('密码:', password);
          }
        });
      }
    });
  } catch (error) {
    console.error('初始化用户失败:', error.message);
  }
}

initTestUser();
