from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')

s=s.replace('<!-- pages-publish: shumagh-fixed-choices-2026-08-25 -->','<!-- pages-publish: ghutra-white-only-2026-08-25 -->',1)

old='<div class="title" style="margin-top:14px">اللون</div><div id="shumaghColorChoices"'
new='<div id="shumaghColorTitle" class="title" style="margin-top:14px">اللون</div><div id="shumaghColorChoices"'
assert old in s, 'color title marker not found'
s=s.replace(old,new,1)

old="function selectShumaghProduct(v,b){shumaghProductChoice=v;document.querySelectorAll('#shumaghProductChoices .mini').forEach(x=>x.classList.remove('on'));b?.classList.add('on');updateShumaghFixedSummary()}"
new="function selectShumaghProduct(v,b){shumaghProductChoice=v;shumaghColorChoice=v==='غترة'?'أبيض':'';document.querySelectorAll('#shumaghProductChoices .mini').forEach(x=>x.classList.remove('on'));b?.classList.add('on');updateShumaghFixedSummary()}"
assert old in s, 'product function marker not found'
s=s.replace(old,new,1)

old="function updateShumaghFixedSummary(){let ready=shumaghSelectedItem&&shumaghProductChoice&&shumaghColorChoice;$('shumaghFixedSummary').innerHTML=ready?`المحدد: <b>${esc(shumaghSelectedItem.size)} — ${esc(shumaghProductChoice)} — ${esc(shumaghColorChoice)}</b>`:'اختر المقاس والصنف واللون.';$('shumaghSelected').classList.toggle('hidden',!ready);if(ready){$('shumaghType').value='';$('shumaghMaterial').value='';$('shumaghCurrent').value='0';$('shumaghRequested').value='0';$('shumaghLost').value='0'}}"
new="function updateShumaghFixedSummary(){let colorNeeded=shumaghProductChoice==='شماغ';$('shumaghColorTitle').classList.toggle('hidden',!colorNeeded);$('shumaghColorChoices').classList.toggle('hidden',!colorNeeded);document.querySelectorAll('#shumaghColorChoices .mini').forEach(b=>b.classList.toggle('on',b.dataset.value===shumaghColorChoice));let ready=shumaghSelectedItem&&shumaghProductChoice&&(shumaghProductChoice==='غترة'||shumaghColorChoice);$('shumaghFixedSummary').innerHTML=ready?(shumaghProductChoice==='غترة'?`المحدد: <b>${esc(shumaghSelectedItem.size)} — غترة</b>`:`المحدد: <b>${esc(shumaghSelectedItem.size)} — شماغ — ${esc(shumaghColorChoice)}</b>`):(shumaghProductChoice==='شماغ'?'اختر المقاس واللون.':'اختر المقاس والصنف.');$('shumaghSelected').classList.toggle('hidden',!ready);if(ready){$('shumaghType').value='';$('shumaghMaterial').value='';$('shumaghCurrent').value='0';$('shumaghRequested').value='0';$('shumaghLost').value='0'}}"
assert old in s, 'summary function marker not found'
s=s.replace(old,new,1)

p.write_text(s,encoding='utf-8')
