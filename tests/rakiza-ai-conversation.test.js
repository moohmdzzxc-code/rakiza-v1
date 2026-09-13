global.window={};
let delegated=0;
const employees=[
  {id:'e1',full_name:'محمد غرم الله محمد الغامدي',active:true},
  {id:'e2',full_name:'محمد عبده',active:true},
  {id:'e3',full_name:'عمار مثنى',active:true},
  {id:'e4',full_name:'معتوق الحارثي',active:true},
  {id:'e5',full_name:'عبدالصبور محمد كاظم',active:true},
  {id:'e6',full_name:'مشاري سالم',active:true}
];
global.app={calendarDate:'2026-09-13',date:'2026-09-13',employees};window.app=global.app;
window.RakizaAI={
  state:{context:{}},
  normalize:null,
  analyze:q=>({raw:q,entities:{
    domain:/مبيعات|بيع|تارقت/.test(q)?'sales':/تواجد|دوام|خطة التواجد|خطه التواجد/.test(q)?'attendance':null,
    operation:/حلل|قارن/.test(q)?'analyze':/سوي|انشئ|أنشئ/.test(q)?'create':'query',
    period:/هذا الشهر/.test(q)?{type:'month',month:'2026-09',label:'هذا الشهر'}:null
  }})
};
window.askRakizaAssistant=async()=>{delegated++;return'delegated'};
const els={assistantInput:{value:''},assistantChat:{items:[],insertAdjacentHTML(_p,h){this.items.push(h)},lastElementChild:{scrollIntoView(){}}}};
global.document={getElementById:id=>els[id]||null};window.document=global.document;
require('../rakiza-ai-conversation.js');
const C=window.RakizaAI.conversation;
let pass=0;
function ok(c,m,g){if(!c){console.error('FAIL',m,g||'');process.exit(1)}pass++}
function eq(a,b,m){ok(JSON.stringify(a)===JSON.stringify(b),m,{got:a,want:b})}
function ass(d,id){return d.assignments.find(x=>x.employee_id===id)}

// Central people understanding: full names, unique first names, and local ambiguity only.
let p=C.resolvePeople('محمد غرم الله محمد الغامدي وعمار ومعتوق');
ok(p.length===3,'three people resolved',p);ok(p[0].employee?.id==='e1','full Mohammed resolved');ok(p[1].employee?.id==='e3','unique Ammar resolved');ok(p[2].employee?.id==='e4','unique Matuq resolved');
p=C.resolvePeople('محمد وعمار ومشاري');
ok(p.length===3,'ambiguous name does not block other people',p);ok(!p[0].resolved&&p[0].candidates.length===2,'Mohammed alone is locally ambiguous',p[0]);ok(p[1].resolved&&p[1].employee.id==='e3','Ammar still resolved');ok(p[2].resolved&&p[2].employee.id==='e6','Mashari still resolved');

// Natural multi-employee weekly roster sentence from real usage.
const natural='انشاء خطة تواجد محمد غرم الله محمد الغامدي صباح والجمعه اجازه اما المذكورة اسماهم فهم مساء واجازتهم بعدهم عمار مثنى ثلوث معتوق الحارثي احد عبدالصبور محمد كاظم ربوع مشاري سالم اثنين';
let d=C.parseRosterDraft(natural,C.resolvePeople(natural));
ok(d.assignments.length===5,'five roster assignments parsed',d.assignments);
ok(ass(d,'e1').defaultStatus==='Morning','Mohammed morning');ok(ass(d,'e1').overrides[5]==='D/O','Mohammed Friday off');
ok(ass(d,'e3').defaultStatus==='Evening'&&ass(d,'e3').overrides[2]==='D/O','Ammar evening Tuesday off',ass(d,'e3'));
ok(ass(d,'e4').defaultStatus==='Evening'&&ass(d,'e4').overrides[0]==='D/O','Matuq evening Sunday off',ass(d,'e4'));
ok(ass(d,'e5').defaultStatus==='Evening'&&ass(d,'e5').overrides[3]==='D/O','Abdulsabur evening Wednesday off',ass(d,'e5'));
ok(ass(d,'e6').defaultStatus==='Evening'&&ass(d,'e6').overrides[1]==='D/O','Mashari evening Monday off',ass(d,'e6'));

// Ambiguity should be one missing detail, never a total failure.
const amb='انشاء خطة تواجد محمد صباح والجمعه اجازه اما المذكورة اسماهم فهم مساء واجازتهم بعدهم عمار ثلوث معتوق احد عبدالصبور ربوع مشاري اثنين';
d=C.parseRosterDraft(amb,C.resolvePeople(amb));
ok(d.assignments.length===5,'draft preserved despite one ambiguous name',d.assignments);ok(C.nextClarification(d)?.mention==='محمد','only Mohammed requires clarification',C.nextClarification(d));
let html=C.renderRosterDraft(d);ok(html.includes('فهمت بقية الخطة')&&html.includes('محمد غرم الله محمد الغامدي')&&html.includes('محمد عبده'),'clarification is conversational and local',html);

// End-to-end conversation: create, clarify just one name, preserve everything else.
C.reset();
let f=C.interpret(amb,{entities:{domain:'attendance',operation:'create'}});ok(f.action==='create_roster_draft','multi roster routed centrally',f);
(async()=>{
html=await C.respond(f);ok(C.state.pending.draft.assignments.length===5,'pending draft retained');ok(C.state.pending.question?.mention==='محمد','pending question only for Mohammed');
f=C.interpret('محمد غرم الله محمد الغامدي',{entities:{}});ok(f.action==='clarification','full-name reply treated as clarification',f);html=await C.respond(f);ok(!C.state.pending.question,'clarification completed');ok(ass(C.state.pending.draft,'e1')?.defaultStatus==='Morning','clarified employee kept parsed morning status');ok(ass(C.state.pending.draft,'e3')?.defaultStatus==='Evening','other employees preserved after clarification');

// Conversational query then pronoun-based correction on the active person.
f=C.interpret('وعبدالصبور؟',{entities:{}});ok(f.action==='draft_person_query','person follow-up asks about current draft',f);html=await C.respond(f);ok(html.includes('عبدالصبور محمد كاظم')&&html.includes('الأربعاء'),'draft person answer uses existing context',html);
f=C.interpret('خله الخميس اجازة',{entities:{}});ok(f.action==='update_roster_draft','pronoun correction uses active person',f);html=await C.respond(f);ok(ass(C.state.pending.draft,'e5').overrides[4]==='D/O','pronoun correction applied to Abdulsabur',ass(C.state.pending.draft,'e5'));

// Explicit correction keeps the rest of the draft and updates the named person.
const beforeAmmar=JSON.stringify(ass(C.state.pending.draft,'e3'));
f=C.interpret('لا معتوق الحارثي اجازته الاثنين',{entities:{}});ok(f.action==='update_roster_draft','natural correction recognized',f);await C.respond(f);ok(ass(C.state.pending.draft,'e4').overrides[1]==='D/O','Matuq Monday off added by correction');ok(JSON.stringify(ass(C.state.pending.draft,'e3'))===beforeAmmar,'Ammar preserved while correcting Matuq');

// Review/write safety: conversation is useful but does not silently write operational data.
f=C.interpret('اعتمد',{entities:{}});ok(f.action==='approve_draft','approval recognized against pending draft');html=await C.respond(f);ok(C.state.pending.draft.approvedInConversation===true,'conversation review marked');ok(html.includes('لم أحفظ')||html.includes('لم يتم حفظ'),'approval does not pretend operational save',html);
f=C.interpret('احفظ الخطة',{entities:{}});ok(f.action==='safe_write','sensitive save intercepted');html=await C.respond(f);ok(html.includes('لن أكتب')||html.includes('الحفظ'),'write safety explained',html);

// Social dialogue is handled centrally, not as an execution command.
C.reset();f=C.interpret('السلام عليكم',{entities:{}});ok(f.action==='social'&&f.mode==='conversation','greeting is conversation');html=await C.respond(f);ok(html.includes('وعليكم السلام'),'greeting response natural',html);

// General domains still delegate to approved specialist brains, while conversation adds a shared frame.
els.assistantInput.value='كم مبيعات هذا الشهر';delegated=0;await window.askRakizaAssistant();ok(delegated===1,'sales request delegated to specialist chain');let a=window.RakizaAI.analyze('كم مبيعات هذا الشهر');ok(a.entities.conversation?.domain==='sales','central frame recognizes sales',a.entities.conversation);ok(a.entities.people&&Array.isArray(a.entities.people),'central people frame always available');

// Follow-up inherits the conversational domain even without repeating keywords.
els.assistantInput.value='طيب الشهر الماضي';await window.askRakizaAssistant();a=window.RakizaAI.analyze('طيب الشهر الماضي');ok(a.entities.conversation?.domain==='sales','follow-up inherits sales domain',a.entities.conversation);

// Multi-person roster is handled by conversation layer and never falls into old one-person ambiguity path.
C.reset();delegated=0;els.assistantInput.value=natural;await window.askRakizaAssistant();ok(delegated===0,'multi-person roster handled centrally');ok(C.state.pending.draft?.assignments.length===5,'wrapper created full roster draft');

// No hidden chain of thought stored.
ok(!('chainOfThought' in C.state),'conversation state has no hidden chain of thought');ok(!JSON.stringify(C.state).includes('chainOfThought'),'serialized conversation state has no chain of thought');

console.log('Rakiza AI conversation tests passed:',pass);
})().catch(e=>{console.error(e);process.exit(1)});
