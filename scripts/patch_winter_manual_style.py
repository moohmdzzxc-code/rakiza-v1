from pathlib import Path
import re

p=Path('index.html')
s=p.read_text(encoding='utf-8')
if 'id="shortWinterBox"' in s:
    raise SystemExit(0)

# 1) Add Winter UI after Summer.
needle='<button class="btn gold" onclick="saveSummerShortages()">حفظ نواقص الصيفي</button></div></div></div><div class="card wide"><div class="title">السجل</div>'
box='''<button class="btn gold" onclick="saveSummerShortages()">حفظ نواقص الصيفي</button></div></div><div id="shortWinterBox" class="hidden"><div class="notice ok"><b>البحث الذكي — الشتوي</b><div style="margin-top:5px">مرتبط بورقة Excel: Winter. ابحث بالمقاس فقط، ثم أدخل رقم الموديل يدويًا.</div></div><div class="field"><label>ابحث عن المقاس</label><input id="winterSearch" oninput="renderWinterResults()" placeholder="مثال: 54M"></div><div id="winterResults" style="margin-top:10px"></div><div id="winterSelected" class="task hidden"><b id="winterChosenLabel">—</b><div class="mut" id="winterChosenMeta" style="margin-top:5px">شتوي</div><div class="field" style="margin-top:10px"><label>رقم الموديل</label><input id="winterStyle" inputmode="numeric" placeholder="اكتب رقم الموديل الحالي"></div><div class="fields" style="margin-top:10px"><div class="field"><label>الموجود حاليًا</label><input id="winterCurrent" inputmode="numeric" value="0"></div><div class="field"><label>المطلوب للتغذية</label><input id="winterRequested" inputmode="numeric" value="0"></div><div class="field"><label>الفرص الضائعة</label><input id="winterLost" inputmode="numeric" value="0"></div></div><div class="actions" style="justify-content:flex-start"><button class="btn" onclick="addWinterDraft()">إضافة للنواقص</button></div></div><div class="title" style="margin-top:18px">طلب الشتوي الحالي</div><div id="winterDraftList"><p class="mut">لم تتم إضافة أصناف بعد.</p></div><div class="actions"><span></span><button class="btn gold" onclick="saveWinterShortages()">حفظ نواقص الشتوي</button></div></div></div><div class="card wide"><div class="title">السجل</div>'''
assert needle in s, 'Summer box ending not found'
s=s.replace(needle,box,1)

# 2) State and catalog. Winter uses the same 129-size matrix verified from the Winter sheet.
old_state='summerSelectedItem=null,summerDraft=[];'
new_state='summerSelectedItem=null,summerDraft=[],winterSelectedItem=null,winterDraft=[];'
assert old_state in s, 'Summer state marker not found'
s=s.replace(old_state,new_state,1)

marker='SUMMER_CATALOG.forEach((x,i)=>x.i=i);'
cat="""SUMMER_CATALOG.forEach((x,i)=>x.i=i);const WINTER_AR=ZAKHRAFAT_AR;const WINTER_CATALOG=Object.entries(ZAKHRAFAT_GROUPS).flatMap(([generation,sizes])=>sizes.map(size=>({generation,size,label:size,search:`${size} ${generation} ${WINTER_AR[generation]} شتوي الشتوي winter`})));WINTER_CATALOG.forEach((x,i)=>x.i=i);"""
assert marker in s, 'Summer catalog marker not found'
s=s.replace(marker,cat,1)

# 3) Reset Winter draft and expose section.
old_reset="summerSelectedItem=null;summerDraft=[];$('shortSection')"
new_reset="summerSelectedItem=null;summerDraft=[];winterSelectedItem=null;winterDraft=[];$('shortSection')"
assert old_reset in s, 'Summer reset marker not found'
s=s.replace(old_reset,new_reset,1)
old_options="['الحركات','الزخرفات','ري ثوب','الصيفي'].includes(s.name)"
new_options="['الحركات','الزخرفات','ري ثوب','الصيفي','الشتوي'].includes(s.name)"
assert old_options in s, 'Shortage section options marker not found'
s=s.replace(old_options,new_options,1)

# 4) Route Winter to its own smart box.
pat=r"function shortSectionChanged\(\)\{.*?\}function renderFakherResults"
new_route=r'''function shortSectionChanged(){let sec=app.sections.find(s=>s.id===$('shortSection').value),isFakher=sec?.name==='الفاخر',isBusiness=sec?.name==='الأعمال',isSchool=sec?.name==='الحركات',isClassic=sec?.name==='الكلاسيك',isZakhrafat=sec?.name==='الزخرفات',isRethobe=sec?.name==='ري ثوب',isSummer=sec?.name==='الصيفي',isWinter=sec?.name==='الشتوي',isSmart=isFakher||isBusiness||isSchool||isClassic||isZakhrafat||isRethobe||isSummer||isWinter;$('shortLegacyBox').classList.toggle('hidden',isSmart);$('shortFakherBox').classList.toggle('hidden',!isFakher);$('shortBusinessBox').classList.toggle('hidden',!isBusiness);$('shortSchoolBox').classList.toggle('hidden',!isSchool);$('shortClassicBox').classList.toggle('hidden',!isClassic);$('shortZakhrafatBox').classList.toggle('hidden',!isZakhrafat);$('shortRethobeBox').classList.toggle('hidden',!isRethobe);$('shortSummerBox').classList.toggle('hidden',!isSummer);$('shortWinterBox').classList.toggle('hidden',!isWinter);if(isFakher){fakherSelectedItem=null;$('fakherSelected').classList.add('hidden');$('fakherSearch').value='';$('fakherResults').innerHTML='<p class="mut">ابدأ بالكتابة للبحث في مقاسات وألوان الفاخر.</p>';renderFakherDraft()}if(isBusiness){businessSelectedItem=null;$('businessSelected').classList.add('hidden');$('businessSearch').value='';$('businessResults').innerHTML='<p class="mut">ابدأ بالكتابة للبحث في مقاسات وألوان الأعمال.</p>';renderBusinessDraft()}if(isSchool){schoolSelectedItem=null;$('schoolSelected').classList.add('hidden');$('schoolSearch').value='';$('schoolResults').innerHTML='<p class="mut">ابدأ بالكتابة للبحث في مقاسات وفئات الحركات.</p>';renderSchoolDraft()}if(isClassic){classicSelectedItem=null;$('classicSelected').classList.add('hidden');$('classicSearch').value='';$('classicResults').innerHTML='<p class="mut">ابدأ بالكتابة للبحث في مقاس أو نوع أو لون الكلاسيك.</p>';renderClassicDraft()}if(isZakhrafat){zakhrafatSelectedItem=null;$('zakhrafatSelected').classList.add('hidden');$('zakhrafatSearch').value='';$('zakhrafatResults').innerHTML='<p class="mut">ابدأ بالكتابة للبحث في مقاسات الزخرفات.</p>';renderZakhrafatDraft()}if(isRethobe){rethobeSelectedItem=null;$('rethobeSelected').classList.add('hidden');$('rethobeSearch').value='';$('rethobeResults').innerHTML='<p class="mut">ابدأ بالكتابة للبحث في مقاسات ري ثوب.</p>';renderRethobeDraft()}if(isSummer){summerSelectedItem=null;$('summerSelected').classList.add('hidden');$('summerSearch').value='';$('summerResults').innerHTML='<p class="mut">ابدأ بالكتابة للبحث في مقاسات الصيفي.</p>';renderSummerDraft()}if(isWinter){winterSelectedItem=null;$('winterSelected').classList.add('hidden');$('winterSearch').value='';$('winterResults').innerHTML='<p class="mut">ابدأ بالكتابة للبحث في مقاسات الشتوي.</p>';renderWinterDraft()}}function renderFakherResults'''
s,n=re.subn(pat,new_route,s,count=1,flags=re.S)
assert n==1, 'shortSectionChanged block not found'

# 5) Winter search/draft functions: size fixed, model manual.
funcs=r'''function renderWinterResults(){let q=$('winterSearch').value.trim().toLowerCase();if(!q){$('winterResults').innerHTML='<p class="mut">ابدأ بالكتابة للبحث في مقاسات الشتوي.</p>';return}let rows=WINTER_CATALOG.filter(x=>x.search.toLowerCase().includes(q)).slice(0,24);$('winterResults').innerHTML=rows.length?'<div class="actions" style="justify-content:flex-start;flex-wrap:wrap">'+rows.map(x=>`<button class="mini" onclick="selectWinterItem(${x.i})">${esc(x.size)}</button>`).join('')+'</div>':'<div class="notice">لا يوجد مقاس مطابق في نموذج الشتوي.</div>'}function selectWinterItem(i){let x=WINTER_CATALOG[i];if(!x)return;winterSelectedItem=x;$('winterChosenLabel').textContent=x.size;$('winterChosenMeta').textContent=`شتوي • ${WINTER_AR[x.generation]} • ${x.generation}`;$('winterStyle').value='';$('winterCurrent').value='0';$('winterRequested').value='0';$('winterLost').value='0';$('winterSelected').classList.remove('hidden')}function addWinterDraft(){try{if(!winterSelectedItem)throw Error('اختر المقاس أولًا');let style=$('winterStyle').value.trim();if(!style)throw Error('أدخل رقم الموديل');let label=`${winterSelectedItem.size} — موديل ${style}`,section=$('shortSection').value,key=label.trim().toLowerCase(),dup=shortagesData.find(q=>{if(q.section_id!==section||String(q.size||'').trim().toLowerCase()!==key||q.shortage_status!=='تم الطلب')return false;let a=q.action_id?app.actions.find(z=>z.id===q.action_id):null;return !a||a.action_status!=='مغلق'});if(dup)throw Error(`هذا الصنف له طلب تغذية قائم بالفعل منذ ${dup.ordered_date||'—'}`);if(winterDraft.some(x=>x.label===label))throw Error('هذا الصنف مضاف بالفعل في الطلب الحالي');let current=Number($('winterCurrent').value||0),requested=Number($('winterRequested').value||0),lost=Number($('winterLost').value||0);if([current,requested,lost].some(x=>Number.isNaN(x)||x<0))throw Error('أدخل الكميات بشكل صحيح');winterDraft.push({label,size:winterSelectedItem.size,style,generation:winterSelectedItem.generation,current_qty:current,requested_qty:requested,lost_opportunities:lost});renderWinterDraft();winterSelectedItem=null;$('winterSelected').classList.add('hidden');$('winterSearch').value='';$('winterResults').innerHTML='<p class="mut">تمت الإضافة. ابحث عن مقاس آخر أو احفظ الطلب.</p>'}catch(e){alert(e.message)}}function removeWinterDraft(i){winterDraft.splice(i,1);renderWinterDraft()}function renderWinterDraft(){$('winterDraftList').innerHTML=winterDraft.length?winterDraft.map((x,i)=>`<div class="task"><b>${esc(x.label)}</b><div class="mut" style="margin-top:6px">${esc(WINTER_AR[x.generation]||x.generation)} | الموجود: ${x.current_qty} | المطلوب: ${x.requested_qty} | الفرص الضائعة: ${x.lost_opportunities}</div><div style="margin-top:8px"><button class="mini" style="color:#c83b3b;border-color:#efb4b4" onclick="removeWinterDraft(${i})">حذف</button></div></div>`).join(''):'<p class="mut">لم تتم إضافة أصناف بعد.</p>'}'''
assert 'function addShortRow()' in s, 'addShortRow marker not found'
s=s.replace('function addShortRow()',funcs+'function addShortRow()',1)

# 6) Save Winter through current shortage lifecycle.
save=r'''async function saveWinterShortages(){try{let section=$('shortSection').value,sec=app.sections.find(s=>s.id===section);if(sec?.name!=='الشتوي')throw Error('اختر قسم الشتوي');if(!winterDraft.length)throw Error('أضف صنفًا واحدًا على الأقل');for(const row of winterDraft){let key=row.label.trim().toLowerCase(),dup=shortagesData.find(q=>{if(q.section_id!==section||String(q.size||'').trim().toLowerCase()!==key||q.shortage_status!=='تم الطلب')return false;let a=q.action_id?app.actions.find(z=>z.id===q.action_id):null;return !a||a.action_status!=='مغلق'});if(dup)throw Error(`يوجد طلب قائم للصنف ${row.label} منذ ${dup.ordered_date||'—'}`)}await api('shortage-save',{method:'POST',body:{section_id:section,reporter_employee_id:$('shortReporter').value,rows:winterDraft.map(x=>({size:x.label,current_qty:x.current_qty,requested_qty:x.requested_qty,lost_opportunities:x.lost_opportunities}))}});winterDraft=[];winterSelectedItem=null;shortagesData=await api('shortages');renderWinterDraft();renderShortages();alert('تم حفظ نواقص الشتوي')}catch(e){alert(e.message)}}'''
assert 'function setShortageFilter(id)' in s, 'Shortage filter marker not found'
s=s.replace('function setShortageFilter(id)',save+'function setShortageFilter(id)',1)

# 7) Add Winter to shortage register filters.
old_filters="['الحركات','الزخرفات','ري ثوب','الصيفي'].includes(s.name)"
new_filters="['الحركات','الزخرفات','ري ثوب','الصيفي','الشتوي'].includes(s.name)"
if old_filters in s:
    s=s.replace(old_filters,new_filters,1)

# 8) Publication marker.
s=re.sub(r'<!-- pages-publish: [^>]+ -->','<!-- pages-publish: winter-manual-style-2026-08-24 -->',s,count=1)
p.write_text(s,encoding='utf-8')
