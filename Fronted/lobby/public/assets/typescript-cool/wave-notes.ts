export function run() {
  const notes = ['Editable source', 'Safe runtime', 'Pretty preview'];
  const items = notes.map((note) => `<li>${note}</li>`).join('');

  console.log('Wave Notes ready');

  return `<section class="ts-notes">
  <p class="eyebrow">Wave notes</p>
  <h2>TypeScript list builder</h2>
  <ul>${items}</ul>
</section>`;
}
