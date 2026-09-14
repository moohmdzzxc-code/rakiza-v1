(()=>{
'use strict';

const AI=window.RakizaAI=window.RakizaAI||{};
if(AI.voice?.version)return;

const VERSION='1.1.0';
const STATE={turn:0,lastLead:null,lastKind:null,lastDomain:null};

function norm(v){return String(v??'').replace(/\s+/g,' ').trim()}
function stripHtml(v){return norm(String(v??'').replace(/<br\s*\/?\s*>/gi,' ').replace(/<[^>]*>/g,' ').replace(/&nbsp;/g,' ').replace(/&amp;/g,'&').replace(/&lt;/g,'<').replace(/&gt;/g,'>'))}
function hasNaturalStart(t){return /^(واضح|بحسب|وفق|هذه|هذا|الصورة|البيانات|وجدت|وجدتها|لم أجد|لا توجد|المعلومات|المجال|المقصود|الخطة|المسودة|آخر|أقدم|حاليًا|حالياً)/.test(t)}
function classify(html){
  const t=stripHtml(html);
  if(/تعذر|خطأ|ما قدرت|غير متاح|غير جاهز|لم أتمكن/.test(t))return'error';
  if(/تقصد|باقي|بقي|اكتب الاسم|احتاج|أحتاج|وضح|توضيح|أي مجال|وش تبي|تحديد/.test(t))return'clarify';
  if(/لا توجد|لم أجد|ما لقيت|لا يوجد|ما عندي.*بيانات|بيانات كافية|لا تكفي/.test(t))return'no_data';
  if(/مسودة|جاهز.*مراجعة|تم تعديل|ثبتت الفترة|اكتمل الاسم/.test(t))return'draft';
  return'answer';
}

const LEADS={
  sales:['بحسب البيانات المسجلة، هذه صورة المبيعات:','ملخص المبيعات وفق البيانات الحالية:'],
  shortages:['بحسب سجل النواقص، هذه أبرز النتائج:','هذه صورة النواقص وفق السجل الحالي:'],
  readiness:['بحسب آخر بيانات الجاهزية المسجلة:','هذه حالة الجاهزية وفق البيانات الحالية:'],
  attendance:['بحسب بيانات الحضور والتواجد المسجلة:','هذه حالة الفريق وفق البيانات المتاحة:'],
  tasks:['بحسب خطة اليوم والتنفيذ المسجل:','هذه حالة المهام وفق ما هو مسجل:'],
  actions:['بحسب سجل الإجراءات والمتابعة:','هذه حالة المتابعات وفق السجل الحالي:'],
  store:['بعد جمع البيانات المتاحة، هذه الصورة العامة:','الصورة العامة وفق البيانات المسجلة تشير إلى الآتي:'],
  generic:['بحسب البيانات المتاحة:','هذه النتيجة وفق ما هو مسجل:']
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
    [/فهمت طلبك وباقي عندي الاسم فقط\./g,'واضح المقصود، بقي فقط تحديد الموظف حتى أكمل الطلب بدقة.'],
    [/فهمتك، وباقي أحدد الاسم بس\./g,'واضح المقصود، بقي فقط تحديد الموظف حتى أكمل الطلب بدقة.'],
    [/أحتاج أحدد المجال فقط\./g,'وصلني جزء من المطلوب، وبقي تحديد المجال حتى أكمل بشكل صحيح.'],
    [/فهمت جزء من طلبك، وباقي أعرف تقصد أي مجال\./g,'وصلني جزء من المطلوب، وبقي تحديد المجال حتى أكمل بشكل صحيح.'],
    [/فهمت المجال، وباقي أعرف وش تبي أسوي بالضبط\./g,'المجال واضح، وبقي تحديد المطلوب: عرض المعلومات، تحليلها، مقارنتها، أو إعداد مسودة.'],
    [/تمام، فهمت المجال\. باقي تقول لي وش تبي أسوي فيه بالضبط\./g,'المجال واضح، وبقي تحديد المطلوب: عرض المعلومات، تحليلها، مقارنتها، أو إعداد مسودة.'],
    [/تعذر إكمال هذه الخطوة الحوارية\./g,'لم أتمكن من إكمال هذه الجزئية حاليًا.'],
    [/فهمت عليك، لكن هالخطوة ما اكتملت معي الآن\./g,'لم أتمكن من إكمال هذه الجزئية حاليًا.'],
    [/تعذر توجيه الطلب في هذه المحاولة\./g,'المقصود غير مكتمل لدي بعد؛ أحتاج تحديد المجال أو المطلوب حتى أكمل معك.'],
    [/ما قدرت أحدد المسار المناسب من كلامك\./g,'المقصود غير مكتمل لدي بعد؛ أحتاج تحديد المجال أو المطلوب حتى أكمل معك.'],
    [/تمت معالجة الطلب بدون نتيجة قابلة للعرض\./g,'اكتملت المعالجة، لكن لا توجد نتيجة قابلة للعرض حاليًا.'],
    [/نفذت الطلب، لكن ما طلع عندي شيء أعرضه\./g,'اكتملت المعالجة، لكن لا توجد نتيجة قابلة للعرض حاليًا.'],
    [/لا توجد بيانات كافية للحكم/g,'البيانات المتاحة حاليًا لا تكفي للحكم على هذه النقطة'],
    [/المعلومات الموجودة عندي ما تكفي للحكم/g,'البيانات المتاحة حاليًا لا تكفي للحكم على هذه النقطة'],
    [/لا توجد نتائج/g,'لا توجد نتائج مطابقة في البيانات المسجلة'],
    [/ما لقيت نتائج/g,'لا توجد نتائج مطابقة في البيانات المسجلة'],
    [/ما لقيت/g,'لم أجد'],
    [/تعذر إكمال طلب ([^<.]+) في هذه المحاولة\./g,'لم أتمكن من إكمال جزئية $1 حاليًا.'],
    [/واضح وش تبي في ([^<،.]+)، لكن ما قدرت أكملها الآن\./g,'لم أتمكن من إكمال جزئية $1 حاليًا.'],
    [/عزلت الخطأ داخل هذه الوحدة فقط؛ ركيزة AI ما توقف، وتقدر تكمل بسؤالك أو تنتقل لأي جزء آخر\./g,'المشكلة محصورة في هذه الجزئية، ويمكننا متابعة بقية الطلب أو العودة إليها لاحقًا.'],
    [/المشكلة محصورة هنا، وتقدر تكمل معي عادي أو تسأل عن شيء ثاني\./g,'المشكلة محصورة في هذه الجزئية، ويمكننا متابعة بقية الطلب أو العودة إليها لاحقًا.'],
    [/تمت استعادة مسار ركيزة AI ويمكنك المتابعة مباشرة\./g,'المحادثة ما زالت مستمرة، ويمكننا المتابعة من نفس النقطة.'],
    [/رجعت المسار، وتقدر تكمل من نفس النقطة\./g,'المحادثة ما زالت مستمرة، ويمكننا المتابعة من نفس النقطة.'],
    [/^<b>تمام، حصلتها\.<\/b>/g,'<b>وجدتها.</b>'],
    [/^<b>تمام،/g,'<b>حسنًا،'],
    [/^<b>إي،/g,'<b>']
  ];
  for(const [a,b] of reps)s=s.replace(a,b);
  return s;
}
function shouldLead(kind,text,meta){
  if(meta?.noLead)return false;
  if(kind!=='answer')return false;
  if(!text)return false;
  if(hasNaturalStart(text))return false;
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
  const lead=known?`واضح لدي حتى الآن: ${known}. `:'وصلني جزء من المطلوب. ';
  return `<b>${lead}${question}</b>`;
}
function limit(message,question=''){
  return `<div class="notice"><b>${message}</b>${question?`<div class="mut" style="margin-top:6px">${question}</div>`:''}</div>`;
}
function reset(){STATE.turn=0;STATE.lastLead=null;STATE.lastKind=null;STATE.lastDomain=null}

AI.voice={version:VERSION,state:STATE,profile:'professional-arabic-saudi',present,naturalize,classify,stripHtml,clarify,limit,reset};
})();
