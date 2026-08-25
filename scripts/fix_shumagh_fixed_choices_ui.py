from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')

s=s.replace('.mini.bad.on{background:#fde4e4}', '.mini.bad.on{background:#fde4e4}.fixedChoices .mini.on{background:var(--n);color:#fff;border-color:var(--n)}',1)
s=s.replace('id="shumaghSizeChoices" class="actions"','id="shumaghSizeChoices" class="actions fixedChoices"',1)
s=s.replace('id="shumaghProductChoices" class="actions"','id="shumaghProductChoices" class="actions fixedChoices"',1)
s=s.replace('id="shumaghColorChoices" class="actions"','id="shumaghColorChoices" class="actions fixedChoices"',1)
old="shumaghDraft=[];shumaghSelectedItem=null;shortagesData=await api('shortages');renderShumaghDraft();renderShortages();alert('تم حفظ نواقص الأشمغة')"
new="shumaghDraft=[];shumaghSelectedItem=null;shumaghProductChoice='';shumaghColorChoice='';shortagesData=await api('shortages');renderShumaghFixedControls();renderShumaghDraft();renderShortages();alert('تم حفظ نواقص الأشمغة')"
assert old in s, 'save reset marker not found'
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
