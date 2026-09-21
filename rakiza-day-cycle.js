(()=>{
'use strict';

const VERSION='1.0.0';
const STEP_KEYS=['opening','dayplan','close'];

function hasPlan(day){return !!(day&&(day.plan_id||day.day_type))}

function derive(source){
  const app=source||{},day=app.day||null;
  const openingDone=!!day?.opening_approved_at;
  const planDone=hasPlan(day);
  const closeDone=day?.status==='مغلق';
  const carryover=!!app.hasCarryoverOpenDay;
  let key='not_started';

  if(day){
    if(closeDone)key='closed';
    else if(!openingDone)key='opening';
    else if(!planDone)key='planning';
    else if(carryover||day.status==='جاهز للإغلاق')key='ready_to_close';
    else key='operating';
  }

  const states={
    not_started:{label:'لم يبدأ',description:'ابدأ يوم التشغيل لتسجيل الجاهزية واعتماد الافتتاح.',buttonLabel:'بدء يوم التشغيل',nextTarget:'start',completed:0},
    opening:{label:'بدء اليوم',description:'أكمل الجاهزية التشغيلية ثم اعتمد بدء اليوم.',buttonLabel:'استكمال بدء اليوم',nextTarget:'opening',completed:0},
    planning:{label:'إعداد الخطة',description:'اعتمد خطة اليوم وتواجد الفريق قبل بدء التشغيل.',buttonLabel:'إعداد خطة اليوم',nextTarget:'dayplan',completed:1},
    operating:{label:'قيد التشغيل',description:'اليوم يعمل وفق الخطة المعتمدة. راجع النتائج عندما يحين وقت الإغلاق.',buttonLabel:'مراجعة اليوم وبدء الإغلاق',nextTarget:'close',completed:2},
    ready_to_close:{label:'جاهز للإغلاق',description:'اكتملت خطوات التشغيل وبقي اعتماد نتيجة اليوم وإغلاقه.',buttonLabel:'إكمال إغلاق اليوم',nextTarget:'close',completed:2},
    closed:{label:'مغلق',description:'اكتملت دورة التشغيل وحُفظ اليوم في السجل.',buttonLabel:'عرض سجل الأيام',nextTarget:'reports',completed:3}
  };
  const state=states[key];
  const current=key==='opening'?'opening':key==='planning'?'dayplan':['operating','ready_to_close'].includes(key)?'close':null;
  const done={opening:openingDone,dayplan:planDone,close:closeDone};
  const steps=STEP_KEYS.map((step,index)=>({
    key:step,
    number:index+1,
    status:done[step]?'done':current===step?'current':'locked',
    label:step==='opening'?'بدء اليوم':step==='dayplan'?'خطة اليوم':'إغلاق اليوم'
  }));

  return {...state,key,version:VERSION,progress:Math.round(state.completed/3*100),steps,openingDone,planDone,closeDone};
}

function guard(target,source){
  const state=derive(source);
  if(target==='cycle')return 'cycle';
  if(target==='opening'){
    if(state.key==='not_started')return 'start';
    if(state.key==='closed')return 'reports';
    return 'opening';
  }
  if(target==='dayplan'){
    if(state.key==='not_started')return 'start';
    if(!state.openingDone)return 'opening';
    if(state.closeDone)return 'reports';
    return 'dayplan';
  }
  if(target==='close'){
    if(state.key==='not_started')return 'start';
    if(!state.openingDone)return 'opening';
    if(!state.planDone)return 'dayplan';
    if(state.closeDone)return 'reports';
    return 'close';
  }
  return target;
}

function next(source){return derive(source).nextTarget}

const api={VERSION,derive,guard,next,hasPlan};
const root=typeof window!=='undefined'?window:null;
if(root)root.RakizaDayCycle=api;
if(typeof module!=='undefined'&&module.exports)module.exports=api;
})();
