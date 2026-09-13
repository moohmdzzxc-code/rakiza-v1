(()=>{
'use strict';

const AI=window.RakizaAI=window.RakizaAI||{};
if(!AI.store||!AI.reasoning||typeof window.askRakizaAssistant!=='function')return;
if(window.askRakizaAssistant.__rakizaStoreReasoningWrapped)return;

const base=window.askRakizaAssistant;
const SOURCES=[
  'أيام المبيعات والمستهدفات المعتمدة',
  'سجل الجاهزية وبنودها وأوزانها',
  'خطة التواجد والحضور الفعلي',
  'خطة اليوم والمهام وحالات التنفيذ النهائية',
  'سجل النواقص ودورة الطلب والتغذية',
  'سجل الإجراءات والمتابعات والتصعيد والإغلاق'
];
const CONSTRAINTS=[
  'التحليل الشامل يربط الأدلة المسجلة دون اعتبار التزامن سببًا مباشرًا.',
  'لا توجد درجة صحة أو خطر مركبة للمعرض ما لم تُعتمد معادلتها لاحقًا.',
  'اليوم البيعي المفتوح لا يُعامل كمبيعات صفرية، والمهمة غير النهائية لا تُعامل كفشل.',
  'التصعيد يبقي الإجراء قيد المتابعة ولا يعني الإغلاق.'
];

function clone(v){try{return JSON.parse(JSON.stringify(v))}catch{return v}}
function levelFor(task){
  if(['priorities','pressure'].includes(task))return AI.reasoning.levels?.RECOMMENDATION||'recommendation';
  if(['compare','recurrence'].includes(task))return AI.reasoning.levels?.PATTERN||'pattern';
  return AI.reasoning.levels?.INFERENCE||'inference';
}
function confidenceFor(last){
  const snap=last?.snapshot;
  if(!snap)return'منخفضة';
  const sets=Array.isArray(snap?.compare)?snap.compare:[snap];
  let available=0,total=0;
  for(const s of sets){for(const k of ['sales','readiness','attendance','tasks','shortages','actions']){total++;if(s?.[k]?.available)available++}}
  if(!total||available<Math.ceil(total/2))return'منخفضة إلى متوسطة';
  if(available===total)return'متوسطة إلى مرتفعة';
  return'متوسطة';
}
function decorate(last,request){
  const R=AI.reasoning,card=R.recordSpecialist?.('store',last,request);
  if(!card)return;
  const level=levelFor(last?.spec?.task);
  card.domainLabel='التحليل الشامل للمعرض';
  card.dataSources=[...SOURCES];
  card.knowledgeLevel=level;
  card.confidence=confidenceFor(last);
  card.focus={type:'store',label:'المعرض'};
  card.period=clone(last?.spec?.period||null);
  card.comparison=last?.spec?.period?.type==='compare'?clone(last.spec.period.periods||[]):null;
  card.metric=last?.spec?.task||'analysis';
  card.constraints=[...CONSTRAINTS];
  card.safeguards={
    approvedLogicOnly:true,
    preservesOriginal:true,
    separatesFactFromInference:true,
    causalClaimsNeedEvidence:true,
    noCompositeStoreScore:true,
    sensitiveWritesNeedApproval:true
  };
  const m=R.state?.memory;
  if(m){
    m.domain='store';
    m.focus=clone(card.focus);
    m.period=clone(card.period);
    m.comparison=clone(card.comparison);
    m.metric=card.metric;
    m.confidence=card.confidence;
    m.knowledgeLevel=level;
    m.constraints=clone(card.constraints);
    m.lastRequest=request||last?.text||'';
    m.updatedAt=card.createdAt;
  }
}

const wrapped=async function(){
  const q=document.getElementById('assistantInput')?.value?.trim()||'';
  const before=AI.store?.state?.last||null;
  const result=await base.apply(this,arguments);
  const after=AI.store?.state?.last||null;
  if(after&&after!==before)decorate(after,q||after.text||'');
  return result;
};
wrapped.__rakizaStoreReasoningWrapped=true;
wrapped.__base=base;
window.askRakizaAssistant=wrapped;

AI.store.reasoningBridge={version:'0.1.0',sources:SOURCES,constraints:CONSTRAINTS,decorate};
})();
