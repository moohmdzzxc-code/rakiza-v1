global.window={RakizaAI:{normalize:null,state:{}}};
global.app={calendarDate:'2026-09-13',date:'2026-09-13',sections:[
{id:'f',name:'الفاخر'},{id:'b',name:'الأعمال'},{id:'c',name:'الكلاسيك'},{id:'u',name:'الداخليات'},{id:'s',name:'الأشمغة'},{id:'m',name:'الحركات'},{id:'z',name:'الزخرفات'},{id:'r',name:'ري ثوب'},{id:'su',name:'الصيفي'},{id:'w',name:'الشتوي'},{id:'e',name:'العقال والطاقية'},{id:'n',name:'الجلابيات والبيجامات'},{id:'a',name:'الإكسسوارات والجوارب'}]};
const els={assistantInput:{value:''},assistantChat:{html:'',insertAdjacentHTML(_p,h){this.html+=h},lastElementChild:{scrollIntoView(){}}}};
global.document={getElementById(id){return els[id]||null}};
global.api=async()=>[];
require('../rakiza-ai-shortages.js');
const S=window.RakizaAI.shortages;let pass=0;
function ok(c,m,g){if(!c){console.error('FAIL',m,g||'');process.exit(1)}pass++}
function sp(q,pred){const x=S.detectSpec(q,{});ok(pred(x),q,x);return x}
function rt(q,e){const x=S.isShortageLanguage(q,{});ok(x===e,q,x)}
function sec(q,e){const x=S.detectSection(q);ok(x===e,q,x)}
function per(q,pred){const x=S.detectPeriod(q);ok(pred(x),q,x)}

sp('وش أكثر صنف يتكرر نقصه؟',x=>x.task==='rank'&&x.metric==='recurrence'&&x.groupBy==='item');
sp('أي منتج يتكرر عندي أكثر؟',x=>x.metric==='recurrence');
sp('وش المقاس اللي دايم يرجع ناقص؟',x=>x.metric==='recurrence');
sp('ايش المنتج اللي كل شوي ينقص؟',x=>x.task==='rank'&&x.metric==='recurrence');
sp('اكثر شي ينقطع عندي',x=>x.task==='rank'&&x.metric==='recurrence');
sp('وش أكثر نقص ضيع علينا فرص؟',x=>x.metric==='lost');
sp('أي قسم خسرنا فيه فرص أكثر؟',x=>x.metric==='lost'&&x.groupBy==='section');
sp('وين راحت علينا فرص أكثر؟',x=>x.metric==='lost'&&x.groupBy==='section');
sp('كم فرصة ضاعت من الفاخر هذا الشهر؟',x=>x.task==='metric'&&x.metric==='lost'&&x.section==='الفاخر'&&x.period?.month==='2026-09');
sp('كم كمية طلبناها من الفاخر؟',x=>x.metric==='requested'&&x.section==='الفاخر'&&!x.status);
sp('كم حبة طلبنا من الأعمال؟',x=>x.metric==='requested'&&x.section==='الأعمال');
sp('كم باقي موجود من 60L؟',x=>x.metric==='current');
sp('صار له كم يوم ناقص؟',x=>x.metric==='age');
sp('قد ايش له ناقص؟',x=>x.task==='metric'&&x.metric==='age');
sp('وش طلبناه وما وصل للحين؟',x=>x.status==='ordered');
sp('وش اللي طلبناه ولسه ما جانا؟',x=>x.status==='ordered');
sp('وش عندنا بانتظار الاكسل؟',x=>x.status==='pending_export'&&x.task!=='export');
sp('وش اللي لسه ما صدرناه؟',x=>x.status==='pending_export');
sp('وش صدرنا ولسه ما طلبنا؟',x=>x.status==='exported_waiting_order'&&x.task!=='export');
sp('صدر لي النواقص اكسل',x=>x.task==='export');
sp('طيب صدرها',x=>x.task==='export');
sp('وش تم تغذيته هذا الشهر؟',x=>x.status==='supplied');
sp('وش باقي ناقص للحين؟',x=>x.status==='unresolved');
per('هذا الشهر',x=>x?.month==='2026-09');
per('من بداية الشهر',x=>x?.month==='2026-09');
per('الشهر اللي فات',x=>x?.month==='2026-08');
per('هالأسبوع',x=>x?.type==='range');
per('الأسبوع ذا',x=>x?.type==='range');
per('آخر ٧ أيام',x=>x?.type==='range');
per('قارن أغسطس بسبتمبر',x=>x?.type==='compare'&&x.periods[0].month==='2026-08'&&x.periods[1].month==='2026-09');
per('قارن أغسطس 2025 بأغسطس 2026',x=>x?.type==='compare'&&x.periods[0].month==='2025-08'&&x.periods[1].month==='2026-08');
sec('وش ناقص في الفاخر؟','الفاخر');sec('نواقص business','الأعمال');sec('وش ناقص في U.W؟','الداخليات');sec('وش ناقص في الداخلي؟','الداخليات');sec('وش وضع الشماغ؟','الأشمغة');sec('وش ناقص بالبيجاما؟','الجلابيات والبيجامات');
rt('وش أكثر صنف ناقص؟',true);rt('كم مبيعات اليوم؟',false);rt('مين ناقص من الفريق اليوم؟',false);rt('كم موظف ناقص اليوم؟',false);rt('وش ناقص في الجاهزية؟',false);rt('وش ناقص من مهام اليوم؟',false);rt('وش المطلوب اليوم؟',false);rt('وش طلبناه وما وصل للحين؟',true);rt('وش عندنا بانتظار الاكسل؟',true);
sp('عطني أعلى 3 نواقص حسب الفرص',x=>x.task==='rank'&&x.metric==='lost'&&x.limit===3);
sp('عطني أخطر 10 نواقص',x=>x.task==='rank'&&x.limit===10&&x.metric==='lost');
S.state.last={spec:{task:'rank',metric:'recurrence',groupBy:'item',section:'الفاخر',period:{type:'month',month:'2026-09',label:'هذا الشهر'}},focus:{type:'item',key:'60L',label:'60L',section:'الفاخر'}};
sp('طيب كم فرصة ضاعت منه؟',x=>x.task==='metric'&&x.metric==='lost'&&x.focus?.key==='60L'&&x.section==='الفاخر');
sp('وكم طلبنا منه؟',x=>x.task==='metric'&&x.metric==='requested'&&x.focus?.key==='60L'&&!x.status);
sp('طيب الشهر الماضي؟',x=>x.period?.month==='2026-08'&&x.focus?.key==='60L'&&x.metric==='recurrence');
S.state.last={spec:{task:'rank',metric:'recurrence',groupBy:'item',section:'الفاخر',period:{type:'month',month:'2026-08',label:'الشهر الماضي'}},focus:{type:'item',key:'60L',label:'60L',section:'الفاخر'}};
sp('والشهر اللي قبله؟',x=>x.period?.month==='2026-07'&&x.focus?.key==='60L'&&x.metric==='recurrence');

const sample=[
{id:'1',section_id:'f',sections:{name:'الفاخر'},size:'60L',current_qty:0,requested_qty:8,lost_opportunities:8,first_detected_date:'2026-08-01',ordered_date:'2026-08-02',supplied_date:'2026-08-05',shortage_status:'تمت التغذية'},
{id:'2',section_id:'f',sections:{name:'الفاخر'},size:'60L',current_qty:0,requested_qty:2,lost_opportunities:4,first_detected_date:'2026-09-01',ordered_date:'2026-09-02',supplied_date:null,shortage_status:'تم الطلب'},
{id:'3',section_id:'b',sections:{name:'الأعمال'},size:'60L',current_qty:0,requested_qty:4,lost_opportunities:1,first_detected_date:'2026-09-03',ordered_date:null,supplied_date:null,shortage_status:'مفتوح',excel_exported_at:null},
{id:'4',section_id:'u',sections:{name:'الداخليات'},size:'رجالي — فرزاتشي — فنيلة — S',current_qty:0,requested_qty:8,lost_opportunities:3,first_detected_date:'2026-09-04',ordered_date:null,supplied_date:null,shortage_status:'مفتوح',excel_exported_at:null},
{id:'5',section_id:'c',sections:{name:'الكلاسيك'},size:'58XXL — أبيض',current_qty:0,requested_qty:4,lost_opportunities:2,first_detected_date:'2026-09-05',ordered_date:'2026-09-06',supplied_date:null,shortage_status:'تم الطلب'}];
global.api=async path=>path==='shortages'?sample:[];
async function ask(q){S.state.busy=false;els.assistantChat.html='';els.assistantInput.value=q;await window.askRakizaAssistant();return els.assistantChat.html}
(async()=>{
S.state.last=null;let h=await ask('وش أكثر صنف يتكرر نقصه؟');ok(/60L/.test(h),'recurrence output',h);ok(!/3 مرة/.test(h),'must not merge 60L across sections',h);
S.state.last=null;h=await ask('كم فرصة ضاعت من الفاخر في سبتمبر؟');ok(/4/.test(h),'lost opportunities = 4',h);
S.state.last=null;h=await ask('وش طلبناه وما وصل للحين؟');ok(/60L/.test(h)&&/58XXL/.test(h),'ordered not supplied lists rows',h);
S.state.last=null;h=await ask('من متى كان 60L في الفاخر ناقص وتمت التغذية؟');ok(/4 يوم/.test(h),'supplied age ends at supplied date',h);
console.log('Rakiza AI shortages tests passed:',pass);
})().catch(e=>{console.error(e);process.exit(1)});
