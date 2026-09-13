(()=>{
'use strict';

/*
 * Browser entrypoint for Rakiza AI reasoning.
 * Shared reasoning remains unchanged underneath the specialist brains.
 * Store Intelligence and its reasoning bridge load next, then the approved
 * conversation layer, then the universal conversation orchestrator v2.
 * The universal layer becomes the outer execution/router layer so one broken
 * specialist function cannot freeze the whole assistant.
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
        loadScript('rakiza-ai-conversation-universal.js');
      });
    });
  });
});
})();
