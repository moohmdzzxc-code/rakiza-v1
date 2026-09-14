global.window={RakizaAI:{}};
const dates=Array.from({length:7},(_,i)=>{const d=new Date('2026-09-13T12:00:00');d.setDate(d.getDate()+i);return d.toISOString().slice(0,10)});
function row(employeeId){const selects=new Map(dates.map(d=>[d,{value:''}]));return{dataset:{emp:employeeId},selects,querySelector(q){const m=String(q).match(/data-date="([^"]+)"/);return m?selects.get(m[1])||null:null}}}
const rows=[row('e1'),row('e2')];
const elements={
  weekStart:{value:''},copyWeekStart:{value:''},rosterBy:{innerHTML:''},chgEmp:{innerHTML:''},chgBy:{innerHTML:''},
  rosterGrid:{dataset:{saved:'0'},querySelectorAll:q=>q==='tr'?rows:[]},
  rosterState:{innerHTML:''},saveRosterBtn:{textContent:'',dataset:{}}
};
global.document={getElementById:id=>elements[id]||null,querySelector:()=>null};window.document=global.document;
let shown=null,prepared=0,totals=0,saved=0;
window.show=id=>{shown=id};window.renderEmployeeEditor=()=>{};window.empOptions=()=>'<option>مدير</option>';
window.prepareRoster=async()=>{prepared++};window.calcRosterTotals=()=>{totals++};window.saveRoster=()=>{saved++};

require('../rakiza-ai-roster-operational.js');
const R=window.RakizaAI.rosterOperational;
let pass=0;function ok(c,m,g){if(!c){console.error('FAIL',m,g||'');process.exit(1)}pass++}
const draft={kind:'roster',status:'draft',period:{type:'week',start:'2026-09-13',end:'2026-09-19'},assignments:[
  {resolved:true,employee_id:'e1',employee:{full_name:'عمار مثنى'},defaultStatus:'Morning',overrides:{5:'D/O'}},
  {resolved:true,employee_id:'e2',employee:{full_name:'معتوق الحارثي'},defaultStatus:'Evening',overrides:{0:'D/O'}}
]};

(async()=>{
  let built=R.buildEntries(draft);ok(built.ok&&built.entries.length===14,'weekly operational rows are built from the conversational draft',built);
  ok(built.entries.find(x=>x.employee_id==='e1'&&x.work_date==='2026-09-18')?.planned_status==='D/O','day override replaces the default shift');
  let result=await R.stage(draft);ok(result.ok,'draft stages successfully',result);
  ok(shown==='roster'&&prepared===1&&totals===1,'operational roster screen is prepared and totals recalculated');
  ok(rows[0].selects.get('2026-09-13').value==='Morning'&&rows[0].selects.get('2026-09-18').value==='D/O','first employee values populate the operational grid');
  ok(rows[1].selects.get('2026-09-13').value==='D/O'&&rows[1].selects.get('2026-09-14').value==='Evening','second employee values populate the operational grid');
  ok(elements.saveRosterBtn.textContent.includes('اعتماد')&&elements.saveRosterBtn.dataset.draftSource==='rakiza-ai','final approval remains an explicit screen action');
  ok(saved===0,'staging never calls the database save action');
  ok(draft.status==='operational_draft'&&draft.operationalStage?.status==='staged','conversation draft records successful operational staging');
  ok(elements.rosterState.innerHTML.includes('مسودة ركيزة AI')&&elements.rosterState.innerHTML.includes('اعتماد وحفظ'),'screen tells the user how to complete final approval');

  elements.rosterGrid.dataset.saved='1';result=await R.stage(JSON.parse(JSON.stringify({...draft,status:'draft'})));
  ok(!result.ok&&result.code==='already_saved','an existing original roster is never overwritten by AI staging',result);

  const unresolved=JSON.parse(JSON.stringify(draft));unresolved.assignments[0].resolved=false;
  result=R.validateDraft(unresolved);ok(!result.ok&&result.issues.some(x=>x.code==='unresolved_people'),'unresolved employee blocks operational transfer',result);
  console.log('Rakiza AI operational roster tests passed:',pass);
})().catch(e=>{console.error(e);process.exit(1)});
