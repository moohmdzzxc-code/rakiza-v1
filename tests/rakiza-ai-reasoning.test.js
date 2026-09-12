const path=require('path');

function norm(v){return String(v??'').toLowerCase().replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/[،,:;؛!?؟.()[\]{}"']/g,' ').replace(/\s+/g,' ').trim()}

const input={value:''};
global.document={getElementById:(id)=>id==='assistantInput'?input:null};
global.window={
  RakizaAI:{
    normalize:norm,
    analyze:(q)=>({raw:q,entities:{domain:null}}),
    shortages:{state:{last:null}},
    sales:{state:{last:null}},
    readiness:{state:{last:null}},
    attendance:{state:{last:null}}
  }
};

window.askRakizaAssistant=async function(){
  const q=input.value;
  if(/مبيعات|تارقت/.test(q)){
    window.RakizaAI.sales.state.last={text:q,spec:{task:'metric',metric:'sales',period:{type:'month',month:'2026-09'}}};
  }else if(/نواقص|صنف/.test(q)){
    window.RakizaAI.shortages.state.last={text:q,spec:{task:'rank',metric:'lost',period:{type:'month',month:'2026-09'}},focus:{type:'item',label:'60L'}};
  }else if(/جاهزي/.test(q)){
    window.RakizaAI.readiness.state.last={text:q,spec:{task:'analysis',metric:'score',category:'الأجهزة والأنظمة',period:{type:'month',month:'2026-09'}}};
  }else if(/حضور|غياب|تواجد/.test(q)){
    window.RakizaAI.attendance.state.last={text:q,spec:{task:'rank_absence',employee:{id:'e2',full_name:'عمار مثنى'},period:{type:'month',month:'2026-09'}}};
  }
};

require('../rakiza-ai-reasoning.js');
const R=window.RakizaAI.reasoning;
let pass=0;
function ok(cond,msg,got){if(!cond){console.error('FAIL',msg,got??'');process.exit(1)}pass++}

// core philosophy from Rakiza discussions
ok(R.version==='0.1.0','version');
for(const key of ['evidence_first','approved_logic_only','separate_fact_from_inference','confidence_bound','preserve_original','independent_dimensions','open_day_not_zero','movement_not_customers','escalation_not_closure','shortage_history','roster_original_preserved','no_sensitive_write_without_approval','operational_meaning']){
  ok(!!R.principles[key],`principle ${key}`);
}

// knowledge ladder
let c=R.makeCard('sales',{text:'كم المبيعات؟',spec:{task:'metric',metric:'sales'}},'كم المبيعات؟');
ok(c.knowledgeLevel==='calculation','sales metric is calculation',c);
c=R.makeCard('readiness',{text:'حلل الجاهزية',spec:{task:'analysis'}},'حلل الجاهزية');
ok(c.knowledgeLevel==='inference','analysis is inference',c);
c=R.makeCard('shortages',{text:'رتب النواقص',spec:{task:'rank'}},'رتب النواقص');
ok(c.knowledgeLevel==='pattern','rank is pattern',c);
c=R.makeCard('attendance',{text:'سوي مسودة',spec:{task:'draft'}},'سوي مسودة');
ok(c.knowledgeLevel==='recommendation','draft is recommendation',c);

// evidence/causality guards
let g=R.guardClaim({level:'fact',hasDirectData:false});
ok(g.allowed===false,'fact needs direct data',g);
g=R.guardClaim({level:'inference',evidenceCount:0});
ok(g.allowed===false,'inference needs evidence',g);
g=R.guardClaim({level:'inference',evidenceCount:2,isCausal:true,hasCausalEvidence:false});
ok(g.allowed===false&&/السبب/.test(g.reason),'causal claim blocked without causal evidence',g);
g=R.guardClaim({level:'pattern',evidenceCount:2});
ok(g.allowed===true,'pattern allowed with evidence',g);

// priority is explicit lexicographic, not hidden composite
const pr=R.prioritize([
  {id:'old',age:20,impact:20,recurrence:3},
  {id:'critical',critical:true,age:1},
  {id:'blocking',blocking:true,age:30},
  {id:'repeat',recurrence:7,impact:1}
]);
ok(pr[0].id==='critical','critical first',pr.map(x=>x.id));
ok(pr[1].id==='blocking','blocking second',pr.map(x=>x.id));
ok(pr[2].id==='repeat','recurrence before impact/age',pr.map(x=>x.id));

// write governance
ok(R.actionSafety('حلل مبيعات الشهر').needsApproval===false,'analysis read only');
ok(R.actionSafety('جهز مسودة خطة').mode==='draft','draft safe mode');
ok(R.actionSafety('عدل الخطة واحفظ').needsApproval===true,'write needs approval');

// explicit domain wins
let a=R.contextualizeAnalysis('وش أكثر صنف ناقص؟',{entities:{}});
ok(a.entities.domain==='shortages','explicit shortages domain',a);
a=R.contextualizeAnalysis('كم مبيعات اليوم؟',{entities:{}});
ok(a.entities.domain==='sales','explicit sales domain',a);
a=R.contextualizeAnalysis('وش جاهزية المعرض؟',{entities:{}});
ok(a.entities.domain==='readiness','explicit readiness domain',a);
a=R.contextualizeAnalysis('مين غايب اليوم؟',{entities:{}});
ok(a.entities.domain==='attendance','explicit attendance domain',a);

// specialist bridge: sales
(async()=>{
  input.value='كم مبيعات سبتمبر؟';
  await window.askRakizaAssistant();
  ok(R.state.memory.domain==='sales','sales recorded through ask bridge',R.state.memory);
  ok(R.state.memory.metric==='sales','sales metric memory',R.state.memory);
  ok(R.state.memory.confidence==='مرتفعة','sales direct confidence',R.state.memory);
  ok(R.state.lastCard.dataSources.some(x=>/المبيعات/.test(x)),'sales sources recorded',R.state.lastCard);

  // follow-up inherits domain only if no explicit new domain
  a=window.RakizaAI.analyze('طيب الشهر الماضي؟');
  ok(a.entities.domain==='sales'&&a.entities.reasoningInherited===true,'follow-up inherits sales',a);
  a=window.RakizaAI.analyze('وش أكثر صنف ناقص؟');
  ok(a.entities.domain==='shortages'&&!a.entities.reasoningInherited,'explicit new domain overrides memory',a);

  // shortages
  input.value='وش أكثر صنف ناقص وخسر فرص؟';
  await window.askRakizaAssistant();
  ok(R.state.memory.domain==='shortages','shortages recorded',R.state.memory);
  ok(R.state.memory.focus?.label==='60L','shortage focus retained',R.state.memory);
  ok(R.state.memory.knowledgeLevel==='pattern','shortage ranking pattern',R.state.memory);

  // readiness
  input.value='حلل جاهزية المعرض هذا الشهر';
  await window.askRakizaAssistant();
  ok(R.state.memory.domain==='readiness','readiness recorded',R.state.memory);
  ok(R.state.memory.knowledgeLevel==='inference','readiness analysis level',R.state.memory);
  ok(R.state.memory.focus?.label==='الأجهزة والأنظمة','readiness focus',R.state.memory);

  // attendance
  input.value='مين أكثر واحد غياب هذا الشهر';
  await window.askRakizaAssistant();
  ok(R.state.memory.domain==='attendance','attendance recorded',R.state.memory);
  ok(R.state.memory.focus?.label==='عمار مثنى','employee focus',R.state.memory);

  // last reasoning card is transparent, not chain-of-thought
  const ex=R.explainLast();
  ok(ex['المجال']==='الحضور والتواجد','explainLast domain',ex);
  ok(Array.isArray(ex['البيانات'])&&ex['البيانات'].length>0,'explainLast data source',ex);
  ok(!('chainOfThought' in R.state.lastCard),'no private chain of thought stored',R.state.lastCard);

  // history maintained
  ok(R.state.history.length>=4,'history records specialist turns',R.state.history.length);

  console.log('Rakiza AI reasoning tests passed:',pass);
})().catch(e=>{console.error(e);process.exit(1)});