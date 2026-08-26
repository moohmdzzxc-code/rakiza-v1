from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
old="function excelQty(name,label){let k=excelNorm(label);return excelRowsForSection(name).filter(x=>excelNorm(x.size)===k).reduce((n,x)=>n+Number(x.requested_qty||0),0)}"
new="function excelQty(name,label){let k=excelNorm(label),m=excelRowsForSection(name).filter(x=>excelNorm(x.size)===k);return m.length?m.reduce((n,x)=>n+Number(x.requested_qty||0),0):''}"
assert old in s,'excelQty helper not found'
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
