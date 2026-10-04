/* =========================================================
   YF REPONCIL PRIVATE ACCESS
   One-account frontend gate.
   IMPORTANT: for real production security, move auth to a backend.
   ========================================================= */
(() => {
  const LOGIN_USERNAME = "Yfreponcil";
  const LOGIN_PASSWORD = "Yfreponcil23";
  const SESSION_KEY = "yf_reponcil_authenticated";

  const gate = document.getElementById("loginGate");
  const form = document.getElementById("loginForm");
  const username = document.getElementById("loginUsername");
  const password = document.getElementById("loginPassword");
  const error = document.getElementById("loginError");
  const toggle = document.getElementById("togglePassword");
  const logout = document.getElementById("logoutBtn");
  const batteryLogout = document.getElementById("batteryLogoutBtn");
  const homeLogout = document.getElementById("homeLogoutBtn");
  const homePage = document.getElementById("homePage");
  const lcdPage = document.getElementById("lcdPage");
  const batteryPage = document.getElementById("batteryPage");
  const settingsPage = document.getElementById("settingsPage");

  function showPage(page) {
    homePage?.classList.toggle("hidden", page !== "home");
    lcdPage?.classList.toggle("hidden", page !== "lcd");
    batteryPage?.classList.toggle("hidden", page !== "battery");
    settingsPage?.classList.toggle("hidden", page !== "settings");
    document.querySelectorAll("[data-nav-page]").forEach(button => {
      button.classList.toggle("active", button.dataset.navPage === page);
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  window.yfShowPage = showPage;

  function doLogout() {
    sessionStorage.removeItem(SESSION_KEY);
    username.value = "";
    password.value = "";
    if (error) error.textContent = "";
    showPage("home");
    setLocked(true);
  }

  document.getElementById("openLcdBtn")?.addEventListener("click", () => showPage("lcd"));
  document.getElementById("openBatteryBtn")?.addEventListener("click", () => showPage("battery"));
  document.querySelectorAll("[data-nav-page]").forEach(button => {
    button.addEventListener("click", () => showPage(button.dataset.navPage));
  });
  document.querySelectorAll("[data-back-menu]").forEach(button => button.addEventListener("click", () => showPage("home")));
  const settingsLogout = document.getElementById("settingsLogoutBtn");
  const settingsLogoutAction = document.getElementById("settingsLogoutAction");
  [logout, batteryLogout, homeLogout, settingsLogout, settingsLogoutAction].filter(Boolean)
    .forEach(button => button.addEventListener("click", doLogout));

  function setLocked(locked) {
    document.body.classList.toggle("login-locked", locked);
    if (gate) gate.classList.toggle("hidden", !locked);
    if (locked) {
      setTimeout(() => username?.focus(), 80);
    }
  }

  function isAuthenticated() {
    return sessionStorage.getItem(SESSION_KEY) === "1";
  }

  function login() {
    const u = String(username?.value || "").trim();
    const p = String(password?.value || "");

    if (u === LOGIN_USERNAME && p === LOGIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "1");
      if (error) error.textContent = "";
      setLocked(false);
      showPage("home");
      return;
    }

    if (error) error.textContent = "Username atau password tidak sesuai.";
    password.value = "";
    password.focus();
  }

  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    login();
  });

  toggle?.addEventListener("click", () => {
    const showing = password.type === "text";
    password.type = showing ? "password" : "text";
    toggle.textContent = showing ? "Lihat" : "Sembunyikan";
    toggle.setAttribute("aria-label", showing ? "Tampilkan password" : "Sembunyikan password");
  });

  setLocked(!isAuthenticated());
  showPage("home");
})();

const input = document.getElementById("searchInput");
const clearBtn = document.getElementById("clearBtn");
const brandFilter = document.getElementById("brandFilter");
const results = document.getElementById("results");
const resultTitle = document.getElementById("resultTitle");
const resultCount = document.getElementById("resultCount");
document.getElementById("year").textContent = new Date().getFullYear();

const groups = window.LCD_GROUPS || [];

function normalize(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/[^A-Z0-9]/g, "");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
}

function parsePriceNumber(value) {
  const n = Number(String(value ?? "").replace(/[^0-9.,]/g, "").replace(/\.(?=\d{3}(?:\D|$))/g, "").replace(",", "."));
  if (!Number.isFinite(n)) return null;
  return n < 1000 ? n * 1000 : n;
}

function formatPrice(value) {
  const text = String(value || "").trim();
  if (!text) return "Harga belum tersedia";
  const nums = text.match(/\d+(?:[.,]\d+)?/g);
  if (!nums) return escapeHtml(text);
  const formatted = nums.map(n => {
    const rupiah = parsePriceNumber(n);
    if (rupiah === null) return n;
    return "Rp" + Math.round(rupiah).toLocaleString("id-ID");
  });
  return formatted.join(" – ");
}

function priceIncludedNote() {
  return '<div class="price-note">Sudah termasuk jasa pasang</div>';
}

function qualityParts(value) {
  const raw = String(value || "").trim();
  if (!raw) return ["Harga"];
  return raw.split(/\s*,\s*/).filter(Boolean);
}

function fillBrands() {
  const brands = [...new Set(groups.map(g => g.brand).filter(Boolean))].sort();
  brandFilter.innerHTML = `<option value="">Semua Merek</option>` +
    brands.map(b => `<option value="${escapeHtml(b)}">${escapeHtml(b)}</option>`).join("");
}


function openSettingsModal(title, text, bodyHtml = "") {
  const modal = document.getElementById("settingsModal");
  const titleEl = document.getElementById("settingsModalTitle");
  const textEl = document.getElementById("settingsModalText");
  const bodyEl = document.getElementById("settingsModalBody");
  if (!modal) return;
  titleEl.textContent = title;
  textEl.textContent = text;
  bodyEl.innerHTML = bodyHtml;
  modal.classList.remove("hidden");
  document.body.classList.add("modal-open");
}
function closeSettingsModal() {
  document.getElementById("settingsModal")?.classList.add("hidden");
  document.body.classList.remove("modal-open");
}

document.getElementById("closeSettingsModal")?.addEventListener("click", closeSettingsModal);
document.getElementById("settingsModal")?.addEventListener("click", (e) => {
  if (e.target.id === "settingsModal") closeSettingsModal();
});

const DATA_OVERRIDES_KEY = "yf_reponcil_data_overrides_v3";
const CUSTOM_DATA_KEY = "yf_reponcil_custom_data_v1";
function getCustomData() {
  try { return JSON.parse(localStorage.getItem(CUSTOM_DATA_KEY) || "{}"); } catch (_) { return {}; }
}
function saveCustomData(data) { localStorage.setItem(CUSTOM_DATA_KEY, JSON.stringify(data)); }
function loadDataOverrides() {
  try {
    const saved = JSON.parse(localStorage.getItem(DATA_OVERRIDES_KEY) || "{}");
    const batteries = window.BATTERY_DATA || [];
    const custom = getCustomData();
    (custom.lcd || []).forEach(item => { if (!groups.some(g => String(g.id) === String(item.id))) groups.push(item); });
    (custom.battery || []).forEach(item => { if (!batteries.some(g => String(g.id) === String(item.id))) batteries.push(item); });
    (saved.lcd || []).forEach(item => {
      const target = groups.find(g => String(g.id) === String(item.id));
      if (target) Object.assign(target, item);
    });
    (saved.battery || []).forEach(item => {
      const target = batteries.find(g => String(g.id) === String(item.id));
      if (target) Object.assign(target, item);
    });
  } catch (_) {}
}
function saveCustomItem(kind, item) {
  const custom = getCustomData();
  const key = kind === "lcd" ? "lcd" : "battery";
  custom[key] = Array.isArray(custom[key]) ? custom[key] : [];
  const i = custom[key].findIndex(x => String(x.id) === String(item.id));
  if (i >= 0) custom[key][i] = item; else custom[key].push(item);
  saveCustomData(custom);
}
function saveDataOverride(kind, item) {
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(DATA_OVERRIDES_KEY) || "{}"); } catch (_) {}
  const key = kind === "lcd" ? "lcd" : "battery";
  saved[key] = Array.isArray(saved[key]) ? saved[key] : [];
  const copy = {...item};
  const index = saved[key].findIndex(x => String(x.id) === String(copy.id));
  if (index >= 0) saved[key][index] = copy;
  else saved[key].push(copy);
  localStorage.setItem(DATA_OVERRIDES_KEY, JSON.stringify(saved));
}
function refreshCurrentDatabase(kind) {
  if (kind === "lcd") search();
  else document.getElementById("batterySearchInput")?.dispatchEvent(new Event("input"));
}

function settingsDatabaseChoice(action, title, text) {
  openSettingsModal(title, text, `<div class="settings-choice-grid">
    <button type="button" data-setting-action="${action}-lcd">LCD</button>
    <button type="button" data-setting-action="${action}-battery">Baterai</button>
  </div>`);
}

function openPriceEditor(kind) {
  const isLcd = kind === "lcd";
  const data = isLcd ? groups : (window.BATTERY_DATA || []);
  const label = isLcd ? "LCD" : "Baterai";
  const rows = data.map(item => {
    const models = (item.models || []).join(" / ");
    const code = isLcd ? (item.brand || "") : (item.code || "");
    return `<article class="settings-edit-row" data-edit-row data-search="${escapeHtml((models + " " + code).toLowerCase())}">
      <div class="settings-edit-main"><b>${escapeHtml(models || code || "Data #" + item.id)}</b><small>${escapeHtml(code)}</small></div>
      <label>Harga<input data-edit-price data-id="${item.id}" value="${escapeHtml(item.price || "")}" inputmode="decimal" placeholder="Contoh: 270-320"></label>
      <label>Kualitas<input data-edit-quality data-id="${item.id}" value="${escapeHtml(item.quality || "")}" placeholder="Contoh: STANDART, PREMIUM"></label>
      <button type="button" class="settings-save-row" data-save-price data-kind="${kind}" data-id="${item.id}">Simpan</button>
    </article>`;
  }).join("");
  openSettingsModal("Edit Harga " + label, "Ubah harga final yang sudah termasuk sparepart dan jasa pasang, serta kualitas. Tidak ada perhitungan jasa terpisah.", `<div class="settings-editor">
    <input id="settingsDataSearch" class="settings-search" placeholder="Cari tipe HP${isLcd ? " / merek" : " / kode baterai"}" autocomplete="off">
    <div id="settingsEditList" class="settings-edit-list">${rows || '<div class="settings-info">Belum ada data.</div>'}</div>
  </div>`);
  document.getElementById("settingsDataSearch")?.addEventListener("input", e => {
    const q = normalize(e.target.value);
    document.querySelectorAll("#settingsEditList [data-edit-row]").forEach(row => {
      row.classList.toggle("hidden", q && !normalize(row.dataset.search).includes(q));
    });
  });
}

function openTypeEditor(kind) {
  const isLcd = kind === "lcd";
  const data = isLcd ? groups : (window.BATTERY_DATA || []);
  const label = isLcd ? "LCD" : "Baterai";
  const rows = data.map(item => `<article class="settings-edit-row" data-edit-row data-search="${escapeHtml(((item.models || []).join(" ") + " " + (item.code || "") + " " + (item.brand || "")).toLowerCase())}">
    <div class="settings-edit-main"><b>${escapeHtml((item.models || []).join(" / ") || item.code || "Data #" + item.id)}</b><small>${escapeHtml(isLcd ? (item.brand || "LCD") : (item.code || "Baterai"))}</small></div>
    <label>Tipe HP<input data-edit-models data-id="${item.id}" value="${escapeHtml((item.models || []).join(", "))}" placeholder="Contoh: A12, A16"></label>
    ${isLcd ? `<label>Merek<input data-edit-brand data-id="${item.id}" value="${escapeHtml(item.brand || "")}"></label>` : ""}
    <button type="button" class="settings-save-row" data-save-type data-kind="${kind}" data-id="${item.id}">Simpan</button>
  </article>`).join("");
  openSettingsModal("Edit Tipe HP " + label, "Pisahkan beberapa tipe HP dengan koma. Tekan Simpan agar perubahan langsung masuk ke database di perangkat ini.", `<div class="settings-editor">
    <input id="settingsDataSearch" class="settings-search" placeholder="Cari tipe HP / merek / kode" autocomplete="off">
    <div id="settingsEditList" class="settings-edit-list">${rows || '<div class="settings-info">Belum ada data.</div>'}</div>
  </div>`);
  document.getElementById("settingsDataSearch")?.addEventListener("input", e => {
    const q = normalize(e.target.value);
    document.querySelectorAll("#settingsEditList [data-edit-row]").forEach(row => row.classList.toggle("hidden", q && !normalize(row.dataset.search).includes(q)));
  });
}

loadDataOverrides();

document.getElementById("editPriceBtn")?.addEventListener("click", () => settingsDatabaseChoice("price", "Edit Harga", "Pilih database yang ingin diedit."));
document.getElementById("editTypeBtn")?.addEventListener("click", () => settingsDatabaseChoice("type", "Edit Tipe HP", "Pilih database yang ingin diedit."));
document.getElementById("addDataBtn")?.addEventListener("click", () => openSettingsModal(
  "Tambahkan Data",
  "Tambahkan data baru. Harga yang diisi adalah harga final, sudah termasuk sparepart dan jasa pasang. Data tersimpan di perangkat ini.",
  `<form id="quickDataForm" class="settings-form">
    <input id="draftModel" placeholder="Tipe HP, contoh: A15" required>
    <input id="draftBrand" placeholder="Merek, contoh: Samsung">
    <input id="draftCode" placeholder="Kode sparepart (opsional)">
    <input id="draftPrice" placeholder="Harga final, contoh: 270-320" required inputmode="decimal">
    <input id="draftQuality" placeholder="Kualitas, contoh: STANDART, PREMIUM">
    <select id="draftType"><option value="LCD">LCD</option><option value="Baterai">Baterai</option></select>
    <button class="settings-save" type="submit">Simpan data</button>
  </form>`
));
document.getElementById("backupBtn")?.addEventListener("click", () => openSettingsModal(
  "Backup & Restore",
  "Backup mencakup perubahan harga/tipe dan draft data. File dapat dipulihkan di perangkat ini.",
  `<div class="settings-choice-grid">
    <button id="downloadBackup" type="button">Backup JSON</button>
    <label class="restore-file">Restore JSON<input id="restoreBackup" type="file" accept="application/json"></label>
  </div>`
));

document.addEventListener("submit", (e) => {
  if (e.target.id !== "quickDataForm") return;
  e.preventDefault();
  const model = document.getElementById("draftModel").value.trim();
  const brand = document.getElementById("draftBrand").value.trim();
  const code = document.getElementById("draftCode").value.trim();
  const price = document.getElementById("draftPrice").value.trim();
  const quality = document.getElementById("draftQuality").value.trim() || "STANDART";
  const type = document.getElementById("draftType").value;
  const id = `custom-${type.toLowerCase()}-${Date.now()}`;
  const item = type === "LCD"
    ? {id, brand: brand || "LAINNYA", models:[model], sparepart:"LCD", quality, price}
    : {id, code: code || "CUSTOM", models:[model], sparepart:"BATERAI", quality, price, brands: brand ? [brand.toUpperCase()] : []};
  saveCustomItem(type === "LCD" ? "lcd" : "battery", item);
  const data = type === "LCD" ? groups : (window.BATTERY_DATA || []);
  data.push(item);
  const drafts = JSON.parse(localStorage.getItem("yf_reponcil_drafts") || "[]");
  drafts.push({...item, type, createdAt: new Date().toISOString()});
  localStorage.setItem("yf_reponcil_drafts", JSON.stringify(drafts));
  fillBrands();
  openSettingsModal("Data tersimpan ✓", "Data baru sudah masuk ke database perangkat ini dan bisa langsung dicari.", `<div class="settings-info"><b>${escapeHtml(model)}</b><br>Harga final: ${formatPrice(price)}<br><small>Sudah termasuk sparepart dan jasa pasang.</small></div>`);
});

document.addEventListener("click", (e) => {
  const action = e.target.dataset.settingAction;
  if (action) {
    if (action === "price-lcd") return openPriceEditor("lcd");
    if (action === "price-battery") return openPriceEditor("battery");
    if (action === "type-lcd") return openTypeEditor("lcd");
    if (action === "type-battery") return openTypeEditor("battery");
  }
  const priceButton = e.target.closest("[data-save-price]");
  if (priceButton) {
    const kind = priceButton.dataset.kind;
    const id = priceButton.dataset.id;
    const data = kind === "lcd" ? groups : (window.BATTERY_DATA || []);
    const item = data.find(x => String(x.id) === String(id));
    if (!item) return;
    item.price = document.querySelector(`[data-edit-price][data-id="${id}"]`)?.value.trim() || "";
    item.quality = document.querySelector(`[data-edit-quality][data-id="${id}"]`)?.value.trim() || "";
    saveDataOverride(kind, item);
    if (String(id).startsWith("custom-")) saveCustomItem(kind, item);
    refreshCurrentDatabase(kind);
    priceButton.textContent = "Tersimpan ✓";
    setTimeout(() => priceButton.textContent = "Simpan", 1200);
    return;
  }
  const typeButton = e.target.closest("[data-save-type]");
  if (typeButton) {
    const kind = typeButton.dataset.kind;
    const id = typeButton.dataset.id;
    const data = kind === "lcd" ? groups : (window.BATTERY_DATA || []);
    const item = data.find(x => String(x.id) === String(id));
    if (!item) return;
    const raw = document.querySelector(`[data-edit-models][data-id="${id}"]`)?.value || "";
    item.models = raw.split(",").map(v => v.trim()).filter(Boolean);
    if (kind === "lcd") item.brand = document.querySelector(`[data-edit-brand][data-id="${id}"]`)?.value.trim() || item.brand;
    saveDataOverride(kind, item);
    if (String(id).startsWith("custom-")) saveCustomItem(kind, item);
    fillBrands();
    refreshCurrentDatabase(kind);
    typeButton.textContent = "Tersimpan ✓";
    setTimeout(() => typeButton.textContent = "Simpan", 1200);
    return;
  }
  if (e.target.id === "downloadBackup") {
    const backup = {version: 4, priceModel: "all_inclusive", note: "Semua harga sudah termasuk sparepart dan jasa pasang.", overrides: JSON.parse(localStorage.getItem(DATA_OVERRIDES_KEY) || "{}"), customData: getCustomData(), savedAt: new Date().toISOString()};
    const blob = new Blob([JSON.stringify(backup, null, 2)], {type:"application/json"});
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "yf-reponcil-backup.json"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 500);
  }
});

document.addEventListener("change", (e) => {
  if (e.target.id !== "restoreBackup") return;
  const file = e.target.files?.[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (data.priceModel && data.priceModel !== "all_inclusive") throw new Error("Model harga backup tidak didukung.");
      if (data.overrides) localStorage.setItem(DATA_OVERRIDES_KEY, JSON.stringify(data.overrides));
      if (data.customData) localStorage.setItem(CUSTOM_DATA_KEY, JSON.stringify(data.customData));
      window.location.reload();
    } catch { openSettingsModal("Restore gagal", "File backup tidak valid."); }
  };
  reader.readAsText(file);
});

function initialState() {
  resultTitle.textContent = "Cari tipe HP";
  resultCount.textContent = "";
  results.innerHTML = `
    <div class="empty-state">
      <div class="empty-icon">⌕</div>
      <h3>Belum ada pencarian</h3>
      <p>Ketik tipe HP di atas untuk melihat harga LCD dan kompatibilitasnya.</p>
    </div>`;
}

function render(groupsFound, query, brand) {
  if (!query && !brand) {
    initialState();
    return;
  }

  resultTitle.textContent = query ? query.toUpperCase() : brand;
  resultCount.textContent = `${groupsFound.length} grup ditemukan`;

  if (!groupsFound.length) {
    results.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">⌕</div>
        <h3>Data belum ditemukan</h3>
        <p>Coba tipe HP lain atau pilih merek yang sesuai.</p>
      </div>`;
    return;
  }

  results.innerHTML = groupsFound.map((g, index) => {
    const qualities = qualityParts(g.quality);
    const prices = String(g.price || "").split(/\s*-\s*/).filter(Boolean);
    const priceCards = qualities.map((q, i) => {
      const p = prices[i] ?? (prices.length === 1 ? prices[0] : "");
      return `<div class="price">
        <div class="quality">${escapeHtml(q)}</div>
        <div class="amount">${formatPrice(p)}</div>
        ${priceIncludedNote()}
      </div>`;
    }).join("");

    const matchedModel = query
      ? g.models.find(m => normalize(m).includes(normalize(query))) || query
      : g.models[0] || "LCD";

    return `<article class="card" style="animation-delay:${index * 45}ms">
      <div class="card-top">
        <div>
          <div class="brand-label">${escapeHtml(g.brand)}</div>
          <h3>${escapeHtml(matchedModel)}</h3>
          <div class="sub">${escapeHtml(g.sparepart)} · Grup kompatibilitas #${String(g.id).padStart(3, "0")}</div>
        </div>
        <span class="badge">LCD</span>
      </div>
      <div class="compat">
        <div class="compat-label">Kompatibel dengan</div>
        <div class="tags">${g.models.map(m => `<span class="tag">${escapeHtml(m)}</span>`).join("")}</div>
      </div>
      <div class="price-row">${priceCards}</div>
    </article>`;
  }).join("");
}

function search() {
  const query = String(input.value || "").trim();
  const brand = String(brandFilter.value || "").trim();
  clearBtn.classList.toggle("show", !!query);
  const q = normalize(query);

  if (!q && !brand) {
    initialState();
    return;
  }

  const found = groups.filter(g => {
    const brandMatch = !brand || normalize(g.brand) === normalize(brand);
    const modelMatch = !q || g.models.some(model => normalize(model).includes(q));
    return brandMatch && modelMatch;
  });
  render(found, query, brand);
}

input.addEventListener("input", search);
brandFilter.addEventListener("change", search);
clearBtn.addEventListener("click", () => {
  input.value = "";
  search();
  input.focus();
});

fillBrands();
initialState();


/* Pencarian harga baterai. Data disinkronkan langsung dari HargaBaterai.xlsx. */
(() => {
  const input = document.getElementById("batterySearchInput");
  if (!input) return;
  const clearBtn = document.getElementById("batteryClearBtn");
  const brandFilter = document.getElementById("batteryBrandFilter");
  const results = document.getElementById("batteryResults");
  const resultTitle = document.getElementById("batteryResultTitle");
  const resultCount = document.getElementById("batteryResultCount");
  document.querySelectorAll(".current-year").forEach(el => el.textContent = new Date().getFullYear());
  const batteries = window.BATTERY_DATA || [];
  const norm = value => String(value ?? "").toUpperCase().replace(/\s+/g, "").replace(/[^A-Z0-9]/g, "");
  const esc = value => String(value ?? "").replace(/[&<>\"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const qualities = value => String(value || "").split(/\s*,\s*/).filter(Boolean);
  const formatBatteryPrice = value => {
    const text = String(value ?? "").trim();
    if (!text) return "Harga belum tersedia";
    const nums = text.match(/\d+(?:[.,]\d+)?/g);
    if (!nums) return esc(text);
    return nums.map(n => {
      const number = Number(n.replace(",", "."));
      if (!Number.isFinite(number)) return esc(n);
      return "Rp" + Math.round(number * 1000).toLocaleString("id-ID");
    }).join(" – ");
  };
  const brands = [...new Set(batteries.flatMap(item => item.brands || []))].sort();
  brandFilter.innerHTML = '<option value="">Semua Merek</option>' + brands.map(b => `<option value="${esc(b)}">${esc(b)}</option>`).join("");
  function searchBatteries() {
    const query = input.value.trim();
    const brand = brandFilter.value;
    clearBtn.classList.toggle("show", !!query);
    const q = norm(query);
    resultTitle.textContent = query ? query.toUpperCase() : (brand || "Pilih tipe HP");
    if (!q && !brand) {
      resultCount.textContent = "";
      results.innerHTML = `<div class="empty-state"><div class="empty-icon">⌕</div><h3>Mulai dengan mencari baterai</h3><p>Ketik tipe HP atau kode baterai untuk melihat hasil.</p></div>`;
      return;
    }
    const found = batteries.filter(item => (!brand || (item.brands || []).some(b => norm(b) === norm(brand))) && (!q || [item.code, item.sparepart, item.quality, ...(item.models || [])].some(value => norm(value).includes(q))));
    resultCount.textContent = `${found.length} data ditemukan`;
    if (!found.length) {
      results.innerHTML = `<div class="empty-state"><div class="empty-icon">⌕</div><h3>Data baterai belum ditemukan</h3><p>Periksa kata kunci atau kode baterai pada dataset sumber.</p></div>`;
      return;
    }
    results.innerHTML = found.map(item => {
      const qs = qualities(item.quality);
      const prices = String(item.price ?? "").trim() ? String(item.price).trim().split(/\s*-\s*/).filter(Boolean) : [];
      const cards = qs.length ? qs.map((q, i) => {
        const price = prices[i] ?? (prices.length === 1 ? prices[0] : "");
        return `<div class="price"><div class="quality">${esc(q)}</div><div class="amount">${formatBatteryPrice(price)}</div>${priceIncludedNote()}</div>`;
      }).join("") : `<div class="price"><div class="quality">Kualitas belum diisi</div><div class="amount">${formatBatteryPrice(item.price)}</div>${priceIncludedNote()}</div>`;
      const modelTitle = (item.models || []).join(" / ") || item.code || "Baterai";
      return `<article class="card"><div class="card-top"><div><span class="brand-label">${esc((item.brands || []).join(" · ") || "Baterai")}</span><h3>${esc(modelTitle)}</h3><div class="sub">Kode baterai: ${esc(item.code || "Belum diisi")}</div></div><span class="badge">Baterai</span></div><div class="compat"><div class="compat-label">Tipe HP kompatibel</div><div class="tags">${(item.models || []).map(model => `<span class="tag">${esc(model)}</span>`).join("") || '<span class="tag">Belum diisi</span>'}</div></div><div class="price-row">${cards}</div></article>`;
    }).join("");
  }
  input.addEventListener("input", searchBatteries);
  brandFilter.addEventListener("change", searchBatteries);
  clearBtn.addEventListener("click", () => { input.value = ""; searchBatteries(); input.focus(); });
  searchBatteries();
})();
