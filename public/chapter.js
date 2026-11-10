const chapter = document.getElementById('chapter');
let story = 'greenhouse';
let storyTimer;
let ringResponseFinished = false;
let giftSequenceCompleted = false;
let detailTimer;
let reading = '';
const tarotCards = [
  {id:'star', title:'星星', english:'THE STAR', theme:'希望、方向、信念', text:'你最厉害的地方，\n不是从来不怕黑。\n\n是就算天黑了，\n你也知道自己要往哪里走。\n\n愿你以后走的每一步，\n都更接近你真正想要的生活。'},
  {id:'sun', title:'太阳', english:'THE SUN', theme:'生命力、快乐、好运', text:'听说太阳抽到太阳，\n是双倍的好运。\n\n愿你喜欢的天气总在周末，\n想去的地方都能出发，\n钱包越来越鼓，\n快乐越来越不讲道理。\n\n毕竟，你本来就很会享受生活。'},
  {id:'lovers', title:'恋人', english:'THE LOVERS', theme:'爱情、选择、亲密', lines:['闵玧其看了一眼牌，慢悠悠地笑了。','这张还需要我解释？','你老公就在旁边呢。']}
];
const stones = [
  ['rose','粉晶',['听说这个招桃花。','他看了看你，轻轻挑眉。','怎么，家里这一个还不够？']],
  ['violet','紫水晶',['听说紫水晶能带来好梦。','他笑了笑。','那今晚，可得梦见我。']],
  ['clear','白水晶',['阳光穿过透明水晶，在桌布上落下一小道彩虹。','格格，看这里。','发现没有？里面藏了道彩虹。']],
  ['gold','黄水晶',['闵玧其瞥了一眼。','这个是招财的？','怎么，老公的钱不都是你的吗？','他看着你笑了笑。','知道，我们格格自己赚钱也厉害。','那你的钱存着，我的拿去花。行了吧？']]
];
const jewelAssets = ['tab','silver','green','main'];
const finaleChoices = [
  {name:'易拉罐拉环', lines:['怎么想到选这个，亲爱的？','啊……','我给的都行，是吗？','那我就亲自替你戴上。','不用金属，也给你留个记号。','他握住你的手，低下头，在你的无名指上轻轻咬了一下。','像是用浅浅的齿痕，替你戴了一枚看不见的戒指。']},
  {name:'银色素圈', lines:['这个倒是很像你。','平时也能戴。','不过今天，先别急着决定。']},
  {name:'深绿色宝石戒指', lines:['这枚，我也挑了很久。','你不是说过，绿色很有生命力吗？','你说过的话，我都记得。','看来我还挺了解你的。']},
  {name:'主戒指', lines:['这个，留给今天的你。','来，把手给我。']}
];
function sequence(lines, render, done, offsets) {
  let i = 0;
  function tick() {
    render(lines[i++]);
    if (i < lines.length) detailTimer = setTimeout(tick, offsets ? offsets[i] - offsets[i-1] : 1780);
    else done?.();
  }
  tick();
}
function resetRitual() {
  clearTimeout(storyTimer);
  story = 'greenhouse';
  delete chapter.dataset.story;
  film.classList.remove('ritual-quiet');
  syncVolume();
  byId('cake-view').removeAttribute('data-blown');
  for (const id of ['wick-controls','cake-touch','blow-close','skip-ritual','cake-count','close-flames','cake-smoke','gift-touch','gift-open']) {
    byId(id).hidden = true;
  }
}
function resetChapter() {
  resetRitual();
  ringResponseFinished = giftSequenceCompleted = false;
  byId('opened-gift').hidden = true;
  clearTimeout(detailTimer);
  reading = '';
  chapter.hidden = true;
  resetEnding();
  clearCrystals();
  byId('cake-smoke').hidden = byId('close-flames').hidden = true;
  byId('cake-view').removeAttribute('data-blown');
  byId('tarot-deck').querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed','false'));
  byId('crystals').querySelectorAll('.lit').forEach(stone => stone.classList.remove('lit'));
  byId('finale-choices').querySelectorAll('button').forEach(button => button.setAttribute('aria-pressed','false'));
  byId('accept-ring').hidden = byId('finale-skip').hidden = true;
}
function chapterClosed() {
  if (ending.hidden) dreamAudio.selectTrack('surge');
  if (ringResponseFinished && ['finale','keepsake'].includes(card.dataset.kind)) {
    giftSequenceCompleted = true;
    byId('opened-gift').hidden = false;
  }
  resetRitual();
  clearTimeout(detailTimer);
  clearCrystals();
}
function chapterMode(kind, title) {
  card.dataset.kind = kind;
  card.setAttribute('aria-labelledby','chapter-title');
  byId('chapter-title').textContent = title;
  chapter.hidden = false;
  paper.hidden = photoView.hidden = true;
  byId('tarot-view').hidden = kind !== 'tarot';
  byId('cake-view').hidden = kind !== 'cake';
  byId('gift-view').hidden = kind !== 'gift';
  byId('finale-view').hidden = kind !== 'finale';
  byId('keepsake-view').hidden = kind !== 'keepsake';
  byId('close-card').setAttribute('aria-label','回到花园');
}
function openChapter(kind, title, trigger, spot) {
  if (!canInteract()) return;
  prepareCard(kind, trigger, spot);
  chapterMode(kind,title);
  showCard();
}
function cardArt(id) {
  return '<img src="assets/tarot-'+id+'.webp" alt="">';
}
function clearCrystals() {
  delete byId('tarot-view').dataset.stone;
  byId('crystals').querySelectorAll('.lit').forEach(stone => stone.classList.remove('lit'));
}
function initChapter() {
  const tarot = byId('tarot');
  byId('tarot-deck').innerHTML = tarotCards.map(item =>
    '<button class="tarot-card" aria-label="翻开'+item.title+'" aria-pressed="false"><span class="tarot-turn"><span class="tarot-back">'+cardArt('back')+'</span><span class="tarot-front '+item.id+'">'+cardArt(item.id)+'<b>'+item.english+'</b></span></span></button>'
  ).join('');
  [...byId('tarot-deck').children].forEach((button,index) => button.addEventListener('click', () => {
    if (card.classList.contains('is-closing')) return;
    const item = tarotCards[index];
    if (reading === item.id) return;
    reading = item.id;
    dreamAudio.stopVoice();
    clearCrystals();
    clearTimeout(detailTimer);
    button.setAttribute('aria-pressed','true');
    const output = byId('tarot-reading');
    output.replaceChildren();
    const title = document.createElement('strong');
    title.textContent = item.title + ' · ' + item.english;
    const words = document.createElement('p');
    output.append(title, words);
    if (item.lines) detailTimer = setTimeout(() => {
      const voiced = dreamAudio.playVoice('05_tarot_lovers');
      sequence(item.lines, line => { words.textContent = line; }, undefined, voiced ? [0,280,3150] : undefined);
    },720);
    else detailTimer = setTimeout(() => { words.textContent = item.text; }, 420);
  }));
  byId('crystals').innerHTML = stones.map(([id,name]) =>
    '<button class="crystal '+id+'" aria-label="观察'+name+'"><img src="assets/crystal-'+id+'.webp" alt=""><span>'+name+'</span></button>'
  ).join('');
  [...byId('crystals').children].forEach((button,index) => button.addEventListener('click', () => {
    if (card.classList.contains('is-closing')) return;
    reading = '';
    dreamAudio.stopVoice();
    clearTimeout(detailTimer);
    clearCrystals();
    const [id,,lines] = stones[index];
    byId('tarot-view').dataset.stone = id;
    button.classList.add('lit');
    const output = byId('tarot-reading');
    output.textContent = '';
    detailTimer = setTimeout(() => {
      const voices = {
        rose:['06_rose_quartz',[0,3100,4550]],
        violet:['07_amethyst',[0,2850,4250]],
        clear:['08_clear_quartz',[0,340,3290]],
        gold:['09_citrine',[0,190,3300,4700,6400,12400]]
      };
      const [key,times] = voices[id];
      sequence(lines, line => { output.textContent = line; },undefined,dreamAudio.playVoice(key) ? times : undefined);
    }, id === 'clear' ? 720 : 200);
  }));
  tarot.addEventListener('click', () => {
    if (!canInteract()) return;
    reading = '';
    byId('tarot-reading').textContent = '翻开一张牌，或者碰碰桌上的水晶。';
    openChapter('tarot','塔罗与水晶',tarot,tarot);
  });
  [...byId('wick-controls').children].forEach((button,index) => button.addEventListener('click', () => lightCandles(index)));
  for (const id of ['cake-touch','blow-close']) byId(id).addEventListener('click', startCountdown);
  for (const id of ['gift-touch','gift-open']) byId(id).addEventListener('click', openGift);
  byId('skip-ritual').addEventListener('click', () => { dreamAudio.stopVoice(); extinguish(false); });
  byId('opened-gift').addEventListener('click', replayGiftReply);
  byId('finale-choices').innerHTML = finaleChoices.map((item,index) =>
    '<button style="--ring-position:'+([15,38,62,85][index])+'%;--delay:'+(-index*.87)+'s" aria-label="'+item.name+'" aria-pressed="false"><span class="jewel"><img src="assets/jewel-'+jewelAssets[index]+'.webp" alt=""></span></button>'
  ).join('');
  [...byId('finale-choices').children].forEach((button,index) => button.addEventListener('click', () => selectFinale(index)));
  byId('finale-skip').addEventListener('click', () => {
    dreamAudio.stopVoice();
    clearTimeout(detailTimer);
    byId('finale-response').textContent = '';
    byId('finale-skip').hidden = true;
  });
  byId('accept-ring').addEventListener('click', () => {
    if (card.dataset.kind !== 'finale' || card.classList.contains('is-closing')) return;
    clearTimeout(detailTimer);
    chapterMode('keepsake','11.11 · For Gege');
    dreamAudio.playVoice('19_birthday_wish');
    byId('keepsake-view').querySelector('a').focus({preventScroll:true});
  });
  initEnding();
}
function setStory(next) {
  story = next;
  chapter.dataset.story = next;
}
function afterStory(ms, action) {
  clearTimeout(storyTimer);
  storyTimer = setTimeout(() => {
    if (card.open && !card.classList.contains('is-closing')) action();
  }, ms);
}
function openCake() {
  resetRitual();
  if (giftSequenceCompleted) {
    setStory('cake-epilogue');
    openChapter('cake','生日蛋糕',cake,cake);
    sequence(['就这么喜欢？','下次再给你买。'], line => { byId('cake-line').textContent = line; });
    return;
  }
  setStory('cake-intro');
  byId('cake-line').textContent = '先把蜡烛点亮呀。';
  openChapter('cake','生日蛋糕',cake,cake);
  byId('wick-controls').hidden = false;
}
function lightCandles(first) {
  if (story !== 'cake-intro' || card.classList.contains('is-closing')) return;
  setStory('cake-lighting');
  byId('wick-controls').hidden = true;
  const flames = [...byId('close-flames').children];
  [first,...flames.map((_,i) => i).filter(i => i !== first)].forEach((index,order) => {
    flames[index].style.setProperty('--ignite', (.05 + order * .28) + 's');
  });
  byId('close-flames').hidden = false;
  afterStory(reduced.matches ? 100 : 1000, () => {
    setStory('cake-wish');
    byId('cake-line').textContent = '闭上眼睛，许个愿。';
    byId('cake-touch').hidden = byId('blow-close').hidden = false;
    byId('blow-close').focus({preventScroll:true});
  });
}
const countdown = [
  [1350,'countdown-first','闭上眼睛。'],
  [950,'countdown-first','',5],
  [950,'countdown-first','',4],
  [960,'countdown-first','',3],
  [1380,'countdown-interrupt','不乖哦。'],
  [1900,'countdown-interrupt','怎么还笑着不闭眼睛呢？'],
  [1300,'countdown-interrupt','乖乖闭上。'],
  [1680,'countdown-second','好啦，这次真的开始了。'],
  [950,'countdown-second','',3],
  [950,'countdown-second','',2],
  [780,'countdown-second','',1]
];
function startCountdown() {
  if (story !== 'cake-wish' || card.classList.contains('is-closing')) return;
  byId('cake-touch').hidden = byId('blow-close').hidden = true;
  byId('skip-ritual').hidden = false;
  byId('skip-ritual').focus({preventScroll:true});
  let index = 0;
  let firstVoiced = false, teaseVoiced = false, secondVoiced = false;
  function tick() {
    const position = index++;
    const step = countdown[position];
    if (!step) { extinguish(secondVoiced); return; }
    if (position === 0) firstVoiced = dreamAudio.playVoice('cake_01_first_countdown');
    if (position === 4) teaseVoiced = dreamAudio.playVoice('cake_02_teasing_interrupt');
    if (position === 8) secondVoiced = dreamAudio.playVoice('cake_03_second_countdown');
    const [duration, state, line, digit] = step;
    setStory(state);
    film.classList.toggle('ritual-quiet', state === 'countdown-interrupt');
    syncVolume();
    byId('cake-line').textContent = line;
    const count = byId('cake-count');
    count.hidden = !digit;
    count.textContent = digit ?? '';
    if (digit && !reduced.matches) count.animate([{opacity:.2,transform:'scale(.94)'},{opacity:1,transform:'scale(1)'}],{duration:260});
    const firstTimes = [1800,1250,1230,1050];
    const teaseTimes = [3100,2380,2220];
    const secondTimes = [700,950,700];
    const timed = position < 4 ? firstVoiced && firstTimes[position]
      : position < 7 ? teaseVoiced && teaseTimes[position-4]
      : position >= 8 && secondVoiced && secondTimes[position-8];
    afterStory(timed || duration,tick);
  }
  tick();
}
function extinguish(combinedVoice) {
  if (!story.startsWith('countdown-') || card.classList.contains('is-closing')) return;
  setStory('candle-out');
  film.classList.remove('ritual-quiet');
  syncVolume();
  for (const id of ['skip-ritual','close-flames','cake-count']) byId(id).hidden = true;
  byId('cake-line').textContent = '';
  byId('cake-smoke').hidden = false;
  byId('cake-view').dataset.blown = '';
  afterStory(1110, () => {
    setStory('gift-reveal');
    dreamAudio.selectTrack('lover');
    chapterMode('gift','礼物揭晓');
    byId('gift-line').textContent = '好了，睁眼。';
    afterStory(combinedVoice ? 2800 : 1550, () => {
      setStory('gift-ready');
      byId('gift-line').textContent = '';
      byId('gift-touch').hidden = byId('gift-open').hidden = false;
      byId('gift-open').focus({preventScroll:true});
    });
  });
}
function openGift() {
  if (story !== 'gift-ready' || card.classList.contains('is-closing')) return;
  setStory('gift-opening');
  byId('gift-touch').hidden = byId('gift-open').hidden = true;
  afterStory(reduced.matches ? 250 : 1470,revealFinale);
}
function revealFinale() {
  ringResponseFinished = false;
  setStory('ring-selection');
  chapterMode('finale','压轴礼物');
  byId('finale-response').textContent = '挑一件看看。';
  byId('accept-ring').hidden = byId('finale-skip').hidden = true;
  for (const button of byId('finale-choices').children) button.setAttribute('aria-pressed','false');
  byId('finale-choices').style.removeProperty('--selected');
  byId('finale-choices').firstElementChild.focus({preventScroll:true});
}
function selectFinale(index) {
  if (card.dataset.kind !== 'finale' || card.classList.contains('is-closing')) return;
  const choices = [...byId('finale-choices').children];
  if (choices[index].getAttribute('aria-pressed') === 'true') {
    dreamAudio.stopVoice();
    clearTimeout(detailTimer);
    choices[index].setAttribute('aria-pressed','false');
    byId('accept-ring').hidden = byId('finale-skip').hidden = true;
    byId('finale-response').textContent = '挑一件看看。';
    return;
  }
  clearTimeout(detailTimer);
  choices.forEach((button,i) => button.setAttribute('aria-pressed',String(index === i)));
  byId('finale-choices').style.setProperty('--selected',choices[index].style.getPropertyValue('--ring-position'));
  byId('accept-ring').hidden = true;
  byId('finale-skip').hidden = index !== 0;
  const voiceKeys = ['15_ring_pulltab','16_ring_silverband','17_ring_green_gem','18_ring_main_ring'];
  const times = [[0,3900,5200,9350,12300,14800,17000],[0,2500,4700],[0,3900,6400,8450],[0,3800]];
  const voiced = dreamAudio.playVoice(voiceKeys[index]);
  sequence(finaleChoices[index].lines, line => { byId('finale-response').textContent = line; },
    () => {
      ringResponseFinished = true;
      if (index === 3) byId('accept-ring').hidden = false;
    },voiced ? times[index] : undefined);
}






const giftReply = [
  '闵玧其看着她，懒懒地笑了。',
  '怎么，还想再拆一次？',
  '戒指都给你了。',
  '还想从我这里拿走什么，嗯？'
];
function replayGiftReply() {
  if (!giftSequenceCompleted || !canInteract()) return;
  const box = byId('opened-gift');
  focusObject(box);
  if (!reduced.matches) box.animate([{rotate:'0deg'},{rotate:'-.9deg'},{rotate:'.6deg'},{rotate:'0deg'}],{duration:510});
  const first = performance.now();
  const starts = [0,1650,3650,5400,8500];
  const cues = giftReply.map((line,i) => [0,0,i === 0 ? '' : '闵玧其',line]);
  let index = 0;
  function tick(now) {
    if (!canInteract()) return;
    const elapsed = now - first;
    while (elapsed >= starts[index+1]) index++;
    showCue(cues[index]);
    if (index < giftReply.length) frame = requestAnimationFrame(tick);
    else relaxCamera();
  }
  frame = requestAnimationFrame(tick);
}
