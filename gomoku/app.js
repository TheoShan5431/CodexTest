"use strict";

(() => {
  const SIZE = 15;
  const board = document.querySelector('#board');
  const status = document.querySelector('#status');
  const undo = document.querySelector('#undo');
  let history = [];
  let winner = [];
  let finished = false;
  const cells = [];
  const names = ['黑棋', '白棋'];

  for (let index = 0; index < SIZE * SIZE; index += 1) {
    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'cell';
    cell.addEventListener('click', () => place(index));
    cell.addEventListener('keydown', (event) => {
      const row = Math.floor(index / SIZE);
      const col = index % SIZE;
      const directions = { ArrowLeft: [0, -1], ArrowRight: [0, 1], ArrowUp: [-1, 0], ArrowDown: [1, 0] };
      if (!directions[event.key]) return;
      event.preventDefault();
      const [dr, dc] = directions[event.key];
      const next = Math.max(0, Math.min(SIZE - 1, row + dr)) * SIZE + Math.max(0, Math.min(SIZE - 1, col + dc));
      cells.forEach((button, i) => { button.tabIndex = i === next ? 0 : -1; });
      cells[next].focus();
    });
    cells.push(cell);
    board.append(cell);
  }

  function winningLine(index, positions) {
    const row = Math.floor(index / SIZE);
    const col = index % SIZE;
    for (const [dr, dc] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
      const line = [index];
      for (const sign of [-1, 1]) {
        let r = row + sign * dr;
        let c = col + sign * dc;
        while (r >= 0 && r < SIZE && c >= 0 && c < SIZE && positions.has(r * SIZE + c)) {
          line.push(r * SIZE + c);
          r += sign * dr;
          c += sign * dc;
        }
      }
      if (line.length >= 5) return line;
    }
    return [];
  }

  function render() {
    const occupied = new Map(history.map((index, turn) => [index, turn % 2]));
    cells.forEach((cell, index) => {
      const color = occupied.get(index);
      cell.className = `cell${color === undefined ? '' : color === 0 ? ' black' : ' white'}${index === history.at(-1) ? ' last' : ''}${winner.includes(index) ? ' win' : ''}`;
      cell.setAttribute('aria-label', `第 ${Math.floor(index / SIZE) + 1} 行，第 ${index % SIZE + 1} 列，${color === undefined ? '空位' : names[color]}`);
      cell.setAttribute('aria-disabled', String(finished || color !== undefined));
    });
    status.textContent = winner.length ? `${names[(history.length - 1) % 2]}获胜！` : finished ? '棋盘已满，本局和棋。' : `轮到${names[history.length % 2]}落子`;
    document.querySelector('#moves').textContent = `已落 ${history.length} 手`;
    undo.disabled = history.length === 0;
  }

  function place(index) {
    if (finished || history.includes(index)) return;
    const turn = history.length % 2;
    history.push(index);
    winner = winningLine(index, new Set(history.filter((_, move) => move % 2 === turn)));
    finished = winner.length > 0 || history.length === SIZE * SIZE;
    cells.forEach((cell, i) => { cell.tabIndex = i === index ? 0 : -1; });
    render();
  }

  undo.addEventListener('click', () => {
    const index = history.pop();
    winner = [];
    finished = false;
    render();
    if (index !== undefined) {
      cells.forEach((cell, i) => { cell.tabIndex = i === index ? 0 : -1; });
      cells[index].focus();
    }
  });
  document.querySelector('#restart').addEventListener('click', () => {
    if (history.length && !window.confirm('确定清空棋盘，重新开始吗？')) return;
    history = [];
    winner = [];
    finished = false;
    cells.forEach((cell, i) => { cell.tabIndex = i === 112 ? 0 : -1; });
    render();
    cells[112].focus();
  });
  cells.forEach((cell, i) => { cell.tabIndex = i === 112 ? 0 : -1; });
  render();
})();
