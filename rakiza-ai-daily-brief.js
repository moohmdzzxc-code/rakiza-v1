(()=>{
'use strict';

const RDB_VERSION='0.1.0';
const AI=window.RakizaAI=window.RakizaAI||{};
const STATE={last:null,busy:false,lastFocusIndex:0};

function basicNorm(v){return String(v??'').toLowerCase().replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[\u064B-\u065F\u0670]/g,'').replace(/ـ/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/[،,:;؛!?؟.()\[\]{}"']/g,' ').replace(/\s+/g,' ').trim()}
function norm(v){return AI.normalize?AI.normalize(v):basicNorm(v)}
function esc(v){return String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]))}
function num(v){const n=Number(v);return Number.isFinite(n)?n:0}
function money(v){return num(v).toLocaleString('en-US',{maximumFractionDigits:2})}
function pct(v){return Number.isFinite(Number(v))?`${Number(v).toFixed(1)}%`:'—'}
function getApp(){try{return app}catch{return window.app||{}}}
function dObj(v){return new Date(String(v)+'T12:00:00')}
function iso(d){return d.toISOString().slice(0,10)}
function addDays(v,n){const d=dObj(v);d.setDate(d.getDate()+n);return iso(d)}
function monthKey(v){return String(v||'').slice(0,7)}
function chat(role,html){const c=document.getElementById('assistantChat');if(!c)return;const mine=role==='user';c.insertAdjacentHTML('beforeend',`<div style="display:flex;justify-content:${mine?'flex-start':'flex-end'}"><div class="task" style="max-width:92%;margin:0;background:${mine?'#eef3f8':'#fff'};border-color:${mine?'#d6e0ea':'#e3e7ec'}">${html}</div></div>`);c.lastElementChild?.scrollIntoView?.({behavior:'smooth',block:'nearest'})}
function dayName(date){try{return new Intl.DateTimeFormat('ar-SA',{weekday:'long'}).format(dObj(date))}catch{return date}}

function dayState(){
  const a=getApp(),day=a.day||null;
  const date=String(day?.work_date||a.date||a.calendarDate||new Date().toISOString().slice(0,10)).slice(0,10);
  if(!day)return{mode:'not_started',date,day:null,label:'لم يبدأ'};
  if(day.status==='مغلق')return{mode:'closed',date,day,label:'مغلق'};
  return{mode:'open',date,day,label:day.status||'مفتوح'};
}
function todayPeriod(){const s=dayState();return{type:'date',date:s.date,label:'اليوم'}}
function yesterdayPeriod(){const s=dayState(),d=addDays(s.date,-1);return{type:'date',date:d,label:'أمس'}}
function monthPeriod(){const s=dayState();return{type:'month',month:monthKey(s.date),label:'هذا الشهر'}}
function coverage(snapshot){return['sales','readiness','attendance','tasks','shortages','actions'].filter(k=>snapshot?.[k]?.available).length}
function salesUnderTarget(s){return s?.sales?.available&&s.sales.targetToDate!==null&&Number.isFinite(Number(s.sales.variance))&&Number(s.sales.variance)<0}

function isBriefFollowUp(text){
  const n=norm(text);
  return STATE.last&&(/^(فصل|فصل لي|عطني التفاصيل|اعطني التفاصيل|وسع|وسع لي|ليش حطيتها|ليش هي اولويه|ليش هي اولوية|وش اسوي فيها|وش أسوي فيها|ايش اسوي فيها|قارنها بامس|قارنها بأمس|قارن بامس|قارن بأمس)/.test(n)||/النقطه\s*(?:الاولى|الثانيه|الثالثه|الرابعه|الخامسه|\d+)/.test(n));
}
function isBriefLanguage(text){
  const n=norm(text);
  if(isBriefFollowUp(text))return true;
  if(/ملخص اليوم|ملخص يوم المعرض|لخص لي اليوم|لخص اليوم|لخص لي يوم المعرض|الموجز اليومي|موجز اليوم|daily brief/.test(n))return true;
  if(/كيف وضعنا اليوم|وش وضعنا اليوم|وش وضع المعرض اليوم/.test(n))return true;
  if(/وش يحتاج انتباهي|وش يحتاج انتباهي اليوم|وش اهم شي اركز عليه|وش اهم شيء اركز عليه|وش اركز عليه اليوم|وش يحتاج تدخلي اليوم/.test(n))return true;
  return false;
}
function ordinalIndex(text){
  const n=norm(text),m=n.match(/(?:النقطه|الاولوية|الاولويه|اولوية|اولويه)\s*(\d+)/);if(m)return Math.max(0,Number(m[1])-1);
  if(/الاولى|الاول/.test(n))return 0;if(/الثانيه|الثاني/.test(n))return 1;if(/الثالثه|الثالث/.test(n))return 2;if(/الرابعه|الرابع/.test(n))return 3;if(/الخامسه|الخامس/.test(n))return 4;
  return STATE.lastFocusIndex||0;
}
function stableTeamText(a){
  if(!a?.available)return'لا توجد بيانات حضور كافية لليوم.';
  if(!a.records&&a.plannedWorking>0)return`خطة التواجد تشير إلى ${a.plannedWorking} مداومين، لكن الحضور الفعلي لم يُسجل بما يكفي للحكم.`;
  if(a.absent||a.late)return`الفريق: غياب ${a.absent||0}، وتأخير ${a.late||0} ضمن السجلات الحالية.`;
  if(a.records)return`الفريق مستقر ضمن السجلات الحالية؛ لا غياب ولا تأخير مسجل.`;
  return'لا توجد بيانات حضور فعلية كافية لليوم.';
}
function readinessText(r){
  if(!r?.available)return'لا توجد جاهزية تشغيلية معتمدة لليوم بعد.';
  if(r.criticalOpen>0)return`الجاهزية ${pct(r.average)}، ويوجد ${r.criticalOpen} بند حرج مفتوح يحتاج متابعة.`;
  if(r.open>0)return`الجاهزية ${pct(r.average)}، وهناك ${r.open} ملاحظة جاهزية مفتوحة.`;
  return`الجاهزية مستقرة (${pct(r.average)}) ولا توجد بنود حرجة مفتوحة ضمن البيانات المقروءة.`;
}
function tasksText(t,mode,day){
  if(day?.day_type==='يوم بيعي فقط')return'اليوم بيعي فقط — لا توجد مهام تشغيلية ضمن الخطة.';
  if(!t?.available)return mode==='not_started'?'لم يبدأ يوم التشغيل، لذلك لا توجد حالة تنفيذ لمهام اليوم.':'لا توجد خطة مهام/تنفيذ كافية لليوم.';
  if(mode==='closed')return`النتيجة النهائية للمهام: مكتملة ${t.completed||0}، جزئية ${t.partial||0}، ولم تنفذ ${t.notDone||0}.${t.unfinalized?` ويوجد ${t.unfinalized} مهمة لم تثبت حالتها النهائية رغم إغلاق اليوم وتحتاج مراجعة السجل.`:''}`;
  if(t.total>0)return`يوجد ${t.total} مهمة ضمن خطة اليوم؛ ${t.unfinalized||0} منها لم تُثبت حالتها النهائية بعد، ولا تُعامل كمهام فاشلة قبل الإغلاق.`;
  return'لا توجد مهام تشغيلية مسجلة لليوم.';
}
function salesText(daySnap,monthSnap,state){
  const day=state.day||{};
  if(state.mode==='closed'){
    const s=daySnap?.sales;if(!s?.available)return'اليوم مغلق، لكن لا توجد بيانات مبيعات مغلقة كافية لعرض النتيجة.';
    let x=`مبيعات اليوم الفعلية ${money(s.sales)}.`;
    if(s.targetToDate!==null&&Number.isFinite(Number(s.variance))){x+=s.variance<0?` أقل من المستهدف بمقدار ${money(Math.abs(s.variance))}.`:s.variance>0?` أعلى من المستهدف بمقدار ${money(s.variance)}.`:' مطابقة للمستهدف.'}
    return x;
  }
  let x=state.mode==='not_started'?'لم يبدأ يوم التشغيل بعد. ':'مبيعات اليوم النهائية لم تُثبت بعد، لذلك لا تُعامل كصفر. ';
  if(day.daily_target!==undefined&&day.daily_target!==null&&Number(day.daily_target)>0)x+=`مستهدف اليوم ${money(day.daily_target)}. `;
  const s=monthSnap?.sales;
  if(s?.available){x+=`المحقق المسجل من الشهر حتى آخر يوم مغلق${s.cutoff?` (${s.cutoff})`:''}: ${money(s.sales)}.`;if(s.targetToDate!==null&&Number.isFinite(Number(s.variance)))x+=s.variance<0?` الفجوة المسجلة مقابل المستهدف حتى ذلك التاريخ ${money(Math.abs(s.variance))}.`:s.variance>0?` أعلى من المستهدف حتى ذلك التاريخ بمقدار ${money(s.variance)}.`:' مطابق للمستهدف حتى ذلك التاريخ.'}
  else x+='لا توجد أيام مبيعات مغلقة كافية هذا الشهر لعرض وضع موثوق.';
  return x;
}
function followupsText(s){
  const sh=s?.shortages,a=s?.actions;
  if(!sh?.available&&!a?.available)return'تعذر قراءة النواقص والإجراءات الحالية.';
  const parts=[];
  if(sh?.available)parts.push(`نواقص غير محسومة: ${sh.unresolvedCurrent||0}${sh.orderedAwaitingSupply?` (منها ${sh.orderedAwaitingSupply} بانتظار التغذية)`:''}`);
  if(a?.available)parts.push(`إجراءات مفتوحة: ${a.openCurrent||0}${a.escalatedCurrent?` (منها ${a.escalatedCurrent} مصعّدة وقيد المتابعة)`:''}`);
  return parts.join('، ')+'.';
}

function briefPriorityItems(daySnap,monthSnap,state,limit=3){
  const out=[],push=(band,domain,kind,text,why,action,evidence)=>out.push({band,domain,kind,text,why,action,evidence});
  const r=daySnap?.readiness,a=daySnap?.attendance,t=daySnap?.tasks,sh=daySnap?.shortages,ac=daySnap?.actions,monthSh=monthSnap?.shortages,monthR=monthSnap?.readiness;
  if(r?.criticalOpen>0)push(1,'الجاهزية','critical',`معالجة ${r.criticalOpen} بند حرج مفتوح في الجاهزية.`,`البند الحرج مثبت في سجل الجاهزية لليوم.`,`راجع البند الحرج وإجراءه المسجل أولًا، ثم ثبّت المعالجة أو المتابعة دون تغيير وزن الجاهزية.`,{criticalOpen:r.criticalOpen,average:r.average});
  if(r?.open>r?.criticalOpen)push(2,'الجاهزية','operational',`متابعة ملاحظات الجاهزية المفتوحة غير الحرجة (${r.open-r.criticalOpen}).`,`هي ملاحظات تشغيلية مفتوحة في سجل اليوم.`,`راجع الإجراء المسجل لكل ملاحظة وأغلق ما عولج فعليًا فقط.`,{open:r.open,criticalOpen:r.criticalOpen});
  if(a?.absent>0||a?.late>0)push(2,'الفريق','attendance',`مراجعة وضع الفريق: غياب ${a.absent||0} وتأخير ${a.late||0}.`,`هذه حالات حضور فعلية مسجلة لليوم، دون نسبها تلقائيًا للمبيعات.`,`تأكد من تغطية التشغيل وسجل أي تعديل معتمد على خطة التواجد مع سببه.`,{absent:a.absent||0,late:a.late||0});
  const repeatedR=monthR?.repeated?.[0];
  if(!r?.criticalOpen&&repeatedR?.count>1)push(2,'الجاهزية','repeated_readiness',`مراجعة تكرار تعثر «${repeatedR.label}» (${repeatedR.count} مرات هذا الشهر).`,`التكرار مثبت تاريخيًا، لكنه لا يثبت سببًا بيعيًا.`,`راجع ما إذا كان له إجراء مفتوح أو معالجة متكررة وحدد متابعة تشغيلية مناسبة.`,repeatedR);
  if(ac?.oldest?.age>0)push(3,'الإجراءات','age',`مراجعة أقدم إجراء مفتوح «${ac.oldest.subject}» (${ac.oldest.age} يوم).`,`الأقدمية ترفع أولوية المتابعة، لكنها ليست حكم SLA أو وصفًا تلقائيًا بأنه متأخر.`,`راجع آخر تحديث والجهة المرفوع لها، واستمر بالمتابعة حتى تسجيل نتيجة معالجة فعلية.`,ac.oldest);
  const repSh=monthSh?.repeated?.[0];
  if(repSh?.count>1)push(4,'النواقص','repeated_shortage',`متابعة النقص المتكرر «${repSh.label}» في ${repSh.section} (${repSh.count} مرات هذا الشهر).`,`التكرار والفرص الضائعة مأخوذة من سجل النواقص، ولا تمحى بالتغذية اللاحقة.`,`راجع حالة الطلب الحالية والتغذية والفرص الضائعة قبل اتخاذ إجراء إضافي.`,repSh);
  else if(sh?.unresolvedCurrent>0)push(4,'النواقص','open_shortage',`متابعة النواقص غير المحسومة حاليًا (${sh.unresolvedCurrent}).`,`الحالات ما زالت مفتوحة أو مطلوبة ولم تكتمل دورة التغذية.`,`راجع الحالات المفتوحة وطلبات التغذية القائمة حسب دورة النواقص المعتمدة.`,{unresolvedCurrent:sh.unresolvedCurrent});
  if(state.mode==='closed'&&t?.incomplete>0)push(5,'المهام','execution',`متابعة المهام النهائية غير المكتملة (${t.incomplete}).`,`التعثر مثبت بحالة تنفيذ نهائية عند إغلاق اليوم.`,`راجع سبب عدم الإكمال المسجل لكل مهمة وحدد متابعة اليوم التالي عند الحاجة.`,{incomplete:t.incomplete,partial:t.partial,notDone:t.notDone});
  const ss=state.mode==='closed'?daySnap:monthSnap;
  if(salesUnderTarget(ss))push(6,'المبيعات','sales_gap',`متابعة الفجوة البيعية المسجلة (${money(Math.abs(ss.sales.variance))}).`,`البيانات تثبت الفجوة مقابل المستهدف، لكنها لا تثبت سببها.`,`راقب الأداء البيعي والعوامل التشغيلية كلٌ على حدة، ولا تنسب السبب إلا بدليل إضافي.`,{variance:ss.sales.variance,sales:ss.sales.sales,targetToDate:ss.sales.targetToDate});
  return out.sort((x,y)=>x.band-y.band).slice(0,Math.max(1,limit));
}
function readingText(daySnap,monthSnap,state,priorities){
  const domains=[...new Set(priorities.map(x=>x.domain))];
  let text=domains.length?`الضغط التشغيلي ${state.mode==='closed'?'في نتيجة اليوم':'حاليًا'} متركز في ${domains.slice(0,2).join(' و')}.`:'لا تظهر من البيانات الحالية نقطة تشغيلية بارزة تحتاج تدخلًا مباشرًا.';
  const salesSnap=state.mode==='closed'?daySnap:monthSnap;
  if(salesUnderTarget(salesSnap)&&domains.length)text+=` توجد أيضًا فجوة بيعية مسجلة، لكن البيانات الحالية لا تثبت أن هذه الضغوط هي سبب الفجوة.`;
  else if(state.mode!=='closed')text+=` مبيعات اليوم النهائية غير مثبتة بعد، لذلك لا يصح الحكم على نتيجة اليوم البيعية.`;
  return text;
}
function confidenceText(daySnap,monthSnap,state){const c=coverage(daySnap),mc=monthSnap?.sales?.available?1:0;if(c>=5&&mc)return'مرتفعة نسبيًا';if(c>=3)return'متوسطة';return state.mode==='not_started'?'منخفضة':'منخفضة إلى متوسطة'}

async function buildBrief(){
  if(!AI.store?.gatherPeriod)throw Error('عقل التحليل الشامل للمعرض غير متاح');
  const state=dayState(),[daySnap,monthSnap]=await Promise.all([AI.store.gatherPeriod(todayPeriod()),AI.store.gatherPeriod(monthPeriod())]);
  const priorities=briefPriorityItems(daySnap,monthSnap,state,3);
  const brief={
    version:RDB_VERSION,
    state,
    daySnapshot:daySnap,
    monthSnapshot:monthSnap,
    priorities,
    sections:{
      sales:salesText(daySnap,monthSnap,state),
      readiness:readinessText(daySnap.readiness),
      team:stableTeamText(daySnap.attendance),
      tasks:tasksText(daySnap.tasks,state.mode,state.day),
      followups:followupsText(daySnap)
    },
    reading:readingText(daySnap,monthSnap,state,priorities),
    confidence:confidenceText(daySnap,monthSnap,state),
    limitations:[]
  };
  if(state.mode!=='closed')brief.limitations.push('مبيعات اليوم النهائية لا تُثبت قبل الإغلاق.');
  if(daySnap.tasks?.unfinalized>0&&state.mode!=='closed')brief.limitations.push('المهام غير النهائية في اليوم المفتوح لا تُعامل كفشل.');
  for(const [k,label] of [['readiness','الجاهزية'],['attendance','الحضور'],['tasks','المهام']])if(!daySnap[k]?.available)brief.limitations.push(`${label}: لا توجد بيانات كافية لليوم.`);
  return brief;
}
function statusTitle(state){return state.mode==='closed'?'نتيجة اليوم':state.mode==='open'?'اليوم التشغيلي مستمر':'يوم التشغيل لم يبدأ'}
function renderPriorities(items){return items.length?`<ol style="margin:6px 18px 0 0;padding:0">${items.map(x=>`<li style="margin:6px 0">${esc(x.text)}</li>`).join('')}</ol>`:'<div class="mut">لا توجد أولوية تشغيلية بارزة من البيانات الحالية.</div>'}
function renderCompact(b){
  const s=b.state;
  return `<div><div class="title">الملخص اليومي الذكي — ${esc(dayName(s.date))} ${esc(s.date)}</div><div class="notice ${s.mode==='closed'?'ok':''}"><b>${esc(statusTitle(s))}</b></div>
  <div class="task"><b>المبيعات</b><div class="mut" style="margin-top:4px">${esc(b.sections.sales)}</div></div>
  <div class="task"><b>التشغيل</b><div class="mut" style="margin-top:4px">${esc(b.sections.readiness)}</div></div>
  <div class="task"><b>الفريق</b><div class="mut" style="margin-top:4px">${esc(b.sections.team)}</div></div>
  <div class="task"><b>مهام اليوم</b><div class="mut" style="margin-top:4px">${esc(b.sections.tasks)}</div></div>
  <div class="task"><b>النواقص والمتابعات</b><div class="mut" style="margin-top:4px">${esc(b.sections.followups)}</div></div>
  <div class="task"><b>أولوية المدير الآن</b>${renderPriorities(b.priorities)}</div>
  <div class="notice"><b>قراءة ركيزة:</b> ${esc(b.reading)}</div>
  <div class="mut" style="margin-top:7px">الثقة: ${esc(b.confidence)}. لا توجد درجة صحة/خطر مركبة للمعرض، ولا يتم تنفيذ أي تغيير تشغيلي من هذا الملخص.</div></div>`;
}
function renderPriorityDetail(item,index,mode='expand'){
  if(!item)return'<div class="notice">لا توجد أولوية بهذا الرقم في آخر ملخص.</div>';
  const head=`الأولوية ${index+1}: ${item.text}`;
  if(mode==='why')return`<div class="title">لماذا هذه أولوية؟</div><div class="task"><b>${esc(head)}</b><div class="mut" style="margin-top:6px">${esc(item.why)}</div></div>`;
  if(mode==='action')return`<div class="title">ماذا أفعل الآن؟</div><div class="task"><b>${esc(head)}</b><div class="mut" style="margin-top:6px">${esc(item.action)}</div></div><div class="notice">هذه توصية تشغيلية فقط؛ لا ينفذ ركيزة أي تعديل أو تصعيد أو إغلاق تلقائيًا.</div>`;
  return`<div class="title">تفصيل الأولوية ${index+1}</div><div class="task"><b>${esc(item.text)}</b><div style="margin-top:6px"><b>سبب الأولوية:</b> ${esc(item.why)}</div><div style="margin-top:6px"><b>الإجراء المقترح:</b> ${esc(item.action)}</div></div>`;
}
async function compareYesterday(){
  if(!STATE.last)throw Error('أنشئ الملخص اليومي أولًا');
  const b=STATE.last,prev=await AI.store.gatherPeriod(yesterdayPeriod()),today=b.daySnapshot,rows=[];
  if(b.state.mode==='closed'&&today.sales?.available&&prev.sales?.available){const diff=num(today.sales.sales)-num(prev.sales.sales);rows.push(`المبيعات: اليوم ${money(today.sales.sales)} مقابل أمس ${money(prev.sales.sales)} (${diff>=0?'+':''}${money(diff)}).`)}
  else rows.push('المبيعات: لا يمكن مقارنة نتيجة اليوم النهائية بأمس قبل إغلاق اليوم وتثبيت المبيعات.');
  if(today.readiness?.available&&prev.readiness?.available){const d=num(today.readiness.average)-num(prev.readiness.average);rows.push(`الجاهزية: ${pct(today.readiness.average)} مقابل ${pct(prev.readiness.average)} أمس (${d>=0?'+':''}${d.toFixed(1)} نقطة).`)}
  else rows.push('الجاهزية: البيانات غير كافية للمقارنة بين اليوم وأمس.');
  if(today.attendance?.available&&prev.attendance?.available)rows.push(`الفريق: اليوم غياب ${today.attendance.absent||0}/تأخير ${today.attendance.late||0}، وأمس غياب ${prev.attendance.absent||0}/تأخير ${prev.attendance.late||0}.`);
  if(b.state.mode==='closed'&&today.tasks?.available&&prev.tasks?.available)rows.push(`المهام غير المكتملة نهائيًا: اليوم ${today.tasks.incomplete||0} مقابل أمس ${prev.tasks.incomplete||0}.`);
  else if(today.tasks?.unfinalized>0)rows.push('المهام: حالة تنفيذ اليوم ما زالت غير نهائية، لذلك لا أقارنها كتعثر نهائي مع أمس.');
  return`<div class="title">مقارنة الملخص بأمس</div>${rows.map(x=>`<div class="task">${esc(x)}</div>`).join('')}<div class="notice">المقارنة وصفية فقط؛ لا تثبت علاقة سببية بين التشغيل والمبيعات.</div>`;
}
async function answer(text){
  const n=norm(text);
  if(STATE.last&&/فصل|عطني التفاصيل|اعطني التفاصيل/.test(n)){
    if(AI.store?.answer)return AI.store.answer('حلل المعرض اليوم',{});
    return'<div class="notice">التفاصيل الموسعة غير متاحة حاليًا.</div>';
  }
  if(STATE.last&&/قارنها بامس|قارنها بأمس|قارن بامس|قارن بأمس/.test(n))return compareYesterday();
  if(STATE.last&&/وسع|النقطه|النقطة/.test(n)){
    const i=Math.min(STATE.last.priorities.length-1,ordinalIndex(text));STATE.lastFocusIndex=Math.max(0,i);return renderPriorityDetail(STATE.last.priorities[i],i,'expand');
  }
  if(STATE.last&&/ليش حطيتها|ليش هي اولويه|ليش هي اولوية/.test(n)){
    const i=Math.min(STATE.last.priorities.length-1,ordinalIndex(text));STATE.lastFocusIndex=Math.max(0,i);return renderPriorityDetail(STATE.last.priorities[i],i,'why');
  }
  if(STATE.last&&/وش اسوي فيها|وش أسوي فيها|ايش اسوي فيها/.test(n)){
    const i=Math.min(STATE.last.priorities.length-1,ordinalIndex(text));STATE.lastFocusIndex=Math.max(0,i);return renderPriorityDetail(STATE.last.priorities[i],i,'action');
  }
  const b=await buildBrief();STATE.last=b;STATE.lastFocusIndex=0;if(AI.state)AI.state.context={intent:'daily_brief',entities:{domain:'daily_brief',dailyBrief:b},lastMessage:text};return renderCompact(b);
}

const baseAsk=window.askRakizaAssistant;
window.askRakizaAssistant=async function(){
  const inp=document.getElementById('assistantInput'),q=inp?.value?.trim();if(!q)return;
  if(!isBriefLanguage(q)){if(typeof baseAsk==='function')return baseAsk.apply(this,arguments);return}
  if(STATE.busy)return;STATE.busy=true;if(inp)inp.value='';chat('user',esc(q));
  try{chat('assistant',await answer(q))}catch(e){chat('assistant',`<div class="notice err"><b>تعذر إنشاء الملخص اليومي الذكي.</b><div style="margin-top:5px">${esc(e.message||String(e))}</div></div>`)}finally{STATE.busy=false}
};
window.askRakizaAssistant.__rakizaDailyBriefWrapped=true;
window.askRakizaAssistant.__base=baseAsk;

AI.dailyBrief={version:RDB_VERSION,state:STATE,isBriefLanguage,dayState,todayPeriod,yesterdayPeriod,monthPeriod,briefPriorityItems,buildBrief,renderCompact,renderPriorityDetail,compareYesterday,answer};
})();
