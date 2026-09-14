(()=>{
'use strict';

const AI=window.RakizaAI=window.RakizaAI||{};
if(AI.voice?.version)return;

const VERSION='1.0.0';
const STATE={turn:0,lastLead:null,lastKind:null,lastDomain:null};

function norm(v){return String(v??'').replace(/\s+/g,' ').trim()}
function stripHtml(v){return norm(String(v??'').replace(/<br\s*\/?\s*>/gi,' ').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>'))}
function hasArabicConversationStart(t){return /^(تمام|اي |إي |ايوه|أيوه|فهمتك|فهمت عليك|واضح|حسب|اللي|هذا|هذي|لقيت|حصلت|ما لقيت|ما عندي|عندي|خلني|ابشر|أبشر)/.test(t)}
function classify(html){
  const t=stripHtml(html);
  if(/تعذر|خطأ|ما قدرت|غير متاح|غير جاهز/.test(t))return'error';
  if(/تقصد|باقي|اكتب الاسم|احتاج|أحتاج|وضح|توضيح|أي مجال|وش تبي/.test(t))return'clarify';
  if(/لا توجد|لم أجد|ما لقيت|لا يوجد|ما عندي.*بيانات|بيانات كافية/.test(t))return'no_data';
  if(/مسودة|جاهز.*مراجعة|تم تعديل|ثبتت الفترة|اكتمل الاسم/.test(t))return'draft';
  return'answer';
}

const LEADS={
  sales:['إي، هذا وضع المبيعات حسب المسجل عندي:','هذا اللي طلع لي من المبيعات:'],
  shortages:['إي، هذا اللي طلع لي من سجل النواقص:','هذا وضع النواقص حسب المسجل عندي:'],
  readiness:['هذا وضع الجاهزية حسب آخر بيانات مسجلة:','إي، هذا اللي ظاهر عندي في الجاهزية:'],
  attendance:['هذا وضع الفريق حسب البيانات المسجلة:','إي، هذا اللي طلع لي في الحضور والتواجد:'],
  tasks:['هذا وضع المهام حسب الخطة والتنفيذ المسجل:','إي، هذا اللي ظاهر عندي في مهام اليوم:'],
  actions:['هذا وضع المتابعات حسب السجل:','إي، هذا اللي طلع لي في الإجراءات والمتابعة:'],
  store:['هذا اللي أشوفه من الصورة كاملة:','إي، إذا جمعنا الصورة كاملة فهذا اللي ظاهر:'],
  generic:['إي، هذا اللي طلع لي:','هذا اللي عندي حاليًا:']
};
function chooseLead(domain){
  const arr=LEADS[domain]||LEADS.generic;
  let lead=arr[STATE.turn%arr.length];
  if(lead===STATE.lastLead)lead=arr[(STATE.turn+1)%arr.length];
  STATE.lastLead=lead;return lead;
}
function naturalize(html){
  let s=String(html??'');
  const reps=[
    [/فهمت طلبك وباقي عندي الاسم فقط\./g,'فهمتك، وباقي أحدد الاسم بس.'],
    [/أحتاج أحدد المجال فقط\./g,'فهمت جزء من طلبك، وباقي أعرف تقصد أي مجال.'],
    [/فهمت المجال، وباقي أعرف وش تبي أسوي بالضبط\./g,'تمام، فهمت المجال. باقي تقول لي وش تبي أسوي فيه بالضبط.'],
    [/تعذر إكمال هذه الخطوة الحوارية\./g,'فهمت عليك، لكن هالخطوة ما اكتملت معي الآن.'],
    [/تعذر توجيه الطلب في هذه المحاولة\./g,'ما قدرت أحدد المسار المناسب من كلامك.'],
    [/تمت معالجة الطلب بدون نتيجة قابلة للعرض\./g,'نفذت الطلب، لكن ما طلع عندي شيء أعرضه.'],
    [/لا توجد بيانات كافية للحكم/g,'المعلومات الموجودة عندي ما تكفي للحكم'],
    [/لا توجد نتائج/g,'ما لقيت نتائج'],
    [/لم أجد/g,'ما لقيت'],
    [/تعذر إكمال طلب ([^<.]+) في هذه المحاولة\./g,'واضح وش تبي في $1، لكن ما قدرت أكملها الآن.'],
    [/عزلت الخطأ داخل هذه الوحدة فقط؛ ركيزة AI ما توقف، وتقدر تكمل بسؤالك أو تنتقل لأي جزء آخر\./g,'المشكلة محصورة هنا، وتقدر تكمل معي عادي أو تسأل عن شيء ثاني.'],
    [/تمت استعادة مسار ركيزة AI ويمكنك المتابعة مباشرة\./g,'رجعت المسار، وتقدر تكمل من نفس النقطة.']
  ];
  for(const [a,b] of reps)s=s.replace(a,b);
  return s;
}
function shouldLead(kind,text,meta){
  if(meta?.noLead)return false;
  if(kind!=='answer')return false;
  if(!text)return false;
  if(hasArabicConversationStart(text))return false;
  if(text.length<28)return false;
  return true;
}
function present(html,meta={}){
  STATE.turn++;
  const domain=meta.domain||AI.conversation?.state?.context?.domain||AI.conversationUniversal?.state?.lastRoute||'generic';
  const cleaned=naturalize(html);
  const text=stripHtml(cleaned),kind=meta.kind||classify(cleaned);
  STATE.lastKind=kind;STATE.lastDomain=domain;
  if(!shouldLead(kind,text,meta))return cleaned;
  return `<div class="rakiza-conversational-lead" style="margin-bottom:7px"><b>${chooseLead(domain)}</b></div>${cleaned}`;
}
function clarify(question,known=''){
  const lead=known?`فهمتك إلى هنا: ${known}. `:'فهمت عليك إلى هنا. ';
  return `<b>${lead}${question}</b>`;
}
function limit(message,question=''){
  return `<div class="notice"><b>${message}</b>${question?`<div class="mut" style="margin-top:6px">${question}</div>`:''}</div>`;
}
function reset(){STATE.turn=0;STATE.lastLead=null;STATE.lastKind=null;STATE.lastDomain=null}

AI.voice={version:VERSION,state:STATE,profile:'arabic-white-saudi',present,naturalize,classify,stripHtml,clarify,limit,reset};
})();
