(()=>{
'use strict';

const VERSION='20260925-landscape-orientation2';

function rkzSvg(name){
  const common='viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  const icons={
    home:'<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10.5V20h14v-9.5"/><path d="M9 20v-6h6v6"/>',
    play:'<circle cx="12" cy="12" r="9"/><path d="m10 8 6 4-6 4z"/>',
    chart:'<path d="M4 20V10"/><path d="M10 20V4"/><path d="M16 20v-7"/><path d="M22 20V8"/>',
    target:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><path d="M14.8 9.2 21 3"/><path d="M17 3h4v4"/>',
    users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    wrench:'<path d="M14.7 6.3a4 4 0 0 0-5-5L12 3.6 9.6 6 7.3 3.7a4 4 0 0 0 5 5L4 17l3 3 8.3-8.3a4 4 0 0 0 5-5L18 9l-2.4-2.4z"/>',
    clip:'<path d="M9 5h6"/><path d="M9 3h6v4H9z"/><path d="M7 5H5v16h14V5h-2"/><path d="M8 11h8M8 15h8"/>',
    file:'<path d="M6 2h8l4 4v16H6z"/><path d="M14 2v5h5"/><path d="M9 13h6M9 17h6"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
    box:'<path d="m12 3 9 5-9 5-9-5 9-5z"/><path d="m3 8 9 5 9-5"/><path d="M3 8v8l9 5 9-5V8M12 13v8"/>',
    spark:'<path d="m12 3 1.3 3.7L17 8l-3.7 1.3L12 13l-1.3-3.7L7 8l3.7-1.3L12 3z"/><path d="m19 14 .8 2.2L22 17l-2.2.8L19 20l-.8-2.2L16 17l2.2-.8L19 14z"/>',
    bell:'<path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/>',
    check:'<path d="m5 12 4 4L19 6"/>',
    alert:'<path d="M12 3 2.5 20h19L12 3z"/><path d="M12 9v4M12 17h.01"/>',
    arrow:'<path d="m9 18 6-6-6-6"/>'
  };
  return `<svg ${common}>${icons[name]||icons.file}</svg>`;
}

function fmt(n){
  const x=Number(n);
  return Number.isFinite(x)?x.toLocaleString('en-US',{maximumFractionDigits:0}):'—';
}
function pct(v){
  const x=Number(v);
  return Number.isFinite(x)?x.toFixed(1)+'%':'—';
}
function safeApp(){ try{return app||null}catch{return null} }
function cycleState(a){
  if(window.RakizaDayCycle?.derive)return window.RakizaDayCycle.derive(a);
  const day=a?.day,openingDone=!!day?.opening_approved_at,planDone=!!(day&&(day.plan_id||day.day_type)),closeDone=day?.status==='مغلق';
  const key=!day?'not_started':closeDone?'closed':!openingDone?'opening':!planDone?'planning':'operating';
  const labels={not_started:'لم يبدأ',opening:'بدء اليوم',planning:'إعداد الخطة',operating:'قيد التشغيل',closed:'مغلق'};
  const next={not_started:'start',opening:'opening',planning:'dayplan',operating:'close',closed:'reports'};
  return {key,label:labels[key],description:'أكمل خطوات التشغيل اليومية بالترتيب.',buttonLabel:key==='not_started'?'بدء يوم التشغيل':key==='closed'?'عرض سجل الأيام':'متابعة دورة التشغيل',nextTarget:next[key],progress:closeDone?100:planDone?67:openingDone?33:0,openingDone,planDone,closeDone,steps:[{key:'opening',number:1,status:openingDone?'done':key==='opening'?'current':'locked',label:'بدء اليوم'},{key:'dayplan',number:2,status:planDone?'done':key==='planning'?'current':'locked',label:'خطة اليوم'},{key:'close',number:3,status:closeDone?'done':key==='operating'?'current':'locked',label:'إغلاق اليوم'}]};
}
function workDate(a){return a?.day?.work_date||a?.date||new Date().toISOString().slice(0,10)}
function gregorianDate(d){
  try{return new Intl.DateTimeFormat('ar-SA-u-ca-gregory',{weekday:'long',day:'numeric',month:'long'}).format(new Date(d+'T12:00:00'))}
  catch{return d}
}
function monthAchieved(a,d){
  const key=d.slice(0,7),rows=(a?.recent||[]).filter(x=>x.work_date?.startsWith(key));
  let total=rows.reduce((s,x)=>s+Number(x.daily_sales||0),0);
  if(a?.day?.status==='مغلق'&&!rows.some(x=>x.id===a.day.id))total+=Number(a.day.daily_sales||0);
  return total;
}
function readinessScore(a){
  const stored=Number(a?.day?.operational_readiness);
  if(Number.isFinite(stored))return stored;
  const checks=a?.checks||[],items=a?.items||[];
  if(!checks.length)return null;
  const w=new Map(items.map(x=>[String(x.id),Number(x.weight||0)]));
  return checks.reduce((s,c)=>s+(c.readiness_status==='جاهز'?(w.get(String(c.item_id))||0):0),0);
}
function presentCounts(a){
  const active=(a?.employees||[]).filter(e=>e.active),attendance=a?.attendance||[];
  const present=attendance.filter(x=>['حاضر','متأخر'].includes(x.attendance_status)).length;
  return {present,total:active.length};
}
function actionCounts(a){
  const rows=a?.actions||[],open=x=>x.action_status!=='مغلق';
  return {
    daily:rows.filter(x=>!['نواقص','صيانة'].includes(x.action_type)&&open(x)).length,
    shortages:rows.filter(x=>x.action_type==='نواقص'&&open(x)).length,
    maintenance:rows.filter(x=>x.action_type==='صيانة'&&open(x)).length
  };
}
function attentionItems(a,d,dailySalesKnown,dailySales,dailyTarget,readiness){
  const out=[],counts=actionCounts(a),attendance=a?.attendance||[],checks=a?.checks||[];
  if(a?.hasCarryoverOpenDay)out.push({tone:'red',icon:'alert',title:'يوجد يوم تشغيل سابق مفتوح',sub:'أغلق اليوم السابق قبل بدء يوم جديد',go:'close'});
  const historical=(a?.recent||[]).filter(day=>['غير مكتمل','غير مسجل','لم يتم العمل'].includes(day.status));
  if(historical.length)out.push({tone:'red',icon:'calendar',title:`${historical.length} يوم يحتاج معالجة`,sub:'استكمل الإغلاق أو اعتمد عدم التشغيل من سجل الأيام',go:'reports'});
  const openReadiness=checks.filter(c=>c.readiness_status==='غير جاهز'&&c.resolution_status!=='عولج فورًا').length;
  if(openReadiness)out.push({tone:'red',icon:'alert',title:`${openReadiness} بند جاهزية يحتاج متابعة`,sub:'راجع بنود الجاهزية التشغيلية',go:'opening'});
  else if(readiness!=null&&readiness<100)out.push({tone:'amber',icon:'alert',title:`الجاهزية ${Math.round(readiness)} / 100`,sub:'يوجد مجال لاستكمال الجاهزية',go:'opening'});
  const absent=attendance.filter(x=>x.attendance_status==='غائب').length;
  if(absent)out.push({tone:'amber',icon:'users',title:`${absent} موظف غير حاضر`,sub:'راجع تواجد الفريق وخطة اليوم',go:'dayplan'});
  if(dailySalesKnown&&dailyTarget>dailySales){const gap=dailyTarget-dailySales;out.push({tone:'red',icon:'chart',title:`المبيعات أقل من مستهدف اليوم بـ ${fmt(gap)} ريال`,sub:`المحقق ${fmt(dailySales)} من ${fmt(dailyTarget)}`,go:'sales'});}
  if(counts.maintenance)out.push({tone:'amber',icon:'wrench',title:`${counts.maintenance} طلب صيانة مفتوح`,sub:'توجد متابعة صيانة لم تغلق بعد',go:'maintenance'});
  if(counts.shortages)out.push({tone:'blue',icon:'box',title:`${counts.shortages} متابعة نواقص مفتوحة`,sub:'راجع النواقص والطلبات القائمة',go:'shortages'});
  if(counts.daily)out.push({tone:'blue',icon:'clip',title:`${counts.daily} إجراء يومي مفتوح`,sub:'راجع الإجراءات اليومية',go:'actions'});
  return out.slice(0,5);
}

function ensureStyle(){
  if(document.getElementById('rkzExecutiveStyle'))return;
  const s=document.createElement('style');s.id='rkzExecutiveStyle';s.textContent=`
    body.rkz-shell{background:#f4f7fb;color:#17243b}
    body.rkz-shell .app{max-width:none;margin:0 246px 0 0;padding:18px 22px 12px;min-height:100vh}
    #rkzSidebar{position:fixed;right:0;top:0;bottom:0;width:226px;background:#fff;border-left:1px solid #e8edf4;z-index:25;padding:22px 15px;display:flex;flex-direction:column;box-shadow:-5px 0 24px rgba(23,54,93,.04);overflow:hidden}
    .rkz-side-brand{padding:4px 10px 20px;border-bottom:1px solid #eef1f5;margin-bottom:12px;flex:0 0 auto}.rkz-side-brand b{display:block;font-size:34px;line-height:1;color:#0f2d52}.rkz-side-brand span{display:block;color:#6f7f94;font-size:12px;margin-top:8px}
    .rkz-side-nav{display:flex;flex-direction:column;gap:5px;flex:1 1 auto;min-height:0;overflow-y:auto;overflow-x:hidden;overscroll-behavior:contain;scrollbar-width:thin;-webkit-overflow-scrolling:touch;touch-action:pan-y;padding-left:3px}.rkz-side-btn{border:0;background:transparent;border-radius:12px;padding:11px 12px;display:flex;align-items:center;gap:11px;color:#213b60;font-weight:750;cursor:pointer;text-align:right;width:100%;transition:.16s}.rkz-side-btn svg{width:20px;height:20px;flex:none}.rkz-side-btn:hover{background:#f3f6fa}.rkz-side-btn.on{background:linear-gradient(135deg,#17365d,#28527d);color:#fff;box-shadow:0 7px 18px rgba(23,54,93,.16)}
    .rkz-side-foot{margin-top:auto;padding:12px 10px;color:#9aa5b4;font-size:11px;text-align:center;flex:0 0 auto}
    .rkz-home-wrap{max-width:1320px;margin:0 auto;direction:rtl}.rkz-home-top{min-height:66px;background:#fff;border:1px solid #e8edf4;border-radius:18px;padding:12px 16px;margin-bottom:14px;display:flex;align-items:center;justify-content:space-between;gap:15px;box-shadow:0 4px 18px rgba(23,54,93,.04)}
    .rkz-date-line{display:flex;align-items:center;gap:10px;color:#233e62;font-weight:800}.rkz-date-line svg{width:21px;height:21px}.rkz-user{display:flex;align-items:center;gap:10px}.rkz-avatar{width:42px;height:42px;border-radius:50%;background:#17365d;color:#fff;display:grid;place-items:center;font-weight:900}.rkz-user-text b{display:block;color:#17365d}.rkz-user-text span{font-size:12px;color:#7b8798}.rkz-ai-top{border:0;background:#d7ad55;color:#17243b;border-radius:12px;padding:10px 15px;font-weight:850;display:flex;align-items:center;gap:7px;cursor:pointer}.rkz-ai-top svg{width:18px;height:18px}
    .rkz-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin-bottom:14px}.rkz-kpi{background:#fff;border:1px solid #e8edf4;border-radius:16px;padding:16px;min-height:128px;box-shadow:0 4px 18px rgba(23,54,93,.04)}.rkz-kpi-head{display:flex;align-items:center;justify-content:space-between;color:#39516f;font-weight:750}.rkz-kpi-icon{width:36px;height:36px;border-radius:11px;background:#f1f6fb;display:grid;place-items:center;color:#17365d}.rkz-kpi-icon svg{width:21px;height:21px}.rkz-kpi strong{display:block;font-size:28px;color:#102849;margin-top:12px;line-height:1}.rkz-kpi small{color:#7d8998;font-size:11px}.rkz-kpi .rkz-pct{display:block;margin-top:11px;font-size:13px;font-weight:850;color:#a46a00}.rkz-bar{height:8px;background:#e8edf3;border-radius:99px;overflow:hidden;margin-top:7px}.rkz-bar i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#d8aa49,#c99632)}.rkz-kpi.sales{background:linear-gradient(180deg,#fff,#f3fbf6)}.rkz-kpi.sales .rkz-pct{color:#24814d}.rkz-kpi.sales .rkz-bar i{background:linear-gradient(90deg,#78d399,#31a665)}
    .rkz-main-grid{display:grid;grid-template-columns:350px minmax(0,1fr);gap:14px;direction:ltr;align-items:start}.rkz-main-grid>*{direction:rtl}.rkz-panel{background:#fff;border:1px solid #e8edf4;border-radius:17px;padding:16px;box-shadow:0 4px 18px rgba(23,54,93,.04)}
    .rkz-alert-panel{grid-column:1;background:linear-gradient(180deg,#fff8f7,#fff);min-height:100%}.rkz-cycle-panel{grid-column:2}.rkz-panel-title{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:12px}.rkz-panel-title h2{font-size:21px;margin:0;color:#102849}.rkz-panel-title p{margin:4px 0 0;color:#8a96a6;font-size:12px}.rkz-title-icon{width:38px;height:38px;border-radius:12px;display:grid;place-items:center;background:#f3f6fb;color:#17365d}.rkz-title-icon svg{width:22px;height:22px}.rkz-title-icon.red{background:#fff0ed;color:#d84b3d}
    .rkz-cycle-head{display:flex;align-items:center;gap:9px}.rkz-cycle-state{display:inline-flex;align-items:center;border-radius:999px;padding:6px 10px;background:#eef4fa;color:#17365d;font-size:12px;font-weight:850}.rkz-cycle-summary{border:1px solid #e8edf4;background:#f8fafc;border-radius:13px;padding:11px 13px;margin:4px 0 14px}.rkz-cycle-summary-row{display:flex;justify-content:space-between;align-items:center;gap:12px}.rkz-cycle-summary b{color:#17365d}.rkz-cycle-summary span{font-size:12px;color:#77869a}.rkz-cycle-progress{height:7px;background:#e4eaf1;border-radius:99px;overflow:hidden;margin-top:9px}.rkz-cycle-progress i{display:block;height:100%;background:linear-gradient(90deg,#17365d,#d2a54c);border-radius:99px;transition:width .25s ease}
    .rkz-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:0;align-items:start;margin:18px 10px}.rkz-step{position:relative;text-align:center;cursor:pointer;border-radius:12px;padding:6px 3px;transition:.16s}.rkz-step:hover{background:#f6f8fb}.rkz-step:not(:last-child):after{content:'';position:absolute;top:26px;left:-50%;width:100%;height:3px;background:#dfe6ee;z-index:0}.rkz-step.done:not(:last-child):after{background:#9fb4ca}.rkz-step-dot{position:relative;z-index:1;width:42px;height:42px;border-radius:50%;margin:0 auto 8px;background:#cbd4df;color:#fff;display:grid;place-items:center;font-weight:900}.rkz-step.done .rkz-step-dot{background:#17365d}.rkz-step.current .rkz-step-dot{background:#d2a54c;box-shadow:0 0 0 5px #fbf3e3}.rkz-step.locked{opacity:.58}.rkz-step-dot svg{width:22px;height:22px}.rkz-step b{display:block;color:#1d3657}.rkz-step span{font-size:12px;color:#909aaa}.rkz-step.done span{color:#2b8b54}.rkz-step.current span{color:#a16c10;font-weight:800}.rkz-cycle-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:9px;margin:10px 0}.rkz-stat{border:1px solid #e8edf4;border-radius:13px;padding:10px 12px;background:#f9fbfd;display:flex;align-items:center;justify-content:space-between;gap:10px}.rkz-stat span{font-size:12px;color:#8190a2}.rkz-stat strong{font-size:18px;color:#17365d}.rkz-stat-icon{width:35px;height:35px;border-radius:10px;background:#eaf5ee;color:#278452;display:grid;place-items:center}.rkz-stat-icon.gold{background:#fff6e5;color:#bb8120}.rkz-stat-icon.blue{background:#edf4fb;color:#24588b}.rkz-stat-icon svg{width:19px;height:19px}
    .rkz-primary{width:100%;border:0;border-radius:12px;padding:13px 16px;background:linear-gradient(90deg,#c9993e,#d7ad55);color:#fff;font-weight:900;font-size:15px;cursor:pointer}.rkz-primary:hover{filter:brightness(.98)}
    .rkz-alert-list{display:flex;flex-direction:column;gap:9px}.rkz-alert{border:1px solid #edf0f4;background:#fff;border-radius:13px;padding:12px;display:grid;grid-template-columns:42px 1fr 18px;gap:10px;align-items:center;cursor:pointer}.rkz-alert-icon{width:38px;height:38px;border-radius:50%;display:grid;place-items:center}.rkz-alert-icon svg{width:20px;height:20px}.rkz-alert-icon.red{background:#ffefed;color:#d84c3e}.rkz-alert-icon.amber{background:#fff1d8;color:#c78922}.rkz-alert-icon.blue{background:#eaf3fb;color:#2e679e}.rkz-alert b{display:block;color:#203958;font-size:14px}.rkz-alert span{display:block;color:#8b96a5;font-size:11px;margin-top:3px}.rkz-alert>.rkz-arr{color:#9ca8b6}.rkz-alert>.rkz-arr svg{width:16px;height:16px}.rkz-all-alerts{margin-top:12px;border:0;background:#fff2f0;color:#6c7a8d;border-radius:11px;width:100%;padding:11px;font-weight:750;cursor:pointer}.rkz-okbox{border:1px solid #dcefe3;background:#f5fbf7;color:#24724a;border-radius:13px;padding:15px;text-align:center;font-weight:750}
    .rkz-ai-bar{margin-top:14px;background:linear-gradient(110deg,#12345a,#1b4b79);color:#fff;border-radius:17px;padding:14px 18px;display:grid;grid-template-columns:230px 1fr;gap:18px;align-items:center;box-shadow:0 7px 22px rgba(23,54,93,.14)}.rkz-ai-brand{display:flex;align-items:center;gap:10px}.rkz-ai-brand svg{width:31px;height:31px;color:#f2c768}.rkz-ai-brand b{font-size:23px}.rkz-ai-brand span{display:block;font-size:11px;color:#d6e1ed}.rkz-ai-ask{display:flex;align-items:center;gap:8px}.rkz-ai-input{flex:1;background:#fff;color:#7e8996;border-radius:10px;padding:11px 13px;cursor:text;border:1px solid #dfe6ef}.rkz-ai-btn{border:0;border-radius:10px;background:#d5aa51;color:#fff;padding:11px 19px;font-weight:900;cursor:pointer}
    body.rkz-shell #rakizaCopyright{margin:10px 246px 0 0!important;max-width:none!important;padding:12px!important;color:#8792a0!important}
    @media(max-width:1080px){.rkz-main-grid{grid-template-columns:310px minmax(0,1fr)}.rkz-kpi strong{font-size:24px}}
    @media(max-width:900px){body.rkz-shell .app{margin-right:0;padding:10px}#rkzSidebar{position:static;width:auto;height:auto;border-left:0;border-bottom:1px solid #e5ebf2;padding:10px 12px;box-shadow:none;overflow:visible}.rkz-side-brand{display:flex;align-items:center;justify-content:space-between;padding:3px 6px 10px;margin-bottom:8px}.rkz-side-brand b{font-size:26px}.rkz-side-brand span{margin:0}.rkz-side-nav{flex-direction:row;flex:0 0 auto;min-height:auto;overflow-x:auto;overflow-y:hidden;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch;touch-action:pan-x;padding:0 0 4px 0}.rkz-side-btn{width:auto;min-width:max-content;padding:9px 11px}.rkz-side-foot{display:none}.rkz-kpis{grid-template-columns:repeat(2,1fr)}.rkz-main-grid{display:block}.rkz-panel{margin-bottom:12px}.rkz-alert-panel{min-height:0}.rkz-ai-bar{grid-template-columns:1fr}.rkz-ai-brand{justify-content:center}body.rkz-shell #rakizaCopyright{margin:8px 0 0!important}}
    @media(max-width:600px){.rkz-home-top{align-items:flex-start;flex-wrap:wrap}.rkz-user{order:3;width:100%}.rkz-kpis{grid-template-columns:1fr 1fr}.rkz-kpi{min-height:112px;padding:13px}.rkz-kpi strong{font-size:22px}.rkz-cycle-stats{grid-template-columns:1fr}.rkz-ai-ask{flex-direction:column}.rkz-ai-input,.rkz-ai-btn{width:100%}}
    @media (orientation:landscape) and (min-width:700px){
      body.rkz-shell .app{max-width:none;margin:0 246px 0 0;padding:18px 22px 12px;min-height:100vh}
      #rkzSidebar{position:fixed;right:0;top:0;bottom:0;width:226px;height:auto;border-left:1px solid #e8edf4;border-bottom:0;padding:22px 15px;box-shadow:-5px 0 24px rgba(23,54,93,.04);overflow-y:auto;overflow-x:hidden;-webkit-overflow-scrolling:touch;touch-action:pan-y}
      .rkz-side-brand{display:block;padding:4px 10px 20px;border-bottom:1px solid #eef1f5;margin-bottom:12px}
      .rkz-side-brand b{font-size:34px}.rkz-side-brand span{display:block;margin-top:8px}
      .rkz-side-nav{display:flex;flex-direction:column;gap:5px;overflow:visible;min-height:auto;padding-left:3px;touch-action:auto}
      .rkz-side-btn{width:100%;min-width:0;padding:11px 12px}
      .rkz-side-foot{display:block;margin-top:14px}
      .rkz-kpis{grid-template-columns:repeat(4,minmax(0,1fr))}
      .rkz-main-grid{display:grid;grid-template-columns:340px minmax(0,1fr)}
      .rkz-panel{margin-bottom:0}
      .rkz-alert-panel{min-height:404px}
      .rkz-ai-bar{grid-template-columns:230px 1fr}
      .rkz-ai-brand{justify-content:flex-start}
      body.rkz-shell #rakizaCopyright{margin:10px 246px 0 0!important}
    }
  `;document.head.appendChild(s);
}

function ensureSidebar(){
  if(document.getElementById('rkzSidebar'))return;
  const a=document.createElement('aside');a.id='rkzSidebar';a.innerHTML=`
    <div class="rkz-side-brand"><div><b>ركيزة</b><span>نظام تشغيل وإدارة المعرض</span></div></div>
    <nav class="rkz-side-nav">
      <button class="rkz-side-btn on" data-nav="home" onclick="rkzNav('home')">${rkzSvg('home')}<span>الرئيسية</span></button>
      <button class="rkz-side-btn" data-nav="cycle" onclick="rkzNav('cycle')">${rkzSvg('play')}<span>دورة التشغيل</span></button>
      <button class="rkz-side-btn" data-nav="sales" onclick="rkzNav('sales')">${rkzSvg('chart')}<span>المبيعات</span></button>
      <button class="rkz-side-btn" data-nav="targets" onclick="rkzNav('targets')">${rkzSvg('target')}<span>المستهدفات</span></button>
      <button class="rkz-side-btn" data-nav="roster" onclick="rkzNav('roster')">${rkzSvg('users')}<span>خطة التواجد</span></button>
      <button class="rkz-side-btn" data-nav="shortages" onclick="rkzNav('shortages')">${rkzSvg('box')}<span>النواقص</span></button>
      <button class="rkz-side-btn" data-nav="maintenance" onclick="rkzNav('maintenance')">${rkzSvg('wrench')}<span>الصيانة</span></button>
      <button class="rkz-side-btn" data-nav="actions" onclick="rkzNav('actions')">${rkzSvg('clip')}<span>الإجراءات</span></button>
      <button class="rkz-side-btn" data-nav="reports" onclick="rkzNav('reports')">${rkzSvg('file')}<span>سجل الأيام</span></button>
      <button class="rkz-side-btn" data-nav="weekly" onclick="rkzNav('weekly')">${rkzSvg('chart')}<span>الأداء الأسبوعي</span></button>
    </nav>
    <div class="rkz-side-foot">V1 • التشغيل التجريبي</div>`;
  const main=document.querySelector('main.app');
  if(main)document.body.insertBefore(a,main);else document.body.prepend(a);
}

window.rkzNav=function(target){
  const call=(name,...args)=>typeof window[name]==='function'?window[name](...args):null;
  if(['opening','dayplan','close'].includes(target)&&window.RakizaDayCycle?.guard)target=window.RakizaDayCycle.guard(target,safeApp());
  if(target==='start')return call('startDay');
  if(target==='home')return call('home');
  if(target==='cycle')return typeof window.openDailyCycle==='function'?window.openDailyCycle():call('openOpening');
  if(target==='sales')return call('openSales');
  if(target==='targets')return typeof window.openTargets==='function'?window.openTargets():call('openSales');
  if(target==='roster')return call('openRoster');
  if(target==='shortages')return call('openShortages');
  if(target==='maintenance')return typeof window.openFollowups==='function'?window.openFollowups('maintenance'):call('openActions');
  if(target==='actions')return typeof window.openDailyActions==='function'?window.openDailyActions():call('openActions');
  if(target==='reports')return call('openHistory');
  if(target==='weekly')return call('openWeeklyPerformance');
  if(target==='ai')return call('openAssistant');
  if(target==='opening')return call('openOpening');
  if(target==='dayplan')return call('openDayPlan');
  if(target==='close')return call('openClose');
};

window.rkzContinueCycle=function(){
  const a=safeApp();
  const target=window.RakizaDayCycle?.next?window.RakizaDayCycle.next(a):cycleState(a).nextTarget;
  return rkzNav(target);
};

window.rkzAttentionGo=function(go){return rkzNav(go)};

function setNavByActiveView(){
  const id=document.querySelector('.view.active')?.id||'home';
  let nav='home';
  if(['dailycycle','opening','dayplan','close'].includes(id))nav='cycle';
  else if(id==='sales')nav='sales';else if(id==='targets')nav='targets';else if(id==='roster')nav='roster';
  else if(id==='shortages')nav='shortages';else if(id==='dailyactions')nav='actions';else if(id==='history')nav='reports';
  else if(id==='followups')nav='maintenance';
  else if(id==='weeklyPerformance')nav='weekly';
  document.querySelectorAll('.rkz-side-btn').forEach(b=>b.classList.toggle('on',b.dataset.nav===nav));
}

function renderDashboard(){
  const a=safeApp(),home=document.getElementById('home');if(!home)return;
  if(!a?.branch){home.innerHTML='<div class="rkz-panel" style="margin-top:20px;text-align:center">جاري تحميل ركيزة...</div>';return;}
  const d=workDate(a),monthTarget=Number(a.day?.monthly_target_snapshot??a.monthlyTarget??0),achieved=monthAchieved(a,d),monthPct=monthTarget?achieved/monthTarget*100:0;
  const dailyTarget=Number(a.day?.daily_target||0),dailySalesKnown=!!(a.day&&a.day.daily_sales!==null&&a.day.daily_sales!==undefined&&a.day.daily_sales!==''),dailySales=dailySalesKnown?Number(a.day.daily_sales||0):0,dailyPct=dailyTarget&&dailySalesKnown?dailySales/dailyTarget*100:null;
  const readiness=readinessScore(a),team=presentCounts(a),alerts=attentionItems(a,d,dailySalesKnown,dailySales,dailyTarget,readiness);
  const cycle=cycleState(a),openingDone=cycle.openingDone,planDone=cycle.planDone,closeDone=cycle.closeDone;
  const stepStatus={done:'مكتمل',current:'الخطوة الحالية',locked:'بانتظار ما قبلها'};
  const stepHtml=cycle.steps.map(step=>`<div class="rkz-step ${step.status}" onclick="rkzNav('${step.key}')"><div class="rkz-step-dot">${step.status==='done'?rkzSvg('check'):step.number}</div><b>${step.label}</b><span>${stepStatus[step.status]}</span></div>`).join('');
  const warning=a.hasCarryoverOpenDay?`<div class="notice err" style="margin:0 0 12px"><b>يوجد يوم تشغيل سابق مفتوح.</b> يجب إغلاقه قبل الانتقال لليوم التالي.</div>`:'';
  const alertHtml=alerts.length?alerts.map(x=>`<div class="rkz-alert" onclick="rkzAttentionGo('${x.go}')"><div class="rkz-alert-icon ${x.tone}">${rkzSvg(x.icon)}</div><div><b>${x.title}</b><span>${x.sub}</span></div><div class="rkz-arr">${rkzSvg('arrow')}</div></div>`).join(''):'<div class="rkz-okbox">لا توجد تنبيهات تشغيلية مفتوحة الآن.</div>';
  home.innerHTML=`<div class="rkz-home-wrap">
    <div class="rkz-home-top">
      <div class="rkz-date-line">${rkzSvg('calendar')}<span>${a.branch.name} &nbsp;•&nbsp; ${gregorianDate(d)}</span></div>
      <button class="rkz-ai-top" onclick="rkzNav('ai')">${rkzSvg('spark')}<span>ركيزة AI</span></button>
      <div class="rkz-user"><div class="rkz-avatar">م</div><div class="rkz-user-text"><b>محمد الضمري</b><span>مدير المعرض</span></div></div>
    </div>
    ${warning}
    <div class="rkz-kpis">
      <div class="rkz-kpi"><div class="rkz-kpi-head"><span>مستهدف الشهر</span><div class="rkz-kpi-icon">${rkzSvg('target')}</div></div><strong>${monthTarget?fmt(monthTarget):'—'} <small>${monthTarget?'ريال':''}</small></strong></div>
      <div class="rkz-kpi"><div class="rkz-kpi-head"><span>المحقق</span><div class="rkz-kpi-icon">${rkzSvg('chart')}</div></div><strong>${fmt(achieved)} <small>ريال</small></strong><span class="rkz-pct">${monthTarget?pct(monthPct):'—'}</span><div class="rkz-bar"><i style="width:${Math.max(0,Math.min(monthPct,100))}%"></i></div></div>
      <div class="rkz-kpi"><div class="rkz-kpi-head"><span>مستهدف اليوم</span><div class="rkz-kpi-icon">${rkzSvg('target')}</div></div><strong>${dailyTarget?fmt(dailyTarget):'—'} <small>${dailyTarget?'ريال':''}</small></strong></div>
      <div class="rkz-kpi sales"><div class="rkz-kpi-head"><span>مبيعات اليوم</span><div class="rkz-kpi-icon">${rkzSvg('chart')}</div></div><strong>${dailySalesKnown?fmt(dailySales):'—'} <small>${dailySalesKnown?'ريال':''}</small></strong>${dailyPct!=null?`<span class="rkz-pct">${pct(dailyPct)}</span><div class="rkz-bar"><i style="width:${Math.max(0,Math.min(dailyPct,100))}%"></i></div>`:'<span class="rkz-pct" style="color:#8c98a7">تظهر بعد تسجيل المبيعات</span>'}</div>
    </div>
    <div class="rkz-main-grid">
      <div class="rkz-panel rkz-alert-panel"><div class="rkz-panel-title"><div><h2>ما يحتاج انتباهك</h2><p>الأولويات المفتوحة الآن</p></div><div class="rkz-title-icon red">${rkzSvg('alert')}</div></div><div class="rkz-alert-list">${alertHtml}</div><button class="rkz-all-alerts" onclick="rkzNav('actions')">عرض الإجراءات والمتابعات</button></div>
      <div class="rkz-panel rkz-cycle-panel"><div class="rkz-panel-title"><div><div class="rkz-cycle-head"><h2>دورة التشغيل اليومي</h2><span class="rkz-cycle-state">${cycle.label}</span></div><p>أكمل خطوات التشغيل اليومية بالترتيب</p></div><div class="rkz-title-icon">${rkzSvg('calendar')}</div></div>
        <div class="rkz-cycle-summary"><div class="rkz-cycle-summary-row"><div><b>${cycle.label}</b><span style="display:block;margin-top:3px">${cycle.description}</span></div><span>${cycle.progress}%</span></div><div class="rkz-cycle-progress"><i style="width:${cycle.progress}%"></i></div></div>
        <div class="rkz-steps">${stepHtml}</div>
        <div class="rkz-cycle-stats">
          <div class="rkz-stat"><div><span>حالة اليوم</span><strong>${cycle.label}</strong></div><div class="rkz-stat-icon">${rkzSvg('play')}</div></div>
          <div class="rkz-stat"><div><span>الجاهزية</span><strong>${readiness==null?'—':Math.round(readiness)+' / 100'}</strong></div><div class="rkz-stat-icon gold">${rkzSvg('spark')}</div></div>
          <div class="rkz-stat"><div><span>الفريق</span><strong>${team.total?team.present+' / '+team.total+' حاضر':'—'}</strong></div><div class="rkz-stat-icon blue">${rkzSvg('users')}</div></div>
        </div>
        <button class="rkz-primary" onclick="rkzContinueCycle()">${cycle.buttonLabel} &nbsp; ‹</button>
      </div>
    </div>
    <div class="rkz-ai-bar"><div class="rkz-ai-brand">${rkzSvg('spark')}<div><b>ركيزة AI</b><span>مساعدك الذكي في إدارة وتشغيل المعرض</span></div></div><div class="rkz-ai-ask"><div class="rkz-ai-input" onclick="rkzNav('ai')">اسأل ركيزة: ما أهم شيء أركز عليه اليوم؟</div><button class="rkz-ai-btn" onclick="rkzNav('ai')">اسأل</button></div></div>
  </div>`;
  setNavByActiveView();
}

function install(){
  ensureStyle();ensureSidebar();document.body.classList.add('rkz-shell');
  window.renderHome=renderDashboard;
  const main=document.querySelector('main.app');
  if(main&&!main.dataset.rkzNavObserver){main.dataset.rkzNavObserver='1';new MutationObserver(setNavByActiveView).observe(main,{subtree:true,attributes:true,attributeFilter:['class']});}
  renderDashboard();setNavByActiveView();
  document.body.classList.remove('rkz-preload');
  document.getElementById('rkzBoot')?.remove();
}

let tries=0;const timer=setInterval(()=>{tries++;const a=safeApp();if(document.getElementById('home')&&a?.branch){clearInterval(timer);install()}else if(tries>80){clearInterval(timer);const t=document.getElementById('rkzBootText');if(t)t.textContent='تعذر تحميل بيانات ركيزة. حدّث الصفحة للمحاولة مرة أخرى.';}},125);
document.addEventListener('DOMContentLoaded',()=>{ensureStyle();ensureSidebar();document.body.classList.add('rkz-shell')});

})();
