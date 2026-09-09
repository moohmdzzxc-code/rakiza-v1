from pathlib import Path
p=Path('index.html')
s=p.read_text(encoding='utf-8')
old="let found=assistantRosterEmployeeMentions(t,active),mentions=found.mentions;for(let mi=0;mi<mentions.length;mi++){"
new="""let found=assistantRosterEmployeeMentions(t,active),mentions=found.mentions;
let addExclusionGroup=(group)=>{if(!group.length)return;group.forEach(x=>excluded.add(x.emp.id));hasRules=true;summary.push(`استبعاد ${group.map(x=>x.emp.full_name).join('، ')} من الخطة`)};
let suffixRe=/(?:الغيهم|الغهم|احذفهم|شيلهم|استبعدهم|ما هم موجودين|ماهم موجودين|مو موجودين|غير موجودين)/g,sm;
while((sm=suffixRe.exec(t))){let group=[];for(let j=mentions.length-1;j>=0;j--){let x=mentions[j];if(x.end>sm.index)continue;if(!group.length){if(sm.index-x.end<=35)group.unshift(x);else break}else{let n=group[0],between=t.slice(x.end,n.start).trim();if(between===''||between==='و')group.unshift(x);else break}}addExclusionGroup(group)}
let prefixRe=/(?:الغي|الغاء|احذف|شيل|استبعد|لا تضيف|لا تحط)\\s+/g,pm;
while((pm=prefixRe.exec(t))){let group=[];for(let j=0;j<mentions.length;j++){let x=mentions[j];if(x.start<pm.index+pm[0].length)continue;if(!group.length){if(x.start-(pm.index+pm[0].length)<=25)group.push(x);else break}else{let prev=group[group.length-1],between=t.slice(prev.end,x.start).trim();if(between===''||between==='و')group.push(x);else break}}addExclusionGroup(group)}
for(let mi=0;mi<mentions.length;mi++){"""
if old not in s: raise SystemExit('anchor not found')
s=s.replace(old,new,1)
s=s.replace('<!-- pages-publish: assistant-v04-roster-exclusions-2026-09-09 -->','<!-- pages-publish: assistant-v041-group-exclusions-2026-09-09 -->',1)
p.write_text(s,encoding='utf-8')
print('patched group exclusions v0.4.1')
