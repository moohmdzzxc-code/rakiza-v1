const fs=require('fs'),vm=require('vm');
let pass=0;function ok(c,m,g){if(!c){console.error('FAIL',m,g||'');process.exit(1)}pass++}
const loaded=[];
const sandbox={console,setTimeout,clearTimeout,Date};
sandbox.window=sandbox;
sandbox.window.RakizaAI={normalize:v=>String(v??'').toLowerCase(),analyze:q=>({raw:q,entities:{}}),shortages:{state:{last:null}},sales:{state:{last:null}},readiness:{state:{last:null}},attendance:{state:{last:null},rosterEntriesForPeriod:async()=>[]},tasks:{state:{last:null}},actions:{state:{last:null}}};
sandbox.window.askRakizaAssistant=async()=>{};
sandbox.app={calendarDate:'2026-09-13',date:'2026-09-13',employees:[{id:'e1',full_name:'عمار مثنى',active:true},{id:'e2',full_name:'معتوق الحارثي',active:true}]};
sandbox.window.app=sandbox.app;
sandbox.document={
  getElementById(){return null},
  addEventListener(){},
  createElement(tag){
    ok(tag==='script'||tag==='footer','loader creates supported element',tag);
    return tag==='script'
      ?{tagName:'SCRIPT',src:'',async:true,onload:null,onerror:null}
      :{tagName:'FOOTER',id:'',style:{cssText:''},setAttribute(){},textContent:''};
  },
  body:{appendChild(s){
    if(s.tagName!=='SCRIPT')return;
    loaded.push(s.src);
    if(!s.src.startsWith('rakiza-home-dashboard.js')){
      const path=s.src.split('?')[0],code=fs.readFileSync(path,'utf8');
      vm.runInContext(code,sandbox,{filename:s.src});
    }
    if(typeof s.onload==='function')s.onload();
  }}
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('rakiza-ai-reasoning.js','utf8'),sandbox,{filename:'rakiza-ai-reasoning.js'});
ok(loaded.length===13,'dashboard and twelve runtime layers loaded',loaded);
ok(loaded[0]==='rakiza-home-dashboard.js?v=20260917-1','executive dashboard loads independently',loaded);
ok(loaded[1]==='rakiza-ai-reasoning-core.js','reasoning core loads first',loaded);
ok(loaded[2]==='rakiza-ai-store-intelligence.js','store intelligence loads second',loaded);
ok(loaded[3]==='rakiza-ai-store-reasoning-bridge.js','store reasoning bridge loads third',loaded);
ok(loaded[4]==='rakiza-ai-roster-operational.js','operational roster bridge loads before conversation intelligence',loaded);
ok(loaded[5]==='rakiza-ai-conversation.js','conversation intelligence loads before universal router',loaded);
ok(loaded[6]==='rakiza-ai-conversation-universal.js','universal conversation orchestration loads before compatibility',loaded);
ok(loaded[7]==='rakiza-ai-conversation-compat.js','natural roster compatibility remains available',loaded);
ok(loaded[8]==='rakiza-ai-intent.js','Intent Intelligence loads before dialogue resolver',loaded);
ok(loaded[9]==='rakiza-ai-dialogue.js','dialogue capability resolver loads before voice',loaded);
ok(loaded[10]==='rakiza-ai-voice.js','conversational voice loads before execution layers',loaded);
ok(loaded[11]==='rakiza-ai-capabilities.js','unified capability registry loads after voice',loaded);
ok(loaded[12]==='rakiza-ai-orchestrator.js?v=20260918-2','versioned central orchestrator loads last',loaded);
ok(!!sandbox.window.RakizaAI.reasoning,'shared reasoning available');
ok(!!sandbox.window.RakizaAI.store,'store intelligence available');
ok(!!sandbox.window.RakizaAI.store.reasoningBridge,'store reasoning bridge available');
ok(!!sandbox.window.RakizaAI.rosterOperational,'operational roster bridge available');
ok(!!sandbox.window.RakizaAI.conversation,'conversation intelligence available');
ok(!!sandbox.window.RakizaAI.conversationUniversal,'universal conversation orchestration available');
ok(!!sandbox.window.RakizaAI.conversationCompat,'roster conversation compatibility available');
ok(!!sandbox.window.RakizaAI.intent,'Intent Intelligence available');
ok(!!sandbox.window.RakizaAI.dialogue,'dialogue capability resolver available');
ok(!!sandbox.window.RakizaAI.voice,'conversational voice available');
ok(!!sandbox.window.RakizaAI.capabilities,'unified capability registry available');
ok(!!sandbox.window.RakizaAI.orchestrator,'central orchestrator available');
ok(sandbox.window.RakizaAI.voice.profile==='arabic-white-saudi','voice uses approved Arabic white Saudi profile');
ok(sandbox.window.askRakizaAssistant.__rakizaOrchestratorWrapped===true,'central orchestrator is outer ask layer');
ok(sandbox.window.askRakizaAssistant.__base?.__rakizaDialogueWrapped===true,'dialogue resolver remains directly below central orchestrator');
const frame=sandbox.window.RakizaAI.conversation.interpret('انشاء خطة تواجد عمار صباح والجمعه اجازه ومعتوق مساء والثلاثاء اجازه',{entities:{}});
ok(frame.action==='create_roster_draft','natural roster phrase routes to draft creation',frame);
const inferred=sandbox.window.RakizaAI.conversation.interpret('الأسبوع الجاي عمار صباح والجمعة اوف ومعتوق مساء والثلاثاء اجازة',{entities:{}});
ok(inferred.action==='create_roster_draft','intent layer infers roster creation without saying خطة تواجد',inferred);
ok(inferred.intentIntelligence?.domain==='attendance','intent layer identifies attendance domain',inferred.intentIntelligence);
console.log('Rakiza AI reasoning loader tests passed:',pass);
