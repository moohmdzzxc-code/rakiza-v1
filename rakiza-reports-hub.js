(()=>{'use strict';
const ARCHIVE_API='https://fvkzsmtadppclzexaktz.supabase.co/functions/v1/rakiza-reports-archive';
const oldDaily=window.openHistory,oldWeekly=window.openWeeklyPerformance,oldMonthly=window.openMonthlyPerformance;
let H={tab:'daily',month:'',months:[],daily:null,weekStart:''};

const first=v=>String(v).slice(0,7)+'-01';
const add=(d,n)=>{const [y,m,x]=d.split('-').map(Number),z=new Date(Date.UTC(y,m-1,x+n));return z.toISOString().slice(0,10)};
const monthEnd=d=>{const [y,m]=first(d).split('-').map(Number),z=new Date(Date.UTC(y,m,0));return z.toISOString().slice(0,10)};
const sunday=d=>{const z=new Date(d+'T12:00:00Z');z.setUTCDate(z.getUTCDate()-z.getUTCDay());return z.toISOString().slice(0,10)};
const today=()=>app?.calendarDate||app?.date||new Date().toISOString().slice(0,10);
const mname=d=>new Intl.DateTimeFormat('ar-SA-u-ca-gregory',{month:'long',year:'numeric'}).format(new Date(first(d)+'T12:00:00'));
const dshort=d=>new Intl.DateTimeFormat('ar-SA-u-ca-gregory',{day:'numeric',month:'short'}).format(new Date(d+'T12:00:00'));
const esc=v=>String(v??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));

async function archiveGet(month=''){
 const u=new URL(ARCHIVE_API);u.searchParams.set('k',TOKEN);if(month)u.searchParams.set('month',first(month));
 const r=await fetch(u),t=await r.text();let j;try{j=JSON.parse(t)}catch{throw Error('استجابة غير صالحة من أرشيف التقارير')}if(!r.ok)throw Error(j.error||'تعذر تحميل أرشيف التقارير');return j;
}
async function ensureMonths(force=false){
 if(H.months.length&&!force)return;
 const x=await archiveGet();H.months=x.months||[];
 if(!H.month)H.month=x.current_month||first(today());
 if(!H.months.some(m=>m.month===H.month))H.months.unshift({month:H.month,label:mname(H.month)});
}

function ensureStyle(){
 if(document.getElementById('rkzReportsStyle'))return;
 const s=document.createElement('style');s.id='rkzReportsStyle';s.textContent=`
.rkz-report-tabs{display:flex;gap:8px;margin:14px 0 6px;background:#fff;border:1px solid #e4e9ef;border-radius:14px;padding:7px;overflow-x:auto;-webkit-overflow-scrolling:touch}
.rkz-report-tab{border:0;background:#f3f6fa;color:#17365d;border-radius:10px;padding:10px 18px;font-weight:850;min-width:max-content;cursor:pointer}
.rkz-report-tab.on{background:linear-gradient(135deg,#17365d,#28527d);color:#fff;box-shadow:0 6px 16px #17365d22}
.rkz-month-archive{display:flex;gap:7px;margin:8px 0;background:#fff;border:1px solid #e4e9ef;border-radius:14px;padding:8px;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:thin}
.rkz-month-btn,.rkz-week-btn{border:1px solid #dfe5ec;background:#fafbfd;color:#17365d;border-radius:10px;padding:9px 13px;font-weight:800;min-width:max-content;cursor:pointer}
.rkz-month-btn.on{background:#d4aa54;border-color:#d4aa54;color:#fff}
.rkz-week-archive{display:flex;gap:7px;margin:7px 0 10px;padding:7px 2px;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:thin}
.rkz-week-btn.on{background:#17365d;border-color:#17365d;color:#fff}
.rkz-archive-title{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:8px 2px 2px;color:#17365d}.rkz-archive-title b{font-size:14px}.rkz-archive-title span{font-size:11px;color:#7c8999}
#history.rkz-hub-decorated>.card>.fields{display:none}
#weeklyPerformance.rkz-hub-decorated .wp-controls{display:none}
#monthlyPerformance.rkz-hub-decorated .mpc{display:none}
`;document.head.appendChild(s);
}

function ensureTabs(v,active){
 let tabs=v.querySelector(':scope>.rkz-report-tabs');
 if(!tabs){tabs=document.createElement('div');tabs.className='rkz-report-tabs';tabs.innerHTML='<button class="rkz-report-tab" data-r="daily" onclick="openReports(\'daily\')">اليومي</button><button class="rkz-report-tab" data-r="weekly" onclick="openReports(\'weekly\')">الأسبوعي</button><button class="rkz-report-tab" data-r="monthly" onclick="openReports(\'monthly\')">الشهري</button>';v.querySelector(':scope>.top')?.after(tabs)}
 tabs.querySelectorAll('.rkz-report-tab').forEach(x=>x.classList.toggle('on',x.dataset.r===active));return tabs;
}
function monthBar(v){
 let box=v.querySelector(':scope>.rkz-month-wrap');
 if(!box){box=document.createElement('div');box.className='rkz-month-wrap';const tabs=v.querySelector(':scope>.rkz-report-tabs');tabs?.after(box)}
 box.innerHTML='<div class="rkz-archive-title"><b>أرشيف الشهور</b><span>اختر الشهر لعرض تقاريره</span></div><div class="rkz-month-archive">'+H.months.map(m=>'<button class="rkz-month-btn '+(m.month===H.month?'on':'')+'" onclick="selectReportMonth(\''+m.month+'\')">'+esc(m.label)+'</button>').join('')+'</div>';
 return box;
}
function weeksOfMonth(month){
 const ms=first(month),me=monthEnd(month),out=[];let cur=ms,i=1;
 while(cur<=me){const ws=sunday(cur),we=add(ws,6),pe=we<me?we:me;out.push({n:i++,week_start:ws,period_start:cur,period_end:pe});cur=add(pe,1)}
 return out;
}
function defaultWeek(month){
 const t=today(),weeks=weeksOfMonth(month);
 if(t.slice(0,7)===first(month).slice(0,7))return sunday(t);
 return weeks[0]?.week_start||sunday(first(month));
}
function weekBar(v){
 let box=v.querySelector(':scope>.rkz-week-wrap');
 if(!box){box=document.createElement('div');box.className='rkz-week-wrap';v.querySelector(':scope>.rkz-month-wrap')?.after(box)}
 const weeks=weeksOfMonth(H.month);
 box.innerHTML='<div class="rkz-archive-title"><b>أسابيع '+esc(mname(H.month))+'</b><span>كل أسبوع معروض ضمن الشهر الذي تخصه أيامه</span></div><div class="rkz-week-archive">'+weeks.map(w=>'<button class="rkz-week-btn '+(w.week_start===H.weekStart?'on':'')+'" onclick="selectReportWeek(\''+w.week_start+'\')">الأسبوع '+w.n+' • '+esc(dshort(w.period_start))+'–'+esc(dshort(w.period_end))+'</button>').join('')+'</div>';
}
function decorate(id,active){
 ensureStyle();const v=document.getElementById(id);if(!v)return;v.classList.add('rkz-hub-decorated');
 const top=v.querySelector(':scope>.top');if(top){const b=top.querySelector('.brand'),sub=top.querySelector('.sub');if(b)b.textContent='التقارير';if(sub)sub.textContent='اليومي • الأسبوعي • الشهري'}
 ensureTabs(v,active);monthBar(v);
 if(active==='weekly')weekBar(v);else v.querySelector(':scope>.rkz-week-wrap')?.remove();
}
function fmtPct(v){return v===null||v===undefined?'—':Number(v).toFixed(1)+'%'}
function renderDaily(){
 const rows=H.daily?.days||[],body=document.getElementById('historyRows');if(!body)return;
 body.innerHTML=rows.length?rows.map(d=>'<tr><td>'+esc(d.work_date)+'</td><td>'+fmtPct(d.operational_readiness)+'</td><td>'+fmtPct(d.attendance_adequacy)+'</td><td>'+fmtPct(d.present_readiness)+'</td><td>'+fmtPct(d.daily_achievement)+'</td><td>'+esc(d.status||'—')+'</td><td><button class="mini" onclick="dayDetails(\''+d.id+'\')">عرض اليوم</button></td></tr>').join(''):'<tr><td colspan="7" style="text-align:center;color:#7b8798">لا توجد أيام تشغيل مسجلة في هذا الشهر.</td></tr>';
}
async function loadDailyMonth(){
 const body=document.getElementById('historyRows');if(body)body.innerHTML='<tr><td colspan="7" style="text-align:center">جاري تحميل أرشيف الشهر...</td></tr>';
 H.daily=await archiveGet(H.month);renderDaily();
}
window.selectReportMonth=async function(month){
 H.month=first(month);
 if(H.tab==='daily'){decorate('history','daily');await loadDailyMonth();decorate('history','daily');return}
 if(H.tab==='weekly'){H.weekStart=defaultWeek(H.month);decorate('weeklyPerformance','weekly');await window.changeWeeklyPerformanceWeek?.(H.weekStart);decorate('weeklyPerformance','weekly');return}
 if(H.tab==='monthly'){decorate('monthlyPerformance','monthly');await window.changeMonthlyPerformance?.(H.month);decorate('monthlyPerformance','monthly')}
};
window.selectReportWeek=async function(ws){H.weekStart=ws;decorate('weeklyPerformance','weekly');await window.changeWeeklyPerformanceWeek?.(ws);decorate('weeklyPerformance','weekly')};

window.openReports=async function(tab='daily'){
 H.tab=tab;await ensureMonths(true);
 if(tab==='weekly'){
   H.weekStart=H.weekStart&&weeksOfMonth(H.month).some(w=>w.week_start===H.weekStart)?H.weekStart:defaultWeek(H.month);
   const p=oldWeekly?.();decorate('weeklyPerformance','weekly');await p;await window.changeWeeklyPerformanceWeek?.(H.weekStart);decorate('weeklyPerformance','weekly');return;
 }
 if(tab==='monthly'){
   const p=oldMonthly?.();decorate('monthlyPerformance','monthly');await p;await window.changeMonthlyPerformance?.(H.month);decorate('monthlyPerformance','monthly');return;
 }
 oldDaily?.();decorate('history','daily');await loadDailyMonth();decorate('history','daily');
};
window.openHistory=()=>window.openReports('daily');
window.openWeeklyPerformance=()=>window.openReports('weekly');
window.openMonthlyPerformance=()=>window.openReports('monthly');
window.RakizaReportsHub={VERSION:'20260925-month-archive-v1'};
})();