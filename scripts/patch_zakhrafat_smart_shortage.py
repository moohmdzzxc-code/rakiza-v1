from pathlib import Path
import re

p=Path('index.html')
s=p.read_text(encoding='utf-8')
if 'id="shortZakhrafatBox"' in s:
    raise SystemExit(0)

# 1) Add Zakhrafat smart UI after Classic.
needle='<button class="btn gold" onclick="saveClassicShortages()">حفظ نواقص الكلاسيك</button></div></div></div><div class="card wide"><div class="title">السجل</div>'
zakh_box='''<button class="btn gold" onclick="saveClassicShortages()">حفظ نواقص الكلاسيك</button></div></div><div id="shortZakhrafatBox" class="hidden"><div class="notice ok"><b>البحث الذكي — الزخرفات</b><div style="margin-top:5px">مرتبط بورقة Excel: Zakhrafat. ابحث بالمقاس أو رقم الموديل أو الفئة.</div></div><div class="field"><label>ابحث عن المقاس / رقم الموديل / الفئة</label><input id="zakhrafatSearch" oninput="renderZakhrafatResults()" placeholder="مثال: 54M أو 2671 أو Youth"></div><div id="zakhrafatResults" style="margin-top:10px"></div><div id="zakhrafatSelected" class="task hidden"><b id="zakhrafatChosenLabel">—</b><div class="mut" id="zakhrafatChosenMeta" style="margin-top:5px">زخرفات</div><div class="fields" style="margin-top:10px"><div class="field"><label>الموجود حاليًا</label><input id="zakhrafatCurrent" inputmode="numeric" value="0"></div><div class="field"><label>المطلوب للتغذية</label><input id="zakhrafatRequested" inputmode="numeric" value="0"></div><div class="field"><label>الفرص الضائعة</label><input id="zakhrafatLost" inputmode="numeric" value="0"></div></div><div class="actions" style="justify-content:flex-start"><button class="btn" onclick="addZakhrafatDraft()">إضافة للنواقص</button></div></div><div class="title" style="margin-top:18px">طلب الزخرفات الحالي</div><div id="zakhrafatDraftList"><p class="mut">لم تتم إضافة أصناف بعد.</p></div><div class="actions"><span></span><button class="btn gold" onclick="saveZakhrafatShortages()">حفظ نواقص الزخرفات</button></div></div></div><div class="card wide"><div class="title">السجل</div>'''
assert needle in s, 'Classic box ending not found'
s=s.replace(needle,zakh_box,1)

# 2) State.
old_state='classicSelectedItem=null,classicDraft=[];'
new_state='classicSelectedItem=null,classicDraft=[],zakhrafatSelectedItem=null,zakhrafatDraft=[];'
assert old_state in s, 'Classic state marker not found'
s=s.replace(old_state,new_state,1)

# 3) Zakhrafat catalog exactly from the uploaded Zakhrafat sheet.
marker='CLASSIC_CATALOG.forEach((x,i)=>x.i=i);'
zakh_catalog="""CLASSIC_CATALOG.forEach((x,i)=>x.i=i);const ZAKHRAFAT_GROUPS={Child:['23M','23S','24M','24S','25M','26M','26S','28M','28S','30M','30S'],Boys:['31S','32M','32S','33M','33S','34M','34S','35M','35S','36M','36S','37M','37S','38M','38S','39M','39S','40M','40S'],Youth:['41M','41S','42M','42S','43M','43S','44L','44M','44S','45L','45M','45S','46L','46M','46S','47L','47M','47S','47XL','48L','48M','48S','48XL','49L','49M','49S','49XL','50L','50M','50S','50XL','51L','51M','51S','51XL','52L','52M','52S','52XL'],Men:['53L','53M','53S','53XL','53XXL','53XXXL','54L','54M','54S','54XL','54XXL','55L','55M','55S','55XL','55XXL','56L','56M','56S','56XL','56XXL','57L','57M','57S','57XL','57XXL','58L','58M','58S','58XL','58XXL','58XXXL','59L','59M','59S','59XL','59XXL','59XXXL','60L','60M','60S','60XL','60XXL','60XXXL','60XXXXL','61L','61M','61XL','61XXL','61XXXXL','62L','62M','62XL','62XXL','62XXXL','64L','64XL','64XXL','64XXXL','64XXXXL']};const ZAKHRAFAT_AR={Child:'أطفال',Boys:'أولاد',Youth:'شباب',Men:'رجالي'};const ZAKHRAFAT_STYLES=['2671','2664','2660'];const ZAKHRAFAT_CATALOG=Object.entries(ZAKHRAFAT_GROUPS).flatMap(([generation,sizes])=>sizes.flatMap(size=>ZAKHRAFAT_STYLES.map(style=>({generation,size,style,label:`${size} — موديل ${style}`,search:`${size} ${style} موديل ${generation} ${ZAKHRAFAT_AR[generation]} زخرفات zakhrafat`}))));ZAKHRAFAT_CATALOG.forEach((x,i)=>x.i=i);"""
assert marker in s, 'Classic catalog marker not found'
s=s.replace(marker,zakh_catalog,1)

# 4) Reset state and expose separate shortage entries. Keep old combined section out of new registration.
old_reset="classicSelectedItem=null;classicDraft=[];$('shortSection')"
new_reset="classicSelectedItem=null;classicDraft=[];zakhrafatSelectedItem=null;zakhrafatDraft=[];$('shortSection')"
assert old_reset in s, 'Classic reset marker not found'
s=s.replace(old_reset,new_reset,1)
old_options="app.sections.filter(s=>s.display_order<=10||s.name==='الحركات')"
new_options="app.sections.filter(s=>(s.display_order<=10&&s.name!=='الزخرفات والري ثوب')||['الحركات','الزخرفات','ري ثوب'].includes(s.name))"
assert old_options in s, 'Shortage section options marker not found'
s=s.replace(old_options,new_options,1)

# 5) Route Zakhrafat to its own smart search.
pat=r"function shortSectionChanged\(\)\{.*?\}function renderFakherResults"
new_route=r'''function shortSectionChanged(){let sec=app.sections.find(s=>s.id===$('shortSection').value),isFakher=sec?.name==='الفاخر',isBusiness=sec?.name==='الأعمال',isSchool=sec?.name==='الحركات',isClassic=sec?.name==='الكلاسيك',isZakhrafat=sec?.name==='الزخرفات',isSmart=isFakher||isBusiness||isSchool||isClassic||isZakhrafat;$('shortLegacyBox').classList.toggle('hidden',isSmart);$('shortFakherBox').classList.toggle('hidden',!isFakher);$('shortBusinessBox').classList.toggle('hidden',!isBusiness);$('shortSchoolBox').classList.toggle('hidden',!isSchool);$('shortClassicBox').classList.toggle('hidden',!isClassic);$('shortZakhrafatBox').classList.toggle('hidden',!isZakhrafat);if(isFakher){fakherSelectedItem=null;$('fakherSelected').classList.add('hidden');$('fakherSearch').value='';$('fakherResults').innerHTML='<p class="mut">ابدأ بالكتابة للبحث في مقاسات وألوان الفاخر.</p>';renderFakherDraft()}if(isBusiness){businessSelectedItem=null;$('businessSelected').classList.add('hidden');$('businessSearch').value='';$('businessResults').innerHTML='<p class="mut">ابدأ بالكتابة للبحث في مقاسات وألوان الأعمال.</p>';renderBusinessDraft()}if(isSchool){schoolSelectedItem=null;$('schoolSelected').classList.add('hidden');$('schoolSearch').value='';$('schoolResults').innerHTML='<p class="mut">ابدأ بالكتابة للبحث في مقاسات وفئات الحركات.</p>';renderSchoolDraft()}if(isClassic){classicSelectedItem=null;$('classicSelected').classList.add('hidden');$('classicSearch').value='';$('classicResults').innerHTML='<p class="mut">ابدأ بالكتابة للبحث في مقاس أو نوع أو لون الكلاسيك.</p>';renderClassicDraft()}if(isZakhrafat){zakhrafatSelectedItem=null;$('zakhrafatSelected').classList.add('hidden');$('zakhrafatSearch').value='';$('zakhrafatResults').innerHTML='<p class="mut">ابدأ بالكتابة للبحث في مقاس أو رقم موديل أو فئة الزخرفات.</p>';renderZakhrafatDraft()}}function renderFakherResults'''
s,n=re.subn(pat,new_route,s,count=1,flags=re.S)
assert n==1, 'shortSectionChanged block not found'

# 6) Smart search/draft functions.
funcs=r'''function renderZakhrafatResults(){let q=$('zakhrafatSearch').value.trim().toLowerCase();if(!q){$('zakhrafatResults').innerHTML='<p class="mut">ابدأ بالكتابة للبحث في مقاس أو رقم موديل أو فئة الزخرفات.</p>';return}let terms=q.split(/\s+/).filter(Boolean),rows=ZAKHRAFAT_CATALOG.filter(x=>{let h=x.search.toLowerCase();return terms.every(t=>h.includes(t))}).slice(0,24);$('zakhrafatResults').innerHTML=rows.length?'<div class="actions" style="justify-content:flex-start;flex-wrap:wrap">'+rows.map(x=>`<button class="mini" onclick="selectZakhrafatItem(${x.i})">${esc(x.label)}</button>`).join('')+'</div>':'<div class="notice">لا توجد نتيجة مطابقة في نموذج الزخرفات.</div>'}function selectZakhrafatItem(i){let x=ZAKHRAFAT_CATALOG[i];if(!x)return;let section=$('shortSection').value,key=x.label.trim().toLowerCase(),dup=shortagesData.find(q=>{if(q.section_id!==section||String(q.size||'').trim().toLowerCase()!==key||q.shortage_status!=='تم الطلب')return false;let a=q.action_id?app.actions.find(z=>z.id===q.action_id):null;return !a||a.action_status!=='مغلق'});if(dup)return alert(`هذا الصنف له طلب تغذية قائم بالفعل.\nالحالة: تم الطلب — قيد المتابعة\nتاريخ الطلب: ${dup.ordered_date||'—'}`);zakhrafatSelectedItem=x;$('zakhrafatChosenLabel').textContent=x.label;$('zakhrafatChosenMeta').textContent=`زخرفات • ${ZAKHRAFAT_AR[x.generation]} • ${x.generation}`;$('zakhrafatCurrent').value='0';$('zakhrafatRequested').value='0';$('zakhrafatLost').value='0';$('zakhrafatSelected').classList.remove('hidden')}function addZakhrafatDraft(){try{if(!zakhrafatSelectedItem)throw Error('اختر الصنف أولًا');let label=zakhrafatSelectedItem.label;if(zakhrafatDraft.some(x=>x.label===label))throw Error('هذا الصنف مضاف بالفعل في الطلب الحالي');let current=Number($('zakhrafatCurrent').value||0),requested=Number($('zakhrafatRequested').value||0),lost=Number($('zakhrafatLost').value||0);if([current,requested,lost].some(x=>Number.isNaN(x)||x<0))throw Error('أدخل الكميات بشكل صحيح');zakhrafatDraft.push({label,size:zakhrafatSelectedItem.size,style:zakhrafatSelectedItem.style,generation:zakhrafatSelectedItem.generation,current_qty:current,requested_qty:requested,lost_opportunities:lost});renderZakhrafatDraft();zakhrafatSelectedItem=null;$('zakhrafatSelected').classList.add('hidden');$('zakhrafatSearch').value='';$('zakhrafatResults').innerHTML='<p class="mut">تمت الإضافة. ابحث عن صنف آخر أو احفظ الطلب.</p>'}catch(e){alert(e.message)}}function removeZakhrafatDraft(i){zakhrafatDraft.splice(i,1);renderZakhrafatDraft()}function renderZakhrafatDraft(){$('zakhrafatDraftList').innerHTML=zakhrafatDraft.length?zakhrafatDraft.map((x,i)=>`<div class="task"><b>${esc(x.label)}</b><div class="mut" style="margin-top:6px">${esc(ZAKHRAFAT_AR[x.generation]||x.generation)} | الموجود: ${x.current_qty} | المطلوب: ${x.requested_qty} | الفرص الضائعة: ${x.lost_opportunities}</div><div style="margin-top:8px"><button class="mini" style="color:#c83b3b;border-color:#efb4b4" onclick="removeZakhrafatDraft(${i})">حذف</button></div></div>`).join(''):'<p class="mut">لم تتم إضافة أصناف بعد.</p>'}'''
assert 'function addShortRow()' in s, 'addShortRow marker not found'
s=s.replace('function addShortRow()',funcs+'function addShortRow()',1)

# 7) Save through the existing shortages lifecycle.
save=r'''async function saveZakhrafatShortages(){try{let section=$('shortSection').value,sec=app.sections.find(s=>s.id===section);if(sec?.name!=='الزخرفات')throw Error('اختر قسم الزخرفات');if(!zakhrafatDraft.length)throw Error('أضف صنفًا واحدًا على الأقل');for(const row of zakhrafatDraft){let key=row.label.trim().toLowerCase(),dup=shortagesData.find(q=>{if(q.section_id!==section||String(q.size||'').trim().toLowerCase()!==key||q.shortage_status!=='تم الطلب')return false;let a=q.action_id?app.actions.find(z=>z.id===q.action_id):null;return !a||a.action_status!=='مغلق'});if(dup)throw Error(`يوجد طلب قائم للصنف ${row.label} منذ ${dup.ordered_date||'—'}`)}await api('shortage-save',{method:'POST',body:{section_id:section,reporter_employee_id:$('shortReporter').value,rows:zakhrafatDraft.map(x=>({size:x.label,current_qty:x.current_qty,requested_qty:x.requested_qty,lost_opportunities:x.lost_opportunities}))}});zakhrafatDraft=[];zakhrafatSelectedItem=null;shortagesData=await api('shortages');renderZakhrafatDraft();renderShortages();alert('تم حفظ نواقص الزخرفات')}catch(e){alert(e.message)}}'''
assert 'function setShortageFilter(id)' in s, 'Shortage filter marker not found'
s=s.replace('function setShortageFilter(id)',save+'function setShortageFilter(id)',1)

# 8) Archive filters include old combined + both new independent sections.
old_archive="app.sections.filter(s=>s.display_order<=10||s.name==='الحركات')"
new_archive="app.sections.filter(s=>s.display_order<=10||['الحركات','الزخرفات','ري ثوب'].includes(s.name))"
if old_archive in s:
    s=s.replace(old_archive,new_archive,1)

publish='<!-- pages-publish: zakhrafat-smart-shortage-search-2026-08-24 -->'
s=re.sub(r'<!-- pages-publish: [^>]+ -->',publish,s,count=1)
if publish not in s:
    s=s.replace('<title>ركيزة V1</title>','<title>ركيزة V1</title>'+publish,1)

p.write_text(s,encoding='utf-8')
