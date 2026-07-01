const ENTRY_ML = 600;
const SUPABASE_URL = "https://sexfmvdjosqzyatmopyy.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNleGZtdmRqb3NxenlhdG1vcHl5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5MTQ4ODYsImV4cCI6MjA5ODQ5MDg4Nn0.DmGIru8Qqqc2zLrT9sYNzlf7O4OSvD4cpmiocytx6vE";
const PROFILE_ID = "agua-personal-bf4f2e8d9a0647d8b7e0cfe6b0f4c7a1";

const state = {
  entries: [],
  isLoading: true,
  isMutating: false,
  toastTimer: null,
};

const elements = {
  todayLiters: document.querySelector("#todayLiters"),
  syncStatus: document.querySelector("#syncStatus"),
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
  copyUrlButton: document.querySelector("#copyUrlButton"),
  exportButton: document.querySelector("#exportButton"),
};

function getHeaders() {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
  };
}

function getRestUrl(path, params = {}) {
  const url = new URL(`/rest/v1/${path}`, SUPABASE_URL);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url;
}

async function fetchEntries() {
  state.isLoading = true;
  updateSyncStatus("Sincronizando...");
  renderEntries();
  syncControls();

  const response = await fetch(
    getRestUrl("water_entries", {
      select: "id,amount_ml,source,created_at",
      profile_id: `eq.${PROFILE_ID}`,
      order: "created_at.desc",
      limit: "10000",
    }),
    {
      headers: getHeaders(),
      cache: "no-store",
    }
  );

  if (!response.ok) {
    throw new Error(`Supabase select failed with ${response.status}`);
  }

  const rows = await response.json();
  state.entries = rows.map((row) => ({
    id: row.id,
    amountMl: row.amount_ml,
    source: row.source,
    timestamp: Date.parse(row.created_at),
  }));
  state.isLoading = false;
  updateSyncStatus("Sincronizado");
  render();
  syncControls();
}

async function createEntry(source) {
  state.isMutating = true;
  updateSyncStatus("Guardando...");
  syncControls();

  const response = await fetch(getRestUrl("water_entries"), {
    method: "POST",
    headers: {
      ...getHeaders(),
      Prefer: "return=representation",
    },
    body: JSON.stringify([
      {
        profile_id: PROFILE_ID,
        amount_ml: ENTRY_ML,
        source,
      },
    ]),
  });

  state.isMutating = false;
  syncControls();

  if (!response.ok) {
    throw new Error(`Supabase insert failed with ${response.status}`);
  }

  await fetchEntries();
  showToast(source === "nfc" ? "Registro NFC guardado: +600 ml" : "Añadidos 600 ml");
}

function exportEntries() {
  const payload = {
    exportedAt: new Date().toISOString(),
    entryMl: ENTRY_ML,
    profileId: PROFILE_ID,
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
  if (state.isLoading) {
    elements.entriesList.innerHTML = '<li class="empty-state">Cargando registros...</li>';
    return;
  }

  if (!state.entries.length) {
    elements.entriesList.innerHTML = '<li class="empty-state">Todavía no hay registros en Supabase.</li>';
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
  nfcUrl.search = "";
  nfcUrl.hash = "";
  nfcUrl.searchParams.set("tap", "1");
  elements.nfcUrl.value = nfcUrl.toString();
}

function updateSyncStatus(message) {
  elements.syncStatus.textContent = message;
}

function showToast(message) {
  clearTimeout(state.toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("visible");
  state.toastTimer = window.setTimeout(() => elements.toast.classList.remove("visible"), 2200);
}

async function handleTapFromUrl() {
  const url = new URL(window.location.href);
  if (url.searchParams.get("tap") !== "1") {
    return;
  }

  try {
    await createEntry("nfc");
    url.searchParams.delete("tap");
    window.history.replaceState({}, "", url.toString());
  } catch (error) {
    updateSyncStatus("Error de sincronización");
    showToast("No se pudo guardar el toque NFC");
    console.error(error);
  }
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

function syncControls() {
  elements.quickAddButton.disabled = state.isMutating;
  elements.exportButton.disabled = state.isLoading || state.isMutating;
}

elements.quickAddButton.addEventListener("click", async () => {
  try {
    await createEntry("manual");
  } catch (error) {
    updateSyncStatus("Error de sincronización");
    showToast("No se pudo guardar el registro manual");
    console.error(error);
  }
});

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

render();
syncControls();
fetchEntries()
  .then(handleTapFromUrl)
  .catch((error) => {
    state.isLoading = false;
    updateSyncStatus("Error de sincronización");
    render();
    syncControls();
    showToast("Revisa la tabla y las policies de Supabase");
    console.error(error);
  });
registerServiceWorker();
