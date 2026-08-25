from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')

# publish marker
if '<!-- pages-publish: accessories-simple-2026-08-25 -->' not in s:
    start=s.find('<!-- pages-publish:')
    if start!=-1:
        end=s.find('-->',start)
        s=s[:start]+'<!-- pages-publish: accessories-simple-2026-08-25 -->'+s[end+3:]

# UI block
if 'id="shortAccessoriesBox"' not in s:
    marker='<div class="actions"><span></span><button class="btn gold" onclick="saveNightrobeShortages()">حفظ نواقص الجلابيات والبيجامات</button></div></div><div class="card wide"><div class="title">السجل</div>'
    assert marker in s, 'nightrobe end marker not found'
    block='''<div class="actions"><span></span><button class="btn gold" onclick="saveNightrobeShortages()">حفظ نواقص الجلابيات والبيجامات</button></div></div><div id="shortAccessoriesBox" class="hidden"><div class="notice ok"><b>الإكسسوارات والجوارب</b><div style="margin-top:5px">اختر التصنيف الثابت، ثم اكتب نوع الصنف والكمية المطلوبة والفرص الضائعة فقط.</div></div><div class="title" style="margin-top:14px">التصنيف</div><div id="accCategoryChoices" class="actions fixedChoices" style="justify-content:flex-start;flex-wrap:wrap"></div><div id="accSummary" class="notice" style="margin-top:14px">اختر التصنيف.</div><div id="accSelected" class="task hidden"><div class="field"><label>نوع الصنف</label><input id="accItemType" placeholder="اكتب نوع الصنف المطلوب"></div><div class="fields" style="margin-top:10px"><div class="field"><label>الكمية المطلوبة</label><input id="accRequested" inputmode="numeric" value="0"></div><div class="field"><label>الفرص الضائعة</label><input id="accLost" inputmode="numeric" value="0"></div></div><div class="actions" style="justify-content:flex-start"><button class="btn" onclick="addAccessoriesDraft()">إضافة للنواقص</button></div></div><div class="title" style="margin-top:18px">طلب الإكسسوارات والجوارب الحالي</div><div id="accDraftList"><p class="mut">لم تتم إضافة أصناف بعد.</p></div><div class="actions"><span></span><button class="btn gold" onclick="saveAccessoriesShortages()">حفظ نواقص الإكسسوارات والجوارب</button></div></div><div class="card wide"><div class="title">السجل</div>'''
    s=s.replace(marker,block,1)

# state and constants
if 'accCategory="",accDraft=[]' not in s:
    marker='nightType="",nightSize="",nightDraft=[];'
    assert marker in s, 'night state marker not found'
    s=s.replace(marker,'nightType="",nightSize="",nightDraft=[],accCategory="",accDraft=[];',1)
if 'const ACC_CATEGORIES=' not in s:
    marker='const NIGHTROBE_SIZE_MAP='
    assert marker in s, 'night map marker not found'
    s=s.replace(marker,"const ACC_CATEGORIES=['جوارب','أقلام','عطور','كبكات','سبح'];const NIGHTROBE_SIZE_MAP=",1)

# reset on open shortages
if 'nightDraft=[];accCategory="";accDraft=[];' not in s:
    marker='nightType="";nightSize="";nightDraft=[];'
    assert marker in s, 'open shortages reset marker not found'
    s=s.replace(marker,'nightType="";nightSize="";nightDraft=[];accCategory="";accDraft=[];',1)

# include section in registration/archive lists
s=s.replace("'الجلابيات والبيجامات'].includes(s.name)","'الجلابيات والبيجامات','الإكسسوارات والجوارب'].includes(s.name)")

# smart routing
if "isAccessories=sec?.name==='الإكسسوارات والجوارب'" not in s:
    marker="isNight=sec?.name==='الجلابيات والبيجامات',isSmart="
    assert marker in s, 'smart routing marker not found'
    s=s.replace(marker,"isNight=sec?.name==='الجلابيات والبيجامات',isAccessories=sec?.name==='الإكسسوارات والجوارب',isSmart=",1)
    marker='||isNight;'
    assert marker in s, 'smart routing tail not found'
    s=s.replace(marker,'||isNight||isAccessories;',1)

# box toggle
if "$('shortAccessoriesBox').classList.toggle('hidden',!isAccessories);" not in s:
    marker="$('shortNightrobeBox').classList.toggle('hidden',!isNight);"
    assert marker in s, 'night box toggle marker not found'
    s=s.replace(marker,marker+"$('shortAccessoriesBox').classList.toggle('hidden',!isAccessories);",1)

# section init
if 'if(isAccessories){accCategory=' not in s:
    marker="if(isNight){nightType='';nightSize='';$('nightSelected').classList.add('hidden');renderNightrobeControls();renderNightrobeDraft()}}function renderFakherResults()"
    assert marker in s, 'night init marker not found'
    repl="if(isNight){nightType='';nightSize='';$('nightSelected').classList.add('hidden');renderNightrobeControls();renderNightrobeDraft()}if(isAccessories){accCategory='';$('accSelected').classList.add('hidden');renderAccessoriesControls();renderAccessoriesDraft()}}function renderFakherResults()"
    s=s.replace(marker,repl,1)

# accessory functions
if 'function renderAccessoriesControls()' not in s:
    marker='function addShortRow()'
    assert marker in s, 'addShortRow marker not found'
    funcs="""function renderAccessoriesControls(){$('accCategoryChoices').innerHTML=ACC_CATEGORIES.map(v=>`<button class=\"mini ${accCategory===v?'on':''}\" onclick=\"selectAccessoriesCategory('${v}',this)\">${esc(v)}</button>`).join('');updateAccessoriesSummary()}function selectAccessoriesCategory(v,b){accCategory=v;renderAccessoriesControls()}function updateAccessoriesSummary(){let ready=!!accCategory;$('accSummary').innerHTML=ready?`المحدد: <b>${esc(accCategory)}</b>`:'اختر التصنيف.';$('accSelected').classList.toggle('hidden',!ready);if(ready){$('accItemType').value='';$('accRequested').value='0';$('accLost').value='0'}}function addAccessoriesDraft(){try{if(!accCategory)throw Error('اختر التصنيف');let itemType=$('accItemType').value.trim();if(!itemType)throw Error('اكتب نوع الصنف');let label=`${accCategory} — ${itemType}`,section=$('shortSection').value,key=label.trim().toLowerCase(),dup=shortagesData.find(q=>{if(q.section_id!==section||String(q.size||'').trim().toLowerCase()!==key||q.shortage_status!=='تم الطلب')return false;let a=q.action_id?app.actions.find(z=>z.id===q.action_id):null;return !a||a.action_status!=='مغلق'});if(dup)throw Error(`هذا الصنف له طلب تغذية قائم بالفعل منذ ${dup.ordered_date||'—'}`);if(accDraft.some(x=>x.label.trim().toLowerCase()===key))throw Error('هذا الصنف مضاف بالفعل في الطلب الحالي');let requested=Number($('accRequested').value||0),lost=Number($('accLost').value||0);if([requested,lost].some(x=>Number.isNaN(x)||x<0))throw Error('أدخل الكمية والفرص بشكل صحيح');accDraft.push({label,category:accCategory,item_type:itemType,requested_qty:requested,lost_opportunities:lost});renderAccessoriesDraft();$('accItemType').value='';$('accRequested').value='0';$('accLost').value='0'}catch(e){alert(e.message)}}function removeAccessoriesDraft(i){accDraft.splice(i,1);renderAccessoriesDraft()}function renderAccessoriesDraft(){$('accDraftList').innerHTML=accDraft.length?accDraft.map((x,i)=>`<div class=\"task\"><b>${esc(x.label)}</b><div class=\"mut\" style=\"margin-top:6px\">المطلوب: ${x.requested_qty} | الفرص الضائعة: ${x.lost_opportunities}</div><div style=\"margin-top:8px\"><button class=\"mini\" style=\"color:#c83b3b;border-color:#efb4b4\" onclick=\"removeAccessoriesDraft(${i})\">حذف</button></div></div>`).join(''):'<p class=\"mut\">لم تتم إضافة أصناف بعد.</p>'}"""
    s=s.replace(marker,funcs+marker,1)

# save function
if 'async function saveAccessoriesShortages()' not in s:
    marker='function setShortageFilter(id)'
    assert marker in s, 'shortage filter marker not found'
    fn="""async function saveAccessoriesShortages(){try{let section=$('shortSection').value,sec=app.sections.find(s=>s.id===section);if(sec?.name!=='الإكسسوارات والجوارب')throw Error('اختر قسم الإكسسوارات والجوارب');if(!accDraft.length)throw Error('أضف صنفًا واحدًا على الأقل');for(const row of accDraft){let key=row.label.trim().toLowerCase(),dup=shortagesData.find(q=>{if(q.section_id!==section||String(q.size||'').trim().toLowerCase()!==key||q.shortage_status!=='تم الطلب')return false;let a=q.action_id?app.actions.find(z=>z.id===q.action_id):null;return !a||a.action_status!=='مغلق'});if(dup)throw Error(`يوجد طلب قائم للصنف ${row.label} منذ ${dup.ordered_date||'—'}`)}await api('shortage-save',{method:'POST',body:{section_id:section,reporter_employee_id:$('shortReporter').value,rows:accDraft.map(x=>({size:x.label,current_qty:0,requested_qty:x.requested_qty,lost_opportunities:x.lost_opportunities}))}});accDraft=[];accCategory='';shortagesData=await api('shortages');renderAccessoriesControls();renderAccessoriesDraft();renderShortages();alert('تم حفظ نواقص الإكسسوارات والجوارب')}catch(e){alert(e.message)}}"""
    s=s.replace(marker,fn+marker,1)

p.write_text(s,encoding='utf-8')
