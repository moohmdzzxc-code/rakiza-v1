function norm(v){return String(v??'').toLowerCase().replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/[،,:;؛!?؟.()[\]{}"']/g,' ').replace(/\s+/g,' ').trim()}
const input={value:''};
global.document={getElementById:id=>id==='assistantInput'?input:null};
global.window={RakizaAI:{
  normalize:norm,
  analyze:q=>({raw:q,entities:{domain:null}}),
  shortages:{state:{last:null}},sales:{state:{last:null}},readiness:{state:{last:null}},attendance:{state:{last:null}},tasks:{state:{last:null}},actions:{state:{last:null}},store:{state:{last:null}}
}};
window.askRakizaAssistant=async function(){
  const q=input.value;
  if(/حلل المعرض|وضع المعرض|اولويات|أولويات/.test(q)){
    const task=/اولويات|أولويات/.test(q)?'priorities':'analysis';
    window.RakizaAI.store.state.last={
      text:q,
      spec:{task,period:{type:'range',start:'2026-09-07',end:'2026-09-13',label:'هذا الأسبوع حتى اليوم'}},
      snapshot:{
        sales:{available:true},readiness:{available:true},attendance:{available:true},tasks:{available:true},shortages:{available:true},actions:{available:true}
      }
    };
  }else if(/مبيعات|تارقت/.test(q)){
    window.RakizaAI.sales.state.last={text:q,spec:{task:'metric',metric:'sales',period:{type:'date',date:'2026-09-13',label:'اليوم'}}};
  }
};

require('../rakiza-ai-reasoning-core.js');
require('../rakiza-ai-store-reasoning-bridge.js');
const R=window.RakizaAI.reasoning;let pass=0;
function ok(c,m,g){if(!c){console.error('FAIL',m,g||'');process.exit(1)}pass++}

(async()=>{
 input.value='حلل المعرض هذا الأسبوع';await window.askRakizaAssistant();
 ok(R.state.memory.domain==='store','store turn recorded',R.state.memory);
 ok(R.state.memory.knowledgeLevel==='inference','store analysis level',R.state.memory);
 ok(R.state.memory.focus?.label==='المعرض','store focus retained',R.state.memory);
 ok(R.state.lastCard.domainLabel==='التحليل الشامل للمعرض','store label decorated',R.state.lastCard);
 ok(R.state.lastCard.dataSources.length===6,'six store sources listed',R.state.lastCard.dataSources);
 ok(R.state.lastCard.dataSources.some(x=>/المبيعات/.test(x))&&R.state.lastCard.dataSources.some(x=>/الجاهزية/.test(x)),'multi-source evidence named',R.state.lastCard.dataSources);
 ok(R.state.lastCard.constraints.some(x=>/سبب/.test(x)),'causal constraint recorded',R.state.lastCard.constraints);
 ok(R.state.lastCard.safeguards.noCompositeStoreScore===true,'no composite store score safeguard',R.state.lastCard.safeguards);
 ok(R.state.lastCard.safeguards.causalClaimsNeedEvidence===true,'causal evidence safeguard',R.state.lastCard.safeguards);

 let a=window.RakizaAI.analyze('طيب وش أكثر مشكلة متكررة؟');
 ok(a.entities.domain==='store'&&a.entities.reasoningInherited===true,'generic follow-up inherits store',a);
 a=window.RakizaAI.analyze('كم مبيعات اليوم؟');
 ok(a.entities.domain==='sales'&&!a.entities.reasoningInherited,'explicit sales overrides store memory',a);

 input.value='كم مبيعات اليوم؟';await window.askRakizaAssistant();
 ok(R.state.memory.domain==='sales','single-domain request stays with sales reasoning',R.state.memory);
 ok(R.state.memory.knowledgeLevel==='calculation','sales calculation preserved',R.state.memory);

 input.value='وش أهم أولويات المعرض؟';await window.askRakizaAssistant();
 ok(R.state.memory.domain==='store','store priorities recorded',R.state.memory);
 ok(R.state.memory.knowledgeLevel==='recommendation','store priorities are recommendation',R.state.memory);
 ok(R.state.memory.metric==='priorities','store task stored as metric/context',R.state.memory);
 const ex=R.explainLast();
 ok(ex['المجال']==='التحليل الشامل للمعرض','explainLast store label',ex);
 ok(Array.isArray(ex['البيانات'])&&ex['البيانات'].length===6,'explainLast sources',ex);
 ok(!('chainOfThought' in R.state.lastCard),'no private chain of thought stored',R.state.lastCard);
 ok(R.state.history.length>=3,'reasoning history keeps store and specialist turns',R.state.history.length);
 console.log('Rakiza AI store reasoning tests passed:',pass);
})().catch(e=>{console.error(e);process.exit(1)});
