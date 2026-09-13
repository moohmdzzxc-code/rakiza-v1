(()=>{
'use strict';

const AI=window.RakizaAI=window.RakizaAI||{};
const C=AI.conversation;
if(!C||C.rosterNaturalCompatVersion)return;

const VERSION='1.0.0';
const baseInterpret=C.interpret.bind(C);

function norm(v){
  try{
    return typeof AI.normalize==='function'
      ? AI.normalize(v)
      : String(v??'').toLowerCase()
          .replace(/[\u064B-\u065F\u0670]/g,'').replace(/ـ/g,'')
          .replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/ؤ/g,'و').replace(/ئ/g,'ي')
          .replace(/[،,:;؛!?؟.()\[\]{}"']/g,' ').replace(/\s+/g,' ').trim();
  }catch{return String(v??'').toLowerCase().trim()}
}

function rosterPhrase(n){
  return /(?:خطه|خطة)\s*(?:ال)?تواجد|جدول\s*(?:ال)?تواجد|جدول\s*دوام|(?:خطه|خطة)\s*دوام|روستر/.test(n);
}
function createCue(n){
  return /انشاء|انشي|انشئ|سوي|سو |جهز|رتب|ابني|اعمل|كون|كوّن/.test(n);
}
function assignmentCue(n){
  return /صباح|صباحي|مساء|مسائي|اجازه|اجازة|اوف|راحه|سنويه|سكليف|تعويضي|الاحد|الاثنين|الثلاث|ثلوث|الاربع|ربوع|الخميس|الجمع|السبت/.test(n);
}
function shouldCreateRoster(text,frame){
  const n=norm(text);
  if(!rosterPhrase(n))return false;
  if(frame?.action&&frame.action!=='delegate')return false;
  return createCue(n)||assignmentCue(n);
}

C.interpret=function(text,base={}){
  const frame=baseInterpret(text,base);
  if(shouldCreateRoster(text,frame)){
    return {...frame,mode:'draft',action:'create_roster_draft',domain:'attendance'};
  }
  return frame;
};

C.rosterNaturalCompatVersion=VERSION;
C.isNaturalRosterCreate=(text,base={})=>shouldCreateRoster(text,baseInterpret(text,base));
AI.conversationCompat={version:VERSION,rosterPhrase,createCue,assignmentCue};
})();
