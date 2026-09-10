from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
anchor="async function askRakizaAssistant(){"
if anchor not in s:
    raise SystemExit('askRakizaAssistant anchor not found')
helper=r'''function assistantLooksLikeRosterInstruction(text){
  let t=assistantRosterTextNorm(text),days=['الاحد','الاثنين','الثلاثاء','ثلثاء','ثلوث','الاربعاء','الخميس','الجمعه','السبت'];
  let hasDay=days.some(x=>t.includes(x));
  let hasRosterWord=['خطة','تواجد','دوام','جدول','شفت','شفتات','مناوبه','مناوبات','صباح','مساء','morning','evening','d/o','اجازه','اجازة','البقيه','الباقي','الفريق'].some(x=>t.includes(x));
  let hits=0;
  for(let e of (app.employees||[])){
    let full=assistantRosterTextNorm(e.full_name||''),first=full.split(' ')[0];
    if(full&&t.includes(full)){hits++;continue}
    if(first&&first.length>=3&&t.includes(first))hits++
  }
  return (t.includes('خطة')&&(t.includes('تواجد')||t.includes('دوام'))) || (t.includes('جدول')&&t.includes('دوام')) || (hasRosterWord&&(hasDay||hits>=1||t.includes('البقيه')||t.includes('الباقي')||t.includes('الفريق'))) || (hits>=2&&hasDay);
}
'''
s=s.replace(anchor,helper+anchor,1)
old="if(((t.includes('خطة')&&t.includes('تواجد'))||(t.includes('جدول')&&t.includes('دوام')))&&(t.includes('انش')||t.includes('جهز')||t.includes('سوي')||t.includes('انتج')||t.includes('اعمل')||t.includes('اسبوع'))){await assistantGenerateRosterAI(q);return}"
if old not in s:
    raise SystemExit('old roster trigger not found')
s=s.replace(old,"if(assistantLooksLikeRosterInstruction(q)){await assistantGenerateRosterAI(q);return}",1)
s=s.replace('<!-- pages-publish: assistant-ai-roster-v1-2026-09-10 -->','<!-- pages-publish: assistant-ai-roster-triggerfix-v1-2026-09-10 -->',1)
p.write_text(s,encoding='utf-8')
print('patched roster trigger')
