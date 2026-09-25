(()=>{'use strict';
const VERSION='20260925-visual-identity-v1';
const css=`
:root{
  --n:#0F2747!important;
  --n2:#173B64!important;
  --g:#D4A853!important;
  --bg:#FAFBFD!important;
  --line:#E5EBF2!important;
  --mut:#667085!important;
  --gr:#22C55E!important;
  --ye:#F59E0B!important;
  --re:#EF4444!important;
  --rkz-primary:#0F2747;
  --rkz-primary-2:#173B64;
  --rkz-gold:#D4A853;
  --rkz-gold-2:#E0B866;
  --rkz-white:#FAFBFD;
  --rkz-surface:#FFFFFF;
  --rkz-line:#E5EBF2;
  --rkz-text:#14233A;
  --rkz-muted:#667085;
  --rkz-success:#22C55E;
  --rkz-info:#3B82F6;
  --rkz-danger:#EF4444;
  --rkz-warning:#F59E0B;
}
html,body,button,input,select,textarea{font-family:"Tajawal","Segoe UI",Tahoma,Arial,sans-serif!important}
body{background:var(--rkz-white)!important;color:var(--rkz-text)!important}
body.rkz-shell{background:linear-gradient(180deg,#F8FAFD 0%,#FAFBFD 100%)!important;color:var(--rkz-text)!important}

/* Core page surfaces */
.top{
  background:
    linear-gradient(135deg,rgba(255,255,255,.025),rgba(255,255,255,0)),
    linear-gradient(135deg,var(--rkz-primary),var(--rkz-primary-2))!important;
  color:#fff!important;
  border:1px solid rgba(255,255,255,.07)!important;
  box-shadow:0 10px 28px rgba(15,39,71,.14)!important;
}
.brand{font-weight:800!important;letter-spacing:-.3px}
.sub{color:#DCE7F3!important;opacity:1!important}
.card,.tile,.metric,.choice,.task,.modal{
  background:var(--rkz-surface)!important;
  border-color:var(--rkz-line)!important;
  box-shadow:0 5px 18px rgba(15,39,71,.045)!important;
}
.tile:hover{border-color:#D6DFE9!important;box-shadow:0 8px 22px rgba(15,39,71,.07)!important}
.title{color:var(--rkz-primary)!important;font-weight:800!important}
.mut{color:var(--rkz-muted)!important}
.btn{
  background:var(--rkz-primary)!important;
  color:#fff!important;
  border-radius:10px!important;
  font-weight:800!important;
  box-shadow:0 4px 12px rgba(15,39,71,.10)!important;
}
.btn:hover{filter:brightness(1.06)}
.btn.gold{background:linear-gradient(135deg,var(--rkz-gold),var(--rkz-gold-2))!important;color:#fff!important}
.btn.ghost{background:#F1F5F9!important;color:var(--rkz-primary)!important;box-shadow:none!important;border:1px solid var(--rkz-line)!important}
.btn.danger{background:var(--rkz-danger)!important}
.mini{border-color:var(--rkz-line)!important;color:var(--rkz-primary)!important}
.fixedChoices .mini.on,.step.on{background:var(--rkz-primary)!important;border-color:var(--rkz-primary)!important;color:#fff!important}
.field input,.field select,.field textarea,.roster select,.roster input{
  border-color:#D8E1EB!important;
  border-radius:9px!important;
  color:var(--rkz-text)!important;
}
.field input:focus,.field select:focus,.field textarea:focus{
  outline:none!important;border-color:#9CB0C7!important;box-shadow:0 0 0 3px rgba(59,130,246,.08)!important
}
.cat{border-color:var(--rkz-line)!important}
.cathead{background:#F3F6FA!important;color:var(--rkz-primary)!important}
.notice{background:#FFF6DF!important;color:#8A5A00!important}
.notice.err{background:#FFF0F0!important;color:#B42318!important}
.notice.ok{background:#ECFDF3!important;color:#187A43!important}
.chip{background:#F2F5F8!important;color:var(--rkz-primary)!important}
table th{color:#475467!important;background:#F7F9FC}
table td{color:#344054}
table th,table td{border-bottom-color:var(--rkz-line)!important}

/* Boot */
#rkzBoot{background:#F8FAFD!important}
.rkz-boot-card{border-color:var(--rkz-line)!important;box-shadow:0 18px 50px rgba(15,39,71,.10)!important}
.rkz-boot-mark{background:linear-gradient(135deg,var(--rkz-primary),var(--rkz-primary-2))!important;color:var(--rkz-gold)!important}
.rkz-boot-title{color:var(--rkz-primary)!important}

/* Sidebar brand shell */
#rkzSidebar{
  background:
    radial-gradient(circle at 20% 0%,rgba(212,168,83,.08),transparent 28%),
    linear-gradient(180deg,#0B203A 0%,#0F2747 58%,#0B203A 100%)!important;
  border-left-color:rgba(255,255,255,.06)!important;
  box-shadow:-8px 0 28px rgba(15,39,71,.12)!important;
}
.rkz-side-brand{
  border-bottom-color:rgba(255,255,255,.10)!important;
  display:flex!important;
  align-items:center!important;
  gap:10px!important;
  padding:4px 7px 17px!important;
}
.rkz-brand-mark{width:48px;height:48px;flex:0 0 48px;filter:drop-shadow(0 4px 10px rgba(212,168,83,.18))}
.rkz-brand-mark svg{width:100%;height:100%;display:block}
.rkz-brand-copy b{display:block!important;color:#fff!important;font-size:31px!important;line-height:1!important;font-weight:800!important}
.rkz-brand-copy span{display:block!important;color:#B7C5D6!important;font-size:11px!important;margin-top:6px!important}
.rkz-side-btn{
  color:#D9E4EF!important;
  font-weight:700!important;
  border:1px solid transparent!important;
}
.rkz-side-btn svg{color:#D9E4EF!important}
.rkz-side-btn:hover{background:rgba(255,255,255,.07)!important;color:#fff!important}
.rkz-side-btn.on{
  background:linear-gradient(135deg,#B98A31,var(--rkz-gold))!important;
  color:#fff!important;
  border-color:#E2BD71!important;
  box-shadow:0 8px 20px rgba(164,119,34,.26)!important;
}
.rkz-side-btn.on svg{color:#fff!important}
.rkz-side-foot{color:#8193A8!important;border-top:1px solid rgba(255,255,255,.06);padding-top:14px!important}

/* Executive home */
.rkz-home-top{
  background:
    linear-gradient(135deg,rgba(255,255,255,.02),rgba(255,255,255,0)),
    linear-gradient(135deg,var(--rkz-primary),var(--rkz-primary-2))!important;
  border-color:rgba(255,255,255,.07)!important;
  box-shadow:0 10px 28px rgba(15,39,71,.14)!important;
}
.rkz-date-line,.rkz-user-text b{color:#fff!important}
.rkz-user-text span{color:#C3D1DF!important}
.rkz-date-line svg{color:var(--rkz-gold)!important}
.rkz-avatar{background:#294C71!important;color:#fff!important;border:1px solid rgba(255,255,255,.14)!important}
.rkz-ai-top{background:linear-gradient(135deg,var(--rkz-gold),var(--rkz-gold-2))!important;color:#fff!important}
.rkz-kpi,.rkz-panel{
  background:#fff!important;
  border-color:var(--rkz-line)!important;
  box-shadow:0 5px 18px rgba(15,39,71,.045)!important;
}
.rkz-kpi-head,.rkz-panel-title h2,.rkz-kpi strong,.rkz-stat strong{color:var(--rkz-primary)!important}
.rkz-kpi-icon{background:#EEF4FA!important;color:var(--rkz-primary)!important}
.rkz-kpi:nth-child(1) .rkz-kpi-icon{background:#EEF4FA!important;color:var(--rkz-primary)!important}
.rkz-kpi:nth-child(2) .rkz-kpi-icon{background:#FFF5DE!important;color:#B47C12!important}
.rkz-kpi:nth-child(3) .rkz-kpi-icon{background:#EAF2FF!important;color:var(--rkz-info)!important}
.rkz-kpi:nth-child(4),.rkz-kpi.sales{background:linear-gradient(180deg,#fff,#F3FCF6)!important}
.rkz-kpi:nth-child(4) .rkz-kpi-icon{background:#E8F9EF!important;color:#169B4E!important}
.rkz-bar{background:#E9EEF4!important}
.rkz-bar i{background:linear-gradient(90deg,#C89A3E,var(--rkz-gold))!important}
.rkz-kpi.sales .rkz-bar i{background:linear-gradient(90deg,#53D083,var(--rkz-success))!important}
.rkz-cycle-progress i{background:linear-gradient(90deg,var(--rkz-primary),var(--rkz-gold))!important}
.rkz-step.done .rkz-step-dot{background:var(--rkz-primary)!important}
.rkz-step.current .rkz-step-dot{background:var(--rkz-gold)!important;box-shadow:0 0 0 5px rgba(212,168,83,.15)!important}
.rkz-primary{background:linear-gradient(135deg,#BF9139,var(--rkz-gold))!important}
.rkz-ai-bar{
  background:
    linear-gradient(125deg,rgba(212,168,83,.06),transparent 35%),
    linear-gradient(110deg,#0C2644,#16436D)!important;
  box-shadow:0 10px 26px rgba(15,39,71,.14)!important
}
.rkz-ai-brand svg{color:#F2C768!important}
.rkz-ai-btn{background:var(--rkz-gold)!important;color:#fff!important}
.rkz-alert-icon.red{background:#FFF0F0!important;color:var(--rkz-danger)!important}
.rkz-alert-icon.amber{background:#FFF4DB!important;color:var(--rkz-warning)!important}
.rkz-alert-icon.blue{background:#EAF2FF!important;color:var(--rkz-info)!important}
.rkz-okbox{background:#ECFDF3!important;border-color:#CDEFD9!important;color:#187A43!important}

/* Reports */
.rkz-report-tabs,.rkz-month-archive{
  border-color:var(--rkz-line)!important;
  box-shadow:0 4px 15px rgba(15,39,71,.035)!important
}
.rkz-report-tab{background:#F1F5F9!important;color:var(--rkz-primary)!important}
.rkz-report-tab.on{background:var(--rkz-primary)!important;color:#fff!important;box-shadow:none!important}
.rkz-month-btn{background:#fff!important;color:var(--rkz-primary)!important;border-color:var(--rkz-line)!important}
.rkz-month-btn.on{background:var(--rkz-gold)!important;border-color:var(--rkz-gold)!important;color:#fff!important}
.rkz-week-btn.on{background:var(--rkz-primary)!important;border-color:var(--rkz-primary)!important;color:#fff!important}

/* Weekly */
#weeklyPerformance{--w-n:var(--rkz-primary)!important;--w-ok:var(--rkz-success)!important;--w-bad:var(--rkz-danger)!important;--w-line:var(--rkz-line)!important}
.wp-kpi,.wp-card{border-color:var(--rkz-line)!important;box-shadow:0 5px 18px rgba(15,39,71,.045)!important}
.wp-kpi.good{background:#ECFDF3!important;border-color:#CDEFD9!important}
.wp-kpi.bad{background:#FFF1F1!important;border-color:#F8D0D0!important}
.wp-segment-badge{background:#EEF4FA!important;color:var(--rkz-primary)!important}
.wp-warn{background:#FFF5DD!important;color:#845600!important}
.wp-star{background:linear-gradient(135deg,#FFF8E9,#fff)!important;border-color:#E8D39F!important}

/* Monthly */
#monthlyPerformance{--n:var(--rkz-primary)!important;--ok:var(--rkz-success)!important;--bad:var(--rkz-danger)!important;--l:var(--rkz-line)!important}
.mpk,.mpb{border-color:var(--rkz-line)!important;box-shadow:0 5px 18px rgba(15,39,71,.045)!important}
.mpk.good{background:#ECFDF3!important}.mpk.bad{background:#FFF1F1!important}
.mpstar{background:#FFF8E9!important;border-color:#E8D39F!important}
.mpx{background:#FFF5DD!important;color:#845600!important}

/* Follow-up center */
#followupCenter{--fc-n:var(--rkz-primary)!important;--fc-n2:var(--rkz-primary-2)!important;--fc-g:var(--rkz-gold)!important;--fc-line:var(--rkz-line)!important;--fc-bg:var(--rkz-white)!important}
.fc-hero{background:linear-gradient(135deg,var(--rkz-primary),var(--rkz-primary-2))!important}
.fc-target{border-color:var(--rkz-gold)!important;color:#F1C55F!important}
.fc-panel,.fc-att,.fc-dist,.fc-stat{border-color:var(--rkz-line)!important;box-shadow:0 5px 18px rgba(15,39,71,.045)!important}
.fc-filter.on{background:var(--rkz-primary)!important;border-color:var(--rkz-primary)!important}
.fc-filter.late.on{background:var(--rkz-danger)!important;border-color:var(--rkz-danger)!important}
.fc-type.short{background:#FFF1D3!important;color:#AE7000!important}
.fc-type.maint{background:#FFE5E5!important;color:#C82828!important}
.fc-type.action{background:#E6F0FF!important;color:#2366B1!important}
.fc-status.new,.fc-status.work{background:#E6F0FF!important;color:#2366B1!important}
.fc-status.follow{background:#FFF1D3!important;color:#956100!important}
.fc-status.late{background:#FFE5E5!important;color:#C82828!important}
.fc-status.verify{background:#E8F8EE!important;color:#187A43!important}
.fc-priority.high{background:#FFE5E5!important;color:#C82828!important}
.fc-priority.mid{background:#FFF1D3!important;color:#956100!important}
.fc-priority.low{background:#E8F8EE!important;color:#187A43!important}
.fc-open{background:var(--rkz-primary)!important}
.fc-rank{background:var(--rkz-danger)!important}

/* Global status utility */
.gr{color:var(--rkz-success)!important}.ye{color:var(--rkz-warning)!important}.re{color:var(--rkz-danger)!important}
.critical{color:var(--rkz-danger)!important}

/* Footer */
body.rkz-shell #rakizaCopyright{color:#8390A1!important}

/* Preserve responsive geometry; only visual adjustments */
@media(max-width:900px){
  #rkzSidebar{background:linear-gradient(135deg,#0B203A,#0F2747)!important}
  .rkz-side-brand{border-bottom-color:rgba(255,255,255,.08)!important}
  .rkz-brand-mark{width:38px;height:38px;flex-basis:38px}
  .rkz-brand-copy b{font-size:25px!important}
  .rkz-brand-copy span{font-size:10px!important}
}
@media (orientation:landscape) and (min-width:700px){
  #rkzSidebar{background:linear-gradient(180deg,#0B203A 0%,#0F2747 58%,#0B203A 100%)!important}
  .rkz-side-brand{display:flex!important;align-items:center!important;gap:10px!important;padding:4px 7px 17px!important}
  .rkz-brand-mark{width:44px;height:44px;flex-basis:44px}
  .rkz-brand-copy b{font-size:29px!important}
}
`;

function brandMark(){
  return '<div class="rkz-brand-mark" aria-hidden="true"><svg viewBox="0 0 48 48" fill="none"><path d="M24 3.8 41.5 13.9v20.2L24 44.2 6.5 34.1V13.9L24 3.8Z" stroke="#D4A853" stroke-width="2.8"/><path d="m24 12 10 5.8v11.4L24 35 14 29.2V17.8L24 12Z" stroke="#D4A853" stroke-width="2.4"/><path d="M24 12v11.5m0 0L14 17.8m10 5.7 10-5.7M24 23.5V35" stroke="#D4A853" stroke-width="2.1"/><circle cx="24" cy="23.5" r="3.4" fill="#D4A853"/></svg></div>';
}
function applyBrand(){
  const b=document.querySelector('.rkz-side-brand');
  if(b&&!b.dataset.identity){
    b.dataset.identity='1';
    b.innerHTML=brandMark()+'<div class="rkz-brand-copy"><b>ركيزة</b><span>إدارة وتشغيل المعارض</span></div>';
  }
  const meta=document.querySelector('meta[name="theme-color"]');if(meta)meta.setAttribute('content','#0F2747');
}
function install(){
  if(!document.getElementById('rkzVisualIdentityStyle')){
    const s=document.createElement('style');s.id='rkzVisualIdentityStyle';s.textContent=css;document.head.appendChild(s);
  }
  applyBrand();
  const mo=new MutationObserver(()=>applyBrand());mo.observe(document.body,{childList:true,subtree:true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',install);else install();
window.RakizaVisualIdentity={VERSION};
})();