(()=>{
'use strict';

const VERSION='20260925-weekly-performance-v1';
const WEEKLY_API='https://fvkzsmtadppclzexaktz.supabase.co/functions/v1/rakiza-weekly-performance';
let weeklyState={weekStart:'',data:null,error:'',loading:false};

// V1 source is manual entry. Keep the contract source-agnostic so a future
// Power BI / ERP / POS / API connector can replace manual entry without
// changing the report calculations or presentation.

function w$(id){return document.getElementById(id)}
function wEsc(v){return String(v??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}
function wNum(v){const n=Number(v);return Number.isFinite(n)?n:null}
function wMoney(v){const n=wNum(v);return n===null?'—':n.toLocaleString('en-US',{maximumFractionDigits:0})+' ريال'}
function wValue(v,d=0){const n=wNum(v);return n===null?'—':n.toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d})}
function wPct(v){const n=wNum(v);return n===null?'—':n.toLocaleString('en-US',{minimumFractionDigits:1,maximumFractionDigits:1})+'%'}
function wAdd(d,n){const [y,m,x]=String(d).split('-').map(Number),z=new Date(Date.UTC(y,m-1,x+n));return z.toISOString().slice(0,10)}
function wSunday(d){if(typeof weekSunday==='function')return weekSunday(d);const x=new Date(String(d)+'T12:00:00'),n=x.getDay();x.setDate(x.getDate()-n);return x.toISOString().slice(0,10)}
function wToday(){return app?.calendarDate||app?.date||new Date().toISOString().slice(0,10)}
function wCore(){return window.RakizaWeeklyPerformanceCore||null}
function wWeekLabel(start,end){try{const f=new Intl.DateTimeFormat('ar-SA-u-ca-gregory',{day:'numeric',month:'short'});return `${f.format(new Date(start+'T12:00:00'))} — ${f.format(new Date(end+'T12:00:00'))}`}catch{return `${start} — ${end}`}}

function ensureWeeklyStyle(){
  if(w$('rkzWeeklyStyle'))return;
  const s=document.createElement('style');s.id='rkzWeeklyStyle';s.textContent=`
    #weeklyPerformance{--wp-n:#17365d;--wp-g:#c8a45d;--wp-ok:#218653;--wp-bad:#c83b3b;--wp-line:#e5eaf0}
    .wp-wrap{max-width:1320px;margin:0 auto}.wp-toolbar{display:flex;align-items:end;justify-content:space-between;gap:12px;margin-top:14px;flex-wrap:wrap}.wp-week-controls{display:flex;gap:8px;align-items:end;flex-wrap:wrap}.wp-week-controls .field{min-width:210px}.wp-strip{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:14px 0}.wp-kpi{background:#fff;border:1px solid var(--wp-line);border-radius:16px;padding:15px;box-shadow:0 4px 16px rgba(23,54,93,.04)}.wp-kpi span{display:block;color:#748195;font-size:12px}.wp-kpi strong{display:block;color:#17365d;font-size:25px;margin-top:7px}.wp-kpi.good{background:#f1faf5;border-color:#cfe9d8}.wp-kpi.good strong{color:var(--wp-ok)}.wp-kpi.bad{background:#fff4f3;border-color:#f1d1ce}.wp-kpi.bad strong{color:var(--wp-bad)}
    .wp-card{background:#fff;border:1px solid var(--wp-line);border-radius:18px;padding:17px;margin-top:12px;box-shadow:0 4px 16px rgba(23,54,93,.04)}.wp-card h2{margin:0;color:#17365d;font-size:20px}.wp-card-head{display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:13px;flex-wrap:wrap}.wp-note{color:#7a8799;font-size:12px}.wp-store-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.wp-input{width:100%;padding:10px;border:1px solid #d5dbe2;border-radius:10px;background:#fff}.wp-input:disabled{background:#f1f3f6;color:#5f6c7c}.wp-label{font-size:12px;color:#68778b;display:block;margin-bottom:5px}.wp-metric{border:1px solid var(--wp-line);border-radius:13px;padding:12px;background:#fafbfd}.wp-metric span{font-size:12px;color:#768397}.wp-metric strong{display:block;font-size:21px;color:#17365d;margin-top:5px}.wp-table{min-width:920px}.wp-table input{min-width:92px;width:100%;padding:8px;border:1px solid #d5dbe2;border-radius:8px}.wp-table input:disabled{background:#f2f4f7;color:#59677a}.wp-table td.metric-cell{font-weight:800;color:#17365d}.wp-achievements{display:grid;grid-template-columns:240px 1fr;gap:14px}.wp-readiness{display:grid;place-items:center;text-align:center;border:1px solid #dfe8f1;border-radius:16px;background:#f7fafc;min-height:155px}.wp-readiness strong{font-size:38px;color:#17365d}.wp-ach-list{display:grid;gap:8px}.wp-ach-item{padding:10px 12px;border:1px solid #e5eaf0;border-radius:12px;background:#fff}.wp-task-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:9px;margin-bottom:12px}.wp-star{background:linear-gradient(135deg,#fff8e8,#fff);border:1px solid #efdcae;border-radius:16px;padding:16px;display:flex;justify-content:space-between;align-items:center;gap:15px;flex-wrap:wrap}.wp-star b{font-size:21px;color:#7b5712}.wp-star strong{font-size:26px;color:#17365d}.wp-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:14px;flex-wrap:wrap}.wp-lock{padding:10px 12px;border-radius:12px;background:#eef7f1;color:#237047;font-size:13px}.wp-warning{padding:11px 13px;border-radius:12px;background:#fff4d6;color:#725700;margin:10px 0}.wp-error{padding:11px 13px;border-radius:12px;background:#fee6e6;color:#8a1c1c;margin:10px 0}
    @media(max-width:900px){.wp-strip,.wp-store-grid,.wp-task-summary{grid-template-columns:repeat(2,1fr)}.wp-achievements{grid-template-columns:1fr}}@media(max-width:560px){.wp-strip,.wp-store-grid,.wp-task-summary{grid-template-columns:1fr}.wp-week-controls{width:100%}.wp-week-controls .field{flex:1;min-width:160px}}
  `;document.head.appendChild(s);
}

function ensureWeeklyView(){
  ensureWeeklyStyle();
  let sec=w$('weeklyPerformance');if(sec)return sec;
  sec=document.createElement('section');sec.id='weeklyPerformance';sec.className='view';sec.innerHTML=`
    <div class="top"><div><div class="brand">الأداء الأسبوعي</div><div class="sub">نتيجة الأسبوع • أداء الفريق • التشغيل والمهام</div></div><button class="btn ghost" onclick="home()">الرئيسية</button></div>
    <div class="wp-wrap"><div id="weeklyBody"></div></div>`;
  document.querySelector('main.app')?.appendChild(sec);return sec;
}

async function weeklyRequest(method,weekStart,body){
  const u=new URL(WEEKLY_API);u.searchParams.set('k',TOKEN);u.searchParams.set('week_start',weekStart);
  const r=await fetch(u,{method,headers:{'content-type':'application/json'},body:body?JSON.stringify(body):undefined});
  const t=await r.text();let j;try{j=JSON.parse(t)}catch{throw Error('استجابة غير صالحة من خدمة الأداء الأسبوعي')}
  if(!r.ok)throw Error(j.error||'تعذر تحميل الأداء الأسبوعي');return j;
}

function gapTone(data){const g=wNum(data?.summary?.gap);if(g===null)return'';return g>=0?'good':'bad'}
function summaryStrip(data){
  const s=data.summary||{},tone=gapTone(data),gap=wNum(s.gap);
  return `<div class="wp-strip">
    <div class="wp-kpi"><span>مستهدف الأسبوع</span><strong>${wMoney(s.weekly_target)}</strong><small class="wp-note">${s.target_days||0}/7 أيام مستهدف</small></div>
    <div class="wp-kpi"><span>مبيعات الأسبوع</span><strong>${wMoney(s.weekly_sales)}</strong><small class="wp-note">${s.sales_days||0}/7 أيام مبيعات مسجلة</small></div>
    <div class="wp-kpi ${wNum(s.achievement)!==null&&(s.achievement>=100?'good':'bad')}"><span>نسبة التحقيق</span><strong>${wPct(s.achievement)}</strong><small class="wp-note">${s.sales_complete?'نتيجة أسبوع مكتملة':'تظهر نهائيًا بعد اكتمال الأسبوع'}</small></div>
    <div class="wp-kpi ${tone}"><span>الفجوة</span><strong>${gap===null?'—':(gap>0?'+':'')+wMoney(gap)}</strong><small class="wp-note">${gap===null?'بانتظار اكتمال بيانات الأسبوع':gap>=0?'فائض عن المستهدف':'عجز عن المستهدف'}</small></div>
  </div>`;
}

function storeSection(data){
  const locked=!!data.input,s=data.summary||{},m=data.store_metrics||{},transactions=locked?data.input.transactions:'',units=locked?data.input.units:'';
  return `<div class="wp-card"><div class="wp-card-head"><div><h2>مؤشرات أداء المعرض</h2><div class="wp-note">يدخل مدير المعرض عدد العمليات والقطع مرة واحدة للأسبوع، وركيزة يحسب ATV وUPT.</div></div>${locked?'<div class="wp-lock">✓ بيانات الأسبوع معتمدة</div>':''}</div>
    <div class="wp-store-grid">
      <div><label class="wp-label">عدد العمليات خلال الفترة</label><input id="wpTransactions" class="wp-input" type="number" min="0" step="1" value="${transactions}" ${locked?'disabled':''}></div>
      <div><label class="wp-label">عدد القطع خلال الفترة</label><input id="wpUnits" class="wp-input" type="number" min="0" step="1" value="${units}" ${locked?'disabled':''}></div>
      <div class="wp-metric"><span>ATV</span><strong id="wpStoreAtv">${wMoney(m.atv)}</strong></div>
      <div class="wp-metric"><span>UPT</span><strong id="wpStoreUpt">${wValue(m.upt,2)}</strong></div>
    </div>${!s.sales_complete?'<div class="wp-warning">بيانات مبيعات الأسبوع غير مكتملة. يمكن مراجعة التقرير الآن، لكن اعتماد إدخال الأداء الأسبوعي ينتظر اكتمال مبيعات الفترة.</div>':''}
  </div>`;
}

function employeeSection(data){
  const locked=!!data.input;
  const rows=(data.employees||[]).map(e=>{const p=e.performance||{},m=e.metrics||{};return `<tr data-employee="${e.id}" data-name="${wEsc(e.full_name)}"><td><b>${wEsc(e.full_name)}</b><div class="wp-note">${wEsc(e.position||'')}</div></td>
      <td><input class="wpEmpSales" type="number" min="0" step="0.01" value="${p.sales??''}" ${locked?'disabled':''}></td>
      <td><input class="wpEmpInvoices" type="number" min="0" step="1" value="${p.invoices??''}" ${locked?'disabled':''}></td>
      <td><input class="wpEmpUnits" type="number" min="0" step="1" value="${p.units??''}" ${locked?'disabled':''}></td>
      <td class="metric-cell wpEmpAtv">${wMoney(m.atv)}</td><td class="metric-cell wpEmpUpt">${wValue(m.upt,2)}</td><td class="metric-cell wpEmpContribution">${wPct(m.contribution)}</td></tr>`}).join('');
  return `<div class="wp-card"><div class="wp-card-head"><div><h2>أداء الفريق</h2><div class="wp-note">الأرقام تظهر لمدير المعرض لمناقشة الأداء مع الفريق، ولا تنشئ تصنيفًا تلقائيًا للموظفين.</div></div></div>
    <div class="scroll"><table class="wp-table"><thead><tr><th>الموظف</th><th>المبيعات</th><th>الفواتير</th><th>القطع</th><th>ATV</th><th>UPT</th><th>المساهمة من مبيعات المعرض</th></tr></thead><tbody id="wpEmployeeRows">${rows}</tbody></table></div>
  </div>`;
}

function achievementsSection(data){
  const s=data.summary||{},a=data.store_achievements||{},items=[];
  if(Number(a.completed_tasks||0)>0)items.push(`<div class="wp-ach-item"><b>مهام تشغيلية منجزة</b><div class="wp-note">${a.completed_tasks} مهمة أُنجزت خلال الأسبوع.</div></div>`);
  (a.closed_actions||[]).forEach(x=>items.push(`<div class="wp-ach-item"><b>${wEsc(x.action_type||'إجراء')} — ${wEsc(x.subject||'')}</b><div class="wp-note">أُغلق خلال الأسبوع${x.resolution_result?' • '+wEsc(x.resolution_result):''}</div></div>`));
  (a.supplied_shortages||[]).forEach(x=>items.push(`<div class="wp-ach-item"><b>تمت معالجة نقص</b><div class="wp-note">${wEsc(x.size||'')} • تاريخ التغذية ${wEsc(x.supplied_date||'')}</div></div>`));
  return `<div class="wp-card"><div class="wp-card-head"><div><h2>أداء المعرض</h2><div class="wp-note">ملخص ما تم إنجازه ومتوسط جاهزية المعرض من بيانات ركيزة التشغيلية.</div></div></div>
    <div class="wp-achievements"><div class="wp-readiness"><div><span class="wp-note">متوسط جاهزية المعرض</span><strong>${wPct(s.readiness)}</strong><div class="wp-note">محسوب من ${s.readiness_days||0} يوم مسجل</div></div></div><div class="wp-ach-list">${items.join('')||'<div class="wp-ach-item"><div class="wp-note">لا توجد إنجازات تشغيلية مغلقة مسجلة لهذه الفترة.</div></div>'}</div></div>
  </div>`;
}

function taskSection(data){
  const t=data.team_tasks||{},rows=(data.employees||[]).map(e=>`<tr><td><b>${wEsc(e.full_name)}</b></td><td>${e.tasks?.assigned??0}</td><td>${e.tasks?.completed??0}</td><td>${e.tasks?.pending??0}</td><td>${wPct(e.tasks?.completion)}</td></tr>`).join('');
  return `<div class="wp-card"><div class="wp-card-head"><div><h2>مهام الفريق</h2><div class="wp-note">المهام المسندة والمنجزة وغير المنجزة ونسبة الإنجاز لكل موظف.</div></div></div>
    <div class="wp-task-summary"><div class="wp-metric"><span>المهام المسندة</span><strong>${t.assigned??0}</strong></div><div class="wp-metric"><span>المنجزة</span><strong>${t.completed??0}</strong></div><div class="wp-metric"><span>غير المنجزة</span><strong>${t.pending??0}</strong></div><div class="wp-metric"><span>نسبة الإنجاز</span><strong>${t.assigned?wPct((t.completed/t.assigned)*100):'—'}</strong></div></div>
    <div class="scroll"><table><thead><tr><th>الموظف</th><th>المسندة</th><th>المنجزة</th><th>غير المنجزة</th><th>نسبة الإنجاز</th></tr></thead><tbody>${rows}</tbody></table></div>
  </div>`;
}

function starSection(data){
  const s=data.star;if(!s)return `<div class="wp-card"><div class="wp-star"><div><b>⭐ نجم الأسبوع</b><div class="wp-note">يُحدد حصريًا بناءً على أعلى مبيعات موظف في الأسبوع.</div></div><strong id="wpStarPreview">بانتظار بيانات مبيعات الفريق</strong></div></div>`;
  const names=(s.names||[]).map(wEsc).join('، '),label=s.tie?'تعادل أعلى مبيعات':'نجم الأسبوع';
  return `<div class="wp-card"><div class="wp-star"><div><b>⭐ ${label}</b><div class="wp-note">الاختيار مبني على المبيعات فقط.</div></div><div><strong id="wpStarPreview">${names}</strong><div class="wp-note">${wMoney(s.sales)}</div></div></div></div>`;
}

function actionSection(data){
  if(data.input)return '';const blocked=!data.summary?.sales_complete;
  return `<div class="wp-card"><div class="wp-actions"><button class="btn gold" id="wpReviewBtn" onclick="reviewWeeklyPerformance()" ${blocked?'disabled':''}>مراجعة واعتماد بيانات الأسبوع</button></div>${blocked?'<div class="wp-note" style="text-align:left;margin-top:7px">يتاح الاعتماد بعد اكتمال مبيعات أيام الأسبوع.</div>':''}</div>`;
}

function renderWeekly(){
  const body=w$('weeklyBody');if(!body)return;
  if(weeklyState.loading){body.innerHTML='<div class="wp-card">جاري تحميل التقرير الأسبوعي...</div>';return}
  if(weeklyState.error){body.innerHTML=`<div class="wp-error">${wEsc(weeklyState.error)}</div>`;return}
  const d=weeklyState.data;if(!d){body.innerHTML='<div class="wp-card">لا توجد بيانات.</div>';return}
  body.innerHTML=`<div class="wp-toolbar"><div><b style="font-size:20px;color:#17365d">الأسبوع ${wWeekLabel(d.week_start,d.week_end)}</b><div class="wp-note">الأحد ${d.week_start} إلى السبت ${d.week_end}</div></div><div class="wp-week-controls"><button class="btn ghost" onclick="moveWeeklyPerformance(-7)">الأسبوع السابق</button><div class="field"><label>بداية الأسبوع</label><input id="wpWeekStart" type="date" value="${d.week_start}" onchange="changeWeeklyPerformanceWeek(this.value)"></div><button class="btn ghost" onclick="moveWeeklyPerformance(7)">الأسبوع التالي</button></div></div>${summaryStrip(d)}${storeSection(d)}${employeeSection(d)}${achievementsSection(d)}${taskSection(d)}${starSection(d)}${actionSection(d)}`;
  if(!d.input)bindDraftCalculations();
}

function draftRows(){return [...document.querySelectorAll('#wpEmployeeRows tr')].map(r=>({employee_id:r.dataset.employee,name:r.dataset.name,sales:r.querySelector('.wpEmpSales')?.value??'',invoices:r.querySelector('.wpEmpInvoices')?.value??'',units:r.querySelector('.wpEmpUnits')?.value??''}))}
function strictNumber(value,label,integer=false){if(value===''||value===null||value===undefined)throw Error(`أدخل ${label}`);const n=Number(value);if(!Number.isFinite(n)||n<0||(integer&&!Number.isInteger(n)))throw Error(`راجع ${label}`);return n}
function collectDraft(){
  const transactions=strictNumber(w$('wpTransactions')?.value,'عدد العمليات',true),units=strictNumber(w$('wpUnits')?.value,'عدد القطع',true);if(transactions===0&&units>0)throw Error('لا يمكن تسجيل قطع مع صفر عمليات');
  const employees=draftRows().map(x=>{const sales=strictNumber(x.sales,`مبيعات ${x.name}`),invoices=strictNumber(x.invoices,`فواتير ${x.name}`,true),eu=strictNumber(x.units,`قطع ${x.name}`,true);if(invoices===0&&(sales>0||eu>0))throw Error(`راجع بيانات ${x.name}: لا يمكن تسجيل مبيعات أو قطع مع صفر فواتير`);return{employee_id:x.employee_id,name:x.name,sales,invoices,units:eu}});
  return {week_start:weeklyState.weekStart,transactions,units,employees};
}
function bindDraftCalculations(){
  const update=()=>{
    const core=wCore(),sales=weeklyState.data?.summary?.weekly_sales,transactions=wNum(w$('wpTransactions')?.value),units=wNum(w$('wpUnits')?.value),complete=!!weeklyState.data?.summary?.sales_complete;
    const sm=core?.storeMetrics?core.storeMetrics(complete?sales:null,transactions,units):{atv:complete&&transactions>0?sales/transactions:null,upt:transactions>0?units/transactions:null};
    if(w$('wpStoreAtv'))w$('wpStoreAtv').textContent=wMoney(sm.atv);if(w$('wpStoreUpt'))w$('wpStoreUpt').textContent=wValue(sm.upt,2);
    const storeSales=complete?wNum(sales):null,starRows=[];
    document.querySelectorAll('#wpEmployeeRows tr').forEach(r=>{const es=wNum(r.querySelector('.wpEmpSales')?.value),inv=wNum(r.querySelector('.wpEmpInvoices')?.value),eu=wNum(r.querySelector('.wpEmpUnits')?.value),m=core?.employeeMetrics?core.employeeMetrics(es,inv,eu,storeSales):{atv:inv>0&&es!==null?es/inv:null,upt:inv>0&&eu!==null?eu/inv:null,contribution:storeSales>0&&es!==null?es/storeSales*100:null};r.querySelector('.wpEmpAtv').textContent=wMoney(m.atv);r.querySelector('.wpEmpUpt').textContent=wValue(m.upt,2);r.querySelector('.wpEmpContribution').textContent=wPct(m.contribution);if(es!==null)starRows.push({id:r.dataset.employee,name:r.dataset.name,sales:es})});
    const star=core?.star?core.star(starRows):null,target=w$('wpStarPreview');if(target)target.textContent=star?(star.tie?'تعادل: ':'')+star.employees.map(x=>x.name).join('، '):'بانتظار بيانات مبيعات الفريق';
  };
  document.querySelectorAll('#weeklyPerformance input').forEach(i=>{if(i.id!=='wpWeekStart')i.addEventListener('input',update)});update();
}

window.reviewWeeklyPerformance=function(){
  try{
    const d=collectDraft(),core=wCore(),sales=weeklyState.data.summary.weekly_sales,sm=core?.storeMetrics?core.storeMetrics(sales,d.transactions,d.units):{atv:d.transactions?sales/d.transactions:null,upt:d.transactions?d.units/d.transactions:null},star=core?.star?core.star(d.employees.map(x=>({id:x.employee_id,name:x.name,sales:x.sales}))):null;
    const rows=d.employees.map(x=>`<tr><td>${wEsc(x.name)}</td><td>${wMoney(x.sales)}</td><td>${x.invoices}</td><td>${x.units}</td></tr>`).join('');
    w$('modalBody').innerHTML=`<h2>مراجعة بيانات الأداء الأسبوعي</h2><div class="notice">لن يتم الحفظ قبل الضغط على «اعتماد بيانات الأسبوع».</div><p><b>الفترة:</b> ${weeklyState.data.week_start} — ${weeklyState.data.week_end}</p><p><b>العمليات:</b> ${d.transactions} &nbsp; | &nbsp; <b>القطع:</b> ${d.units} &nbsp; | &nbsp; <b>ATV:</b> ${wMoney(sm.atv)} &nbsp; | &nbsp; <b>UPT:</b> ${wValue(sm.upt,2)}</p><div class="scroll"><table><thead><tr><th>الموظف</th><th>المبيعات</th><th>الفواتير</th><th>القطع</th></tr></thead><tbody>${rows}</tbody></table></div>${star?`<div class="notice ok"><b>نجم الأسبوع حسب المبيعات:</b> ${star.employees.map(x=>wEsc(x.name)).join('، ')} — ${wMoney(star.sales)}</div>`:''}<div class="actions"><button class="btn gold" onclick="approveWeeklyPerformance()">اعتماد بيانات الأسبوع</button><button class="btn ghost" onclick="document.getElementById('overlay').classList.remove('show')">رجوع للتعديل</button></div>`;
    w$('overlay').classList.add('show');
  }catch(e){alert(e.message)}
};

window.approveWeeklyPerformance=async function(){
  const btn=document.querySelector('#modalBody .btn.gold');
  try{const d=collectDraft();if(btn){btn.disabled=true;btn.textContent='جاري الاعتماد...'}const saved=await weeklyRequest('POST',d.week_start,{week_start:d.week_start,transactions:d.transactions,units:d.units,employees:d.employees.map(({employee_id,sales,invoices,units})=>({employee_id,sales,invoices,units}))});weeklyState.data=saved;w$('overlay').classList.remove('show');renderWeekly();alert('تم اعتماد بيانات الأداء الأسبوعي وحفظ التقرير.')}catch(e){alert(e.message)}finally{if(btn){btn.disabled=false;btn.textContent='اعتماد بيانات الأسبوع'}}
};

window.changeWeeklyPerformanceWeek=async function(value){const ws=wSunday(value||wToday());weeklyState.weekStart=ws;await loadWeeklyPerformance(ws)};
window.moveWeeklyPerformance=async function(days){const ws=wAdd(weeklyState.weekStart||wSunday(wToday()),days);weeklyState.weekStart=ws;await loadWeeklyPerformance(ws)};
async function loadWeeklyPerformance(ws){weeklyState.loading=true;weeklyState.error='';renderWeekly();try{weeklyState.data=await weeklyRequest('GET',ws)}catch(e){weeklyState.data=null;weeklyState.error=e.message}finally{weeklyState.loading=false;renderWeekly()}}
window.openWeeklyPerformance=async function(){ensureWeeklyView();show('weeklyPerformance');const ws=weeklyState.weekStart||wSunday(wToday());weeklyState.weekStart=ws;await loadWeeklyPerformance(ws)};

ensureWeeklyView();
window.RakizaWeeklyPerformance={VERSION,open:window.openWeeklyPerformance,load:loadWeeklyPerformance};
})();