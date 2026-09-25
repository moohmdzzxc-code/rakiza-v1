(()=>{'use strict';
const API='https://fvkzsmtadppclzexaktz.supabase.co/functions/v1/rakiza-followup-center';
let S={data:null,filter:'all',search:'',page:1,size:10,loading:false,error:''};
const $=id=>document.getElementById(id);
const esc=v=>String(v??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]));
const icons={
 box:'<path d="m12 3 9 5-9 5-9-5 9-5z"/><path d="m3 8 9 5 9-5"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/>',
 wrench:'<path d="M14.7 6.3a4 4 0 0 0-5-5L12 3.6 9.6 6 7.3 3.7a4 4 0 0 0 5 5L4 17l3 3 8.3-8.3a4 4 0 0 0 5-5L18 9l-2.4-2.4z"/>',
 clip:'<path d="M9 5h6M9 3h6v4H9zM7 5H5v16h14V5h-2M8 11h8M8 15h8"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
 folder:'<path d="M3 7h7l2 2h9v10H3z"/>',
 search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
 bell:'<path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
 list:'<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>'
};
const svg=n=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'+(icons[n]||icons.list)+'</svg>';
function ensureStyle(){
 if($('rkzFollowCenterStyle'))return;
 const s=document.createElement('style');s.id='rkzFollowCenterStyle';s.textContent=`
#followupCenter{--fc-n:#102f50;--fc-n2:#1e4d77;--fc-g:#d4aa54;--fc-line:#e1e8f0;--fc-bg:#f4f7fb}
.fc-wrap{max-width:1320px;margin:auto}.fc-hero{background:linear-gradient(135deg,#102f50,#214d76);color:#fff;border-radius:18px;padding:20px 24px;display:flex;justify-content:space-between;align-items:center;gap:16px;box-shadow:0 12px 28px #17365d1f;margin-top:14px}.fc-hero h1{margin:0 0 5px;font-size:25px}.fc-hero p{margin:0;color:#dce8f4}.fc-target{width:48px;height:48px;border-radius:50%;display:grid;place-items:center;border:3px solid #e0b34f;color:#efc75e;font-size:25px}.fc-summary{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin:12px 0}.fc-stat{border:1px solid var(--fc-line);border-radius:15px;background:#fff;padding:14px;display:flex;gap:11px;align-items:center;cursor:pointer;box-shadow:0 5px 14px #17365d08;transition:.15s}.fc-stat:hover{transform:translateY(-1px)}.fc-stat.on{box-shadow:0 0 0 2px #d4aa5440}.fc-stat-icon{width:44px;height:44px;border-radius:11px;display:grid;place-items:center;flex:0 0 auto}.fc-stat-icon svg{width:24px;height:24px}.fc-stat b{display:block;color:var(--fc-n);font-size:14px}.fc-stat strong{display:block;color:var(--fc-n);font-size:24px;line-height:1.1;margin-top:3px}.fc-stat small{display:block;color:#7b8797;margin-top:4px}.fc-stat.total .fc-stat-icon{background:#eef3f8;color:#17365d}.fc-stat.late{background:#fff5f4;border-color:#f1d5d1}.fc-stat.late .fc-stat-icon{background:#ffe3e0;color:#d22e2e}.fc-stat.late strong{color:#c72828}.fc-stat.short .fc-stat-icon{background:#fff3d9;color:#d78d00}.fc-stat.maint .fc-stat-icon{background:#e9f3ff;color:#1760b8}.fc-stat.action .fc-stat-icon{background:#e9f8ef;color:#148444}
.fc-panel{background:#fff;border:1px solid var(--fc-line);border-radius:16px;box-shadow:0 6px 18px #17365d08;padding:12px;margin-top:10px}.fc-tools{display:grid;grid-template-columns:minmax(240px,1fr) 2fr;gap:10px;align-items:center}.fc-search{position:relative}.fc-search input{width:100%;box-sizing:border-box;border:1px solid #ccd8e4;border-radius:10px;padding:11px 42px 11px 12px;font:inherit}.fc-search svg{position:absolute;right:13px;top:11px;width:21px;height:21px;color:#17365d}.fc-filters{display:grid;grid-template-columns:repeat(5,1fr);gap:7px}.fc-filter{border:1px solid #dce4ec;background:#f4f7fb;color:#17365d;border-radius:9px;padding:10px 8px;font-weight:800;cursor:pointer;white-space:nowrap}.fc-filter.on{background:#17365d;color:#fff;border-color:#17365d}.fc-filter.late.on{background:#b52626;border-color:#b52626}
.fc-table-wrap{overflow:auto;margin-top:10px}.fc-table{width:100%;min-width:1060px;border-collapse:separate;border-spacing:0}.fc-table th{background:#f1f5f9;color:#17365d;font-size:12px;padding:10px;border-bottom:1px solid #dce5ee;white-space:nowrap}.fc-table td{padding:9px 10px;border-bottom:1px solid #e8edf3;color:#2e425a;font-size:13px;vertical-align:middle}.fc-table tr:hover td{background:#fbfcfe}.fc-type,.fc-status,.fc-priority{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:5px 9px;font-weight:800;white-space:nowrap}.fc-type svg{width:15px;height:15px}.fc-type.short{background:#fff0c9;color:#b97800}.fc-type.maint{background:#ffe0e0;color:#c22626}.fc-type.action{background:#deedff;color:#1760b8}.fc-status.new{background:#e1efff;color:#1c65b9}.fc-status.follow{background:#fff0c9;color:#9d6700}.fc-status.work{background:#dcecff;color:#145ca7}.fc-status.late{background:#ffe1e1;color:#c42626}.fc-status.verify{background:#e6f7ed;color:#13783b}.fc-priority.high{background:#ffe0e0;color:#c42626}.fc-priority.mid{background:#fff0c9;color:#9d6700}.fc-priority.low{background:#ddf5e6;color:#15783e}.fc-age.late{color:#d22626;font-weight:850}.fc-open{border:0;background:#17365d;color:#fff;border-radius:8px;padding:7px 13px;font-weight:800;cursor:pointer}.fc-subject{font-weight:850;color:#17365d}.fc-details{max-width:320px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.fc-footer{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-top:10px;color:#718096;font-size:12px}.fc-pages{display:flex;gap:5px}.fc-page{min-width:32px;height:32px;border:1px solid #d8e1ea;border-radius:8px;background:#fff;color:#17365d;cursor:pointer}.fc-page.on{background:#17365d;color:#fff}
.fc-bottom{display:grid;grid-template-columns:1.25fr .95fr;gap:12px;margin-top:12px}.fc-att,.fc-dist{border:1px solid var(--fc-line);border-radius:16px;background:#fff;box-shadow:0 6px 18px #17365d08;padding:15px}.fc-att{background:linear-gradient(135deg,#fff7f6,#fff)}.fc-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:11px}.fc-head h3{margin:0;color:#17365d;font-size:18px}.fc-head.red h3{color:#bf2020}.fc-att-row{display:grid;grid-template-columns:35px 1fr auto;gap:9px;align-items:center;background:#fff;border:1px solid #fae6e3;border-radius:11px;padding:9px;margin-top:7px}.fc-rank{width:30px;height:30px;border-radius:50%;background:#cf2929;color:#fff;display:grid;place-items:center;font-weight:900}.fc-att-row b{color:#17365d}.fc-att-row small{display:block;color:#7b8797;margin-top:3px}.fc-chart-area{display:grid;grid-template-columns:170px 1fr;align-items:center;gap:15px}.fc-donut{width:145px;height:145px;border-radius:50%;display:grid;place-items:center;position:relative;margin:auto}.fc-donut:after{content:'';width:78px;height:78px;background:#fff;border-radius:50%;position:absolute}.fc-donut-center{position:relative;z-index:2;text-align:center;color:#17365d}.fc-donut-center strong{display:block;font-size:28px}.fc-legend{display:grid;gap:10px}.fc-leg{display:grid;grid-template-columns:12px 1fr auto;gap:8px;align-items:center;color:#17365d}.fc-dot{width:10px;height:10px;border-radius:50%}.fc-empty{text-align:center;color:#7b8797;padding:24px}
@media(max-width:1050px){.fc-summary{grid-template-columns:repeat(3,1fr)}.fc-tools{grid-template-columns:1fr}.fc-bottom{grid-template-columns:1fr}}
@media(max-width:700px){.fc-summary{grid-template-columns:repeat(2,1fr)}.fc-filters{display:flex;overflow:auto}.fc-filter{min-width:max-content}.fc-chart-area{grid-template-columns:1fr}.fc-hero{align-items:flex-start}.fc-hero h1{font-size:21px}}
`;document.head.appendChild(s)}
async function fetchData(){
 const u=new URL(API);u.searchParams.set('k',TOKEN);const r=await fetch(u),t=await r.text();let j;try{j=JSON.parse(t)}catch{throw Error('استجابة غير صالحة من مركز المتابعة')}if(!r.ok)throw Error(j.error||'تعذر تحميل مركز المتابعة');return j
}
function ensureView(){
 ensureStyle();if($('followupCenter'))return;
 const sec=document.createElement('section');sec.id='followupCenter';sec.className='view';sec.innerHTML='<div class="top"><div><div class="brand">مركز المتابعة</div><div class="sub">النواقص • الصيانة • الإجراءات</div></div><button class="btn ghost" onclick="home()">الرئيسية</button></div><div class="fc-wrap"><div id="fcBody"></div></div>';document.querySelector('main.app')?.appendChild(sec)
}
function ageText(n){n=Number(n||0);if(n===0)return 'اليوم';if(n===1)return 'يوم واحد';if(n===2)return 'يومين';if(n>=3&&n<=10)return n+' أيام';return n+' يوم'}
function statusClass(s){if(s==='متأخر')return'late';if(s==='جديد')return'new';if(s==='متابعة')return'follow';if(s==='قيد التنفيذ')return'work';if(s==='قيد التحقق')return'verify';return'follow'}
function priorityClass(p){return p==='عالية'?'high':p==='متوسطة'?'mid':'low'}
function typeClass(t){return t==='نواقص'?'short':t==='صيانة'?'maint':'action'}
function typeIcon(t){return t==='نواقص'?'box':t==='صيانة'?'wrench':'clip'}
function filtered(){
 const rows=S.data?.rows||[],q=S.search.trim().toLowerCase();
 return rows.filter(x=>{
   if(S.filter==='overdue'&&!x.overdue)return false;
   if(S.filter==='shortages'&&x.type!=='نواقص')return false;
   if(S.filter==='maintenance'&&x.type!=='صيانة')return false;
   if(S.filter==='actions'&&x.type!=='إجراء')return false;
   if(q&&!([x.subject,x.details,x.responsible,x.status,x.type].join(' ').toLowerCase().includes(q)))return false;
   return true;
 })
}
function stat(cls,filter,icon,label,value,sub){return '<div class="fc-stat '+cls+' '+(S.filter===filter?'on':'')+'" onclick="fcSetFilter(\''+filter+'\')"><div class="fc-stat-icon">'+svg(icon)+'</div><div><b>'+label+'</b><strong>'+value+'</strong><small>'+sub+'</small></div></div>'}
function summary(d){const c=d.counts||{};return '<div class="fc-summary">'+stat('total','all','folder','إجمالي المفتوح',c.total||0,'جميع المتابعات المفتوحة')+stat('late','overdue','clock','المتأخر',c.overdue||0,'تحتاج تدخل ومراجعة')+stat('short','shortages','box','النواقص',c.shortages||0,'أصناف بحاجة متابعة')+stat('maint','maintenance','wrench','الصيانة',c.maintenance||0,'طلبات صيانة مفتوحة')+stat('action','actions','clip','الإجراءات',c.actions||0,'مهام وإجراءات مفتوحة')+'</div>'}
function filters(d){const c=d.counts||{};return '<div class="fc-tools"><div class="fc-search">'+svg('search')+'<input id="fcSearch" value="'+esc(S.search)+'" oninput="fcSearch(this.value)" placeholder="البحث في المتابعات..."></div><div class="fc-filters"><button class="fc-filter '+(S.filter==='all'?'on':'')+'" onclick="fcSetFilter(\'all\')">الكل ('+(c.total||0)+')</button><button class="fc-filter '+(S.filter==='shortages'?'on':'')+'" onclick="fcSetFilter(\'shortages\')">النواقص ('+(c.shortages||0)+')</button><button class="fc-filter '+(S.filter==='maintenance'?'on':'')+'" onclick="fcSetFilter(\'maintenance\')">الصيانة ('+(c.maintenance||0)+')</button><button class="fc-filter '+(S.filter==='actions'?'on':'')+'" onclick="fcSetFilter(\'actions\')">الإجراءات ('+(c.actions||0)+')</button><button class="fc-filter late '+(S.filter==='overdue'?'on':'')+'" onclick="fcSetFilter(\'overdue\')">المتأخر ('+(c.overdue||0)+')</button></div></div>'}
function table(){
 const all=filtered(),pages=Math.max(1,Math.ceil(all.length/S.size));if(S.page>pages)S.page=pages;const from=(S.page-1)*S.size,rows=all.slice(from,from+S.size);
 const body=rows.map((x,i)=>'<tr><td>'+(from+i+1)+'</td><td><span class="fc-type '+typeClass(x.type)+'">'+svg(typeIcon(x.type))+esc(x.type)+'</span></td><td class="fc-subject">'+esc(x.subject)+'</td><td class="fc-details" title="'+esc(x.details)+'">'+esc(x.details||'—')+'</td><td>'+esc(x.responsible||'غير محدد')+'</td><td>'+esc(x.opened_date||'—')+'</td><td class="fc-age '+(x.overdue?'late':'')+'">'+ageText(x.age_days)+'</td><td><span class="fc-status '+statusClass(x.status)+'">'+esc(x.status)+'</span></td><td><span class="fc-priority '+priorityClass(x.priority)+'">'+esc(x.priority)+'</span></td><td><button class="fc-open" onclick="fcOpenSource(\''+esc(x.route)+'\')">فتح ↗</button></td></tr>').join('');
 let p='';for(let i=1;i<=pages&&i<=7;i++)p+='<button class="fc-page '+(i===S.page?'on':'')+'" onclick="fcPage('+i+')">'+i+'</button>';
 return '<div class="fc-table-wrap"><table class="fc-table"><thead><tr><th>#</th><th>النوع</th><th>الموضوع</th><th>التفاصيل المختصرة</th><th>المسؤول</th><th>تاريخ الفتح</th><th>منذ متى</th><th>الحالة</th><th>الأولوية</th><th>إجراء</th></tr></thead><tbody>'+(body||'<tr><td colspan="10"><div class="fc-empty">لا توجد متابعات مطابقة.</div></td></tr>')+'</tbody></table></div><div class="fc-footer"><span>عرض '+(all.length?from+1:0)+' - '+Math.min(from+S.size,all.length)+' من '+all.length+'</span><div class="fc-pages">'+p+'</div></div>'
}
function attention(d){
 const rows=d.attention||[];
 return '<div class="fc-att"><div class="fc-head red"><h3>🔔 يحتاج انتباهك الآن</h3></div>'+(rows.length?rows.map((x,i)=>'<div class="fc-att-row"><span class="fc-rank">'+(i+1)+'</span><div><b>'+esc(x.subject)+'</b><small>'+esc(x.type)+' • مفتوح منذ '+ageText(x.age_days)+(x.overdue?' • متأخر':'')+'</small></div><button class="fc-open" onclick="fcOpenSource(\''+esc(x.route)+'\')">فتح</button></div>').join(''):'<div class="fc-empty">لا توجد متابعات مفتوحة تحتاج انتباهك الآن.</div>')+'</div>'
}
function distribution(d){
 const c=d.counts||{},total=Number(c.total||0),s=Number(c.shortages||0),m=Number(c.maintenance||0),a=Number(c.actions||0),sp=total?s/total*100:0,mp=total?m/total*100:0,ap=total?a/total*100:0;
 const grad='conic-gradient(#f2ba3e 0 '+sp+'%, #ef6262 '+sp+'% '+(sp+mp)+'%, #3c84e8 '+(sp+mp)+'% 100%)';
 return '<div class="fc-dist"><div class="fc-head"><h3>توزيع المتابعات حسب النوع</h3></div><div class="fc-chart-area"><div class="fc-donut" style="background:'+grad+'"><div class="fc-donut-center"><strong>'+total+'</strong><span>مفتوح</span></div></div><div class="fc-legend"><div class="fc-leg"><span class="fc-dot" style="background:#f2ba3e"></span><b>النواقص</b><span>'+s+' • '+Math.round(sp)+'%</span></div><div class="fc-leg"><span class="fc-dot" style="background:#ef6262"></span><b>الصيانة</b><span>'+m+' • '+Math.round(mp)+'%</span></div><div class="fc-leg"><span class="fc-dot" style="background:#3c84e8"></span><b>الإجراءات</b><span>'+a+' • '+Math.round(ap)+'%</span></div></div></div></div>'
}
function render(){
 const b=$('fcBody');if(!b)return;
 if(S.loading){b.innerHTML='<div class="fc-panel">جاري تحميل مركز المتابعة...</div>';return}
 if(S.error){b.innerHTML='<div class="notice err">'+esc(S.error)+'</div>';return}
 const d=S.data;if(!d)return;
 b.innerHTML='<div class="fc-hero"><div><h1>مركز المتابعة الموحد</h1><p>كل ما يحتاج متابعة في المعرض من مكان واحد</p></div><div class="fc-target">◎</div></div>'+summary(d)+'<div class="fc-panel">'+filters(d)+table()+'</div><div class="fc-bottom">'+attention(d)+distribution(d)+'</div>'
}
window.fcSetFilter=f=>{S.filter=f;S.page=1;render()};
window.fcSearch=v=>{S.search=v;S.page=1;render();const i=$('fcSearch');if(i){i.focus();i.setSelectionRange(v.length,v.length)}};
window.fcPage=p=>{S.page=p;render()};
window.fcOpenSource=route=>{
 if(route==='shortages')return typeof openShortages==='function'?openShortages():null;
 if(route==='maintenance')return typeof openFollowups==='function'?openFollowups('maintenance'):null;
 return typeof openDailyActions==='function'?openDailyActions():typeof openActions==='function'?openActions():null;
};
window.openFollowupCenter=async()=>{
 ensureView();show('followupCenter');S.loading=true;S.error='';render();
 try{S.data=await fetchData()}catch(e){S.error=e.message;S.data=null}finally{S.loading=false;render()}
};
ensureView();window.RakizaFollowupCenter={VERSION:'20260925-followup-center-v1'};
})();