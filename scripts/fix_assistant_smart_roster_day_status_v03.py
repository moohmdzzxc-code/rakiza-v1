from pathlib import Path

p=Path('index.html')
s=p.read_text(encoding='utf-8')
old="let ctx=seg.slice(Math.max(0,best-12),Math.min(seg.length,best+bestAlias.length+18)),st=assistantRosterShiftFromText(ctx)||'D/O';dayRules.push({emp:m.emp,day,status:st});"
new="let after=seg.slice(best+bestAlias.length,Math.min(seg.length,best+bestAlias.length+18)),st=assistantRosterShiftFromText(after)||'D/O';dayRules.push({emp:m.emp,day,status:st});"
assert old in s, 'day status parser anchor not found'
s=s.replace(old,new,1)
p.write_text(s,encoding='utf-8')
