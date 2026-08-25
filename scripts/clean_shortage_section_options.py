from pathlib import Path
import re

p=Path('index.html')
s=p.read_text(encoding='utf-8')
s=re.sub(r'<!-- pages-publish:[^>]+-->', '<!-- pages-publish: shortages-sections-clean-2026-08-25 -->', s, count=1)

final_names="['الفاخر','الأعمال','الكلاسيك','الأشمغة','الداخليات','الحركات','الزخرفات','ري ثوب','الصيفي','الشتوي','العقال والطاقية','الجلابيات والبيجامات','الإكسسوارات والجوارب']"

old="app.sections.filter(s=>(s.display_order<=10&&s.name!=='الزخرفات والري ثوب'&&s.name!=='الجلابيات')||['الحركات','الزخرفات','ري ثوب','الصيفي','الشتوي','العقال والطاقية','الجلابيات والبيجامات','الإكسسوارات والجوارب'].includes(s.name))"
new=f"app.sections.filter(s=>{final_names}.includes(s.name))"
assert old in s, 'registration section filter not found'
s=s.replace(old,new,1)

old2="let secs=app.sections.filter(s=>s.display_order<=10||['الحركات','الزخرفات','ري ثوب','الصيفي','الشتوي','العقال والطاقية','الجلابيات والبيجامات','الإكسسوارات والجوارب'].includes(s.name)),rows=shortageSectionFilter?shortagesData.filter(x=>x.section_id===shortageSectionFilter):shortagesData;"
new2=f"let secs=app.sections.filter(s=>{final_names}.includes(s.name)),rows=shortageSectionFilter?shortagesData.filter(x=>x.section_id===shortageSectionFilter):shortagesData;"
assert old2 in s, 'archive filter not found'
s=s.replace(old2,new2,1)

p.write_text(s,encoding='utf-8')
