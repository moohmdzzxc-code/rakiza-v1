from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
old='<!-- pages-publish: action-controls-2026-08-22 -->'
new='<!-- pages-publish: shortage-order-ui-2026-08-24-0945 -->'
if old in s:
    s=s.replace(old,new,1)
elif new not in s:
    s=s.replace('<title>ركيزة V1</title>','<title>ركيزة V1</title>'+new,1)
assert '>تم الطلب</button>' in s, 'تم الطلب button missing from current index'
p.write_text(s,encoding='utf-8')
