'use strict';
(() => {
  const data = window.DRAMA_DATA.evolution;
  if (!data) return;
  const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const pad = n => String(n).padStart(2,'0');
  const duration = n => `${pad(Math.floor(n/60))}:${pad(Math.floor(n%60))}`;
  const results = data.results;
  const checkpoints = results.checkpoints;
  const baseline = checkpoints[0];
  let episode = 1;
  let version = checkpoints.at(-1).version;
  const root = document.getElementById('evolution-content');
  root.innerHTML = `<div class="rsi-intro"><div><span class="section-no">04 / SELF-EVOLUTION</span><h2 id="evolution-title">From production to system evolution.</h2><p>DramaR² connects an inner production loop with an outer RSI loop that evolves how agents plan, coordinate, and review. Production traces drive tested updates to the agent harness; accepted changes guide later projects, whose new traces feed the next cycle of system evolution.</p><div class="rsi-loop"><span>Production traces</span><i aria-hidden="true">→</i><span>Harness evolution</span><i aria-hidden="true">→</i><span>Replay & paired tests</span><i aria-hidden="true">→</i><span>Later projects <b aria-hidden="true">↻</b></span></div></div><span class="rsi-mentor"><img src="brand/mentor.png" alt="DramaR² mentor" loading="lazy"></span></div>
    <div class="rsi-result-heading"><span>Benchmark results</span><span>Figure 4 · scores out of 100</span></div>
    <div class="rsi-metrics">${results.metrics.map(metric=>`<article class="rsi-metric"><div class="metric-heading"><h3>${esc(metric.title)}</h3><span>+${metric.gain.toFixed(2)} pts</span></div><div class="metric-values"><div><span>Baseline</span><strong>${metric.before.toFixed(2)}</strong></div><i aria-hidden="true">→</i><div><span>Round 12</span><strong>${metric.after.toFixed(2)}</strong></div></div></article>`).join('')}</div>
    <div class="rsi-demo-heading"><div><h3>${esc(data.title)} · video comparison</h3></div><div class="rsi-episodes" role="group" aria-label="Comparison episode"><button type="button" data-rsi-episode="1" aria-pressed="true">Episode 01</button><button type="button" data-rsi-episode="2" aria-pressed="false">Episode 02</button></div></div>
    <div class="rsi-checkpoints"><span>COMPARE BASELINE WITH</span><div role="tablist" aria-label="RSI checkpoint">${checkpoints.slice(1).map(c=>`<button type="button" role="tab" id="rsi-tab-${c.round}" aria-controls="rsi-comparison" data-rsi-version="${esc(c.version)}" aria-selected="${c.version===version}" tabindex="${c.version===version?0:-1}"><strong>${esc(c.label)}</strong></button>`).join('')}</div></div>
    <div id="rsi-comparison" role="tabpanel"></div>
`;

  function clipFor(sourceVersion) {
    return data.variants.find(v=>v.sourceVersion===sourceVersion).episodes.find(e=>e.number===episode);
  }
  function player(checkpoint, isBaseline) {
    const clip=clipFor(checkpoint.version);
    return `<article class="rsi-film ${isBaseline?'rsi-baseline':'rsi-later'}"><div class="rsi-film-heading"><h4>${esc(checkpoint.label)}</h4><span>EPISODE ${pad(episode)} · ${duration(clip.duration)}</span></div><video controls playsinline preload="none" width="${clip.width}" height="${clip.height}" poster="${esc(clip.poster)}" aria-label="Play ${esc(data.title)} ${esc(checkpoint.label)} episode ${episode}"><source src="${esc(clip.video)}" type="video/mp4">Your browser does not support video playback.</video><p class="rsi-video-error" hidden>This video could not load. <a href="${esc(clip.video)}">Open the film</a> to try again.</p></article>`;
  }
  function renderComparison() {
    const selected=checkpoints.find(c=>c.version===version);
    const panel=root.querySelector('#rsi-comparison');
    panel.querySelectorAll('video').forEach(v=>v.pause());
    panel.setAttribute('aria-labelledby',`rsi-tab-${selected.round}`);
    panel.innerHTML=`<div class="rsi-film-grid">${player(baseline,true)}${player(selected,false)}</div>`;
    root.querySelectorAll('[data-rsi-episode]').forEach(b=>b.setAttribute('aria-pressed',String(Number(b.dataset.rsiEpisode)===episode)));
    root.querySelectorAll('[data-rsi-version]').forEach(b=>{const current=b.dataset.rsiVersion===version;b.setAttribute('aria-selected',String(current));b.tabIndex=current?0:-1;});
    panel.querySelectorAll('video').forEach(video=>{
      video.addEventListener('play',()=>document.querySelectorAll('video').forEach(other=>{if(other!==video)other.pause();}));
      video.addEventListener('error',()=>{video.closest('.rsi-film').querySelector('.rsi-video-error').hidden=false;});
    });
  }
  root.addEventListener('click',event=>{
    const episodeButton=event.target.closest('[data-rsi-episode]');
    const versionButton=event.target.closest('[data-rsi-version]');
    if(episodeButton){episode=Number(episodeButton.dataset.rsiEpisode);renderComparison();}
    else if(versionButton){version=versionButton.dataset.rsiVersion;renderComparison();}
  });
  renderComparison();
})();
