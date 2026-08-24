from pathlib import Path
import re

p=Path('index.html')
s=p.read_text(encoding='utf-8')

old='<div class="card wide"><div class="title">السجل</div><div id="shortList"></div></div>'
new='<div class="card wide"><div class="title">السجل</div><div id="shortFilters" class="actions" style="justify-content:flex-start;flex-wrap:wrap"></div><div id="shortList"></div></div>'
assert old in s, 'shortages record card not found'
s=s.replace(old,new,1)

old='let app={},activePlan=null,shortagesData=[],rosterLoaded=null;'
new='let app={},activePlan=null,shortagesData=[],shortageSectionFilter="",rosterLoaded=null;'
assert old in s, 'global state declaration not found'
s=s.replace(old,new,1)

old="async function openShortages(){show('shortages');$('shortSection').innerHTML='<option value=\"\">اختر</option>'+app.sections.filter(s=>s.display_order<=10).map(s=>`<option value=\"${s.id}\">${esc(s.name)}</option>`).join('');$('shortReporter').innerHTML=empOptions();$('shortInput').innerHTML='';addShortRow();shortagesData=await api('shortages');renderShortages()}"
new="async function openShortages(){show('shortages');shortageSectionFilter='';$('shortSection').innerHTML='<option value=\"\">اختر</option>'+app.sections.filter(s=>s.display_order<=10).map(s=>`<option value=\"${s.id}\">${esc(s.name)}</option>`).join('');$('shortReporter').innerHTML=empOptions();$('shortInput').innerHTML='';addShortRow();shortagesData=await api('shortages');renderShortages()}"
assert old in s, 'openShortages function not found'
s=s.replace(old,new,1)

pattern=r"function renderShortages\(\)\{\$\('shortList'\)\.innerHTML='<div class=\"scroll\"><table><thead><tr><th>القسم</th><th>المقاس</th><th>الموجود</th><th>المطلوب</th><th>الفرص</th><th>أول رصد</th><th>الحالة</th><th></th></tr></thead><tbody>'\+shortagesData\.map\(s=>`<tr><td>\$\{esc\(s\.sections\?\.name\)\}</td><td>\$\{esc\(s\.size\)\}</td><td>\$\{s\.current_qty\}</td><td>\$\{s\.requested_qty\}</td><td>\$\{s\.lost_opportunities\}</td><td>\$\{s\.first_detected_date\}</td><td>\$\{s\.shortage_status\}</td><td>\$\{s\.shortage_status==='مفتوح'\?`<button class=\"mini\" onclick=\"closeShortage\('\$\{s\.id\}'\)\">إغلاق</button>`:''\}</td></tr>`\)\.join\(''\)\+'</tbody></table></div>'\}"
replacement="function setShortageFilter(id){shortageSectionFilter=id;renderShortages()}function renderShortages(){let secs=app.sections.filter(s=>s.display_order<=10),rows=shortageSectionFilter?shortagesData.filter(x=>x.section_id===shortageSectionFilter):shortagesData;$('shortFilters').innerHTML=`<button class=\"mini\" style=\"${!shortageSectionFilter?'background:#17365d;color:#fff;':''}\" onclick=\"setShortageFilter('')\">الكل</button>`+secs.map(s=>`<button class=\"mini\" style=\"${shortageSectionFilter===s.id?'background:#17365d;color:#fff;':''}\" onclick=\"setShortageFilter('${s.id}')\">${esc(s.name)}</button>`).join('');$('shortList').innerHTML='<div class=\"scroll\"><table><thead><tr><th>القسم</th><th>المقاس</th><th>الموجود</th><th>المطلوب</th><th>الفرص</th><th>أول رصد</th><th>الحالة</th><th></th></tr></thead><tbody>'+rows.map(s=>`<tr><td>${esc(s.sections?.name)}</td><td>${esc(s.size)}</td><td>${s.current_qty}</td><td>${s.requested_qty}</td><td>${s.lost_opportunities}</td><td>${s.first_detected_date}</td><td>${s.shortage_status}</td><td>${s.shortage_status==='مفتوح'?`<button class=\"mini\" onclick=\"closeShortage('${s.id}')\">إغلاق</button>`:''}</td></tr>`).join('')+'</tbody></table></div>'}"
s,n=re.subn(pattern,replacement,s,count=1)
assert n==1, 'renderShortages function not found'

p.write_text(s,encoding='utf-8')
