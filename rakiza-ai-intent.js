(()=>{
'use strict';

const AI=window.RakizaAI=window.RakizaAI||{};
const C=AI.conversation;
if(!C||AI.intent?.version)return;

const VERSION='1.0.0';
const STATE={last:null,history:[]};
const baseInterpret=C.interpret.bind(C);
const baseRespond=C.respond.bind(C);

const DOMAIN_LABELS={sales:'المبيعات',shortages:'النواقص',readiness:'الجاهزية',attendance:'الحضور والتواجد',tasks:'المهام والتنفيذ',actions:'الإجراءات والمتابعة',store:'التحليل الشامل'};

const DICT={
  sales:[
    ['مبيعات',4],['المبيعات',4],['بيع',3],['المبيع',3],['تارقت',4],['تارجت',4],['تارغت',4],['target',4],['مستهدف',4],['الهدف',3],['حققنا',3],['تحقيق',3],['العجز',3],['فجوه',3],['فجوة',3],['atv',3],['upt',3],['فاتوره',2],['فواتير',2],['سله',2],['السله',2],['كم بعنا',4],['كم حققنا',4],['ارقامنا',2],['أرقامنا',2],['رقم اليوم',2]
  ],
  shortages:[
    ['نواقص',4],['النواقص',4],['نقص',3],['ناقص',3],['صنف',3],['اصناف',3],['مقاس',3],['مقاسات',3],['مخزون',3],['تغذيه',4],['توريد',3],['انقطع',3],['منقطع',3],['توفر',2],['وصلتنا',2],['وصلنا',2],['ما وصل',3],['طلبناه',3],['طلبناها',3],['فرص ضايعه',4],['فرص ضائعه',4],['بضاعه ناقصه',4]
  ],
  readiness:[
    ['جاهزيه',4],['جاهزية',4],['جاهز',3],['افتتاح',2],['نظافه',3],['واجهات',2],['كاشير',2],['مستودع',2],['شبكه',3],['نقاط البيع',3],['كمبيوتر',2],['مكيف',3],['مكيفات',3],['طفايه',3],['طفايات',3],['مخارج طوارئ',4],['سلامه',3],['اناره',2],['صاله',2]
  ],
  attendance:[
    ['حضور',4],['غياب',4],['متاخر',3],['تواجد',4],['دوام',4],['شفت',4],['صباحي',3],['صباح',2],['مسائي',3],['مساء',2],['اجازه',3],['اجازة',3],['اوف',3],['راحه',2],['سنويه',2],['سكليف',3],['تعويضي',2],['روستر',4],['مداوم',4],['مين موجود',4],['مين مداوم',4],['الفريق اليوم',3]
  ],
  tasks:[
    ['مهام',4],['مهمه',3],['مهمة',3],['خطة اليوم',4],['خطه اليوم',4],['استلام',4],['تحويل',4],['ترتيب',3],['تعبئه',3],['تعبئة',3],['فيجوال',4],['vm',4],['تنفيذ',2],['مسؤول عن',3],['مين مسؤول',4],['كلف',2],['تكليف',3]
  ],
  actions:[
    ['اجراء',4],['إجراء',4],['متابعه',4],['متابعة',4],['تصعيد',4],['صعدنا',3],['رفعناه',3],['رفعنا',2],['للمشرف',2],['صيانه',4],['صيانة',4],['طلب دعم',4],['مشكله عميل',4],['مشكلة عميل',4],['قيد المتابعه',4],['مغلق',2],['وين وصل',3],['وش صار عليه',3]
  ],
  store:[
    ['وضع المعرض',5],['وضعنا',4],['الوضع العام',4],['حلل المعرض',5],['اولويات',4],['أولويات',4],['الزبدة',3],['الزبد ه',1],['وش وضعنا',4],['وش المشكله',3],['وش المشكلة',3],['ضغط',2],['وش موقفنا',3],['ليش متراجعين',4],['الصوره كامله',4],['الصورة كاملة',4]
  ]
};

const OP={
  create:['سوي','سو','انشئ','انشاء','أنشئ','جهز','حضر','حضّر','ابني','اعمل','كون','كوّن','طلع لي','ابي','أبي','ابغى','ابغا','ودي'],
  modify:['عدل','عدّل','غير','غيّر','خلي','خل','حط','شيل','احذف','بدل','استبدل','قدم','اخر','أخر','زود','نقص'],
  compare:['قارن','مقارنه','مقارنة','مقابل','الفرق بين'],
  analyze:['حلل','تحليل','فسر','فسّر','ليش','سبب','وش السبب','وش المشكله','وش المشكلة','قيم','قيّم','اولويات','أولويات','اربط','العلاقه','العلاقة','اثر','تاثير','تأثير'],
  query:['وش','ايش','إيش','كم','مين','من','هل','وين','متى','كيف','اعرض','ورني','عطني','اعطني','طلع'],
  meta:['كيف','ليش كذا','وش تقصد','وضح','وضّح','ما فهمت','كيف فهمتها','وش فهمت','ايش فهمت','ليش فهمتها كذا']
};

const DAY_WORDS=['الاحد','الأحد','الاثنين','الإثنين','الثلاثاء','ثلوث','الاربعاء','الأربعاء','ربوع','الخميس','الجمعه','الجمعة','السبت'];
const SHIFT_WORDS=['صباح','صباحي','مساء','مسائي','اجازه','اجازة','اوف','راحه','راحة','سنويه','سنوية','سكليف','تعويضي'];
const PERIOD_WORDS=['اليوم','امس','أمس','بكره','بكرة','غدا','الأسبوع','الاسبوع','الشهر','هذا الاسبوع','الاسبوع الجاي','الأسبوع الجاي','الشهر الماضي'];

function norm(v){
  try{return typeof AI.normalize==='function'?AI.normalize(v):basicNorm(v)}catch{return basicNorm(v)}
}
function basicNorm(v){return String(v??'').toLowerCase().replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[\u064B-\u065F\u0670]/g,'').replace(/ـ/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/[،,:;؛!?؟.()\[\]{}"']/g,' ').replace(/\s+/g,' ').trim()}
function clone(v){try{return JSON.parse(JSON.stringify(v))}catch{return v}}
function toks(v){return norm(v).split(' ').filter(Boolean)}
function hasPhrase(n,p){return n.includes(norm(p))}
function hasAny(n,list){return list.some(x=>hasPhrase(n,x))}
function levenshtein(a,b){a=String(a);b=String(b);const m=a.length,n=b.length;if(!m)return n;if(!n)return m;let prev=Array.from({length:n+1},(_,i)=>i),cur=new Array(n+1);for(let i=1;i<=m;i++){cur[0]=i;for(let j=1;j<=n;j++)cur[j]=Math.min(cur[j-1]+1,prev[j]+1,prev[j-1]+(a[i-1]===b[j-1]?0:1));[prev,cur]=[cur,prev]}return prev[n]}
function fuzzyWordHit(text,word){const w=norm(word);if(w.includes(' ')||w.length<5)return false;const max=w.length>=8?2:1;return toks(text).some(t=>t.length>=4&&Math.abs(t.length-w.length)<=max&&levenshtein(t,w)<=max)}
function scoreDict(text,entries){const n=norm(text);let score=0,hits=[];for(const [phrase,weight] of entries){if(hasPhrase(n,phrase)){score+=weight;hits.push(norm(phrase))}else if(fuzzyWordHit(n,phrase)){score+=Math.max(1,weight-2);hits.push(`~${norm(phrase)}`)}}return{score,hits}}
function opHit(n,list){return list.some(x=>hasPhrase(n,x))}
function isMeta(n){return OP.meta.some(x=>norm(x)===n)||(/^(كيف|ليش|وضح|وش تقصد)$/.test(n)&&!!STATE.last)}
function peopleCount(frame){return Array.isArray(frame?.people)?frame.people.length:0}
function resolvedPeopleCount(frame){return Array.isArray(frame?.people)?frame.people.filter(x=>x.resolved).length:0}
function hasAssignmentStructure(text,frame){const n=norm(text),pc=peopleCount(frame),shift=hasAny(n,SHIFT_WORDS),day=hasAny(n,DAY_WORDS),week=/اسبوع|أسبوع|طوال الاسبوع|طوال الأسبوع/.test(n);return pc>=1&&shift&&(day||week||pc>=2)}
function rosterObjectCue(n){return /خطه.*تواجد|خطة.*تواجد|جدول.*تواجد|جدول.*دوام|خطه.*دوام|خطة.*دوام|روستر/.test(n)}
function followUpCue(n){return /^(طيب|تمام|زين|وبعدين|بعدها|ونفس|نفس|والشهر|والاسبوع|والأسبوع|وقبلها|واللي|والي|وهو|وهي|وهم|طيب و|لا |قصدي|اقصد)/.test(n)||/اللي قبله|الي قبله|نفسه|نفسها/.test(n)}

function inferOperation(text,frame){
  const n=norm(text);
  if(isMeta(n))return'meta';
  if(opHit(n,OP.compare))return'compare';
  if(opHit(n,OP.analyze))return'analyze';
  const pendingRoster=C.state?.pending?.draft?.kind==='roster';
  if(opHit(n,OP.modify))return pendingRoster?'modify_draft':'modify';
  if(opHit(n,OP.create))return'create';
  if(hasAssignmentStructure(text,frame))return pendingRoster?'modify_draft':'create';
  if(opHit(n,OP.query)||frame?.domain)return'query';
  return'conversation';
}

function domainScores(text,frame,base){
  const n=norm(text),scores={},evidence={};
  for(const [domain,entries] of Object.entries(DICT)){const r=scoreDict(n,entries);scores[domain]=r.score;evidence[domain]=r.hits}
  const pc=peopleCount(frame),rpc=resolvedPeopleCount(frame),assignment=hasAssignmentStructure(text,frame);
  if(assignment){scores.attendance+=7;evidence.attendance.push('assignment_structure')}
  if(pc&&hasAny(n,SHIFT_WORDS)){scores.attendance+=4;evidence.attendance.push('people+shift')}
  if(pc&&hasAny(n,DAY_WORDS)){scores.attendance+=2;evidence.attendance.push('people+day')}
  if(/اسبوع|أسبوع/.test(n)&&hasAny(n,SHIFT_WORDS)){scores.attendance+=2;evidence.attendance.push('week+shift')}
  if(/استلام|تحويل|فيجوال|vm|ترتيب|تعبئ/.test(n)&&pc){scores.tasks+=3;evidence.tasks.push('people+task')}
  if(/هدف|مستهدف|تارقت|تارجت|تحقيق|حققنا/.test(n)&&hasAny(n,PERIOD_WORDS)){scores.sales+=3;evidence.sales.push('target+period')}
  if(/منقطع|ناقص|نقص/.test(n)&&/صنف|مقاس|بضاع|مخزون/.test(n)){scores.shortages+=3;evidence.shortages.push('stock_shortage')}
  if(/جاهز|افتتاح/.test(n)&&/فرع|معرض|اليوم/.test(n)){scores.readiness+=3;evidence.readiness.push('opening_readiness')}
  if(/رفعناه|رفعنا|للمشرف|وين وصل|وش صار عليه/.test(n)){scores.actions+=3;evidence.actions.push('followup_action')}
  const explicit=base?.entities?.domain||frame?.domain;if(explicit&&scores[explicit]!=null){scores[explicit]+=3;evidence[explicit].push('existing_analyzer')}
  const ctx=C.state?.context?.domain;
  if(followUpCue(n)&&ctx&&scores[ctx]!=null){scores[ctx]+=5;evidence[ctx].push('conversation_context')}
  if(STATE.last?.domain&&followUpCue(n)&&scores[STATE.last.domain]!=null){scores[STATE.last.domain]+=2;evidence[STATE.last.domain].push('intent_context')}
  if(C.state?.pending?.draft?.kind==='roster'&&(pc||hasAny(n,SHIFT_WORDS)||hasAny(n,DAY_WORDS))){scores.attendance+=6;evidence.attendance.push('active_roster_draft')}
  const domainSignals=Object.entries(scores).filter(([d,s])=>d!=='store'&&s>=4).length;
  const holistic=opHit(n,OP.analyze)||opHit(n,OP.compare)||/وضعنا|وضع المعرض|الصوره|الصورة|الزبد/.test(n);
  if(domainSignals>=2&&holistic){scores.store+=7;evidence.store.push('cross_domain_analysis')}
  if(domainSignals>=2&&!holistic&&/وش السبب|ليش|اثر|تاثير|ربط/.test(n)){scores.store+=6;evidence.store.push('cross_domain_reasoning')}
  if(rpc>=2&&assignment){scores.attendance+=2}
  return{scores,evidence};
}

function chooseDomain(text,frame,base,operation){
  const {scores,evidence}=domainScores(text,frame,base),ranked=Object.entries(scores).sort((a,b)=>b[1]-a[1]),top=ranked[0]||[null,0],second=ranked[1]||[null,0];
  let domain=top[1]>=3?top[0]:null;
  if(!domain&&followUpCue(norm(text))&&C.state?.context?.domain)domain=C.state.context.domain;
  if(!domain&&operation==='meta'&&STATE.last?.domain)domain=STATE.last.domain;
  if(domain!=='store'&&second[1]>=top[1]-1&&top[1]>=4&&second[1]>=4&&['analyze','compare'].includes(operation))domain='store';
  const confidence=top[1]<=0?0:Math.max(0.35,Math.min(0.98,0.42+(top[1]/14)-Math.max(0,second[1]-2)/30));
  return{domain,confidence,scores,evidence,alternatives:ranked.slice(0,3).map(([d,s])=>({domain:d,score:s}))};
}

function infer(text,baseFrame={},base={}){
  const operation=inferOperation(text,baseFrame),route=chooseDomain(text,baseFrame,base,operation),n=norm(text),assignment=hasAssignmentStructure(text,baseFrame),roster=rosterObjectCue(n)||assignment||C.state?.pending?.draft?.kind==='roster';
  let action='delegate',mode=baseFrame.mode||'query',subdomain=null;
  if(operation==='meta'){action='intent_meta';mode='conversation'}
  else if(route.domain==='attendance'&&roster&&operation==='create'){action='create_roster_draft';mode='draft';subdomain='roster'}
  else if(route.domain==='attendance'&&roster&&operation==='modify_draft'){action='update_roster_draft';mode='draft';subdomain='roster'}
  else if(operation==='analyze'||operation==='compare')mode='analysis';
  else if(operation==='create'||operation==='modify')mode='draft';
  const result={version:VERSION,operation,domain:route.domain,subdomain,confidence:route.confidence,action,mode,alternatives:route.alternatives,signals:Object.fromEntries(Object.entries(route.evidence).filter(([,v])=>v.length).map(([k,v])=>[k,v.slice(0,8)])),followUp:followUpCue(n),assignment};
  return result;
}

function rememberIntent(i,text){if(i.operation==='meta')return;STATE.last={...clone(i),text:String(text||''),at:new Date().toISOString()};STATE.history.push(STATE.last);if(STATE.history.length>60)STATE.history.splice(0,STATE.history.length-60)}
function intentSummary(i){if(!i)return'ما عندي طلب سابق واضح أشرحه.';const op={query:'استفسار',analyze:'تحليل',compare:'مقارنة',create:'إنشاء مسودة',modify:'تعديل',modify_draft:'تعديل مسودة',conversation:'حوار'}[i.operation]||i.operation;return`فهمت طلبك السابق على أنه <b>${op}</b>${i.domain?` في <b>${DOMAIN_LABELS[i.domain]||i.domain}</b>`:''}${i.subdomain==='roster'?'، وبالتحديد خطة التواجد':''}.`}

C.interpret=function(text,base={}){
  const frame=baseInterpret(text,base);
  if(frame.action&&frame.action!=='delegate'){
    const i=infer(text,frame,base);frame.intentIntelligence=i;rememberIntent(i,text);return frame;
  }
  const i=infer(text,frame,base),next={...frame,intentIntelligence:i};
  if(i.domain)next.domain=i.domain;
  if(i.action!=='delegate'){next.action=i.action;next.mode=i.mode;if(i.action.includes('roster'))next.domain='attendance'}
  else if(i.mode)next.mode=i.mode;
  rememberIntent(i,text);return next;
};

C.respond=async function(frame){
  if(frame?.action==='intent_meta')return`<b>${intentSummary(STATE.last)}</b><div class="mut" style="margin-top:6px">إذا تقصد شيئًا مختلفًا قلها بطريقتك، وبكمل من نفس السياق بدل ما أطلب منك تعيد كل الطلب.</div>`;
  return baseRespond(frame);
};

AI.intent={
  version:VERSION,
  state:STATE,
  infer:(text,base={})=>{const f=baseInterpret(text,base);return infer(text,f,base)},
  domainScores:(text,base={})=>{const f=baseInterpret(text,base);return domainScores(text,f,base)},
  labels:DOMAIN_LABELS,
  reset(){STATE.last=null;STATE.history=[]}
};
C.intentVersion=VERSION;
})();
