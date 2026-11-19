/* Personal API credentials are independent of the library backup and site publisher. */
(()=>{'use strict';
const KEY='gr_personal_deepseek_key_v1',SESSION='gr_personal_deepseek_session_v1';
const getKey=()=>sessionStorage.getItem(SESSION)||localStorage.getItem(KEY)||'';
function open(){
 const dialog=document.createElement('dialog'); dialog.className='ai-settings';
 dialog.innerHTML=`<form method="dialog"><h2>个人 AI 设置</h2><p>服务商：DeepSeek · 模型：deepseek-flash</p><label>个人 API Key <input id="ai-key" type="password" autocomplete="off" spellcheck="false"></label><div><button type="button" id="ai-show">显示密钥</button> <button type="button" id="ai-clear">清除密钥</button></div><label><input type="checkbox" id="ai-persist"> 在本设备保存密钥</label><p>默认仅在本标签页会话使用。费用由您自己的 DeepSeek 账号承担。</p><p>测试连接会发送少量 token，可能产生少量费用。PDF 按页解析，模型按输入和输出 token 计费；价格与时段可能变化。<a href="https://api-docs.deepseek.com/zh-cn/quick_start/pricing/" target="_blank" rel="noopener noreferrer">查看官方最新价格</a></p><p id="ai-status" role="status" aria-live="polite"></p><div><button type="button" id="ai-test">测试连接</button> <button type="button" id="ai-save">保存设置</button> <button value="close">关闭</button></div></form>`;
 document.body.append(dialog);const $=id=>dialog.querySelector('#'+id),input=$('ai-key'),status=$('ai-status');input.value=getKey();$('ai-persist').checked=Boolean(localStorage.getItem(KEY));
 $('ai-show').onclick=()=>{input.type=input.type==='password'?'text':'password';$('ai-show').textContent=input.type==='password'?'显示密钥':'隐藏密钥'};
 $('ai-clear').onclick=()=>{sessionStorage.removeItem(SESSION);localStorage.removeItem(KEY);input.value='';$('ai-persist').checked=false;status.textContent='密钥已清除。'};
 $('ai-save').onclick=()=>{let key=input.value.trim();if(!key){status.textContent='请输入 API Key。';return}sessionStorage.setItem(SESSION,key);if($('ai-persist').checked)localStorage.setItem(KEY,key);else localStorage.removeItem(KEY);status.textContent='设置已保存。'};
 $('ai-test').onclick=async()=>{const key=input.value.trim();if(!key){status.textContent='请输入 API Key。';return}const btn=$('ai-test');btn.disabled=true;status.textContent='正在测试连接…';try{let response=await fetch('https://api.deepseek.com/chat/completions',{method:'POST',headers:{'Authorization':'Bearer '+key,'Content-Type':'application/json'},body:JSON.stringify({model:'deepseek-flash',messages:[{role:'user',content:'回复 OK'}],max_tokens:4,stream:false})});if(!response.ok){status.textContent=({401:'密钥无效或已过期（HTTP 401）。',402:'账户余额不足（HTTP 402）。',429:'请求过于频繁（HTTP 429）。'})[response.status]||`连接失败（HTTP ${response.status}），请检查模型权限或服务状态。`;return}let data=await response.json();status.textContent=data.choices?.length?'连接成功。':'服务返回的数据不完整。'}catch(e){status.textContent='连接失败：请检查网络、浏览器跨域限制或 DeepSeek 服务状态。'}finally{btn.disabled=false}};
 dialog.addEventListener('close',()=>{input.value='';dialog.remove()});dialog.showModal();
}
window.GenomeAISettings={open,getKey};document.addEventListener('click',e=>{if(e.target.closest('[data-ai-settings]'))open()});
})();
