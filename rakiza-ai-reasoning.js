(()=>{
'use strict';

/*
 * Browser entrypoint for Rakiza AI reasoning.
 * Shared reasoning remains unchanged underneath the specialist brains.
 * Store Intelligence and its reasoning bridge load next, followed by the
 * operational roster bridge, approved conversation and universal orchestration
 * layers. Natural roster
 * compatibility remains available, Intent Intelligence provides the unified
 * semantic intent layer, and Dialogue resolves capability gaps interactively
 * while preserving context until the user's goal is completed.
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
      loadScript('rakiza-ai-roster-operational.js',()=>{
        loadScript('rakiza-ai-conversation.js',()=>{
          loadScript('rakiza-ai-conversation-universal.js',()=>{
            loadScript('rakiza-ai-conversation-compat.js',()=>{
              loadScript('rakiza-ai-intent.js',()=>{
                loadScript('rakiza-ai-dialogue.js',()=>{
                  loadScript('rakiza-ai-voice.js');
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
