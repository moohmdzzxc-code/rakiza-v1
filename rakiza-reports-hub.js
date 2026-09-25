(()=>{'use strict';
const oldDaily=window.openHistory,oldWeekly=window.openWeeklyPerformance,oldMonthly=window.openMonthlyPerformance;
function ensureStyle(){if(document.getElementById('rkzReportsStyle'))return;const s=document.createElement('style');s.id='rkzReportsStyle';s.textContent=`
.rkz-report-tabs{display:flex;gap:8px;margin:14px 0 6px;background:#fff;border:1px solid #e4e9ef;border-radius:14px;padding:7px;overflow-x:auto;-webkit-overflow-scrolling:touch}
.rkz-report-tab{border:0;background:#f3f6fa;color:#17365d;border-radius:10px;padding:10px 18px;font-weight:850;min-width:max-content;cursor:pointer}
.rkz-report-tab.on{background:linear-gradient(135deg,#17365d,#28527d);color:#fff;box-shadow:0 6px 16px #17365d22}
`;document.head.appendChild(s)}
function decorate(id,active){
  ensureStyle();const v=document.getElementById(id);if(!v)return;
  const top=v.querySelector(':scope>.top');if(top){const b=top.querySelector('.brand'),sub=top.querySelector('.sub');if(b)b.textContent='التقارير';if(sub)sub.textContent='اليومي • الأسبوعي • الشهري'}
  let tabs=v.querySelector(':scope>.rkz-report-tabs');if(!tabs){tabs=document.createElement('div');tabs.className='rkz-report-tabs';tabs.innerHTML='<button class="rkz-report-tab" data-r="daily" onclick="openReports(\'daily\')">اليومي</button><button class="rkz-report-tab" data-r="weekly" onclick="openReports(\'weekly\')">الأسبوعي</button><button class="rkz-report-tab" data-r="monthly" onclick="openReports(\'monthly\')">الشهري</button>';top?.after(tabs)}
  tabs.querySelectorAll('.rkz-report-tab').forEach(x=>x.classList.toggle('on',x.dataset.r===active));
}
window.openReports=async function(tab='daily'){
  if(tab==='weekly'){const p=oldWeekly?.();decorate('weeklyPerformance','weekly');await p;decorate('weeklyPerformance','weekly');return}
  if(tab==='monthly'){const p=oldMonthly?.();decorate('monthlyPerformance','monthly');await p;decorate('monthlyPerformance','monthly');return}
  oldDaily?.();decorate('history','daily');
};
window.openHistory=()=>window.openReports('daily');
window.openWeeklyPerformance=()=>window.openReports('weekly');
window.openMonthlyPerformance=()=>window.openReports('monthly');
window.RakizaReportsHub={VERSION:'20260925-reports-hub-v1'};
})();