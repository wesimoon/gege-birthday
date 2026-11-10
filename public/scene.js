const byId = id => document.getElementById(id);
const film = byId('film');
const lens = byId('lens');
const room = byId('room');
const invitation = byId('invitation');
const hand = byId('hand');
const garden = byId('garden');
const passage = byId('garden-passage');
const near = byId('near');
const friends = [byId('baekhyun'), byId('yeonjun')];
const line = byId('line');
const speaker = byId('speaker');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const duration = 19.4;
let frame, start, activeCue, phase;

const cues = [
  [4, 5.95, '边伯贤', '格格？醒啦？'],
  [6.15, 9, '崔然竣', '生日快乐！你也太能睡了吧。'],
  [14.05, 16, '闵玧其', '자기야.', 'ko'],
  [16.35, 19.35, '闵玧其', '发什么呆呢？']
];

const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
function ease(value, start, end) {
  const t = clamp((value - start) / (end - start));
  return t * t * (3 - 2 * t);
}
function setPhase(next) {
  phase = next;
  if (next === 'garden') dreamAudio.selectTrack('surge');
  film.dataset.phase = next;
  hand.hidden = next !== 'invite';
  garden.hidden = next !== 'handoff' && next !== 'garden';
  garden.inert = next !== 'garden';
  passage.hidden = next !== 'handoff';
  if (next === 'garden') {
    garden.dataset.intro = '';
    garden.focus({preventScroll: true});
  }
}
function showCue(cue) {
  if (activeCue === cue) return;
  activeCue = cue;
  if (cue === cues[2]) dreamAudio.playVoice('01_intro_jagiya');
  if (cue === gardenCues[0]) dreamAudio.playVoice('03_greenhouse_intro');
  speaker.textContent = cue?.[2] ?? '';
  line.textContent = cue?.[3] ?? '';
  line.lang = cue?.[4] ?? 'zh-CN';
  byId('skip-cue').hidden = !cue || phase !== 'garden';
}
function camera(scale, x, y, parallax = 1) {
  room.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + scale + ')';
  near.style.transform = 'translate(' + x * parallax + 'px,' + y * .65 + 'px) scale(' + (1 + Math.min(scale - 1, .4)) + ')';
}
function render(t) {
  const motion = !reduced.matches;

  const open = ease(t, .28, 3.35);
  const blink = (ease(t, 2.12, 2.32) - ease(t, 2.32, 2.73)) * .23;
  film.style.setProperty('--lid', (motion ? (52 - open * 59 + blink * 100) : (t < .3 ? 52 : -7)) + '%');
  lens.style.filter = 'blur(' + (motion ? ((1 - ease(t, .65, 3.9)) * 23 + blink * 12) : 0) + 'px)';
  const late = ease(t, 8.9, 12.5);
  const reveal = ease(t, 9.7, 13.25);
  invitation.style.opacity = reveal;
  invitation.style.setProperty('--breath', motion ? 1 + ease(t, 10, duration) * .025 : 1);
  near.style.opacity = (1 - reveal) * .84;
  invitation.style.filter = 'blur(' + (motion ? (1 - reveal) * 7 : 0) + 'px)';

  byId('dust').style.opacity = 1 - reveal * .75;
  const sway = motion ? Math.sin(t * 1.45) * 1.8 : 0;
  camera(1.03 + late * .06, sway, 0);
  friends.forEach((friend, i) => {
    const leave = ease(t, 8.8 + i * .21, 12.65 + i * .19);
    const direction = i === 0 ? -1 : 1;
    const drift = motion ? Math.sin(t * 2.05 + i * 1.7) * 2.1 : 0;
    friend.style.transform = 'translate(' + (direction * leave * (innerWidth * .56 + 155)) + 'px,' + (drift - leave * 34 + (1 - open) * -18) + 'px) scale(' + (1 + (motion ? ease(t, 2.8, 8.2) * .035 : 0) - leave * .09) + ')';
    friend.style.opacity = 1 - ease(t, 11.05, 12.8);
  });
  room.style.filter = 'blur(' + (motion ? 4.6 * (1 - late) : 0) + 'px)';
  showCue(cues.find(([from, to]) => t >= from && t < to));
}
function play() {
  dreamAudio.stopVoice();
  dreamAudio.selectTrack('sdl',true);
  cancelAnimationFrame(frame);
  start = null;
  film.style.removeProperty('--touch-light');
  resetGarden();
  room.style.opacity = 1;
  invitation.style.removeProperty('translate');
  invitation.style.removeProperty('rotate');
  setPhase('film');
  render(0);
  function tick(now) {
    start ??= now;
    const t = Math.min((now - start) / 1000, duration);
    render(t);
    if (t < duration) frame = requestAnimationFrame(tick);
    else setPhase('invite');
  }
  frame = requestAnimationFrame(tick);
}
const handoffCue = [0, 0, '闵玧其', '走吧，给你准备了点东西。'];
const gardenCues = [
  [450, 2250, '闵玧其', '喜欢吗？'],
  [2800, 5900, '闵玧其', '知道你喜欢百合，特意准备的。']
];
hand.addEventListener('click', () => {
  if (phase !== 'invite') return;
  setPhase('handoff');
  dreamAudio.playVoice('02_come_with_me');
  const first = performance.now();
  function transfer(now) {
    const elapsed = now - first;
    const motion = !reduced.matches;
    const rise = ease(elapsed, 180, 1500);
    const turn = ease(elapsed, 1050, 3350);
    const reveal = ease(elapsed, 1430, 3550);
    film.style.setProperty('--touch-light', Math.sin(Math.PI * ease(elapsed, 0, 920)) * .3);
    if (motion) {
      invitation.style.translate = (-turn * 7) + '% ' + (-rise * 3 + Math.sin(rise * Math.PI * 2) * .45) + '%';
      invitation.style.rotate = (-turn * 1.1) + 'deg';
      invitation.style.filter = 'blur(' + (ease(elapsed, 1150, 2380) * 18) + 'px)';
      invitation.style.setProperty('--breath', 1.025 + rise * .04);
      garden.style.setProperty('--garden-x', (1 - reveal) * 12 + 'vw');
      garden.style.setProperty('--garden-y', (1 - reveal) * 3 + 'dvh');
      garden.style.setProperty('--garden-zoom', 1 + (1 - reveal) * .15);
      passage.style.setProperty('--sweep', (38 - turn * 90) + 'vw');
      passage.style.setProperty('--passage', Math.sin(Math.PI * turn) * .88);
    }
    garden.style.setProperty('--garden-reveal', reveal);
    showCue(elapsed >= 570 && elapsed < 3120 ? handoffCue : null);
    if (elapsed < 3550) frame = requestAnimationFrame(transfer);
    else {
      setPhase('garden');
      playGardenLines(now);
    }
  }
  frame = requestAnimationFrame(transfer);
});
function playGardenLines(first) {
  function tick(now) {
    const elapsed = now - first;
    showCue(gardenCues.find(([from, to]) => elapsed >= from && elapsed < to));
    if (elapsed < 5900) frame = requestAnimationFrame(tick);
  }
  frame = requestAnimationFrame(tick);
}

const bouquet = byId('lilies');
const tag = byId('lily-tag');
const tableInvite = byId('table-invite');
const cake = byId('cake');
const card = byId('garden-card');
const paper = card.querySelector('.paper');
const photoView = byId('photo-view');
const birthdayLink = byId('birthday-link');
const flip = byId('flip-photo');
const petals = byId('petals');
let discovered = false;
let cardTrigger;
let focusTimer, replyTimer, closeTimer;
const cards = {
  lily: {
    title: '这束百合是我亲自挑的。',
    copy: ['不过刚才你凑近看花的时候，', '我看的可不是花。'],
    signature: '—— 윤기'
  },
  birthday: {
    title: '给我的格格。',
    copy: ['又长大一岁了。', '今天可以稍微任性一点。', '想要什么，告诉我就好。', '不过——', '如果想要一个吻，', '就别站那么远。', '过来。'],
    signature: '—— 윤기'
  },
  invite: {
    title: '今天不用赶时间。',
    copy: ['蛋糕是你的。', '花是你的。', '礼物也是你的。', '至于我——', '不是早就是你的吗？'],
    signature: '你的丈夫 · SUGA'
  }
};

// Replace src and alt with approved photos later. The same mapping drives both views.
const gardenPhotos = [
  {button: 'photo-first', src: 'assets/lily-print.webp', alt: '阳光下的粉白百合',
    caption: '今天的百合', note: '这束花摆好以后，屋子就一直有你的香味。',
    rect: [67.9, 66.35, 5.7, 2.08], cut: 'polygon(8% 0,97% 6%,100% 100%,0 93%)', angle: -7},
  {button: 'photo-second', src: 'assets/garden-print.webp', alt: '花房的拱窗和阳光',
    caption: '花房的下午', note: '下午的光刚刚好。想和你一起多坐一会儿。',
    rect: [73.4, 67.42, 6.63, 2.9], cut: 'polygon(22% 0,100% 24%,74% 100%,0 73%)', angle: 12}
];

function foldTag() {
  tag.hidden = true;
  bouquet.setAttribute('aria-expanded', 'false');
}
function resetGarden() {
  [focusTimer, replyTimer, closeTimer].forEach(clearTimeout);
  garden.removeAttribute('style');
  passage.removeAttribute('style');
  delete garden.dataset.intro;
  discovered = false;
  resetChapter();
  foldTag();
  cardTrigger = null;
  card.classList.remove('is-closing');
  if (card.open) card.close();
  flip.setAttribute('aria-pressed', 'false');
  petals.replaceChildren();
}
function canInteract() {
  return phase === 'garden' && !card.open;
}
function focusObject(spot) {
  dreamAudio.stopVoice();
  cancelAnimationFrame(frame);
  [focusTimer, replyTimer].forEach(clearTimeout);
  showCue(null);
  delete garden.dataset.intro;
  if (spot !== bouquet) foldTag();
  const style = getComputedStyle(spot);
  garden.style.setProperty('--focus-x', style.getPropertyValue('--x'));
  garden.style.setProperty('--focus-y', style.getPropertyValue('--y'));
  garden.style.setProperty('--garden-zoom', reduced.matches ? 1 : 1.09);
}
function relaxCamera() {
  garden.style.setProperty('--garden-zoom', 1);
}
function respond(text) {
  showCue([0, 0, '闵玧其', text]);
  replyTimer = setTimeout(() => showCue(null), 2900);
}
function dropPetals() {
  for (let i = 0; i < 5; i++) {
    const petal = document.createElement('i');
    petal.style.setProperty('--drift', ((i - 2) * 18) + 'px');
    petal.style.setProperty('--delay', i * .10 + 's');
    petal.addEventListener('animationend', () => petal.remove(), {once: true});
    petals.append(petal);
  }
}
bouquet.addEventListener('click', () => {
  if (!canInteract()) return;
  focusObject(bouquet);
  tag.hidden = false;
  bouquet.setAttribute('aria-expanded', 'true');
  tag.focus({preventScroll: true});
  if (!discovered && !reduced.matches) dropPetals();
  discovered = true;
});
function prepareCard(kind, trigger, spot) {
  focusObject(spot);
  cardTrigger = trigger;
  card.dataset.kind = kind;
  card.setAttribute('aria-labelledby', kind === 'photo' ? 'photo-title' : 'card-title');
  card.classList.remove('is-closing');
  byId('chapter').hidden = true;
  paper.hidden = kind === 'photo';
  photoView.hidden = kind !== 'photo';
  byId('close-card').setAttribute('aria-label', kind === 'photo' ? '放回拍立得' : '合上卡片');
}
function showCard() {
  card.showModal();
  card.scrollTop = 0;
  byId('close-card').focus({preventScroll: true});
}
function openCard(key, trigger, spot) {
  if (!canInteract()) return;
  prepareCard(key, trigger, spot);
  fillPaper(key);
  showCard();
}
function fillPaper(key) {
  const content = cards[key];
  birthdayLink.hidden = key !== 'lily';
  byId('card-title').textContent = content.title;
  byId('card-signature').textContent = content.signature;
  byId('card-signature').hidden = !content.signature;
  byId('card-signature').lang = (key === 'lily' || key === 'birthday') ? 'ko' : 'zh-CN';
  byId('card-copy').replaceChildren(...content.copy.map(text => {
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    return paragraph;
  }));
}
birthdayLink.addEventListener('click', () => {
  if (card.dataset.kind !== 'lily' || card.classList.contains('is-closing')) return;
  card.dataset.kind = 'birthday';
  fillPaper('birthday');
  card.scrollTop = 0;
  byId('close-card').focus({preventScroll: true});
});
tag.addEventListener('click', () => openCard('lily', bouquet, bouquet));
tableInvite.addEventListener('click', () => openCard('invite', tableInvite, tableInvite));
cake.addEventListener('click', () => {
  if (!canInteract()) return;
  openCake();
});
function setPhotoBack(back) {
  flip.setAttribute('aria-pressed', String(back));
  flip.setAttribute('aria-label', back ? '翻到拍立得正面' : '翻到拍立得背面');
  flip.querySelector('.print-front').setAttribute('aria-hidden', String(back));
  flip.querySelector('.print-back').setAttribute('aria-hidden', String(!back));
  byId('print-instruction').textContent = back ? '轻触翻回' : '轻触翻面';
}
for (const photo of gardenPhotos) {
  const trigger = byId(photo.button);
  const print = document.createElement('img');
  print.className = 'desk-print';
  print.src = photo.src;
  print.alt = '';
  const [x, y, width, height] = photo.rect;
  Object.assign(print.style, {left: x + '%', top: y + '%', width: width + '%'});
  print.style.setProperty('--print-ratio', (width * 1122) / (height * 1402));
  print.style.setProperty('--print-cut', photo.cut);
  byId('desk-prints').append(print);
  trigger.addEventListener('click', () => {
    if (!canInteract()) return;
    prepareCard('photo', trigger, trigger);
    byId('print-image').src = photo.src;
    byId('print-image').alt = photo.alt;
    byId('print-caption').textContent = photo.caption;
    byId('print-note').textContent = photo.note;
    setPhotoBack(false);
    const origin = trigger.getBoundingClientRect();
    photoView.style.setProperty('--lift-x', origin.left + origin.width / 2 - innerWidth / 2 + 'px');
    photoView.style.setProperty('--lift-y', origin.top + origin.height / 2 - innerHeight / 2 + 'px');
    photoView.style.setProperty('--lift-angle', photo.angle + 'deg');
    showCard();
  });
}
flip.addEventListener('click', () => {
  if (!card.classList.contains('is-closing')) setPhotoBack(flip.getAttribute('aria-pressed') !== 'true');
});
function closeCard() {
  if (!card.open || card.classList.contains('is-closing')) return;
  dreamAudio.stopVoice();
  clearTimeout(replyTimer);
  if (reduced.matches) {
    card.close();
    return;
  }
  card.classList.add('is-closing');
  closeTimer = setTimeout(() => card.close(), (card.dataset.kind === 'photo' ? 330 : 290));
}
byId('skip-cue').addEventListener('click', () => {
  dreamAudio.stopVoice();
  cancelAnimationFrame(frame);
  clearTimeout(replyTimer);
  showCue(null);
});
byId('close-card').addEventListener('click', closeCard);
card.addEventListener('cancel', event => {
  event.preventDefault();
  closeCard();
});
card.addEventListener('click', event => {
  if (event.target === card) closeCard();
});
card.addEventListener('close', () => {
  if (phase !== 'garden' || card.open) return;
  card.classList.remove('is-closing');
  if (['lily', 'birthday'].includes(card.dataset.kind)) foldTag();
  chapterClosed();
  relaxCamera();
  cardTrigger?.focus({preventScroll: true});
  cardTrigger = null;
});
byId('replay').addEventListener('click', play);

const sound = byId('sound');
function syncVolume() {
  dreamAudio.setQuiet(film.classList.contains('ritual-quiet') || chapter.dataset.story?.startsWith('countdown'));
}
sound.addEventListener('click', () => {
  const enabled = dreamAudio.toggle();
  sound.setAttribute('aria-pressed',String(enabled));
  sound.textContent = enabled ? '音效开' : '音效关';
  sound.title = enabled ? '关闭音效' : '开启音效';
});
function unlockDreamAudio(event) {
  if (event.isTrusted && !sound.contains(event.target)) dreamAudio.start(true);
}
document.addEventListener('click',unlockDreamAudio,true);
document.addEventListener('keydown',event => {
  if (event.key === 'Enter' || event.key === ' ') unlockDreamAudio(event);
},true);
dreamAudio.start();

for (let i = 0; i < 13; i++) {
  const mote = document.createElement('i');
  mote.style.left = (8 + (i * 73 % 87)) + '%';
  mote.style.top = (8 + (i * 31 % 67)) + '%';
  mote.style.animationDelay = (-i * 1.3) + 's';
  byId('dust').append(mote);
}
initChapter();

const loading = byId('loading');
const notice = setTimeout(() => { loading.hidden = false; }, 600);
const assets = [...Array.from(film.querySelectorAll('img[src]'), image => image.src), 'assets/lilies-left.webp', 'assets/lilies-right.webp'];
Promise.all([...new Set(assets)].map(src => {
  const asset = new Image();
  asset.src = src;
  return asset.decode();
})).then(() => {
  clearTimeout(notice);
  loading.hidden = true;
  document.querySelector('.controls').hidden = false;
  sound.hidden = false;
  play();
}).catch(() => {
  clearTimeout(notice);
  loading.hidden = false;
  loading.textContent = '花房素材加载失败，请刷新后重试。';
});










