const STORAGE_KEY = "agua-nfc-records-v1";
const ENTRY_ML = 600;

const state = {
  entries: loadEntries(),
  toastTimer: null,
};

const elements = {
  todayLiters: document.querySelector("#todayLiters"),
  weekLiters: document.querySelector("#weekLiters"),
  monthLiters: document.querySelector("#monthLiters"),
  yearLiters: document.querySelector("#yearLiters"),
  allTimeLiters: document.querySelector("#allTimeLiters"),
  entriesList: document.querySelector("#entriesList"),
  weekChart: document.querySelector("#weekChart"),
  weekTotalCaption: document.querySelector("#weekTotalCaption"),
  nfcUrl: document.querySelector("#nfcUrl"),
  toast: document.querySelector("#toast"),
  quickAddButton: document.querySelector("#quickAddButton"),
  undoButton: document.querySelector("#undoButton"),
  copyUrlButton: document.querySelector("#copyUrlButton"),
  exportButton: document.querySelector("#exportButton"),
  resetButton: document.querySelector("#resetButton"),
};

function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return parsed.filter((entry) => typeof entry?.timestamp === "number" && entry?.amountMl === ENTRY_ML);
  } catch {
    return [];
  }
}

function saveEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.entries));
}

function addEntry(source) {
  state.entries.unshift({
    id: crypto.randomUUID(),
    amountMl: ENTRY_ML,
    source,
    timestamp: Date.now(),
  });
  saveEntries();
  render();
  showToast(source === "nfc" ? "Registro NFC guardado: +600 ml" : "Añadidos 600 ml");
}

function undoLastEntry() {
  if (!state.entries.length) {
    showToast("No hay registros para deshacer");
    return;
  }

  state.entries.shift();
  saveEntries();
  render();
  showToast("Último registro eliminado");
}

function resetEntries() {
  const confirmed = window.confirm("Se borrarán todos los registros guardados en este iPhone.");
  if (!confirmed) {
    return;
  }

  state.entries = [];
  saveEntries();
  render();
  showToast("Datos borrados");
}

function exportEntries() {
  const payload = {
    exportedAt: new Date().toISOString(),
    entryMl: ENTRY_ML,
    entries: state.entries,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `agua-nfc-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
  showToast("Exportación lista");
}

function sumEntries(filterFn) {
  return state.entries.reduce((sum, entry) => (filterFn(entry) ? sum + entry.amountMl : sum), 0);
}

function formatLiters(ml) {
  return `${(ml / 1000).toFixed(1)} L`;
}

function formatTimestamp(timestamp) {
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function isSameDay(dateA, dateB) {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  );
}

function getWeekStart(date) {
  const copy = startOfDay(date);
  const day = copy.getDay() || 7;
  copy.setDate(copy.getDate() - day + 1);
  return copy;
}

function isSameWeek(dateA, dateB) {
  return getWeekStart(dateA).getTime() === getWeekStart(dateB).getTime();
}

function isSameMonth(dateA, dateB) {
  return dateA.getFullYear() === dateB.getFullYear() && dateA.getMonth() === dateB.getMonth();
}

function isSameYear(dateA, dateB) {
  return dateA.getFullYear() === dateB.getFullYear();
}

function renderMetrics() {
  const now = new Date();
  const todayMl = sumEntries((entry) => isSameDay(new Date(entry.timestamp), now));
  const weekMl = sumEntries((entry) => isSameWeek(new Date(entry.timestamp), now));
  const monthMl = sumEntries((entry) => isSameMonth(new Date(entry.timestamp), now));
  const yearMl = sumEntries((entry) => isSameYear(new Date(entry.timestamp), now));
  const allTimeMl = sumEntries(() => true);

  elements.todayLiters.textContent = formatLiters(todayMl);
  elements.weekLiters.textContent = formatLiters(weekMl);
  elements.monthLiters.textContent = formatLiters(monthMl);
  elements.yearLiters.textContent = formatLiters(yearMl);
  elements.allTimeLiters.textContent = formatLiters(allTimeMl);
  elements.weekTotalCaption.textContent = `${formatLiters(weekMl)} esta semana`;
}

function renderEntries() {
  if (!state.entries.length) {
    elements.entriesList.innerHTML = '<li class="empty-state">Todavía no hay registros.</li>';
    return;
  }

  elements.entriesList.innerHTML = state.entries
    .slice(0, 12)
    .map(
      (entry) => `
        <li class="entry-item">
          <div>
            <div class="entry-value">${formatLiters(entry.amountMl)}</div>
            <div class="entry-meta">${entry.source === "nfc" ? "NFC" : "Manual"} · ${formatTimestamp(entry.timestamp)}</div>
          </div>
          <span class="entry-meta">${entry.amountMl} ml</span>
        </li>
      `
    )
    .join("");
}

function getWeekBuckets() {
  const today = new Date();
  const weekStart = getWeekStart(today);
  const labels = ["L", "M", "X", "J", "V", "S", "D"];
  const buckets = Array.from({ length: 7 }, (_, index) => {
    const day = new Date(weekStart);
    day.setDate(weekStart.getDate() + index);
    return { date: day, label: labels[index], amountMl: 0 };
  });

  for (const entry of state.entries) {
    const entryDate = new Date(entry.timestamp);
    const bucket = buckets.find((item) => isSameDay(item.date, entryDate));
    if (bucket) {
      bucket.amountMl += entry.amountMl;
    }
  }

  return buckets;
}

function renderWeekChart() {
  const buckets = getWeekBuckets();
  const max = Math.max(...buckets.map((bucket) => bucket.amountMl), ENTRY_ML);

  elements.weekChart.innerHTML = buckets
    .map((bucket) => {
      const height = Math.max(12, Math.round((bucket.amountMl / max) * 130));
      const dayValue = bucket.amountMl ? `${(bucket.amountMl / 1000).toFixed(1)}L` : "";
      return `
        <div class="day-bar-wrap">
          <span class="day-value">${dayValue}</span>
          <div class="day-bar" style="height:${height}px" aria-label="${bucket.label}: ${bucket.amountMl} mililitros"></div>
          <span class="day-label">${bucket.label}</span>
        </div>
      `;
    })
    .join("");
}

function renderNfcUrl() {
  const nfcUrl = new URL(window.location.href);
  nfcUrl.searchParams.set("tap", "1");
  nfcUrl.hash = "";
  elements.nfcUrl.value = nfcUrl.toString();
}

function showToast(message) {
  clearTimeout(state.toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("visible");
  state.toastTimer = window.setTimeout(() => elements.toast.classList.remove("visible"), 2200);
}

function handleTapFromUrl() {
  const url = new URL(window.location.href);
  if (url.searchParams.get("tap") !== "1") {
    return;
  }

  addEntry("nfc");
  url.searchParams.delete("tap");
  window.history.replaceState({}, "", url.toString());
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {});
  }
}

function render() {
  renderMetrics();
  renderEntries();
  renderWeekChart();
  renderNfcUrl();
}

elements.quickAddButton.addEventListener("click", () => addEntry("manual"));
elements.undoButton.addEventListener("click", undoLastEntry);
elements.copyUrlButton.addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(elements.nfcUrl.value);
    showToast("URL copiada");
  } catch {
    elements.nfcUrl.select();
    document.execCommand("copy");
    showToast("URL copiada");
  }
});
elements.exportButton.addEventListener("click", exportEntries);
elements.resetButton.addEventListener("click", resetEntries);

render();
handleTapFromUrl();
registerServiceWorker();
