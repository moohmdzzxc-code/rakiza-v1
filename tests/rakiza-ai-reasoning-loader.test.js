const fs=require('fs'),vm=require('vm');
let pass=0;function ok(c,m,g){if(!c){console.error('FAIL',m,g||'');process.exit(1)}pass++}
const loaded=[];
const sandbox={console,setTimeout,clearTimeout,Intl,Date};
sandbox.window=sandbox;
sandbox.app={calendarDate:'2026-09-13',date:'2026-09-13',day:null,actions:[],sections:[]};
sandbox.window.RakizaAI={normalize:v=>String(v??'').toLowerCase(),analyze:q=>({raw:q,entities:{}}),shortages:{state:{last:null}},sales:{state:{last:null}},readiness:{state:{last:null}},attendance:{state:{last:null}},tasks:{state:{last:null}},actions:{state:{last:null}}};
sandbox.window.askRakizaAssistant=async()=>{};
sandbox.document={
  getElementById(){return null},
  createElement(tag){ok(tag==='script','loader creates script element',tag);return{src:'',async:true,onload:null,onerror:null}},
  body:{appendChild(s){loaded.push(s.src);const code=fs.readFileSync(s.src,'utf8');vm.runInContext(code,sandbox,{filename:s.src});if(typeof s.onload==='function')s.onload()}}
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('rakiza-ai-reasoning.js','utf8'),sandbox,{filename:'rakiza-ai-reasoning.js'});
ok(loaded.length===5,'five runtime layers loaded',loaded);
ok(loaded[0]==='rakiza-ai-reasoning-core.js','reasoning core loads first',loaded);
ok(loaded[1]==='rakiza-ai-store-intelligence.js','store intelligence loads second',loaded);
ok(loaded[2]==='rakiza-ai-store-reasoning-bridge.js','store reasoning bridge loads third',loaded);
ok(loaded[3]==='rakiza-ai-daily-brief.js','daily brief loads fourth',loaded);
ok(loaded[4]==='rakiza-ai-daily-brief-reasoning-bridge.js','daily brief reasoning bridge loads last',loaded);
ok(!!sandbox.window.RakizaAI.reasoning,'shared reasoning available');
ok(!!sandbox.window.RakizaAI.store,'store intelligence available');
ok(!!sandbox.window.RakizaAI.store.reasoningBridge,'store reasoning bridge available');
ok(!!sandbox.window.RakizaAI.dailyBrief,'daily brief available');
ok(!!sandbox.window.RakizaAI.dailyBrief.reasoningBridge,'daily brief reasoning bridge available');
ok(sandbox.window.askRakizaAssistant.__rakizaDailyBriefReasoningWrapped===true,'daily brief reasoning is outer ask layer');
ok(sandbox.window.askRakizaAssistant.__base?.__rakizaDailyBriefWrapped===true,'daily brief assistant remains inside reasoning wrapper');
ok(typeof sandbox.window.askRakizaAssistant.__base?.__base==='function','previous store/reasoning ask chain preserved');
console.log('Rakiza AI reasoning loader tests passed:',pass);
