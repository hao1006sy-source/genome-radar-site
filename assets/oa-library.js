import {findOA,renderOA} from './oa-finder.js';
document.getElementById('doi-oa').onclick=async()=>{const host=document.getElementById('doi-oa-results');host.textContent='正在查询开放获取版本……';try{renderOA(host,await findOA(document.getElementById('doi-input').value))}catch(e){host.textContent='查询失败：'+e.message}};
