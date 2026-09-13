global.window={};
const employees=[
  {id:'e1',full_name:'محمد غرم الله محمد الغامدي',active:true},
  {id:'e2',full_name:'محمد عبده',active:true},
  {id:'e3',full_name:'عمار مثنى',active:true},
  {id:'e4',full_name:'معتوق الحارثي',active:true}
];
global.app={calendarDate:'2026-09-13',date:'2026-09-13',employees};window.app=global.app;
let fallback=0;
window.RakizaAI={
  state:{context:{}},
  analyze:q=>({raw:q,entities:{}})
};
window.askRakizaAssistant=async()=>{fallback++;return'fallback'};
const els={assistantInput:{value:''},assistantChat:{items:[],insertAdjacentHTML(_p,h){this.items.push(h)},lastElementChild:{scrollIntoView(){}}}};
global.document={getElementById:id=>els[id]||null};window.document=global.document;

require('../rakiza-ai-conversation.js');
const calls={sales:[],shortages:[],readiness:[],attendance:[],tasks:[],actions:[],store:[]};
function detector(re){return q=>re.test(String(q||''))}
window.RakizaAI.sales={state:{},isSalesLanguage:detector(/مبيعات|بيع|تارقت/),answer:async q=>{calls.sales.push(q);return`SALES:${q}`}};
window.RakizaAI.shortages={state:{},isShortageLanguage:detector(/نواقص|نقص|صنف|تغذيه/),answer:async q=>{calls.shortages.push(q);return`SHORTAGES:${q}`}};
window.RakizaAI.readiness={state:{},isReadinessLanguage:detector(/جاهزي|شبكه|مكيف/),answer:async q=>{calls.readiness.push(q);return`READINESS:${q}`}};
window.RakizaAI.attendance={state:{},isAttendanceLanguage:detector(/حضور|غياب|تواجد|دوام|شفت/),answer:async q=>{calls.attendance.push(q);return`ATTENDANCE:${q}`}};
window.RakizaAI.tasks={state:{},isTasksLanguage:detector(/مهام|مهمه|استلام|تحويل|فيجوال|vm/),answer:async q=>{calls.tasks.push(q);return`TASKS:${q}`}};
window.RakizaAI.actions={state:{},isActionsLanguage:detector(/اجراء|متابعه|تصعيد|صيانه|دعم/),answer:async q=>{calls.actions.push(q);return`ACTIONS:${q}`}};
window.RakizaAI.store={state:{},isStoreLanguage:detector(/وضع المعرض|حلل المعرض|علاقه|تاثير/),answer:async q=>{calls.store.push(q);return`STORE:${q}`}};

require('../rakiza-ai-conversation-universal.js');
require('../rakiza-ai-conversation-compat.js');
require('../rakiza-ai-intent.js');

const C=window.RakizaAI.conversation,U=window.RakizaAI.conversationUniversal,I=window.RakizaAI.intent;
let pass=0;
function ok(c,m,g){if(!c){console.error('FAIL',m,g||'');process.exit(1)}pass++}
function reset(){for(const k of Object.keys(calls))calls[k].length=0;fallback=0;els.assistantChat.items=[];C.reset();U.reset();I.reset()}
async function ask(q){els.assistantInput.value=q;await window.askRakizaAssistant();return els.assistantChat.items.join('\n')}

(async()=>{
  reset();
  await ask('الأسبوع الجاي عمار صباح والجمعة اوف ومعتوق مساء والثلاثاء اجازة');
  ok(C.state.pending.draft?.kind==='roster','runtime infers roster draft from structure without saying خطة تواجد',C.state.pending);
  ok(calls.attendance.length===0,'runtime roster creation does not fall into attendance lookup',calls.attendance);
  ok(C.state.pending.draft.assignments?.length>=2,'runtime roster draft contains employee assignments',C.state.pending.draft);

  await ask('لا معتوق خله اوف الاربعاء');
  ok(C.state.pending.draft?.kind==='roster','runtime correction keeps same roster draft');
  ok(els.assistantChat.items.join('').includes('عدلت المسودة فقط'),'runtime correction uses conversational draft update');

  reset();
  await ask('وش وضع المبعات اليوم');
  ok(calls.sales.length===1,'runtime typo-tolerant sales intent reaches sales brain',calls.sales);
  ok(fallback===0,'runtime typo sales does not fall back');

  reset();
  await ask('وش الاشياء المنقطعة وما وصلتنا للحين');
  ok(calls.shortages.length===1,'runtime semantic shortage intent reaches shortages brain',calls.shortages);

  reset();
  await ask('الموضوع اللي رفعناه للمشرف وين وصل؟');
  ok(calls.actions.length===1,'runtime semantic follow-up reaches actions brain',calls.actions);

  reset();
  await ask('المبيعات ضعيفة والنواقص كثيرة وش السبب؟');
  ok(calls.store.length===1,'runtime cross-domain causal question reaches store intelligence',calls.store);
  ok(calls.sales.length===0&&calls.shortages.length===0,'runtime holistic routing avoids specialist competition');

  reset();
  await ask('أبي أعرف أرقامنا اليوم');
  ok(calls.sales.length===1,'desire phrasing is understood as a sales query',calls.sales);
  ok(!C.state.pending.draft,'desire query does not invent a draft');

  const meta=await ask('كيف');
  ok(meta.includes('فهمت طلبك السابق'),'runtime meta question explains previous intent',meta);
  ok(fallback===0,'meta conversation does not fall back');

  reset();
  await ask('مين مسؤول عن الاستلام والتحويل اليوم؟');
  ok(calls.tasks.length===1,'runtime task responsibility reaches tasks brain');
  ok(I.state.last?.operation==='query','word مسؤول does not turn query into create intent',I.state.last);

  ok(window.RakizaAI.intent.version==='1.0.0','runtime Intent Intelligence is active');
  ok(!JSON.stringify(I.state).includes('chainOfThought'),'runtime intent state stores no hidden chain of thought');
  console.log('Rakiza Intent Intelligence runtime tests passed:',pass);
})().catch(e=>{console.error(e);process.exit(1)});
