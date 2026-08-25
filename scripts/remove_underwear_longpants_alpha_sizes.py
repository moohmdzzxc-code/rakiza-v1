from pathlib import Path
import re

p=Path('index.html')
s=p.read_text(encoding='utf-8')
s=re.sub(r'<!-- pages-publish:[^>]+-->', '<!-- pages-publish: underwear-longpants-remove-alpha-2026-08-25 -->', s, count=1)
old="'سروال طويل':['18K','18K-XXL','20K','20K-XXL','20R','22K','22R','24K','24R','26K','26R','28K','28R','30K','30K-XXL','S','M','L','XL','XXL','XXXL']"
new="'سروال طويل':['18K','18K-XXL','20K','20K-XXL','20R','22K','22R','24K','24R','26K','26R','28K','28R','30K','30K-XXL']"
assert old in s, 'men standard long pants list not found in expected state'
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
