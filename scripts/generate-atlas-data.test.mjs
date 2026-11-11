// node --test scripts/generate-atlas-data.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { classifyAtlas, MECHANIC_LABELS } from './generate-atlas-data.mjs';

const icon = (name) => `Art/2DArt/SkillIcons/passives/AtlasTrees/${name}.png`;

// Shaped like grindinggear/atlastree-export's data.json. Node ids are
// arbitrary on purpose: nothing may depend on them.
const exportData = {
  nodes: {
    root: { group: 0, out: ['1'] },
    1: { skill: 1, name: 'Breach Chance', icon: icon('NewBreachNode'), stats: [], group: 1 },
    2: { skill: 2, name: 'Flash Breach', icon: icon('BreachNotable3'), isNotable: true, stats: [], group: 1 },
    3: { skill: 3, name: 'Breach', icon: icon('AtlasPassiveMasteryBreach'), isMastery: true, stats: [], group: 1 },
    4: { skill: 4, name: 'Syndicate Chance', icon: icon('JunNode2'), stats: [], group: 2 },
    5: { skill: 5, name: 'Ore Chance', icon: icon('KalguurNode'), stats: [], group: 3 },
    // keystone with a one-off icon: must be caught by its stat text
    6: { skill: 6, name: 'Some Keystone', icon: icon('OneOffArt'), isKeystone: true, stats: ['Delirium Fog in your Maps never dissipates'], group: 4 },
    // nothing to go on but its neighbours
    7: { skill: 7, name: 'Mystery', icon: icon('Unknowable'), stats: ['50% increased effect'], group: 2 },
    // nothing to go on at all
    8: { skill: 8, name: 'Enigma', icon: icon('Unknowable'), stats: [], group: 9 },
    9: { skill: 9, name: 'Mortal Gateway', icon: icon('MasteryBlank'), isWormhole: true, stats: [], group: 5 },
    10: { skill: 10, name: 'Map Drop Chance', icon: icon('Mapnode'), stats: [], group: 6 },
    // 3.30's replacement for scarabs
    11: { skill: 11, name: 'Thread Spinner', icon: icon('ThreadNode1'), stats: [], group: 7 },
  },
};

const { nodes, report } = classifyAtlas(exportData);

test('classifies by icon name', () => {
  assert.equal(nodes[1].mechanic, 'breach');
  assert.equal(nodes[2].mechanic, 'breach');
  assert.equal(nodes[4].mechanic, 'betrayal'); // Jun -> betrayal
  assert.equal(nodes[5].mechanic, 'settlers_of_kalguur');
  assert.equal(nodes[10].mechanic, 'maps');
  assert.equal(nodes[11].mechanic, 'threads');
});

test('falls back to keywords in the stat text', () => {
  assert.equal(nodes[6].mechanic, 'delirium');
});

test('falls back to the group majority, then to general', () => {
  assert.equal(nodes[7].mechanic, 'betrayal');
  assert.equal(nodes[8].mechanic, 'general');
});

test('records node kinds', () => {
  assert.equal(nodes[1].kind, 'small');
  assert.equal(nodes[2].kind, 'notable');
  assert.equal(nodes[3].kind, 'mastery');
  assert.equal(nodes[6].kind, 'keystone');
  assert.equal(nodes[9].kind, 'gateway');
});

test('skips the root and reports what needs a human look', () => {
  assert.equal(nodes.root, undefined);
  assert.deepEqual(
    report.review.map(({ name }) => name).sort(),
    ['Enigma', 'Mortal Gateway', 'Mystery'],
  );
});

test('every mechanic a rule can produce has a label', () => {
  for (const { mechanic } of Object.values(nodes)) {
    assert.ok(MECHANIC_LABELS[mechanic], `no label for ${mechanic}`);
  }
});
