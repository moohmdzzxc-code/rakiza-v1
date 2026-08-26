from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
old='<script src="shortage-export.js?v=20260826"></script>'
assert old in s,'duplicate shortage-export reference not found'
s=s.replace(old,'',1)
p.write_text(s,encoding='utf-8')
