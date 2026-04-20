import { bios } from './src/data/bios.js';
const missing = ['gardener', 'merchant-prince', 'firefighter', 'ferryman', 'baker', 'the-bind', 'cook', 'lightkeeper', 'brewer', 'keymaker', 'veilwalker'];
for (const k of missing) {
  if (bios[k]) {
    console.log(`\n--- ${k.toUpperCase()} ---`);
    console.log(bios[k][0] || "No bio");
  }
}
