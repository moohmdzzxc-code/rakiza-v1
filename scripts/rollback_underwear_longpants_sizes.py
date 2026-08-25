from pathlib import Path
import re

p=Path('index.html')
s=p.read_text(encoding='utf-8')
s=re.sub(r'<!-- pages-publish:[^>]+-->', '<!-- pages-publish: underwear-flow-v2-2026-08-25 -->', s, count=1)

pairs=[
("'سروال طويل':['18','20','22','24','26','28','30','S','M','L','XL','XXL','XXXL']","'سروال طويل':['18K','18K-XXL','20K','20K-XXL','20R','22K','22R','24K','24R','26K','26R','28K','28R','30K','30K-XXL','S','M','L','XL','XXL','XXXL']"),
("'سروال طويل':['30','32','34','36','38']","'سروال طويل':['30K','30R','32K','32R','34K','34R','36K','36R','38K','38R']"),
("'سروال طويل':['16','18','20','22','24','26','28','29']","'سروال طويل':['16R','18R','20R','22R','24R','26K','26R','28K','28R','29K','29R']")]
for old,new in pairs:
    assert old in s, old
    s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
