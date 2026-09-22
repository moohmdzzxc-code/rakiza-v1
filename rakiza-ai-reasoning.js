(()=>{
'use strict';

/*
 * Browser entrypoint for Rakiza AI reasoning.
 * Shared reasoning remains unchanged underneath the specialist brains.
 * Store Intelligence and its reasoning bridge load next, followed by the
 * operational roster bridge, approved conversation and universal orchestration
 * layers. Natural roster
 * compatibility remains available, Intent Intelligence provides the unified
 * semantic intent layer, and Dialogue resolves capability gaps interactively.
 * The capability registry and central orchestrator load last so every user
 * action has one validated execution path with approval and receipts.
 */

if(typeof module!=='undefined'&&module.exports){
  require('./rakiza-ai-reasoning-core.js');
  return;
}

function ensureRakizaFooter(){
  if(document.getElementById('rakizaCopyright'))return;
  const footer=document.createElement('footer');
  footer.id='rakizaCopyright';
  footer.setAttribute('dir','rtl');
  footer.textContent='© 2026 ركيزة — عمل وإنتاج محمد الضمري — جميع الحقوق محفوظة';
  footer.style.cssText='max-width:1200px;margin:18px auto 8px;padding:14px 18px;text-align:center;color:#667085;font-size:13px;line-height:1.8;';
  document.body.appendChild(footer);
}

function loadScript(src,onload){
  const s=document.createElement('script');
  s.src=src;
  s.async=false;
  s.onload=onload||null;
  s.onerror=()=>console.error('Rakiza AI failed to load:',src);
  document.body.appendChild(s);
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ensureRakizaFooter,{once:true});
else ensureRakizaFooter();
loadScript('rakiza-day-cycle.js?v=20260922-start-state1',()=>loadScript('rakiza-home-dashboard.js?v=20260918-1'));

loadScript('rakiza-ai-reasoning-core.js',()=>{
  loadScript('rakiza-ai-store-intelligence.js',()=>{
    loadScript('rakiza-ai-store-reasoning-bridge.js',()=>{
      loadScript('rakiza-ai-roster-operational.js',()=>{
        loadScript('rakiza-ai-conversation.js',()=>{
          loadScript('rakiza-ai-conversation-universal.js',()=>{
            loadScript('rakiza-ai-conversation-compat.js',()=>{
              loadScript('rakiza-ai-intent.js',()=>{
                loadScript('rakiza-ai-dialogue.js',()=>{
                  loadScript('rakiza-ai-voice.js',()=>{
                    loadScript('rakiza-ai-capabilities.js',()=>{
                      loadScript('rakiza-ai-orchestrator.js?v=20260918-2');
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});
})();
