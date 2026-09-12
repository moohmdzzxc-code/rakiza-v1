(()=>{
'use strict';

const RSI_SALES_VERSION='0.1.0';
const SALES_STATE={last:null,busy:false,targetCache:new Map()};
const DOW=[
  {i:0,name:'الأحد',a:['الاحد','الأحد','احد']},
  {i:1,name:'الاثنين',a:['الاثنين','الإثنين','اثنين']},
  {i:2,name:'الثلاثاء',a:['الثلاثاء','الثلاثا','ثلاثاء','ثلاثا','ثلوث','ثلثاء']},
  {i:3,name:'الأربعاء',a:['الاربعاء','الأربعاء','اربعاء','أربعاء','ربوع']},
  {i:4,name:'الخميس',a:['الخميس','خميس']},
  {i:5,name:'الجمعة',a:['الجمعه','الجمعة','جمعه','جمعة']},
  {i:6,name:'السبت',a:['السبت','سبت']}
];
const MONTHS=[['يناير',1],['فبراير',2],['مارس',3],['ابريل',4],['مايو',5],['يونيو',6],['يوليو',7],['اغسطس',8],['سبتمبر',9],['اكتوبر',10],['نوفمبر',11],['ديسمبر',12]];
const UNSUPPORTED={
  atv:['atv','متوسط الفاتوره','متوسط الفاتورة','قيمه الفاتوره','قيمة الفاتورة'],
  upt:['upt','متوسط القطع','قطع الفاتوره','قطع الفاتورة'],
  transactions:['عدد الفواتير','فواتير','transactions','ترانزاكشن'],
  quantity:['الكميات','كميات مبيعه','كميات مباعة','عدد القطع المباعة','قطع مبيعه','قطع مباعة'],
  visitors:['الزوار','زوار','زائر','الحركه','الحركة','الاقبال','الإقبال','footfall','traffic'],
  conversion:['conversion','نسبه التحويل','نسبة التحويل','تحويل الزوار','cv']
};

function basicNorm(v){return String(v??'').toLowerCase().replace(/[٠-٩]/g,d=>'٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/[۰-۹]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[\u064B-\u065F\u0670]/g,'').replace(/ـ/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/[،,:;؛!?؟.()\[\]{}"']/g,' ').replace(/\s+/g,' ').trim()}
function norm(v){return window.RakizaAI?.normalize?window.RakizaAI.normalize(v):basicNorm(v)}
function esc(v){return String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]))}
function num(v){const n=Number(v);return Number.isFinite(n)?n:0}
function money(v){return num(v).toLocaleString('en-US',{maximumFractionDigits:2})}
function pct(v){return Number.isFinite(v)?`${v.toFixed(1)}%`:'—'}
function getApp(){try{return app}catch{return window.app||{}}}
function callApi(name,o={}){const fn=typeof window.api==='function'?window.api:(typeof api==='function'?api:null);if(!fn)throw Error('واجهة بيانات ركيزة غير متاحة');return fn(name,o)}
function baseDate(){const a=getApp();return String(a.calendarDate||a.day?.work_date||a.date||new Date().toISOString().slice(0,10)).slice(0,10)}
function dObj(v){return new Date(String(v)+'T12:00:00')}
function iso(d){return d.toISOString().slice(0,10)}
function addDays(v,n){const d=dObj(v);d.setDate(d.getDate()+n);return iso(d)}
function sunday(v){const d=dObj(v);d.setDate(d.getDate()-d.getDay());return iso(d)}
function monthKey(v){return String(v||'').slice(0,7)}
function monthStart(k){return /^20\d{2}-\d{2}$/.test(String(k))?`${k}-01`:String(k||'').slice(0,7)+'-01'}
function previousMonth(k){const m=String(k).match(/^(20\d{2})-(\d{2})$/);if(!m)return null;const d=new Date(Number(m[1]),Number(m[2])-2,1);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`}
function nextMonth(k){const m=String(k).match(/^(20\d{2})-(\d{2})$/);if(!m)return null;const d=new Date(Number(m[1]),Number(m[2]),1);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`}
function daysInMonth(k){const [y,m]=String(k).split('-').map(Number);return new Date(y,m,0).getDate()}
function endMonth(k){return`${k}-${String(daysInMonth(k)).padStart(2,'0')}`}
function fuzzy(a,b){a=norm(a);b=norm(b);if(a===b)return true;if(a.length<4||b.length<4)return false;const p=Array.from({length:b.length+1},(_,i)=>i),c=new Array(b.length+1);for(let i=1;i<=a.length;i++){c[0]=i;for(let j=1;j<=b.length;j++)c[j]=Math.min(c[j-1]+1,p[j]+1,p[j-1]+(a[i-1]===b[j-1]?0:1));for(let j=0;j<=b.length;j++)p[j]=c[j]}return p[b.length]<=(Math.max(a.length,b.length)>=8?2:1)}
function fuzzyAny(text,words){const ts=norm(text).split(' ').filter(Boolean);return words.some(w=>{const nw=norm(w);return norm(text).includes(nw)||(!nw.includes(' ')&&ts.some(t=>fuzzy(t,nw)))})}
function chat(role,html){const c=document.getElementById('assistantChat');if(!c)return;const mine=role==='user';c.insertAdjacentHTML('beforeend',`<div style="display:flex;justify-content:${mine?'flex-start':'flex-end'}"><div class="task" style="max-width:88%;margin:0;background:${mine?'#eef3f8':'#fff'};border-color:${mine?'#d6e0ea':'#e3e7ec'}">${html}</div></div>`);c.lastElementChild?.scrollIntoView?.({behavior:'smooth',block:'nearest'})}

function namedMonths(text){const n=norm(text),baseYear=dObj(baseDate()).getFullYear(),out=[];for(const [name,m] of MONTHS){let pos=0,i;while((i=n.indexOf(name,pos))>=0){const after=n.slice(i+name.length,i+name.length+12),ym=after.match(/^\s*(20\d{2})/),year=ym?Number(ym[1]):baseYear;out.push({type:'month',month:`${year}-${String(m).padStart(2,'0')}`,label:`${name}${ym?` ${year}`:''}`,index:i});pos=i+name.length}}out.sort((a,b)=>a.index-b.index);return out}
function explicitDate(text){const n=norm(text);let m=n.match(/\b(20\d{2})[-\/]([01]?\d)[-\/]([0-3]?\d)\b/);if(m)return`${m[1]}-${String(Number(m[2])).padStart(2,'0')}-${String(Number(m[3])).padStart(2,'0')}`;m=n.match(/\b([0-3]?\d)[-\/]([01]?\d)[-\/](20\d{2})\b/);if(m)return`${m[3]}-${String(Number(m[2])).padStart(2,'0')}-${String(Number(m[1])).padStart(2,'0')}`;return null}
function weekdayPeriod(text){const n=norm(text),base=baseDate(),bd=dObj(base),current=bd.getDay();for(const d of DOW){if(!d.a.some(a=>n.includes(norm(a))))continue;let date;if(/الجاي|القادم|المقبل/.test(n)){let diff=(d.i-current+7)%7;if(diff===0)diff=7;date=addDays(base,diff)}else if(/الماضي|السابق|اللي فات|الي فات/.test(n)){let diff=(current-d.i+7)%7;if(diff===0)diff=7;date=addDays(base,-diff)}else{let diff=(current-d.i+7)%7;date=addDays(base,-diff)}return{type:'date',date,label:d.name}}return null}
function detectPeriod(text,prior=null){const n=norm(text),base=baseDate(),named=namedMonths(text),explicit=explicitDate(text);if(explicit)return{type:'date',date:explicit,label:explicit};
  if(named.length>=2)return{type:'compare',periods:named.slice(0,2)};
  if(/قارن/.test(n)&&(/هذا الشهر|هالشهر/.test(n))&&(/الشهر الماضي|الشهر اللي فات|الشهر الي فات/.test(n))){const cur=monthKey(base),prev=previousMonth(cur);return{type:'compare',periods:[{type:'month',month:cur,label:'هذا الشهر'},{type:'month',month:prev,label:'الشهر الماضي'}]}}
  if(/قارن/.test(n)&&(/هذا الاسبوع|هالاسبوع|الاسبوع ذا/.test(n))&&(/الاسبوع الماضي|الاسبوع اللي فات|الاسبوع الي فات/.test(n))){const st=sunday(base),pst=addDays(st,-7);return{type:'compare',periods:[{type:'range',start:st,end:addDays(st,6),label:'هذا الأسبوع'},{type:'range',start:pst,end:addDays(pst,6),label:'الأسبوع الماضي'}]}}
  if(/قارن/.test(n)&&/اليوم/.test(n)&&/امس|البارح/.test(n))return{type:'compare',periods:[{type:'date',date:base,label:'اليوم'},{type:'date',date:addDays(base,-1),label:'أمس'}]};
  if(named.length===1)return named[0];
  if(/هذا الشهر|هالشهر|الشهر الحالي|من بدايه الشهر|من اول الشهر/.test(n))return{type:'month',month:monthKey(base),label:'هذا الشهر'};
  if(/الشهر الماضي|الشهر السابق|الشهر اللي فات|الشهر الي فات/.test(n))return{type:'month',month:previousMonth(monthKey(base)),label:'الشهر الماضي'};
  if(prior?.type==='month'&&/(?:الشهر|والشهر) (?:اللي|الي) قبله|الشهر قبله/.test(n)){const pm=previousMonth(prior.month);return{type:'month',month:pm,label:'الشهر اللي قبله'}}
  let m=n.match(/اخر\s*(\d+)\s*(?:يوم|ايام)/);if(m){const c=Math.max(1,Number(m[1]));return{type:'range',start:addDays(base,-c+1),end:base,label:`آخر ${c} يوم`}}
  if(/هذا الاسبوع|هالاسبوع|الاسبوع الحالي|الاسبوع ذا/.test(n)){const st=sunday(base);return{type:'range',start:st,end:addDays(st,6),label:'هذا الأسبوع'}}
  if(/الاسبوع الماضي|الاسبوع السابق|الاسبوع اللي فات|الاسبوع الي فات/.test(n)){const st=addDays(sunday(base),-7);return{type:'range',start:st,end:addDays(st,6),label:'الأسبوع الماضي'}}
  if(/اليوم/.test(n))return{type:'date',date:base,label:'اليوم'};
  if(/امس|البارح/.test(n))return{type:'date',date:addDays(base,-1),label:'أمس'};
  return weekdayPeriod(text)
}
function periodLabel(p){if(!p)return'كل البيانات البيعية المسجلة';if(p.type==='month')return p.label||p.month;if(p.type==='date')return p.label||p.date;if(p.type==='range')return p.label||`${p.start} إلى ${p.end}`;if(p.type==='compare')return p.periods.map(periodLabel).join(' مقابل ');return'الفترة المحددة'}
function inPeriod(date,p){if(!p)return true;if(!date)return false;const d=String(date).slice(0,10);if(p.type==='date')return d===p.date;if(p.type==='month')return d.slice(0,7)===p.month;if(p.type==='range')return d>=p.start&&d<=p.end;return true}

function unsupportedMetric(text){const n=norm(text);for(const [key,arr] of Object.entries(UNSUPPORTED))if(arr.some(x=>n.includes(norm(x))))return key;return null}
function isExportCommand(n){return/(?:صدرها|تصديرها|صدّرها)/.test(n)||/(?:صدر|تصدير|نزل|حمل|طلع)\s*(?:لي|لنا|ها|ه)?[^\n]{0,25}(?:اكسل|excel|xlsx)|(?:اكسل|excel|xlsx)\s*(?:للمبيعات|مبيعات)/.test(n)}
function detectMetric(text){const n=norm(text),uns=unsupportedMetric(text);if(uns)return`unsupported:${uns}`;
  if(/كم يوم.*(?:ما حقق|ما وصل|تحت)|ايام.*(?:ما حقق|ما وصل|تحت)/.test(n))return'days_missed';
  if(/كم يوم.*(?:حقق|وصل|فوق)|ايام.*(?:حقق|وصل|فوق)/.test(n))return'days_hit';
  if(/متوسط.*(?:مبيعات|بيع)|متوسطنا|المتوسط/.test(n))return'average';
  if(/فوق المستهدف|تحت المستهدف|فوق التارقت|تحت التارقت|مقابل المستهدف حتي/.test(n))return'variance_to_date';
  if(/المستهدف حتي|التارقت حتي|التارجت حتي|هدفنا حتي/.test(n))return'target_to_date';
  if(/كم باقي|وش باقي|المتبقي|فجوه|فجوة|عجز|ناقص عن (?:التارقت|التارجت|المستهدف)|فرق.*(?:تارقت|مستهدف)/.test(n))return'gap';
  if(/نسبه|نسبة|تحقيق|حققنا(?!\s+كم\s+يوم)|كم حققنا|المحقق من.*(?:تارقت|مستهدف)/.test(n))return'achievement';
  if(/مستهدف|تارقت|تارجت|تارغت|ترقت|target|هدف المبيعات|هدفنا/.test(n)&&!/مبيعات|بيع/.test(n))return'target';
  return'sales'
}
function detectRank(text){const n=norm(text);if(/افضل|أفضل|اعلي|اعلى|أعلى|اكبر|أكبر/.test(n)){return{direction:'desc',by:/تحقيق|نسبه|نسبة/.test(n)?'achievement':/فوق المستهدف|فرق/.test(n)?'variance':'sales'}}if(/اسوا|أسوأ|اقل|أقل|ادني|ادنى|أدنى/.test(n)){return{direction:'asc',by:/تحقيق|نسبه|نسبة/.test(n)?'achievement':/تحت المستهدف|فرق/.test(n)?'variance':'sales'}}return null}
function detectTask(text,period){const n=norm(text),rank=detectRank(text);if(isExportCommand(n))return'export';if(period?.type==='compare'||/قارن|مقارنه|مقارنة|مقابل/.test(n))return'compare';if(rank)return'rank';if(/حلل|تحليل|قيم|قيّم|اداء|أداء|وش وضع|كيف وضع|كيف المبيعات|ملخص|خلاصه|خلاصة/.test(n))return'analysis';return'metric'}
function isFollow(text){const n=norm(text);return/^(طيب|تمام|زين|وكم|وش|ووش|وايش|والشهر|والاسبوع|وبالنسبه|وبالنسبة|بس)/.test(n)||/(منه|منها|فيه|فيها|نفسه|نفسها|اللي قبله|الي قبله|قارنها|صدرها)/.test(n)}
function detectSpec(text,analysis={}){const n=norm(text),prior=SALES_STATE.last?.spec||null;let period=detectPeriod(text,prior?.period),task=detectTask(text,period),metric=detectMetric(text),rank=detectRank(text),follow=!!prior&&isFollow(text);if(['target_to_date','variance_to_date'].includes(metric)&&period?.type==='date'&&period.date===baseDate()&&/حتي اليوم/.test(n))period={type:'month',month:monthKey(baseDate()),label:'هذا الشهر'};
  if(task==='compare'&&period?.type!=='compare'&&prior?.period&&period){period={type:'compare',periods:[prior.period,period]}}
  if(follow&&prior){if(!period)period=prior.period;if(metric==='sales'&&!/(مبيعات|بيع|المباع)/.test(n)&&!unsupportedMetric(text))metric=prior.metric||metric;if(task==='metric'&&!/(كم|وش|نسبه|نسبة|باقي|متبقي|فجوه|فجوة|مستهدف|تارقت|متوسط)/.test(n))task=prior.task||task}
  if(rank){task='rank';metric=rank.by;}
  if(!period&&!follow)period={type:'month',month:monthKey(baseDate()),label:'هذا الشهر'};
  return{task,metric,period,rank,follow}
}
function isSalesLanguage(text,analysis={}){const n=norm(text),globalDomain=window.RakizaAI?.state?.context?.entities?.domain,follow=isFollow(text),explicit=fuzzyAny(text,['مبيعات','المبيعات','مبيعاتي','مبيعاات','مبيعت','بيع','تارقت','تارجت','تارغت','ترقت','مستهدف','التحقيق','تحقيق'])||!!unsupportedMetric(text),target=/تارقت|تارجت|تارغت|ترقت|مستهدف|هدف المبيعات/.test(n),other=/نواقص|تغذيه|مقاس|صنف|جاهزي|حضور|غياب|موظف|فريق|شفت|تواجد|مهام|صيانه|اجراء|متابعه/.test(n),ad=analysis?.entities?.domain;
  if(ad==='multi')return false;if(other&&!explicit&&!target)return false;if(ad&&ad!=='sales'&&!explicit&&!target)return false;if(/نواقص|تغذيه|مقاس|صنف/.test(n)&&/مبيعات|بيع/.test(n))return false;if(follow&&globalDomain==='sales')return true;if(ad==='sales')return true;return explicit||target
}

function salesRows(){const a=getApp(),m=new Map();for(const r of (a.recent||[])){if(!r?.work_date)continue;const has=r.daily_sales!==null&&r.daily_sales!==undefined&&r.daily_sales!=='';const closed=!r.status||norm(r.status)===norm('مغلق');if(has&&closed)m.set(String(r.work_date).slice(0,10),r)}const d=a.day;if(d?.work_date&&norm(d.status)===norm('مغلق')&&d.daily_sales!==null&&d.daily_sales!==undefined&&d.daily_sales!=='')m.set(String(d.work_date).slice(0,10),d);return[...m.values()].sort((x,y)=>String(x.work_date).localeCompare(String(y.work_date)))}
function rowsForPeriod(rows,p){return rows.filter(r=>inPeriod(r.work_date,p))}
async function targetPlan(k){if(!k)return null;if(SALES_STATE.targetCache.has(k))return SALES_STATE.targetCache.get(k);let plan=null;try{plan=await callApi('targets-month',{q:{month:monthStart(k)}})}catch{}SALES_STATE.targetCache.set(k,plan);return plan}
function planDaily(plan,date){const x=(plan?.rows||[]).find(r=>String(r.target_date||'').slice(0,10)===String(date).slice(0,10));return x&&x.basic_target!==null&&x.basic_target!==undefined?num(x.basic_target):null}
async function dailyTarget(row){if(row?.daily_target!==null&&row?.daily_target!==undefined&&row?.daily_target!=='')return num(row.daily_target);const p=await targetPlan(monthKey(row?.work_date));return planDaily(p,row?.work_date)}
async function monthlyTarget(k,rows=[]){const p=await targetPlan(k);if(p?.total_basic!==null&&p?.total_basic!==undefined&&Number.isFinite(Number(p.total_basic)))return num(p.total_basic);const snap=rows.find(r=>r.monthly_target_snapshot!==null&&r.monthly_target_snapshot!==undefined&&r.monthly_target_snapshot!=='');if(snap)return num(snap.monthly_target_snapshot);const a=getApp();if(k===monthKey(baseDate())&&a.monthlyTarget!==null&&a.monthlyTarget!==undefined)return num(a.monthlyTarget);return null}
async function rowPerf(row){const target=await dailyTarget(row),sales=num(row.daily_sales),achievement=target>0?sales/target*100:null,variance=target===null?null:sales-target;return{row,sales,target,achievement,variance}}
async function targetToDate(k,cutoff,rows){const p=await targetPlan(k);if(p?.rows?.length)return p.rows.filter(x=>String(x.target_date||'').slice(0,10)>=`${k}-01`&&String(x.target_date||'').slice(0,10)<=cutoff).reduce((s,x)=>s+num(x.basic_target),0);let total=0;for(const r of rows.filter(x=>monthKey(x.work_date)===k&&x.work_date<=cutoff)){const t=await dailyTarget(r);if(t!==null)total+=t}return total}
async function periodStats(p,allRows=salesRows()){const rows=rowsForPeriod(allRows,p),sales=rows.reduce((s,r)=>s+num(r.daily_sales),0),dates=rows.map(r=>String(r.work_date).slice(0,10)),cutoff=dates.length?dates[dates.length-1]:null;let target=null,monthly=null,toDate=null;
  if(p?.type==='month'){monthly=await monthlyTarget(p.month,rows);if(cutoff)toDate=await targetToDate(p.month,cutoff,allRows);target=monthly}else{let t=0,known=0;for(const r of rows){const x=await dailyTarget(r);if(x!==null){t+=x;known++}}target=known?t:null;toDate=target}
  const achievement=target>0?sales/target*100:null,variance=toDate===null?null:sales-toDate,average=rows.length?sales/rows.length:0;let hit=0,miss=0;const perfs=[];for(const r of rows){const pr=await rowPerf(r);perfs.push(pr);if(pr.target!==null){if(pr.sales>=pr.target)hit++;else miss++}}
  return{period:p,rows,sales,target,monthlyTarget:monthly,targetToDate:toDate,achievement,variance,average,hit,miss,cutoff,perfs}
}
function metricLabel(m){return({sales:'المبيعات',target:'المستهدف',achievement:'نسبة التحقيق',gap:'المتبقي/الفجوة',target_to_date:'المستهدف حتى آخر يوم مسجل',variance_to_date:'الفرق عن المستهدف حتى آخر يوم مسجل',average:'متوسط المبيعات اليومي',days_hit:'أيام تحقيق المستهدف',days_missed:'أيام عدم تحقيق المستهدف'})[m]||m}
function noData(p){const current=p?.type==='date'&&p.date===baseDate();return`<b>لا توجد مبيعات فعلية مسجلة لهذه الفترة.</b><div class="mut" style="margin-top:6px">الفترة: ${esc(periodLabel(p))}${current?' | مبيعات اليوم لا تدخل السجل الفعلي إلا بعد إغلاق اليوم.':''}</div>`}
function unsupportedHtml(metric){const key=String(metric).split(':')[1],names={atv:'ATV / متوسط الفاتورة',upt:'UPT / متوسط القطع',transactions:'عدد الفواتير/العمليات',quantity:'الكميات المباعة',visitors:'الزوار/الحركة',conversion:'نسبة التحويل'};return`<b>${esc(names[key]||key)} غير متاح من سجل المبيعات الحالي.</b><div class="notice" style="margin-top:8px">ركيزة لن يخمّن هذا الرقم. الملف الحالي يسجل المبيعات الفعلية والمستهدفات والتحقيق؛ نحتاج مصدر بيانات معتمد لهذا المؤشر قبل تحليله.</div>`}
async function metricHtml(spec){if(String(spec.metric).startsWith('unsupported:'))return unsupportedHtml(spec.metric);const st=await periodStats(spec.period);if(!st.rows.length&&spec.metric!=='target')return noData(spec.period);
  if(spec.metric==='sales')return`<b>المبيعات: ${money(st.sales)} ريال</b><div class="mut" style="margin-top:6px">${esc(periodLabel(spec.period))} | ${st.rows.length} يوم مسجل${st.cutoff?` | حتى ${st.cutoff}`:''}</div>`;
  if(spec.metric==='target'){let t=st.target;if(spec.period?.type==='month')t=st.monthlyTarget;if(t===null)return'<b>لا يوجد مستهدف معتمد متاح لهذه الفترة.</b>';return`<b>المستهدف: ${money(t)} ريال</b><div class="mut" style="margin-top:6px">${esc(periodLabel(spec.period))}</div>`}
  if(spec.metric==='achievement'){if(st.target===null||st.target<=0)return'<b>لا أستطيع حساب نسبة التحقيق لأن المستهدف غير متاح.</b>';return`<b>نسبة التحقيق: ${pct(st.achievement)}</b><div class="mut" style="margin-top:6px">مبيعات ${money(st.sales)} من مستهدف ${money(st.target)} ريال | ${esc(periodLabel(spec.period))}</div>`}
  if(spec.metric==='gap'){if(st.target===null)return'<b>لا أستطيع حساب المتبقي لأن المستهدف غير متاح.</b>';const gap=st.target-st.sales;return gap>0?`<b>المتبقي على المستهدف: ${money(gap)} ريال</b><div class="mut" style="margin-top:6px">المبيعات ${money(st.sales)} من ${money(st.target)}</div>`:`<b>تم تجاوز المستهدف بـ ${money(Math.abs(gap))} ريال</b><div class="mut" style="margin-top:6px">المبيعات ${money(st.sales)} مقابل ${money(st.target)}</div>`}
  if(spec.metric==='target_to_date'){if(st.targetToDate===null)return'<b>المستهدف حتى تاريخه غير متاح.</b>';return`<b>المستهدف حتى آخر يوم مبيعات مسجل: ${money(st.targetToDate)} ريال</b><div class="mut" style="margin-top:6px">آخر يوم مسجل: ${esc(st.cutoff||'—')}</div>`}
  if(spec.metric==='variance_to_date'){if(st.targetToDate===null)return'<b>لا أستطيع حساب الفرق لأن المستهدف حتى تاريخه غير متاح.</b>';const v=st.sales-st.targetToDate;return`<b>${v>=0?'فوق':'تحت'} المستهدف حتى تاريخه بـ ${money(Math.abs(v))} ريال</b><div class="mut" style="margin-top:6px">المبيعات ${money(st.sales)} | المستهدف حتى ${esc(st.cutoff||'—')}: ${money(st.targetToDate)}</div>`}
  if(spec.metric==='average')return`<b>متوسط المبيعات اليومي: ${money(st.average)} ريال</b><div class="mut" style="margin-top:6px">على ${st.rows.length} يوم مبيعات مسجل</div>`;
  if(spec.metric==='days_hit')return`<b>أيام تحقيق المستهدف: ${st.hit}</b><div class="mut" style="margin-top:6px">من ${st.hit+st.miss} يوم يتوفر له مستهدف يومي.</div>`;
  if(spec.metric==='days_missed')return`<b>أيام عدم تحقيق المستهدف: ${st.miss}</b><div class="mut" style="margin-top:6px">من ${st.hit+st.miss} يوم يتوفر له مستهدف يومي.</div>`;
  return noData(spec.period)
}
async function rankHtml(spec){const st=await periodStats(spec.period);if(!st.rows.length)return noData(spec.period);const arr=st.perfs.slice(),by=spec.metric||'sales',dir=spec.rank?.direction||'desc';const value=x=>by==='achievement'?(x.achievement??(dir==='desc'?-Infinity:Infinity)):by==='variance'?(x.variance??(dir==='desc'?-Infinity:Infinity)):x.sales;arr.sort((a,b)=>dir==='desc'?value(b)-value(a):value(a)-value(b));const show=arr.slice(0,Math.min(5,arr.length)),title=dir==='desc'?'الأفضل':'الأقل';let html=`<b>${title} حسب ${esc(by==='achievement'?'نسبة التحقيق':by==='variance'?'الفرق عن المستهدف':'المبيعات')}</b><div class="mut" style="margin-top:6px">${esc(periodLabel(spec.period))}</div><div style="margin-top:9px">`;html+=show.map((x,i)=>`<div class="task"><b>${i+1}. ${esc(x.row.work_date)}</b><div class="mut" style="margin-top:4px">المبيعات: ${money(x.sales)}${x.target!==null?` | المستهدف: ${money(x.target)} | التحقيق: ${pct(x.achievement)} | الفرق: ${x.variance>=0?'+':''}${money(x.variance)}`:''}</div></div>`).join('');return html+'</div>'}
function trend(perfs){if(perfs.length<4)return null;const mid=Math.floor(perfs.length/2),a=perfs.slice(0,mid),b=perfs.slice(mid),av=x=>x.reduce((s,r)=>s+r.sales,0)/x.length,aa=av(a),bb=av(b),change=aa?((bb-aa)/aa*100):null;if(change===null)return null;return{change,label:Math.abs(change)<3?'مستقر تقريبًا':change>0?'صاعد':'هابط'}}
async function analysisHtml(spec){const st=await periodStats(spec.period);if(!st.rows.length)return noData(spec.period);const tr=trend(st.perfs),best=st.perfs.slice().sort((a,b)=>b.sales-a.sales)[0],worst=st.perfs.filter(x=>x.achievement!==null).sort((a,b)=>a.achievement-b.achievement)[0];let h=`<b>تحليل المبيعات — ${esc(periodLabel(spec.period))}</b><div class="metrics" style="margin-top:10px"><div class="metric"><span class="mut">المبيعات</span><strong>${money(st.sales)}</strong></div><div class="metric"><span class="mut">المستهدف</span><strong>${st.target===null?'—':money(st.target)}</strong></div><div class="metric"><span class="mut">التحقيق</span><strong>${st.target? pct(st.achievement):'—'}</strong></div><div class="metric"><span class="mut">متوسط اليوم المسجل</span><strong>${money(st.average)}</strong></div></div>`;
  if(spec.period?.type==='month'&&st.targetToDate!==null){const v=st.sales-st.targetToDate;h+=`<div class="notice ${v>=0?'ok':''}" style="margin-top:9px">حتى آخر يوم مبيعات مسجل (${esc(st.cutoff||'—')}): ${v>=0?'فوق':'تحت'} المستهدف التراكمي بـ <b>${money(Math.abs(v))} ريال</b>.</div>`}
  h+=`<div style="margin-top:9px">أفضل يوم مبيعات: <b>${esc(best.row.work_date)}</b> — ${money(best.sales)} ريال.${worst?`<br>أقل تحقيق يومي: <b>${esc(worst.row.work_date)}</b> — ${pct(worst.achievement)}.`:''}<br>أيام حققت المستهدف: <b>${st.hit}</b> | لم تحقق: <b>${st.miss}</b>.</div>`;
  if(tr)h+=`<div class="mut" style="margin-top:8px">اتجاه الأيام المسجلة: <b>${tr.label}</b> (${tr.change>=0?'+':''}${tr.change.toFixed(1)}% بين متوسط النصف الأول والثاني). هذا وصف للبيانات وليس تفسيرًا لسبب الحركة.</div>`;return h
}
async function compareHtml(spec){const ps=spec.period?.type==='compare'?spec.period.periods:null;if(!ps||ps.length<2)return'<b>أحتاج فترتين واضحتين للمقارنة.</b>';const stats=[];for(const p of ps.slice(0,2))stats.push(await periodStats(p));const [a,b]=stats;const val=(x,k)=>k==='ach'?(x.target?pct(x.achievement):'—'):k==='sales'?money(x.sales):k==='target'?(x.target===null?'—':money(x.target)):k==='avg'?money(x.average):k==='hit'?x.hit:'—';return`<b>مقارنة المبيعات: ${esc(periodLabel(a.period))} مقابل ${esc(periodLabel(b.period))}</b><div class="scroll" style="margin-top:10px"><table><thead><tr><th>المؤشر</th><th>${esc(periodLabel(a.period))}</th><th>${esc(periodLabel(b.period))}</th></tr></thead><tbody><tr><td>المبيعات</td><td>${val(a,'sales')}</td><td>${val(b,'sales')}</td></tr><tr><td>المستهدف</td><td>${val(a,'target')}</td><td>${val(b,'target')}</td></tr><tr><td>التحقيق</td><td>${val(a,'ach')}</td><td>${val(b,'ach')}</td></tr><tr><td>متوسط اليوم المسجل</td><td>${val(a,'avg')}</td><td>${val(b,'avg')}</td></tr><tr><td>أيام تحقيق المستهدف</td><td>${val(a,'hit')}</td><td>${val(b,'hit')}</td></tr><tr><td>أيام مبيعات مسجلة</td><td>${a.rows.length}</td><td>${b.rows.length}</td></tr></tbody></table></div>`}
function exportHtml(){return'<b>فهمت أنك تريد تصدير نتيجة المبيعات.</b><div class="notice" style="margin-top:8px">لم نعتمد قالب Excel للمبيعات داخل ركيزة AI حتى الآن، لذلك لن أنشئ ملفًا بصيغة غير معتمدة. التحليل والقراءة يعملان الآن، أما التصدير فنبنيه لاحقًا كقالب مستقل عند اعتماده.</div>'}
async function answer(text,analysis){const spec=detectSpec(text,analysis);let html;if(spec.task==='export')html=exportHtml();else if(spec.task==='compare')html=await compareHtml(spec);else if(spec.task==='rank')html=await rankHtml(spec);else if(spec.task==='analysis')html=await analysisHtml(spec);else html=await metricHtml(spec);SALES_STATE.last={text,spec};if(window.RakizaAI?.state)window.RakizaAI.state.context={intent:'sales_intelligence',entities:{domain:'sales',sales:SALES_STATE.last},lastMessage:text};return html}

const baseAsk=window.askRakizaAssistant;
window.askRakizaAssistant=async function(){const inp=document.getElementById('assistantInput'),q=inp?.value?.trim();if(!q)return;let analysis={};try{analysis=window.RakizaAI?.analyze?.(q)||{}}catch{}if(!isSalesLanguage(q,analysis)){if(typeof baseAsk==='function')return baseAsk();return}
  if(SALES_STATE.busy)return;SALES_STATE.busy=true;if(inp)inp.value='';chat('user',esc(q));try{chat('assistant',await answer(q,analysis))}catch(e){chat('assistant',`<div class="notice err">تعذر تحليل المبيعات: ${esc(e.message||String(e))}</div>`)}finally{SALES_STATE.busy=false}}

window.RakizaAI=window.RakizaAI||{};
window.RakizaAI.sales={version:RSI_SALES_VERSION,state:SALES_STATE,isSalesLanguage,detectPeriod,detectSpec,salesRows,periodStats,answer};
})();
