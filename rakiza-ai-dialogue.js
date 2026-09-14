(()=>{
'use strict';

const AI=window.RakizaAI=window.RakizaAI||{};
const C=AI.conversation;
if(!C||AI.dialogue?.version)return;

const VERSION='1.0.0';
const baseAsk=window.askRakizaAssistant;
const STATE={pending:null,lastCapability:null,lastRoster:null,turns:[]};
const MAX_HISTORY_WEEKS=52;

function norm(v){try{return typeof AI.normalize==='function'?AI.normalize(v):basicNorm(v)}catch{return basicNorm(v)}}
function basicNorm(v){return String(v??'').toLowerCase().replace(/[\u064B-\u065F\u0670]/g,'').replace(/ـ/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/ؤ/g,'و').replace(/ئ/g,'ي').replace(/[،,:;؛!?؟.()\[\]{}"']/g,' ').replace(/\s+/g,' ').trim()}
function esc(v){return String(v??'').replace(/[&<>\"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[m]))}
function clone(v){try{return JSON.parse(JSON.stringify(v))}catch{return v}}
function getApp(){try{return app}catch{return window.app||{}}}
function baseDate(){const a=getApp();return String(a.calendarDate||a.day?.work_date||a.date||new Date().toISOString().slice(0,10)).slice(0,10)}
function dObj(v){return new Date(String(v)+'T12:00:00')}
function iso(d){return d.toISOString().slice(0,10)}
function addDays(v,n){const d=dObj(v);d.setDate(d.getDate()+n);return iso(d)}
function sunday(v){const d=dObj(v);d.setDate(d.getDate()-d.getDay());return iso(d)}
function weekPeriod(start,label=null){return{type:'week',start,end:addDays(start,6),label:label||`أسبوع ${start}`}}
function employees(){return(getApp().employees||[]).filter(e=>e&&e.active!==false)}
function employeeName(e){return e?.full_name||e?.name||''}
function employeeById(id){return employees().find(e=>String(e.id)===String(id))||null}
function rowEmployeeId(r){return r?.employee_id||r?.employees?.id||null}
function rowEmployeeName(r){return r?.employees?.full_name||employeeName(employeeById(rowEmployeeId(r)))||'غير معروف'}
function statusLabel(v){return C.statusLabel?C.statusLabel(v):v||'غير محدد'}
function chat(role,html){const c=document.getElementById('assistantChat');if(!c)return;const mine=role==='user';c.insertAdjacentHTML('beforeend',`<div style="display:flex;justify-content:${mine?'flex-start':'flex-end'}"><div class="task" style="max-width:92%;margin:0;background:${mine?'#eef3f8':'#fff'};border-color:${mine?'#d6e0ea':'#e3e7ec'}">${html}</div></div>`);c.lastElementChild?.scrollIntoView?.({behavior:'smooth',block:'nearest'})}
function record(kind,text,data={}){STATE.turns.push({at:new Date().toISOString(),kind,text:String(text||''),...clone(data)});if(STATE.turns.length>80)STATE.turns.splice(0,STATE.turns.length-80)}
function periodFromText(text){try{return C.interpret(text,{raw:text,entities:{}})?.period||null}catch{return null}}
function currentDraft(){return C.state?.pending?.draft?.kind==='roster'?C.state.pending.draft:null}
function isRosterText(n){return /تواجد|روستر|جدول دوام|خطه دوام|خطة دوام/.test(n)}
function isPeriodOnly(n){return /^(هذا|هاذا|هال|ال)?\s*(ال)?اسبوع|^(ال)?اسبوع (الحالي|الجاي|القادم|الماضي|السابق)|^هذا الاسبوع الحالي$/.test(n)}
function wantsRosterDraft(n){return /مسود|حوّل|حول|تحويل|جهز|سوي|انش|ابني/.test(n)&&(isRosterText(n)||/هذه|هذي|ها|نفسها|الخطة|الخطه/.test(n))}
function historyDirection(n){if(/اقدم|الأقدم|قديمه|قديمة|اول خطه|اول خطة/.test(n))return'oldest';if(/اخر خطه|آخر خطة|احدث|الأحدث|اخر تواجد|آخر تواجد|تم تسجيلها|مسجله|مسجلة/.test(n))return'latest';if(STATE.lastCapability==='roster_history'&&/^(اقدم|الأقدم|احدث|الأحدث|اخر|آخر)(?: خطه| خطة)?$/.test(n))return/اقدم|الأقدم/.test(n)?'oldest':'latest';return null}
function rosterHistoryQuestion(n){return historyDirection(n)&&((isRosterText(n)||/خطه|خطة/.test(n))||STATE.lastCapability==='roster_history')}
function capabilityQuestion(n){return /ماذا تقدر|وش تقدر|ايش تقدر|وش تسوي|ايش تسوي|قدراتك|وش تقدر تسوي/.test(n)}

function draftWithPeriod(draft,period){const next=clone(draft);next.period=clone(period);next.updatedAt=new Date().toISOString();next.approvedInConversation=false;return next}
function setDraft(draft){C.state.pending=C.state.pending||{};C.state.pending.draft=draft;C.state.pending.question=C.nextClarification?C.nextClarification(draft):null;C.state.context=C.state.context||{};C.state.context.domain='attendance';C.state.context.period=clone(draft.period);STATE.lastCapability='roster_draft';return draft}
function renderDraft(draft){return C.renderRosterDraft?C.renderRosterDraft(draft):'<b>مسودة خطة التواجد جاهزة للمراجعة.</b>'}

function mostCommonWorkStatus(rows){const m=new Map();for(const r of rows){if(!['Morning','Evening'].includes(r.planned_status))continue;m.set(r.planned_status,(m.get(r.planned_status)||0)+1)}return[...m.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0]||null}
function rosterRowsToDraft(rows,targetPeriod,sourcePeriod){const by=new Map();for(const r of rows){const id=rowEmployeeId(r);if(!id)continue;if(!by.has(id))by.set(id,[]);by.get(id).push(r)}const assignments=[];for(const [id,arr] of by){arr.sort((a,b)=>String(a.work_date).localeCompare(String(b.work_date)));const base=mostCommonWorkStatus(arr);const overrides={};for(const r of arr){const day=dObj(r.work_date).getDay();if(!base||r.planned_status!==base)overrides[day]=r.planned_status}const e=employeeById(id);assignments.push({id:`history-${id}`,resolved:true,employee_id:id,employee:e||null,mention:e?employeeName(e):rowEmployeeName(arr[0]),candidates:e?[e]:[],defaultStatus:base,overrides,source:`من الخطة المحفوظة ${sourcePeriod?.start||''}`})}return{kind:'roster',status:'draft',period:clone(targetPeriod||sourcePeriod),assignments,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),approvedInConversation:false,source:{type:'saved_roster',period:clone(sourcePeriod)}}}

function rosterRowsHtml(result,title){const grouped=new Map();for(const r of result.rows){const d=String(r.work_date||'');if(!grouped.has(d))grouped.set(d,[]);grouped.get(d).push(r)}let h=`<b>${esc(title)} — ${esc(result.period.start)} إلى ${esc(result.period.end)}</b><div style="margin-top:8px">`;for(const [d,rows] of grouped){h+=`<div class="task"><b>${esc(d)}</b><div class="mut" style="margin-top:5px">${rows.map(r=>`${esc(rowEmployeeName(r))}: ${esc(statusLabel(r.planned_status))}`).join(' • ')}</div></div>`}h+='</div>';return h}
async function rosterRowsForWeek(start){const fn=AI.attendance?.rosterEntriesForPeriod;if(typeof fn!=='function')throw Error('قراءة أرشيف خطة التواجد غير متاحة');return await fn(weekPeriod(start))}
async function findRoster(direction){const current=sunday(baseDate()),found=[];for(let offset=0;offset<MAX_HISTORY_WEEKS;offset+=6){const batch=[];for(let i=0;i<6&&offset+i<MAX_HISTORY_WEEKS;i++){const start=addDays(current,-7*(offset+i));batch.push({start,promise:rosterRowsForWeek(start).catch(()=>[])})}const results=await Promise.all(batch.map(x=>x.promise));for(let i=0;i<batch.length;i++){if(results[i]?.length){const item={period:weekPeriod(batch[i].start),rows:results[i]};if(direction==='latest')return item;found.push(item)}}}return direction==='oldest'?found[found.length-1]||null:found[0]||null}

function capabilityHtml(){const draft=currentDraft();let h='<b>أقدر أكمل معك حواريًا، مو مجرد أفهم النص.</b><div style="margin-top:7px">';h+='أقدر أبني وأعدل مسودة خطة التواجد، أحدد أسبوعها، أسترجع آخر أو أقدم خطة محفوظة ضمن الأرشيف المتاح، وأحوّل الخطة المحفوظة لمسودة جديدة للمراجعة. وإذا نقصني جزء واحد أسألك عنه وأحتفظ بكل اللي فهمته.</div>';if(draft)h+='<div class="notice ok" style="margin-top:8px">وعندي الآن مسودة خطة تواجد في السياق؛ أقدر أكمل عليها مباشرة.</div>';h+='<div class="mut" style="margin-top:8px">الحفظ التشغيلي الفعلي يبقى منفصلًا ولا يتم باجتهاد مني.</div>';return h}

function optionsHtml(stage){if(stage==='domain')return'<b>أحتاج أحدد المجال فقط.</b><div class="mut" style="margin-top:6px">تقصد المبيعات، النواقص، الجاهزية، الحضور والتواجد، المهام، الإجراءات، أو تحليل المعرض كامل؟</div>';if(stage==='operation')return'<b>فهمت المجال، وباقي أعرف وش تبي أسوي بالضبط.</b><div class="mut" style="margin-top:6px">تبغاني أعرض المعلومات، أحللها، أقارنها، أو أجهز لك مسودة؟</div>';if(stage==='roster_period')return'<b>المسودة جاهزة عندي، وباقي الأسبوع فقط.</b><div class="mut" style="margin-top:6px">تقصد هذا الأسبوع، الأسبوع القادم، أو أسبوع ثاني؟</div>';return'<b>أحتاج توضيح نقطة واحدة عشان أكمل معك.</b>'}
function startPending(stage,original,extra={}){STATE.pending={stage,original:String(original||''),attempts:0,...clone(extra)};return optionsHtml(stage)}
function clearPending(){STATE.pending=null}
function intentFor(text){try{return AI.intent?.infer?AI.intent.infer(text,{}):null}catch{return null}}
function domainFromReply(n){if(/مبيعات|بيع|تارقت|هدف/.test(n))return'sales';if(/نواقص|نقص|صنف|مخزون/.test(n))return'shortages';if(/جاهزي|نظافه|شبكه|مكيف/.test(n))return'readiness';if(/حضور|تواجد|دوام|شفت|روستر/.test(n))return'attendance';if(/مهام|مهمه|استلام|تحويل/.test(n))return'tasks';if(/اجراء|متابعه|تصعيد|صيانه/.test(n))return'actions';if(/المعرض كامل|تحليل شامل|الوضع العام|كل شي/.test(n))return'store';return null}
function operationFromReply(n){if(/اعرض|ورني|عطني|استفسار/.test(n))return'query';if(/حلل|تحليل|فسر/.test(n))return'analyze';if(/قارن|مقارنه/.test(n))return'compare';if(/مسود|جهز|سوي|انش/.test(n))return'create';return null}
function domainCue(d){return{sales:'المبيعات',shortages:'النواقص',readiness:'الجاهزية',attendance:'خطة التواجد',tasks:'المهام',actions:'الإجراءات والمتابعة',store:'تحليل المعرض'}[d]||d||''}

async function handlePending(text){const p=STATE.pending;if(!p)return null;p.attempts=(p.attempts||0)+1;const n=norm(text);
  if(p.stage==='roster_period'){const period=periodFromText(text);if(period?.type==='week'){const d=setDraft(draftWithPeriod(p.draft||currentDraft(),period));clearPending();return`<div class="notice ok"><b>تمام، ثبتت الفترة على ${esc(period.label||period.start)}.</b></div>${renderDraft(d)}`}return optionsHtml('roster_period')}
  if(p.stage==='domain'){const d=domainFromReply(n);if(d){const hist=d==='attendance'?historyDirection(n):null,op=operationFromReply(n);record('clarification',text,{resolvedDomain:d});if(hist){clearPending();return{reprocess:`${hist==='oldest'?'اقدم':'اخر'} خطة تواجد تم تسجيلها`}}if(op){const combined=`${p.original} ${domainCue(d)} ${text}`;clearPending();return{reprocess:combined}}STATE.pending={stage:'operation',original:p.original,attempts:0,domain:d};return optionsHtml('operation')}if(p.attempts>=3)return'<b>ما زال المجال غير واضح عندي.</b><div class="mut" style="margin-top:6px">اكتب اسم المجال فقط، مثل «المبيعات» أو «خطة التواجد»، وأنا أكمل نفس الطلب بدون ما تعيده.</div>';return optionsHtml('domain')}
  if(p.stage==='operation'){if(p.domain==='attendance'){const hist=historyDirection(n);if(hist){clearPending();record('clarification',text,{resolvedOperation:'roster_history',direction:hist});return{reprocess:`${hist==='oldest'?'اقدم':'اخر'} خطة تواجد تم تسجيلها`}}}const op=operationFromReply(n);if(op){const combined=`${p.original} ${domainCue(p.domain)} ${text}`;clearPending();record('clarification',text,{resolvedOperation:op});return{reprocess:combined}}if(p.attempts>=3)return'<b>ما زال المطلوب نفسه غير واضح.</b><div class="mut" style="margin-top:6px">قل فقط: «اعرض»، «حلل»، «قارن»، أو «جهز مسودة»، وبكمل على نفس الموضوع.</div>';return optionsHtml('operation')}
  clearPending();return null
}

async function handleRosterConversation(q,n){const draft=currentDraft();
  if(capabilityQuestion(n)&&((draft)||C.state?.context?.domain==='attendance'||STATE.lastCapability?.startsWith('roster')))return capabilityHtml();
  if(draft&&isPeriodOnly(n)){const p=periodFromText(q);if(p?.type==='week'){const d=setDraft(draftWithPeriod(draft,p));return`<div class="notice ok"><b>تمام، ربطت المسودة بـ${esc(p.label||'الأسبوع المحدد')}.</b></div>${renderDraft(d)}`}}
  const direction=historyDirection(n);if(rosterHistoryQuestion(n)){const r=await findRoster(direction);STATE.lastCapability='roster_history';STATE.lastRoster=r;if(!r)return`<b>ما وجدت خطة تواجد محفوظة ضمن آخر ${MAX_HISTORY_WEEKS} أسبوعًا.</b><div class="mut" style="margin-top:6px">إذا تبي أوسّع نطاق البحث أقدر أكمل معك.</div>`;return rosterRowsHtml(r,direction==='oldest'?'أقدم خطة تواجد محفوظة وجدتها':'آخر خطة تواجد محفوظة')}
  if(wantsRosterDraft(n)){
    const target=periodFromText(q)||draft?.period||C.state?.context?.period||null;
    if(draft){const d=setDraft(target?draftWithPeriod(draft,target):draft);if(!d.period){STATE.pending={stage:'roster_period',original:q,attempts:0,draft:clone(d)};return`${renderDraft(d)}${optionsHtml('roster_period')}`}return renderDraft(d)}
    if(STATE.lastRoster?.rows?.length){const d=setDraft(rosterRowsToDraft(STATE.lastRoster.rows,target||STATE.lastRoster.period,STATE.lastRoster.period));return`<div class="notice ok"><b>حوّلت الخطة المحفوظة إلى مسودة حوارية للمراجعة.</b></div>${renderDraft(d)}`}
    return startPending('operation',q,{domain:'attendance',hint:'roster'})
  }
  return null
}

async function process(q,{alreadyChatted=false}={}){const n=norm(q);
  if(STATE.pending){const r=await handlePending(q);if(r?.reprocess)return process(r.reprocess,{alreadyChatted:true});if(r)return r}
  const roster=await handleRosterConversation(q,n);if(roster)return roster;
  const intent=intentFor(q);
  if(intent&&(!intent.domain||intent.confidence<0.42)&&!/^\s*(السلام|هلا|مرحبا|شكرا|تمام|ممتاز)/.test(n))return startPending('domain',q,{intent:clone(intent)});
  if(intent?.domain&&intent.operation==='conversation'&&!capabilityQuestion(n))return startPending('operation',q,{domain:intent.domain,intent:clone(intent)});
  return null
}

const wrapped=async function(){const inp=document.getElementById('assistantInput'),q=inp?.value?.trim();if(!q)return;let handled=null;try{handled=await process(q)}catch(e){console.error('Rakiza dialogue capability error',e);handled='<div class="notice err"><b>تعطل جزء من المحادثة، لكن السياق محفوظ.</b><div style="margin-top:5px">قل لي وش كنت تبي أصل له، وبكمل معك من نفس النقطة.</div></div>'}if(handled==null){if(typeof baseAsk==='function')return baseAsk.apply(this,arguments);return}if(inp)inp.value='';chat('user',esc(q));chat('assistant',handled);record('handled',q,{capability:STATE.lastCapability,pending:STATE.pending?.stage||null})};
wrapped.__rakizaDialogueWrapped=true;wrapped.__base=baseAsk;window.askRakizaAssistant=wrapped;

AI.dialogue={version:VERSION,state:STATE,process,findRoster,rosterRowsToDraft,capabilityHtml,reset(){STATE.pending=null;STATE.lastCapability=null;STATE.lastRoster=null;STATE.turns=[]}};
})();
