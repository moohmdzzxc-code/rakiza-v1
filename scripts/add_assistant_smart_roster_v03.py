from pathlib import Path
import re

p=Path('index.html')
s=p.read_text(encoding='utf-8')

s=s.replace('<!-- pages-publish: assistant-v02-roster-2026-09-09 -->','<!-- pages-publish: assistant-v03-smart-roster-2026-09-09 -->',1)

anchor="function assistantFallbackRoster(active,ds){let out={};active.forEach((e,ei)=>ds.forEach((d,di)=>{let off=(ei%7)===di;out[e.id+'|'+d]=off?'D/O':((ei+di)%2===0?'Morning':'Evening')}));return out}\n"
assert anchor in s, 'fallback roster anchor not found'

helpers=r'''function assistantRosterTextNorm(v){return assistantNorm(String(v||'')).replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/[،,:;؛.]/g,' ').replace(/\s+/g,' ').trim()}
const ASSISTANT_ROSTER_DAYS=[
 {i:0,label:'الأحد',aliases:['الاحد','احد']},
 {i:1,label:'الاثنين',aliases:['الاثنين','اثنين','الاثنين']},
 {i:2,label:'الثلاثاء',aliases:['الثلاثاء','الثلاثا','ثلاثاء','ثلاثا','ثلوث','ثلثاء']},
 {i:3,label:'الأربعاء',aliases:['الاربعاء','الاربعاء','اربعاء','ربعاء']},
 {i:4,label:'الخميس',aliases:['الخميس','خميس']},
 {i:5,label:'الجمعة',aliases:['الجمعه','جمعه','الجمعه','الجامعه','جامعه']},
 {i:6,label:'السبت',aliases:['السبت','سبت']}
];
function assistantRosterShiftFromText(v){let t=assistantRosterTextNorm(v);if(/صباح/.test(t))return'Morning';if(/مساء/.test(t))return'Evening';if(/اجاز|اوف|off|d\/?o/.test(t))return'D/O';if(/سنوي|a\/?l/.test(t))return'A/L';if(/سكليف|مرضي|s\/?l/.test(t))return'S/L';if(/تعويضي/.test(t))return'تعويضي';if(/مهمه عمل|مهمة عمل/.test(t))return'مهمة عمل';return''}
function assistantRosterEmployeeMentions(text,active){let t=assistantRosterTextNorm(text),aliasMap=new Map();for(let e of active){let full=assistantRosterTextNorm(e.full_name),parts=full.split(' ').filter(Boolean),aliases=[full,parts.slice(0,2).join(' '),parts[0]].filter(x=>x&&x.length>=2);for(let a of new Set(aliases)){let arr=aliasMap.get(a)||[];arr.push(e);aliasMap.set(a,arr)}}let raw=[],ambiguities=[];for(let [alias,emps] of aliasMap){let from=0;while(true){let at=t.indexOf(alias,from);if(at<0)break;let left=at===0?' ':t[at-1],right=t[at+alias.length]||' ';if(/\s/.test(left)&&/\s/.test(right)){let emp=null,assumed=false;if(emps.length===1)emp=emps[0];else{let managers=emps.filter(e=>assistantRosterTextNorm(e.position||'').includes('مدير'));if(managers.length===1){emp=managers[0];assumed=true}else ambiguities.push(alias)}if(emp)raw.push({start:at,end:at+alias.length,alias,emp,assumed})}from=at+alias.length}}raw.sort((a,b)=>a.start-b.start||(b.end-b.start)-(a.end-a.start));let out=[];for(let x of raw){if(out.some(y=>x.start<y.end&&x.end>y.start))continue;out.push(x)}return{mentions:out.sort((a,b)=>a.start-b.start),ambiguities:[...new Set(ambiguities)]}}
function assistantParseRosterInstruction(text,active,ds){let t=assistantRosterTextNorm(text),entries={},summary=[],weekRules=new Map(),dayRules=[],hasRules=false;let defaultStatus='';let dm=t.match(/(?:البقيه|الباقي|الباقين|الكل|الجميع)(?:\s+كلهم)?\s+(صباح(?:ي)?|مساء(?:ي)?)/);if(dm){defaultStatus=dm[1].startsWith('صباح')?'Morning':'Evening';hasRules=true;summary.push(`${dm[0].includes('البقي')||dm[0].includes('الباق')?'البقية':'الجميع'} ${defaultStatus}`)}let found=assistantRosterEmployeeMentions(t,active),mentions=found.mentions;for(let mi=0;mi<mentions.length;mi++){let m=mentions[mi],end=mi+1<mentions.length?mentions[mi+1].start:t.length,seg=t.slice(m.end,end),restAt=seg.search(/\b(?:البقيه|الباقي|الباقين|الكل|الجميع)\b/);if(restAt>=0)seg=seg.slice(0,restAt);let firstDay=seg.length;for(let day of ASSISTANT_ROSTER_DAYS)for(let a of day.aliases){let at=seg.indexOf(a);if(at>=0&&at<firstDay)firstDay=at}let lead=seg.slice(0,firstDay),week=assistantRosterShiftFromText(lead);if(['Morning','Evening'].includes(week)){weekRules.set(m.emp.id,week);hasRules=true;summary.push(`${m.emp.full_name}: ${week}`)}for(let day of ASSISTANT_ROSTER_DAYS){let best=-1,bestAlias='';for(let a of day.aliases){let at=seg.indexOf(a);if(at>=0&&(best<0||at<best)){best=at;bestAlias=a}}if(best<0)continue;let ctx=seg.slice(Math.max(0,best-12),Math.min(seg.length,best+bestAlias.length+18)),st=assistantRosterShiftFromText(ctx)||'D/O';dayRules.push({emp:m.emp,day,status:st});hasRules=true;summary.push(`${m.emp.full_name}: ${day.label} ${st}`)}}if(defaultStatus)active.forEach(e=>ds.forEach(d=>entries[e.id+'|'+d]=defaultStatus));for(let [id,st] of weekRules){ds.forEach(d=>entries[id+'|'+d]=st)}for(let r of dayRules)entries[r.emp.id+'|'+ds[r.day.i]]=r.status;let assumptions=mentions.filter(x=>x.assumed).map(x=>`اعتبرت «${x.alias}» = ${x.emp.full_name} لأنه مدير المعرض`);return{hasRules,entries,summary:[...new Set(summary)],ambiguities:found.ambiguities,assumptions}}
'''
s=s.replace(anchor,anchor+helpers,1)

pat=r"async function assistantGenerateRosterNextWeek\(\)\{.*?\}\nfunction assistantRenderRosterDraft\(\)"
m=re.search(pat,s,re.S)
assert m, 'assistantGenerateRosterNextWeek block not found'
new_func=r'''async function assistantGenerateRosterNextWeek(instruction=''){let ws=assistantNextRosterWeek(),ds=dates7(ws),target=await api('roster-get',{q:{week_start:ws}});if(target.header){assistantAdd('assistant',`خطة التواجد للأسبوع <b>${ws}</b> محفوظة أصلًا، لذلك لن أكتب فوقها.<div style="margin-top:9px"><button class="mini" onclick="openRoster()">فتح خطة التواجد</button></div>`);return}let source=assistantIsoPlusDays(ws,-7),src=await api('roster-get',{q:{week_start:source}}),active=app.employees.filter(e=>e.active),entries={},exceptional=0,sourceUsed=!!(src.header&&(src.entries||[]).length);if(sourceUsed){let sds=dates7(source),m=new Map((src.entries||[]).map(x=>[x.employee_id+'|'+x.work_date,x.planned_status]));active.forEach(e=>ds.forEach((d,i)=>{let v=m.get(e.id+'|'+sds[i])||'';if(['Morning','Evening','D/O'].includes(v))entries[e.id+'|'+d]=v;else{entries[e.id+'|'+d]='';if(v)exceptional++}}))}else entries=assistantFallbackRoster(active,ds);let parsed=assistantParseRosterInstruction(instruction,active,ds);if(parsed.hasRules){for(let [k,v] of Object.entries(parsed.entries))entries[k]=v}let commandSummary=parsed.hasRules?parsed.summary.join(' | '):'';if(parsed.assumptions.length)commandSummary+=(commandSummary?' | ':'')+parsed.assumptions.join(' | ');if(parsed.ambiguities.length)commandSummary+=(commandSummary?' | ':'')+`لم أحسم الاسم المكرر: ${parsed.ambiguities.join('، ')}`;assistantRosterDraft={week_start:ws,week_end:ds[6],dates:ds,employees:active,entries,source_week:source,source_used:sourceUsed,exceptional,command_summary:commandSummary,command_ambiguities:parsed.ambiguities};assistantRenderRosterDraft()}
function assistantRenderRosterDraft()'''
s=s[:m.start()]+new_func+s[m.end():]

old="if(d.exceptional)note+=` <span class=\"re\">وجدت ${d.exceptional} حالة استثنائية في الأسبوع السابق ولم أرحّلها تلقائيًا؛ أكملها قبل الاعتماد.</span>`;let html="
new="if(d.exceptional)note+=` <span class=\"re\">وجدت ${d.exceptional} حالة استثنائية في الأسبوع السابق ولم أرحّلها تلقائيًا؛ أكملها قبل الاعتماد.</span>`;if(d.command_summary)note+=`<br><span style=\"color:#17365d\"><b>فهمت تعليماتك:</b> ${assistantEscText(d.command_summary)}</span>`;if(d.command_ambiguities?.length)note+=`<br><span class=\"re\">يوجد اسم مكرر لم أطبّق عليه أمرًا تلقائيًا؛ استخدم الاسم الكامل عند الحاجة.</span>`;let html="
assert old in s, 'render note anchor not found'
s=s.replace(old,new,1)

old_call="await assistantGenerateRosterNextWeek();return"
assert old_call in s, 'assistant roster dispatch call not found'
s=s.replace(old_call,"await assistantGenerateRosterNextWeek(q);return",1)

p.write_text(s,encoding='utf-8')
