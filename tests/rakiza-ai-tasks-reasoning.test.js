// Trigger integration after workflow registration.
function norm(v){return String(v??'').toLowerCase().replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/[،,:;؛!?؟.()\[\]{}"']/g,' ').replace(/\s+/g,' ').trim()}
const input={value:''};
global.document={getElementById:(id)=>id==='assistantInput'?input:null};
global.window={RakizaAI:{normalize:norm,analyze:q=>({raw:q,entities:{domain:null}}),shortages:{state:{last:null}},sales:{state:{last:null}},readiness:{state:{last:null}},attendance:{state:{last:null}},tasks:{state:{last:null}}}};
window.askRakizaAssistant=async function(){const q=input.value;if(/مهام|خطة اليوم|استلام/.test(q)){window.RakizaAI.tasks.state.last={text:q,spec:{task:'analysis',category:'استلام',employee:{id:'e2',full_name:'عمار مثنى'},period:{type:'month',month:'2026-09'}}}}};
require('../rakiza-ai-reasoning.js');
const R=window.RakizaAI.reasoning;let pass=0;
function ok(c,n,x){if(!c){console.error('FAIL',n,x||'');process.exit(1)}pass++}
(async()=>{
ok(!!R.principles.task_execution_open_not_failure,'task open execution principle');
input.value='حلل مهام الاستلام لعمار هذا الشهر';await window.askRakizaAssistant();
ok(R.state.memory.domain==='tasks','tasks recorded by reasoning bridge',R.state.memory);
ok(R.state.memory.focus?.type==='employee'||R.state.memory.focus?.type==='task_category','tasks focus recorded',R.state.memory);
ok(R.state.lastCard.dataSources.some(x=>/خطة اليوم|تنفيذ المهام/.test(x)),'task data source recorded',R.state.lastCard.dataSources);
ok(R.state.lastCard.constraints.some(x=>/اليوم المفتوح|التنفيذ النهائي/.test(x)),'open task constraint recorded',R.state.lastCard.constraints);
let a=window.RakizaAI.analyze('طيب الشهر الماضي؟');ok(a.entities.domain==='tasks'&&a.entities.reasoningInherited===true,'task follow-up reasoning context',a);
a=window.RakizaAI.analyze('كم مبيعات اليوم؟');ok(a.entities.domain==='sales'&&!a.entities.reasoningInherited,'explicit sales overrides task memory',a);
console.log('Rakiza AI tasks reasoning tests passed:',pass);
})().catch(e=>{console.error(e);process.exit(1)});
