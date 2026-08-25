from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')
if 'id="shortShumaghBox"' in s:
    raise SystemExit(0)

s=s.replace('<!-- pages-publish: winter-manual-style-2026-08-24 -->','<!-- pages-publish: shumagh-manual-details-2026-08-25 -->',1)

needle='<button class="btn gold" onclick="saveWinterShortages()">حفظ نواقص الشتوي</button></div></div></div><div class="card wide"><div class="title">السجل</div>'
box='''<button class="btn gold" onclick="saveWinterShortages()">حفظ نواقص الشتوي</button></div></div><div id="shortShumaghBox" class="hidden"><div class="notice ok"><b>البحث الذكي — الأشمغة</b><div style="margin-top:5px">مرتبط بورقة Excel: Shumagh , Ghutra. اختر المقاس، ثم الصنف شماغ/غترة واللون أحمر/أبيض، واكتب النوع والخامة يدويًا.</div></div><div class="field"><label>ابحث عن المقاس</label><input id="shumaghSearch" oninput="renderShumaghResults()" placeholder="مثال: 55"></div><div id="shumaghResults" style="margin-top:10px"></div><div id="shumaghSelected" class="task hidden"><b id="shumaghChosenLabel">—</b><div class="mut" style="margin-top:5px">الأشمغة والغتر</div><div class="fields" style="margin-top:10px"><div class="field"><label>الصنف</label><select id="shumaghProduct"><option value="">اختر</option><option>شماغ</option><option>غترة</option></select></div><div class="field"><label>اللون</label><select id="shumaghColor"><option value="">اختر</option><option>أحمر</option><option>أبيض</option></select></div><div class="field"><label>النوع</label><input id="shumaghType" placeholder="مثال: اليزية"></div><div class="field"><label>الخامة</label><input id="shumaghMaterial" placeholder="مثال: 2155"></div></div><div class="fields" style="margin-top:10px"><div class="field"><label>الموجود حاليًا</label><input id="shumaghCurrent" inputmode="numeric" value="0"></div><div class="field"><label>المطلوب للتغذية</label><input id="shumaghRequested" inputmode="numeric" value="0"></div><div class="field"><label>الفرص الضائعة</label><input id="shumaghLost" inputmode="numeric" value="0"></div></div><div class="actions" style="justify-content:flex-start"><button class="btn" onclick="addShumaghDraft()">إضافة للنواقص</button></div></div><div class="title" style="margin-top:18px">طلب الأشمغة الحالي</div><div id="shumaghDraftList"><p class="mut">لم تتم إضافة أصناف بعد.</p></div><div class="actions"><span></span><button class="btn gold" onclick="saveShumaghShortages()">حفظ نواقص الأشمغة</button></div></div></div><div class="card wide"><div class="title">السجل</div>'''
assert needle in s, 'Winter box ending not found'
s=s.replace(needle,box,1)

old='winterSelectedItem=null,winterDraft=[];'
new='winterSelectedItem=null,winterDraft=[],shumaghSelectedItem=null,shumaghDraft=[];'
assert old in s, 'state marker not found'
s=s.replace(old,new,1)

marker='WINTER_CATALOG.forEach((x,i)=>x.i=i);'
cat="""WINTER_CATALOG.forEach((x,i)=>x.i=i);const SHUMAGH_SIZES=['40','42','46','50','52','54','55','56','58','60','62'];const SHUMAGH_CATALOG=SHUMAGH_SIZES.map(size=>({size,label:size,search:`${size} شماغ غترة أشمغة الأشمغة shumagh ghutra`}));SHUMAGH_CATALOG.forEach((x,i)=>x.i=i);"""
assert marker in s, 'catalog marker not found'
s=s.replace(marker,cat,1)

old="winterSelectedItem=null;winterDraft=[];$('shortSection')"
new="winterSelectedItem=null;winterDraft=[];shumaghSelectedItem=null;shumaghDraft=[];$('shortSection')"
assert old in s, 'reset marker not found'
s=s.replace(old,new,1)

old="isWinter=sec?.name==='الشتوي',isSmart="
new="isWinter=sec?.name==='الشتوي',isShumagh=sec?.name==='الأشمغة',isSmart="
assert old in s, 'route marker not found'
s=s.replace(old,new,1)
old='isZakhrafat||isRethobe||isSummer||isWinter;'
new='isZakhrafat||isRethobe||isSummer||isWinter||isShumagh;'
assert old in s, 'smart expression not found'
s=s.replace(old,new,1)
old="$('shortWinterBox').classList.toggle('hidden',!isWinter);"
new="$('shortWinterBox').classList.toggle('hidden',!isWinter);$('shortShumaghBox').classList.toggle('hidden',!isShumagh);"
assert old in s, 'toggle marker not found'
s=s.replace(old,new,1)
old="if(isWinter){winterSelectedItem=null;$('winterSelected').classList.add('hidden');$('winterSearch').value='';$('winterResults').innerHTML='<p class=\"mut\">ابدأ بالكتابة للبحث في مقاسات الشتوي.</p>';renderWinterDraft()}"
new=old+"if(isShumagh){shumaghSelectedItem=null;$('shumaghSelected').classList.add('hidden');$('shumaghSearch').value='';$('shumaghResults').innerHTML='<p class=\"mut\">ابدأ بالكتابة للبحث في مقاسات الأشمغة والغتر.</p>';renderShumaghDraft()}"
assert old in s, 'init marker not found'
s=s.replace(old,new,1)

anchor='function addShortRow()'
assert anchor in s, 'function anchor not found'
funcs=r'''function renderShumaghResults(){let q=$('shumaghSearch').value.trim().toLowerCase();if(!q){$('shumaghResults').innerHTML='<p class="mut">ابدأ بالكتابة للبحث في مقاسات الأشمغة والغتر.</p>';return}let rows=SHUMAGH_CATALOG.filter(x=>x.search.toLowerCase().includes(q)).slice(0,20);$('shumaghResults').innerHTML=rows.length?'<div class="actions" style="justify-content:flex-start;flex-wrap:wrap">'+rows.map(x=>`<button class="mini" onclick="selectShumaghItem(${x.i})">${esc(x.size)}</button>`).join('')+'</div>':'<div class="notice">لا يوجد مقاس مطابق في نموذج الأشمغة.</div>'}function selectShumaghItem(i){let x=SHUMAGH_CATALOG[i];if(!x)return;shumaghSelectedItem=x;$('shumaghChosenLabel').textContent=x.size;$('shumaghProduct').value='';$('shumaghColor').value='';$('shumaghType').value='';$('shumaghMaterial').value='';$('shumaghCurrent').value='0';$('shumaghRequested').value='0';$('shumaghLost').value='0';$('shumaghSelected').classList.remove('hidden')}function addShumaghDraft(){try{if(!shumaghSelectedItem)throw Error('اختر المقاس أولًا');let product=$('shumaghProduct').value.trim(),color=$('shumaghColor').value.trim(),kind=$('shumaghType').value.trim(),material=$('shumaghMaterial').value.trim();if(!product)throw Error('اختر الصنف شماغ أو غترة');if(!color)throw Error('اختر اللون');if(!kind)throw Error('اكتب النوع');if(!material)throw Error('اكتب الخامة');let label=`${shumaghSelectedItem.size} — ${product} — ${color} — ${kind} — ${material}`,section=$('shortSection').value,key=label.trim().toLowerCase(),dup=shortagesData.find(q=>{if(q.section_id!==section||String(q.size||'').trim().toLowerCase()!==key||q.shortage_status!=='تم الطلب')return false;let a=q.action_id?app.actions.find(z=>z.id===q.action_id):null;return !a||a.action_status!=='مغلق'});if(dup)throw Error(`هذا الصنف له طلب تغذية قائم بالفعل منذ ${dup.ordered_date||'—'}`);if(shumaghDraft.some(x=>x.label.trim().toLowerCase()===key))throw Error('هذا الصنف مضاف بالفعل في الطلب الحالي');let current=Number($('shumaghCurrent').value||0),requested=Number($('shumaghRequested').value||0),lost=Number($('shumaghLost').value||0);if([current,requested,lost].some(x=>Number.isNaN(x)||x<0))throw Error('أدخل الكميات بشكل صحيح');shumaghDraft.push({label,size:shumaghSelectedItem.size,product,color,kind,material,current_qty:current,requested_qty:requested,lost_opportunities:lost});renderShumaghDraft();shumaghSelectedItem=null;$('shumaghSelected').classList.add('hidden');$('shumaghSearch').value='';$('shumaghResults').innerHTML='<p class="mut">تمت الإضافة. ابحث عن مقاس آخر أو احفظ الطلب.</p>'}catch(e){alert(e.message)}}function removeShumaghDraft(i){shumaghDraft.splice(i,1);renderShumaghDraft()}function renderShumaghDraft(){$('shumaghDraftList').innerHTML=shumaghDraft.length?shumaghDraft.map((x,i)=>`<div class="task"><b>${esc(x.label)}</b><div class="mut" style="margin-top:6px">الموجود: ${x.current_qty} | المطلوب: ${x.requested_qty} | الفرص الضائعة: ${x.lost_opportunities}</div><div style="margin-top:8px"><button class="mini" style="color:#c83b3b;border-color:#efb4b4" onclick="removeShumaghDraft(${i})">حذف</button></div></div>`).join(''):'<p class="mut">لم تتم إضافة أصناف بعد.</p>'}'''
s=s.replace(anchor,funcs+anchor,1)

save_anchor='function setShortageFilter(id)'
assert save_anchor in s, 'save anchor not found'
save=r'''async function saveShumaghShortages(){try{let section=$('shortSection').value,sec=app.sections.find(s=>s.id===section);if(sec?.name!=='الأشمغة')throw Error('اختر قسم الأشمغة');if(!shumaghDraft.length)throw Error('أضف صنفًا واحدًا على الأقل');for(const row of shumaghDraft){let key=row.label.trim().toLowerCase(),dup=shortagesData.find(q=>{if(q.section_id!==section||String(q.size||'').trim().toLowerCase()!==key||q.shortage_status!=='تم الطلب')return false;let a=q.action_id?app.actions.find(z=>z.id===q.action_id):null;return !a||a.action_status!=='مغلق'});if(dup)throw Error(`يوجد طلب قائم للصنف ${row.label} منذ ${dup.ordered_date||'—'}`)}await api('shortage-save',{method:'POST',body:{section_id:section,reporter_employee_id:$('shortReporter').value,rows:shumaghDraft.map(x=>({size:x.label,current_qty:x.current_qty,requested_qty:x.requested_qty,lost_opportunities:x.lost_opportunities}))}});shumaghDraft=[];shumaghSelectedItem=null;shortagesData=await api('shortages');renderShumaghDraft();renderShortages();alert('تم حفظ نواقص الأشمغة')}catch(e){alert(e.message)}}'''
s=s.replace(save_anchor,save+save_anchor,1)

p.write_text(s,encoding='utf-8')
