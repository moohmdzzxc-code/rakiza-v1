from pathlib import Path
import re

p=Path('index.html')
s=p.read_text(encoding='utf-8')

# 1) Add Business smart-search box next to Fakher without changing other sections.
needle='<button class="btn gold" onclick="saveFakherShortages()">حفظ نواقص الفاخر</button></div></div></div><div class="card wide"><div class="title">السجل</div>'
business_box='''<button class="btn gold" onclick="saveFakherShortages()">حفظ نواقص الفاخر</button></div></div><div id="shortBusinessBox" class="hidden"><div class="notice ok"><b>البحث الذكي — الأعمال</b><div style="margin-top:5px">اكتب المقاس أو اللون، ثم اختر الصنف المقصود وأدخل الكميات فقط.</div></div><div class="field"><label>ابحث عن الصنف / المقاس / اللون</label><input id="businessSearch" oninput="renderBusinessResults()" placeholder="مثال: 56 أو 56S أو أبيض"></div><div id="businessResults" style="margin-top:10px"></div><div id="businessSelected" class="task hidden"><b id="businessChosenLabel">—</b><div class="mut" style="margin-top:5px">أعمال • رجالي</div><div class="fields" style="margin-top:10px"><div class="field"><label>الموجود حاليًا</label><input id="businessCurrent" inputmode="numeric" value="0"></div><div class="field"><label>المطلوب للتغذية</label><input id="businessRequested" inputmode="numeric" value="0"></div><div class="field"><label>الفرص الضائعة</label><input id="businessLost" inputmode="numeric" value="0"></div></div><div class="actions" style="justify-content:flex-start"><button class="btn" onclick="addBusinessDraft()">إضافة للنواقص</button></div></div><div class="title" style="margin-top:18px">طلب الأعمال الحالي</div><div id="businessDraftList"><p class="mut">لم تتم إضافة أصناف بعد.</p></div><div class="actions"><span></span><button class="btn gold" onclick="saveBusinessShortages()">حفظ نواقص الأعمال</button></div></div></div><div class="card wide"><div class="title">السجل</div>'''
assert needle in s,'Fakher box ending not found'
s=s.replace(needle,business_box,1)

# 2) State + catalog exactly from Business sheet in the supplied workbook.
old_state='rosterLoaded=null,fakherSelectedItem=null,fakherDraft=[];'
new_state='rosterLoaded=null,fakherSelectedItem=null,fakherDraft=[],businessSelectedItem=null,businessDraft=[];'
assert old_state in s,'state marker not found'
s=s.replace(old_state,new_state,1)

marker="FAKHER_CATALOG.forEach((x,i)=>x.i=i);"
business_catalog="""FAKHER_CATALOG.forEach((x,i)=>x.i=i);const BUSINESS_SIZES=['53L','53M','53S','53XL','54L','54M','54S','54XL','55L','55M','55S','55XL','56L','56M','56S','56XL','56XXL','57L','57M','57S','57XL','57XXL','58L','58M','58S','58XL','58XXL','59L','59M','59S','59XL','59XXL','60L','60M','60S','60XL','60XXL','60XXXL','61L','61M','61XL','61XXL','62L','62M','62XL','62XXL','62XXXL','64L','64XL','64XXL'];const BUSINESS_COLORS=[{label:'أبيض',en:'white'},{label:'سكري',en:'cream'}];const BUSINESS_CATALOG=BUSINESS_SIZES.flatMap(size=>BUSINESS_COLORS.map(color=>({size,color:color.label,label:`${size} — ${color.label}`,search:`${size} ${color.label} ${color.en} أعمال الأعمال business رجالي men`})));BUSINESS_CATALOG.forEach((x,i)=>x.i=i);"""
assert marker in s,'Fakher catalog marker not found'
s=s.replace(marker,business_catalog,1)

# 3) Reset Business draft when opening shortages.
old="async function openShortages(){show('shortages');shortageSectionFilter='';fakherSelectedItem=null;fakherDraft=[];"
new="async function openShortages(){show('shortages');shortageSectionFilter='';fakherSelectedItem=null;fakherDraft=[];businessSelectedItem=null;businessDraft=[];"
assert old in s,'openShortages reset not found'
s=s.replace(old,new,1)

# 4) Route section selection: Fakher and Business are smart, all others stay legacy.
pattern=r"function shortSectionChanged\(\)\{.*?\}function renderFakherResults"
replacement=r'''function shortSectionChanged(){let sec=app.sections.find(s=>s.id===$('shortSection').value),isFakher=sec?.name==='الفاخر',isBusiness=sec?.name==='الأعمال',isSmart=isFakher||isBusiness;$('shortLegacyBox').classList.toggle('hidden',isSmart);$('shortFakherBox').classList.toggle('hidden',!isFakher);$('shortBusinessBox').classList.toggle('hidden',!isBusiness);if(isFakher){fakherSelectedItem=null;$('fakherSelected').classList.add('hidden');$('fakherSearch').value='';$('fakherResults').innerHTML='<p class="mut">ابدأ بالكتابة للبحث في مقاسات وألوان الفاخر.</p>';renderFakherDraft()}if(isBusiness){businessSelectedItem=null;$('businessSelected').classList.add('hidden');$('businessSearch').value='';$('businessResults').innerHTML='<p class="mut">ابدأ بالكتابة للبحث في مقاسات وألوان الأعمال.</p>';renderBusinessDraft()}}function renderFakherResults'''
s,n=re.subn(pattern,replacement,s,count=1,flags=re.S)
assert n==1,'shortSectionChanged block not found'

# 5) Business search/selection/draft functions.
insert_marker='function addShortRow()'
business_functions=r'''function renderBusinessResults(){let q=$('businessSearch').value.trim().toLowerCase();if(!q){$('businessResults').innerHTML='<p class="mut">ابدأ بالكتابة للبحث في مقاسات وألوان الأعمال.</p>';return}let rows=BUSINESS_CATALOG.filter(x=>x.search.toLowerCase().includes(q)).slice(0,16);$('businessResults').innerHTML=rows.length?'<div class="actions" style="justify-content:flex-start;flex-wrap:wrap">'+rows.map(x=>`<button class="mini" onclick="selectBusinessItem(${x.i})">${esc(x.label)}</button>`).join('')+'</div>':'<div class="notice">لا توجد نتيجة مطابقة في نموذج الأعمال.</div>'}function selectBusinessItem(i){let x=BUSINESS_CATALOG[i];if(!x)return;let section=$('shortSection').value,key=x.label.trim().toLowerCase(),dup=shortagesData.find(q=>{if(q.section_id!==section||String(q.size||'').trim().toLowerCase()!==key||q.shortage_status!=='تم الطلب')return false;let a=q.action_id?app.actions.find(z=>z.id===q.action_id):null;return !a||a.action_status!=='مغلق'});if(dup)return alert(`هذا الصنف له طلب تغذية قائم بالفعل.\nالحالة: تم الطلب — قيد المتابعة\nتاريخ الطلب: ${dup.ordered_date||'—'}`);businessSelectedItem=x;$('businessChosenLabel').textContent=x.label;$('businessCurrent').value='0';$('businessRequested').value='0';$('businessLost').value='0';$('businessSelected').classList.remove('hidden')}function addBusinessDraft(){try{if(!businessSelectedItem)throw Error('اختر الصنف أولًا');let label=businessSelectedItem.label;if(businessDraft.some(x=>x.label===label))throw Error('هذا الصنف مضاف بالفعل في الطلب الحالي');let current=Number($('businessCurrent').value||0),requested=Number($('businessRequested').value||0),lost=Number($('businessLost').value||0);if([current,requested,lost].some(x=>Number.isNaN(x)||x<0))throw Error('أدخل الكميات بشكل صحيح');businessDraft.push({label,size:businessSelectedItem.size,color:businessSelectedItem.color,current_qty:current,requested_qty:requested,lost_opportunities:lost});renderBusinessDraft();businessSelectedItem=null;$('businessSelected').classList.add('hidden');$('businessSearch').value='';$('businessResults').innerHTML='<p class="mut">تمت الإضافة. ابحث عن صنف آخر أو احفظ الطلب.</p>'}catch(e){alert(e.message)}}function removeBusinessDraft(i){businessDraft.splice(i,1);renderBusinessDraft()}function renderBusinessDraft(){$('businessDraftList').innerHTML=businessDraft.length?businessDraft.map((x,i)=>`<div class="task"><b>${esc(x.label)}</b><div class="mut" style="margin-top:6px">الموجود: ${x.current_qty} | المطلوب: ${x.requested_qty} | الفرص الضائعة: ${x.lost_opportunities}</div><div style="margin-top:8px"><button class="mini" style="color:#c83b3b;border-color:#efb4b4" onclick="removeBusinessDraft(${i})">حذف</button></div></div>`).join(''):'<p class="mut">لم تتم إضافة أصناف بعد.</p>'}'''
assert insert_marker in s,'addShortRow marker not found'
s=s.replace(insert_marker,business_functions+insert_marker,1)

# 6) Business save uses the same existing shortage lifecycle and duplicate protection.
insert_before='function setShortageFilter(id)'
business_save=r'''async function saveBusinessShortages(){try{let section=$('shortSection').value,sec=app.sections.find(s=>s.id===section);if(sec?.name!=='الأعمال')throw Error('اختر قسم الأعمال');if(!businessDraft.length)throw Error('أضف صنفًا واحدًا على الأقل');for(const row of businessDraft){let key=row.label.trim().toLowerCase(),dup=shortagesData.find(q=>{if(q.section_id!==section||String(q.size||'').trim().toLowerCase()!==key||q.shortage_status!=='تم الطلب')return false;let a=q.action_id?app.actions.find(z=>z.id===q.action_id):null;return !a||a.action_status!=='مغلق'});if(dup)throw Error(`يوجد طلب قائم للصنف ${row.label} منذ ${dup.ordered_date||'—'}`)}await api('shortage-save',{method:'POST',body:{section_id:section,reporter_employee_id:$('shortReporter').value,rows:businessDraft.map(x=>({size:x.label,current_qty:x.current_qty,requested_qty:x.requested_qty,lost_opportunities:x.lost_opportunities}))}});businessDraft=[];businessSelectedItem=null;shortagesData=await api('shortages');renderBusinessDraft();renderShortages();alert('تم حفظ نواقص الأعمال')}catch(e){alert(e.message)}}'''
assert insert_before in s,'filter marker not found'
s=s.replace(insert_before,business_save+insert_before,1)

publish='<!-- pages-publish: business-smart-shortage-search-2026-08-24 -->'
s=re.sub(r'<!-- pages-publish: [^>]+ -->',publish,s,count=1)
if publish not in s:s=s.replace('<title>ركيزة V1</title>','<title>ركيزة V1</title>'+publish,1)

p.write_text(s,encoding='utf-8')
