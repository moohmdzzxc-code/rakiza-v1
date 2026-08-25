from pathlib import Path
import re

p=Path('index.html')
s=p.read_text(encoding='utf-8')
if 'id="shortEgalHatBox"' in s:
    raise SystemExit(0)

s=s.replace('<!-- pages-publish: ghutra-white-only-2026-08-25 -->','<!-- pages-publish: egal-hat-fixed-2026-08-25 -->',1)

# Insert UI after Shumagh block
needle='<div class="actions"><span></span><button class="btn gold" onclick="saveShumaghShortages()">حفظ نواقص الأشمغة</button></div></div></div><div class="card wide"><div class="title">السجل</div>'
box='''<div class="actions"><span></span><button class="btn gold" onclick="saveShumaghShortages()">حفظ نواقص الأشمغة</button></div></div><div id="shortEgalHatBox" class="hidden"><div class="notice ok"><b>العقال والطاقية</b><div style="margin-top:5px">خيارات ثابتة من نموذج Egal , Hat. اختر الصنف والتصنيف فقط، ثم أدخل الكميات.</div></div><div class="title" style="margin-top:14px">الصنف</div><div id="egalHatModeChoices" class="actions fixedChoices" style="justify-content:flex-start;flex-wrap:wrap"><button class="mini" data-value="عقال" onclick="selectEgalHatMode('عقال',this)">عقال</button><button class="mini" data-value="طاقية" onclick="selectEgalHatMode('طاقية',this)">طاقية</button></div><div id="egalArea" class="hidden"><div class="title" style="margin-top:14px">الفئة</div><div id="egalCategoryChoices" class="actions fixedChoices" style="justify-content:flex-start;flex-wrap:wrap"><button class="mini" data-value="ولادي" onclick="selectEgalCategory('ولادي',this)">ولادي</button><button class="mini" data-value="رجالي" onclick="selectEgalCategory('رجالي',this)">رجالي</button></div><div id="egalBoysArea" class="hidden"><div class="title" style="margin-top:14px">المقاس</div><div id="egalBoysSizes" class="actions fixedChoices" style="justify-content:flex-start;flex-wrap:wrap"></div></div><div id="egalMenArea" class="hidden"><div class="title" style="margin-top:14px">مقاس الرأس</div><div id="egalMenHeads" class="actions fixedChoices" style="justify-content:flex-start;flex-wrap:wrap"></div><div id="egalThicknessArea" class="hidden"><div class="title" style="margin-top:14px">السماكة</div><div id="egalThicknessChoices" class="actions fixedChoices" style="justify-content:flex-start;flex-wrap:wrap"></div></div></div></div><div id="hatArea" class="hidden"><div class="title" style="margin-top:14px">نوع الطاقية</div><div id="hatTypeChoices" class="actions fixedChoices" style="justify-content:flex-start;flex-wrap:wrap"></div><div class="mut" style="margin-top:8px">المقاس ثابت F.S لجميع أنواع الطاقية.</div></div><div id="egalHatSummary" class="notice" style="margin-top:14px">اختر عقال أو طاقية.</div><div id="egalHatSelected" class="task hidden"><div class="fields"><div class="field"><label>الموجود حاليًا</label><input id="egalHatCurrent" inputmode="numeric" value="0"></div><div class="field"><label>المطلوب للتغذية</label><input id="egalHatRequested" inputmode="numeric" value="0"></div><div class="field"><label>الفرص الضائعة</label><input id="egalHatLost" inputmode="numeric" value="0"></div></div><div class="actions" style="justify-content:flex-start"><button class="btn" onclick="addEgalHatDraft()">إضافة للنواقص</button></div></div><div class="title" style="margin-top:18px">طلب العقال والطاقية الحالي</div><div id="egalHatDraftList"><p class="mut">لم تتم إضافة أصناف بعد.</p></div><div class="actions"><span></span><button class="btn gold" onclick="saveEgalHatShortages()">حفظ نواقص العقال والطاقية</button></div></div></div><div class="card wide"><div class="title">السجل</div>'''
assert needle in s, 'Shumagh ending marker not found'
s=s.replace(needle,box,1)

# Global state and constants
old='shumaghSelectedItem=null,shumaghProductChoice="",shumaghColorChoice="",shumaghDraft=[];const FAKHER_SIZES='
new='shumaghSelectedItem=null,shumaghProductChoice="",shumaghColorChoice="",shumaghDraft=[],egalHatMode="",egalCategory="",egalBoysSize="",egalMenHead="",egalThickness="",egalHatType="",egalHatDraft=[];const EGAL_BOYS_SIZES=[\'47/4.5\',\'48/4.5\',\'49/4.5\',\'50/4.5\',\'51/4.5\',\'52/4.5\',\'53/4.5\',\'54/4.5\',\'55/4.5\'];const EGAL_MEN_MAP={\'48\':[\'4.5\',\'5\',\'5.5\',\'6\'],\'49\':[\'4.5\',\'5\',\'5.5\',\'6\'],\'50\':[\'4.5\',\'5\',\'5.5\',\'6\'],\'51\':[\'4.5\',\'5\',\'5.5\',\'6\'],\'52\':[\'4.5\',\'5\',\'5.5\',\'6\'],\'53\':[\'4.5\',\'5\',\'5.5\',\'6\'],\'54\':[\'4.5\',\'5\',\'5.5\',\'6\'],\'55\':[\'4.5\',\'5\',\'5.5\']};const HAT_TYPES=[\'جيزاني دبل\',\'جيزاني عادي\',\'جيزاني بريميوم\',\'سوري\',\'بنغالي\',\'ملكي جدار وسط\',\'ملكي جدار قصير\'];const FAKHER_SIZES='
assert old in s, 'global state marker not found'
s=s.replace(old,new,1)

# Reset on opening shortages
old='shumaghSelectedItem=null;shumaghProductChoice="";shumaghColorChoice="";shumaghDraft=[];$('"'"'shortSection'"'"').innerHTML='
new='shumaghSelectedItem=null;shumaghProductChoice="";shumaghColorChoice="";shumaghDraft=[];egalHatMode="";egalCategory="";egalBoysSize="";egalMenHead="";egalThickness="";egalHatType="";egalHatDraft=[];$('"'"'shortSection'"'"').innerHTML='
assert old in s, 'open shortages reset marker not found'
s=s.replace(old,new,1)

# Make section selectable
old="['الحركات','الزخرفات','ري ثوب','الصيفي','الشتوي'].includes(s.name)"
new="['الحركات','الزخرفات','ري ثوب','الصيفي','الشتوي','العقال والطاقية'].includes(s.name)"
s=s.replace(old,new,2)

# Route section to smart UI
old="isWinter=sec?.name==='الشتوي',isShumagh=sec?.name==='الأشمغة',isSmart="
new="isWinter=sec?.name==='الشتوي',isShumagh=sec?.name==='الأشمغة',isEgalHat=sec?.name==='العقال والطاقية',isSmart="
assert old in s, 'section route marker not found'
s=s.replace(old,new,1)
old='isZakhrafat||isRethobe||isSummer||isWinter||isShumagh;'
new='isZakhrafat||isRethobe||isSummer||isWinter||isShumagh||isEgalHat;'
assert old in s, 'smart route marker not found'
s=s.replace(old,new,1)
old="$('shortShumaghBox').classList.toggle('hidden',!isShumagh);"
new="$('shortShumaghBox').classList.toggle('hidden',!isShumagh);$('shortEgalHatBox').classList.toggle('hidden',!isEgalHat);"
assert old in s, 'smart toggle marker not found'
s=s.replace(old,new,1)
old="if(isShumagh){shumaghSelectedItem=null;shumaghProductChoice='';shumaghColorChoice='';$('shumaghSelected').classList.add('hidden');renderShumaghFixedControls();renderShumaghDraft()}"
new=old+"if(isEgalHat){egalHatMode='';egalCategory='';egalBoysSize='';egalMenHead='';egalThickness='';egalHatType='';$('egalHatSelected').classList.add('hidden');renderEgalHatControls();renderEgalHatDraft()}"
assert old in s, 'Shumagh init marker not found'
s=s.replace(old,new,1)

# Add UI logic before generic row function
anchor='function addShortRow()'
assert anchor in s, 'addShortRow anchor not found'
funcs=r'''function renderEgalHatControls(){document.querySelectorAll('#egalHatModeChoices .mini').forEach(b=>b.classList.toggle('on',b.dataset.value===egalHatMode));$('egalArea').classList.toggle('hidden',egalHatMode!=='عقال');$('hatArea').classList.toggle('hidden',egalHatMode!=='طاقية');document.querySelectorAll('#egalCategoryChoices .mini').forEach(b=>b.classList.toggle('on',b.dataset.value===egalCategory));$('egalBoysArea').classList.toggle('hidden',!(egalHatMode==='عقال'&&egalCategory==='ولادي'));$('egalMenArea').classList.toggle('hidden',!(egalHatMode==='عقال'&&egalCategory==='رجالي'));$('egalBoysSizes').innerHTML=EGAL_BOYS_SIZES.map(v=>`<button class="mini ${egalBoysSize===v?'on':''}" onclick="selectEgalBoysSize('${v}',this)">${esc(v)}</button>`).join('');$('egalMenHeads').innerHTML=Object.keys(EGAL_MEN_MAP).map(v=>`<button class="mini ${egalMenHead===v?'on':''}" onclick="selectEgalMenHead('${v}',this)">${esc(v)}</button>`).join('');let th=egalMenHead?EGAL_MEN_MAP[egalMenHead]||[]:[];$('egalThicknessArea').classList.toggle('hidden',!(egalHatMode==='عقال'&&egalCategory==='رجالي'&&egalMenHead));$('egalThicknessChoices').innerHTML=th.map(v=>`<button class="mini ${egalThickness===v?'on':''}" onclick="selectEgalThickness('${v}',this)">${esc(v)}</button>`).join('');$('hatTypeChoices').innerHTML=HAT_TYPES.map(v=>`<button class="mini ${egalHatType===v?'on':''}" onclick="selectHatType('${v}',this)">${esc(v)}</button>`).join('');updateEgalHatSummary()}function selectEgalHatMode(v,b){egalHatMode=v;egalCategory='';egalBoysSize='';egalMenHead='';egalThickness='';egalHatType='';renderEgalHatControls()}function selectEgalCategory(v,b){egalCategory=v;egalBoysSize='';egalMenHead='';egalThickness='';renderEgalHatControls()}function selectEgalBoysSize(v,b){egalBoysSize=v;renderEgalHatControls()}function selectEgalMenHead(v,b){egalMenHead=v;egalThickness='';renderEgalHatControls()}function selectEgalThickness(v,b){egalThickness=v;renderEgalHatControls()}function selectHatType(v,b){egalHatType=v;renderEgalHatControls()}function egalHatCurrentLabel(){if(egalHatMode==='عقال'&&egalCategory==='ولادي'&&egalBoysSize)return `عقال — ولادي — ${egalBoysSize}`;if(egalHatMode==='عقال'&&egalCategory==='رجالي'&&egalMenHead&&egalThickness)return `عقال — رجالي — ${egalMenHead}/${egalThickness}`;if(egalHatMode==='طاقية'&&egalHatType)return `طاقية — ${egalHatType}`;return ''}function updateEgalHatSummary(){let label=egalHatCurrentLabel();$('egalHatSummary').innerHTML=label?`المحدد: <b>${esc(label)}</b>`:(egalHatMode==='عقال'?'اختر الفئة والمقاس.':egalHatMode==='طاقية'?'اختر نوع الطاقية.':'اختر عقال أو طاقية.');$('egalHatSelected').classList.toggle('hidden',!label);if(label){$('egalHatCurrent').value='0';$('egalHatRequested').value='0';$('egalHatLost').value='0'}}function addEgalHatDraft(){try{let label=egalHatCurrentLabel();if(!label)throw Error('أكمل اختيار الصنف');let section=$('shortSection').value,key=label.trim().toLowerCase(),dup=shortagesData.find(q=>{if(q.section_id!==section||String(q.size||'').trim().toLowerCase()!==key||q.shortage_status!=='تم الطلب')return false;let a=q.action_id?app.actions.find(z=>z.id===q.action_id):null;return !a||a.action_status!=='مغلق'});if(dup)throw Error(`هذا الصنف له طلب تغذية قائم بالفعل منذ ${dup.ordered_date||'—'}`);if(egalHatDraft.some(x=>x.label.trim().toLowerCase()===key))throw Error('هذا الصنف مضاف بالفعل في الطلب الحالي');let current=Number($('egalHatCurrent').value||0),requested=Number($('egalHatRequested').value||0),lost=Number($('egalHatLost').value||0);if([current,requested,lost].some(x=>Number.isNaN(x)||x<0))throw Error('أدخل الكميات بشكل صحيح');egalHatDraft.push({label,current_qty:current,requested_qty:requested,lost_opportunities:lost});renderEgalHatDraft();$('egalHatCurrent').value='0';$('egalHatRequested').value='0';$('egalHatLost').value='0'}catch(e){alert(e.message)}}function removeEgalHatDraft(i){egalHatDraft.splice(i,1);renderEgalHatDraft()}function renderEgalHatDraft(){$('egalHatDraftList').innerHTML=egalHatDraft.length?egalHatDraft.map((x,i)=>`<div class="task"><b>${esc(x.label)}</b><div class="mut" style="margin-top:6px">الموجود: ${x.current_qty} | المطلوب: ${x.requested_qty} | الفرص الضائعة: ${x.lost_opportunities}</div><div style="margin-top:8px"><button class="mini" style="color:#c83b3b;border-color:#efb4b4" onclick="removeEgalHatDraft(${i})">حذف</button></div></div>`).join(''):'<p class="mut">لم تتم إضافة أصناف بعد.</p>'}'''
s=s.replace(anchor,funcs+anchor,1)

# Add save function
anchor='function setShortageFilter(id)'
assert anchor in s, 'filter anchor not found'
save=r'''async function saveEgalHatShortages(){try{let section=$('shortSection').value,sec=app.sections.find(s=>s.id===section);if(sec?.name!=='العقال والطاقية')throw Error('اختر قسم العقال والطاقية');if(!egalHatDraft.length)throw Error('أضف صنفًا واحدًا على الأقل');for(const row of egalHatDraft){let key=row.label.trim().toLowerCase(),dup=shortagesData.find(q=>{if(q.section_id!==section||String(q.size||'').trim().toLowerCase()!==key||q.shortage_status!=='تم الطلب')return false;let a=q.action_id?app.actions.find(z=>z.id===q.action_id):null;return !a||a.action_status!=='مغلق'});if(dup)throw Error(`يوجد طلب قائم للصنف ${row.label} منذ ${dup.ordered_date||'—'}`)}await api('shortage-save',{method:'POST',body:{section_id:section,reporter_employee_id:$('shortReporter').value,rows:egalHatDraft.map(x=>({size:x.label,current_qty:x.current_qty,requested_qty:x.requested_qty,lost_opportunities:x.lost_opportunities}))}});egalHatDraft=[];egalHatMode='';egalCategory='';egalBoysSize='';egalMenHead='';egalThickness='';egalHatType='';shortagesData=await api('shortages');renderEgalHatControls();renderEgalHatDraft();renderShortages();alert('تم حفظ نواقص العقال والطاقية')}catch(e){alert(e.message)}}'''
s=s.replace(anchor,save+anchor,1)

p.write_text(s,encoding='utf-8')
