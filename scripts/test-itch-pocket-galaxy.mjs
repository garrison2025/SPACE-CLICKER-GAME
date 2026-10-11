import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const filename = new URL('../distribution/itch-io/index.html', import.meta.url);
const html = fs.readFileSync(filename, 'utf8');
const scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)];
assert.equal(scripts.length, 1, 'Exactly one self-contained inline gameplay script');
const code = scripts[0][1];
new vm.Script(code, {filename: 'pocket-galaxy.js'});
assert.match(html, /<html lang="en">/);
assert.match(html, /id="planet"/);
assert.match(html, /id="mine"/);
assert.match(html, /https:\/\/spaceclickergame\.com\//);
assert.doesNotMatch(html, /<iframe|<script[^>]*src=|<link[^>]*href="(?:https?:\/\/|\/)/i, 'No external runtime dependencies, redirects, or absolute asset paths');
assert.doesNotMatch(html, /adsbygoogle|google-analytics|pagead2\.googlesyndication|trackEvent|pixel\(/i, 'Distributed game must not load analytics or advertising');
assert.ok(html.length < 150000, 'HTML5 game should stay compact');

function session(seed=null) {
  const listeners = new Map();
  const store = new Map();
  if (seed) store.set('space-clicker-pocket-galaxy-v1', JSON.stringify(seed));
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
  const els = new Map(ids.map(id => [id, {
    textContent: '', style: {}, disabled: false,
    classList: {add() {},remove() {}},
    addEventListener(type, handler) { listeners.set(id + ':' + type, handler); },
    appendChild() {}
  }]));
  const intervals = [];
  const document = {
    getElementById(id) {assert.ok(els.has(id), 'Missing HTML id: ' + id); return els.get(id);},
    addEventListener(type, handler) {listeners.set('document:' + type, handler);},
    createElement() {return {className:'', textContent:'', style:{}, remove(){}};},
    activeElement: {tagName:'BODY'}
  };
  const context = {
    document,
    window: {matchMedia(){return {matches: true}}},
    localStorage: {
      getItem(key){return store.get(key) ?? null;},
      setItem(key,val){store.set(key,val)}
    },
    setInterval(fn){intervals.push(fn); return intervals.length;},
    setTimeout(){return 1;},
    confirm(){return true;},
    Date, JSON, Math, Number, String
  };
  vm.runInNewContext(code, context, {timeout:2500});
  const read = () => JSON.parse(store.get('space-clicker-pocket-galaxy-v1'));
  const click = id => { assert.ok(listeners.has(id + ':click'), 'Missing click handler: '+id); listeners.get(id + ':click')(); };
  return {click,read,intervals,els};
}
const play = session();
assert.equal(play.read().dust, 0);
play.click('mine');
assert.equal(play.read().dust, 1, 'Mining must earn exactly one Stardust');
for(let i=0;i<14;i++)play.click('planet');
assert.equal(play.read().dust, 15);
play.click('upgrade');
assert.equal(play.read().drill, 1);
assert.equal(play.read().dust, 5);
for(let i=0;i<12;i++)play.click('mine');
assert.ok(play.read().dust >=25);
play.click('drone');
assert.equal(play.read().drones, 1);
assert.equal(play.read().dust, 4);
const before=play.read().dust;
play.intervals[0]();
play.intervals[1]();
assert.ok(play.read().dust > before,'Automated drones must produce Stardust');

const ascension = session({dust:2500,runEarned:2500,drill:0,drones:0,dm:0,last:Date.now()});
ascension.click('prestige');
assert.equal(ascension.read().dm,1);
assert.equal(ascension.read().runEarned,0);
assert.equal(ascension.read().dust,0);
ascension.click('reset');
assert.equal(ascension.read().dm,0);
console.log('Pocket Galaxy validated: offline standalone, playable clicks, upgrades, drones, prestige, reset, no trackers.');
