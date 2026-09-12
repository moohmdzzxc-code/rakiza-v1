global.window={RakizaAI:{normalize:null,state:{context:{}},analyze:q=>({entities:{domain:/حضور|غياب|تواجد|دوام|شفت|خطه|خطة|روستر/i.test(q)?'attendance':null}})}};
const emps=[
{id:'e1',full_name:'محمد عبده',active:true},{id:'e2',full_name:'عمار مثنى',active:true},{id:'e3',full_name:'خليل الجبوري',active:true},{id:'e4',full_name:'معتوق الحارثي',active:true}
];
const recent=[
{id:'d1',work_date:'2026-09-07',attendance_adequacy:75,status:'مغلق'},
{id:'d2',work_date:'2026-09-08',attendance_adequacy:75,status:'مغلق'},
{id:'d3',work_date:'2026-09-09',attendance_adequacy:50,status:'مغلق'},
{id:'d4',work_date:'2026-09-10',attendance_adequacy:75,status:'مغلق'},
{id:'d5',work_date:'2026-09-11',attendance_adequacy:75,status:'مغلق'},
{id:'d6',work_date:'2026-09-12',attendance_adequacy:50,status:'مغلق'}
];
const attendanceByDay={
d1:[{employee_id:'e1',attendance_status:'حاضر',uniform_status:'ملتزم',id_card_status:'ملتزم',appearance_status:'ملتزم',employee_readiness:100,employees:{id:'e1',full_name:'محمد عبده'}},{employee_id:'e2',attendance_status:'متأخر',actual_arrival:'09:20',uniform_status:'ملتزم',id_card_status:'ملتزم',appearance_status:'ملتزم',employee_readiness:100,employees:{id:'e2',full_name:'عمار مثنى'}},{employee_id:'e3',attendance_status:'غائب',employees:{id:'e3',full_name:'خليل الجبوري'}}],
d2:[{employee_id:'e1',attendance_status:'حاضر',employees:{id:'e1',full_name:'محمد عبده'}},{employee_id:'e2',attendance_status:'حاضر',employees:{id:'e2',full_name:'عمار مثنى'}},{employee_id:'e3',attendance_status:'متأخر',actual_arrival:'09:15',employees:{id:'e3',full_name:'خليل الجبوري'}}],
d3:[{employee_id:'e1',attendance_status:'غائب',employees:{id:'e1',full_name:'محمد عبده'}},{employee_id:'e2',attendance_status:'حاضر',employees:{id:'e2',full_name:'عمار مثنى'}},{employee_id:'e3',attendance_status:'غائب',employees:{id:'e3',full_name:'خليل الجبوري'}}],
d4:[{employee_id:'e1',attendance_status:'حاضر',employees:{id:'e1',full_name:'محمد عبده'}},{employee_id:'e2',attendance_status:'متأخر',actual_arrival:'09:30',employees:{id:'e2',full_name:'عمار مثنى'}},{employee_id:'e3',attendance_status:'حاضر',employees:{id:'e3',full_name:'خليل الجبوري'}}],
d5:[{employee_id:'e1',attendance_status:'حاضر',employees:{id:'e1',full_name:'محمد عبده'}},{employee_id:'e2',attendance_status:'حاضر',employees:{id:'e2',full_name:'عمار مثنى'}},{employee_id:'e3',attendance_status:'غائب',employees:{id:'e3',full_name:'خليل الجبوري'}}],
d6:[{employee_id:'e1',attendance_status:'متأخر',actual_arrival:'09:25',employees:{id:'e1',full_name:'محمد عبده'}},{employee_id:'e2',attendance_status:'غائب',employees:{id:'e2',full_name:'عمار مثنى'}},{employee_id:'e3',attendance_status:'غائب',employees:{id:'e3',full_name:'خليل الجبوري'}}]
};
const changes={
d1:[{employee_id:'e2',original_status:'Morning',new_status:'Evening',reason:'تغطية',employees:{id:'e2',full_name:'عمار مثنى'}}],
d3:[{employee_id:'e3',original_status:'Morning',new_status:'D/O',reason:'تبديل',employees:{id:'e3',full_name:'خليل الجبوري'}}],
d5:[{employee_id:'e2',original_status:'Evening',new_status:'Morning',reason:'حاجة العمل',employees:{id:'e2',full_name:'عمار مثنى'}}]
};
function weekEntries(start){let dates=Array.from({length:7},(_,i)=>{let d=new Date(start+'T12:00:00');d.setDate(d.getDate()+i);return d.toISOString().slice(0,10)}),out=[];for(const date of dates){out.push({employee_id:'e1',work_date:date,planned_status:['2026-09-11'].includes(date)?'D/O':'Morning',original_status:['2026-09-11'].includes(date)?'D/O':'Morning',change_count:0});out.push({employee_id:'e2',work_date:date,planned_status:date==='2026-09-08'?'Evening':'Evening',original_status:date==='2026-09-08'?'Morning':'Evening',change_count:date==='2026-09-08'?1:0});out.push({employee_id:'e3',work_date:date,planned_status:date==='2026-09-09'?'D/O':'Morning',original_status:'Morning',change_count:date==='2026-09-09'?1:0});out.push({employee_id:'e4',work_date:date,planned_status:'A/L',original_status:'A/L',change_count:0})}return out}
global.app={calendarDate:'2026-09-13',date:'2026-09-13',employees:emps,recent:recent.map((x,i)=>({...x,present_readiness:80+i,attendance_adequacy:70+i})),day:{id:'today',work_date:'2026-09-13',status:'مفتوح',attendance_adequacy:75,present_readiness:83},attendance:[{employee_id:'e1',attendance_status:'حاضر',uniform_status:'ملتزم',id_card_status:'ملتزم',appearance_status:'ملتزم',employee_readiness:100,employees:{id:'e1',full_name:'محمد عبده'}},{employee_id:'e2',attendance_status:'متأخر',actual_arrival:'09:10',uniform_status:'غير ملتزم',id_card_status:'ملتزم',appearance_status:'ملتزم',employee_readiness:67,employees:{id:'e2',full_name:'عمار مثنى'}}],roster:weekEntries('2026-09-13').filter(x=>x.work_date==='2026-09-13')};
global.api=async(name,o={})=>{if(name==='day'){const id=o.q.id;return{day:recent.find(x=>x.id===id),attendance:attendanceByDay[id]||[],roster_changes:changes[id]||[]}}if(name==='roster-get'){return{header:{},entries:weekEntries(o.q.week_start),original_entries:weekEntries(o.q.week_start).map(x=>({...x,planned_status:x.original_status})),changes:[]}}throw Error('unknown '+name)};
window.api=global.api;window.askRakizaAssistant=async()=>{};
const els={assistantInput:{value:''},assistantChat:{insertAdjacentHTML(){},lastElementChild:{scrollIntoView(){}}}};global.document={getElementById:id=>els[id]||null};
require('../rakiza-ai-attendance.js');
const A=window.RakizaAI.attendance;let pass=0;
function ok(c,m,g){if(!c){console.error('FAIL',m,g||'');process.exit(1)}pass++}
function sp(q,p){const x=A.detectSpec(q,{});ok(p(x),q,x);return x}
function rt(q,e){const x=A.isAttendanceLanguage(q,{});ok(x===e,q,x)}
async function ah(q,contains){const h=await A.answer(q,{});ok(contains.every(x=>h.includes(x)),q+' => '+contains.join(','),h);return h}

// language routing
rt('مين غايب اليوم',true);rt('مين ناقص من الفريق اليوم',true);rt('كم كفاية التواجد اليوم',true);rt('وش جاهزية الفريق اليوم',true);rt('وش دوام عمار بكرة',true);rt('خطه التواجد الاسبوع الجاي',true);rt('مين صباحي الخميس',true);rt('كم مبيعات اليوم',false);rt('وش أكثر صنف ناقص',false);rt('وش ناقص في الجاهزية التشغيلية',false);rt('وش ناقص من مهام اليوم',false);

// period parsing
sp('مين مداوم اليوم',x=>x.period?.date==='2026-09-13'&&x.task==='roster');
sp('مين مداوم بكره',x=>x.period?.date==='2026-09-14');
sp('خطة الاسبوع الجاي',x=>x.period?.start==='2026-09-20'&&x.task==='roster');
sp('الحضور هذا الشهر',x=>x.period?.month==='2026-09');
sp('الغياب الشهر الماضي',x=>x.period?.month==='2026-08');
sp('مين مداوم ثلوث',x=>x.period?.date==='2026-09-08');
sp('مين مداوم خميس الجاي',x=>x.period?.date==='2026-09-17');
sp('الحضور آخر 7 أيام',x=>x.period?.start==='2026-09-07'&&x.period?.end==='2026-09-13');

// employee / statuses
sp('وش دوام عمار هذا الاسبوع',x=>x.employee?.id==='e2'&&x.task==='roster');
sp('خليل غايب كم مرة هذا الشهر',x=>x.employee?.id==='e3'&&x.task==='absence');
sp('مين D/O الجمعة',x=>x.planStatus==='D/O');
sp('مين سنوية اليوم',x=>x.planStatus==='A/L');
sp('مين سكليف اليوم',x=>x.planStatus==='S/L');
sp('مين مسائي بكرة',x=>x.planStatus==='Evening');
sp('مين صباحي بكرة',x=>x.planStatus==='Morning');

// task detection
sp('مين اكثر واحد غياب هذا الشهر',x=>x.task==='rank_absence');
sp('مين اكثر واحد متاخر هذا الشهر',x=>x.task==='rank_late');sp('مين ناقص من الفريق اليوم',x=>x.task==='absence');sp('كم كفاية التواجد اليوم',x=>x.task==='adequacy');sp('وش جاهزية الفريق اليوم',x=>x.task==='team_readiness');
sp('وش التغييرات على خطة التواجد هذا الاسبوع',x=>x.task==='changes');
sp('مين اكثر واحد تغير جدوله هذا الشهر',x=>x.task==='rank_changes');
sp('مين غير ملتزم بالزي اليوم',x=>x.task==='compliance');
sp('حلل وضع الفريق هذا الشهر',x=>x.task==='analysis');
sp('قارن هذا الاسبوع بالاسبوع الماضي في الحضور',x=>x.task==='compare');
sp('سوي لي خطة تواجد الاسبوع الجاي',x=>x.task==='draft');
sp('عدل خطة التواجد وخلي عمار خميس مسائي',x=>x.task==='change_draft'&&x.employee?.id==='e2'&&x.planStatus==='Evening');

(async()=>{
// live roster answers
await ah('مين مداوم اليوم',['خطة التواجد','محمد عبده','عمار مثنى','خليل الجبوري']);
await ah('وش دوام عمار هذا الاسبوع',['عمار مثنى','مسائي']);
await ah('مين D/O الجمعة',['محمد عبده','إجازة أسبوعية']);
await ah('مين سنوية اليوم',['معتوق الحارثي','إجازة سنوية']);
// attendance history
await ah('مين غايب هذا الشهر',['الغياب','خليل الجبوري']);
await ah('مين اكثر واحد غياب هذا الشهر',['الأكثر غيابًا','خليل الجبوري','4']);
await ah('مين اكثر واحد متاخر هذا الشهر',['الأكثر تأخيرًا']);
await ah('كم غياب خليل هذا الشهر',['حضور خليل الجبوري','غائب','4']);
// current compliance
await ah('مين غير ملتزم بالزي اليوم',['عمار مثنى','غير ملتزم']);await ah('كم كفاية التواجد اليوم',['كفاية التواجد','75.0%']);await ah('وش جاهزية الفريق اليوم',['جاهزية المتواجدين','83.0%']);
// change log
await ah('وش التغييرات على خطة التواجد هذا الشهر',['تغييرات خطة التواجد','عمار مثنى','خليل الجبوري']);
await ah('مين اكثر واحد تغير جدوله هذا الشهر',['الأكثر تغييرًا','عمار مثنى','2 تغيير']);
// analysis / compare
await ah('حلل وضع الفريق هذا الشهر',['تحليل الحضور والتواجد','غياب','تأخير','تغييرات خطة التواجد']);
await ah('قارن هذا الاسبوع بالاسبوع الماضي في الحضور',['مقارنة الحضور والتواجد','هذا الأسبوع','الأسبوع الماضي']);
// draft safety
await ah('سوي لي خطة تواجد الاسبوع الجاي',['مسودة','لن أحفظ','قواعد توزيع معتمدة']);
await ah('عدل خطة التواجد وخلي عمار خميس مسائي',['تعديل','عمار مثنى','مسائي','لن أحفظ']);
// context employee + period
await A.answer('وش دوام عمار هذا الاسبوع',{});let s=A.detectSpec('طيب الخميس؟',{});ok(s.employee?.id==='e2','context employee',s);ok(s.period?.type==='date','context day',s);
await A.answer('مين غايب هذا الشهر',{});s=A.detectSpec('طيب الشهر اللي قبله؟',{});ok(s.period?.month==='2026-08','context previous month',s);
console.log('Rakiza AI attendance tests passed:',pass);
})().catch(e=>{console.error(e);process.exit(1)});
