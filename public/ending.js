const ending = document.getElementById('ending');
let endingPage = 0;
let endingTimer;
let endingUnlocked = false;
let lift = false;
let swipeStart;
let lastSwipe = -Infinity;
const spreads = [{type:'cover'}, ...endingContent.spreads];
let pageTurn;
let mobileLeaf = 0;
const singleLeaf = matchMedia("(max-width: 600px)");

function resetEnding() {
  clearTimeout(endingTimer);
  pageTurn?.cancel();
  endingUnlocked = false;
  endingPage = 0;
  mobileLeaf = 0;
  lift = false;
  swipeStart = undefined;
  lastSwipe = -Infinity;
  ending.hidden = true;
  byId('ending-return').hidden = true;
  card.classList.remove('to-ending');
  document.querySelector('.controls').inert = false;
}
function setEndingView(mode) {
  ending.dataset.view = mode;
  byId('album').hidden = mode !== 'album';
  byId('letter-scene').hidden = mode !== 'letter';
  byId('dream-end').hidden = mode !== 'end';
  byId('ending-close').hidden = mode !== 'album';
  byId(mode === 'album' ? 'album' : mode === 'letter' ? 'friend-letter-title' : 'dream-end').focus({preventScroll:true});
}
let albumPreloaded = false;
function preloadAlbum() {
  if (albumPreloaded) return;
  albumPreloaded = true;
  const urls = ['assets/fast/emboss-cover.webp','assets/fast/emboss-paper.webp','assets/fast/emboss-envelope.webp'];
  endingContent.spreads.forEach(spread => {
    [spread.left,spread.right].forEach(leaf => {
      (leaf?.photos || []).forEach(photo => { if (photo.src) urls.push(photo.src); });
    });
  });
  function next() {
    const src = urls.shift();
    if (!src) return;
    const image = new Image();
    image.onload = image.onerror = next;
    image.src = src;
  }
  next();
}
function openAlbum(index = 0) {
  preloadAlbum();
  dreamAudio.stopVoice();
  dreamAudio.selectTrack('wherever');
  ending.hidden = false;
  film.scrollTo(0,0);
  garden.scrollTo(0,0);
  byId('ending-return').hidden = true;
  garden.inert = true;
  document.querySelector('.controls').inert = true;
  setEndingView('album');
  mobileLeaf = 0;
  renderAlbum(index,false);
}
function returnToGarden() {
  dreamAudio.selectTrack('surge');
  ending.hidden = true;
  garden.inert = false;
  document.querySelector('.controls').inert = false;
  byId('ending-return').hidden = !endingUnlocked;
  byId('ending-return').focus({preventScroll:true});
}
const lilyMark = '<svg class="album-lily" viewBox="0 0 100 110" fill="none" aria-hidden="true"><path d="M49 102Q66 69 55 47M52 90Q30 85 24 69Q43 71 54 86M58 75Q78 70 83 55Q68 57 58 73M55 47Q20 43 18 20Q36 18 52 39Q35 8 49 5Q61 8 56 39Q76 9 89 21Q83 39 56 47Q75 42 78 54Q68 59 55 47Z" stroke="currentColor" stroke-width="1.4"/><path d="M54 43l-14-18m15 17 2-22m1 24 17-16" stroke="currentColor" stroke-width=".8"/></svg>';
function addAlbumText(parent, tag, value) {
  if (!value) return;
  const node = document.createElement(tag);
  node.textContent = value;
  parent.append(node);
}
function albumPrint(photo) {
  const print = document.createElement('figure');
  print.className = 'journal-print' + (photo.detail ? ' detail' : '');
  const img = document.createElement('img');
  img.src = photo.src;
  img.alt = photo.alt || photo.caption || '';
  img.decoding = 'async';
  img.style.objectPosition = photo.position || 'center';
  img.addEventListener('error',() => print.hidden = true,{once:true});
  print.append(img);
  addAlbumText(print,'figcaption',photo.caption || photo.person);
  return print;
}
function albumLeaf(data = {}, side) {
  const leaf = document.createElement('section');
  leaf.className = 'album-leaf leaf-'+side;
  addAlbumText(leaf,'h3',data.title);
  addAlbumText(leaf,'small',data.date);
  addAlbumText(leaf,'p',data.note);
  return leaf;
}
function fillLeaf(leaf,data) {
  const area = document.createElement('div');
  area.className = 'photo-collage';
  (data.photos || []).filter(photo => photo.src).forEach(photo => area.append(albumPrint(photo)));
  leaf.append(area);
  addAlbumText(leaf,'p',data.caption);
}
function stepAlbum(delta) {
  if (!singleLeaf.matches || endingPage === 0) {
    if (endingPage + delta > 0) {
      mobileLeaf = 0;
      renderAlbum(endingPage + delta);
    } else if (endingPage === 1 && delta < 0) renderAlbum(0);
    return;
  }
  const step = (endingPage - 1) * 2 + mobileLeaf + delta;
  if (step < 0) { renderAlbum(0); return; }
  if (step >= (spreads.length - 1) * 2) return;
  const target = Math.floor(step / 2) + 1;
  mobileLeaf = step % 2;
  renderAlbum(target, true, delta);
}
function renderAlbum(index, animate = true, step = 0) {
  const next = clamp(index,0,spreads.length-1);
  const page = byId('album-page');
  const previous = endingPage;
  if (animate && next === previous && !step) return;
  pageTurn?.cancel();
  page.querySelector('.turning-leaf')?.remove();
  const forward = step ? step > 0 : next > previous;
  const oldLeaf = animate && page.firstElementChild
    ? (page.querySelector(singleLeaf.matches ? '.album-leaf.is-current' : forward ? '.album-leaf.leaf-right' : '.album-leaf.leaf-left') || page.firstElementChild).cloneNode(true)
    : null;
  endingPage = next;
  lift = false;
  const spread = spreads[next];
  page.replaceChildren();
  page.dataset.spread = spread.type;
  page.dataset.leaf = String(mobileLeaf);
  if (spread.type === 'cover') {
    page.innerHTML = '<button id="album-cover" aria-label="打开相册"><span>11.11</span>'+lilyMark+'<strong>格格的梦境相册</strong><i>For Gege</i></button>';
    byId('album-cover').addEventListener('click',() => renderAlbum(1));
  } else {
    const left = albumLeaf(spread.left,'left');
    const right = albumLeaf(spread.right,'right');
    (mobileLeaf ? right : left).classList.add('is-current');
    if (spread.type === 'future') {
      left.insertAdjacentHTML('beforeend','<button id="future-photo" aria-label="拿起尚未拍摄的合照" aria-pressed="false"><span class="future-window">'+lilyMark+'</span></button>');
      const futureImage = spread.left.photos?.[0];
      if (futureImage?.src) {
        const photo = albumPrint(futureImage).querySelector('img');
        left.querySelector('.future-window').replaceChildren(photo);
      }
      if (!futureImage?.src) addAlbumText(left,'p','留给下一次见面。');
      spread.right.lines.forEach(line => addAlbumText(right,'p',line));
      right.insertAdjacentHTML('beforeend',lilyMark);
      byId('album-page').append(left,right);
      byId('future-photo').addEventListener('click', () => {
        lift = !lift;
        byId('future-photo').setAttribute('aria-pressed',String(lift));
      });
    } else if (spread.type === 'envelope') {
      left.insertAdjacentHTML('afterbegin',lilyMark);
      const envelope = document.createElement('button');
      envelope.id = 'friend-envelope';
      envelope.setAttribute('aria-label','拆开写给格格的信');
      addAlbumText(envelope,'span',spread.right.title);
      envelope.addEventListener('click',openLetter);
      right.replaceChildren(envelope);
      addAlbumText(right,'small','轻触蜡封，拆开来读');
      page.append(left,right);
    } else {
      fillLeaf(left,spread.left);
      fillLeaf(right,spread.right);
      page.append(left,right);
    }
  }
  byId('album-prev').hidden = next === 0;
  byId('album-next').hidden = next === 0 || (next === spreads.length-1 && (!singleLeaf.matches || mobileLeaf === 1));
  if (animate) byId("album").focus({preventScroll:true});
  if (oldLeaf && !reduced.matches) {
    oldLeaf.classList.add('turning-leaf',forward ? 'forward' : 'backward');
    if (previous === 0) oldLeaf.classList.add('cover-turn');
    oldLeaf.inert = true;
    oldLeaf.setAttribute('aria-hidden','true');
    oldLeaf.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
    oldLeaf.removeAttribute('id');
    page.append(oldLeaf);
    const direction = forward ? -1 : 1;
    pageTurn = oldLeaf.animate([
      {transform:'rotateY(0)',filter:'brightness(1)',opacity:1},
      {transform:'rotateY('+direction*72+'deg)',filter:'brightness(.73)',opacity:1,offset:.61},
      {transform:'rotateY('+direction*162+'deg)',filter:'brightness(.85)',opacity:0}
    ],{duration:580,easing:'cubic-bezier(.25,.5,.32,1)'});
    pageTurn.onfinish = () => oldLeaf.remove();
  }
}
function openLetter() {
  const envelope = byId('friend-envelope');
  if (!envelope || envelope.disabled) return;
  envelope.disabled = true;
  envelope.classList.add('unsealing');
  if (reduced.matches) showBirthdayLetter();
  else endingTimer = setTimeout(() => {
    if (!ending.hidden && ending.dataset.view === 'album' && byId('friend-envelope') === envelope) showBirthdayLetter();
  },650);
}
function showBirthdayLetter() {
  const content = byId('birthday-letter');
  const text = endingContent.birthdayLetter;
  content.replaceChildren();
  text.split('\n\n').forEach(paragraph => addAlbumText(content,'p',paragraph));
  content.lastElementChild?.classList.add('letter-signature');
  setEndingView('letter');
  content.scrollTop = 0;
}
function finishLetter() {
  setEndingView('end');
}
function initEnding() {
  function onAlbumViewportChange() {
    if (!ending.hidden && ending.dataset.view === 'album') renderAlbum(endingPage,false);
  }
  if (singleLeaf.addEventListener) singleLeaf.addEventListener('change',onAlbumViewportChange);
  else singleLeaf.addListener(onAlbumViewportChange);
  byId('blessing').addEventListener('click', () => {
    if (card.dataset.kind !== 'keepsake' || card.classList.contains('is-closing') || card.classList.contains('to-ending')) return;
    card.classList.add('to-ending');
    endingTimer = setTimeout(() => {
      if (!card.open || card.dataset.kind !== 'keepsake') return;
      endingUnlocked = true;
      card.close();
      card.classList.remove('to-ending');
      openAlbum();
    },reduced.matches ? 0 : 370);
  });
  byId('ending-return').addEventListener('click', () => { if (!card.open) openAlbum(); });
  byId('ending-close').addEventListener('click',returnToGarden);
  byId('end-garden').addEventListener('click',returnToGarden);
  byId('end-album').addEventListener('click',() => openAlbum());
  byId('end-replay').addEventListener('click',play);
  byId('letter-close').addEventListener('click',finishLetter);
  byId('letter-finish').addEventListener('click',finishLetter);
  byId('album-prev').addEventListener('click',() => stepAlbum(-1));
  byId('album-next').addEventListener('click',() => stepAlbum(1));
  ending.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      if (ending.dataset.view === 'letter') finishLetter();
      else returnToGarden();
    }
    if (ending.dataset.view !== 'album') return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      stepAlbum(event.key === 'ArrowLeft' ? -1 : 1);
    }
  });
  const album = byId('album');
  album.addEventListener('click', event => {
    if (performance.now() - lastSwipe > 325) return;
    event.preventDefault();
    event.stopImmediatePropagation();
  },true);
  album.addEventListener('pointerdown', event => {
    lastSwipe = -Infinity;
    if (event.pointerType === 'touch') swipeStart = {x:event.clientX,y:event.clientY};
  });
  album.addEventListener('pointercancel', () => { swipeStart = undefined; });
  album.addEventListener('pointerup', event => {
    if (!swipeStart || event.pointerType !== 'touch') return;
    const dx = event.clientX - swipeStart.x;
    const dy = event.clientY - swipeStart.y;
    swipeStart = undefined;
    if (Math.abs(dx) <= 45 || Math.abs(dx) <= Math.abs(dy)) return;
    lastSwipe = performance.now();
    stepAlbum(dx < 0 ? 1 : -1);
  });
}



