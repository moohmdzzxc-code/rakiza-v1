from pathlib import Path
import re
p=Path('rakiza-ai.js')
s=p.read_text(encoding='utf-8')
s=s.replace("const RAI_VERSION='0.2.0';","const RAI_VERSION='0.2.1';",1)

s=s.replace("  'أنشئ':['سوي','سو','سوى','جهز','جهّز','اعمل','ابني','بني','رتب','انشئ','أنشئ','ابي','ابغى','أبغى','احتاج','أحتاج']\n};","  'أنشئ':['سوي','سو','سوى','جهز','جهّز','اعمل','ابني','بني','رتب','انشئ','أنشئ','ابي','ابغى','أبغى','احتاج','أحتاج'],\n  'تعديل':['عدل','عدّل','تعديل','غير','غيّر','بدل','بدّل','خلي','خل','حول','حوّل']\n};",1)

s=s.replace("    roster:['تواجد','خطة التواجد','جدول الدوام','دوام','شفت','شفتات','ورديات'],","    roster:['تواجد','خطة التواجد','جدول الدوام','جدول الأسبوع','جدول الاسبوع','جدول الموظفين','دوام','شفت','شفتات','ورديات'],",1)
s=s.replace("    change:['تغيير التواجد','غير الخطة','عدل الدوام','تعديل الخطة']","    change:['تغيير التواجد','غير الخطة','عدل الدوام','تعديل الخطة','عدل خطة التواجد','غير التواجد','خلي','بدل']",1)
s=s.replace("  navigate_roster:'فتح خطة التواجد',roster_draft:'إنشاء مسودة خطة تواجد',date_query:'فهم تاريخ/يوم',","  navigate_roster:'فتح خطة التواجد',roster_draft:'إنشاء مسودة خطة تواجد',roster_change_draft:'تعديل خطة التواجد كمسودة تغيير',date_query:'فهم تاريخ/يوم',",1)

old_op=re.search(r'function raiOperation\(text\)\{.*?\n\}',s,re.S)
if not old_op: raise SystemExit('raiOperation not found')
new_op=r'''function raiOperation(text){
  const n=raiNorm(text);
  if(raiHas(text,['تعديل'])||/عدل|تعديل|غير|بدل|خلي|خل\s/.test(n))return'modify';
  if(raiHas(text,['افتح'])&&!raiHas(text,['أنشئ','مسودة']))return'navigate';
  if(raiHas(text,['صدر','اكسل'])||/تصدير|xlsx|excel/.test(n))return'export';
  if(raiHas(text,['مقارنة'])||/قارن|مقابل/.test(n))return'compare';
  if(raiHas(text,['تحليل'])||/حلل|فسر|شخص|ليش|لماذا|سبب/.test(n))return'analyze';
  if(raiHas(text,['ترتيب'])||/اكثر|اقل|اعلي|اعلى|رتب|متكرر/.test(n))return'rank';
  if(raiHas(text,['أنشئ','مسودة'])||/سوي|جهز|ابني|ابي|ابغى|احتاج/.test(n))return'create';
  if(/ملخص|خلاصه|خلاصة|وضعي|وضعنا|الوضع/.test(n))return'summary';
  if(raiHas(text,['اعرض'])||/وش|كم|مين|ايش|اي |هل/.test(n))return'query';
  return'query';
}'''
s=s[:old_op.start()]+new_op+s[old_op.end():]

anchor='function raiMonthPeriod(text){'
if anchor not in s: raise SystemExit('month anchor missing')
insert=r'''function raiMonthMentions(text){
  const n=raiNorm(text),base=raiDateObj(raiBaseDate()),yr=n.match(/\b(20\d{2})\b/),year=yr?Number(yr[1]):base.getFullYear(),out=[];
  for(const row of RAI_MONTHS){
    let first=Infinity;
    for(const alias of row.aliases){const i=n.indexOf(raiNorm(alias));if(i>=0&&i<first)first=i}
    if(first<Infinity)out.push({month:`${year}-${String(row.month).padStart(2,'0')}`,name:row.name,index:first});
  }
  return out.sort((a,b)=>a.index-b.index);
}

function raiPreviousMonthKey(key){
  const m=String(key||'').match(/^(20\d{2})-(\d{2})$/);if(!m)return null;
  const d=new Date(Number(m[1]),Number(m[2])-2,1);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}
'''
s=s.replace(anchor,insert+'\n'+anchor,1)

old_month=re.search(r'function raiMonthPeriod\(text\)\{.*?\n\}',s,re.S)
if not old_month: raise SystemExit('month function missing')
new_month=r'''function raiMonthPeriod(text){
  const n=raiNorm(text),base=raiDateObj(raiBaseDate()),mentions=raiMonthMentions(text);
  if(mentions.length>=2)return{type:'compare_months',months:[...new Set(mentions.map(x=>x.month))],labels:mentions.map(x=>x.name)};
  if(/الشهر\s*(?:الماضي|السابق|اللي فات)|(?:الشهر اللي فات)/.test(n)){const d=new Date(base.getFullYear(),base.getMonth()-1,1);return{type:'month',month:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`,label:'الشهر الماضي'}}
  if(/(?:هذا|هال)\s*الشهر|الشهر\s*(?:الحالي|هذا)/.test(n))return{type:'month',month:`${base.getFullYear()}-${String(base.getMonth()+1).padStart(2,'0')}`,label:'هذا الشهر'};
  const last=n.match(/(?:اخر|آخر)\s*(\d+)\s*(?:شهور|اشهر|أشهر)/);if(last)return{type:'last_n_months',count:Number(last[1])};
  if(mentions.length===1)return{type:'month',month:mentions[0].month,label:mentions[0].name};
  return null;
}'''
s=s[:old_month.start()]+new_month+s[old_month.end():]

anchor2='function raiBroadOperationalIntent(text){'
if anchor2 not in s: raise SystemExit('broad anchor missing')
context_funcs=r'''function raiUsesPriorContext(text){
  const n=raiNorm(text);
  return /^(طيب|تمام|زين|اوكي|وكمان|بعدها|وبعدين)|قارنها|قارنها|صدرها|طلعها|نفسها|نفسه|اللي قبله|اللي قبلها|السابق/.test(n)||/\b(ها|هذي|هذا|نفس)\b/.test(n);
}

function raiContextualize(text,domain,period,operation){
  const prev=RAI_STATE.context?.entities||{};
  let d=domain,p=period;
  const reportingOnly=!d&&raiCollectConcepts(text).some(x=>x.domain==='reporting');
  if(!d&&prev.domain&&(reportingOnly||raiUsesPriorContext(text)))d=prev.domain;
  if(operation==='compare'&&prev.period){
    if(p?.type==='month'&&prev.period.type==='month'&&p.month!==prev.period.month)p={type:'compare_months',months:[prev.period.month,p.month]};
    else if(!p&&prev.period.type==='month'&&/الشهر\s*(?:اللي قبله|السابق)|اللي\s*قبله/.test(raiNorm(text)))p={type:'compare_months',months:[prev.period.month,raiPreviousMonthKey(prev.period.month)]};
  }
  if(!p&&prev.period&&raiUsesPriorContext(text))p=prev.period;
  return{domain:d,period:p};
}
'''
s=s.replace(anchor2,context_funcs+'\n'+anchor2,1)

old_detect=re.search(r'function raiDetectIntent\(text,entities\)\{.*?\n\}',s,re.S)
if not old_detect: raise SystemExit('detect missing')
new_detect=r'''function raiDetectIntent(text,entities){
  const n=raiNorm(text),questionLike=/\b(?:وش|كيف|هل|وين|متي|متى|كم|مين|ايش)\b/.test(n),hasRoster=entities.domain==='roster'||raiHas(text,['تواجد','دوام','شفت'])||(/خطه/.test(n)&&/(فريق|موظف|اسبوع|تواجد)/.test(n))||(/جدول/.test(n)&&/(اسبوع|فريق|موظف|دوام)/.test(n));
  const navigate=entities.operation==='navigate',create=entities.operation==='create',modify=entities.operation==='modify',imperativeArrange=/^(رتب|سوي|جهز|ابني|اعمل)\b/.test(n);
  if(hasRoster&&navigate)return'navigate_roster';
  if(hasRoster&&modify)return'roster_change_draft';
  if(hasRoster&&(create||entities.constraints.length||raiHas(text,['مسودة'])||imperativeArrange||(!questionLike&&/خطه\s*(?:ال)?تواجد|تواجد\s*(?:ال)?اسبوع|جدول\s*(?:ال)?اسبوع/.test(n))))return'roster_draft';
  if(entities.employees.length&&entities.temporal&&entities.constraints.length)return'roster_draft';
  if((/متي|متى|تاريخ/.test(n)||/^وش\s+يوم/.test(n))&&entities.temporal)return'date_query';
  if(entities.temporal&&entities.temporal.type==='weekday'&&/(الجاي|القادم|المقبل)/.test(n)&&!entities.domain)return'date_query';
  const broad=raiBroadOperationalIntent(text);if(broad)return broad;
  const d=entities.domain,op=entities.operation;
  if(d==='sales')return op==='export'?'sales_export':op==='compare'?'sales_compare':(['analyze','rank'].includes(op)?'sales_analysis':'sales_query');
  if(d==='shortages')return op==='export'?'shortages_export':op==='compare'?'shortages_compare':(['analyze','rank'].includes(op)?'shortages_analysis':'shortages_query');
  if(d==='readiness')return op==='compare'?'readiness_compare':(['analyze','rank'].includes(op)?'readiness_analysis':'readiness_query');
  if(d==='actions')return ['analyze','rank','compare'].includes(op)?'actions_analysis':'actions_query';
  if(d==='attendance')return ['analyze','rank','compare'].includes(op)?'attendance_analysis':'attendance_query';
  if(d==='tasks')return ['analyze','rank','compare'].includes(op)?'tasks_analysis':'tasks_query';
  if(d==='multi')return'operational_summary';
  if(!d&&entities.concepts.some(x=>x.domain==='reporting'))return'report_request';
  return'unknown';
}'''
s=s[:old_detect.start()]+new_detect+s[old_detect.end():]

old_an=re.search(r'function raiAnalyze\(text\)\{.*?\n\}',s,re.S)
if not old_an: raise SystemExit('analyze missing')
new_an=r'''function raiAnalyze(text){
  const temporal=raiParseTemporal(text),employees=raiEmployeeMentions(text),concepts=raiCollectConcepts(text),scores=raiDomainScores(text,concepts),rawDomain=raiPrimaryDomain(scores),operation=raiOperation(text),rawPeriod=raiParsePeriod(text,temporal),ctx=raiContextualize(text,rawDomain,rawPeriod,operation),domain=ctx.domain,period=ctx.period,entities={temporal,period,employees,constraints:[],concepts,scores,domain,operation};
  entities.constraints=raiParseRosterConstraints(text,employees,temporal);
  const intent=raiDetectIntent(text,entities);
  return{raw:text,normalized:raiNorm(text),tokens:raiCanonicalTokens(text),intent,entities};
}'''
s=s[:old_an.start()]+new_an+s[old_an.end():]

s=s.replace("  if(p.type==='month')return p.month;","  if(p.type==='month')return p.month;\n  if(p.type==='compare_months')return p.months.join(' مقابل ');",1)

anchor3='function raiDateReply(a){'
if anchor3 not in s: raise SystemExit('date reply anchor missing')
change_reply=r'''function raiRosterChangeReply(a){
  const constraints=a.entities.constraints;
  RAI_STATE.pendingDraft={type:'roster_change',constraints,created_at:new Date().toISOString()};
  let html='<b>فهمت الطلب كتعديل على خطة التواجد الحالية، وليس إنشاء خطة جديدة.</b>';
  if(constraints.length)html+='<div style="margin-top:9px"><b>التغييرات التي فهمتها:</b><br>'+constraints.map(c=>`${raiEsc(c.employee.full_name)} — ${c.day} ${c.date}${c.statusLabel?` — <b>${raiEsc(c.statusLabel)}</b>`:' — الحالة غير محددة'}`).join('<br>')+'</div>';
  html+='<div class="notice" style="margin-top:10px">لم يتم تعديل الخطة. عند ربط وحدة التنفيذ سنحافظ على الخطة الأصلية، وأي تغيير سيحتاج سببًا قبل الحفظ.</div>';
  return html;
}

'''
s=s.replace(anchor3,change_reply+anchor3,1)
s=s.replace("  if(a.intent==='roster_draft')return raiRosterReply(a);","  if(a.intent==='roster_draft')return raiRosterReply(a);\n  if(a.intent==='roster_change_draft')return raiRosterChangeReply(a);",1)

p.write_text(s,encoding='utf-8')
