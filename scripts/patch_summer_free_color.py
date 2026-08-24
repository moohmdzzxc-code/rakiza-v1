from pathlib import Path
import re

p=Path('index.html')
s=p.read_text(encoding='utf-8')
if 'id="shortSummerBox"' in s:
    raise SystemExit(0)

# 1) Add Summer UI after Rethobe.
needle='<button class="btn gold" onclick="saveRethobeShortages()">حفظ نواقص ري ثوب</button></div></div></div><div class="card wide"><div class="title">السجل</div>'
box='''<button class="btn gold" onclick="saveRethobeShortages()">حفظ نواقص ري ثوب</button></div></div><div id="shortSummerBox" class="hidden"><div class="notice ok"><b>البحث الذكي — الصيفي</b><div style="margin-top:5px">مرتبط بورقة Excel: Summer. ابحث بالمقاس فقط، ثم اكتب اللون يدويًا.</div></div><div class="field"><label>ابحث عن المقاس</label><input id="summerSearch" oninput="renderSummerResults()" placeholder="مثال: 54M"></div><div id="summerResults" style="margin-top:10px"></div><div id="summerSelected" class="task hidden"><b id="summerChosenLabel">—</b><div class="mut" style="margin-top:5px">صيفي</div><div class="field" style="margin-top:10px"><label>اللون</label><input id="summerColor" placeholder="اكتب اللون"></div><div class="fields" style="margin-top:10px"><div class="field"><label>الموجود حاليًا</label><input id="summerCurrent" inputmode="numeric" value="0"></div><div class="field"><label>المطلوب للتغذية</label><input id="summerRequested" inputmode="numeric" value="0"></div><div class="field"><label>الفرص الضائعة</label><input id="summerLost" inputmode="numeric" value="0"></div></div><div class="actions" style="justify-content:flex-start"><button class="btn" onclick="addSummerDraft()">إضافة للنواقص</button></div></div><div class="title" style="margin-top:18px">طلب الصيفي الحالي</div><div id="summerDraftList"><p class="mut">لم تتم إضافة أصناف بعد.</p></div><div class="actions"><span></span><button class="btn gold" onclick="saveSummerShortages()">حفظ نواقص الصيفي</button></div></div></div><div class="card wide"><div class="title">السجل</div>'''
assert needle in s, 'Rethobe box ending not found'
s=s.replace(needle,box,1)

# 2) State and catalog. Summer uses the exact same 129-size matrix found in the uploaded Summer sheet.
old_state='rethobeSelectedItem=null,rethobeDraft=[];'
new_state='rethobeSelectedItem=null,rethobeDraft=[],summerSelectedItem=null,summerDraft=[];'
assert old_state in s, 'Rethobe state marker not found'
s=s.replace(old_state,new_state,1)

marker='RETHOBE_CATALOG.forEach((x,i)=>x.i=i);'
cat="""RETHOBE_CATALOG.forEach((x,i)=>x.i=i);const SUMMER_SIZES=[...new Set(Object.values(ZAKHRAFAT_GROUPS).flat())];const SUMMER_CATALOG=SUMMER_SIZES.map(size=>({size,label:size,search:`${size} صيفي summer`}));SUMMER_CATALOG.forEach((x,i)=>x.i=i);"""
assert marker in s, 'Rethobe catalog marker not found'
s=s.replace(marker,cat,1)

# 3) Reset Summer draft whenever shortages page opens and expose the new section.
old_reset="rethobeSelectedItem=null;rethobeDraft=[];$('shortSection')"
new_reset="rethobeSelectedItem=null;rethobeDraft=[];summerSelectedItem=null;summerDraft=[];$('shortSection')"
assert old_reset in s, 'Rethobe reset marker not found'
s=s.replace(old_reset,new_reset,1)
old_options="['الحركات','الزخرفات','ري ثوب'].includes(s.name)"
new_options="['الحركات','الزخرفات','ري ثوب','الصيفي'].includes(s.name)"
assert old_options in s, 'Shortage section options marker not found'
s=s.replace(old_options,new_options,1)

# 4) Route Summer to its own smart box.
pat=r"function shortSectionChanged\(\)\{.*?\}function renderFakherResults"
new_route=r'''function shortSectionChanged(){let sec=app.sections.find(s=>s.id===$('shortSection').value),isFakher=sec?.name==='الفاخر',isBusiness=sec?.name==='الأعمال',isSchool=sec?.name==='الحركات',isClassic=sec?.name==='الكلاسيك',isZakhrafat=sec?.name==='الزخرفات',isRethobe=sec?.name==='ري ثوب',isSummer=sec?.name==='الصيفي',isSmart=isFakher||isBusiness||isSchool||isClassic||isZakhrafat||isRethobe||isSummer;$('shortLegacyBox').classList.toggle('hidden',isSmart);$('shortFakherBox').classList.toggle('hidden',!isFakher);$('shortBusinessBox').classList.toggle('hidden',!isBusiness);$('shortSchoolBox').classList.toggle('hidden',!isSchool);$('shortClassicBox').classList.toggle('hidden',!isClassic);$('shortZakhrafatBox').classList.toggle('hidden',!isZakhrafat);$('shortRethobeBox').classList.toggle('hidden',!isRethobe);$('shortSummerBox').classList.toggle('hidden',!isSummer);if(isFakher){fakherSelectedItem=null;$('fakherSelected').classList.add('hidden');$('fakherSearch').value='';$('fakherResults').innerHTML='<p class="mut">ابدأ بالكتابة للبحث في مقاسات وألوان الفاخر.</p>';renderFakherDraft()}if(isBusiness){businessSelectedItem=null;$('businessSelected').classList.add('hidden');$('businessSearch').value='';$('businessResults').innerHTML='<p class="mut">ابدأ بالكتابة للبحث في مقاسات وألوان الأعمال.</p>';renderBusinessDraft()}if(isSchool){schoolSelectedItem=null;$('schoolSelected').classList.add('hidden');$('schoolSearch').value='';$('schoolResults').innerHTML='<p class="mut">ابدأ بالكتابة للبحث في مقاسات وفئات الحركات.</p>';renderSchoolDraft()}if(isClassic){classicSelectedItem=null;$('classicSelected').classList.add('hidden');$('classicSearch').value='';$('classicResults').innerHTML='<p class="mut">ابدأ بالكتابة للبحث في مقاس أو نوع أو لون الكلاسيك.</p>';renderClassicDraft()}if(isZakhrafat){zakhrafatSelectedItem=null;$('zakhrafatSelected').classList.add('hidden');$('zakhrafatSearch').value='';$('zakhrafatResults').innerHTML='<p class="mut">ابدأ بالكتابة للبحث في مقاسات الزخرفات.</p>';renderZakhrafatDraft()}if(isRethobe){rethobeSelectedItem=null;$('rethobeSelected').classList.add('hidden');$('rethobeSearch').value='';$('rethobeResults').innerHTML='<p class="mut">ابدأ بالكتابة للبحث في مقاسات ري ثوب.</p>';renderRethobeDraft()}if(isSummer){summerSelectedItem=null;$('summerSelected').classList.add('hidden');$('summerSearch').value='';$('summerResults').innerHTML='<p class="mut">ابدأ بالكتابة للبحث في مقاسات الصيفي.</p>';renderSummerDraft()}}function renderFakherResults'''
s,n=re.subn(pat,new_route,s,count=1,flags=re.S)
assert n==1, 'shortSectionChanged block not found'

# 5) Summer search / draft functions: size fixed, color free text.
funcs=r'''function renderSummerResults(){let q=$('summerSearch').value.trim().toLowerCase();if(!q){$('summerResults').innerHTML='<p class="mut">ابدأ بالكتابة للبحث في مقاسات الصيفي.</p>';return}let rows=SUMMER_CATALOG.filter(x=>x.search.toLowerCase().includes(q)).slice(0,24);$('summerResults').innerHTML=rows.length?'<div class="actions" style="justify-content:flex-start;flex-wrap:wrap">'+rows.map(x=>`<button class="mini" onclick="selectSummerItem(${x.i})">${esc(x.size)}</button>`).join('')+'</div>':'<div class="notice">لا يوجد مقاس مطابق في نموذج الصيفي.</div>'}function selectSummerItem(i){let x=SUMMER_CATALOG[i];if(!x)return;summerSelectedItem=x;$('summerChosenLabel').textContent=x.size;$('summerColor').value='';$('summerCurrent').value='0';$('summerRequested').value='0';$('summerLost').value='0';$('summerSelected').classList.remove('hidden')}function addSummerDraft(){try{if(!summerSelectedItem)throw Error('اختر المقاس أولًا');let color=$('summerColor').value.trim();if(!color)throw Error('اكتب اللون');let label=`${summerSelectedItem.size} — ${color}`,section=$('shortSection').value,key=label.trim().toLowerCase(),dup=shortagesData.find(q=>{if(q.section_id!==section||String(q.size||'').trim().toLowerCase()!==key||q.shortage_status!=='تم الطلب')return false;let a=q.action_id?app.actions.find(z=>z.id===q.action_id):null;return !a||a.action_status!=='مغلق'});if(dup)throw Error(`هذا الصنف له طلب تغذية قائم بالفعل منذ ${dup.ordered_date||'—'}`);if(summerDraft.some(x=>x.label.trim().toLowerCase()===key))throw Error('هذا الصنف مضاف بالفعل في الطلب الحالي');let current=Number($('summerCurrent').value||0),requested=Number($('summerRequested').value||0),lost=Number($('summerLost').value||0);if([current,requested,lost].some(x=>Number.isNaN(x)||x<0))throw Error('أدخل الكميات بشكل صحيح');summerDraft.push({label,size:summerSelectedItem.size,color,current_qty:current,requested_qty:requested,lost_opportunities:lost});renderSummerDraft();summerSelectedItem=null;$('summerSelected').classList.add('hidden');$('summerSearch').value='';$('summerResults').innerHTML='<p class="mut">تمت الإضافة. ابحث عن مقاس آخر أو احفظ الطلب.</p>'}catch(e){alert(e.message)}}function removeSummerDraft(i){summerDraft.splice(i,1);renderSummerDraft()}function renderSummerDraft(){$('summerDraftList').innerHTML=summerDraft.length?summerDraft.map((x,i)=>`<div class="task"><b>${esc(x.label)}</b><div class="mut" style="margin-top:6px">الموجود: ${x.current_qty} | المطلوب: ${x.requested_qty} | الفرص الضائعة: ${x.lost_opportunities}</div><div style="margin-top:8px"><button class="mini" style="color:#c83b3b;border-color:#efb4b4" onclick="removeSummerDraft(${i})">حذف</button></div></div>`).join(''):'<p class="mut">لم تتم إضافة أصناف بعد.</p>'}'''
assert 'function addShortRow()' in s, 'addShortRow marker not found'
s=s.replace('function addShortRow()',funcs+'function addShortRow()',1)

# 6) Save Summer through the existing shortages lifecycle.
save=r'''async function saveSummerShortages(){try{let section=$('shortSection').value,sec=app.sections.find(s=>s.id===section);if(sec?.name!=='الصيفي')throw Error('اختر قسم الصيفي');if(!summerDraft.length)throw Error('أضف صنفًا واحدًا على الأقل');for(const row of summerDraft){let key=row.label.trim().toLowerCase(),dup=shortagesData.find(q=>{if(q.section_id!==section||String(q.size||'').trim().toLowerCase()!==key||q.shortage_status!=='تم الطلب')return false;let a=q.action_id?app.actions.find(z=>z.id===q.action_id):null;return !a||a.action_status!=='مغلق'});if(dup)throw Error(`يوجد طلب قائم للصنف ${row.label} منذ ${dup.ordered_date||'—'}`)}await api('shortage-save',{method:'POST',body:{section_id:section,reporter_employee_id:$('shortReporter').value,rows:summerDraft.map(x=>({size:x.label,current_qty:x.current_qty,requested_qty:x.requested_qty,lost_opportunities:x.lost_opportunities}))}});summerDraft=[];summerSelectedItem=null;shortagesData=await api('shortages');renderSummerDraft();renderShortages();alert('تم حفظ نواقص الصيفي')}catch(e){alert(e.message)}}'''
assert 'function setShortageFilter(id)' in s, 'Shortage filter marker not found'
s=s.replace('function setShortageFilter(id)',save+'function setShortageFilter(id)',1)

# 7) Add Summer to shortage register filters.
old_filters="['الحركات','الزخرفات','ري ثوب'].includes(s.name)"
new_filters="['الحركات','الزخرفات','ري ثوب','الصيفي'].includes(s.name)"
if old_filters in s:
    s=s.replace(old_filters,new_filters,1)

# 8) Publication marker.
s=re.sub(r'<!-- pages-publish: [^>]+ -->','<!-- pages-publish: summer-free-color-2026-08-24 -->',s,count=1)
p.write_text(s,encoding='utf-8')
