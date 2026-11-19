import { setupModules } from './deep-modules.js';
import { setupAI } from './deep-ai.js';
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
let readingMode = 'continuous', zoomChoice = 'fit', observer = null, slots = [], jobs = new Map(), generation = 0, restoring = false;
function clearPages() {
  generation++; observer?.disconnect(); observer = null;
  for (const job of jobs.values()) { try { job.cancel(); } catch (_) {} }
  jobs.clear(); slots = []; $('pdf-pages').replaceChildren();
}
async function makePages() {
  if (!pdfDoc || readingMode !== 'continuous') return;
  clearPages(); restoring = true; const version = generation, surface = $('pdf-surface');
  const first = await pdfDoc.getPage(1); if (version !== generation) return;
  const unit = first.getViewport({ scale: 1 });
  const width = Math.max(230, surface.clientWidth - 35);
  const scale = zoomChoice === 'actual' ? 1 : width / unit.width * zoom;
  const viewport = first.getViewport({scale});
  for (let i=1; i<=pdfDoc.numPages; i++) {
    const slot=document.createElement('div'); slot.className='pdf-page'; slot.dataset.page=String(i);
    slot.style.width=viewport.width+'px'; slot.style.height=viewport.height+'px';
    slot.setAttribute('aria-label','PDF 第 '+i+' 页'); $('pdf-pages').append(slot); slots.push(slot);
  }
  observer=new IntersectionObserver(entries=>{for(const entry of entries) {
    const slot=entry.target, n=Number(slot.dataset.page);
    if(entry.isIntersecting) drawSlot(slot,n,scale,version);
    else if(Math.abs(n-pageNumber)>3){const job=jobs.get(n);if(job)job.cancel();jobs.delete(n);slot.replaceChildren()}
  }},{root:surface,rootMargin:'1200px 0px'});
  slots.forEach(slot=>observer.observe(slot));
  const target = slots[pageNumber-1];
  if (target) surface.scrollTop += target.getBoundingClientRect().top - surface.getBoundingClientRect().top - 15;
  requestAnimationFrame(() => { if (version === generation) restoring = false; });
}
async function drawSlot(slot,n,scale,version){
  if(slot.firstChild||jobs.has(n)||!pdfDoc)return;
  try { const page=await pdfDoc.getPage(n);if(version!==generation||slot.firstChild)return;
    const viewport=page.getViewport({scale}), ratio=Math.min(devicePixelRatio||1,2), canvas=document.createElement('canvas');
    slot.style.width=viewport.width+'px';slot.style.height=viewport.height+'px';
    canvas.width=Math.ceil(viewport.width*ratio);canvas.height=Math.ceil(viewport.height*ratio);
    canvas.style.width=viewport.width+'px';canvas.style.height=viewport.height+'px';slot.append(canvas);
    const ctx=canvas.getContext('2d',{alpha:false});ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);
    const task=page.render({canvasContext:ctx,canvas,viewport,transform:[ratio,0,0,ratio,0,0],background:'#fff'});
    jobs.set(n,task);await task.promise;if(jobs.get(n)===task)jobs.delete(n);
  } catch(e){jobs.delete(n);if(e.name!=='RenderingCancelledException')notice('PDF 页面渲染失败：'+e.message)}
}


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
  const aiAdvice = $('ai-advice');
  if (aiAdvice) {
    const value = progressRecord()?.aiInspiration || '';
    aiAdvice.hidden = sectionId !== 'inspiration' || !value;
    aiAdvice.textContent = value;
  }
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
  clearPages();
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
    $('pdf-canvas').hidden = readingMode === 'continuous';
    $('pdf-fallback').hidden = true;
    notice('');
    if (readingMode === 'continuous') await makePages(); else await renderPage();
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
    const scale = zoomChoice === 'actual' ? 1 : width / unit.width * zoom;
    const viewport = p.getViewport({ scale });
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(viewport.width * pixelRatio);
    canvas.height = Math.floor(viewport.height * pixelRatio);
    canvas.style.width = `${Math.round(viewport.width)}px`;
    canvas.style.height = `${Math.round(viewport.height)}px`;
    const ctx = canvas.getContext('2d', { alpha: false });
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    renderJob = p.render({ canvasContext: ctx, canvas, viewport, transform: [pixelRatio,0,0,pixelRatio,0,0], background: '#fff' });
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
  if (pdfDoc && readingMode === 'continuous') slots[pageNumber-1]?.scrollIntoView({behavior:'smooth',block:'start'});
  else if (pdfDoc) renderPage();
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
  $('zoom-select').value = 'fit';
  makeTabs();
  setupModules({ Store, article, getPage: () => pageNumber, setPage, notify: notice });
  setupAI({Store, article, getFile: () => currentFile, saveNotes: saveNow});
  $('section-note').disabled = false;
  $('save-notes').disabled = false;
  $('section-note').oninput = () => { notes[activeSection] = $('section-note').value; dirty(); };
  $('save-notes').onclick = () => { changed = true; saveNow(); notice(''); };
  const preview=$('markdown-preview'), editor=$('markdown-editor'), textarea=$('section-note');
  function refreshPreview(){if(window.marked&&window.DOMPurify){preview.innerHTML=DOMPurify.sanitize(marked.parse(textarea.value),{USE_PROFILES:{html:true}});for(const a of preview.querySelectorAll('a')){a.target='_blank';a.rel='noopener noreferrer'}if(window.renderMathInElement)window.renderMathInElement(preview,{delimiters:[{left:'$$',right:'$$',display:true},{left:'$',right:'$',display:false}],throwOnError:false,trust:false})}else preview.textContent=textarea.value}
  textarea.addEventListener('input',refreshPreview);
  for(const button of document.querySelectorAll('[data-view]'))button.addEventListener('click',()=>{const view=button.dataset.view;for(const b of document.querySelectorAll('[data-view]'))b.setAttribute('aria-pressed',String(b===button));textarea.hidden=view==='preview';preview.hidden=view==='edit';editor.classList.toggle('split',view==='split');refreshPreview()});
  for(const button of document.querySelectorAll('[data-md]'))button.addEventListener('click',()=>{const wrappers={heading:['# ',''],bold:['**','**'],italic:['*','*'],list:['- ',''],quote:['> ',''],link:['[','](https://)'],code:['```\n','\n```'],table:['| 列 1 | 列 2 |\n| --- | --- |\n| ',' |'],math:['$','$']},pair=wrappers[button.dataset.md],start=textarea.selectionStart,end=textarea.selectionEnd,selected=textarea.value.slice(start,end);textarea.setRangeText(pair[0]+selected+pair[1],start,end,'select');textarea.dispatchEvent(new Event('input',{bubbles:true}));textarea.focus()});
  for(const tab of $('note-tabs').querySelectorAll('button'))tab.addEventListener('click',refreshPreview);

  $('prev-page').onclick = () => setPage(pageNumber - 1);
  $('next-page').onclick = () => setPage(pageNumber + 1);
  $('page-number').onchange = () => setPage($('page-number').value);
  $('zoom-select').onchange = () => { zoomChoice=$('zoom-select').value; zoom=Number(zoomChoice)||1; dirty(); if(pdfDoc){if(readingMode==='continuous')makePages();else renderPage()} };
  $('reading-mode').onchange = () => {readingMode=$('reading-mode').value;clearPages();$('pdf-canvas').hidden=readingMode==='continuous';if(pdfDoc){if(readingMode==='continuous')makePages();else renderPage()}};
  $('pdf-surface').addEventListener('scroll',()=>{if(restoring||readingMode!=='continuous'||!slots.length)return;let top=$('pdf-surface').getBoundingClientRect().top;let closest=slots.reduce((a,b)=>Math.abs(b.getBoundingClientRect().top-top)<Math.abs(a.getBoundingClientRect().top-top)?b:a);let n=Number(closest.dataset.page);if(n!==pageNumber){pageNumber=n;updatePageUI();dirty()}});
  const surface=$('pdf-surface'); for(const name of ['dragenter','dragover'])surface.addEventListener(name,e=>{e.preventDefault();surface.classList.add('drag-over')});for(const name of ['dragleave','drop'])surface.addEventListener(name,e=>{e.preventDefault();surface.classList.remove('drag-over')});surface.addEventListener('drop',e=>handleFile(e.dataTransfer.files?.[0]).catch(err=>notice(err.message)));

  $('pdf-file').onchange = async e => { try { await handleFile(e.target.files?.[0]); } catch (error) { notice(error.message); } finally { e.target.value = ''; } };
  $('pdf-native').onclick = openNative;
  $('pdf-remove').onclick = async () => {
    if (!confirm('从当前浏览器移除本篇论文的 PDF？精读笔记和阅读进度将保留。')) return;
    try { await pdfDB('delete'); } catch (error) { notice('删除本地 PDF 失败：' + error.message); return; }
    if (pdfDoc) { try { await pdfDoc.destroy(); } catch (_) {} }
    clearPages();
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
  let resizeTimer; window.addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer=setTimeout(()=>{if(pdfDoc){if(readingMode==='continuous')makePages();else renderPage()}},200); });
  window.addEventListener('storage', e => {
    if (e.key !== Store.KEY || changed) return;
    // 同一浏览器多窗口编辑时，提醒用户刷新后获取另一窗口修改。
    setSaveState('另一窗口已修改文献库，建议刷新');
  });
}
init().catch(error => notice('精读工作台初始化失败：' + error.message));
