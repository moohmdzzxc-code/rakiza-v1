(()=>{
'use strict';

const AI=window.RakizaAI=window.RakizaAI||{};
if(AI.conversation?.version)return;

const RAC_VERSION='1.1.0';
const STATE={
  context:{domain:null,period:null,topic:null,activePersonId:null,lastFrame:null},
  pending:{draft:null,question:null},
  turns:[],
  busy:false
};

const DAYS=[
  {i:0,label:'الأحد',aliases:['الاحد','الأحد','احد']},
  {i:1,label:'الاثنين',aliases:['الاثنين','الإثنين','اثنين']},
  {i:2,label:'الثلاثاء',aliases:['الثلاثاء','الثلاثا','ثلاثاء','ثلاثا','ثلوث','ثلثاء']},
  {i:3,label:'الأربعاء',aliases:['الاربعاء','الأربعاء','اربعاء','أربعاء','ربوع']},
  {i:4,label:'الخميس',aliases:['الخميس','خميس']},
  {i:5,label:'الجمعة',aliases:['الجمعه','الجمعة','جمعه','جمعة']},
  {i:6,label:'السبت',aliases:['السبت','سبت']}
];
const STATUSES=[
  {value:'Morning',label:'صباحي',kind:'work',aliases:['صباح','صباحي','الصباح','صبحي']},
  {value:'Evening',label:'مسائي',kind:'work',aliases:['مساء','مسائي','المساء','ليلي']},
  {value:'D/O',label:'إجازة أسبوعية',kind:'off',aliases:['اجازه','اجازة','إجازة','اوف','off','d/o','راحه','راحة']},
  {value:'A/L',label:'إجازة سنوية',kind:'off',aliases:['سنويه','سنوية','اجازه سنويه','اجازة سنوية','annual','a/l']},
  {value:'S/L',label:'إجازة مرضية',kind:'off',aliases:['سكليف','مرضي','مرضيه','مرضية','sick','s/l']},
  {value:'تعويضي',label:'تعويضي',kind:'off',aliases:['تعويضي','تعويض','c/o']},
  {value:'مهمة عمل',label:'مهمة عمل',kind:'other',aliases:['مهمه عمل','مهمة عمل','تكليف خارجي']}
];

function basicNorm(v){return String(v??'').toLowerCase().replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[\u064B-\u065F\u0670]/g,'').replace(/ـ/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/[،,:;؛!?؟.()\[\]{}"']/g,' ').replace(/\s+/g,' ').trim()}
function norm(v){return AI.normalize?AI.normalize(v):basicNorm(v)}
function esc(v){return String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]))}
function clone(v){try{return JSON.parse(JSON.stringify(v))}catch{return v}}
function getApp(){try{return app}catch{return window.app||{}}}
function employees(){return(getApp().employees||[]).filter(e=>e&&e.active!==false)}
function employeeName(e){return e?.full_name||e?.name||''}
function baseDate(){const a=getApp();return String(a.calendarDate||a.day?.work_date||a.date||new Date().toISOString().slice(0,10)).slice(0,10)}
function dObj(v){return new Date(String(v)+'T12:00:00')}
function iso(d){return d.toISOString().slice(0,10)}
function addDays(v,n){const d=dObj(v);d.setDate(d.getDate()+n);return iso(d)}
function sunday(v){const d=dObj(v);d.setDate(d.getDate()-d.getDay());return iso(d)}
function statusLabel(v){return STATUSES.find(x=>x.value===v)?.label||v||'غير محدد'}
function dayLabel(i){return DAYS.find(x=>x.i===Number(i))?.label||String(i)}
function hasAny(n,arr){return arr.some(x=>n.includes(norm(x)))}
function chat(role,html){const c=document.getElementById('assistantChat');if(!c)return;const mine=role==='user';if(!mine&&AI.voice?.present)html=AI.voice.present(html,{source:'conversation',domain:AI.conversation?.state?.context?.domain||AI.conversationUniversal?.state?.lastRoute||null});c.insertAdjacentHTML('beforeend',`<div style="display:flex;justify-content:${mine?'flex-start':'flex-end'}"><div class="task" style="max-width:92%;margin:0;background:${mine?'#eef3f8':'#fff'};border-color:${mine?'#d6e0ea':'#e3e7ec'}">${html}</div></div>`);c.lastElementChild?.scrollIntoView?.({behavior:'smooth',block:'nearest'})}

function tokensWithPos(n){const out=[];let i=0;for(const raw of String(n||'').split(' ')){if(!raw)continue;const start=n.indexOf(raw,i);out.push({raw,start,end:start+raw.length});i=start+raw.length}return out}
function overlaps(a,b){return a.start<b.end&&b.start<a.end}
function nameCatalog(){const list=employees(),firstMap=new Map();for(const e of list){const full=norm(employeeName(e)),first=full.split(' ')[0]||'';if(!firstMap.has(first))firstMap.set(first,[]);firstMap.get(first).push(e)}return{list,firstMap}}
function canonicalFirstToken(raw,firstMap){if(firstMap.has(raw))return raw;if(raw.length>3&&/[وفلب]/.test(raw[0])&&firstMap.has(raw.slice(1)))return raw.slice(1);return null}
function resolvePeople(text){
  const n=norm(text),{list,firstMap}=nameCatalog(),mentions=[];
  const sorted=[...list].sort((a,b)=>norm(employeeName(b)).length-norm(employeeName(a)).length);
  for(const e of sorted){const full=norm(employeeName(e));if(!full)continue;let from=0,pos;while((pos=n.indexOf(full,from))>=0){const m={start:pos,end:pos+full.length,matched:n.slice(pos,pos+full.length),resolved:true,employee:e,candidates:[e],confidence:'full'};if(!mentions.some(x=>overlaps(x,m)))mentions.push(m);from=pos+full.length}}
  for(const t of tokensWithPos(n)){if(mentions.some(x=>overlaps(x,t)))continue;const first=canonicalFirstToken(t.raw,firstMap);if(!first)continue;const c=firstMap.get(first)||[];mentions.push({start:t.start,end:t.end,matched:first,resolved:c.length===1,employee:c.length===1?c[0]:null,candidates:c,confidence:c.length===1?'unique_first':'ambiguous_first'})}
  return mentions.sort((a,b)=>a.start-b.start).map((m,idx)=>({...m,id:`p${idx+1}`}));
}

function detectExplicitDomain(text,base={}){const n=norm(text),hits={
  sales:/مبيعات|بيع|تارقت|تارجت|target|تحقيق|فجوه|عجز/.test(n),
  shortages:/نواقص|نقص|صنف|مقاس|تغذيه|توريد|فرص ضايعه|فرص ضائعه/.test(n),
  readiness:/جاهزيه|جاهزية|نظافه|شبكه|مكيف|طفايات|نقاط البيع|مخارج طوارئ/.test(n),
  attendance:/حضور|غياب|متاخر|تواجد|دوام|شفت|روستر|خطة التواجد|خطه التواجد/.test(n),
  tasks:/مهام|مهمه|خطة اليوم|خطه اليوم|استلام|تحويل|فيجوال|vm/.test(n),
  actions:/اجراء|إجراء|متابعه|متابعة|تصعيد|صيانه|صيانة|طلب دعم|مشكله عميل/.test(n)
};const active=Object.keys(hits).filter(k=>hits[k]);if(active.length>=2&&/حلل|تحليل|وضع المعرض|وضعنا|ملخص|قارن|اولويات|أولويات/.test(n))return'store';if(active.length===1)return active[0];return base?.entities?.domain||null}
function isFollowUp(text){const n=norm(text);return/^(طيب|تمام|زين|و |وال|وبعدين|بعدها|نفس|منهم|منه|منها|ليش|وش عنه|وش عنها|قارنها|خلها|خله|خليها|لا |قصدي|اقصد|أقصد)/.test(n)||/الشهر.*قبله/.test(n)}
function resolveConversationPeriod(text,base={}){const p=base?.entities?.period;if(p)return clone(p);const n=norm(text),b=baseDate();if(/الاسبوع الجاي|الاسبوع القادم|الاسبوع المقبل/.test(n)){const s=addDays(sunday(b),7);return{type:'week',start:s,end:addDays(s,6),label:'الأسبوع القادم'}}if(/هذا الاسبوع|هالاسبوع|الاسبوع الحالي/.test(n)){const s=sunday(b);return{type:'week',start:s,end:addDays(s,6),label:'هذا الأسبوع'}}if(/الاسبوع الماضي|الاسبوع السابق|الاسبوع اللي فات/.test(n)){const s=addDays(sunday(b),-7);return{type:'week',start:s,end:addDays(s,6),label:'الأسبوع الماضي'}}return null}
function socialKind(text){const n=norm(text);if(/^(السلام عليكم|سلام عليكم|هلا|هلا والله|مرحبا|صباح الخير|مساء الخير)$/.test(n))return'greeting';if(/^(شكرا|شكرا لك|يعطيك العافيه|يعطيك العافية|مشكور)$/.test(n))return'thanks';if(/^(تمام|ممتاز|زين|اوكي|ok)$/.test(n))return'ack';return null}
function operationMode(text,base={}){const n=norm(text),op=base?.entities?.operation||'';if(/حلل|تحليل|شخص|فسر|قارن|رتب|اكثر|أكثر/.test(n)||['analyze','compare','rank'].includes(op))return'analysis';if(/احفظ|حفظ|اغلق|أغلق|صعد|صعّد|ارسل|أرسل|اعتمد/.test(n)||op==='modify')return'write';if(/سوي|سو|انشئ|أنشئ|جهز|ابني|عدل|عدّل|غير|غيّر|خلي/.test(n)||op==='create')return'draft';return'query'}

function detectDayMentions(segment){const n=norm(segment),out=[];for(const d of DAYS){for(const a of d.aliases){const aa=norm(a);let from=0,pos;while((pos=n.indexOf(aa,from))>=0){out.push({day:d.i,label:d.label,start:pos,end:pos+aa.length});from=pos+aa.length}}}return out.sort((a,b)=>a.start-b.start).filter((x,i,a)=>!a.slice(0,i).some(y=>x.day===y.day&&overlaps(x,y)))}
function detectStatuses(segment){const n=norm(segment),out=[];for(const s of STATUSES){for(const a of s.aliases){const aa=norm(a),pos=n.indexOf(aa);if(pos>=0)out.push({status:s.value,label:s.label,kind:s.kind,start:pos,end:pos+aa.length})}}return out.sort((a,b)=>a.start-b.start)}
function offStatusFor(segment){const sts=detectStatuses(segment).filter(x=>x.kind==='off');if(sts.length)return sts[0].status;return'D/O'}
function workStatusFor(segment){return detectStatuses(segment).find(x=>x.kind==='work')||null}
function groupStatusAnchors(n){const out=[];const defs=[
  {re:/(?:فهم|كلهم|الباقين|الباقي|المذكورين|المذكوره اسماهم|المذكورة اسماهم)[^\n]{0,24}(?:مساء|مسائي)/g,status:'Evening'},
  {re:/(?:فهم|كلهم|الباقين|الباقي|المذكورين|المذكوره اسماهم|المذكورة اسماهم)[^\n]{0,24}(?:صباح|صباحي)/g,status:'Morning'}
];for(const d of defs){let m;while((m=d.re.exec(n)))out.push({start:m.index,end:d.re.lastIndex,status:d.status})}return out.sort((a,b)=>a.start-b.start)}
function inheritedGroupStatus(mention,anchors){let hit=null;for(const a of anchors)if(a.end<=mention.start)hit=a;return hit?.status||null}
function dayAfterNameMeansOff(n){return/اجازتهم بعدهم|اجازتهم بعد الاسم|اجازه بعد كل اسم|اجازة بعد كل اسم|الاجازه بعد الاسم|الاجازة بعد الاسم/.test(n)}
function assignmentFromSegment(mention,segment,whole,anchors){
  const s=norm(segment),days=detectDayMentions(s),work=workStatusFor(s),offCue=/اجازه|اجازة|اجازته|اجازتها|اجازتهم|اجازتي|اوف|راحه|راحة|راحته|راحتها|سنويه|سنوية|سنويته|سكليف|مرضي|مرضية|مرضيته|تعويضي/.test(s),afterRule=dayAfterNameMeansOff(whole);let defaultStatus=null,overrides={};
  const group=inheritedGroupStatus(mention,anchors);
  if(work){
    const firstDay=days[0];
    if(firstDay&&firstDay.start<work.start&&!/طوال الاسبوع|كل الاسبوع|باقي الاسبوع/.test(s))overrides[firstDay.day]=work.status;
    else defaultStatus=work.status;
  }else if(group)defaultStatus=group;
  if(days.length&&(offCue||afterRule)){
    const off=offStatusFor(s);
    for(const d of days)overrides[d.day]=off;
  }
  if(!days.length){const off=detectStatuses(s).find(x=>x.kind==='off');if(off&&!defaultStatus)defaultStatus=off.status}
  return{
    id:mention.id,
    resolved:mention.resolved,
    employee_id:mention.employee?.id||null,
    employee:mention.employee||null,
    mention:mention.matched,
    candidates:mention.candidates||[],
    defaultStatus,
    overrides,
    source:s
  }
}
function normalizeAssignments(list){const out=[];for(const x of list){const key=x.employee_id?`e:${x.employee_id}`:`u:${x.mention}`;const prev=out.find(y=>(y.employee_id?`e:${y.employee_id}`:`u:${y.mention}`)===key);if(!prev){out.push(x);continue}if(x.defaultStatus)prev.defaultStatus=x.defaultStatus;prev.overrides={...prev.overrides,...x.overrides};prev.source=[prev.source,x.source].filter(Boolean).join(' | ')}return out}
function rosterPeriod(text,prior=null){const n=norm(text),b=baseDate();if(/الاسبوع الجاي|الاسبوع القادم|الاسبوع المقبل/.test(n)){const s=addDays(sunday(b),7);return{type:'week',start:s,end:addDays(s,6),label:'الأسبوع القادم'}}if(/هذا الاسبوع|هالاسبوع|الاسبوع الحالي/.test(n)){const s=sunday(b);return{type:'week',start:s,end:addDays(s,6),label:'هذا الأسبوع'}}if(/الاسبوع الماضي|الاسبوع السابق/.test(n)){const s=addDays(sunday(b),-7);return{type:'week',start:s,end:addDays(s,6),label:'الأسبوع الماضي'}}return prior&&prior.type==='week'?clone(prior):null}
function parseRosterDraft(text,people=resolvePeople(text),priorPeriod=null){
  const n=norm(text),anchors=groupStatusAnchors(n),assignments=[];
  for(let i=0;i<people.length;i++){const m=people[i],next=people[i+1],segment=n.slice(m.end,next?next.start:n.length);assignments.push(assignmentFromSegment(m,segment,n,anchors))}
  return{kind:'roster',status:'draft',period:rosterPeriod(text,priorPeriod),assignments:normalizeAssignments(assignments),createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),approvedInConversation:false};
}
function assignmentKey(a){return a.employee_id?`e:${a.employee_id}`:`u:${a.mention}`}
function findDraftAssignment(draft,employee){return draft?.assignments?.find(x=>x.employee_id&&x.employee_id===employee?.id)||null}
function syntheticMentionForEmployee(e){return{id:'active',start:0,end:0,matched:norm(employeeName(e)),resolved:true,employee:e,candidates:[e],confidence:'context'}}
function mergeRosterDraft(draft,text,people=resolvePeople(text)){
  if(!draft||draft.kind!=='roster')return parseRosterDraft(text,people,null);
  const next=clone(draft),n=norm(text);let mentions=people;
  if(!mentions.length&&STATE.context.activePersonId){const e=employees().find(x=>x.id===STATE.context.activePersonId);if(e)mentions=[syntheticMentionForEmployee(e)]}
  const patch=parseRosterDraft(text,mentions,next.period);
  if(/كلهم\s*(?:مساء|مسائي)/.test(n))for(const a of next.assignments)a.defaultStatus='Evening';
  if(/كلهم\s*(?:صباح|صباحي)/.test(n))for(const a of next.assignments)a.defaultStatus='Morning';
  const replaceOff=/^(لا |قصدي|اقصد|أقصد|خله|خلي|خلها|خليها)/.test(n);
  for(const p of patch.assignments){const key=assignmentKey(p),old=next.assignments.find(x=>assignmentKey(x)===key);if(old){if(p.defaultStatus)old.defaultStatus=p.defaultStatus;if(replaceOff&&Object.values(p.overrides||{}).some(v=>STATUSES.find(s=>s.value===v)?.kind==='off')){for(const [day,val] of Object.entries(old.overrides||{}))if(STATUSES.find(s=>s.value===val)?.kind==='off')delete old.overrides[day]}old.overrides={...old.overrides,...p.overrides};old.source=[old.source,p.source].filter(Boolean).join(' | ')}else next.assignments.push(p)}
  if(patch.period)next.period=patch.period;next.updatedAt=new Date().toISOString();next.status='draft';next.approvedInConversation=false;delete next.operationalStage;return next
}
function unresolvedAssignments(draft){return(draft?.assignments||[]).filter(x=>!x.resolved||!x.employee_id)}
function nextClarification(draft){const a=unresolvedAssignments(draft)[0];if(!a)return null;return{type:'employee',assignmentId:a.id,mention:a.mention,candidates:a.candidates||[]}}
function periodText(p){return p?.label||p?.start?`${p.label||'الأسبوع'}${p.start?` (${p.start} → ${p.end})`:''}`:'الأسبوع غير محدد'}
function assignmentDisplayName(a){return a.employee?employeeName(a.employee):a.mention||'اسم غير محدد'}
function exceptionsText(a){const entries=Object.entries(a.overrides||{}).sort((x,y)=>Number(x[0])-Number(y[0]));return entries.length?entries.map(([d,s])=>`${dayLabel(d)}: ${statusLabel(s)}`).join(' • '):'لا توجد استثناءات مسجلة'}
function renderRosterDraft(draft,{compact=false}={}){
  if(!draft?.assignments?.length)return'<b>المسودة موجودة، لكن لم أستخرج تكليفات واضحة بعد.</b>';
  const rows=draft.assignments.map(a=>`<tr><td>${esc(assignmentDisplayName(a))}${!a.resolved?' ⚠️':''}</td><td>${esc(statusLabel(a.defaultStatus))}</td><td>${esc(exceptionsText(a))}</td></tr>`).join('');
  const q=nextClarification(draft);let note=draft.status==='operational_draft'
    ?`<div class="notice ok" style="margin-top:9px">تم نقل هذه النسخة إلى شاشة خطة التواجد كـ<b>مسودة تشغيلية</b>. لن تصبح خطة محفوظة حتى تضغط «اعتماد وحفظ الخطة الأصلية» داخل الشاشة.</div>`
    :`<div class="notice ok" style="margin-top:9px">هذه <b>مسودة حوارية للمراجعة</b>. بعد أن تقول «اعتمد» سأنقلها إلى جدول خطة التواجد كمسودة تشغيلية قابلة للتعديل والاعتماد النهائي.</div>`;
  if(!draft.period)note+=`<div class="notice" style="margin-top:8px">فهمت التوزيع، لكن الأسبوع غير محدد بعد. يمكن تحديده لاحقًا قبل أي حفظ.</div>`;
  if(q){const names=q.candidates.map(employeeName).filter(Boolean);note+=`<div class="notice" style="margin-top:8px"><b>فهمت بقية الخطة.</b> بقي فقط الاسم «${esc(q.mention)}»${names.length?`: عندي ${esc(names.join(' أو '))}`:''}. اكتب الاسم الكامل فقط وسأكمل نفس المسودة بدون فقد بقية التفاصيل.</div>`}
  return`<b>${compact?'الخطة في المسودة':'مسودة خطة التواجد'} — ${esc(periodText(draft.period))}</b><div class="scroll" style="margin-top:9px"><table><thead><tr><th>الموظف</th><th>الدوام الأساسي</th><th>الاستثناءات</th></tr></thead><tbody>${rows}</tbody></table></div>${note}`
}
function candidateFromReply(text,q){const n=norm(text),matches=(q?.candidates||[]).filter(e=>{const full=norm(employeeName(e));return full&&n.includes(full)});if(matches.length===1)return matches[0];return null}
function applyClarification(text){const q=STATE.pending.question,draft=STATE.pending.draft;if(!q||q.type!=='employee'||!draft)return null;const e=candidateFromReply(text,q);if(!e)return{ok:false,html:`<b>باقي عندي نفس النقطة فقط.</b><div class="mut">اكتب الاسم الكامل لأحد الخيارات: ${esc((q.candidates||[]).map(employeeName).join(' — '))}</div>`};const a=draft.assignments.find(x=>x.id===q.assignmentId)||unresolvedAssignments(draft)[0];if(!a)return null;a.resolved=true;a.employee=e;a.employee_id=e.id;a.candidates=[e];a.mention=employeeName(e);draft.assignments=normalizeAssignments(draft.assignments);draft.updatedAt=new Date().toISOString();STATE.context.activePersonId=e.id;STATE.pending.question=nextClarification(draft);return{ok:true,html:`<div class="notice ok"><b>تمام، تقصد ${esc(employeeName(e))}.</b> كملت نفس المسودة وحافظت على بقية الخطة.</div>${renderRosterDraft(draft)}`}}

function rosterIntent(text){const n=norm(text);return/خطة التواجد|خطه التواجد|روستر|جدول الدوام|خطة دوام|خطه دوام/.test(n)}
function rosterCreateIntent(text){const n=norm(text);return rosterIntent(text)&&/سوي|سو|انشئ|أنشئ|جهز|ابني|اعمل|رتب|خطة|خطه/.test(n)}
function rosterModifyIntent(text){const n=norm(text);return rosterIntent(text)&&/عدل|عدّل|غير|غيّر|خلي|بدل/.test(n)}
function correctionIntent(text){const n=norm(text);return/^(لا |قصدي|اقصد|أقصد|عدل|عدّل|غير|غيّر|خلي|خله|خلها|خليها|خل |وخل|بس |الا |إلا )/.test(n)||/اجازته|إجازته|دوامه|شفت/.test(n)}
function showDraftIntent(text){const n=norm(text);return/اعرض.*(?:مسوده|مسودة|خطه|خطة)|ورني.*(?:مسوده|مسودة|خطه|خطة)|وش فهمت|ايش فهمت|المسوده|المسودة/.test(n)}
function cancelDraftIntent(text){const n=norm(text);return/الغ.*(?:المسوده|المسودة|الخطه|الخطة)|احذف.*(?:المسوده|المسودة)/.test(n)}
function approveDraftIntent(text){const n=norm(text);return/^(اعتمد|اعتمدها|اعتمد الخطة|اعتمد الخطه|اعتمد المسودة|اعتمد المسوده)$/.test(n)}
function saveDraftIntent(text){const n=norm(text);return/احفظ.*(?:خطه|خطة|مسوده|مسودة)|ثبت.*(?:خطه|خطة)|سجل.*(?:خطه|خطة)/.test(n)}
function draftPersonQuery(text,people){const n=norm(text);return!!STATE.pending.draft&&people.some(x=>x.resolved)&&(/وش|ايش|كيف|دوام|خطه|خطة|\?$/.test(n)||/^و/.test(n))&&!correctionIntent(text)}
function draftOpinionIntent(text){const n=norm(text);return!!STATE.pending.draft&&/وش رايك|وش رأيك|كيف تشوف|هل الخطة كويسه|هل الخطه كويسه/.test(n)}
function sensitiveWrite(text){const n=norm(text);return/احفظ|ثبت|سجل|اغلق|أغلق|صعد|صعّد|ارسل|أرسل|اعتمد/.test(n)}

function publicPeople(people){return people.map(p=>({matched:p.matched,resolved:p.resolved,employee_id:p.employee?.id||null,name:p.employee?employeeName(p.employee):null,candidates:(p.candidates||[]).map(e=>({id:e.id,name:employeeName(e)})),confidence:p.confidence,start:p.start,end:p.end}))}
function interpret(text,base={}){
  const n=norm(text),people=resolvePeople(text),follow=isFollowUp(text),explicitDomain=detectExplicitDomain(text,base),domain=explicitDomain||(follow?STATE.context.domain:null),period=resolveConversationPeriod(text,base)||(follow?clone(STATE.context.period):null),social=socialKind(text);let mode=operationMode(text,base),action='delegate';
  if(social){mode='conversation';action='social'}
  else if(STATE.pending.question?.type==='employee'){mode='conversation';action='clarification'}
  else if(cancelDraftIntent(text)&&STATE.pending.draft){mode='conversation';action='cancel_draft'}
  else if(approveDraftIntent(text)&&STATE.pending.draft){mode='review';action='approve_draft'}
  else if(saveDraftIntent(text)&&STATE.pending.draft){mode='write';action='safe_write'}
  else if(showDraftIntent(text)&&STATE.pending.draft){mode='conversation';action='show_draft'}
  else if(draftOpinionIntent(text)){mode='conversation';action='draft_opinion'}
  else if((rosterModifyIntent(text)||correctionIntent(text))&&STATE.pending.draft?.kind==='roster'){mode='draft';action='update_roster_draft'}
  else if(rosterCreateIntent(text)||((domain==='attendance'||explicitDomain==='attendance')&&people.length>=2&&/صباح|مساء|اجازه|اجازة|ثلوث|ربوع|الاثنين|الاحد|الجمعه|الجمعة/.test(n))){mode='draft';action='create_roster_draft'}
  else if(draftPersonQuery(text,people)){mode='conversation';action='draft_person_query'}
  else if(/^(ليش|ليه)$/.test(n)&&STATE.pending.question){mode='conversation';action='explain_question'}
  const frame={raw:text,normalized:n,mode,action,domain:action.includes('roster')?'attendance':domain,period,followUp:follow,people:publicPeople(people),operation:base?.entities?.operation||null,sensitive:sensitiveWrite(text)};return frame
}
function internalPeople(frame){return resolvePeople(frame.raw)}
function remember(frame){STATE.context.lastFrame=clone(frame);if(frame.domain)STATE.context.domain=frame.domain;if(frame.period)STATE.context.period=clone(frame.period);const rp=frame.people?.filter(x=>x.resolved&&x.employee_id)||[];if(rp.length===1)STATE.context.activePersonId=rp[0].employee_id;STATE.turns.push({at:new Date().toISOString(),frame:clone(frame)});if(STATE.turns.length>80)STATE.turns.splice(0,STATE.turns.length-80);if(AI.state)AI.state.context={...(AI.state.context||{}),intent:'conversation_intelligence',entities:{...(AI.state.context?.entities||{}),domain:frame.domain||AI.state.context?.entities?.domain||null,conversation:clone(frame)},lastMessage:frame.raw}}

function socialResponse(kind){if(kind==='greeting')return'<b>وعليكم السلام، حياك.</b><div class="mut">اكتب لي بطريقتك الطبيعية؛ أقدر أسألك عند نقطة ناقصة وأكمل معك من نفس السياق.</div>';if(kind==='thanks')return'<b>العفو.</b> أنا معك.';if(kind==='ack')return STATE.pending.draft?'<b>تمام.</b> المسودة محفوظة داخل الحوار، كمل بأي تعديل أو سؤال عليها.':'<b>تمام.</b> كمل.';return'<b>معك.</b>'}
function draftPersonAnswer(frame){const draft=STATE.pending.draft,people=internalPeople(frame).filter(x=>x.resolved);if(!draft||!people.length)return renderRosterDraft(draft);const parts=[];for(const p of people){const a=findDraftAssignment(draft,p.employee);STATE.context.activePersonId=p.employee.id;if(a)parts.push(`<div class="task"><b>${esc(employeeName(p.employee))}</b><div class="mut">الدوام الأساسي: ${esc(statusLabel(a.defaultStatus))}<br>الاستثناءات: ${esc(exceptionsText(a))}</div></div>`);else parts.push(`<div class="task"><b>${esc(employeeName(p.employee))}</b><div class="mut">لم أضع له تكليفًا في المسودة الحالية.</div></div>`)}return`<b>حسب المسودة الحالية:</b>${parts.join('')}`}
function draftOpinion(){return`<b>أقدر أراجع اتساق المسودة، لكن ما راح أحكم أنها «أفضل توزيع» بدون قواعد توزيع معتمدة.</b><div class="mut" style="margin-top:6px">حاليًا أقدر أتحقق من أن كل اسم له دوام واضح، وأن الإجازات والاستثناءات غير متعارضة، وأعرض لك أي نقطة ناقصة قبل الحفظ.</div>`}
function explainQuestion(){const q=STATE.pending.question;if(q?.type==='employee')return`<b>سألت عن الاسم فقط لأن هذا الجزء له أكثر من مطابق في فريق المعرض.</b><div class="mut">بقية طلبك مفهومة ومحفوظة؛ ما أحتاج منك تعيد الخطة كاملة.</div>`;return'<b>السؤال كان فقط لإكمال نقطة ناقصة في السياق.</b>'}
async function stageOperationalDraftResponse(){
  const d=STATE.pending.draft,bridge=AI.rosterOperational;
  if(!d?.period?.start){if(d)d.operationalStageRequested=true;return`<b>بقي تحديد أسبوع الخطة قبل تحويلها للتشغيل.</b><div class="mut" style="margin-top:6px">حدد هذا الأسبوع أو الأسبوع القادم، وسأكمل على نفس المسودة.</div>`}
  const q=nextClarification(d);if(q){d.operationalStageRequested=true;return`<b>بقي تحديد اسم واحد قبل التحويل التشغيلي.</b><div class="mut" style="margin-top:6px">اكتب الاسم الكامل المقصود لـ«${esc(q.mention)}»، وسأحافظ على بقية المسودة.</div>`}
  if(!bridge?.stage)return`<b>المسودة الحوارية محفوظة، لكن الربط مع شاشة خطة التواجد غير متاح في هذه النسخة.</b>${renderRosterDraft(d,{compact:true})}`;
  const result=await bridge.stage(d);
  if(!result?.ok)return`<div class="notice err"><b>لم أحوّل المسودة إلى الخطة التشغيلية.</b><div style="margin-top:5px">${esc(result?.message||'تعذر تجهيز شاشة خطة التواجد.')}</div></div>${renderRosterDraft(d,{compact:true})}`;
  delete d.operationalStageRequested;
  const missing=result.missingCells?` بقيت ${result.missingCells} خانة فارغة لتراجعها أو تكملها قبل الاعتماد النهائي.`:' الجدول مكتمل وجاهز للمراجعة.';
  return`<div class="notice ok"><b>حوّلتها إلى مسودة تشغيلية داخل شاشة خطة التواجد.</b><div style="margin-top:5px">راجع الجدول وعدّله عند الحاجة، ثم اضغط «اعتماد وحفظ الخطة الأصلية» لتصبح الخطة تشغيلية ومحفوظة.${missing}</div></div>`
}
async function safeWriteResponse(){return stageOperationalDraftResponse()}
async function approveDraftResponse(){return stageOperationalDraftResponse()}

async function respond(frame){
  const people=internalPeople(frame);
  if(frame.action==='social')return socialResponse(socialKind(frame.raw));
  if(frame.action==='clarification'){const r=applyClarification(frame.raw);if(r){const d=STATE.pending.draft;if(r.ok&&d?.operationalStageRequested&&!STATE.pending.question&&d.period?.start)return`${r.html}${await stageOperationalDraftResponse()}`;return r.html}}
  if(frame.action==='cancel_draft'){STATE.pending.draft=null;STATE.pending.question=null;STATE.context.activePersonId=null;return'<b>ألغيت المسودة الحوارية.</b><div class="mut">لم يتغير أي سجل تشغيلي.</div>'}
  if(frame.action==='approve_draft')return await approveDraftResponse();
  if(frame.action==='safe_write')return await safeWriteResponse();
  if(frame.action==='show_draft')return renderRosterDraft(STATE.pending.draft);
  if(frame.action==='draft_opinion')return draftOpinion();
  if(frame.action==='explain_question')return explainQuestion();
  if(frame.action==='draft_person_query')return draftPersonAnswer(frame);
  if(frame.action==='create_roster_draft'){
    const d=parseRosterDraft(frame.raw,people,frame.period);STATE.pending.draft=d;STATE.pending.question=nextClarification(d);const resolved=people.filter(x=>x.resolved);if(resolved.length===1)STATE.context.activePersonId=resolved[0].employee.id;return`<div><b>فهمت طلبك كمسودة خطة تواجد متعددة الموظفين.</b></div>${renderRosterDraft(d)}`
  }
  if(frame.action==='update_roster_draft'){
    const d=mergeRosterDraft(STATE.pending.draft,frame.raw,people);STATE.pending.draft=d;STATE.pending.question=nextClarification(d);const resolved=people.filter(x=>x.resolved);if(resolved.length===1)STATE.context.activePersonId=resolved[0].employee.id;return`<div class="notice ok"><b>عدلت المسودة فقط، وحافظت على باقي الخطة.</b></div>${renderRosterDraft(d)}`
  }
  return null
}

const baseAnalyze=typeof AI.analyze==='function'?AI.analyze.bind(AI):null;
function enhancedAnalyze(text){let a={raw:text,normalized:norm(text),entities:{}};try{if(baseAnalyze)a=baseAnalyze(text)||a}catch{}a.entities=a.entities||{};const frame=interpret(text,a);a.entities.conversation=clone(frame);a.entities.people=clone(frame.people);if(!a.entities.domain&&frame.domain)a.entities.domain=frame.domain;if(!a.entities.period&&frame.period)a.entities.period=clone(frame.period);a.conversation=clone(frame);return a}
AI.analyze=enhancedAnalyze;

const baseAsk=window.askRakizaAssistant;
const wrapped=async function(){
  const inp=document.getElementById('assistantInput'),q=inp?.value?.trim();if(!q)return;
  let base={raw:q,entities:{}};try{if(baseAnalyze)base=baseAnalyze(q)||base}catch{}
  const frame=interpret(q,base);remember(frame);
  if(frame.action==='delegate'){if(typeof baseAsk==='function')return baseAsk.apply(this,arguments);return}
  if(STATE.busy)return;STATE.busy=true;if(inp)inp.value='';chat('user',esc(q));try{const html=await respond(frame);chat('assistant',html||'<b>فهمت.</b>')}catch(e){chat('assistant',`<div class="notice err"><b>تعذر إكمال الحوار.</b><div style="margin-top:5px">${esc(e.message||String(e))}</div></div>`)}finally{STATE.busy=false}
};
wrapped.__rakizaConversationWrapped=true;
wrapped.__base=baseAsk;
window.askRakizaAssistant=wrapped;

AI.conversation={
  version:RAC_VERSION,
  state:STATE,
  resolvePeople,
  interpret,
  parseRosterDraft,
  mergeRosterDraft,
  renderRosterDraft,
  stageOperationalDraft:stageOperationalDraftResponse,
  nextClarification,
  respond,
  statusLabel,
  dayLabel,
  reset(){STATE.context={domain:null,period:null,topic:null,activePersonId:null,lastFrame:null};STATE.pending={draft:null,question:null};STATE.turns=[]}
};
})();
