from pathlib import Path


def patch_chat(path, source):
    p = Path(path)
    s = p.read_text()
    candidates = [
        "function chat(role,html){const c=document.getElementById('assistantChat');if(!c)return;const mine=role==='user';c.insertAdjacentHTML('beforeend',`<div style=\"display:flex;justify-content:${mine?'flex-start':'flex-end'}\"><div class=\"task\" style=\"max-width:92%;margin:0;background:${mine?'#eef3f8':'#fff'};border-color:${mine?'#d6e0ea':'#e3e7ec'}\">${html}</div></div>`);c.lastElementChild?.scrollIntoView?.({behavior:'smooth',block:'nearest'})}",
        "function chat(role,html){const c=document.getElementById('assistantChat');if(!c)return;const mine=role==='user';c.insertAdjacentHTML('beforeend',`<div style=\"display:flex;justify-content:${mine?'flex-start':'flex-end'}\"><div class=\"task\" style=\"max-width:88%;margin:0;background:${mine?'#eef3f8':'#fff'};border-color:${mine?'#d6e0ea':'#e3e7ec'}\">${html}</div></div>`);c.lastElementChild?.scrollIntoView({behavior:'smooth',block:'nearest'});}",
    ]
    old = next((x for x in candidates if x in s), None)
    if old is None:
        raise SystemExit(f'chat target not found in {path}')
    maxw = '88%' if 'max-width:88%' in old else '92%'
    if 'scrollIntoView({' in old and '?.(' not in old:
        scroll = "c.lastElementChild?.scrollIntoView({behavior:'smooth',block:'nearest'});"
    else:
        scroll = "c.lastElementChild?.scrollIntoView?.({behavior:'smooth',block:'nearest'})"
    new = (
        "function chat(role,html){const c=document.getElementById('assistantChat');if(!c)return;"
        "const mine=role==='user';"
        f"if(!mine&&AI.voice?.present)html=AI.voice.present(html,{{source:'{source}',domain:AI.conversation?.state?.context?.domain||AI.conversationUniversal?.state?.lastRoute||null}});"
        "c.insertAdjacentHTML('beforeend',`<div style=\"display:flex;justify-content:${mine?'flex-start':'flex-end'}\">"
        f"<div class=\"task\" style=\"max-width:{maxw};margin:0;background:${{mine?'#eef3f8':'#fff'}};border-color:${{mine?'#d6e0ea':'#e3e7ec'}}\">${{html}}</div></div>`);"
        + scroll + "}"
    )
    p.write_text(s.replace(old, new, 1))


patch_chat('rakiza-ai-conversation-universal.js', 'universal')
patch_chat('rakiza-ai-dialogue.js', 'dialogue')
patch_chat('rakiza-ai-conversation.js', 'conversation')

p = Path('rakiza-ai-reasoning.js')
s = p.read_text()
old = """            loadScript('rakiza-ai-intent.js',()=>{
              loadScript('rakiza-ai-dialogue.js');
            });"""
new = """            loadScript('rakiza-ai-intent.js',()=>{
              loadScript('rakiza-ai-dialogue.js',()=>{
                loadScript('rakiza-ai-voice.js');
              });
            });"""
if old not in s:
    raise SystemExit('reasoning load target not found')
p.write_text(s.replace(old, new, 1))

p = Path('tests/rakiza-ai-reasoning-loader.test.js')
s = p.read_text()
s = s.replace("ok(loaded.length===8,'eight runtime layers loaded',loaded);", "ok(loaded.length===9,'nine runtime layers loaded',loaded);")
s = s.replace("ok(loaded[7]==='rakiza-ai-dialogue.js','dialogue capability resolver loads last',loaded);", "ok(loaded[7]==='rakiza-ai-dialogue.js','dialogue capability resolver loads before voice',loaded);\nok(loaded[8]==='rakiza-ai-voice.js','conversational voice loads last',loaded);")
s = s.replace("ok(!!sandbox.window.RakizaAI.dialogue,'dialogue capability resolver available');", "ok(!!sandbox.window.RakizaAI.dialogue,'dialogue capability resolver available');\nok(!!sandbox.window.RakizaAI.voice,'conversational voice available');\nok(sandbox.window.RakizaAI.voice.profile==='arabic-white-saudi','voice uses approved Arabic white Saudi profile');")
p.write_text(s)
