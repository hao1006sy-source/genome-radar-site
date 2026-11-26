(function(){
  'use strict';
  const S = window.GenomeLibrary;
  const issueMatch = location.pathname.match(/(?:personal-supplement\/)?(\d{4}-\d{2}-\d{2}(?:-supp-\d+)?)\/index\.html$/);
  if (!S || !issueMatch) return;

  const isSupplement = location.pathname.includes('/personal-supplement/');
  const issueDate = issueMatch[1];
  const basePath = isSupplement ? '../../' : '../';

  let articles = [];

  function msg(e) {
    console.error(e);
    let n = document.getElementById('library-error');
    if (!n) {
      n = document.createElement('div');
      n.id = 'library-error';
      n.setAttribute('role', 'alert');
      n.style.cssText = 'position:fixed;z-index:9999;top:52px;right:8px;background:#fff8e8;color:#713900;border:1px solid #bca980;padding:10px;max-width:300px';
      document.body.append(n);
    }
    n.textContent = '文献库保存或读取失败：' + e.message;
  }

  function refresh() {
    try {
      let state = S.read();
      document.querySelectorAll('.star').forEach((b, i) => {
        let a = articles.find(x => x.article_number === (i + 1));
        if (!a) return;
        let v = state.records[S.key(a)];
        let starred = Boolean(v && v.starred);
        b.setAttribute('data-on', starred ? '1' : '0');
        b.setAttribute('aria-pressed', starred ? 'true' : 'false');
        b.title = starred ? '取消收藏' : '收藏';
        b.setAttribute('aria-label', b.title);
        let sel = b.parentNode.querySelector('.library-status');
        if (sel) sel.value = v ? v.status : 'unread';
      });
    } catch(e) {
      msg(e);
    }
  }

  fetch(basePath + 'assets/search-index.json?_t=' + Date.now())
    .then(r => {
      if (!r.ok) throw Error('索引加载失败');
      return r.json();
    })
    .then(d => {
      if (isSupplement) {
        articles = d.articles.filter(a => a.source_type === 'personal_supplement' && (a.issue_date === issueDate || a.issue === issueDate || String(a.id).startsWith(issueDate)));
      } else {
        articles = d.articles.filter(a => a.issue === issueDate && a.source_type !== 'personal_supplement');
      }

      S.migrate(d.articles);

      document.querySelectorAll('.star').forEach((b, i) => {
        let a = articles.find(x => x.article_number === (i + 1));
        if (!a) return;

        b.addEventListener('click', () => {
          try {
            S.update(a, r => { r.starred = !r.starred; });
            refresh();
          } catch(e) {
            msg(e);
          }
        });

        let sel = document.createElement('select');
        sel.className = 'library-status';
        sel.setAttribute('aria-label', '阅读状态');
        [['unread', '未开始'], ['to_read', '待精读'], ['read', '已读']].forEach(([v, t]) => sel.add(new Option(t, v)));
        sel.addEventListener('change', () => {
          try {
            S.update(a, r => { r.status = sel.value; });
            refresh();
          } catch(e) {
            msg(e);
          }
        });

        let note = document.createElement('a');
        note.href = basePath + 'library.html?article=' + encodeURIComponent(a.id);
        note.textContent = '研究笔记';
        note.className = 'library-note-link';

        let deep = document.createElement('a');
        deep.className = 'library-deep-link';
        deep.href = basePath + 'deep-read.html?article=' + encodeURIComponent(a.id);
        deep.textContent = '精读';

        b.before(sel, note, deep);
      });

      refresh();
    })
    .catch(msg);

  window.addEventListener('storage', e => {
    if (e.key === S.KEY || e.key === 'gr_stars') refresh();
  });
  window.addEventListener('gr-library-change', refresh);
})();
