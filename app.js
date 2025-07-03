const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const db = new sqlite3.Database('db.sqlite');

// 미들웨어 설정
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 정적 파일 서빙은 한 번만, 라우터 아래에 두어도 됩니다.
app.use(express.static(path.join(__dirname, 'public')));

// DB 테이블 생성
db.run(`
  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    content TEXT
  )
`);

// API 라우터
app.get('/api/posts', (req, res) => {
  db.all('SELECT * FROM posts ORDER BY id DESC', (err, rows) => {
    if (err) return res.status(500).json({ error: 'DB 오류' });
    res.json(rows);
  });
});

app.get('/api/posts/:id', (req, res) => {
  const id = req.params.id;
  db.get('SELECT * FROM posts WHERE id = ?', [id], (err, row) => {
    if (err || !row) return res.status(404).json({ error: '글을 찾을 수 없습니다.' });
    res.json(row);
  });
});

app.post('/api/posts', (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: '제목과 내용을 입력하세요.' });

  db.run('INSERT INTO posts (title, content) VALUES (?, ?)', [title, content], function (err) {
    if (err) return res.status(500).json({ error: '글 저장 오류' });
    res.json({ id: this.lastID });
  });
});

app.put('/api/posts/:id', (req, res) => {
  const { title, content } = req.body;
  const id = req.params.id;

  if (!title || !content) {
    return res.status(400).json({ error: '제목과 내용을 입력하세요.' });
  }

  db.run(
    'UPDATE posts SET title = ?, content = ? WHERE id = ?',
    [title, content, id],
    function (err) {
      if (err) return res.status(500).json({ error: '수정 실패' });
      if (this.changes === 0) return res.status(404).json({ error: '글을 찾을 수 없습니다.' });
      res.json({ message: '수정 완료' });
    }
  );
});

app.delete('/api/posts/:id', (req, res) => {
  const id = req.params.id;

  db.run('DELETE FROM posts WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: '삭제 실패' });
    if (this.changes === 0) return res.status(404).json({ error: '글을 찾을 수 없습니다.' });
    res.json({ message: '삭제 완료' });
  });
});

// HTML 페이지 라우팅
app.get('/edit/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'edit.html'));
});

app.get('/view/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'view.html'));
});

app.get('/write', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'write.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 서버 실행
app.listen(3000, () => {
  console.log('서버 실행: http://localhost:3000');
});
