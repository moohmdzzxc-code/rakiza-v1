from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
old="});shortagesData=await api('shortages');renderShortages()}function actionDisplayStatus"
new="function actionDisplayStatus"
assert old in s,'stale shortage-close tail not found'
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
