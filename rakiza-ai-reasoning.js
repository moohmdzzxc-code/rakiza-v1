(()=>{
'use strict';

const RZR_VERSION='0.1.0';
const AI=window.RakizaAI=window.RakizaAI||{};

const DOMAIN_LABELS={
  shortages:'النواقص',
  sales:'المبيعات',
  readiness:'الجاهزية التشغيلية',
  attendance:'الحضور والتواجد',
  roster:'خطة التواجد',
  tasks:'المهام والتنفيذ',
  actions:'الإجراءات والمتابعات'
};

const KNOWLEDGE_LEVELS={
  FACT:'fact',
  CALCULATION:'calculation',
  PATTERN:'pattern',
  INFERENCE:'inference',
  RECOMMENDATION:'recommendation'
};

const PRINCIPLES=Object.freeze({
  evidence_first:'اقرأ البيانات المطلوبة قبل التفسير، ولا تخمّن نتيجة من بيانات لم تُقرأ.',
  approved_logic_only:'استخدم قواعد ومعادلات وحالات ركيزة المعتمدة فقط، ولا تخترع KPI أو وزنًا أو درجة مركبة غير معتمدة.',
  separate_fact_from_inference:'افصل بين الحقيقة المسجلة، والحساب المباشر، والنمط، والاستنتاج، والتوصية.',
  confidence_bound:'لا تقل أكثر مما تثبته البيانات؛ اذكر نقص البيانات عندما يمنع استنتاجًا موثوقًا.',
  preserve_original:'حافظ على الأصل والسجل التاريخي؛ التعديل لا يمحو الخطة الأصلية أو الحالة السابقة.',
  independent_dimensions:'لا تدمج أبعادًا مستقلة: الجاهزية ليست المبيعات، والتصعيد ليس الإغلاق، وكفاية التواجد ليست التزام الموظف.',
  open_day_not_zero:'اليوم البيعي المفتوح الذي لم يُغلق لا يُعامل كمبيعات صفرية.',
  movement_not_customers:'الحركة أو الزوار لا تعني تلقائيًا عملاء فعليين أو تحويلًا ناجحًا.',
  escalation_not_closure:'التصعيد حالة متابعة وليس إغلاقًا؛ الإغلاق يحتاج نتيجة حل.',
  shortage_history:'التغذية أو الإغلاق لا يمحوان تاريخ النقص أو تكراره.',
  roster_original_preserved:'الخطة الأصلية للتواجد تبقى محفوظة، وأي تغيير يسجل منفصلًا مع سببه.',
  no_sensitive_write_without_approval:'القراءة والتحليل مسموحان، أما التغيير التشغيلي الحساس فيمر بمسودة/مراجعة واعتماد.',
  task_execution_open_not_failure:'عدم وجود حالة تنفيذ نهائية لمهمة في يوم مفتوح لا يعني أنها لم تنفذ؛ التنفيذ النهائي يثبت عند إغلاق اليوم.',
  operational_meaning:'لا تبحث عن الرقم فقط؛ اربط الرقم بمعناه التشغيلي دون تجاوز ما تثبته البيانات.'
});

const STATE={
  memory:{
    domain:null,
    focus:null,
    period:null,
    comparison:null,
    metric:null,
    lastResult:null,
    confidence:null,
    knowledgeLevel:null,
    constraints:[],
    lastRequest:'',
    updatedAt:null
  },
  lastCard:null,
  history:[],
  principles:PRINCIPLES
};

function norm(v){
  if(typeof AI.normalize==='function')return AI.normalize(v);
  return String(v??'').toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g,'').replace(/ـ/g,'')
    .replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/ؤ/g,'و').replace(/ئ/g,'ي')
    .replace(/[،,:;؛!?؟.()[\]{}"']/g,' ').replace(/\s+/g,' ').trim();
}

function clone(v){
  if(v==null)return v;
  try{return JSON.parse(JSON.stringify(v))}
  catch{return v}
}

function isFollowUp(text){
  const n=norm(text);
  return /^(طيب|تمام|زين|و |وال|وبعدين|بعدها|نفس|منه|منها|منهم|كم |طيب كم|وكم|والشهر|الشهر اللي قبله|الشهر الي قبله|الاسبوع اللي قبله|الأسبوع اللي قبله)/.test(n)
    || /^(الخميس|الجمعه|الجمعة|السبت|الاحد|الأحد|الاثنين|الثلوث|الثلاثاء|الربوع|الاربعاء|الأربعاء)\b/.test(n);
}

function explicitDomainFromText(text){
  const n=norm(text);
  const scores={sales:0,shortages:0,readiness:0,attendance:0,tasks:0,actions:0};
  if(/مبيعات|بيع|تارقت|تارجت|target|تحقيق|atv|upt|فواتير|عمليات بيعيه/.test(n))scores.sales+=3;
  if(/نواقص|نقص مخزون|صنف|مقاس|تغذيه|توريد|فرص ضايعه|فرص ضائعه/.test(n))scores.shortages+=3;
  if(/جاهزيه المعرض|الجاهزيه التشغيليه|نظافه|معروضات|طفايات|مخارج طوارئ|نقاط البيع|شبكه|مكيفات/.test(n))scores.readiness+=3;
  if(/حضور|غياب|غايب|متاخر|تواجد|دوام|شفت|خطه التواجد|خطة التواجد|الفريق|الموظف/.test(n))scores.attendance+=3;
  if(/مهام|مهمه|تنفيذ|خطة اليوم|خطه اليوم|استلام|تحويل|فيجوال/.test(n))scores.tasks+=3;
  if(/اجراء|إجراء|متابعه|متابعة|تصعيد|صيانه|صيانة|طلب دعم/.test(n))scores.actions+=3;
  const ranked=Object.entries(scores).sort((a,b)=>b[1]-a[1]);
  return ranked[0][1]>0&&(!ranked[1]||ranked[0][1]>ranked[1][1])?ranked[0][0]:null;
}

function contextualizeAnalysis(text,analysis){
  const a=analysis&&typeof analysis==='object'?analysis:{entities:{}};
  a.entities=a.entities||{};
  const explicit=a.entities.domain||explicitDomainFromText(text);
  if(explicit&&explicit!=='multi'){
    a.entities.domain=explicit;
    return a;
  }
  if(!explicit&&isFollowUp(text)&&STATE.memory.domain){
    a.entities.domain=STATE.memory.domain;
    a.entities.reasoningInherited=true;
    a.entities.reasoningContext={
      focus:clone(STATE.memory.focus),
      period:clone(STATE.memory.period),
      comparison:clone(STATE.memory.comparison),
      metric:STATE.memory.metric||null
    };
  }
  return a;
}

function knowledgeLevelFor(domain,last){
  const task=last?.spec?.task||last?.spec?.operation||'query';
  if(/analysis|analy|diagnos/.test(String(task)))return KNOWLEDGE_LEVELS.INFERENCE;
  if(/compare|rank|trend|recurrence/.test(String(task)))return KNOWLEDGE_LEVELS.PATTERN;
  if(/draft|recommend|plan/.test(String(task)))return KNOWLEDGE_LEVELS.RECOMMENDATION;
  if(/metric|score|count|sum|average|target|achievement|gap|variance|duration/.test(String(task)))return KNOWLEDGE_LEVELS.CALCULATION;
  if(domain==='sales'&&['summary','query'].includes(task))return KNOWLEDGE_LEVELS.CALCULATION;
  return KNOWLEDGE_LEVELS.FACT;
}

function constraintsFor(domain,last){
  const out=[];
  if(domain==='sales'){
    if(last?.spec?.metric&&String(last.spec.metric).startsWith('unsupported:'))out.push('المقياس المطلوب غير متوفر في سجل المبيعات الحالي.');
    out.push('اليوم المفتوح لا يُعامل كمبيعات صفرية قبل الإغلاق.');
  }
  if(domain==='shortages')out.push('التغذية أو الإغلاق لا يمحوان تاريخ النقص.');
  if(domain==='readiness')out.push('أوزان الجاهزية تؤخذ من منطق ركيزة المعتمد ولا تُستبدل بدرجة مخاطر مخفية.');
  if(domain==='attendance')out.push('الخطة الأصلية تبقى محفوظة، والتغيير لا يمحوها.');
  if(domain==='tasks'){out.push('اليوم المفتوح بلا حالة تنفيذ نهائية لا يُعامل كمهمة غير منفذة.');out.push('تعديل خطة اليوم لا يمحو النسخة السابقة، وأي تعديل معتمد يحتاج سببًا.');}
  return out;
}

function focusFor(domain,last){
  const s=last?.spec||{};
  if(domain==='shortages')return clone(last?.focus||s.focus||(last?.product?{type:'item',label:last.product}:null)||(s.section?{type:'section',label:s.section}:null));
  if(domain==='sales')return s.metric?{type:'metric',label:s.metric}:null;
  if(domain==='readiness'){
    if(s.item)return{type:'item',label:s.item.item_name_ar||s.item.name||String(s.item)};
    if(s.category)return{type:'category',label:s.category};
    if(s.metric)return{type:'metric',label:s.metric};
  }
  if(domain==='attendance'){
    if(s.employee&&!s.employee.ambiguous)return{type:'employee',id:s.employee.id||null,label:s.employee.full_name||s.employee.name||null};
    if(s.planStatus)return{type:'plan_status',label:s.planStatus};
    if(s.attStatus)return{type:'attendance_status',label:s.attStatus};
  }
  if(domain==='tasks'){
    if(s.employee&&!s.employee.ambiguous)return{type:'employee',id:s.employee.id||null,label:s.employee.full_name||s.employee.name||null};
    if(s.category)return{type:'task_category',label:s.category};
    if(s.section)return{type:'section',label:s.section.name||s.section};
    if(s.execution)return{type:'execution_status',label:s.execution};
  }
  return null;
}

function periodFor(last){return clone(last?.spec?.period||null)}
function comparisonFor(last){
  const p=last?.spec?.period;
  if(p?.type==='compare')return clone(p.periods||p);
  return null;
}
function metricFor(last){return last?.spec?.metric||last?.spec?.task||null}

function confidenceFor(domain,last,level){
  if(!last)return'منخفضة';
  if(last?.spec?.metric&&String(last.spec.metric).startsWith('unsupported:'))return'منخفضة';
  if(level===KNOWLEDGE_LEVELS.FACT||level===KNOWLEDGE_LEVELS.CALCULATION)return'مرتفعة';
  if(level===KNOWLEDGE_LEVELS.PATTERN)return'متوسطة إلى مرتفعة';
  if(level===KNOWLEDGE_LEVELS.INFERENCE)return'متوسطة';
  return'متوسطة';
}

function dataSourcesFor(domain){
  return {
    shortages:['سجل النواقص وحالات دورة الطلب والتغذية'],
    sales:['أيام المبيعات المسجلة والمستهدفات المعتمدة'],
    readiness:['سجل الجاهزية وبنودها وأوزانها المسجلة'],
    attendance:['خطة التواجد والحضور الفعلي وسجل تغييرات الخطة'],
    tasks:['خطة اليوم المعتمدة والمهام والتكليفات وحالات التنفيذ عند الإغلاق']
  }[domain]||['بيانات ركيزة المسجلة'];
}

function makeCard(domain,last,request){
  const level=knowledgeLevelFor(domain,last);
  return{
    domain,
    domainLabel:DOMAIN_LABELS[domain]||domain,
    request:request||last?.text||'',
    dataSources:dataSourcesFor(domain),
    knowledgeLevel:level,
    confidence:confidenceFor(domain,last,level),
    focus:focusFor(domain,last),
    period:periodFor(last),
    comparison:comparisonFor(last),
    metric:metricFor(last),
    constraints:constraintsFor(domain,last),
    safeguards:{
      approvedLogicOnly:true,
      preservesOriginal:true,
      separatesFactFromInference:true,
      sensitiveWritesNeedApproval:true
    },
    createdAt:new Date().toISOString()
  };
}

function recordSpecialist(domain,last,request){
  if(!domain||!last)return null;
  const card=makeCard(domain,last,request);
  STATE.lastCard=card;
  STATE.memory={
    ...STATE.memory,
    domain,
    focus:clone(card.focus),
    period:clone(card.period),
    comparison:clone(card.comparison),
    metric:card.metric,
    confidence:card.confidence,
    knowledgeLevel:card.knowledgeLevel,
    constraints:clone(card.constraints),
    lastRequest:card.request,
    updatedAt:card.createdAt
  };
  STATE.history.push(card);
  if(STATE.history.length>60)STATE.history.splice(0,STATE.history.length-60);
  return card;
}

function guardClaim({level,evidenceCount=0,hasDirectData=false,isCausal=false,hasCausalEvidence=false}={}){
  if([KNOWLEDGE_LEVELS.FACT,KNOWLEDGE_LEVELS.CALCULATION].includes(level)&&!hasDirectData)
    return{allowed:false,reason:'لا توجد بيانات مباشرة تكفي لإثبات النتيجة.'};
  if([KNOWLEDGE_LEVELS.PATTERN,KNOWLEDGE_LEVELS.INFERENCE,KNOWLEDGE_LEVELS.RECOMMENDATION].includes(level)&&evidenceCount<1)
    return{allowed:false,reason:'الاستنتاج يحتاج دليلًا مسجلًا واحدًا على الأقل.'};
  if(isCausal&&!hasCausalEvidence)
    return{allowed:false,reason:'الارتباط لا يثبت السبب؛ يلزم دليل سببي صريح قبل نسبة السبب.'};
  return{allowed:true,reason:null};
}

function priorityTuple(x={}){
  return[
    x.critical?1:0,
    x.blocking?1:0,
    Number(x.recurrence||0),
    Number(x.impact||0),
    Number(x.age||0)
  ];
}
function prioritize(items=[]){
  return [...items].sort((a,b)=>{
    const A=priorityTuple(a),B=priorityTuple(b);
    for(let i=0;i<A.length;i++)if(A[i]!==B[i])return B[i]-A[i];
    return 0;
  });
}

function actionSafety(action){
  const a=norm(action);
  if(/اعرض|حلل|قارن|احسب|وش|كم|مين|ورني/.test(a))return{mode:'read',needsApproval:false};
  if(/مسوده|مسودة|جهز|اقترح|سوي خطه|سوي خطة/.test(a))return{mode:'draft',needsApproval:false};
  if(/عدل|غير|احفظ|سجل|اغلق|أغلق|صعد|ارسل|أرسل|اعتمد/.test(a))return{mode:'write',needsApproval:true};
  return{mode:'unknown',needsApproval:false};
}

function snapshot(){
  return{
    shortages:AI.shortages?.state?.last||null,
    sales:AI.sales?.state?.last||null,
    readiness:AI.readiness?.state?.last||null,
    attendance:AI.attendance?.state?.last||null,
    tasks:AI.tasks?.state?.last||null
  };
}

function detectChanged(before,after){
  for(const d of ['tasks','attendance','readiness','sales','shortages']){
    if(after[d]&&after[d]!==before[d])return d;
  }
  return null;
}

function installAnalyzeBridge(){
  if(typeof AI.analyze!=='function'||AI.analyze.__rakizaReasoningWrapped)return;
  const base=AI.analyze.bind(AI);
  const wrapped=function(text){
    const a=base(text);
    return contextualizeAnalysis(text,a);
  };
  wrapped.__rakizaReasoningWrapped=true;
  wrapped.__base=base;
  AI.analyze=wrapped;
}

function installAskBridge(){
  if(typeof window.askRakizaAssistant!=='function'||window.askRakizaAssistant.__rakizaReasoningWrapped)return;
  const base=window.askRakizaAssistant;
  const wrapped=async function(){
    const q=document.getElementById('assistantInput')?.value?.trim()||'';
    const before=snapshot();
    const result=await base.apply(this,arguments);
    const after=snapshot(),domain=detectChanged(before,after);
    if(domain)recordSpecialist(domain,after[domain],q||after[domain]?.text||'');
    return result;
  };
  wrapped.__rakizaReasoningWrapped=true;
  wrapped.__base=base;
  window.askRakizaAssistant=wrapped;
}

function explainLast(){
  const c=STATE.lastCard;
  if(!c)return null;
  return{
    المجال:c.domainLabel,
    نوع_المعرفة:c.knowledgeLevel,
    الثقة:c.confidence,
    البيانات:c.dataSources,
    القيود:c.constraints,
    التركيز:c.focus,
    الفترة:c.period
  };
}

installAnalyzeBridge();
installAskBridge();

AI.reasoning={
  version:RZR_VERSION,
  state:STATE,
  principles:PRINCIPLES,
  levels:KNOWLEDGE_LEVELS,
  contextualizeAnalysis,
  isFollowUp,
  explicitDomainFromText,
  recordSpecialist,
  makeCard,
  guardClaim,
  prioritize,
  actionSafety,
  explainLast,
  snapshot,
  detectChanged
};
})();