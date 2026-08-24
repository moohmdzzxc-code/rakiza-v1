from pathlib import Path
import re

p=Path('index.html')
s=p.read_text(encoding='utf-8')

repls={
"<b>البحث الذكي — الولادي</b>":"<b>البحث الذكي — الحركات</b>",
"طلب الولادي الحالي":"طلب الحركات الحالي",
"حفظ نواقص الولادي":"حفظ نواقص الحركات",
"ابدأ بالكتابة للبحث في مقاسات وفئات الولادي.":"ابدأ بالكتابة للبحث في مقاسات وفئات الحركات.",
"school الولادي":"school الحركات",
"sec?.name==='الولادي'":"sec?.name==='الحركات'",
"if(sec?.name!=='الولادي')throw Error('اختر قسم الولادي')":"if(sec?.name!=='الحركات')throw Error('اختر قسم الحركات')",
"alert('تم حفظ نواقص الولادي')":"alert('تم حفظ نواقص الحركات')",
}
for a,b in repls.items():
    assert a in s, f'missing marker: {a}'
    s=s.replace(a,b)

# Include Harakat in shortage section picker/filter even though its display order is after the original ten sections.
s=s.replace("app.sections.filter(s=>s.display_order<=10).map(s=>`<option", "app.sections.filter(s=>s.display_order<=10||s.name==='الحركات').map(s=>`<option", 1)
s=s.replace("let secs=app.sections.filter(s=>s.display_order<=10),rows=", "let secs=app.sections.filter(s=>s.display_order<=10||s.name==='الحركات'),rows=", 1)

# User-facing helper text: this Rakiza section is mapped to the School workbook sheet.
s=s.replace('مطابق لنموذج School. ابحث بالمقاس أو الفئة Boys / Youth / Men ثم اختر الصنف وأدخل الكميات.','مرتبط بنموذج Excel: School. ابحث بالمقاس أو الفئة Boys / Youth / Men ثم اختر الصنف وأدخل الكميات.',1)

publish='<!-- pages-publish: harakat-school-mapping-2026-08-24 -->'
s=re.sub(r'<!-- pages-publish: [^>]+ -->',publish,s,count=1)
if publish not in s:
    s=s.replace('<title>ركيزة V1</title>','<title>ركيزة V1</title>'+publish,1)

p.write_text(s,encoding='utf-8')
