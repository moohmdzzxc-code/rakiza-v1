from pathlib import Path
import re

index = Path('index.html')
s = index.read_text(encoding='utf-8')

# Mark the new native Rakiza AI build.
s = re.sub(r'<!-- pages-publish:[^>]+-->', '<!-- pages-publish: rakiza-ai-native-v0-1-2026-09-13 -->', s, count=1)

# Replace the assistant UI while preserving the same section/input IDs used by the app.
assistant_section = '''<section id="assistant" class="view"><div class="top"><div><div class="brand">ركيزة AI ✦</div><div class="sub">محرك ركيزة الداخلي — بدون API خارجي</div></div><button class="btn ghost" onclick="home()">الرئيسية</button></div><div class="grid"><div class="card wide"><div class="title">اسأل ركيزة</div><div class="notice"><b>ركيزة AI يعمل من داخل ركيزة.</b><div style="margin-top:5px">المرحلة الحالية: فهم اللغة والسياق، الأيام والتواريخ، وتصنيف طلب خطة التواجد كمسودة. لن يتم حفظ أي تغيير تشغيلي دون اعتمادك.</div></div><div id="assistantSuggestions" class="actions" style="justify-content:flex-start;flex-wrap:wrap"></div><div id="assistantChat" style="display:flex;flex-direction:column;gap:10px;margin-top:14px"></div><div class="fields" style="margin-top:14px;grid-template-columns:1fr auto"><div class="field"><label>اكتب طلبك</label><input id="assistantInput" placeholder="اكتب بطريقتك الطبيعية" onkeydown="if(event.key==='Enter'){event.preventDefault();askRakizaAssistant()}"></div><div class="field"><label>&nbsp;</label><button class="btn gold" onclick="askRakizaAssistant()">إرسال</button></div></div></div></div></section>'''
pattern = r'<section id="assistant" class="view">.*?</section>(?=<section id="actions" class="view">)'
s, n = re.subn(pattern, assistant_section, s, count=1, flags=re.S)
if n != 1:
    raise SystemExit('assistant section not found or ambiguous')

# Remove every previous inline assistant implementation, including the OpenAI router,
# legacy keyword assistant and old roster-AI logic. Keep the operational code that follows it.
start = s.find('let assistantReady=false')
end = s.find('function actionDisplayStatus', start if start >= 0 else 0)
if start < 0 or end < 0 or end <= start:
    raise SystemExit('legacy assistant JS block not found')
s = s[:start] + s[end:]

# Load the new isolated native engine after the rest of Rakiza is ready.
script_tag = '<script src="rakiza-ai.js"></script>'
if script_tag not in s:
    anchor = '<script src="actions-split-dbfix.js"></script>'
    if anchor not in s:
        raise SystemExit('script anchor not found')
    s = s.replace(anchor, anchor + '\n' + script_tag, 1)

# Update the base tile label if it is still present in the original markup.
s = s.replace('<h3>مساعد ركيزة ✦</h3>', '<h3>ركيزة AI ✦</h3>')

# Safety assertions: the front end must no longer contain the old external AI routes.
for banned in ('rakiza-ai-assistant', 'rakiza-ai-roster', 'assistantAiHistory', 'askRakizaAssistantLegacy', 'AI_NOT_CONFIGURED'):
    if banned in s:
        raise SystemExit(f'old AI reference still present: {banned}')

index.write_text(s, encoding='utf-8')

# The home dashboard is rebuilt by this file, so rename its tile too.
dbfix = Path('actions-split-dbfix.js')
t = dbfix.read_text(encoding='utf-8')
t = t.replace('<h3>مساعد ركيزة ✦</h3>', '<h3>ركيزة AI ✦</h3>')
dbfix.write_text(t, encoding='utf-8')
