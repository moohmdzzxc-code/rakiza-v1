from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
anchor="async function assistantGenerateRosterNextWeek(instruction=''){"
if anchor not in s:
    raise SystemExit('assistantGenerateRosterNextWeek anchor not found')
new_func=r'''async function assistantGenerateRosterAI(instruction=''){
  let ws=assistantNextRosterWeek(),ds=dates7(ws),target=await api('roster-get',{q:{week_start:ws}});
  if(target.header){assistantAdd('assistant',`خطة التواجد للأسبوع <b>${ws}</b> محفوظة أصلًا، لذلك لن أكتب فوقها.<div style="margin-top:9px"><button class="mini" onclick="openRoster()">فتح خطة التواجد</button></div>`);return}
  let source=assistantIsoPlusDays(ws,-7),src=await api('roster-get',{q:{week_start:source}}),active=app.employees.filter(e=>e.active),entries={},exceptional=0,sourceUsed=!!(src.header&&(src.entries||[]).length);
  if(sourceUsed){let sds=dates7(source),m=new Map((src.entries||[]).map(x=>[x.employee_id+'|'+x.work_date,x.planned_status]));active.forEach(e=>ds.forEach((d,i)=>{let v=m.get(e.id+'|'+sds[i])||'';if(ASSISTANT_ROSTER_STATUSES.includes(v))entries[e.id+'|'+d]=v;else{entries[e.id+'|'+d]='';if(v)exceptional++}}))}else entries=assistantFallbackRoster(active,ds);
  const dayKeys=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
  let baseline=active.map(e=>{let r={employee_id:e.id};dayKeys.forEach((k,i)=>r[k]=entries[e.id+'|'+ds[i]]||'');return r});
  let employees=active.map(e=>({id:e.id,full_name:e.full_name,role:e.job_title||e.position||e.role||e.title||''}));
  assistantAdd('assistant','<span class="mut">أفهم تعليمات الخطة بالذكاء الاصطناعي الآن…</span>');
  let r=await fetch('https://fvkzsmtadppclzexaktz.supabase.co/functions/v1/rakiza-ai-roster?k='+TOKEN,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({instruction,employees,baseline})}),j={};
  try{j=await r.json()}catch(_){j={}}
  if(!r.ok){
    if(j.error==='AI_NOT_CONFIGURED'){
      assistantAdd('assistant','<div class="notice">ميزة الفهم بالذكاء الاصطناعي مركبة، لكنها تحتاج تفعيل مفتاح OpenAI API في الخادم. استخدمت المحلل السابق مؤقتًا لهذه المحاولة.</div>');
      await assistantGenerateRosterNextWeek(instruction);return
    }
    throw Error(j.message||j.error||'تعذر تشغيل مساعد ركيزة الذكي')
  }
  let plan=j.plan||{};
  if(plan.needs_clarification){assistantAdd('assistant',`<div class="notice"><b>أحتاج توضيحًا بسيطًا قبل بناء الخطة:</b><div style="margin-top:6px">${assistantEscText(plan.clarification_question||'أعد صياغة الجزء غير الواضح من تعليماتك.')}</div></div>`);return}
  let byId=new Map(active.map(e=>[e.id,e])),seen=new Set(),draftEmployees=[];
  for(let row of (plan.employees||[])){
    let e=byId.get(row.employee_id);if(!e||seen.has(e.id))continue;seen.add(e.id);draftEmployees.push(e);
    dayKeys.forEach((k,i)=>{let v=String(row[k]??'');entries[e.id+'|'+ds[i]]=ASSISTANT_ROSTER_STATUSES.includes(v)?v:''})
  }
  if(!draftEmployees.length)throw Error('لم أستطع تحديد فريق الخطة من تعليماتك. اذكر الأسماء المطلوبة بشكل أوضح.');
  assistantRosterDraft={week_start:ws,week_end:ds[6],dates:ds,employees:draftEmployees,entries,source_week:source,source_used:sourceUsed,exceptional,command_summary:`AI: ${plan.summary||'تم تفسير تعليماتك وبناء المسودة.'}`,command_ambiguities:[]};
  assistantRenderRosterDraft()
}
'''
s=s.replace(anchor,new_func+anchor,1)
old="await assistantGenerateRosterNextWeek(q);return"
if old not in s:
    raise SystemExit('assistant call anchor not found')
s=s.replace(old,"await assistantGenerateRosterAI(q);return",1)
s=s.replace('<!-- pages-publish: assistant-v041-group-exclusions-2026-09-09 -->','<!-- pages-publish: assistant-ai-roster-v1-2026-09-10 -->',1)
s=s.replace('نسخة تجريبية — اسأل عن بيانات التشغيل واطلب تقارير','AI تجريبي — اسأل، حلّل، وأنشئ مسودات تشغيلية',1)
s=s.replace('النسخة الأولى تقرأ بيانات ركيزة فقط ولا تعدّل أو تغلق أي سجل. جرّب سؤالًا طبيعيًا أو اختر أحد الأمثلة.','يفهم تعليماتك باللغة الطبيعية ويستخدم بيانات ركيزة لبناء مسودات وتقارير. أي تغيير تشغيلي يبقى مسودة حتى تعتمدها بنفسك.',1)
p.write_text(s,encoding='utf-8')
print('patched Rakiza AI roster frontend v1')
