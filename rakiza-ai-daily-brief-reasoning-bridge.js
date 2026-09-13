(()=>{
'use strict';

const AI=window.RakizaAI=window.RakizaAI||{};
if(!AI.dailyBrief||!AI.reasoning||typeof window.askRakizaAssistant!=='function')return;
if(window.askRakizaAssistant.__rakizaDailyBriefReasoningWrapped)return;

const base=window.askRakizaAssistant;
const SOURCES=[
  'ملخص اليوم التشغيلي وحالته المفتوحة/المغلقة',
  'أيام المبيعات والمستهدفات المعتمدة',
  'سجل الجاهزية وبنودها وأوزانها',
  'خطة التواجد والحضور الفعلي',
  'خطة اليوم والمهام وحالات التنفيذ النهائية',
  'سجل النواقص ودورة الطلب والتغذية',
  'سجل الإجراءات والمتابعات والتصعيد والإغلاق'
];
const CONSTRAINTS=[
  'الملخص اليومي يبرز ما يحتاج تدخل المدير ويختصر الوضع الطبيعي.',
  'مبيعات اليوم المفتوح لا تُعامل كصفر ولا تُعرض كنتيجة نهائية قبل الإغلاق.',
  'المهمة غير النهائية في اليوم المفتوح لا تُعامل كفشل.',
  'الأقدمية في الإجراء عامل متابعة وليست SLA أو حكم تأخير تلقائي.',
  'التزامن بين ضغط تشغيلي وفجوة بيعية لا يثبت السببية.',
  'لا توجد درجة صحة أو خطر مركبة للمعرض ما لم تُعتمد معادلتها.',
  'الملخص يقدم توصيات قراءة ومتابعة فقط ولا ينفذ تغييرًا تشغيليًا حساسًا تلقائيًا.'
];

function clone(v){try{return JSON.parse(JSON.stringify(v))}catch{return v}}
function confidenceFor(last){const b=last;if(!b)return'منخفضة';const day=b.daySnapshot||{},available=['sales','readiness','attendance','tasks','shortages','actions'].filter(k=>day[k]?.available).length;if(available>=5&&b.monthSnapshot?.sales?.available)return'متوسطة إلى مرتفعة';if(available>=3)return'متوسطة';return'منخفضة إلى متوسطة'}
function decorate(last,request){
  const R=AI.reasoning,card=R.recordSpecialist?.('daily_brief',last,request);if(!card)return;
  card.domainLabel='الملخص اليومي الذكي';
  card.dataSources=[...SOURCES];
  card.knowledgeLevel=R.levels?.RECOMMENDATION||'recommendation';
  card.confidence=confidenceFor(last);
  card.focus={type:'daily_brief',label:'يوم المعرض'};
  card.period={type:'date',date:last?.state?.date||null,label:'اليوم'};
  card.comparison=null;
  card.metric='manager_brief';
  card.constraints=[...CONSTRAINTS];
  card.safeguards={approvedLogicOnly:true,openDayNotZero:true,unfinalizedTaskNotFailure:true,causalClaimsNeedEvidence:true,noCompositeStoreScore:true,sensitiveWritesNeedApproval:true};
  const m=R.state?.memory;if(m){m.domain='daily_brief';m.focus=clone(card.focus);m.period=clone(card.period);m.comparison=null;m.metric=card.metric;m.confidence=card.confidence;m.knowledgeLevel=card.knowledgeLevel;m.constraints=clone(card.constraints);m.lastRequest=request||'';m.updatedAt=card.createdAt}
}

const wrapped=async function(){
  const q=document.getElementById('assistantInput')?.value?.trim()||'';
  const before=AI.dailyBrief?.state?.last||null;
  const result=await base.apply(this,arguments);
  const after=AI.dailyBrief?.state?.last||null;
  if(after&&after!==before)decorate(after,q);
  return result;
};
wrapped.__rakizaDailyBriefReasoningWrapped=true;
wrapped.__base=base;
window.askRakizaAssistant=wrapped;
AI.dailyBrief.reasoningBridge={version:'0.1.0',sources:SOURCES,constraints:CONSTRAINTS,decorate};
})();
