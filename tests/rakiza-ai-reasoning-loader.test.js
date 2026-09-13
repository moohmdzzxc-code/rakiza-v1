const fs=require('fs'),vm=require('vm');
let pass=0;function ok(c,m,g){if(!c){console.error('FAIL',m,g||'');process.exit(1)}pass++}
const loaded=[];
const sandbox={console,setTimeout,clearTimeout,Date};
sandbox.window=sandbox;
sandbox.window.RakizaAI={normalize:v=>String(v??'').toLowerCase(),analyze:q=>({raw:q,entities:{}}),shortages:{state:{last:null}},sales:{state:{last:null}},readiness:{state:{last:null}},attendance:{state:{last:null}},tasks:{state:{last:null}},actions:{state:{last:null}}};
sandbox.window.askRakizaAssistant=async()=>{};
sandbox.app={calendarDate:'2026-09-13',date:'2026-09-13',employees:[{id:'e1',full_name:'عمار مثنى',active:true},{id:'e2',full_name:'معتوق الحارثي',active:true}]};
sandbox.window.app=sandbox.app;
sandbox.document={
  getElementById(){return null},
  createElement(tag){ok(tag==='script','loader creates script element',tag);return{src:'',async:true,onload:null,onerror:null}},
  body:{appendChild(s){loaded.push(s.src);const code=fs.readFileSync(s.src,'utf8');vm.runInContext(code,sandbox,{filename:s.src});if(typeof s.onload==='function')s.onload()}}
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('rakiza-ai-reasoning.js','utf8'),sandbox,{filename:'rakiza-ai-reasoning.js'});
ok(loaded.length===7,'seven runtime layers loaded',loaded);
ok(loaded[0]==='rakiza-ai-reasoning-core.js','reasoning core loads first',loaded);
ok(loaded[1]==='rakiza-ai-store-intelligence.js','store intelligence loads second',loaded);
ok(loaded[2]==='rakiza-ai-store-reasoning-bridge.js','store reasoning bridge loads third',loaded);
ok(loaded[3]==='rakiza-ai-conversation.js','conversation intelligence loads before universal router',loaded);
ok(loaded[4]==='rakiza-ai-conversation-universal.js','universal conversation orchestration loads before compatibility',loaded);
ok(loaded[5]==='rakiza-ai-conversation-compat.js','natural roster compatibility remains available',loaded);
ok(loaded[6]==='rakiza-ai-intent.js','Intent Intelligence loads last as unified language layer',loaded);
ok(!!sandbox.window.RakizaAI.reasoning,'shared reasoning available');
ok(!!sandbox.window.RakizaAI.store,'store intelligence available');
ok(!!sandbox.window.RakizaAI.store.reasoningBridge,'store reasoning bridge available');
ok(!!sandbox.window.RakizaAI.conversation,'conversation intelligence available');
ok(!!sandbox.window.RakizaAI.conversationUniversal,'universal conversation orchestration available');
ok(!!sandbox.window.RakizaAI.conversationCompat,'roster conversation compatibility available');
ok(!!sandbox.window.RakizaAI.intent,'Intent Intelligence available');
ok(sandbox.window.askRakizaAssistant.__rakizaUniversalConversationWrapped===true,'universal conversation remains outer ask layer');
const frame=sandbox.window.RakizaAI.conversation.interpret('انشاء خطة تواجد عمار صباح والجمعه اجازه ومعتوق مساء والثلاثاء اجازه',{entities:{}});
ok(frame.action==='create_roster_draft','natural roster phrase routes to draft creation',frame);
const inferred=sandbox.window.RakizaAI.conversation.interpret('الأسبوع الجاي عمار صباح والجمعة اوف ومعتوق مساء والثلاثاء اجازة',{entities:{}});
ok(inferred.action==='create_roster_draft','intent layer infers roster creation without saying خطة تواجد',inferred);
ok(inferred.intentIntelligence?.domain==='attendance','intent layer identifies attendance domain',inferred.intentIntelligence);
console.log('Rakiza AI reasoning loader tests passed:',pass);