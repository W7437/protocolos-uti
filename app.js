const STORAGE_KEY = "protocolosUTI_v1";

const defaultProtocols = [
  {
    id: crypto.randomUUID(),
    title: "Modelo de protocolo",
    category: "Geral",
    tags: ["exemplo", "editar"],
    summary: "Este cartão é apenas um exemplo. Edite-o ou exclua-o e comece sua biblioteca.",
    indications: "Descreva de forma objetiva quando o protocolo deve ser aplicado.",
    steps: "Confirmar indicação\nChecar contraindicações\nExecutar a conduta\nReavaliar resposta",
    doses: "Registre aqui doses, diluições, ajustes renal/hepático e apresentações locais.",
    warnings: "Inclua alertas de segurança, contraindicações e situações em que o protocolo não se aplica.",
    monitoring: "Defina parâmetros de monitorização, metas e momento de nova avaliação.",
    references: "Registre a diretriz, protocolo institucional ou fonte utilizada e a data de revisão.",
    favorite: false,
    updatedAt: new Date().toISOString()
  }
];

let protocols = loadProtocols();
let currentFilter = "all";
let activeViewId = null;

const $ = (id) => document.getElementById(id);
const protocolGrid = $("protocolGrid");
const dialog = $("protocolDialog");
const viewDialog = $("viewDialog");

function loadProtocols() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : defaultProtocols;
  } catch {
    return defaultProtocols;
  }
}
function saveProtocols() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(protocols));
}
function escapeHTML(str="") {
  return str.replace(/[&<>"']/g, s => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[s]));
}
function parseTags(text="") {
  return text.split(",").map(s => s.trim()).filter(Boolean);
}
function formatDate(iso) {
  try { return new Intl.DateTimeFormat("pt-BR", {dateStyle:"short", timeStyle:"short"}).format(new Date(iso)); }
  catch { return ""; }
}
function categoryCounts() {
  const map = {};
  protocols.forEach(p => map[p.category] = (map[p.category] || 0) + 1);
  return map;
}
function renderCategories() {
  const counts = categoryCounts();
  const categories = Object.keys(counts).sort((a,b)=>a.localeCompare(b,"pt-BR"));
  $("categoryList").innerHTML = categories.map(cat => `
    <button class="nav-item ${currentFilter === "cat:"+cat ? "active":""}" data-filter="cat:${escapeHTML(cat)}">
      ${escapeHTML(cat)} <span>${counts[cat]}</span>
    </button>`).join("");
  $("categoryOptions").innerHTML = categories.map(c => `<option value="${escapeHTML(c)}"></option>`).join("");
}
function filteredProtocols() {
  const q = $("searchInput").value.trim().toLocaleLowerCase("pt-BR");
  let arr = protocols.filter(p => {
    if (currentFilter === "favorites" && !p.favorite) return false;
    if (currentFilter.startsWith("cat:") && p.category !== currentFilter.slice(4)) return false;
    if (!q) return true;
    const hay = [p.title,p.category,p.summary,p.indications,p.steps,p.doses,p.warnings,p.monitoring,p.references,(p.tags||[]).join(" ")]
      .join(" ").toLocaleLowerCase("pt-BR");
    return hay.includes(q);
  });
  const sort = $("sortSelect").value;
  if (sort === "title") arr.sort((a,b)=>a.title.localeCompare(b.title,"pt-BR"));
  else if (sort === "category") arr.sort((a,b)=>a.category.localeCompare(b.category,"pt-BR") || a.title.localeCompare(b.title,"pt-BR"));
  else arr.sort((a,b)=>new Date(b.updatedAt)-new Date(a.updatedAt));
  return arr;
}
function render() {
  renderCategories();
  document.querySelectorAll(".nav-item[data-filter]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.filter === currentFilter);
  });

  const favs = protocols.filter(p => p.favorite).length;
  const cats = Object.keys(categoryCounts()).length;
  $("countAll").textContent = protocols.length;
  $("countFav").textContent = favs;
  $("protocolCount").textContent = protocols.length;
  $("favoriteCount").textContent = favs;
  $("categoryCount").textContent = cats;

  const arr = filteredProtocols();
  $("emptyState").classList.toggle("hidden", arr.length > 0);
  protocolGrid.innerHTML = arr.map(p => `
    <article class="card" data-id="${p.id}">
      <div class="card-top">
        <span class="category-pill">${escapeHTML(p.category)}</span>
        <button class="star ${p.favorite ? "on":""}" data-action="favorite" title="Favoritar">${p.favorite ? "★":"☆"}</button>
      </div>
      <h3>${escapeHTML(p.title)}</h3>
      <p>${escapeHTML(p.summary || "Sem resumo rápido.")}</p>
      <div class="tag-row">${(p.tags||[]).slice(0,5).map(t=>`<span class="tag">${escapeHTML(t)}</span>`).join("")}</div>
      <div class="card-footer">
        <span>Rev. ${formatDate(p.updatedAt)}</span>
        <button class="open-card" data-action="open">Abrir →</button>
      </div>
    </article>
  `).join("");
}
function openEditor(p=null) {
  $("dialogTitle").textContent = p ? "Editar protocolo" : "Novo protocolo";
  $("protocolId").value = p?.id || "";
  $("titleInput").value = p?.title || "";
  $("categoryInput").value = p?.category || "";
  $("tagsInput").value = (p?.tags || []).join(", ");
  $("summaryInput").value = p?.summary || "";
  $("indicationsInput").value = p?.indications || "";
  $("stepsInput").value = p?.steps || "";
  $("dosesInput").value = p?.doses || "";
  $("warningsInput").value = p?.warnings || "";
  $("monitoringInput").value = p?.monitoring || "";
  $("referencesInput").value = p?.references || "";
  $("deleteBtn").classList.toggle("hidden", !p);
  dialog.showModal();
}
function section(title, body, kind="text") {
  if (!body?.trim()) return "";
  if (kind === "steps") {
    const items = body.split("\n").map(s=>s.trim()).filter(Boolean);
    return `<section class="view-section"><h3>${title}</h3><ol>${items.map(i=>`<li>${escapeHTML(i)}</li>`).join("")}</ol></section>`;
  }
  return `<section class="view-section"><h3>${title}</h3><p>${escapeHTML(body).replace(/\n/g,"<br>")}</p></section>`;
}
function openView(id) {
  const p = protocols.find(x=>x.id===id);
  if (!p) return;
  activeViewId = id;
  $("viewCategory").textContent = p.category;
  $("viewTitle").textContent = p.title;
  $("viewTags").innerHTML = (p.tags||[]).map(t=>`<span class="tag">${escapeHTML(t)}</span>`).join("");
  $("viewFavoriteBtn").textContent = p.favorite ? "★ Favorito" : "☆ Favoritar";
  $("viewContent").innerHTML =
    (p.summary?.trim() ? `<div class="view-summary">${escapeHTML(p.summary).replace(/\n/g,"<br>")}</div>` : "") +
    section("Indicações / quando usar",p.indications) +
    section("Conduta / passo a passo",p.steps,"steps") +
    section("Doses / diluições / ajustes",p.doses) +
    section("Alertas e contraindicações",p.warnings) +
    section("Monitorização / metas",p.monitoring) +
    section("Referências / fonte institucional",p.references);
  viewDialog.showModal();
}
function closeEditor(){ dialog.close(); }
function closeView(){ viewDialog.close(); }

$("newProtocolBtn").addEventListener("click", ()=>openEditor());
$("closeDialogBtn").addEventListener("click", closeEditor);
$("cancelBtn").addEventListener("click", closeEditor);
$("closeViewBtn").addEventListener("click", closeView);
$("searchInput").addEventListener("input", render);
$("sortSelect").addEventListener("change", render);

document.addEventListener("click", e => {
  const nav = e.target.closest(".nav-item[data-filter]");
  if (nav) {
    currentFilter = nav.dataset.filter;
    render();
    return;
  }
  const card = e.target.closest(".card");
  if (!card) return;
  const action = e.target.closest("[data-action]")?.dataset.action;
  if (action === "favorite") {
    const p = protocols.find(x=>x.id===card.dataset.id);
    p.favorite = !p.favorite;
    p.updatedAt = new Date().toISOString();
    saveProtocols(); render();
  } else if (action === "open") {
    openView(card.dataset.id);
  }
});

$("protocolForm").addEventListener("submit", e => {
  e.preventDefault();
  const id = $("protocolId").value;
  const existing = protocols.find(p=>p.id===id);
  const item = {
    id: id || crypto.randomUUID(),
    title: $("titleInput").value.trim(),
    category: $("categoryInput").value.trim(),
    tags: parseTags($("tagsInput").value),
    summary: $("summaryInput").value.trim(),
    indications: $("indicationsInput").value.trim(),
    steps: $("stepsInput").value.trim(),
    doses: $("dosesInput").value.trim(),
    warnings: $("warningsInput").value.trim(),
    monitoring: $("monitoringInput").value.trim(),
    references: $("referencesInput").value.trim(),
    favorite: existing?.favorite || false,
    updatedAt: new Date().toISOString()
  };
  if (!item.title || !item.category) return;
  if (existing) Object.assign(existing,item); else protocols.push(item);
  saveProtocols(); closeEditor(); render();
});

$("deleteBtn").addEventListener("click", () => {
  const id = $("protocolId").value;
  if (!id) return;
  if (confirm("Excluir este protocolo? Esta ação não poderá ser desfeita, exceto por um backup.")) {
    protocols = protocols.filter(p=>p.id!==id);
    saveProtocols(); closeEditor(); render();
  }
});
$("editFromViewBtn").addEventListener("click", () => {
  const p = protocols.find(x=>x.id===activeViewId);
  closeView();
  if (p) openEditor(p);
});
$("viewFavoriteBtn").addEventListener("click", () => {
  const p = protocols.find(x=>x.id===activeViewId);
  if (!p) return;
  p.favorite = !p.favorite;
  p.updatedAt = new Date().toISOString();
  saveProtocols();
  $("viewFavoriteBtn").textContent = p.favorite ? "★ Favorito" : "☆ Favoritar";
  render();
});

$("exportBtn").addEventListener("click", () => {
  const payload = {
    app: "Protocolos UTI",
    version: 1,
    exportedAt: new Date().toISOString(),
    protocols
  };
  const blob = new Blob([JSON.stringify(payload,null,2)], {type:"application/json"});
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `protocolos-uti-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

$("importInput").addEventListener("change", async e => {
  const file = e.target.files?.[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const incoming = Array.isArray(data) ? data : data.protocols;
    if (!Array.isArray(incoming)) throw new Error("Formato inválido");
    if (confirm(`Importar ${incoming.length} protocolo(s)? Isso substituirá a biblioteca atual.`)) {
      protocols = incoming;
      saveProtocols();
      currentFilter = "all";
      render();
    }
  } catch {
    alert("Não foi possível importar o arquivo. Verifique se ele é um backup JSON válido.");
  } finally {
    e.target.value = "";
  }
});

render();
