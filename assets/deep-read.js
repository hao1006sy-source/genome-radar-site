import { setupModules } from './deep-modules.js';
// 论文精读工作台。依赖已存在的 assets/library-store.js；不改变原有收藏/笔记字段。
const Store = window.GenomeLibrary;
const $ = id => document.getElementById(id);
const PDFJS_VERSION = '6.5.438';
const PDFJS_URL = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.min.mjs`;
const WORKER_URL = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${PDFJS_VERSION}/build/pdf.worker.min.mjs`;
const sections = [
  ['question', '研究问题与创新点', '研究背景、待解决的问题、作者的核心假设、创新之处。'],
  ['materials', '研究材料与实验设计', '物种、材料、样本量、对照和实验组、测序或实验设计。'],
  ['methods', '技术路线与方法', '软件和版本、主要算法、关键参数、分析步骤、统计检验。'],
  ['figures', 'Figure / Table 解读', '逐张记录图号、横纵坐标、对照、统计结果，以及该图支持的科学结论。'],
  ['results', '主要结果与证据', '核心发现、具体数字、图表定位、结论与证据对应关系。'],
  ['limitations', '局限与待验证问题', '样本和统计局限、潜在混杂因素、尚需实验支持的推断。'],
  ['inspiration', '我的思考与后续研究', '对课题的启发、可复用的方法、实验灵感、需要查阅的工作。']
];
const defaultNotes = () => Object.fromEntries(sections.map(([id]) => [id, '']));
let article = null;
let activeSection = 'question';
let notes = defaultNotes();
let pageNumber = 1;
let pageTotal = 0;
let zoom = 1;
let saveTimer = null;
let changed = false;
let pdfDoc = null;
let pdfRenderer = null;
let renderJob = null;
let renderToken = 0;
let currentFile = null;
let objectUrl = null;
let dbPromise = null;
let nativeFallback = false;

function notice(message) { $('notice').textContent = message || ''; }
function setSaveState(value) { $('save-state').textContent = value; }
function resolveArticle(index, state) {
  const query = new URLSearchParams(location.search);
  const wantedId = query.get('article');
  const wantedDoi = Store.normalizeDoi(query.get('doi') || '');
  const pool = Array.isArray(index.articles) ? index.articles : [];
  if (wantedId) {
    const fromIndex = pool.find(a => a.id === wantedId);
    if (fromIndex) return fromIndex;
    const match = Object.values(state.records).find(r => r.metadata && r.metadata.id === wantedId);
    if (match) return match.metadata;
  }
  if (wantedDoi) {
    const fromIndex = pool.find(a => Store.normalizeDoi(a.doi) === wantedDoi);
    if (fromIndex) return fromIndex;
    const entry = state.records['doi:' + wantedDoi];
    if (entry?.metadata) return entry.metadata;
  }
  return null;
}
function progressRecord() {
  if (!article) return null;
  const current = Store.read().records[Store.key(article)];
  return current?.deepRead && typeof current.deepRead === 'object' ? current.deepRead : null;
}
function updateProgress() {
  $('progress-page').textContent = String(pageNumber);
  $('progress-total').textContent = pageTotal ? `/ 共 ${pageTotal} 页` : '/ 未知总页数';
  const last = progressRecord()?.updatedAt;
  $('progress-updated').textContent = last ? '最近保存：' + new Date(last).toLocaleString('zh-CN') : '尚未记录精读进度';
}
function saveNow() {
  if (!article || !changed) return;
  clearTimeout(saveTimer);
  saveTimer = null;
  try {
    const date = new Date().toISOString();
    Store.update(article, record => {
      record.deepRead = {
        ...((record.deepRead && typeof record.deepRead === 'object') ? record.deepRead : {}),
        sections: { ...notes },
        page: pageNumber,
        totalPages: pageTotal || 0,
        zoom,
        updatedAt: date
      };
    });
    changed = false;
    setSaveState('已自动保存');
    updateProgress();
  } catch (error) {
    setSaveState('保存失败');
    notice('精读笔记保存失败：' + error.message + '。请检查浏览器存储空间。');
  }
}
function dirty() {
  changed = true;
  setSaveState('正在编辑…');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveNow, 550);
}
function displaySection(sectionId, initial = false) {
  if (!sections.some(([id]) => id === sectionId)) return;
  // 离开栏目时保存草稿；节流保存继续由 dirty() 处理。
  if (!initial) notes[activeSection] = $('section-note').value;
  activeSection = sectionId;
  const info = sections.find(([id]) => id === sectionId);
  $('section-title').textContent = info[1];
  $('section-help').textContent = info[2];
  $('section-note').value = notes[sectionId] || '';
  for (const btn of $('note-tabs').querySelectorAll('button')) {
    btn.setAttribute('aria-selected', String(btn.dataset.section === sectionId));
    btn.tabIndex = btn.dataset.section === sectionId ? 0 : -1;
  }
}
function makeTabs() {
  for (const [id, label] of sections) {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = label;
    button.dataset.section = id;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', String(id === activeSection));
    button.addEventListener('click', () => displaySection(id));
    $('note-tabs').append(button);
  }
  displaySection(activeSection, true);
}
function openDatabase() {
  if (!('indexedDB' in window)) return Promise.reject(Error('当前浏览器不支持 IndexedDB。'));
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open('genome-radar-pdfs', 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('files')) db.createObjectStore('files', { keyPath: 'key' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || Error('PDF 数据库打开失败'));
  }).catch(error => { dbPromise = null; throw error; });
  return dbPromise;
}
async function pdfDB(action, file) {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('files', action === 'get' ? 'readonly' : 'readwrite');
    const store = tx.objectStore('files');
    let req;
    if (action === 'get') req = store.get(Store.key(article));
    else if (action === 'delete') req = store.delete(Store.key(article));
    else req = store.put({ key: Store.key(article), file, filename: file.name, savedAt: new Date().toISOString() });
    let result;
    req.onsuccess = () => { result = req.result; };
    req.onerror = () => reject(req.error || Error('PDF 保存失败'));
    tx.oncomplete = () => resolve(result);
    tx.onabort = () => reject(tx.error || Error('PDF 数据库事务中止'));
    tx.onerror = () => reject(tx.error || Error('PDF 数据库操作失败'));
  });
}
function setPdfFile(file) {
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  currentFile = file;
  objectUrl = URL.createObjectURL(file);
  $('pdf-label').textContent = `${file.name} · ${(file.size / 1048576).toFixed(1)} MB`;
  $('pdf-remove').disabled = false;
  $('pdf-native').disabled = false;
}
function openNative() {
  if (!objectUrl) return;
  window.open(objectUrl + '#page=' + pageNumber, '_blank', 'noopener');
}
async function startPDF(file) {
  if (pdfDoc) { try { await pdfDoc.destroy(); } catch (_) {} pdfDoc = null; }
  pdfRenderer = null;
  nativeFallback = false;
  setPdfFile(file);
  $('pdf-empty').hidden = true;
  $('pdf-canvas').hidden = true;
  $('pdf-fallback').hidden = true;
  notice('正在加载 PDF 阅读器…');
  try {
    const pdfjs = await import(PDFJS_URL);
    pdfjs.GlobalWorkerOptions.workerSrc = WORKER_URL;
    pdfDoc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    pdfRenderer = pdfjs;
    pageTotal = pdfDoc.numPages;
    pageNumber = Math.min(Math.max(1, pageNumber), pageTotal);
    $('prev-page').disabled = false;
    $('next-page').disabled = false;
    $('pdf-canvas').hidden = false;
    $('pdf-fallback').hidden = true;
    notice('');
    await renderPage();
  } catch (error) {
    nativeFallback = true;
    pdfDoc = null;
    $('pdf-canvas').hidden = true;
    $('pdf-fallback').hidden = false;
    $('pdf-fallback').src = objectUrl + '#page=' + pageNumber;
    $('prev-page').disabled = false;
    $('next-page').disabled = false;
    notice('PDF.js 阅读器暂不可用，已切换为浏览器内置 PDF 阅读。页码可在上方手动记录。');
  }
  updatePageUI();
}
async function renderPage() {
  if (!pdfDoc || !pdfRenderer) return;
  const token = ++renderToken;
  if (renderJob) { try { renderJob.cancel(); await renderJob.promise; } catch (_) {} renderJob = null; }
  try {
    const p = await pdfDoc.getPage(pageNumber);
    if (token !== renderToken) return;
    const canvas = $('pdf-canvas');
    const surface = $('pdf-surface');
    const width = Math.max(230, surface.clientWidth - 35);
    const unit = p.getViewport({ scale: 1 });
    const scale = width / unit.width * zoom;
    const viewport = p.getViewport({ scale });
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(viewport.width * pixelRatio);
    canvas.height = Math.floor(viewport.height * pixelRatio);
    canvas.style.width = `${Math.round(viewport.width)}px`;
    canvas.style.height = `${Math.round(viewport.height)}px`;
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(pixelRatio, pixelRatio);
    renderJob = p.render({ canvasContext: ctx, canvas, viewport });
    await renderJob.promise;
    if (token === renderToken) { surface.scrollTop = 0; surface.scrollLeft = 0; }
  } catch (error) {
    if (error?.name !== 'RenderingCancelledException') notice('当前 PDF 页面渲染失败：' + error.message);
  }
}
function updatePageUI() {
  $('page-number').value = String(pageNumber);
  $('page-total').textContent = pageTotal ? `/ ${pageTotal}` : '/ —';
  $('prev-page').disabled = !currentFile || pageNumber <= 1;
  $('next-page').disabled = !currentFile || (pageTotal > 0 && pageNumber >= pageTotal);
  updateProgress();
}
function setPage(next) {
  const num = Number.parseInt(next, 10);
  if (!Number.isInteger(num) || num < 1) { $('page-number').value = String(pageNumber); return; }
  pageNumber = pageTotal ? Math.min(num, pageTotal) : Math.min(num, 99999);
  updatePageUI();
  dirty();
  if (pdfDoc) renderPage();
  else if (nativeFallback && objectUrl) $('pdf-fallback').src = objectUrl + '#page=' + pageNumber;
}
async function handleFile(file) {
  if (!file) return;
  if (!(/\.pdf$/i.test(file.name) || file.type === 'application/pdf')) { notice('请选择 PDF 格式文件。'); return; }
  if (file.size > 100 * 1024 * 1024) { notice('单个 PDF 大小限制为 100MB。'); return; }
  const signature = new TextDecoder().decode(await file.slice(0, 5).arrayBuffer());
  if (signature !== '%PDF-') { notice('文件不是有效的 PDF，请选择 PDF 文件。'); return; }
  pageNumber = 1; pageTotal = 0;
  await startPDF(file);
  // PDF 在本机保存，与 JSON 的笔记/进度备份互相独立。
  try { await pdfDB('put', file); }
  catch (error) { notice('PDF 已打开，但未能持久保存到浏览器：' + error.message + '。下次需要重新选择文件。'); }
  dirty();
}
async function init() {
  if (!Store) { notice('文献库存储模块加载失败。'); return; }
  let index = { articles: [] };
  try { const res = await fetch('assets/search-index.json'); if (res.ok) index = await res.json(); }
  catch (error) { notice('文献搜索索引未能加载，正在尝试读取本地文献库。'); }
  let state;
  try { state = Store.read(); }
  catch (error) { notice('个人文献库读取失败：' + error.message); return; }
  article = resolveArticle(index, state);
  if (!article) { $('paper-title').textContent = '未找到所选文献'; notice('请从我的文献库或每期周报点击「精读」入口。'); return; }
  $('paper-title').textContent = article.title_zh || article.title_en || '未命名文献';
  $('paper-meta').textContent = [article.journal, article.issue_week || '外部导入', article.doi ? 'DOI: ' + article.doi : ''].filter(Boolean).join(' · ');
  const source = $('source-link');
  if (article.source === 'external' && article.doi) {
    source.href = 'https://doi.org/' + Store.normalizeDoi(article.doi).split('/').map(encodeURIComponent).join('/');
    source.target = '_blank'; source.rel = 'noopener noreferrer'; source.hidden = false;
  } else if (article.article_url) { source.href = article.article_url; source.hidden = false; }
  let record = progressRecord();
  if (!record || !record.startedAt || !record.status) {
    try {
      Store.update(article, entry => {
        const existing = entry.deepRead && typeof entry.deepRead === 'object' ? entry.deepRead : {};
        const now = new Date().toISOString();
        entry.deepRead = { ...existing, startedAt: existing.startedAt || existing.updatedAt || now,
          status: existing.status || 'in_progress', updatedAt: existing.updatedAt || now };
      });
      record = progressRecord();
    } catch (error) { notice('无法保存精读状态：' + error.message); }
  }
  if (record) {
    for (const [key] of sections) notes[key] = typeof record.sections?.[key] === 'string' ? record.sections[key] : '';
    pageNumber = Math.max(1, Number.parseInt(record.page, 10) || 1);
    pageTotal = Math.max(0, Number.parseInt(record.totalPages, 10) || 0);
    zoom = [0.8, 1, 1.2, 1.5].includes(record.zoom) ? record.zoom : 1;
  }
  $('zoom-select').value = String(zoom);
  makeTabs();
  setupModules({ Store, article, getPage: () => pageNumber, setPage, notify: notice });
  $('section-note').disabled = false;
  $('save-notes').disabled = false;
  $('section-note').oninput = () => { notes[activeSection] = $('section-note').value; dirty(); };
  $('save-notes').onclick = () => { changed = true; saveNow(); notice(''); };
  $('prev-page').onclick = () => setPage(pageNumber - 1);
  $('next-page').onclick = () => setPage(pageNumber + 1);
  $('page-number').onchange = () => setPage($('page-number').value);
  $('zoom-select').onchange = () => { zoom = Number($('zoom-select').value) || 1; dirty(); if (pdfDoc) renderPage(); };
  $('pdf-file').onchange = async e => { try { await handleFile(e.target.files?.[0]); } catch (error) { notice(error.message); } finally { e.target.value = ''; } };
  $('pdf-native').onclick = openNative;
  $('pdf-remove').onclick = async () => {
    if (!confirm('从当前浏览器移除本篇论文的 PDF？精读笔记和阅读进度将保留。')) return;
    try { await pdfDB('delete'); } catch (error) { notice('删除本地 PDF 失败：' + error.message); return; }
    if (pdfDoc) { try { await pdfDoc.destroy(); } catch (_) {} }
    pdfDoc = null; pdfRenderer = null; nativeFallback = false;
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    objectUrl = null; currentFile = null; pageTotal = 0;
    $('pdf-label').textContent = '仅保存在当前浏览器';
    $('pdf-remove').disabled = true; $('pdf-native').disabled = true;
    $('pdf-canvas').hidden = true; $('pdf-fallback').hidden = true; $('pdf-fallback').src = 'about:blank'; $('pdf-empty').hidden = false;
    updatePageUI(); dirty();
  };
  updatePageUI();
  try {
    const stored = await pdfDB('get');
    if (stored?.file) await startPDF(stored.file);
  } catch (error) { notice('无法读取已保存的 PDF：' + error.message + '。可重新选择本地文件。'); }
  window.addEventListener('pagehide', saveNow);
  window.addEventListener('beforeunload', saveNow);
  window.addEventListener('resize', () => { if (pdfDoc) renderPage(); });
  window.addEventListener('storage', e => {
    if (e.key !== Store.KEY || changed) return;
    // 同一浏览器多窗口编辑时，提醒用户刷新后获取另一窗口修改。
    setSaveState('另一窗口已修改文献库，建议刷新');
  });
}
init().catch(error => notice('精读工作台初始化失败：' + error.message));
