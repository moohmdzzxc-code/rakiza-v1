from pathlib import Path
import re

p=Path('index.html')
s=p.read_text(encoding='utf-8')

# Add School/الولادي smart-search box after Business.
needle='<button class="btn gold" onclick="saveBusinessShortages()">حفظ نواقص الأعمال</button></div></div></div><div class="card wide"><div class="title">السجل</div>'
school_box='''<button class="btn gold" onclick="saveBusinessShortages()">حفظ نواقص الأعمال</button></div></div><div id="shortSchoolBox" class="hidden"><div class="notice ok"><b>البحث الذكي — الولادي</b><div style="margin-top:5px">مطابق لنموذج School. ابحث بالمقاس أو الفئة Boys / Youth / Men ثم اختر الصنف وأدخل الكميات.</div></div><div class="field"><label>ابحث عن الصنف / المقاس / الفئة</label><input id="schoolSearch" oninput="renderSchoolResults()" placeholder="مثال: 34M أو Youth أو 56XXL"></div><div id="schoolResults" style="margin-top:10px"></div><div id="schoolSelected" class="task hidden"><b id="schoolChosenLabel">—</b><div class="mut" style="margin-top:5px">School • أبيض</div><div class="fields" style="margin-top:10px"><div class="field"><label>الموجود حاليًا</label><input id="schoolCurrent" inputmode="numeric" value="0"></div><div class="field"><label>المطلوب للتغذية</label><input id="schoolRequested" inputmode="numeric" value="0"></div><div class="field"><label>الفرص الضائعة</label><input id="schoolLost" inputmode="numeric" value="0"></div></div><div class="actions" style="justify-content:flex-start"><button class="btn" onclick="addSchoolDraft()">إضافة للنواقص</button></div></div><div class="title" style="margin-top:18px">طلب الولادي الحالي</div><div id="schoolDraftList"><p class="mut">لم تتم إضافة أصناف بعد.</p></div><div class="actions"><span></span><button class="btn gold" onclick="saveSchoolShortages()">حفظ نواقص الولادي</button></div></div></div><div class="card wide"><div class="title">السجل</div>'''
assert needle in s,'Business box ending not found'
s=s.replace(needle,school_box,1)

# State.
old_state='businessSelectedItem=null,businessDraft=[];'
new_state='businessSelectedItem=null,businessDraft=[],schoolSelectedItem=null,schoolDraft=[];'
assert old_state in s,'Business state marker not found'
s=s.replace(old_state,new_state,1)

# Catalog exactly from School sheet: Generation + Size. White is the only color column.
marker='BUSINESS_CATALOG.forEach((x,i)=>x.i=i);'
school_catalog="""BUSINESS_CATALOG.forEach((x,i)=>x.i=i);const SCHOOL_GROUPS={Boys:['34M','34S','35M','35S','36M','36S','37M','37S','38M','38S','39M','39S','40M','40S'],Youth:['41M','41S','42M','42S','43M','43S','44L','44M','44S','45L','45M','45S','46L','46M','46S','47L','47M','47S','47XL','48L','48M','48S','48XL','49L','49M','49S','49XL','50L','50M','50S','50XL','51L','51M','51S','51XL','52L','52M','52S','52XL'],Men:['53L','53M','53S','53XL','53XXL','53XXXL','54L','54M','54S','54XL','54XXL','54XXXL','55L','55M','55S','55XL','55XXL','55XXXL','56L','56M','56S','56XL','56XXL','56XXXL','57L','57M','57S','57XL','57XXL','57XXXL','58L','58M','58S','58XL','58XXL','58XXXL','59L','59M','59S','59XL','59XXL','59XXXL','60L','60M','60S','60XL','60XXL','60XXXL','60XXXXL','61L','61M','61XL','61XXL','61XXXL','61XXXXL','62L','62M','62XL','62XXL','62XXXL','62XXXXL','64L','64M','64XL','64XXL','64XXXL','64XXXXL']};const SCHOOL_AR={Boys:'أولاد',Youth:'شباب',Men:'رجالي'};const SCHOOL_CATALOG=Object.entries(SCHOOL_GROUPS).flatMap(([generation,sizes])=>sizes.map(size=>({generation,size,color:'أبيض',label:`${size} — ${generation} — أبيض`,search:`${size} ${generation} ${SCHOOL_AR[generation]} أبيض white school الولادي`})));SCHOOL_CATALOG.forEach((x,i)=>x.i=i);"""
assert marker in s,'Business catalog marker not found'
s=s.replace(marker,school_catalog,1)

# Reset School draft when opening shortages.
old="businessSelectedItem=null;businessDraft=[];$('shortSection')"
new="businessSelectedItem=null;businessDraft=[];schoolSelectedItem=null;schoolDraft=[];$('shortSection')"
assert old in s,'openShortages Business reset not found'
s=s.replace(old,new,1)

# Route section selection. School sheet maps to existing Rakiza section الولادي.
pattern=r"function shortSectionChanged\(\)\{.*?\}function renderFakherResults"
replacement=r'''function shortSectionChanged(){let sec=app.sections.find(s=>s.id===$('shortSection').value),isFakher=sec?.name==='الفاخر',isBusiness=sec?.name==='الأعمال',isSchool=sec?.name==='الولادي',isSmart=isFakher||isBusiness||isSchool;$('shortLegacyBox').classList.toggle('hidden',isSmart);$('shortFakherBox').classList.toggle('hidden',!isFakher);$('shortBusinessBox').classList.toggle('hidden',!isBusiness);$('shortSchoolBox').classList.toggle('hidden',!isSchool);if(isFakher){fakherSelectedItem=null;$('fakherSelected').classList.add('hidden');$('fakherSearch').value='';$('fakherResults').innerHTML='<p class="mut">ابدأ بالكتابة للبحث في مقاسات وألوان الفاخر.</p>';renderFakherDraft()}if(isBusiness){businessSelectedItem=null;$('businessSelected').classList.add('hidden');$('businessSearch').value='';$('businessResults').innerHTML='<p class="mut">ابدأ بالكتابة للبحث في مقاسات وألوان الأعمال.</p>';renderBusinessDraft()}if(isSchool){schoolSelectedItem=null;$('schoolSelected').classList.add('hidden');$('schoolSearch').value='';$('schoolResults').innerHTML='<p class="mut">ابدأ بالكتابة للبحث في مقاسات وفئات الولادي.</p>';renderSchoolDraft()}}function renderFakherResults'''
s,n=re.subn(pattern,replacement,s,count=1,flags=re.S)
assert n==1,'shortSectionChanged block not found'

# School smart functions before legacy addShortRow.
insert_marker='function addShortRow()'
school_functions=r'''function renderSchoolResults(){let q=$('schoolSearch').value.trim().toLowerCase();if(!q){$('schoolResults').innerHTML='<p class="mut">ابدأ بالكتابة للبحث في مقاسات وفئات الولادي.</p>';return}let rows=SCHOOL_CATALOG.filter(x=>x.search.toLowerCase().includes(q)).slice(0,16);$('schoolResults').innerHTML=rows.length?'<div class="actions" style="justify-content:flex-start;flex-wrap:wrap">'+rows.map(x=>`<button class="mini" onclick="selectSchoolItem(${x.i})">${esc(x.label)}</button>`).join('')+'</div>':'<div class="notice">لا توجد نتيجة مطابقة في نموذج School.</div>'}function selectSchoolItem(i){let x=SCHOOL_CATALOG[i];if(!x)return;let section=$('shortSection').value,key=x.label.trim().toLowerCase(),dup=shortagesData.find(q=>{if(q.section_id!==section||String(q.size||'').trim().toLowerCase()!==key||q.shortage_status!=='تم الطلب')return false;let a=q.action_id?app.actions.find(z=>z.id===q.action_id):null;return !a||a.action_status!=='مغلق'});if(dup)return alert(`هذا الصنف له طلب تغذية قائم بالفعل.\nالحالة: تم الطلب — قيد المتابعة\nتاريخ الطلب: ${dup.ordered_date||'—'}`);schoolSelectedItem=x;$('schoolChosenLabel').textContent=x.label;$('schoolCurrent').value='0';$('schoolRequested').value='0';$('schoolLost').value='0';$('schoolSelected').classList.remove('hidden')}function addSchoolDraft(){try{if(!schoolSelectedItem)throw Error('اختر الصنف أولًا');let label=schoolSelectedItem.label;if(schoolDraft.some(x=>x.label===label))throw Error('هذا الصنف مضاف بالفعل في الطلب الحالي');let current=Number($('schoolCurrent').value||0),requested=Number($('schoolRequested').value||0),lost=Number($('schoolLost').value||0);if([current,requested,lost].some(x=>Number.isNaN(x)||x<0))throw Error('أدخل الكميات بشكل صحيح');schoolDraft.push({label,size:schoolSelectedItem.size,generation:schoolSelectedItem.generation,color:'أبيض',current_qty:current,requested_qty:requested,lost_opportunities:lost});renderSchoolDraft();schoolSelectedItem=null;$('schoolSelected').classList.add('hidden');$('schoolSearch').value='';$('schoolResults').innerHTML='<p class="mut">تمت الإضافة. ابحث عن صنف آخر أو احفظ الطلب.</p>'}catch(e){alert(e.message)}}function removeSchoolDraft(i){schoolDraft.splice(i,1);renderSchoolDraft()}function renderSchoolDraft(){$('schoolDraftList').innerHTML=schoolDraft.length?schoolDraft.map((x,i)=>`<div class="task"><b>${esc(x.label)}</b><div class="mut" style="margin-top:6px">الموجود: ${x.current_qty} | المطلوب: ${x.requested_qty} | الفرص الضائعة: ${x.lost_opportunities}</div><div style="margin-top:8px"><button class="mini" style="color:#c83b3b;border-color:#efb4b4" onclick="removeSchoolDraft(${i})">حذف</button></div></div>`).join(''):'<p class="mut">لم تتم إضافة أصناف بعد.</p>'}'''
assert insert_marker in s,'addShortRow marker not found'
s=s.replace(insert_marker,school_functions+insert_marker,1)

# Save using existing shortage lifecycle and duplicate protection.
insert_before='function setShortageFilter(id)'
school_save=r'''async function saveSchoolShortages(){try{let section=$('shortSection').value,sec=app.sections.find(s=>s.id===section);if(sec?.name!=='الولادي')throw Error('اختر قسم الولادي');if(!schoolDraft.length)throw Error('أضف صنفًا واحدًا على الأقل');for(const row of schoolDraft){let key=row.label.trim().toLowerCase(),dup=shortagesData.find(q=>{if(q.section_id!==section||String(q.size||'').trim().toLowerCase()!==key||q.shortage_status!=='تم الطلب')return false;let a=q.action_id?app.actions.find(z=>z.id===q.action_id):null;return !a||a.action_status!=='مغلق'});if(dup)throw Error(`يوجد طلب قائم للصنف ${row.label} منذ ${dup.ordered_date||'—'}`)}await api('shortage-save',{method:'POST',body:{section_id:section,reporter_employee_id:$('shortReporter').value,rows:schoolDraft.map(x=>({size:x.label,current_qty:x.current_qty,requested_qty:x.requested_qty,lost_opportunities:x.lost_opportunities}))}});schoolDraft=[];schoolSelectedItem=null;shortagesData=await api('shortages');renderSchoolDraft();renderShortages();alert('تم حفظ نواقص الولادي')}catch(e){alert(e.message)}}'''
assert insert_before in s,'filter marker not found'
s=s.replace(insert_before,school_save+insert_before,1)

publish='<!-- pages-publish: school-smart-shortage-search-2026-08-24 -->'
s=re.sub(r'<!-- pages-publish: [^>]+ -->',publish,s,count=1)
if publish not in s:s=s.replace('<title>ركيزة V1</title>','<title>ركيزة V1</title>'+publish,1)

p.write_text(s,encoding='utf-8')
