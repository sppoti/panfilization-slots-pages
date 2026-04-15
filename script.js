const symbols = ["🍒", "🍋", "🍉", "🔔", "⭐", "7️⃣"];
const STORAGE_KEY = "panfilization-slots-state-v1";

const gridEl = document.getElementById("grid");
const balanceEl = document.getElementById("balance");
const betEl = document.getElementById("bet");
const spinBtn = document.getElementById("spinBtn");
const resultTextEl = document.getElementById("resultText");
const flashEl = document.getElementById("flash");
const coinsAudio = document.getElementById("coinsAudio");

function randomSymbol() {
  return symbols[Math.floor(Math.random() * symbols.length)];
}

function generateGrid() {
  return Array.from({ length: 3 }, () =>
    Array.from({ length: 5 }, randomSymbol)
  );
}

function calculateWin(grid, bet) {
  let multiplier = 0;

  for (const row of grid) {
    const first = row[0];
    const sameCount = row.filter((item) => item === first).length;
    if (sameCount === 5) multiplier += 7;
    else if (sameCount === 4) multiplier += 3;
    else if (sameCount === 3) multiplier += 1.5;
  }

  for (let i = 0; i < 5; i += 1) {
    if (grid[0][i] === grid[1][i] && grid[1][i] === grid[2][i]) {
      multiplier += 2.5;
    }
  }

  return Math.floor(bet * multiplier);
}

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return { balance: 1000, gamesPlayed: 0, totalWon: 0 };
  try {
    return JSON.parse(raw);
  } catch {
    return { balance: 1000, gamesPlayed: 0, totalWon: 0 };
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const state = loadState();

function updateBalanceView() {
  balanceEl.textContent = `Balance: ${state.balance}`;
}

function setupGrid() {
  gridEl.innerHTML = "";
  for (let i = 0; i < 15; i += 1) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.textContent = randomSymbol();
    gridEl.appendChild(cell);
  }
}

function renderGrid(grid) {
  const flat = grid.flat();
  [...gridEl.children].forEach((cell, idx) => {
    cell.textContent = flat[idx];
  });
}

function setSpinning(spinning) {
  spinBtn.disabled = spinning;
  [...gridEl.children].forEach((cell) => {
    cell.classList.toggle("spinning", spinning);
  });
}

function showPanfilization() {
  flashEl.classList.remove("hidden");
  coinsAudio.currentTime = 0;
  coinsAudio.play().catch(() => {});
  setTimeout(() => flashEl.classList.add("hidden"), 1800);
}

async function spin() {
  const bet = Math.max(10, Math.floor(Number(betEl.value) || 50));
  betEl.value = String(bet);

  if (state.balance < bet) {
    resultTextEl.className = "lose";
    resultTextEl.textContent = "Not enough balance for this bet.";
    return;
  }

  setSpinning(true);
  resultTextEl.className = "";
  resultTextEl.textContent = "Spinning...";

  await new Promise((resolve) => setTimeout(resolve, 700));

  const grid = generateGrid();
  const win = calculateWin(grid, bet);
  const profit = win - bet;

  state.balance += profit;
  state.gamesPlayed += 1;
  state.totalWon += Math.max(win, 0);
  saveState(state);

  renderGrid(grid);
  updateBalanceView();
  setSpinning(false);

  if (win > 0) {
    resultTextEl.className = "win";
    resultTextEl.textContent = `You won ${win} coins. Balance: ${state.balance}`;
  } else {
    resultTextEl.className = "lose";
    resultTextEl.textContent = `No win. Balance: ${state.balance}`;
  }

  if (win >= bet * 4) {
    showPanfilization();
  }
}

setupGrid();
updateBalanceView();
spinBtn.addEventListener("click", spin);
