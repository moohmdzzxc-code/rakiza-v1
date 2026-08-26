from pathlib import Path
import re
p=Path('index.html')
s=p.read_text(encoding='utf-8')
s=re.sub(r'<!-- pages-publish:[^>]+-->', '<!-- pages-publish: shortage-excel-export-flow-2026-08-26 -->', s, count=1)
old='<div class="card wide"><div class="title">السجل</div><div id="shortFilters" class="actions" style="justify-content:flex-start;flex-wrap:wrap"></div><div id="shortList"></div></div>'
new='<div class="card wide"><div class="title">السجل</div><div class="actions" style="justify-content:flex-start;align-items:center;flex-wrap:wrap;margin-bottom:10px"><button id="shortExportBtn" class="btn gold" onclick="exportShortagesExcel()">تصدير Excel للنواقص المفتوحة</button><span id="shortExportState" class="mut"></span></div><div id="shortFilters" class="actions" style="justify-content:flex-start;flex-wrap:wrap"></div><div id="shortList"></div></div>'
assert old in s,'shortage register card not found'
s=s.replace(old,new,1)

new_render=r'''function renderShortages(){let secs=app.sections.filter(s=>['الفاخر','الأعمال','الكلاسيك','الأشمغة','الداخليات','الحركات','الزخرفات','ري ثوب','الصيفي','الشتوي','العقال والطاقية','الجلابيات والبيجامات','الإكسسوارات والجوارب'].includes(s.name)),rows=shortageSectionFilter?shortagesData.filter(x=>x.section_id===shortageSectionFilter):shortagesData,openAll=shortagesData.filter(x=>x.shortage_status==='مفتوح'),needExport=openAll.filter(x=>!x.excel_exported_at).length;$('shortFilters').innerHTML=`<button class="mini" style="${!shortageSectionFilter?'background:#17365d;color:#fff;':''}" onclick="setShortageFilter('')">الكل</button>`+secs.map(s=>`<button class="mini" style="${shortageSectionFilter===s.id?'background:#17365d;color:#fff;':''}" onclick="setShortageFilter('${s.id}')">${esc(s.name)}</button>`).join('');if($('shortExportBtn'))$('shortExportBtn').disabled=!openAll.length;if($('shortExportState'))$('shortExportState').textContent=!openAll.length?'لا توجد نواقص مفتوحة للتصدير':needExport?`${needExport} نقص يحتاج تصدير قبل الطلب`:`تم تصدير جميع النواقص المفتوحة — يمكن تسجيل تم الطلب`;$('shortList').innerHTML='<div class="scroll"><table><thead><tr><th>القسم</th><th>المقاس</th><th>الموجود</th><th>المطلوب</th><th>الفرص</th><th>أول رصد</th><th>تاريخ الطلب</th><th>تاريخ التغذية</th><th>الحالة</th><th>الإجراء</th></tr></thead><tbody>'+rows.map(s=>`<tr><td>${esc(s.sections?.name)}</td><td>${esc(s.size)}</td><td>${s.current_qty}</td><td>${s.requested_qty}</td><td>${s.lost_opportunities}</td><td>${s.first_detected_date}</td><td>${s.ordered_date||'—'}</td><td>${s.supplied_date||'—'}</td><td>${s.shortage_status}</td><td>${s.shortage_status==='مفتوح'?(s.excel_exported_at?`<button class="mini" style="color:#17365d;border-color:#9db0c5;font-weight:700" onclick="orderShortage('${s.id}')">تم الطلب</button>`:'<span class="chip">صدّر Excel أولًا</span>'):s.shortage_status==='تم الطلب'?'<span class="chip">تم تحويله للمتابعة</span>':s.shortage_status==='تمت التغذية'?'<span class="chip">تمت التغذية</span>':''}</td></tr>`).join('')+'</tbody></table></div>'}async function orderShortage'''
s,n=re.subn(r'function renderShortages\(\)\{.*?\}async function orderShortage',new_render,s,count=1,flags=re.S)
assert n==1,'renderShortages replacement failed'

new_order=r'''async function orderShortage(id){try{let x=shortagesData.find(s=>s.id===id);if(!x)throw Error('سجل النقص غير موجود');if(x.shortage_status!=='مفتوح')throw Error('تم التعامل مع هذا النقص مسبقًا');if(!x.excel_exported_at)throw Error('يجب تصدير ملف Excel الذي يحتوي هذا النقص أولًا');if(!confirm('تأكيد أن طلب التغذية تم إرساله؟ سيتم حفظه في سجل النواقص وتحويله إلى الإجراءات والمتابعة.'))return;await api('shortage-close',{method:'POST',body:{id}});shortagesData=await api('shortages');await refresh();show('shortages');renderShortages();alert('تم تسجيل الطلب وتحويله إلى الإجراءات والمتابعة')}catch(e){alert(e.message)}}function actionDisplayStatus'''
s,n=re.subn(r'async function orderShortage\(id\)\{.*?\}function actionDisplayStatus',new_order,s,count=1,flags=re.S)
assert n==1,'orderShortage replacement failed'

needle='</script></body></html>'
assert needle in s,'script ending not found'
s=s.replace(needle,'</script><script src="shortage-export.js?v=20260826"></script></body></html>',1)
p.write_text(s,encoding='utf-8')
