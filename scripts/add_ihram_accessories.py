from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')
old="function accItems(){return ['جوارب','أقلام','عطور','كبكات','سبح']}"
new="function accItems(){return ['جوارب','أقلام','عطور','كبكات','سبح','إحرام']}"
assert old in s, 'accessories categories anchor not found'
s=s.replace(old,new,1)
s=s.replace('<!-- pages-publish: accessories-final-simple-2026-08-25 -->','<!-- pages-publish: accessories-ihram-2026-08-25 -->',1)
p.write_text(s,encoding='utf-8')
