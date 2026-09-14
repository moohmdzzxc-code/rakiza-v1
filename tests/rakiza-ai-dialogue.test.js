global.window={};
const employees=[
  {id:'e1',full_name:'عمار مثنى',active:true},
  {id:'e2',full_name:'معتوق الحارثي',active:true}
];
global.app={calendarDate:'2026-09-13',date:'2026-09-13',employees};window.app=global.app;
let fallback=0;
window.RakizaAI={state:{context:{}},analyze:q=>({raw:q,entities:{}})};
window.askRakizaAssistant=async()=>{fallback++;return'fallback'};
const els={assistantInput:{value:''},assistantChat:{items:[],insertAdjacentHTML(_p,h){this.items.push(h)},lastElementChild:{scrollIntoView(){}}}};
global.document={getElementById:id=>els[id]||null};window.document=global.document;

require('../rakiza-ai-conversation.js');
function detector(re){return q=>re.test(String(q||''))}
const calls={attendance:[]};
const saved={
  '2026-09-06':[
    {work_date:'2026-09-06',employee_id:'e1',planned_status:'Morning'},
    {work_date:'2026-09-07',employee_id:'e1',planned_status:'Morning'},
    {work_date:'2026-09-08',employee_id:'e1',planned_status:'D/O'},
    {work_date:'2026-09-06',employee_id:'e2',planned_status:'Evening'},
    {work_date:'2026-09-07',employee_id:'e2',planned_status:'D/O'},
    {work_date:'2026-09-08',employee_id:'e2',planned_status:'Evening'}
  ],
  '2026-07-05':[
    {work_date:'2026-07-05',employee_id:'e1',planned_status:'Morning'},
    {work_date:'2026-07-06',employee_id:'e2',planned_status:'Evening'}
  ]
};
window.RakizaAI.sales={state:{},isSalesLanguage:detector(/مبيعات|بيع/),answer:async q=>`SALES:${q}`};
window.RakizaAI.shortages={state:{},isShortageLanguage:detector(/نواقص|نقص/),answer:async q=>`SHORTAGES:${q}`};
window.RakizaAI.readiness={state:{},isReadinessLanguage:detector(/جاهزي/),answer:async q=>`READINESS:${q}`};
window.RakizaAI.attendance={state:{},isAttendanceLanguage:detector(/حضور|غياب|تواجد|دوام|شفت/),answer:async q=>{calls.attendance.push(q);return`ATTENDANCE:${q}`},rosterEntriesForPeriod:async p=>saved[p.start]||[]};
window.RakizaAI.tasks={state:{},isTasksLanguage:detector(/مهام|استلام|تحويل/),answer:async q=>`TASKS:${q}`};
window.RakizaAI.actions={state:{},isActionsLanguage:detector(/اجراء|متابعه|صيانه/),answer:async q=>`ACTIONS:${q}`};
window.RakizaAI.store={state:{},isStoreLanguage:detector(/وضع المعرض|حلل/),answer:async q=>`STORE:${q}`};

require('../rakiza-ai-conversation-universal.js');
require('../rakiza-ai-conversation-compat.js');
require('../rakiza-ai-intent.js');
require('../rakiza-ai-dialogue.js');

const C=window.RakizaAI.conversation,U=window.RakizaAI.conversationUniversal,I=window.RakizaAI.intent,D=window.RakizaAI.dialogue;
let pass=0;
function ok(c,m,g){if(!c){console.error('FAIL',m,g||'');process.exit(1)}pass++}
function html(){return els.assistantChat.items.join('\n')}
function reset(){fallback=0;els.assistantChat.items=[];C.reset();U.reset();I.reset();D.reset()}
async function ask(q){els.assistantInput.value=q;await window.askRakizaAssistant();return html()}

(async()=>{
  reset();
  await ask('عمار صباح والجمعة اوف معتوق مساء والاحد اوف');
  ok(C.state.pending.draft?.kind==='roster','natural assignment creates roster draft');
  let out=await ask('هذا الأسبوع الحالي');
  ok(C.state.pending.draft.period?.start==='2026-09-13','period-only reply binds current draft to current week',C.state.pending.draft.period);
  ok(out.includes('ربطت المسودة'),'period reply is conversational rather than unsupported capability',out);
  out=await ask('قم بمسودة تشغيلية لخطة التواجد هذه');
  ok(out.includes('مسودة خطة التواجد'),'existing draft request renders operational draft',out);
  ok(!out.includes('القدرة التشغيلية لهذا النوع لم نبنها بعد'),'draft request never falls into generic capability gap',out);

  reset();
  out=await ask('ماهي آخر خطة تواجد تم تسجيلها');
  ok(out.includes('آخر خطة تواجد محفوظة'),'latest saved roster is retrieved historically',out);
  ok(out.includes('2026-09-06'),'latest roster uses latest non-empty saved week',out);
  ok(D.state.lastRoster?.period?.start==='2026-09-06','latest roster remains in dialogue context',D.state.lastRoster);
  out=await ask('قم بتحويلها لمسودة لهذا الأسبوع');
  ok(C.state.pending.draft?.kind==='roster','saved roster converts to draft');
  ok(C.state.pending.draft.period?.start==='2026-09-13','converted draft targets requested current week',C.state.pending.draft.period);
  ok(out.includes('حوّلت الخطة المحفوظة'),'conversion explains what happened',out);

  reset();
  await ask('ماهي آخر خطة تواجد تم تسجيلها');
  out=await ask('اقدم خطة');
  ok(out.includes('أقدم خطة تواجد محفوظة'),'oldest is understood as follow-up to roster history',out);
  ok(out.includes('2026-07-05'),'oldest available saved week is returned',out);

  reset();
  out=await ask('أبي شي قديم');
  ok(D.state.pending?.stage==='domain','unclear request starts clarification instead of dead-end',D.state.pending);
  ok(out.includes('أحتاج أحدد المجال'),'assistant asks a focused clarification',out);
  out=await ask('خطة التواجد');
  ok(D.state.pending?.stage==='operation','after domain clarification it asks for the missing operation',D.state.pending);
  out=await ask('أبغى آخر خطة محفوظة');
  ok(out.includes('آخر خطة تواجد محفوظة')||D.state.lastCapability==='roster_history','clarification chain reaches a concrete capability',out);

  reset();
  await ask('عمار صباح ومعتوق مساء');
  out=await ask('وش تقدر تسوي هنا؟');
  ok(out.includes('أقدر أكمل معك حواريًا'),'capability question answers in conversation context',out);
  ok(out.includes('آخر أو أقدم خطة'),'capability answer describes actual roster history capability',out);

  ok(window.askRakizaAssistant.__rakizaDialogueWrapped===true,'dialogue layer is outermost runtime wrapper');
  ok(window.askRakizaAssistant.__base?.__rakizaUniversalConversationWrapped===true,'universal router remains directly below dialogue');
  ok(!JSON.stringify(D.state).includes('chainOfThought'),'dialogue state stores no hidden chain of thought');
  console.log('Rakiza AI dialogue tests passed:',pass);
})().catch(e=>{console.error(e);process.exit(1)});
