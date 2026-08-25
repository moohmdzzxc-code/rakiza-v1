from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')

# Publish marker
import re
s=re.sub(r'<!-- pages-publish:[^>]+-->', '<!-- pages-publish: underwear-fixed-2026-08-25 -->', s, count=1)

# UI block: insert before nightrobe block
anchor='<div id="shortNightrobeBox" class="hidden">'
assert anchor in s, 'nightrobe UI anchor not found'
ui='''<div id="shortUnderwearBox" class="hidden"><div class="notice ok"><b>الداخليات U.W</b><div style="margin-top:5px">اختر الصنف والفئة والمقاس. الرجالي فقط يظهر له Standard أو فرزاتشي، أما الشبابي والولادي فـ Standard ثابت تلقائيًا.</div></div><div class="title" style="margin-top:14px">الصنف</div><div id="uwProductChoices" class="actions fixedChoices" style="justify-content:flex-start;flex-wrap:wrap"></div><div id="uwGenerationArea" class="hidden"><div class="title" style="margin-top:14px">الفئة</div><div id="uwGenerationChoices" class="actions fixedChoices" style="justify-content:flex-start;flex-wrap:wrap"></div></div><div id="uwSizeArea" class="hidden"><div class="title" style="margin-top:14px">المقاس</div><div id="uwSizeChoices" class="actions fixedChoices" style="justify-content:flex-start;flex-wrap:wrap"></div></div><div id="uwStyleArea" class="hidden"><div class="title" style="margin-top:14px">النوع</div><div id="uwStyleChoices" class="actions fixedChoices" style="justify-content:flex-start;flex-wrap:wrap"><button class="mini" data-value="Standard" onclick="selectUwStyle('Standard',this)">Standard</button><button class="mini" data-value="فرزاتشي" onclick="selectUwStyle('فرزاتشي',this)">فرزاتشي</button></div></div><div id="uwSummary" class="notice" style="margin-top:14px">اختر الصنف.</div><div id="uwSelected" class="task hidden"><div class="fields"><div class="field"><label>الموجود حاليًا</label><input id="uwCurrent" inputmode="numeric" value="0"></div><div class="field"><label>المطلوب للتغذية</label><input id="uwRequested" inputmode="numeric" value="0"></div><div class="field"><label>الفرص الضائعة</label><input id="uwLost" inputmode="numeric" value="0"></div></div><div class="actions" style="justify-content:flex-start"><button class="btn" onclick="addUwDraft()">إضافة للنواقص</button></div></div><div class="title" style="margin-top:18px">طلب الداخليات الحالي</div><div id="uwDraftList"><p class="mut">لم تتم إضافة أصناف بعد.</p></div><div class="actions"><span></span><button class="btn gold" onclick="saveUwShortages()">حفظ نواقص الداخليات</button></div></div>'''
s=s.replace(anchor,ui+anchor,1)

# State variables
old='nightType="",nightSize="",nightDraft=[],accCategory="",accDraft=[];'
new='uwProduct="",uwGeneration="",uwSize="",uwStyle="",uwDraft=[],nightType="",nightSize="",nightDraft=[],accCategory="",accDraft=[];'
assert old in s, 'state anchor not found'
s=s.replace(old,new,1)

# Catalog constants before EGAL constants
anchor2="const EGAL_BOYS_SIZES="
assert anchor2 in s, 'catalog anchor not found'
consts="""const UW_GENERATION_AR={Men:'رجالي',Youth:'شبابي',Boys:'ولادي'};const UW_MAP={
'Shirt Crew':{Men:['S','M','L','XL','XXL','XXXL']},
'Shirt High Neck':{Men:['S','M','L','XL','XXL','XXXL']},
'Shirt Tank':{Men:['S','M','L','XL','XXL','XXXL']},
'Boxer Brief':{Men:['S','M','L','XL','XXL','XXXL']},
'Pants Long':{Men:['18K','18K-XXL','20K','20K-XXL','20R','22K','22R','24K','24R','26K','26R','28K','28R','30K','30K-XXL','S','M','L','XL','XXL','XXXL'],Boys:['16R','18R','20R','22R','24R','26K','26R','28K','28R','29K','29R'],Youth:['30K','30R','32K','32R','34K','34R','36K','36R','38K','38R']},
'Shirt & Boxer Set':{Boys:['1 - 2','3 - 4','5 - 6','7 - 8'],Youth:['9 - 10','11 - 12','13 - 14','15 - 16']}
};"""
s=s.replace(anchor2,consts+anchor2,1)

# Reset when opening shortages
old_reset='nightType="";nightSize="";nightDraft=[];accCategory="";accDraft=[];'
new_reset='uwProduct="";uwGeneration="";uwSize="";uwStyle="";uwDraft=[];nightType="";nightSize="";nightDraft=[];accCategory="";accDraft=[];'
assert old_reset in s, 'open shortages reset anchor not found'
s=s.replace(old_reset,new_reset,1)

# Add smart section detection
old_detect="isEgalHat=sec?.name==='العقال والطاقية',isNight=sec?.name==='الجلابيات والبيجامات',isAcc=sec?.name==='الإكسسوارات والجوارب',isSmart=isFakher||isBusiness||isSchool||isClassic||isZakhrafat||isRethobe||isSummer||isWinter||isShumagh||isEgalHat||isNight||isAcc;"
new_detect="isEgalHat=sec?.name==='العقال والطاقية',isUw=sec?.name==='الداخليات',isNight=sec?.name==='الجلابيات والبيجامات',isAcc=sec?.name==='الإكسسوارات والجوارب',isSmart=isFakher||isBusiness||isSchool||isClassic||isZakhrafat||isRethobe||isSummer||isWinter||isShumagh||isEgalHat||isUw||isNight||isAcc;"
assert old_detect in s, 'smart detection anchor not found'
s=s.replace(old_detect,new_detect,1)

old_toggle="$('shortEgalHatBox').classList.toggle('hidden',!isEgalHat);$('shortNightrobeBox').classList.toggle('hidden',!isNight);"
new_toggle="$('shortEgalHatBox').classList.toggle('hidden',!isEgalHat);$('shortUnderwearBox').classList.toggle('hidden',!isUw);$('shortNightrobeBox').classList.toggle('hidden',!isNight);"
assert old_toggle in s, 'toggle anchor not found'
s=s.replace(old_toggle,new_toggle,1)

old_init="if(isEgalHat){egalHatMode='';egalCategory='';egalBoysSize='';egalMenHead='';egalThickness='';egalHatType='';$('egalHatSelected').classList.add('hidden');renderEgalHatControls();renderEgalHatDraft()}if(isNight){"
new_init="if(isEgalHat){egalHatMode='';egalCategory='';egalBoysSize='';egalMenHead='';egalThickness='';egalHatType='';$('egalHatSelected').classList.add('hidden');renderEgalHatControls();renderEgalHatDraft()}if(isUw){uwProduct='';uwGeneration='';uwSize='';uwStyle='';$('uwSelected').classList.add('hidden');renderUwControls();renderUwDraft()}if(isNight){"
assert old_init in s, 'init anchor not found'
s=s.replace(old_init,new_init,1)

# Underwear functions before Nightrobe functions
anchor3='function renderNightrobeControls()'
assert anchor3 in s, 'nightrobe function anchor not found'
funcs="""function uwProducts(){return Object.keys(UW_MAP)}function uwGenerations(){return uwProduct?Object.keys(UW_MAP[uwProduct]||{}):[]}function renderUwControls(){$('uwProductChoices').innerHTML=uwProducts().map(v=>`<button class=\"mini ${uwProduct===v?'on':''}\" onclick=\"selectUwProduct('${v.replace(/'/g,"\\\\'")}',this)\">${esc(v)}</button>`).join('');let gens=uwGenerations();$('uwGenerationArea').classList.toggle('hidden',!uwProduct||gens.length<=1);$('uwGenerationChoices').innerHTML=gens.map(v=>`<button class=\"mini ${uwGeneration===v?'on':''}\" onclick=\"selectUwGeneration('${v}',this)\">${esc(UW_GENERATION_AR[v]||v)}</button>`).join('');let sizes=uwProduct&&uwGeneration?(UW_MAP[uwProduct]?.[uwGeneration]||[]):[];$('uwSizeArea').classList.toggle('hidden',!uwGeneration);$('uwSizeChoices').innerHTML=sizes.map(v=>`<button class=\"mini ${uwSize===v?'on':''}\" onclick=\"selectUwSize('${v}',this)\">${esc(v)}</button>`).join('');let isMen=uwGeneration==='Men';$('uwStyleArea').classList.toggle('hidden',!(isMen&&uwSize));document.querySelectorAll('#uwStyleChoices .mini').forEach(b=>b.classList.toggle('on',b.dataset.value===uwStyle));updateUwSummary()}function selectUwProduct(v,b){uwProduct=v;let gens=Object.keys(UW_MAP[v]||{});uwGeneration=gens.length===1?gens[0]:'';uwSize='';uwStyle=uwGeneration&&uwGeneration!=='Men'?'Standard':'';renderUwControls()}function selectUwGeneration(v,b){uwGeneration=v;uwSize='';uwStyle=v==='Men'?'':'Standard';renderUwControls()}function selectUwSize(v,b){uwSize=v;if(uwGeneration!=='Men')uwStyle='Standard';else uwStyle='';renderUwControls()}function selectUwStyle(v,b){if(uwGeneration!=='Men')return;uwStyle=v;renderUwControls()}function uwCurrentLabel(){if(!uwProduct||!uwGeneration||!uwSize)return'';let style=uwGeneration==='Men'?uwStyle:'Standard';if(!style)return'';return `${uwProduct} — ${UW_GENERATION_AR[uwGeneration]||uwGeneration} — ${uwSize} — ${style}`}function updateUwSummary(){let label=uwCurrentLabel();if(label){$('uwSummary').innerHTML=`المحدد: <b>${esc(label)}</b>`;$('uwSelected').classList.remove('hidden');$('uwCurrent').value='0';$('uwRequested').value='0';$('uwLost').value='0';return}let msg='اختر الصنف.';if(uwProduct&&!uwGeneration)msg='اختر الفئة.';else if(uwGeneration&&!uwSize)msg='اختر المقاس.';else if(uwGeneration==='Men'&&uwSize&&!uwStyle)msg='اختر Standard أو فرزاتشي.';$('uwSummary').textContent=msg;$('uwSelected').classList.add('hidden')}function addUwDraft(){try{let label=uwCurrentLabel();if(!label)throw Error('أكمل اختيار الصنف');let section=$('shortSection').value,key=label.trim().toLowerCase(),dup=shortagesData.find(q=>{if(q.section_id!==section||String(q.size||'').trim().toLowerCase()!==key||q.shortage_status!=='تم الطلب')return false;let a=q.action_id?app.actions.find(z=>z.id===q.action_id):null;return !a||a.action_status!=='مغلق'});if(dup)throw Error(`هذا الصنف له طلب تغذية قائم بالفعل منذ ${dup.ordered_date||'—'}`);if(uwDraft.some(x=>x.label.trim().toLowerCase()===key))throw Error('هذا الصنف مضاف بالفعل في الطلب الحالي');let current=Number($('uwCurrent').value||0),requested=Number($('uwRequested').value||0),lost=Number($('uwLost').value||0);if([current,requested,lost].some(x=>Number.isNaN(x)||x<0))throw Error('أدخل الكميات بشكل صحيح');uwDraft.push({label,current_qty:current,requested_qty:requested,lost_opportunities:lost});renderUwDraft();$('uwCurrent').value='0';$('uwRequested').value='0';$('uwLost').value='0'}catch(e){alert(e.message)}}function removeUwDraft(i){uwDraft.splice(i,1);renderUwDraft()}function renderUwDraft(){$('uwDraftList').innerHTML=uwDraft.length?uwDraft.map((x,i)=>`<div class=\"task\"><b>${esc(x.label)}</b><div class=\"mut\" style=\"margin-top:6px\">الموجود: ${x.current_qty} | المطلوب: ${x.requested_qty} | الفرص الضائعة: ${x.lost_opportunities}</div><div style=\"margin-top:8px\"><button class=\"mini\" style=\"color:#c83b3b;border-color:#efb4b4\" onclick=\"removeUwDraft(${i})\">حذف</button></div></div>`).join(''):'<p class=\"mut\">لم تتم إضافة أصناف بعد.</p>'}"""
s=s.replace(anchor3,funcs+anchor3,1)

# Save function before nightrobe save
anchor4='async function saveNightrobeShortages()'
assert anchor4 in s, 'nightrobe save anchor not found'
savefunc="""async function saveUwShortages(){try{let section=$('shortSection').value,sec=app.sections.find(s=>s.id===section);if(sec?.name!=='الداخليات')throw Error('اختر قسم الداخليات');if(!uwDraft.length)throw Error('أضف صنفًا واحدًا على الأقل');for(const row of uwDraft){let key=row.label.trim().toLowerCase(),dup=shortagesData.find(q=>{if(q.section_id!==section||String(q.size||'').trim().toLowerCase()!==key||q.shortage_status!=='تم الطلب')return false;let a=q.action_id?app.actions.find(z=>z.id===q.action_id):null;return !a||a.action_status!=='مغلق'});if(dup)throw Error(`يوجد طلب قائم للصنف ${row.label} منذ ${dup.ordered_date||'—'}`)}await api('shortage-save',{method:'POST',body:{section_id:section,reporter_employee_id:$('shortReporter').value,rows:uwDraft.map(x=>({size:x.label,current_qty:x.current_qty,requested_qty:x.requested_qty,lost_opportunities:x.lost_opportunities}))}});uwDraft=[];uwProduct='';uwGeneration='';uwSize='';uwStyle='';shortagesData=await api('shortages');renderUwControls();renderUwDraft();renderShortages();alert('تم حفظ نواقص الداخليات')}catch(e){alert(e.message)}}"""
s=s.replace(anchor4,savefunc+anchor4,1)

p.write_text(s,encoding='utf-8')
