'use strict';
const data = window.DRAMA_DATA;
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const time = seconds => `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;
const pad = n => String(n).padStart(2,'0');
const e = escapeHTML;

function episodeHTML(ep) {
  return `<article class="episode" id="${ep.id}" role="tabpanel" aria-labelledby="episode-tab-${pad(ep.number)}"${ep.number === 1 ? '' : ' hidden'}>
    <div class="film-column"><div class="film-heading"><span class="episode-label">EPISODE ${pad(ep.number)}</span><span>${time(ep.duration)} · ENGLISH SUBTITLES</span></div>
      <video controls playsinline preload="none" poster="${ep.poster}" aria-label="Play episode ${ep.number}: ${e(ep.title)}"><source src="${ep.video}" type="video/mp4">Your browser does not support video playback. <a href="${ep.video}">Open the film</a>.</video>
      <p class="video-error" hidden>This video could not load. <a href="${ep.video}">Open the video file</a> to try again.</p>
      <div class="film-caption"><h3>${e(ep.title)}</h3></div>
    </div>
    <div class="story-column"><div class="story-heading"><span class="eyebrow">THE STORY</span></div><h3>${e(ep.headline)}</h3>
      <div class="story-body" id="${ep.id}-summary" role="region" aria-label="Episode ${ep.number} story summary" tabindex="0">${ep.synopsis.map(p=>`<p>${e(p)}</p>`).join('')}</div>
      <a class="text-link" href="#production">Inside this episode <span aria-hidden="true">↗</span></a>
    </div></article>`;
}
if (data?.episodes?.length) document.getElementById('episode-list').innerHTML = data.episodes.map(episodeHTML).join('');

function moreDemoHTML(demo) {
  const portrait = demo.height > demo.width;
  const partBadge = demo.partTitle ? `<span class="demo-part-badge">${e(demo.partTitle)}</span>` : '';
  return `<article class="more-demo-card${portrait ? ' portrait' : ''}" id="demo-${e(demo.id)}"><div class="more-demo-frame"><video controls playsinline preload="none" poster="${e(demo.poster)}" aria-label="Play ${e(demo.title)} · ${e(demo.partTitle || demo.partLabel)}"><source src="${e(demo.video)}" type="video/mp4">Your browser does not support video playback.</video></div><p class="video-error" hidden>This video could not load. <a href="${e(demo.video)}">Open the film</a> to try again.</p><div class="more-demo-caption"><div class="more-demo-meta"><span>${e(demo.partLabel)}</span><span>${time(demo.duration)}</span></div><h3 class="demo-title">${partBadge}<span>${e(demo.title)}</span></h3></div></article>`;
}
document.getElementById('more-demo-grid').innerHTML = (data.moreDemos || []).map(moreDemoHTML).join('');

document.addEventListener('keydown', event => {
  const tab = event.target.closest('[role=tab]');
  if(!tab || !['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
  const tabs = [...tab.closest('[role=tablist]').querySelectorAll('[role=tab]')];
  const i = tabs.indexOf(tab);
  const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (i + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
  event.preventDefault(); tabs[next].focus(); tabs[next].click();
});
document.querySelectorAll('video').forEach(video => {
  video.addEventListener('play', () => document.querySelectorAll('video').forEach(other => {if(other !== video) other.pause();}));
  video.addEventListener('error', () => { video.closest('.film-column, .more-demo-card').querySelector('.video-error').hidden = false; });
});

let selectedEpisode = 1;
let selectedBeat = 0;
const episodeChoices = document.querySelector('.episode-choice');
const production = document.getElementById('production-content');
production.innerHTML = '<div id="production-panel" role="region" aria-labelledby="production-episode-title"></div>';

function assetCard(asset) {
  return `<button class="asset-card ${asset.type || ''}" data-asset="${asset.id}" aria-label="Enlarge ${e(asset.title)}"><div class="asset-image"><img loading="lazy" src="${asset.thumbnail || asset.image}" alt="${e(asset.title)}"><span aria-hidden="true">↗</span></div><div class="asset-caption"><span>${({character:'CHARACTER',scene:'LOCATION',prop:'PROP',shot:'FRAME SAMPLES',process:'SPATIAL LAYOUT'})[asset.type] || 'SPATIAL LAYOUT'}</span><h4>${e(asset.title)}</h4></div></button>`;
}
function renderProduction() {
  const ep = data.episodes[selectedEpisode-1];
  const panel = document.getElementById('production-panel');
  panel.innerHTML = `<div class="assembly-heading"><div><span class="eyebrow">EPISODE ${pad(ep.number)} · ${e(ep.title)}</span><h3 id="production-episode-title">Watch a story become a prompt.</h3></div>
      <label class="demo-segment-picker" for="demo-segment"><span>DEMO SEGMENT</span><select id="demo-segment" aria-controls="beat-panel">${ep.beats.map((b,i)=>`<option value="${i}"${i===selectedBeat?' selected':''}>${pad(i+1)} · ${e(b.title)}</option>`).join('')}</select></label></div>
    <div id="beat-panel" role="region" aria-label="Story-to-Wan assembly demo"></div>
    <details class="production-extras"><summary>Explore this episode’s assets &amp; production notes</summary>
      <div class="subheading"><h3>A world, held together.</h3><span>SELECTED PRODUCTION ASSETS · CLICK TO EXPLORE</span></div>
      <div class="asset-grid">${data.assets.filter(a=>a.episode===selectedEpisode).map(assetCard).join('')}</div>
      <p class="asset-footnote">Reference sheets define appearance and setting. Frame samples come from generation attempts and may differ from the final cut.</p>
      <div class="delivery-note"><span class="eyebrow">THE FINAL CUT</span><h3>${e(ep.deliveryLabel)}</h3>${ep.deliveryNote ? `<p>${e(ep.deliveryNote)}</p>` : ''}</div>
    </details>`;
  renderBeat();
}
function renderBeat() {
  const ep = data.episodes[selectedEpisode-1]; const beat = ep.beats[selectedBeat];
  const panel = document.getElementById('beat-panel');
  window.DRAMA_PIPELINE.mount(panel, ep, beat, selectedBeat);
  document.getElementById('episode-status').textContent = `Episode ${pad(ep.number)}: ${ep.title}. Film, story, and assembly demo selected. Demo segment ${pad(selectedBeat+1)}: ${beat.title}.`;
}
function chooseEpisode(number) {
  const ep = data.episodes.find(episode => episode.number === number);
  if (!ep) return;
  selectedEpisode = number; selectedBeat = 0;
  episodeChoices.querySelectorAll('[data-episode]').forEach(button => {
    const selected = Number(button.dataset.episode) === number;
    button.setAttribute('aria-selected', String(selected));
    button.tabIndex = selected ? 0 : -1;
    button.querySelector('[data-episode-state]').textContent = selected ? 'Now showing' : 'Watch episode →';
  });
  document.querySelectorAll('#episode-list .episode').forEach(article => {
    const selected = article.id === ep.id;
    if (!selected) article.querySelector('video').pause();
    article.hidden = !selected;
  });
  renderProduction();
}
episodeChoices.addEventListener('click', event => {
  const button = event.target.closest('[data-episode]');
  if (button && episodeChoices.contains(button)) chooseEpisode(Number(button.dataset.episode));
});
production.addEventListener('change', event => {
  if (event.target.id !== 'demo-segment') return;
  const nextBeat = Number(event.target.value);
  const ep = data.episodes[selectedEpisode-1];
  if (!Number.isInteger(nextBeat) || nextBeat < 0 || nextBeat >= ep.beats.length) return;
  selectedBeat = nextBeat;
  renderBeat();
});
chooseEpisode(1);

const dialog = document.getElementById('asset-dialog');
document.addEventListener('click', event=>{
  const card=event.target.closest('[data-asset]');if(!card)return;
  const asset=[...data.assets,...data.processAssets,...window.DRAMA_PIPELINE.images].find(a=>a.id===card.dataset.asset);if(!asset)return;
  document.getElementById('asset-dialog-image').src=asset.image;
  document.getElementById('asset-dialog-image').alt=asset.title;
  document.getElementById('asset-dialog-title').textContent=asset.title;
  document.getElementById('asset-dialog-description').textContent=asset.caption;
  dialog.showModal();
});
dialog.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting)document.querySelectorAll('.site-header nav a').forEach(a=>a.classList.toggle('active',a.hash===`#${entry.target.id}`));}),{rootMargin:'-15% 0px -55% 0px',threshold:0});
['episodes','production','more-demos','evolution'].forEach(id=>observer.observe(document.getElementById(id)));
if(data.repositoryUrl && /^https:\/\/github\.com\/[^/]+\/[^/]+\/?$/.test(data.repositoryUrl)) {
  const link=document.createElement('a');link.className='repository-link';link.href=data.repositoryUrl;link.textContent='GitHub ↗';link.target='_blank';link.rel='noopener noreferrer';document.querySelector('.nav-label').replaceWith(link);
}
