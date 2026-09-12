from pathlib import Path
p=Path('rakiza-ai-shortages.js')
s=p.read_text(encoding='utf-8')
old="  else if(recurWords||/كم مره|يرجع/.test(n)){spec.metric='recurrence';explicit.metric=true}\n\n  if(/بعد.*تغذ|بعد ما.*وصل|رجع.*بعد|يتكرر.*تغذ/.test(n)){spec.task='rank';spec.metric='recur_after_supply';explicit.task=true;explicit.metric=true}"
new="  else if(recurWords||/كم مره|يرجع/.test(n)){spec.metric='recurrence';explicit.metric=true}\n\n  if(spec.metric==='age'&&!explicit.task){spec.task='metric';explicit.task=true}\n  if(/بعد.*تغذ|بعد ما.*وصل|رجع.*بعد|يتكرر.*تغذ/.test(n)){spec.task='rank';spec.metric='recur_after_supply';explicit.task=true;explicit.metric=true}"
if old not in s: raise SystemExit('age task patch target missing')
p.write_text(s.replace(old,new,1),encoding='utf-8')
