from pathlib import Path
import re

p=Path('index.html')
s=p.read_text(encoding='utf-8')

pattern=r"function renderShortages\(\)\{.*?\}async function closeShortage\(id\)\{.*?\}"
replacement=r'''function renderShortages(){let secs=app.sections.filter(s=>s.display_order<=10),rows=shortageSectionFilter?shortagesData.filter(x=>x.section_id===shortageSectionFilter):shortagesData;$('shortFilters').innerHTML=`<button class="mini" style="${!shortageSectionFilter?'background:#17365d;color:#fff;':''}" onclick="setShortageFilter('')">الكل</button>`+secs.map(s=>`<button class="mini" style="${shortageSectionFilter===s.id?'background:#17365d;color:#fff;':''}" onclick="setShortageFilter('${s.id}')">${esc(s.name)}</button>`).join('');$('shortList').innerHTML='<div class="scroll"><table><thead><tr><th>القسم</th><th>المقاس</th><th>الموجود</th><th>المطلوب</th><th>الفرص</th><th>أول رصد</th><th>تاريخ الطلب</th><th>الحالة</th><th></th></tr></thead><tbody>'+rows.map(s=>`<tr><td>${esc(s.sections?.name)}</td><td>${esc(s.size)}</td><td>${s.current_qty}</td><td>${s.requested_qty}</td><td>${s.lost_opportunities}</td><td>${s.first_detected_date}</td><td>${s.ordered_date||'—'}</td><td>${s.shortage_status}</td><td>${s.shortage_status==='مفتوح'?`<button class="mini" style="color:#17365d;border-color:#9db0c5;font-weight:700" onclick="orderShortage('${s.id}')">تم الطلب</button>`:s.shortage_status==='تم الطلب'?'<span class="chip">تم تحويله للمتابعة</span>':''}</td></tr>`).join('')+'</tbody></table></div>'}async function orderShortage(id){try{let x=shortagesData.find(s=>s.id===id);if(!x)throw Error('سجل النقص غير موجود');if(x.shortage_status!=='مفتوح')throw Error('تم التعامل مع هذا النقص مسبقًا');if(!confirm('تأكيد أن طلب التغذية تم إرساله؟ سيتم حفظه في سجل النواقص وتحويله إلى الإجراءات والمتابعة.'))return;await api('shortage-close',{method:'POST',body:{id}});shortagesData=await api('shortages');await refresh();show('shortages');renderShortages();alert('تم تسجيل الطلب وتحويله إلى الإجراءات والمتابعة')}catch(e){alert(e.message)}}'''

s,n=re.subn(pattern,replacement,s,count=1,flags=re.S)
assert n==1,'shortage render/close block not found'
p.write_text(s,encoding='utf-8')
