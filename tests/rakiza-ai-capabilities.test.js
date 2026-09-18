global.window={};
global.document={getElementById:()=>null};
window.document=global.document;
window.app={date:'2026-09-15',calendarDate:'2026-09-15',actions:[]};
let apiCalls=[],opened='';
window.api=async(name,options={})=>{
  apiCalls.push({name,options});
  if(name==='action-save'){
    const row={id:'a1',...options.body};window.app.actions=[row];return row;
  }
  return{};
};
window.refresh=async()=>{};
window.openRoster=async()=>{opened='roster'};
window.RakizaAI={sales:{answer:async text=>'sales:'+text},rosterOperational:{stage:async()=>({ok:true,entryCount:14})}};
require('../rakiza-ai-capabilities.js');
const C=window.RakizaAI.capabilities;
let pass=0;function ok(c,m,g){if(!c){console.error('FAIL',m,g||'');process.exit(1)}pass++}

(async()=>{
  ok(C.list().length>=45,'registry covers Rakiza user capabilities',C.list().length);
  ok(C.get('day.start')?.approval===true,'operational writes require approval');
  ok(C.get('read.store')?.approval===false,'read-only reasoning does not require approval');
  let r=await C.execute('daily_action.create',{action_type:'طلب دعم',subject:'تعطل الكاشير',description:'الكاشير لا يعمل',request_date:'2026-09-15'});
  ok(!r.ok&&r.code==='approval_required','write cannot execute without explicit approval',r);
  r=C.prepare('daily_action.create',{action_type:'طلب دعم',subject:'تعطل الكاشير',description:'الكاشير لا يعمل',request_date:'2026-09-15'});
  ok(r.ok&&C.state.pending.id==='daily_action.create','write is staged for review');
  r=await C.approve('اعتمد');
  ok(r.ok&&r.receipt.verified,'approved write executes with a verified receipt',r);
  ok(apiCalls.some(x=>x.name==='action-save'),'approved write uses the real Rakiza API');
  r=await C.execute('navigate.roster',{}, {approved:true});
  ok(r.ok&&opened==='roster','safe navigation invokes the actual screen');
  r=await C.execute('read.sales',{text:'مبيعات اليوم'},{approved:true});
  ok(r.ok&&r.receipt.result==='sales:مبيعات اليوم','read capability delegates to specialist brain',r);
  C.prepare('maintenance.create',{subject:'المكيف'});
  ok(C.state.pending.missing.includes('description')&&C.state.pending.missing.includes('request_date'),'missing operational fields are retained for focused clarification');
  C.cancel();ok(!C.state.pending,'pending action can be cancelled without execution');
  ok(C.approvalText('اعتمدها للأسبوع القادم'),'approval accepts natural combined wording');
  console.log('Rakiza AI capabilities tests passed:',pass);
})().catch(e=>{console.error(e);process.exit(1)});
