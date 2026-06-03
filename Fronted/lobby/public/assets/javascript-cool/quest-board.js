function run() {
  const quests = [
    { task: 'Diseñar avatar', reward: '120 XP', done: true },
    { task: 'Ganar una partida', reward: '260 XP', done: false },
    { task: 'Subir captura', reward: '90 XP', done: true }
  ];

  const completed = quests.filter((quest) => quest.done).length;
  const questItems = quests
    .map((quest) => `<li class="${quest.done ? 'done' : ''}">
      <span>${quest.done ? 'OK' : 'GO'}</span>
      <strong>${quest.task}</strong>
      <em>${quest.reward}</em>
    </li>`)
    .join('');

  console.log('Misiones completadas', completed);

  return `<section class="js-quests">
  <p class="eyebrow">Quest board</p>
  <h2>${completed}/${quests.length} misiones</h2>
  <ul>${questItems}</ul>
</section>`;
}
