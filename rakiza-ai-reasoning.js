(()=>{
'use strict';

/*
 * Browser entrypoint for Rakiza AI reasoning.
 * Shared reasoning remains unchanged underneath the specialist brains.
 * Store Intelligence and its reasoning bridge load next, then the approved
 * conversation layer, then the universal conversation orchestrator v2.
 * A narrow compatibility layer loads last to preserve natural roster-create
 * phrasing without changing any approved operational rules.
 */

if(typeof module!=='undefined'&&module.exports){
  require('./rakiza-ai-reasoning-core.js');
  return;
}

function loadScript(src,onload){
  const s=document.createElement('script');
  s.src=src;
  s.async=false;
  s.onload=onload||null;
  s.onerror=()=>console.error('Rakiza AI failed to load:',src);
  document.body.appendChild(s);
}

loadScript('rakiza-ai-reasoning-core.js',()=>{
  loadScript('rakiza-ai-store-intelligence.js',()=>{
    loadScript('rakiza-ai-store-reasoning-bridge.js',()=>{
      loadScript('rakiza-ai-conversation.js',()=>{
        loadScript('rakiza-ai-conversation-universal.js',()=>{
          loadScript('rakiza-ai-conversation-compat.js');
        });
      });
    });
  });
});
})();
