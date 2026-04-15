const symbols = ["🍒", "🍋", "🍉", "🔔", "⭐", "7️⃣"];
const STORAGE_KEY = "panfilization-slots-state-v1";
const MIN_BET = 10;
const MAX_BET = 10000;
const BET_STEP = 10;

const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
}

const gridEl = document.getElementById("grid");
const balanceEl = document.getElementById("balance");
const winsEl = document.getElementById("wins");
const betEl = document.getElementById("bet");
const betDownEl = document.getElementById("betDown");
const betUpEl = document.getElementById("betUp");
const spinBtn = document.getElementById("spinBtn");
const resultTextEl = document.getElementById("resultText");
const flashEl = document.getElementById("flash");
const coinsAudio = document.getElementById("coinsAudio");
const cells = [];

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
  if (!raw) return { balance: 1000, gamesPlayed: 0, totalWon: 0, winsCount: 0 };
  try {
    return JSON.parse(raw);
  } catch {
    return { balance: 1000, gamesPlayed: 0, totalWon: 0, winsCount: 0 };
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const state = loadState();

function updateBalanceView() {
  balanceEl.textContent = `Balance: ${state.balance}`;
  winsEl.textContent = `Wins: ${state.winsCount || 0}`;
}

function setupGrid() {
  gridEl.innerHTML = "";
  for (let i = 0; i < 15; i += 1) {
    const cell = document.createElement("div");
    cell.className = "cell";
    cell.textContent = randomSymbol();
    cells.push(cell);
    gridEl.appendChild(cell);
  }
}

function renderGrid(grid) {
  const flat = grid.flat();
  cells.forEach((cell, idx) => {
    cell.textContent = flat[idx];
  });
}

function setSpinning(spinning) {
  spinBtn.disabled = spinning;
  betDownEl.disabled = spinning;
  betUpEl.disabled = spinning;
  cells.forEach((cell) => {
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
  const bet = normalizeBetInput(betEl.value);
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
  if (win > 0) {
    state.winsCount = (state.winsCount || 0) + 1;
  }
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

function normalizeBetInput(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 50;
  const rounded = Math.floor(number / BET_STEP) * BET_STEP;
  return Math.min(MAX_BET, Math.max(MIN_BET, rounded));
}

function changeBet(direction) {
  const current = normalizeBetInput(betEl.value);
  const next = current + BET_STEP * direction;
  betEl.value = String(normalizeBetInput(next));
}

setupGrid();
updateBalanceView();
spinBtn.addEventListener("click", spin);
betDownEl.addEventListener("click", () => changeBet(-1));
betUpEl.addEventListener("click", () => changeBet(1));
betEl.addEventListener("change", () => {
  betEl.value = String(normalizeBetInput(betEl.value));
});
