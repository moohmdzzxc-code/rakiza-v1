global.window={};
const employees=[
  {id:'e1',full_name:'محمد غرم الله محمد الغامدي',active:true},
  {id:'e2',full_name:'محمد عبده',active:true},
  {id:'e3',full_name:'عمار مثنى',active:true},
  {id:'e4',full_name:'معتوق الحارثي',active:true},
  {id:'e5',full_name:'عبدالصبور محمد كاظم',active:true}
];
global.app={calendarDate:'2026-09-13',date:'2026-09-13',employees};window.app=global.app;
window.RakizaAI={};window.askRakizaAssistant=async()=>{};
global.document={getElementById(){return null}};window.document=global.document;
require('../rakiza-ai-conversation.js');
require('../rakiza-ai-conversation-compat.js');
require('../rakiza-ai-intent.js');

const C=window.RakizaAI.conversation,I=window.RakizaAI.intent;
let pass=0;function ok(c,m,g){if(!c){console.error('FAIL',m,g||'');process.exit(1)}pass++}
function reset(){C.reset();I.reset()}
function frame(q,base={entities:{}}){return C.interpret(q,base)}
function domain(q,base={entities:{}}){return frame(q,base).intentIntelligence?.domain}
function op(q,base={entities:{}}){return frame(q,base).intentIntelligence?.operation}

reset();
let f=frame('الأسبوع الجاي عمار صباح والجمعة اوف معتوق مساء والثلاثاء اجازة');
ok(f.action==='create_roster_draft','infers roster creation from employee+shift+day structure without roster keyword',f);
ok(f.domain==='attendance','structural roster intent routes to attendance',f);
ok(f.intentIntelligence.subdomain==='roster','structural roster intent marks roster subdomain',f.intentIntelligence);

reset();f=frame('محمد غرم الله محمد الغامدي صباح والباقين مساء واجازاتهم عمار ثلوث معتوق احد عبدالصبور ربوع');
ok(f.action==='create_roster_draft','multi-person natural assignment becomes roster draft without explicit create verb',f);
ok(f.intentIntelligence.confidence>=0.6,'structured roster has useful confidence',f.intentIntelligence);

reset();ok(domain('كم حققنا اليوم مقابل الهدف')==='sales','sales inferred from achievement and target language');
reset();ok(domain('عطني ارقامنا اليوم')==='sales','colloquial sales numbers inferred');
reset();ok(domain('وش وضع المبعات اليوم')==='sales','minor sales typo is recovered fuzzily');

reset();ok(domain('وش الاشياء المنقطعة وما وصلتنا للحين')==='shortages','stock shortage inferred without saying نواقص');
reset();ok(domain('الصنف اللي طلبناه للحين ما وصل')==='shortages','ordered item not arrived routes shortages');

reset();ok(domain('الفرع جاهز قبل الافتتاح؟')==='readiness','branch opening readiness inferred naturally');
reset();ok(domain('الشبكة والمكيفات والطفايات تمام؟')==='readiness','readiness inferred from operational components');

reset();ok(domain('مين مداوم بكرة؟')==='attendance','attendance inferred from who is working');
reset();ok(domain('عمار اوف الثلاثاء ولا مداوم؟')==='attendance','attendance inferred from employee and off status');

reset();ok(domain('مين مسؤول عن الاستلام والتحويل اليوم؟')==='tasks','tasks inferred from responsibility and operational tasks');
reset();ok(domain('وش باقي علينا من ترتيب وتعبئة اليوم؟')==='tasks','task execution inferred naturally');

reset();ok(domain('الموضوع اللي رفعناه للمشرف وين وصل؟')==='actions','action follow-up inferred without explicit action word');
reset();ok(domain('طلب الدعم هذا وش صار عليه؟')==='actions','support follow-up routes actions');

reset();ok(domain('وش وضعنا اليوم وليش متراجعين؟')==='store','general store-state analysis routes holistic brain');
reset();ok(domain('المبيعات ضعيفة والنواقص كثيرة وش السبب؟')==='store','cross-domain causal request routes holistic brain');
reset();ok(op('قارن وضعنا هذا الاسبوع باللي قبله')==='compare','comparison intent inferred');

reset();f=frame('كم حققنا اليوم مقابل الهدف');C.state.context.domain='sales';
f=frame('طيب والشهر الماضي؟');ok(f.domain==='sales','short follow-up preserves prior domain');ok(f.intentIntelligence.followUp===true,'follow-up marked explicitly');

reset();frame('كم حققنا اليوم مقابل الهدف');f=frame('كيف');ok(f.action==='intent_meta','how follow-up becomes conversational meta intent');
(async()=>{const h=await C.respond(f);ok(/فهمت طلبك السابق/.test(h),'meta response explains prior intent instead of failing',h)})().then(()=>{
  reset();C.state.pending.draft={kind:'roster',assignments:[]};f=frame('خلي عمار اجازته الخميس');ok(f.action==='update_roster_draft','active roster draft correction stays a draft update',f);
  reset();f=frame('السلام عليكم');ok(f.action==='social','existing social conversation behavior preserved',f);
  reset();f=frame('اعتمد',{entities:{}});ok(f.action==='delegate'||f.action==='approve_draft','intent layer does not invent a write without an active approved draft',f);
  ok(I.version==='1.0.0','intent version exposed');
  ok(!JSON.stringify(I.state).includes('chainOfThought'),'intent state stores no hidden chain of thought');
  console.log('Rakiza Intent Intelligence tests passed:',pass);
}).catch(e=>{console.error(e);process.exit(1)});