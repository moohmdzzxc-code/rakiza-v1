from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')

old="async function saveShortages(){try{let rows=[...$('shortInput').querySelectorAll('tr')].filter(r=>r.querySelector('.sz').value.trim()).map(r=>({size:r.querySelector('.sz').value,current_qty:r.querySelector('.cq').value,requested_qty:r.querySelector('.rq').value,lost_opportunities:r.querySelector('.lo').value}));if(!$('shortSection').value)throw Error('حدد القسم');await api('shortage-save',{method:'POST',body:{section_id:$('shortSection').value,reporter_employee_id:$('shortReporter').value,rows}});shortagesData=await api('shortages');renderShortages();alert('تم حفظ النواقص')}catch(e){alert(e.message)}}"

new="async function saveShortages(){try{let rows=[...$('shortInput').querySelectorAll('tr')].filter(r=>r.querySelector('.sz').value.trim()).map(r=>({size:r.querySelector('.sz').value,current_qty:r.querySelector('.cq').value,requested_qty:r.querySelector('.rq').value,lost_opportunities:r.querySelector('.lo').value}));let section=$('shortSection').value;if(!section)throw Error('حدد القسم');for(const row of rows){let key=String(row.size||'').trim().toLowerCase(),dup=shortagesData.find(q=>{if(q.section_id!==section||String(q.size||'').trim().toLowerCase()!==key||q.shortage_status!=='تم الطلب')return false;let a=q.action_id?app.actions.find(z=>z.id===q.action_id):null;return !a||a.action_status!=='مغلق'});if(dup)throw Error(`هذا المقاس له طلب تغذية قائم بالفعل.\\nالحالة: تم الطلب — قيد المتابعة\\nتاريخ الطلب: ${dup.ordered_date||'—'}`)}await api('shortage-save',{method:'POST',body:{section_id:section,reporter_employee_id:$('shortReporter').value,rows}});shortagesData=await api('shortages');renderShortages();alert('تم حفظ النواقص')}catch(e){alert(e.message)}}"

assert old in s, 'saveShortages function not found'
s=s.replace(old,new,1)

marker='<!-- pages-publish: prevent-duplicate-shortage-orders-2026-08-24 -->'
import re
s=re.sub(r'<!-- pages-publish: [^>]+ -->',marker,s,count=1)
if marker not in s:
    s=s.replace('<title>ركيزة V1</title>','<title>ركيزة V1</title>'+marker,1)

p.write_text(s,encoding='utf-8')
