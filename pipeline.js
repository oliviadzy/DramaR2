'use strict';
window.DRAMA_PIPELINE = (() => {
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pad = n => String(n).padStart(2, '0');
  const clip = (value, length) => {
    const plain = String(value || '').replace(/\s+/g, ' ').trim();
    if (plain.length <= length) return plain;
    const cut = plain.lastIndexOf(' ', length);
    return plain.slice(0, cut > length * .65 ? cut : length).replace(/[.,;:]$/, '') + '…';
  };
  const images = [];
  let dispose = () => {};
  const steps = [
    {label:'Story', title:'Every film starts with a story.', description:'Find the event, the intention, and the change this scene needs to make.', symbol:'S', crew:'planner'},
    {label:'Plan', title:'Give the story a little structure.', description:'Turn the scene into a timed segment, with an objective and continuity to carry forward.', symbol:'gᵢ', crew:'planner'},
    {label:'Assets', title:'Bring the world into the scene.', description:'Combine appearance references with a gray-box opening layout in one visual bundle.', symbol:'Aᵢ', crew:'director'},
    {label:'Direction', title:'Now, direct the action.', description:'Shape the segment into shots, with camera moves, performances, dialogue, and sound.', symbol:'qᵢ', crew:'director'},
    {label:'Wan prompt', title:'Everything comes together.', description:'The story, references, layout, and direction become one recorded Wan request.', symbol:'WAN', crew:'reviewer'}
  ];
  const durations = [2400, 2600, 3500, 2800, 3700];

  function imageButton(id, src, title, caption, className = '') {
    if (!images.some(i=>i.id===id)) images.push({id, image:src, title, caption});
    return `<button class="assembly-image ${className}" data-asset="${esc(id)}" aria-label="Enlarge ${esc(title)}"><img src="${esc(src)}" alt="${esc(title)}"><span aria-hidden="true">↗</span></button>`;
  }

  function mount(panel, ep, beat, beatIndex) {
    dispose();
    images.length = 0;
    const t = beat.trace;
    const {story, plan, gray, direction, wan} = t;
    const englishPrompt = wan.promptEnglish;
    const sceneName = t.references.find(r=>r.kind==='scene')?.title || String(plan.sceneId || plan.scene).replace(/^scene_/, '').replaceAll('_',' ');
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
    let step = 0, elapsed = 0, previousTime = null, frame = 0, inView = false;
    let playing = !reducedMotion.matches, completed = false, destroyed = false;
    const abort = new AbortController();
    const scope = {signal:abort.signal};

    panel.innerHTML = `<div class="assembly-demo" data-step="0">
      <div class="assembly-topline"><div><h4>Episode ${pad(ep.number)} <span>/</span> ${esc(beat.title)}</h4></div><div class="assembly-controls"><button type="button" class="demo-replay" data-replay aria-label="Replay assembly demo" title="Replay demo">↺</button><button type="button" class="demo-play" data-play></button></div></div>
      <div class="assembly-theater">
        <div class="assembly-source"><div class="demo-caption"></div><div class="demo-scene" aria-label="Current assembly step"></div></div>
        <aside class="assembly-packet" aria-label="Wan request being assembled"><div class="packet-heading"><span class="packet-icon" aria-hidden="true">✦</span><div><h5>One Wan request</h5></div><span class="packet-count">1 / ${steps.length}</span></div><div class="packet-fields">${steps.map((s,i)=>`<div class="packet-field" data-piece="${i}"><span class="piece-symbol">${s.symbol}</span><div><strong>${['Story intent','Segment plan','Visual assets & layout','Shot direction','Generation settings'][i]}</strong><small>${[`${beat.duration}s of story`,`${beat.duration}s · continuity context`,`${t.references.length} references + gray-box`,`${direction.shots.length} timed shots`,`${wan.parameters.resolution} · ${wan.parameters.ratio} · ${wan.parameters.duration}s`][i]}</small></div><span class="piece-check" aria-hidden="true">✓</span></div>`).join('')}</div><div class="packet-footer"><span class="packet-status"></span></div></aside>
      </div>
      <div class="assembly-progress"><div class="assembly-steps" role="group" aria-label="Assembly steps">${steps.map((s,i)=>`<button type="button" data-step-button="${i}" aria-label="Step ${i+1}: ${s.label}"${i===0?' aria-current="step"':''}><span>${pad(i+1)}</span>${s.label}<i aria-hidden="true"></i></button>`).join('')}</div></div>
      <span class="sr-only demo-announcement" aria-live="polite"></span>
    </div>
`;

    const demo = panel.querySelector('.assembly-demo');
    const playButton = panel.querySelector('[data-play]');
    const scene = panel.querySelector('.demo-scene');
    const modal = document.getElementById('asset-dialog');

    function stageContent() {
      if (step === 0) return `<div class="story-slip"><span class="slip-label">THE STORY</span><h6>${esc(beat.title)}</h6><p>${esc(clip(story.excerpt, 440))}</p><div class="story-goal"><span>THE INTENTION</span><p>${esc(clip(story.goal, 210))}</p></div><span class="slip-fold" aria-hidden="true"></span></div>`;
      if (step === 1) return `<div class="plan-slip"><div class="plan-tags"><span>${beat.duration} seconds</span><span>${esc(clip(sceneName,50))}</span></div><span class="slip-label">WHAT THIS SEGMENT NEEDS TO DO</span><p class="plan-goal">${esc(clip(plan.summary,310))}</p><div class="plan-thread"><div><span>01</span><strong>Story beat</strong></div><i>→</i><div><span>02</span><strong>Timed action</strong></div><i>→</i><div><span>03</span><strong>Continuity</strong></div></div></div>`;
      if (step === 2) {
        const selected = [];
        const add = ref => { if (ref && !selected.includes(ref)) selected.push(ref); };
        add(t.references.find(r=>/nia/i.test(r.title)) || t.references.find(r=>r.kind==='character'));
        add(t.references.find(r=>r.kind==='scene'));
        add(t.references.find(r=>r.kind==='prop'));
        for (const ref of t.references) if (selected.length<3) add(ref);
        selected.sort((a,b)=>a.slot-b.slot);
        return `<div class="demo-asset-bundle"><div class="demo-reference-grid combined-assets">${selected.map(r=>`<figure>${imageButton(r.assetKey,r.image,r.title,`Image ${r.slot} in the recorded request.`)}<figcaption><span>IMAGE ${r.slot}</span><strong>${esc(r.title)}</strong></figcaption></figure>`).join('')}<figure class="layout-asset">${imageButton(`${gray.assetKey}-sent`,gray.sentImage,`Gray-box opening · Episode ${ep.number}, segment ${pad(beatIndex+1)}`,`Opening-layout asset, bound as reference image ${gray.inputSlot}.`)}<figcaption><span>IMAGE ${gray.inputSlot}</span><strong>Opening layout</strong></figcaption></figure></div><p class="asset-bundle-note">${selected.length} of ${t.references.length} appearance references shown · gray-box included</p></div>`;
      }
      if (step === 3) return `<div class="demo-shot-board"><div class="shot-board-heading"><span>${direction.shots.length} SHOTS</span><span>${beat.duration}S SEGMENT</span></div><ol>${direction.shots.slice(0,3).map((s,i)=>`<li><span>${pad(i+1)}</span><div><strong>${esc(String(s.time).replace(/秒/g, 's'))}</strong><p>${esc(clip(s.action || s.camera || s.description,125))}</p></div></li>`).join('')}</ol></div>`;
      return `<div class="demo-prompt"><div class="demo-prompt-heading"><span>PROMPT PREVIEW</span><strong>Assembled ✓</strong></div><div class="prompt-preview"><code>${esc(englishPrompt.slice(0,1250))}</code></div><div class="prompt-preview-footer"><span>${wan.mediaCounts.reference_image} images · ${wan.mediaCounts.reference_audio || 0} audio references</span></div></div>`;
    }

    function paintStep(announce = false) {
      demo.dataset.step = step;
      panel.querySelector('.demo-caption').innerHTML = `<img src="brand/${steps[step].crew}.png" alt=""><div><h5>${steps[step].title}</h5><p>${steps[step].description}</p></div>`;
      scene.innerHTML = stageContent();
      panel.querySelectorAll('[data-step-button]').forEach((button,i)=>{
        button.toggleAttribute('data-past', i<step);
        if (i===step) button.setAttribute('aria-current','step'); else button.removeAttribute('aria-current');
        button.style.setProperty('--progress', i<step ? '100%' : '0%');
      });
      panel.querySelectorAll('[data-piece]').forEach((piece,i)=>{
        piece.classList.toggle('is-added',i<=step);
        piece.classList.toggle('is-new',i===step);
      });
      panel.querySelector('.packet-count').textContent = `${step+1} / ${steps.length}`;
      panel.querySelector('.packet-status').textContent = step===steps.length-1 ? 'Request assembled ✓' : 'Adding the pieces…';
      if (announce) panel.querySelector('.demo-announcement').textContent = `Step ${step+1} of ${steps.length}: ${steps[step].label}.`;
    }

    function updateControls() {
      playButton.innerHTML = `<span aria-hidden="true">${completed?'↺':playing?'Ⅱ':'▶'}</span> ${completed?'Replay demo':playing?'Pause demo':'Play demo'}`;
      playButton.setAttribute('aria-label',completed?'Replay demo':playing?'Pause demo':'Play demo');
      playButton.setAttribute('aria-pressed',String(playing));
    }
    function canRun() { return playing && inView && !document.hidden && !modal?.open; }
    function stopFrame() { cancelAnimationFrame(frame); frame=0; previousTime=null; }
    function tick(now) {
      frame=0;
      if (destroyed || !canRun()) { previousTime=null; return; }
      if (previousTime!==null) elapsed+=Math.min(now-previousTime,250);
      previousTime=now;
      if (elapsed>=durations[step]) {
        elapsed=0;
        if (step===steps.length-1) {
          completed=true; playing=false;
          panel.querySelector('[aria-current="step"]').style.setProperty('--progress','100%');
          updateControls(); previousTime=null; return;
        }
        step++; paintStep();
      }
      panel.querySelector('[aria-current="step"]').style.setProperty('--progress',`${Math.min(100,elapsed/durations[step]*100)}%`);
      frame=requestAnimationFrame(tick);
    }
    function sync() {
      stopFrame(); updateControls();
      if(canRun()) frame=requestAnimationFrame(tick);
    }
    function pause() { playing=false; sync(); }
    function replay() { step=0;elapsed=0;completed=false;playing=true;paintStep(true);sync(); }


    panel.addEventListener('click',event=>{
      const target=event.target.closest('button');
      if(!target)return;
      if(target.hasAttribute('data-step-button')) {
        step=Number(target.dataset.stepButton);elapsed=0;completed=false;playing=false;paintStep(true);sync();
      } else if(target.hasAttribute('data-replay')) replay();
      else if(target.hasAttribute('data-play')) { if(completed)replay();else{playing=!playing;sync();} }
      else if(target.hasAttribute('data-asset')) pause();
    },scope);
    document.addEventListener('visibilitychange',sync,scope);
    modal?.addEventListener('close',sync,scope);
    reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches)pause();},scope);
    const observer=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting && entries[0].intersectionRatio >= .2;sync();},{threshold:[0,.2]});
    observer.observe(demo);
    paintStep();updateControls();
    dispose=()=>{destroyed=true;stopFrame();observer.disconnect();abort.abort();};
  }
  return {mount, images};
})();
