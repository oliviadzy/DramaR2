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
    <div class="rsi-demo-heading"><div><h3>Rebirth · video comparison</h3></div><div class="rsi-episodes" role="group" aria-label="Comparison episode"><button type="button" data-rsi-episode="1" aria-pressed="true">Episode 01</button><button type="button" data-rsi-episode="2" aria-pressed="false">Episode 02</button></div></div>
    <div class="rsi-checkpoints"><span>COMPARE BASELINE WITH</span><div role="tablist" aria-label="RSI checkpoint">${checkpoints.slice(1).map(c=>`<button type="button" role="tab" id="rsi-tab-${c.round}" aria-controls="rsi-comparison" data-rsi-version="${esc(c.version)}" aria-selected="${c.version===version}" tabindex="${c.version===version?0:-1}"><strong>${esc(c.label)}</strong></button>`).join('')}</div></div>
    <div id="rsi-comparison" role="tabpanel"></div>
    <details class="rsi-source-details"><summary>Results & method details</summary><div class="rsi-source-body"><p>The headline scores summarize the paper’s benchmark evaluation. Rebirth is one illustrative case, and these aggregate gains are not individual ratings of its clips.</p><p>${esc(results.note)}</p><p>${esc(results.tradeoffNote)}</p><p>The outer RSI loop updates the agent harness: the shared prompts, rules, and coordination that govern production. The paper tests candidate updates through frozen replay and paired comparisons before later projects use them. Selected checkpoint scores alone do not verify each automatic promotion.</p><p>These results come from an author-review draft. The benchmark protocol covers five standalone stories and five episode pairs (15 videos), with one seed. Repeated-run uncertainty is not reported.</p><div class="rsi-table-scroll" tabindex="0" role="region" aria-label="All reported checkpoint scores"><table><caption>Paper §5.4, Figure 4 · automatic scores (0–100)</caption><thead><tr><th scope="col">Checkpoint</th>${results.dimensions.map(d=>`<th scope="col">${esc(d)}</th>`).join('')}</tr></thead><tbody>${checkpoints.map(c=>`<tr><th scope="row">${esc(c.label)}</th>${c.scores.map(v=>`<td>${v.toFixed(2)}</td>`).join('')}</tr>`).join('')}</tbody></table></div><h4>What evolves across rounds</h4><ul>${checkpoints.map(c=>`<li><strong>${esc(c.label)}</strong> — ${esc(c.changes)}</li>`).join('')}</ul><h4>Video provenance</h4><p>Playback is independent because clip runtimes differ.</p><p>The supplied folder uses presentation labels that differ from the paper. The comparison above follows the paper’s version mapping:</p><ul>${checkpoints.map(c=>{const source=data.variants.find(v=>v.sourceVersion===c.version);return `<li><strong>${esc(c.label)} · ${esc(c.version)}</strong> — supplied folder label: ${esc(source.label)}</li>`;}).join('')}</ul><p>${esc(data.note)}</p></div></details>`;

  function clipFor(sourceVersion) {
    return data.variants.find(v=>v.sourceVersion===sourceVersion).episodes.find(e=>e.number===episode);
  }
  function player(checkpoint, isBaseline) {
    const clip=clipFor(checkpoint.version);
    return `<article class="rsi-film ${isBaseline?'rsi-baseline':'rsi-later'}"><div class="rsi-film-heading"><h4>${esc(checkpoint.label)}</h4><span>EPISODE ${pad(episode)} · ${duration(clip.duration)}</span></div><video controls playsinline preload="none" poster="${esc(clip.poster)}" aria-label="Play Rebirth ${esc(checkpoint.label)} episode ${episode}"><source src="${esc(clip.video)}" type="video/mp4">Your browser does not support video playback.</video><p class="rsi-video-error" hidden>This video could not load. <a href="${esc(clip.video)}">Open the film</a> to try again.</p></article>`;
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
