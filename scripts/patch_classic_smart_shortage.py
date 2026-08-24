from pathlib import Path
import re

p=Path('index.html')
s=p.read_text(encoding='utf-8')

# 1) Add Classic smart-search UI after Harakat/School and before the register card.
needle='<button class="btn gold" onclick="saveSchoolShortages()">حفظ نواقص الحركات</button></div></div></div><div class="card wide"><div class="title">السجل</div>'
classic_box='''<button class="btn gold" onclick="saveSchoolShortages()">حفظ نواقص الحركات</button></div></div><div id="shortClassicBox" class="hidden"><div class="notice ok"><b>البحث الذكي — الكلاسيك</b><div style="margin-top:5px">الكلاسيك بالشكل الحالي: المقاس + عادي/قلاب + أبيض/كريمي فقط.</div></div><div class="field"><label>ابحث عن المقاس / النوع / اللون</label><input id="classicSearch" oninput="renderClassicResults()" placeholder="مثال: 54M أو قلاب أو كريمي"></div><div id="classicResults" style="margin-top:10px"></div><div id="classicSelected" class="task hidden"><b id="classicChosenLabel">—</b><div class="mut" style="margin-top:5px">كلاسيك</div><div class="fields" style="margin-top:10px"><div class="field"><label>الموجود حاليًا</label><input id="classicCurrent" inputmode="numeric" value="0"></div><div class="field"><label>المطلوب للتغذية</label><input id="classicRequested" inputmode="numeric" value="0"></div><div class="field"><label>الفرص الضائعة</label><input id="classicLost" inputmode="numeric" value="0"></div></div><div class="actions" style="justify-content:flex-start"><button class="btn" onclick="addClassicDraft()">إضافة للنواقص</button></div></div><div class="title" style="margin-top:18px">طلب الكلاسيك الحالي</div><div id="classicDraftList"><p class="mut">لم تتم إضافة أصناف بعد.</p></div><div class="actions"><span></span><button class="btn gold" onclick="saveClassicShortages()">حفظ نواقص الكلاسيك</button></div></div></div><div class="card wide"><div class="title">السجل</div>'''
assert needle in s, 'School box ending not found'
s=s.replace(needle,classic_box,1)

# 2) State.
old_state='schoolSelectedItem=null,schoolDraft=[];'
new_state='schoolSelectedItem=null,schoolDraft=[],classicSelectedItem=null,classicDraft=[];'
assert old_state in s, 'School state marker not found'
s=s.replace(old_state,new_state,1)

# 3) Classic catalog: exact unique Classic sizes from the uploaded sheet, with only approved current variants.
marker='SCHOOL_CATALOG.forEach((x,i)=>x.i=i);'
classic_catalog="""SCHOOL_CATALOG.forEach((x,i)=>x.i=i);const CLASSIC_SIZES=['23M','24M','24S','25M','26M','26S','27M','28M','29M','30M','31M','31S','32M','32S','33M','33S','34M','34S','35M','35S','36M','36S','37M','37S','38M','38S','39M','39S','40M','40S','41M','41S','42M','42S','43M','43S','44L','44M','44S','45L','45M','45S','46L','46M','46S','47L','47M','47S','47XL','48L','48M','48S','48XL','49L','49M','49S','49XL','50L','50M','50S','50XL','51L','51M','51S','51XL','52L','52M','52S','52XL','53L','53M','53S','53XL','53XXL','53XXXL','54L','54M','54S','54XL','54XXL','54XXXL','55L','55M','55S','55XL','55XXL','55XXXL','56L','56M','56S','56XL','56XXL','56XXXL','57L','57M','57S','57XL','57XXL','57XXXL','58L','58M','58S','58XL','58XXL','58XXXL','59L','59M','59S','59XL','59XXL','59XXXL','60L','60M','60S','60XL','60XXL','60XXXL','60XXXXL','61L','61M','61XL','61XXL','61XXXL','61XXXXL','62L','62M','62XL','62XXL','62XXXL','62XXXXL','64L','64M','64XL','64XXL','64XXXL','64XXXXL','27S','30S','61S','62S'];const CLASSIC_TYPES=['عادي','قلاب'];const CLASSIC_COLORS=[{label:'أبيض',en:'white'},{label:'كريمي',en:'cream'}];const CLASSIC_CATALOG=CLASSIC_SIZES.flatMap(size=>CLASSIC_TYPES.flatMap(type=>CLASSIC_COLORS.map(color=>({size,type,color:color.label,label:`${size} — ${type} — ${color.label}`,search:`${size} ${type} ${color.label} ${color.en} كلاسيك classic`}))));CLASSIC_CATALOG.forEach((x,i)=>x.i=i);"""
assert marker in s, 'School catalog marker not found'
s=s.replace(marker,classic_catalog,1)

# 4) Reset Classic draft when opening shortages.
old_reset="schoolSelectedItem=null;schoolDraft=[];$('shortSection')"
new_reset="schoolSelectedItem=null;schoolDraft=[];classicSelectedItem=null;classicDraft=[];$('shortSection')"
assert old_reset in s, 'School reset marker not found'
s=s.replace(old_reset,new_reset,1)

# 5) Route the Classic section to its own smart box.
pattern=r"function shortSectionChanged\(\)\{.*?\}function renderFakherResults"
replacement=r'''function shortSectionChanged(){let sec=app.sections.find(s=>s.id===$('shortSection').value),isFakher=sec?.name==='الفاخر',isBusiness=sec?.name==='الأعمال',isSchool=sec?.name==='الحركات',isClassic=sec?.name==='الكلاسيك',isSmart=isFakher||isBusiness||isSchool||isClassic;$('shortLegacyBox').classList.toggle('hidden',isSmart);$('shortFakherBox').classList.toggle('hidden',!isFakher);$('shortBusinessBox').classList.toggle('hidden',!isBusiness);$('shortSchoolBox').classList.toggle('hidden',!isSchool);$('shortClassicBox').classList.toggle('hidden',!isClassic);if(isFakher){fakherSelectedItem=null;$('fakherSelected').classList.add('hidden');$('fakherSearch').value='';$('fakherResults').innerHTML='<p class="mut">ابدأ بالكتابة للبحث في مقاسات وألوان الفاخر.</p>';renderFakherDraft()}if(isBusiness){businessSelectedItem=null;$('businessSelected').classList.add('hidden');$('businessSearch').value='';$('businessResults').innerHTML='<p class="mut">ابدأ بالكتابة للبحث في مقاسات وألوان الأعمال.</p>';renderBusinessDraft()}if(isSchool){schoolSelectedItem=null;$('schoolSelected').classList.add('hidden');$('schoolSearch').value='';$('schoolResults').innerHTML='<p class="mut">ابدأ بالكتابة للبحث في مقاسات وفئات الحركات.</p>';renderSchoolDraft()}if(isClassic){classicSelectedItem=null;$('classicSelected').classList.add('hidden');$('classicSearch').value='';$('classicResults').innerHTML='<p class="mut">ابدأ بالكتابة للبحث في مقاس أو نوع أو لون الكلاسيك.</p>';renderClassicDraft()}}function renderFakherResults'''
s,n=re.subn(pattern,replacement,s,count=1,flags=re.S)
assert n==1, 'shortSectionChanged block not found'

# 6) Classic smart functions before the legacy addShortRow function.
insert_marker='function addShortRow()'
classic_functions=r'''function renderClassicResults(){let q=$('classicSearch').value.trim().toLowerCase();if(!q){$('classicResults').innerHTML='<p class="mut">ابدأ بالكتابة للبحث في مقاس أو نوع أو لون الكلاسيك.</p>';return}let rows=CLASSIC_CATALOG.filter(x=>x.search.toLowerCase().includes(q)).slice(0,20);$('classicResults').innerHTML=rows.length?'<div class="actions" style="justify-content:flex-start;flex-wrap:wrap">'+rows.map(x=>`<button class="mini" onclick="selectClassicItem(${x.i})">${esc(x.label)}</button>`).join('')+'</div>':'<div class="notice">لا توجد نتيجة مطابقة في الكلاسيك.</div>'}function selectClassicItem(i){let x=CLASSIC_CATALOG[i];if(!x)return;let section=$('shortSection').value,key=x.label.trim().toLowerCase(),dup=shortagesData.find(q=>{if(q.section_id!==section||String(q.size||'').trim().toLowerCase()!==key||q.shortage_status!=='تم الطلب')return false;let a=q.action_id?app.actions.find(z=>z.id===q.action_id):null;return !a||a.action_status!=='مغلق'});if(dup)return alert(`هذا الصنف له طلب تغذية قائم بالفعل.\nالحالة: تم الطلب — قيد المتابعة\nتاريخ الطلب: ${dup.ordered_date||'—'}`);classicSelectedItem=x;$('classicChosenLabel').textContent=x.label;$('classicCurrent').value='0';$('classicRequested').value='0';$('classicLost').value='0';$('classicSelected').classList.remove('hidden')}function addClassicDraft(){try{if(!classicSelectedItem)throw Error('اختر الصنف أولًا');let label=classicSelectedItem.label;if(classicDraft.some(x=>x.label===label))throw Error('هذا الصنف مضاف بالفعل في الطلب الحالي');let current=Number($('classicCurrent').value||0),requested=Number($('classicRequested').value||0),lost=Number($('classicLost').value||0);if([current,requested,lost].some(x=>Number.isNaN(x)||x<0))throw Error('أدخل الكميات بشكل صحيح');classicDraft.push({label,size:classicSelectedItem.size,type:classicSelectedItem.type,color:classicSelectedItem.color,current_qty:current,requested_qty:requested,lost_opportunities:lost});renderClassicDraft();classicSelectedItem=null;$('classicSelected').classList.add('hidden');$('classicSearch').value='';$('classicResults').innerHTML='<p class="mut">تمت الإضافة. ابحث عن صنف آخر أو احفظ الطلب.</p>'}catch(e){alert(e.message)}}function removeClassicDraft(i){classicDraft.splice(i,1);renderClassicDraft()}function renderClassicDraft(){$('classicDraftList').innerHTML=classicDraft.length?classicDraft.map((x,i)=>`<div class="task"><b>${esc(x.label)}</b><div class="mut" style="margin-top:6px">الموجود: ${x.current_qty} | المطلوب: ${x.requested_qty} | الفرص الضائعة: ${x.lost_opportunities}</div><div style="margin-top:8px"><button class="mini" style="color:#c83b3b;border-color:#efb4b4" onclick="removeClassicDraft(${i})">حذف</button></div></div>`).join(''):'<p class="mut">لم تتم إضافة أصناف بعد.</p>'}'''
assert insert_marker in s, 'addShortRow marker not found'
s=s.replace(insert_marker,classic_functions+insert_marker,1)

# 7) Save through the existing shortage lifecycle and duplicate protection.
insert_before='function setShortageFilter(id)'
classic_save=r'''async function saveClassicShortages(){try{let section=$('shortSection').value,sec=app.sections.find(s=>s.id===section);if(sec?.name!=='الكلاسيك')throw Error('اختر قسم الكلاسيك');if(!classicDraft.length)throw Error('أضف صنفًا واحدًا على الأقل');for(const row of classicDraft){let key=row.label.trim().toLowerCase(),dup=shortagesData.find(q=>{if(q.section_id!==section||String(q.size||'').trim().toLowerCase()!==key||q.shortage_status!=='تم الطلب')return false;let a=q.action_id?app.actions.find(z=>z.id===q.action_id):null;return !a||a.action_status!=='مغلق'});if(dup)throw Error(`يوجد طلب قائم للصنف ${row.label} منذ ${dup.ordered_date||'—'}`)}await api('shortage-save',{method:'POST',body:{section_id:section,reporter_employee_id:$('shortReporter').value,rows:classicDraft.map(x=>({size:x.label,current_qty:x.current_qty,requested_qty:x.requested_qty,lost_opportunities:x.lost_opportunities}))}});classicDraft=[];classicSelectedItem=null;shortagesData=await api('shortages');renderClassicDraft();renderShortages();alert('تم حفظ نواقص الكلاسيك')}catch(e){alert(e.message)}}'''
assert insert_before in s, 'filter marker not found'
s=s.replace(insert_before,classic_save+insert_before,1)

publish='<!-- pages-publish: classic-smart-shortage-search-2026-08-24 -->'
s=re.sub(r'<!-- pages-publish: [^>]+ -->',publish,s,count=1)
if publish not in s:
    s=s.replace('<title>ركيزة V1</title>','<title>ركيزة V1</title>'+publish,1)

p.write_text(s,encoding='utf-8')
