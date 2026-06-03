function run() {
  const tracks = [
    { title: 'Pixel sunrise', mood: 'focus', time: '02:48' },
    { title: 'Laser rain', mood: 'boost', time: '03:16' },
    { title: 'Midnight lobby', mood: 'chill', time: '04:05' }
  ];

  const cards = tracks
    .map((track, index) => `<article class="${index === 1 ? 'is-live' : ''}">
      <span>${track.time}</span>
      <strong>${track.title}</strong>
      <em>${track.mood}</em>
    </article>`)
    .join('');

  console.log('Playlist renderizada', tracks.length);

  return `<section class="js-playlist">
  <p class="eyebrow">Neon playlist</p>
  <h2>Lobby radio</h2>
  <div>${cards}</div>
</section>`;
}
