global.window={RakizaAI:{normalize:null,state:{}}};
global.app={calendarDate:'2026-09-13',date:'2026-09-13',day:{id:'d1',work_date:'2026-09-13',status:'مفتوح',day_type:'يوم تشغيلي',daily_target:5000},actions:[]};
const els={assistantInput:{value:''},assistantChat:{html:'',insertAdjacentHTML(_p,h){this.html+=h},lastElementChild:{scrollIntoView(){}}}};
global.document={getElementById(id){return els[id]||null}};
let baseCalls=0;
window.askRakizaAssistant=async()=>{baseCalls++;els.assistantChat.html+='BASE'};

let currentDay={
 period:{type:'date',date:'2026-09-13',label:'اليوم'},
 sales:{available:false,rows:0},
 readiness:{available:true,count:1,average:86,open:2,criticalOpen:1,repeated:[]},
 attendance:{available:true,records:4,plannedWorking:4,present:3,absent:1,late:1,mission:0},
 tasks:{available:true,days:1,total:3,final:0,completed:0,partial:0,notDone:0,incomplete:0,unfinalized:3,repeated:[]},
 shortages:{available:true,periodRecords:1,unresolvedCurrent:2,orderedAwaitingSupply:1,repeated:[]},
 actions:{available:true,openCurrent:2,escalatedCurrent:1,oldest:{id:'a1',subject:'الشبكة',age:11,status:'تم التصعيد — قيد المتابعة'}}
};
let monthSnap={
 period:{type:'month',month:'2026-09',label:'هذا الشهر'},
 sales:{available:true,rows:10,sales:18000,target:20000,targetToDate:20000,variance:-2000,achievement:90,cutoff:'2026-09-12'},
 readiness:{available:true,count:10,average:92,open:2,criticalOpen:0,repeated:[{label:'الشبكة',category:'الأجهزة والأنظمة',count:3,lostWeight:15}]},
 attendance:{available:true,records:30,plannedWorking:30,present:28,absent:1,late:2},
 tasks:{available:true,total:20,final:20,completed:18,partial:1,notDone:1,incomplete:2,unfinalized:0,repeated:[{label:'تحويل',count:2}]},
 shortages:{available:true,periodRecords:5,unresolvedCurrent:2,orderedAwaitingSupply:1,repeated:[{label:'60L',section:'الفاخر',count:3,lost:7,requested:8}]},
 actions:{available:true,openCurrent:2,escalatedCurrent:1,oldest:{id:'a1',subject:'الشبكة',age:11,status:'تم التصعيد — قيد المتابعة'}}
};
let yesterday={
 period:{type:'date',date:'2026-09-12',label:'أمس'},
 sales:{available:true,rows:1,sales:4500,target:5000,targetToDate:5000,variance:-500,achievement:90,cutoff:'2026-09-12'},
 readiness:{available:true,count:1,average:94,open:0,criticalOpen:0,repeated:[]},
 attendance:{available:true,records:4,plannedWorking:4,present:4,absent:0,late:0},
 tasks:{available:true,total:3,final:3,completed:3,partial:0,notDone:0,incomplete:0,unfinalized:0,repeated:[]},
 shortages:{available:true,periodRecords:0,unresolvedCurrent:2,orderedAwaitingSupply:1,repeated:[]},
 actions:{available:true,openCurrent:2,escalatedCurrent:1,oldest:{id:'a1',subject:'الشبكة',age:10,status:'تم التصعيد — قيد المتابعة'}}
};
window.RakizaAI.store={
 gatherPeriod:async p=>p.type==='month'?monthSnap:(p.date==='2026-09-12'?yesterday:currentDay),
 answer:async()=>'<div>FULL STORE ANALYSIS</div>'
};
require('../rakiza-ai-daily-brief.js');
const D=window.RakizaAI.dailyBrief;let pass=0;
function ok(c,m,g){if(!c){console.error('FAIL',m,g||'');process.exit(1)}pass++}
function rt(q,e){const x=D.isBriefLanguage(q);ok(x===e,q,x)}

rt('عطني ملخص اليوم',true);
rt('لخص لي يوم المعرض',true);
rt('وش وضعنا اليوم؟',true);
rt('كيف وضعنا اليوم؟',true);
rt('وش يحتاج انتباهي اليوم؟',true);
rt('وش أهم شي أركز عليه اليوم؟',true);
rt('الموجز اليومي',true);
rt('كم مبيعات اليوم؟',false);
rt('مين غايب اليوم؟',false);
rt('وش نواقص الفاخر؟',false);
rt('وش جاهزية المعرض اليوم؟',false);

let st=D.dayState();
ok(st.mode==='open','open day detected',st);
ok(st.date==='2026-09-13','operating date detected',st);
ok(D.todayPeriod().date==='2026-09-13','today period uses operating day');
ok(D.yesterdayPeriod().date==='2026-09-12','yesterday period');
ok(D.monthPeriod().month==='2026-09','month period');

(async()=>{
let b=await D.buildBrief();
ok(b.state.mode==='open','brief open mode',b.state);
ok(/لم تُثبت بعد/.test(b.sections.sales),'open sales not final',b.sections.sales);
ok(/لا تُعامل كصفر/.test(b.sections.sales),'open sales explicitly not zero',b.sections.sales);
ok(/مستهدف اليوم 5,000/.test(b.sections.sales),'daily target included',b.sections.sales);
ok(/18,000/.test(b.sections.sales)&&/2026-09-12/.test(b.sections.sales),'last trusted month sales shown',b.sections.sales);
ok(/2,000/.test(b.sections.sales),'month sales gap shown',b.sections.sales);
ok(!/مبيعات اليوم الفعلية 0/.test(b.sections.sales),'no fabricated zero sales',b.sections.sales);
ok(/بند حرج/.test(b.sections.readiness),'critical readiness surfaced',b.sections.readiness);
ok(/غياب 1/.test(b.sections.team)&&/تأخير 1/.test(b.sections.team),'team issues surfaced',b.sections.team);
ok(/3 مهمة/.test(b.sections.tasks),'task plan count shown',b.sections.tasks);
ok(/لا تُعامل كمهام فاشلة/.test(b.sections.tasks),'unfinalized tasks not failure',b.sections.tasks);
ok(/نواقص غير محسومة: 2/.test(b.sections.followups),'open shortages shown',b.sections.followups);
ok(/إجراءات مفتوحة: 2/.test(b.sections.followups),'open actions shown',b.sections.followups);
ok(/لا تثبت/.test(b.reading),'sales causality guarded',b.reading);
ok(b.limitations.some(x=>/مبيعات اليوم/.test(x)),'open-sales limitation recorded',b.limitations);
ok(b.limitations.some(x=>/المهام غير النهائية/.test(x)),'open-task limitation recorded',b.limitations);
ok(['متوسطة','مرتفعة نسبيًا'].includes(b.confidence),'confidence derived from coverage',b.confidence);

let all=D.briefPriorityItems(currentDay,monthSnap,b.state,10);
ok(all[0].kind==='critical','critical first',all);
ok(all[1].kind==='operational','open readiness second',all);
ok(all.some(x=>x.kind==='attendance'),'attendance operational issue included',all);
ok(all.some(x=>x.kind==='age'),'oldest action included',all);
ok(all.some(x=>x.kind==='repeated_shortage'),'repeated shortage included from month history',all);
ok(!all.some(x=>x.kind==='execution'),'open unfinalized tasks not ranked as failed execution',all);
ok(all.some(x=>x.kind==='sales_gap'),'month sales gap can be priority',all);
const age=all.find(x=>x.kind==='age');
ok(/ليست حكم SLA/.test(age.why),'age is not called SLA delay',age);
const sg=all.find(x=>x.kind==='sales_gap');
ok(/لا تثبت سببها/.test(sg.why),'sales gap does not invent cause',sg);

let h=D.renderCompact(b);
ok(/الملخص اليومي الذكي/.test(h),'brief title',h);
ok(/المبيعات/.test(h)&&/التشغيل/.test(h)&&/الفريق/.test(h),'core sections rendered',h);
ok(/مهام اليوم/.test(h)&&/النواقص والمتابعات/.test(h),'operational sections rendered',h);
ok(/أولوية المدير الآن/.test(h),'manager priorities rendered',h);
ok(/قراءة ركيزة/.test(h),'Rakiza reading rendered',h);
ok(/لا توجد درجة صحة\/خطر مركبة/.test(h),'no composite store score',h);
ok(/لا يتم تنفيذ أي تغيير تشغيلي/.test(h),'no automatic sensitive execution',h);

h=await D.answer('عطني ملخص اليوم');
ok(/اليوم التشغيلي مستمر/.test(h),'answer uses open-day title',h);
ok(D.state.last&&D.state.last.state.mode==='open','brief state remembered',D.state.last);
rt('وسع لي النقطة الثانية',true);
rt('ليش حطيتها أولوية؟',true);
rt('وش أسوي فيها؟',true);
rt('قارنها بأمس',true);
rt('عطني التفاصيل',true);

h=await D.answer('وسع لي النقطة الثانية');
ok(/تفصيل الأولوية 2/.test(h),'expand second priority',h);
ok(/سبب الأولوية/.test(h)&&/الإجراء المقترح/.test(h),'expanded priority has why and action',h);
h=await D.answer('ليش حطيتها أولوية؟');
ok(/لماذا هذه أولوية/.test(h),'why follow-up',h);
h=await D.answer('وش أسوي فيها؟');
ok(/ماذا أفعل الآن/.test(h),'action follow-up',h);
ok(/لا ينفذ ركيزة/.test(h),'action follow-up remains recommendation only',h);
h=await D.answer('قارنها بأمس');
ok(/مقارنة الملخص بأمس/.test(h),'compare yesterday title',h);
ok(/لا يمكن مقارنة نتيجة اليوم النهائية/.test(h),'open sales comparison blocked',h);
ok(/الجاهزية/.test(h),'readiness compared with yesterday',h);
ok(/المقارنة وصفية فقط/.test(h)&&/لا تثبت علاقة سببية/.test(h),'comparison causal guard',h);
h=await D.answer('عطني التفاصيل');
ok(/FULL STORE ANALYSIS/.test(h),'detail delegates to comprehensive store analysis',h);

els.assistantChat.html='';els.assistantInput.value='عطني ملخص اليوم';D.state.busy=false;await window.askRakizaAssistant();
ok(/الملخص اليومي الذكي/.test(els.assistantChat.html),'chat wrapper handles daily brief',els.assistantChat.html);
els.assistantChat.html='';els.assistantInput.value='كم مبيعات اليوم؟';D.state.busy=false;await window.askRakizaAssistant();
ok(baseCalls===1&&/BASE/.test(els.assistantChat.html),'single-domain query falls through',els.assistantChat.html);

// Closed-day behavior.
app.day.status='مغلق';
currentDay={...currentDay,
 sales:{available:true,rows:1,sales:4800,target:5000,targetToDate:5000,variance:-200,achievement:96,cutoff:'2026-09-13'},
 readiness:{...currentDay.readiness,criticalOpen:0,open:0,average:96},
 attendance:{...currentDay.attendance,absent:0,late:0,present:4},
 tasks:{available:true,days:1,total:3,final:3,completed:2,partial:1,notDone:0,incomplete:1,unfinalized:0,repeated:[{label:'تحويل',count:1}]}
};
st=D.dayState();ok(st.mode==='closed','closed day detected',st);
b=await D.buildBrief();
ok(/مبيعات اليوم الفعلية 4,800/.test(b.sections.sales),'closed actual sales shown',b.sections.sales);
ok(/أقل من المستهدف بمقدار 200/.test(b.sections.sales),'closed daily gap shown',b.sections.sales);
ok(/الفريق مستقر/.test(b.sections.team),'normal team compressed to stable',b.sections.team);
ok(/مكتملة 2/.test(b.sections.tasks)&&/جزئية 1/.test(b.sections.tasks),'closed task outcomes shown',b.sections.tasks);
all=D.briefPriorityItems(currentDay,monthSnap,b.state,10);
ok(all.some(x=>x.kind==='execution'),'closed incomplete task becomes priority',all);
ok(all.findIndex(x=>x.kind==='execution')<all.findIndex(x=>x.kind==='sales_gap'),'task execution priority before sales gap',all);
h=D.renderCompact(b);ok(/نتيجة اليوم/.test(h),'closed brief says day result',h);
h=await D.compareYesterday();
ok(/اليوم 4,800 مقابل أمس 4,500/.test(h),'closed sales compared with yesterday',h);
ok(/المهام غير المكتملة نهائيًا/.test(h),'closed tasks compared',h);

// No operating day yet.
app.day=null;
st=D.dayState();ok(st.mode==='not_started','not-started day detected',st);
b=await D.buildBrief();
ok(/لم يبدأ يوم التشغيل/.test(b.sections.sales),'not-started sales statement',b.sections.sales);
ok(/لم يبدأ يوم التشغيل/.test(b.sections.tasks),'not-started tasks statement',b.sections.tasks);
h=D.renderCompact(b);ok(/يوم التشغيل لم يبدأ/.test(h),'not-started title',h);

console.log('Rakiza AI daily brief tests passed:',pass);
})().catch(e=>{console.error(e);process.exit(1)});
