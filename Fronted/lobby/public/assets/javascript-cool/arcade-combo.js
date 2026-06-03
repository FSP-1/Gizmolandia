function run() {
  const moves = [
    { name: 'dash', points: 320 },
    { name: 'flip', points: 540 },
    { name: 'spark', points: 780 },
    { name: 'finish', points: 1100 }
  ];

  const total = moves.reduce((sum, move) => sum + move.points, 0);
  const power = Math.min(100, Math.round(total / 28));
  const rows = moves
    .map((move, index) => `<li><span>0${index + 1} / ${move.name}</span><strong>+${move.points}</strong></li>`)
    .join('');

  console.log('Arcade combo listo', total);

  return `<section class="js-arcade">
  <p class="eyebrow">Arcade combo</p>
  <h2>${total} puntos</h2>
  <div class="power-meter"><span style="width:${power}%"></span></div>
  <ul>${rows}</ul>
  <small>Perfect chain x${moves.length}</small>
</section>`;
}
