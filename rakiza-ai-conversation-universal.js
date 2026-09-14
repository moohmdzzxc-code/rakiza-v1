(()=>{
'use strict';

const AI=window.RakizaAI=window.RakizaAI||{};
if(AI.conversationUniversal?.version)return;

const RCU_VERSION='2.0.0';
const C=AI.conversation||null;
const baseAsk=window.askRakizaAssistant;
const analyze=typeof AI.analyze==='function'?AI.analyze.bind(AI):null;
const TIMEOUT_MS=30000;

const STATE={
  queue:Promise.resolve(),
  queueDepth:0,
  running:false,
  pendingClarification:null,
  health:{},
  lastRoute:null,
  lastError:null,
  processed:0
};

const REGISTRY={
  sales:{key:'sales',label:'المبيعات',detector:'isSalesLanguage'},
  shortages:{key:'shortages',label:'النواقص',detector:'isShortageLanguage'},
  readiness:{key:'readiness',label:'الجاهزية',detector:'isReadinessLanguage'},
  attendance:{key:'attendance',label:'الحضور والتواجد',detector:'isAttendanceLanguage'},
  tasks:{key:'tasks',label:'المهام والتنفيذ',detector:'isTasksLanguage'},
  actions:{key:'actions',label:'الإجراءات والمتابعة',detector:'isActionsLanguage'},
  store:{key:'store',label:'التحليل الشامل للمعرض',detector:'isStoreLanguage'}
};

function basicNorm(v){return String(v??'').toLowerCase().replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[\u064B-\u065F\u0670]/g,'').replace(/ـ/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/[،,:;؛!?؟.()\[\]{}"']/g,' ').replace(/\s+/g,' ').trim()}
function norm(v){try{return typeof AI.normalize==='function'?AI.normalize(v):basicNorm(v)}catch{return basicNorm(v)}}
function esc(v){return String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]))}
function clone(v){try{return JSON.parse(JSON.stringify(v))}catch{return v}}
function getApp(){try{return app}catch{return window.app||{}}}
function employees(){return(getApp().employees||[]).filter(e=>e&&e.active!==false)}
function employeeName(e){return e?.full_name||e?.name||''}
function employeeById(id){return employees().find(e=>String(e.id)===String(id))||null}
function chat(role,html){const c=document.getElementById('assistantChat');if(!c)return;const mine=role==='user';if(!mine&&AI.voice?.present)html=AI.voice.present(html,{source:'universal',domain:AI.conversation?.state?.context?.domain||AI.conversationUniversal?.state?.lastRoute||null});c.insertAdjacentHTML('beforeend',`<div style="display:flex;justify-content:${mine?'flex-start':'flex-end'}"><div class="task" style="max-width:92%;margin:0;background:${mine?'#eef3f8':'#fff'};border-color:${mine?'#d6e0ea':'#e3e7ec'}">${html}</div></div>`);c.lastElementChild?.scrollIntoView?.({behavior:'smooth',block:'nearest'})}
function safeAnalyze(text){let a={raw:text,normalized:norm(text),entities:{}};try{if(analyze)a=analyze(text)||a}catch(e){console.warn('Rakiza universal analyze fallback',e)}a.entities=a.entities||{};return a}
function conversationFrame(text,analysis){try{if(C?.interpret)return C.interpret(text,analysis)||{raw:text,action:'delegate',domain:analysis?.entities?.domain||null,people:[]}}catch(e){console.warn('Rakiza conversation frame fallback',e)}return{raw:text,normalized:norm(text),action:'delegate',domain:analysis?.entities?.domain||null,period:analysis?.entities?.period||null,followUp:false,people:[]}}
function labelFor(domain){return REGISTRY[domain]?.label||domain||'ركيزة AI'}

function explicitDomain(text){
  const n=norm(text),hits={
    sales:/مبيعات|بيع|تارقت|تارجت|تارغت|ترقت|target|تحقيق|فجوه|عجز/.test(n),
    shortages:/نواقص|نقص|صنف|مقاس|تغذيه|توريد|فرص ضايعه|فرص ضائعه/.test(n),
    readiness:/جاهزيه|نظافه|شبكه|مكيف|طفاي|نقاط البيع|مخارج طوارئ|جاهز/.test(n),
    attendance:/حضور|غياب|متاخر|تواجد|دوام|شفت|روستر|خطة التواجد|خطه التواجد/.test(n),
    tasks:/مهام|مهمه|خطة اليوم|خطه اليوم|استلام|تحويل|فيجوال|vm|تنفيذ المهام/.test(n),
    actions:/اجراء|متابعه|تصعيد|صيانه|طلب دعم|مشكله عميل|اغلاق الاجراء|إغلاق الإجراء/.test(n)
  };
  const active=Object.keys(hits).filter(k=>hits[k]);
  const holistic=/حلل|تحليل|وضع المعرض|وضعنا|الوضع العام|ملخص|قارن|اولويات|اولوية|سبب|ليش|اثر|تاثير|علاقه|ربط|ضغط/.test(n);
  if(active.length>=2&&holistic)return'store';
  if(active.length===1)return active[0];
  if(/وضع المعرض|وضعنا اليوم|الوضع العام|حلل المعرض|اولويات المعرض/.test(n))return'store';
  return null;
}
function candidateDomains(text,analysis,frame){
  const out=[];
  const push=d=>{if(REGISTRY[d]&&!out.includes(d))out.push(d)};
  const ex=explicitDomain(text);if(ex)push(ex);
  const fd=frame?.domain||analysis?.entities?.domain;if(fd==='multi')push('store');else push(fd);
  for(const [domain,cfg] of Object.entries(REGISTRY)){
    const mod=AI[cfg.key],fn=mod?.[cfg.detector];if(typeof fn!=='function')continue;
    try{if(fn(text,analysis))push(domain)}catch(e){console.warn(`Rakiza detector failed: ${domain}`,e)}
  }
  return out;
}
function resolveDomain(text,analysis,frame){
  const ex=explicitDomain(text);if(ex)return ex;
  const fd=frame?.domain||analysis?.entities?.domain;
  if(fd==='multi')return'store';if(REGISTRY[fd])return fd;
  const c=candidateDomains(text,analysis,frame);
  if(c.includes('store'))return'store';
  const nonStore=c.filter(x=>x!=='store');
  if(nonStore.length===1)return nonStore[0];
  if(nonStore.length>1&&/حلل|تحليل|وضع|ملخص|قارن|سبب|ليش|اثر|تاثير|علاقه|ربط|اولويات/.test(norm(text)))return'store';
  const prior=C?.state?.context?.domain;
  if(frame?.followUp&&REGISTRY[prior])return prior;
  return null;
}

function handlerFor(domain){const cfg=REGISTRY[domain],mod=cfg?AI[cfg.key]:null;return typeof mod?.answer==='function'?mod.answer.bind(mod):null}
function health(domain,ok,error=null){const prev=STATE.health[domain]||{failures:0,successes:0};STATE.health[domain]={ok,failures:prev.failures+(ok?0:1),successes:prev.successes+(ok?1:0),lastError:error?String(error?.message||error):null,updatedAt:new Date().toISOString()}}
function withTimeout(promise,ms=TIMEOUT_MS){let t;const timeout=new Promise((_,reject)=>{t=setTimeout(()=>reject(new Error('انتهت مهلة تنفيذ الوحدة')),ms)});return Promise.race([Promise.resolve(promise).finally(()=>clearTimeout(t)),timeout])}
async function safeInvoke(domain,text,analysis){
  const fn=handlerFor(domain);
  if(!fn){const e=new Error(`وحدة ${labelFor(domain)} غير جاهزة للاستدعاء المباشر`);health(domain,false,e);return{ok:false,error:e}}
  try{const html=await withTimeout(fn(text,analysis));health(domain,true);return{ok:true,html:html==null?'<b>تمت معالجة الطلب بدون نتيجة قابلة للعرض.</b>':String(html)}}
  catch(e){console.error(`Rakiza universal domain failure: ${domain}`,e);STATE.lastError={domain,message:String(e?.message||e),at:new Date().toISOString()};health(domain,false,e);return{ok:false,error:e}}
}
function failureHtml(domain){return`<div class="notice err"><b>تعذر إكمال طلب ${esc(labelFor(domain))} في هذه المحاولة.</b><div style="margin-top:5px">عزلت الخطأ داخل هذه الوحدة فقط؛ ركيزة AI ما توقف، وتقدر تكمل بسؤالك أو تنتقل لأي جزء آخر.</div></div>`}

function publicPeople(frame){return Array.isArray(frame?.people)?frame.people:[]}
function resolvedPeople(frame){return publicPeople(frame).filter(p=>p.resolved&&p.employee_id).map(p=>({...p,name:p.name||employeeName(employeeById(p.employee_id))}))}
function unresolvedPeople(frame){return publicPeople(frame).filter(p=>!p.resolved&&Array.isArray(p.candidates)&&p.candidates.length>1)}
function syntheticPeopleFromContext(domain,frame){
  const current=resolvedPeople(frame);if(current.length)return current;
  if(!frame?.followUp||!['attendance','tasks'].includes(domain))return[];
  const ids=C?.state?.context?.activePeopleIds||[];
  return ids.map(id=>{const e=employeeById(id);return e?{matched:employeeName(e),resolved:true,employee_id:e.id,name:employeeName(e),candidates:[{id:e.id,name:employeeName(e)}],confidence:'context',start:null,end:null}:null}).filter(Boolean)
}
function clarificationHtml(p){const names=(p?.candidates||[]).map(x=>x.name).filter(Boolean);return`<b>فهمت طلبك وباقي عندي الاسم فقط.</b><div class="mut" style="margin-top:6px">«${esc(p?.matched||'الاسم')}» ينطبق على أكثر من موظف${names.length?`: ${esc(names.join(' أو '))}`:''}. اكتب الاسم الكامل فقط، وبكمل نفس الطلب بدون ما تعيده.</div>`}
function candidateFromReply(text,p){
  const n=norm(text),c=p?.candidates||[];let m=c.filter(x=>n.includes(norm(x.name)));if(m.length===1)return m[0];
  const scored=c.map(x=>{const parts=norm(x.name).split(' ').filter(z=>z.length>=3),score=parts.filter(z=>new RegExp(`(?:^| )${z}(?: |$)`).test(n)).length;return{x,score}}).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
  return scored.length&&(!scored[1]||scored[0].score>scored[1].score)?scored[0].x:null
}
function beginClarification(domain,text,frame){const people=clone(publicPeople(frame)),idx=people.findIndex(p=>!p.resolved&&p.candidates?.length>1);if(idx<0)return null;STATE.pendingClarification={type:'domain_employee',domain,original:text,people,index:idx,createdAt:new Date().toISOString()};return clarificationHtml(people[idx])}
function nextPendingIndex(p){return p.people.findIndex(x=>!x.resolved&&x.candidates?.length>1)}
function resolvePendingReply(text){
  const p=STATE.pendingClarification;if(!p)return null;const cur=p.people[p.index],candidate=candidateFromReply(text,cur);if(!candidate)return{done:false,html:clarificationHtml(cur)};
  cur.resolved=true;cur.employee_id=candidate.id;cur.name=candidate.name;cur.candidates=[candidate];cur.confidence='clarified';
  const next=nextPendingIndex(p);if(next>=0){p.index=next;return{done:false,html:`<div class="notice ok"><b>تمام، تقصد ${esc(candidate.name)}.</b></div>${clarificationHtml(p.people[next])}`}}
  const done=clone(p);STATE.pendingClarification=null;return{done:true,pending:done,candidate}
}

function rewriteForPerson(text,target,people){
  const n=norm(text),spans=(people||[]).filter(p=>Number.isFinite(p.start)&&Number.isFinite(p.end)).sort((a,b)=>a.start-b.start);
  if(!spans.length)return`${n} ${norm(target.name||employeeName(employeeById(target.employee_id)))}`.trim();
  let out='',pos=0;for(const p of spans){if(p.start<pos)continue;out+=n.slice(pos,p.start);if(String(p.employee_id)===String(target.employee_id))out+=` ${norm(target.name||employeeName(employeeById(target.employee_id)))} `;pos=p.end}out+=n.slice(pos);return out.replace(/\s+/g,' ').trim()
}
function setActivePeople(domain,people){
  if(!C?.state?.context)return;const ids=(people||[]).map(x=>x.employee_id).filter(Boolean);C.state.context.activePeopleIds=ids;C.state.context.activePersonId=ids.length===1?ids[0]:null;C.state.context.domain=domain
}
function recordTurn(frame,domain){
  if(!C?.state)return;C.state.context=C.state.context||{};C.state.context.lastFrame=clone({...frame,domain:domain||frame?.domain||null});if(domain)C.state.context.domain=domain;if(frame?.period)C.state.context.period=clone(frame.period);C.state.turns=C.state.turns||[];C.state.turns.push({at:new Date().toISOString(),frame:clone({...frame,domain:domain||frame?.domain||null,universal:true})});if(C.state.turns.length>80)C.state.turns.splice(0,C.state.turns.length-80)
}
function sectionHtml(name,html){return`<div class="task"><b>${esc(name)}</b><div style="margin-top:7px">${html}</div></div>`}
async function invokeForPeople(domain,text,analysis,people){
  const results=[];for(const person of people){const q=rewriteForPerson(text,person,people),a=safeAnalyze(q);a.entities=a.entities||{};a.entities.domain=domain;a.entities.conversation={...(a.entities.conversation||{}),domain,focusEmployeeId:person.employee_id};const r=await safeInvoke(domain,q,a);results.push({person,r})}
  const good=results.filter(x=>x.r.ok),bad=results.filter(x=>!x.r.ok);let html=`<b>فصلت الطلب لكل موظف حتى ما تختلط الأسماء.</b><div style="margin-top:9px">${good.map(x=>sectionHtml(x.person.name||employeeName(employeeById(x.person.employee_id)),x.r.html)).join('')}</div>`;if(bad.length)html+=`<div class="notice err" style="margin-top:8px">تعذر إكمال ${bad.length} جزء من الطلب، لكن بقية الأجزاء استمرت بدون توقف.</div>`;return html
}

async function routeDomain(text,analysis,frame,domain,peopleOverride=null){
  let people=peopleOverride||resolvedPeople(frame),unresolved=peopleOverride?peopleOverride.filter(x=>!x.resolved):unresolvedPeople(frame),invokeText=text,invokeAnalysis=analysis;
  if(['attendance','tasks'].includes(domain)&&unresolved.length){const html=beginClarification(domain,text,{people:peopleOverride||publicPeople(frame)});return{handled:true,html,clarifying:true}}
  if(['attendance','tasks'].includes(domain)){
    if(!people.length)people=syntheticPeopleFromContext(domain,frame);
    if(people.length>1){setActivePeople(domain,people);return{handled:true,html:await invokeForPeople(domain,text,analysis,people)}}
    if(people.length===1){
      setActivePeople(domain,people);
      if(peopleOverride){invokeText=rewriteForPerson(text,people[0],peopleOverride);invokeAnalysis=safeAnalyze(invokeText);invokeAnalysis.entities=invokeAnalysis.entities||{};invokeAnalysis.entities.domain=domain}
    }else setActivePeople(domain,[])
  }else if(C?.state?.context){C.state.context.activePeopleIds=[];C.state.context.activePersonId=null}
  const r=await safeInvoke(domain,invokeText,invokeAnalysis);return{handled:true,html:r.ok?r.html:failureHtml(domain),failed:!r.ok}
}

async function processPendingReply(text){
  const p=STATE.pendingClarification;if(!p)return false;
  const analysis=safeAnalyze(text),frame=conversationFrame(text,analysis),newDomain=explicitDomain(text);
  const tryResolve=resolvePendingReply(text);
  if(!tryResolve?.done){
    if(newDomain&&newDomain!==p.domain){STATE.pendingClarification=null;return false}
    chat('user',esc(text));chat('assistant',tryResolve?.html||clarificationHtml(p.people[p.index]));return true
  }
  chat('user',esc(text));const done=tryResolve.pending,people=done.people.filter(x=>x.resolved&&x.employee_id);const originalAnalysis=safeAnalyze(done.original),originalFrame=conversationFrame(done.original,originalAnalysis);originalFrame.people=clone(done.people);recordTurn(originalFrame,done.domain);const routed=await routeDomain(done.original,originalAnalysis,originalFrame,done.domain,people);chat('assistant',`<div class="notice ok"><b>تمام، اكتمل الاسم وكملت نفس الطلب.</b></div>${routed.html}`);STATE.lastRoute=done.domain;STATE.processed++;return true
}

async function processOne(text){
  STATE.running=true;
  try{
    if(STATE.pendingClarification&&await processPendingReply(text))return;
    const analysis=safeAnalyze(text),frame=conversationFrame(text,analysis);
    if(frame.action!=='delegate'){
      recordTurn(frame,frame.domain);chat('user',esc(text));try{const html=await C.respond(frame);chat('assistant',html||'<b>فهمت.</b>')}catch(e){console.error('Rakiza conversation action failure',e);chat('assistant','<div class="notice err"><b>تعذر إكمال هذه الخطوة الحوارية.</b><div style="margin-top:5px">عزلت الخطأ، والمحادثة ما توقفت.</div></div>')}STATE.processed++;return
    }
    const domain=resolveDomain(text,analysis,frame);if(!domain){if(typeof baseAsk==='function'){const inp=document.getElementById('assistantInput');if(inp&&!inp.value)inp.value=text;try{return await baseAsk()}catch(e){console.error('Rakiza fallback chain failure',e);if(inp&&inp.value===text)inp.value='';chat('user',esc(text));chat('assistant','<div class="notice err"><b>تعذر توجيه الطلب في هذه المحاولة.</b><div style="margin-top:5px">المحادثة ما توقفت؛ اذكر المجال مثل المبيعات أو النواقص أو الجاهزية وسأكمل مباشرة.</div></div>');return}}return}
    recordTurn(frame,domain);chat('user',esc(text));const unresolved=unresolvedPeople(frame);if(['attendance','tasks'].includes(domain)&&unresolved.length){const h=beginClarification(domain,text,frame);chat('assistant',h);STATE.lastRoute=domain;STATE.processed++;return}
    const routed=await routeDomain(text,analysis,frame,domain);chat('assistant',routed.html);STATE.lastRoute=domain;STATE.processed++
  }finally{STATE.running=false}
}
function enqueue(text){STATE.queueDepth++;const job=STATE.queue.then(()=>processOne(text)).catch(e=>{console.error('Rakiza universal queue isolation',e);STATE.lastError={domain:null,message:String(e?.message||e),at:new Date().toISOString()};chat('assistant','<div class="notice err"><b>حصل خطأ معزول أثناء تنفيذ الطلب.</b><div style="margin-top:5px">تمت استعادة مسار ركيزة AI ويمكنك المتابعة مباشرة.</div></div>')}).finally(()=>{STATE.queueDepth=Math.max(0,STATE.queueDepth-1)});STATE.queue=job.then(()=>undefined,()=>undefined);return job}

const wrapped=async function(){
  const inp=document.getElementById('assistantInput'),q=inp?.value?.trim();if(!q)return;
  const analysis=safeAnalyze(q),frame=conversationFrame(q,analysis),domain=resolveDomain(q,analysis,frame),ours=!!STATE.pendingClarification||frame.action!=='delegate'||!!domain;
  if(!ours){if(typeof baseAsk==='function')return baseAsk.apply(this,arguments);return}
  if(inp)inp.value='';return enqueue(q)
};
wrapped.__rakizaUniversalConversationWrapped=true;
wrapped.__base=baseAsk;
window.askRakizaAssistant=wrapped;

AI.conversationUniversal={
  version:RCU_VERSION,
  state:STATE,
  registry:REGISTRY,
  explicitDomain,
  candidateDomains,
  resolveDomain,
  handlerFor,
  safeInvoke,
  rewriteForPerson,
  invokeForPeople,
  enqueue,
  reset(){STATE.pendingClarification=null;STATE.health={};STATE.lastRoute=null;STATE.lastError=null;STATE.processed=0;STATE.queueDepth=0;if(C?.state?.context){C.state.context.activePeopleIds=[]}},
  healthSnapshot(){return clone(STATE.health)}
};
if(C)C.universalVersion=RCU_VERSION;
})();
