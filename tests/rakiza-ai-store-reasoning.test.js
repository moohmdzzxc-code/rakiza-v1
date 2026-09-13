function norm(v){return String(v??'').toLowerCase().replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/[،,:;؛!?؟.()[\]{}"']/g,' ').replace(/\s+/g,' ').trim()}
const input={value:''};
global.document={getElementById:id=>id==='assistantInput'?input:null};
global.window={RakizaAI:{normalize:norm,analyze:q=>({raw:q,entities:{domain:null}}),shortages:{state:{last:null}},sales:{state:{last:null}},readiness:{state:{last:null}},attendance:{state:{last:null}},tasks:{state:{last:null}},actions:{state:{last:null}},store:{state:{last:null}}}};
window.askRakizaAssistant=async function(){const q=input.value;if(/حلل المعرض|وضع المعرض|اولويات|أولويات/.test(q)){window.RakizaAI.store.state.last={text:q,spec:{task:/اولويات|أولويات/.test(q)?'priorities':'analysis',period:{type:'range',start:'2026-09-07',end:'2026-09-13',label:'هذا الأسبوع حتى اليوم'}},snapshot:{sales:{available:true},readiness:{available:true}}}};
require('../rakiza-ai-reasoning.js');
const R=window.RakizaAI.reasoning;let pass=0;
function ok(c,m,g){if(!c){console.error('FAIL',m,g||'');process.exit(1)}pass++}

ok(R.explicitDomainFromText('حلل المعرض هذا الأسبوع')==='store','explicit store domain');
ok(R.explicitDomainFromText('وش وضع المعرض؟')==='store','store status domain');
ok(R.explicitDomainFromText('هل التشغيل مأثر على المبيعات؟')==='store','cross-domain causal domain');
ok(R.explicitDomainFromText('كم مبيعات اليوم؟')==='sales','sales still wins');
let c=R.makeCard('store',{text:'حلل المعرض',spec:{task:'analysis',period:{type:'range',start:'2026-09-07',end:'2026-09-13'}}},'حلل المعرض');
ok(c.knowledgeLevel==='inference','store analysis is inference',c);
ok(c.dataSources.some(x=>/المبيعات/.test(x))&&c.dataSources.some(x=>/الجاهزية/.test(x)),'store multi-source evidence',c.dataSources);
ok(c.constraints.some(x=>/السببية|سبب/.test(x)),'store causal constraint recorded',c.constraints);
ok(c.focus?.label==='المعرض','store focus',c.focus);
(async()=>{
 input.value='حلل المعرض هذا الأسبوع';await window.askRakizaAssistant();
 ok(R.state.memory.domain==='store','store turn recorded',R.state.memory);
 ok(R.state.memory.knowledgeLevel==='inference','store knowledge level retained',R.state.memory);
 ok(R.state.memory.focus?.label==='المعرض','store memory focus',R.state.memory);
 ok(R.state.lastCard.dataSources.length>=6,'all store sources listed',R.state.lastCard.dataSources);
 let a=window.RakizaAI.analyze('طيب وش أكثر مشكلة متكررة؟');
 ok(a.entities.domain==='store'&&a.entities.reasoningInherited===true,'generic follow-up inherits store',a);
 a=window.RakizaAI.analyze('كم مبيعات اليوم؟');
 ok(a.entities.domain==='sales'&&!a.entities.reasoningInherited,'explicit sales overrides store',a);
 input.value='وش أهم أولويات المعرض؟';await window.askRakizaAssistant();
 ok(R.state.memory.domain==='store','store priorities recorded',R.state.memory);
 ok(['recommendation','inference'].includes(R.state.memory.knowledgeLevel),'store priority knowledge level',R.state.memory);
 const ex=R.explainLast();
 ok(ex['المجال']==='التحليل الشامل للمعرض','store explain label',ex);
 ok(!('chainOfThought' in R.state.lastCard),'no hidden chain of thought',R.state.lastCard);
 console.log('Rakiza AI store reasoning tests passed:',pass);
})().catch(e=>{console.error(e);process.exit(1)});
