global.window={};
const rosterSelects={};
for(let i=20;i<=26;i++)rosterSelects[`2026-09-${i}`]={value:i%2?'Morning':'Evening'};
const rosterRow={dataset:{emp:'e1'},querySelector:selector=>rosterSelects[selector.match(/data-date="([^"]+)"/)?.[1]]||null};
const elements={
  assistantInput:{value:''},
  assistantChat:{insertAdjacentHTML(){},lastElementChild:{scrollIntoView(){}}},
  assistantSuggestions:{innerHTML:''},
  weekStart:{value:'2026-09-20'},
  rosterBy:{value:'manager-1'},
  rosterGrid:{dataset:{saved:'0'},querySelectorAll:()=>[rosterRow]}
};
const assistantSub={textContent:''},assistantNotice={innerHTML:''};
elements.assistant={querySelector:selector=>selector==='.top .sub'?assistantSub:selector==='.notice'?assistantNotice:null};
global.document={getElementById:id=>elements[id]||null};
window.document=global.document;
window.app={date:'2026-09-14',calendarDate:'2026-09-14',actions:[],employees:[{id:'e1',full_name:'عمار منى',active:true}],sections:[{id:'s1',name:'الفاخر'}]};
window.askRakizaAssistant=async()=>{};
window.openAssistant=()=>setTimeout(()=>{assistantSub.textContent='old';assistantNotice.innerHTML='old'},0);
let savedRoster=null;
window.api=async(name,options={})=>{
  if(name==='action-save'){const row={id:'a1',...options.body};window.app.actions=[row];return row}
  if(name==='roster-save'){savedRoster=options.body;return{ok:true}}
  if(name==='roster-get')return savedRoster?{header:{id:'r1'},entries:savedRoster.entries}:{};
  return{};
};
window.refresh=async()=>{};
window.saveRoster=async()=>{};
window.approveOpening=async()=>{window.app.day={id:'d1',opening_approved_at:'2026-09-14T08:00:00Z'}};
let staged=0;
const conversationState={pending:{draft:null,question:null},context:{}};
window.RakizaAI={
  normalize:v=>String(v??'').toLowerCase().replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي').replace(/\s+/g,' ').trim(),
  conversation:{
    state:conversationState,
    nextClarification:()=>null,
    interpret:text=>({period:/الاسبوع القادم/.test(String(text))?{type:'week',start:'2026-09-20',end:'2026-09-26',label:'الأسبوع القادم'}:null}),
    renderRosterDraft:d=>'<b>draft '+(d.period?.start||'none')+'</b>'
  },
  rosterOperational:{
    validateDraft:()=>({ok:true,issues:[]}),
    stage:async()=>{staged++;return{ok:true,entryCount:14}}
  }
};
require('../rakiza-ai-capabilities.js');
require('../rakiza-ai-orchestrator.js');
const O=window.RakizaAI.orchestrator,C=window.RakizaAI.capabilities;
let pass=0;function ok(c,m,g){if(!c){console.error('FAIL',m,g||'');process.exit(1)}pass++}

(async()=>{
  const draft={kind:'roster',status:'draft',period:null,assignments:[{resolved:true,employee_id:'e1',defaultStatus:'Morning',overrides:{}}]};
  conversationState.pending.draft=draft;
  let html=await O.handle('اعتمدها للأسبوع القادم');
  ok(staged===1,'combined approval and period stages the active roster draft');
  ok(conversationState.pending.draft.period.start==='2026-09-20','combined instruction binds the requested week');
  ok(C.state.pending?.id==='roster.save','operational roster waits for final save approval');
  ok(html.includes('مسودة تشغيلية'),'response confirms an operational, usable draft');
  html=await O.handle('اعتمد الحفظ');
  ok(html.includes('تم: اعتماد وحفظ خطة التواجد الأصلية'),'second approval invokes final roster save',html);
  ok(savedRoster?.entries?.length===7,'final approval persists the staged roster entries',savedRoster);
  ok(!C.state.pending,'approved roster save clears pending execution');
  const stagedAfterSave=staged;
  html=await O.handle('اعتمد');
  ok(staged===stagedAfterSave&&html.includes('لا توجد عملية'),'saved roster draft is not staged again on a repeated approval',html);

  conversationState.pending.draft=draft;staged=0;
  html=await O.handle('اعرضها كمسودة قابلة للحفظ');
  ok(staged===1&&html.includes('مسودة تشغيلية'),'natural saveable-draft wording stages roster without losing context');
  C.cancel();conversationState.pending.draft=null;

  let plan=O.operationalPlan('سجل عطل صيانة في المكيف الرئيسي');
  ok(plan.id==='maintenance.create'&&plan.args.subject.includes('المكيف'),'maintenance request maps to an executable capability',plan);
  plan=O.operationalPlan('صدر ملف اكسل للنواقص');
  ok(plan.id==='shortages.export','shortage export maps to approved export capability',plan);
  plan=O.operationalPlan('تمت التغذية للنقص رقم a2');
  ok(plan.id==='shortages.supplied'&&plan.args.id==='a2','shortage follow-up maps to the correct record',plan);
  plan=O.operationalPlan('غير دوام عمار يوم الثلاثاء إلى صباحي بسبب تغطية المعرض');
  ok(plan.id==='roster.change'&&plan.args.employee_id==='e1'&&plan.args.new_status==='Morning'&&plan.args.work_date==='2026-09-15','natural roster change resolves employee, status and weekday',plan);

  html=await O.handle('سجل عطل صيانة');
  ok(html.includes('الموضوع')&&C.state.pending?.id==='maintenance.create','missing maintenance detail asks only for the next field',html);
  html=await O.handle('المكيف الرئيسي لا يبرد');
  ok(html.includes('قل <b>اعتمد</b>')&&!C.state.pending?.missing?.length,'follow-up fills the pending operation without losing context',html);
  html=await O.handle('اعتمد');
  ok(html.includes('تم: تسجيل عطل صيانة')&&window.app.actions[0]?.action_status==='جديد','approval executes and verifies maintenance creation',html);

  html=await O.handle('اعتمد افتتاح اليوم');
  ok(html.includes('تم: اعتماد افتتاح اليوم')&&window.app.day?.opening_approved_at,'explicit approval with a complete operation executes without a redundant prompt',html);

  html=await O.handle('وش تقدر تسوي؟');
  ok(html.includes('دورة التشغيل اليومي')&&html.includes('الصيانة'),'capability answer covers the product instead of one domain');
  window.RakizaAI.dialogue={findRoster:async()=>null};
  window.RakizaAI.conversation.respond=async()=>'<b>لا توجد نتائج مطابقة في البيانات المسجلة في خطة التواجد — اليوم.</b>';
  html=await O.handle('قم بعمل خطة تواجد للأسبوع القادم');
  ok(html.includes('لا توجد خطة تواجد محفوظة')&&html.includes('توزيع دوام الموظفين'),'roster creation asks for the missing distribution instead of falling back to a misleading today query',html);
  window.openAssistant();await new Promise(r=>setTimeout(r,5));
  ok(assistantSub.textContent.includes('فهم، تنفيذ، واعتماد')&&assistantNotice.innerHTML.includes('مرتبط بقدرات النظام الفعلية'),'orchestrator assistant copy wins after older delayed wrappers');
  console.log('Rakiza AI orchestrator tests passed:',pass);
})().catch(e=>{console.error(e);process.exit(1)});
