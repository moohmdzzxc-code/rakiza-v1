const cycle=require('../rakiza-day-cycle.js');

let pass=0;
function ok(condition,message,got){
  if(!condition){console.error('FAIL',message,got??'');process.exit(1)}
  pass++;
}

function state(app,key,label,next,progress){
  const result=cycle.derive(app);
  ok(result.key===key,`${key}: correct key`,result);
  ok(result.label===label,`${key}: correct label`,result);
  ok(result.nextTarget===next,`${key}: correct next target`,result);
  ok(result.progress===progress,`${key}: correct progress`,result);
  return result;
}

const empty=state({},'not_started','لم يبدأ','start',0);
ok(empty.steps[0].status==='locked','before start every step is locked',empty.steps);

const opening=state({day:{status:'مفتوح'}},'opening','بدء اليوم','opening',0);
ok(opening.steps[0].status==='current','opening is the current step',opening.steps);

const planning=state({day:{status:'مفتوح',opening_approved_at:'2026-09-18T08:00:00Z'}},'planning','إعداد الخطة','dayplan',33);
ok(planning.steps[0].status==='done'&&planning.steps[1].status==='current','planning follows approved opening',planning.steps);

const operatingById=state({day:{status:'مفتوح',opening_approved_at:'x',plan_id:'p1'}},'operating','قيد التشغيل','close',67);
ok(operatingById.steps[2].status==='current','close review is current while operating',operatingById.steps);

const operatingByType=cycle.derive({day:{status:'مفتوح',opening_approved_at:'x',day_type:'يوم بيعي فقط'}});
ok(operatingByType.key==='operating','day_type counts as an approved plan',operatingByType);

state({hasCarryoverOpenDay:true,day:{status:'مفتوح',opening_approved_at:'x',plan_id:'p1'}},'ready_to_close','جاهز للإغلاق','close',67);
const closed=state({day:{status:'مغلق',opening_approved_at:'x',plan_id:'p1'}},'closed','مغلق','reports',100);
ok(closed.steps.every(step=>step.status==='done'),'closed day completes all steps',closed.steps);

ok(cycle.guard('close',{})==='start','close before a day redirects to start');
ok(cycle.guard('close',{day:{status:'مفتوح'}})==='opening','close before opening redirects to opening');
ok(cycle.guard('close',{day:{status:'مفتوح',opening_approved_at:'x'}})==='dayplan','close before plan redirects to plan');
ok(cycle.guard('close',{day:{status:'مفتوح',opening_approved_at:'x',day_type:'يوم تشغيلي'}})==='close','close is available after plan approval');
ok(cycle.guard('dayplan',{day:{status:'مغلق',opening_approved_at:'x',plan_id:'p1'}})==='reports','closed days route to history');

console.log('Rakiza day cycle tests passed:',pass);
