export function run() {
  const stats = [
    { label: 'Safe', value: 'checked' },
    { label: 'Rendered', value: 'yes' },
    { label: 'Editable', value: 'on' }
  ];

  const tiles = stats
    .map((item) => `<article class="stat-tile"><span>${item.label}</span><strong>${item.value}</strong></article>`)
    .join('');

  console.log('Prism Stats rendered', stats.length);

  return `<section class="ts-stats">
  <p class="eyebrow">Prism stats</p>
  <h2>Status strip from TypeScript</h2>
  <div class="tile-grid">${tiles}</div>
</section>`;
}
