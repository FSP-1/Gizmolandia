export function run() {
  const chips = ['Glow', 'Motion', 'Safe']
    .map((label) => `<span class="chip">${label}</span>`)
    .join('');

  console.log('Nebula Pulse running');

  return `<section class="ts-card">
  <p class="eyebrow">Nebula pulse</p>
  <h2>Card output from TypeScript</h2>
  <div class="chip-row">${chips}</div>
</section>`;
}
