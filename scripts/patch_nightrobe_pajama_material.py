from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')

# Publish marker
s=s.replace('<!-- pages-publish: egal-hat-fixed-2026-08-25 -->','<!-- pages-publish: nightrobe-pajama-material-2026-08-25 -->',1)

# Add Nightrobe/Pajama UI before the shortage archive card.
marker='</div></div><div class="card wide"><div class="title">السجل</div>'
start=s.find('<div id="shortEgalHatBox"')
pos=s.find(marker,start)
assert start!=-1 and pos!=-1, 'shortage UI insertion marker not found'
night_ui='''</div><div id="shortNightrobeBox" class="hidden"><div class="notice ok"><b>الجلابيات والبيجامات</b><div style="margin-top:5px">التصنيف والمقاس خيارات ثابتة من نموذج Nightrobe , Pigama. بعد اختيار المقاس أدخل رقم الخامة والكميات فقط.</div></div><div class="title" style="margin-top:14px">التصنيف</div><div id="nightTypeChoices" class="actions fixedChoices" style="justify-content:flex-start;flex-wrap:wrap"></div><div id="nightSizeArea" class="hidden"><div class="title" style="margin-top:14px">المقاس</div><div id="nightSizeChoices" class="actions fixedChoices" style="justify-content:flex-start;flex-wrap:wrap"></div></div><div id="nightSummary" class="notice" style="margin-top:14px">اختر التصنيف.</div><div id="nightSelected" class="task hidden"><div class="field"><label>رقم الخامة</label><input id="nightMaterial" placeholder="مثال: 2155"></div><div class="fields" style="margin-top:10px"><div class="field"><label>الموجود حاليًا</label><input id="nightCurrent" inputmode="numeric" value="0"></div><div class="field"><label>المطلوب للتغذية</label><input id="nightRequested" inputmode="numeric" value="0"></div><div class="field"><label>الفرص الضائعة</label><input id="nightLost" inputmode="numeric" value="0"></div></div><div class="actions" style="justify-content:flex-start"><button class="btn" onclick="addNightrobeDraft()">إضافة للنواقص</button></div></div><div class="title" style="margin-top:18px">طلب الجلابيات والبيجامات الحالي</div><div id="nightDraftList"><p class="mut">لم تتم إضافة أصناف بعد.</p></div><div class="actions"><span></span><button class="btn gold" onclick="saveNightrobeShortages()">حفظ نواقص الجلابيات والبيجامات</button></div>'''
s=s[:pos]+night_ui+s[pos+len('</div>'):]

# Add state + exact fixed size maps from Nightrobe , Pigama.
old='egalHatType="",egalHatDraft=[];const EGAL_BOYS_SIZES='
new='''egalHatType="",egalHatDraft=[],nightType="",nightSize="",nightDraft=[];const NIGHTROBE_SIZE_MAP={
'جلابية رجالي كم طويل':['54L','54M','56L','56M','58L','58M','58XXL','60L','60M','60XXL','62L','62M','62XXL','64L','64XXL'],
'جلابية رجالي كم قصير':['54L','54M','56L','56M','58L','58M','58XXL','60L','60M','60XXL','62B','62L','62M','62XXL','64L','64XXL'],
'بيجاما منزلية رجالي':['S','M','L','XL','XXL','XXXL'],
'بيجاما شتوية قطن ولادي':['1 - 2','3 - 4','5 - 6','7 - 8'],
'بيجاما شتوية قطن شبابي':['9 - 10','11 - 12','13 - 14','15 - 16'],
'بيجاما شتوية قطن رجالي':['S','M','L','XL','XXL','XXXL'],
'بيجاما شتوية حرارية رجالي':['S','M','L','XL','XXL','XXXL']};const EGAL_BOYS_SIZES='''
assert old in s, 'state/constants marker not found'
s=s.replace(old,new,1)

# Reset Nightrobe/Pajama state when opening shortages.
old='egalHatMode="";egalCategory="";egalBoysSize="";egalMenHead="";egalThickness="";egalHatType="";egalHatDraft=[];$('
new='egalHatMode="";egalCategory="";egalBoysSize="";egalMenHead="";egalThickness="";egalHatType="";egalHatDraft=[];nightType="";nightSize="";nightDraft=[];$('
assert old in s, 'open shortages reset marker not found'
s=s.replace(old,new,1)

# New-registration sections: keep old الجلابيات for archive only; add new smart section.
old="app.sections.filter(s=>(s.display_order<=10&&s.name!=='الزخرفات والري ثوب')||['الحركات','الزخرفات','ري ثوب','الصيفي','الشتوي','العقال والطاقية'].includes(s.name))"
new="app.sections.filter(s=>(s.display_order<=10&&s.name!=='الزخرفات والري ثوب'&&s.name!=='الجلابيات')||['الحركات','الزخرفات','ري ثوب','الصيفي','الشتوي','العقال والطاقية','الجلابيات والبيجامات'].includes(s.name))"
assert old in s, 'new registration section filter marker not found'
s=s.replace(old,new,1)

# Wire section routing.
old="isShumagh=sec?.name==='الأشمغة',isEgalHat=sec?.name==='العقال والطاقية',isSmart=isFakher||isBusiness||isSchool||isClassic||isZakhrafat||isRethobe||isSummer||isWinter||isShumagh||isEgalHat;"
new="isShumagh=sec?.name==='الأشمغة',isEgalHat=sec?.name==='العقال والطاقية',isNight=sec?.name==='الجلابيات والبيجامات',isSmart=isFakher||isBusiness||isSchool||isClassic||isZakhrafat||isRethobe||isSummer||isWinter||isShumagh||isEgalHat||isNight;"
assert old in s, 'smart routing marker not found'
s=s.replace(old,new,1)
old="$('shortEgalHatBox').classList.toggle('hidden',!isEgalHat);"
new="$('shortEgalHatBox').classList.toggle('hidden',!isEgalHat);$('shortNightrobeBox').classList.toggle('hidden',!isNight);"
assert old in s, 'smart box toggle marker not found'
s=s.replace(old,new,1)
old="if(isEgalHat){egalHatMode='';egalCategory='';egalBoysSize='';egalMenHead='';egalThickness='';egalHatType='';$('egalHatSelected').classList.add('hidden');renderEgalHatControls();renderEgalHatDraft()}}"
new="if(isEgalHat){egalHatMode='';egalCategory='';egalBoysSize='';egalMenHead='';egalThickness='';egalHatType='';$('egalHatSelected').classList.add('hidden');renderEgalHatControls();renderEgalHatDraft()}if(isNight){nightType='';nightSize='';$('nightSelected').classList.add('hidden');renderNightrobeControls();renderNightrobeDraft()}}"
assert old in s, 'smart section init marker not found'
s=s.replace(old,new,1)

# Add Nightrobe/Pajama selection and draft logic before generic shortage rows.
marker='function addShortRow()'
assert marker in s, 'addShortRow marker not found'
funcs=r'''function renderNightrobeControls(){$('nightTypeChoices').innerHTML=Object.keys(NIGHTROBE_SIZE_MAP).map(v=>`<button class="mini ${nightType===v?'on':''}" onclick="selectNightType('${v}',this)">${esc(v)}</button>`).join('');let sizes=nightType?(NIGHTROBE_SIZE_MAP[nightType]||[]):[];$('nightSizeArea').classList.toggle('hidden',!nightType);$('nightSizeChoices').innerHTML=sizes.map(v=>`<button class="mini ${nightSize===v?'on':''}" onclick="selectNightSize('${v}',this)">${esc(v)}</button>`).join('');updateNightrobeSummary()}function selectNightType(v,b){nightType=v;nightSize='';renderNightrobeControls()}function selectNightSize(v,b){nightSize=v;renderNightrobeControls()}function updateNightrobeSummary(){let ready=nightType&&nightSize;$('nightSummary').innerHTML=ready?`المحدد: <b>${esc(nightType)} — ${esc(nightSize)}</b>`:(nightType?'اختر المقاس.':'اختر التصنيف.');$('nightSelected').classList.toggle('hidden',!ready);if(ready){$('nightMaterial').value='';$('nightCurrent').value='0';$('nightRequested').value='0';$('nightLost').value='0'}}function addNightrobeDraft(){try{if(!nightType)throw Error('اختر التصنيف');if(!nightSize)throw Error('اختر المقاس');let material=$('nightMaterial').value.trim();if(!material)throw Error('أدخل رقم الخامة');let label=`${nightType} — ${nightSize} — خامة ${material}`,section=$('shortSection').value,key=label.trim().toLowerCase(),dup=shortagesData.find(q=>{if(q.section_id!==section||String(q.size||'').trim().toLowerCase()!==key||q.shortage_status!=='تم الطلب')return false;let a=q.action_id?app.actions.find(z=>z.id===q.action_id):null;return !a||a.action_status!=='مغلق'});if(dup)throw Error(`هذا الصنف له طلب تغذية قائم بالفعل منذ ${dup.ordered_date||'—'}`);if(nightDraft.some(x=>x.label.trim().toLowerCase()===key))throw Error('هذا الصنف مضاف بالفعل في الطلب الحالي');let current=Number($('nightCurrent').value||0),requested=Number($('nightRequested').value||0),lost=Number($('nightLost').value||0);if([current,requested,lost].some(x=>Number.isNaN(x)||x<0))throw Error('أدخل الكميات بشكل صحيح');nightDraft.push({label,type:nightType,size:nightSize,material,current_qty:current,requested_qty:requested,lost_opportunities:lost});renderNightrobeDraft();$('nightMaterial').value='';$('nightCurrent').value='0';$('nightRequested').value='0';$('nightLost').value='0'}catch(e){alert(e.message)}}function removeNightrobeDraft(i){nightDraft.splice(i,1);renderNightrobeDraft()}function renderNightrobeDraft(){$('nightDraftList').innerHTML=nightDraft.length?nightDraft.map((x,i)=>`<div class="task"><b>${esc(x.label)}</b><div class="mut" style="margin-top:6px">الموجود: ${x.current_qty} | المطلوب: ${x.requested_qty} | الفرص الضائعة: ${x.lost_opportunities}</div><div style="margin-top:8px"><button class="mini" style="color:#c83b3b;border-color:#efb4b4" onclick="removeNightrobeDraft(${i})">حذف</button></div></div>`).join(''):'<p class="mut">لم تتم إضافة أصناف بعد.</p>'}'''
s=s.replace(marker,funcs+marker,1)

# Add save function.
marker='function setShortageFilter(id)'
assert marker in s, 'setShortageFilter marker not found'
save=r'''async function saveNightrobeShortages(){try{let section=$('shortSection').value,sec=app.sections.find(s=>s.id===section);if(sec?.name!=='الجلابيات والبيجامات')throw Error('اختر قسم الجلابيات والبيجامات');if(!nightDraft.length)throw Error('أضف صنفًا واحدًا على الأقل');for(const row of nightDraft){let key=row.label.trim().toLowerCase(),dup=shortagesData.find(q=>{if(q.section_id!==section||String(q.size||'').trim().toLowerCase()!==key||q.shortage_status!=='تم الطلب')return false;let a=q.action_id?app.actions.find(z=>z.id===q.action_id):null;return !a||a.action_status!=='مغلق'});if(dup)throw Error(`يوجد طلب قائم للصنف ${row.label} منذ ${dup.ordered_date||'—'}`)}await api('shortage-save',{method:'POST',body:{section_id:section,reporter_employee_id:$('shortReporter').value,rows:nightDraft.map(x=>({size:x.label,current_qty:x.current_qty,requested_qty:x.requested_qty,lost_opportunities:x.lost_opportunities}))}});nightDraft=[];nightType='';nightSize='';shortagesData=await api('shortages');renderNightrobeControls();renderNightrobeDraft();renderShortages();alert('تم حفظ نواقص الجلابيات والبيجامات')}catch(e){alert(e.message)}}'''
s=s.replace(marker,save+marker,1)

# Include new section in archive filters.
old="['الحركات','الزخرفات','ري ثوب','الصيفي','الشتوي','العقال والطاقية'].includes(s.name)"
new="['الحركات','الزخرفات','ري ثوب','الصيفي','الشتوي','العقال والطاقية','الجلابيات والبيجامات'].includes(s.name)"
assert old in s, 'archive filter marker not found'
s=s.replace(old,new,1)

p.write_text(s,encoding='utf-8')
