global.window={};
const employees=[
  {id:'e1',full_name:'محمد غرم الله محمد الغامدي',active:true},
  {id:'e2',full_name:'محمد عبده',active:true},
  {id:'e3',full_name:'عمار مثنى',active:true},
  {id:'e4',full_name:'معتوق الحارثي',active:true},
  {id:'e5',full_name:'عبدالصبور محمد كاظم',active:true}
];
global.app={calendarDate:'2026-09-13',date:'2026-09-13',employees};window.app=global.app;
let delegated=0;
window.RakizaAI={
  state:{context:{}},
  analyze:q=>({raw:q,entities:{
    domain:/مبيعات|بيع|تارقت/.test(q)?'sales':/نواقص|نقص/.test(q)?'shortages':/جاهزي|شبكه/.test(q)?'readiness':/حضور|غياب|تواجد|دوام|خطة التواجد|خطه التواجد/.test(q)?'attendance':/مهام|خطة اليوم|خطه اليوم/.test(q)?'tasks':/اجراء|متابعه|تصعيد|صيانه/.test(q)?'actions':null,
    operation:/حلل|قارن/.test(q)?'analyze':/سوي|انشئ|أنشئ/.test(q)?'create':'query'
  }})
};
window.askRakizaAssistant=async()=>{delegated++;return'delegated'};
const els={assistantInput:{value:''},assistantChat:{items:[],insertAdjacentHTML(_p,h){this.items.push(h)},lastElementChild:{scrollIntoView(){}}}};
global.document={getElementById:id=>els[id]||null};window.document=global.document;
require('../rakiza-ai-conversation.js');

const calls={sales:[],shortages:[],readiness:[],attendance:[],tasks:[],actions:[],store:[]};
function detector(re){return q=>re.test(String(q||''))}
window.RakizaAI.sales={state:{},isSalesLanguage:detector(/مبيعات|بيع|تارقت/),answer:async q=>{calls.sales.push(q);if(/اكسر المبيعات/.test(q))throw Error('sales boom');if(/بطيء/.test(q))await new Promise(r=>setTimeout(r,30));return`SALES:${q}`}};
window.RakizaAI.shortages={state:{},isShortageLanguage:detector(/نواقص|نقص|صنف|تغذيه/),answer:async q=>{calls.shortages.push(q);return`SHORTAGES:${q}`}};
window.RakizaAI.readiness={state:{},isReadinessLanguage:detector(/جاهزي|شبكه|مكيف/),answer:async q=>{calls.readiness.push(q);return`READINESS:${q}`}};
window.RakizaAI.attendance={state:{},isAttendanceLanguage:detector(/حضور|غياب|تواجد|دوام|شفت/),answer:async q=>{calls.attendance.push(q);return`ATTENDANCE:${q}`}};
window.RakizaAI.tasks={state:{},isTasksLanguage:detector(/مهام|مهمه|خطة اليوم|خطه اليوم/),answer:async q=>{calls.tasks.push(q);return`TASKS:${q}`}};
window.RakizaAI.actions={state:{},isActionsLanguage:detector(/اجراء|متابعه|تصعيد|صيانه/),answer:async q=>{calls.actions.push(q);return`ACTIONS:${q}`}};
window.RakizaAI.store={state:{},isStoreLanguage:q=>/وضع المعرض|حلل المعرض|علاقه|تاثير/.test(String(q||'')),answer:async q=>{calls.store.push(q);return`STORE:${q}`}};
require('../rakiza-ai-conversation-universal.js');

const C=window.RakizaAI.conversation,U=window.RakizaAI.conversationUniversal;
let pass=0;
function ok(c,m,g){if(!c){console.error('FAIL',m,g||'');process.exit(1)}pass++}
function clear(){for(const k of Object.keys(calls))calls[k].length=0;delegated=0;els.assistantChat.items=[];C.reset();U.reset()}
async function ask(q){els.assistantInput.value=q;return window.askRakizaAssistant()}

(async()=>{
clear();
await ask('كم مبيعات هذا الشهر');
ok(calls.sales.length===1,'sales routed directly through universal layer',calls.sales);ok(delegated===0,'sales does not depend on old wrapper chain');ok(U.state.lastRoute==='sales','sales route remembered');ok(C.state.context.domain==='sales','shared conversation domain updated');
await ask('طيب الشهر الماضي');
ok(calls.sales.length===2,'sales follow-up keeps domain without repeating keyword',calls.sales);ok(calls.sales[1].includes('الشهر الماضي'),'follow-up text preserved');

clear();await ask('وش أكثر صنف في النواقص؟');ok(calls.shortages.length===1,'shortages routed directly');
clear();await ask('حلل الجاهزية هذا الشهر');ok(calls.readiness.length===1,'readiness routed directly');
clear();await ask('وش مهام اليوم؟');ok(calls.tasks.length===1,'tasks routed directly');
clear();await ask('وش الإجراءات قيد المتابعة؟');ok(calls.actions.length===1,'actions routed directly');
clear();await ask('المبيعات ضعيفة والنواقص كثيرة وش السبب؟');ok(calls.store.length===1,'cross-domain causal request routed to store intelligence',calls.store);

// Multiple employees are split into focused specialist calls instead of becoming a global name ambiguity failure.
clear();await ask('كم غياب عمار ومعتوق هذا الشهر');
ok(calls.attendance.length===2,'multi-person attendance split into two focused calls',calls.attendance);ok(calls.attendance.some(x=>x.includes('عمار مثنى')),'Ammar full name focused');ok(calls.attendance.some(x=>x.includes('معتوق الحارثي')),'Matuq full name focused');
ok(calls.attendance.every(x=>!(x.includes('عمار مثنى')&&x.includes('معتوق الحارثي'))),'each specialist call contains one employee only',calls.attendance);
ok((C.state.context.activePeopleIds||[]).length===2,'multi-person context retained for follow-up',C.state.context.activePeopleIds);
await ask('طيب الشهر الماضي');ok(calls.attendance.length===4,'group follow-up repeats for same employee set',calls.attendance);

// Ambiguous employee pauses only for the missing name, then resumes the original request.
clear();await ask('كم غياب محمد هذا الشهر');
ok(calls.attendance.length===0,'ambiguous employee does not execute wrong attendance query');ok(!!U.state.pendingClarification,'generic employee clarification stored');ok(els.assistantChat.items.join('').includes('محمد غرم الله محمد الغامدي')&&els.assistantChat.items.join('').includes('محمد عبده'),'clarification shows local choices');
await ask('محمد عبده');
ok(!U.state.pendingClarification,'clarification cleared after exact employee');ok(calls.attendance.length===1,'original attendance request resumed after clarification',calls.attendance);ok(calls.attendance[0].includes('محمد عبده'),'resumed query focuses clarified employee',calls.attendance[0]);

// One specialist error is isolated and does not freeze the assistant.
clear();await ask('اكسر المبيعات');
ok(U.state.health.sales?.ok===false,'sales failure recorded in health state',U.state.health.sales);ok(els.assistantChat.items.join('').includes('ركيزة AI ما توقف'),'failure response explicitly preserves conversation continuity');
await ask('حلل الجاهزية');ok(calls.readiness.length===1,'next domain still executes after previous domain failure');ok(U.state.health.readiness?.ok===true,'readiness health recovers independently');

// Busy work is queued instead of silently dropping the next message.
clear();const p1=ask('مبيعات بطيء هذا الشهر');const p2=ask('وش مهام اليوم؟');await Promise.all([p1,p2]);ok(calls.sales.length===1,'slow sales request completed');ok(calls.tasks.length===1,'second request queued and completed instead of dropped');ok(U.state.queueDepth===0&&!U.state.running,'queue returns to idle state');

// Approved roster conversation still stays in the v1 draft engine, not specialist execution.
clear();await ask('انشاء خطة تواجد عمار صباح ومعتوق مساء');ok(C.state.pending.draft?.kind==='roster','roster draft still handled by approved conversation engine');ok(calls.attendance.length===0,'roster draft does not bypass into attendance specialist');

// Unknown intents still fall back to the pre-existing assistant chain.
clear();await ask('افتح الصفحة الرئيسية');ok(delegated===1,'unknown non-domain intent preserves old assistant fallback');

ok(window.askRakizaAssistant.__rakizaUniversalConversationWrapped===true,'universal wrapper is outer layer');ok(window.askRakizaAssistant.__base?.__rakizaConversationWrapped===true,'conversation v1 remains immediately below universal layer');ok(C.universalVersion==='2.0.0','conversation v1 exposes universal integration version');ok(!('chainOfThought' in U.state),'no hidden chain of thought stored');ok(!JSON.stringify(U.state).includes('chainOfThought'),'serialized universal state contains no hidden chain of thought');
console.log('Rakiza AI universal conversation tests passed:',pass);
})().catch(e=>{console.error(e);process.exit(1)});
