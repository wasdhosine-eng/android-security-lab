/* منطق المختبر — يعمل بالكامل داخل المتصفح دون خادم أو تسجيل حساب */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/* ---------- الحالة والتقدم المحفوظ محلياً ---------- */
const state = { key: "notes", cur: null, orig: null, done: false, file: null, openPath: null };
const PROG_KEY = "asl_progress";
let prog = { read: {}, ans: {}, ok: {} };
try { prog = JSON.parse(localStorage.getItem(PROG_KEY)) || prog; } catch (e) { /* تجاهل */ }
const saveProg = () => { try { localStorage.setItem(PROG_KEY, JSON.stringify(prog)); } catch (e) {} renderXP(); };
const points = () => Object.keys(prog.ok).length * 10 + Object.keys(prog.read).length * 5;
const levelName = () => LEVELS[Math.min(LEVELS.length - 1, Math.floor(points() / 30))];
function renderXP() { $("#xp").textContent = `${points()} نقطة · ${levelName()}`; }

function loadApp(key) {
  state.key = key;
  const files = DEMO_APPS[key].files;
  state.orig = {}; state.cur = {};
  for (const p in files) { state.orig[p] = files[p].text; state.cur[p] = files[p].text; }
  state.file = Object.keys(files)[0];
  state.done = false;
}
const meta = p => DEMO_APPS[state.key].files[p];
const chips = arr => arr.length
  ? `<div class="chips">${arr.map(x => `<span class="chip">${esc(x)}</span>`).join("")}</div>`
  : '<span class="mono">لا يوجد</span>';

/* ---------- التحليل: كل تلوين مبني على أسطر حقيقية داخل الملف ---------- */
function analyze(text) {
  const findings = [];
  const cats = new Set();
  text.split("\n").forEach((ln, i) => {
    for (const r of RULES) {
      if (r.re.test(ln)) {
        findings.push({ no: i + 1, ln, sev: r.sev, cat: r.cat, ar: r.ar });
        cats.add(r.cat);
      }
    }
  });
  let sev = Math.max(0, ...findings.map(f => f.sev));
  const reasons = [];
  const sensitive = cats.has("mic") || cats.has("data");
  const net = cats.has("net");
  const bg = cats.has("bg") || cats.has("boot");
  if (sensitive && net && bg) {
    sev = 3;
    reasons.push("يجمع الملف بين وصول لبيانات حساسة واتصال شبكي وتشغيل خلفي، وهذا النمط يستوجب التحقيق.");
  } else if (sensitive && net) {
    sev = Math.max(sev, 2);
    reasons.push("يجمع الملف بين وصول لبيانات حساسة واتصال شبكي، فراجع الوجهة والبيانات المرسلة.");
  }
  return { sev, findings, cats: [...cats], reasons };
}

const SEV_COLORS = ["var(--ok)", "var(--warn)", "var(--net)", "var(--bad)"];
const sevBadge = s => `<span class="tag" style="color:${SEV_COLORS[s]};border-color:${SEV_COLORS[s]}">${SEV_LABELS[s]}</span>`;

/* ---------- شرح الأسطر بالعربية ---------- */
const OPS = {
  "invoke-virtual": "استدعاء دالة على كائن موجود (instance method).",
  "invoke-static": "استدعاء دالة static لا تحتاج كائناً.",
  "invoke-direct": "استدعاء constructor أو دالة خاصة.",
  "invoke-super": "استدعاء دالة من الصنف الأب.",
  "const-string": "تحميل نص ثابت داخل سجل.",
  "const-class": "تحميل مرجع صنف داخل سجل.",
  "new-instance": "إنشاء كائن جديد من الصنف المذكور.",
  "return-void": "إنهاء الدالة دون إرجاع قيمة.",
  "return": "إنهاء الدالة وإرجاع قيمة.",
  "move-result": "نقل نتيجة آخر استدعاء إلى سجل.",
  "iget": "قراءة حقل من كائن.",
  "iput": "كتابة قيمة في حقل كائن.",
  "sget": "قراءة حقل static.",
  "sput": "كتابة قيمة في حقل static.",
  "if-": "شرط: القفز إلى سطر آخر إذا تحقق الشرط.",
  "goto": "قفز غير شرطي إلى سطر آخر.",
  ".end method": "نهاية تعريف الدالة.",
  ".method": "بداية تعريف دالة.",
  ".class": "تعريف الصنف (Class) الحالي.",
  ".super": "الصنف الأب الذي يرث منه هذا الصنف.",
  ".field": "تعريف متغير (حقل) داخل الصنف.",
  ".registers": "عدد السجلات التي تستخدمها الدالة.",
  ".locals": "عدد السجلات المحلية في الدالة."
};
function explainOp(t) {
  for (const k of Object.keys(OPS)) if (t.startsWith(k)) return OPS[k];
  if (/^\.[\w-]+/.test(t)) return "توجيه للمترجم يصف الصنف أو الحقل أو المورد.";
  if (/^[<{"]/.test(t)) return "جزء من ملف XML أو JSON يصف الإعدادات أو المكونات.";
  return "تعليمة داخل جسم الدالة تنفّذ عملية أو تخزن قيمة.";
}
function explainLine(ln) {
  const t = ln.trim();
  if (!t) return "سطر فارغ يفصل بين الأقسام.";
  if (t.startsWith("#")) return "تعليق للقراءة فقط ولا يُنفَّذ.";
  const m = t.match(/->([\w<>]+)\(/);
  return m ? `يستدعي الدالة ${m[1]} من الصنف المذكور. ${explainOp(t)}` : explainOp(t);
}

/* ---------- عرض الكود مع تلوين الصياغة وأرقام الأسطر ---------- */
function hl(line) {
  if (/^\s*#/.test(line)) return `<span class="c">${esc(line)}</span>`;
  let s = esc(line);
  s = s.replace(/("[^"]*")/g, '<span class="str">$1</span>');
  s = s.replace(/^(\s*)(\.[\w-]+)/, '$1<span class="k">$2</span>');
  s = s.replace(/\b(invoke-[\w\/]+|const-string|const-class|new-instance|return-void|return|move-result[\w-]*|[is](?:get|put)[\w-]*|if-\w+|goto)\b/g,
    '<span class="op">$1</span>');
  return s;
}
function renderCodeInto(box, text, type, explainEl, hitTerm = "") {
  const lines = text.split("\n");
  box.innerHTML = `<div class="code">${lines.map((ln, i) => {
    const body = type === "smali" ? hl(ln) : esc(ln).replace(/("[^"]*")/g, '<span class="str">$1</span>');
    const hit = hitTerm && ln.toLowerCase().includes(hitTerm.toLowerCase());
    return `<div class="ln${hit ? " hit" : ""}" data-i="${i}"><span class="no">${i + 1}</span><span class="tx">${body || " "}</span></div>`;
  }).join("")}</div>`;
  box.querySelectorAll(".ln").forEach(el => el.onclick = () => {
    box.querySelectorAll(".ln.sel").forEach(x => x.classList.remove("sel"));
    el.classList.add("sel");
    const i = +el.dataset.i, ln = lines[i];
    if (explainEl) explainEl.innerHTML = `<b>السطر ${i + 1}:</b> <span class="mono">${esc(ln.trim() || "(فارغ)")}</span><br>${explainLine(ln)}`;
  });
}
function filterCode(box, q) {
  q = q.trim().toLowerCase();
  box.querySelectorAll(".ln").forEach(el => {
    el.style.display = !q || el.textContent.toLowerCase().includes(q) ? "" : "none";
  });
}

/* ---------- بوابة: الأقسام التي تحتاج تفكيكاً أولاً ---------- */
function gate(el) {
  if (state.done) return true;
  el.innerHTML = `<h2>لا توجد ملفات بعد</h2>
    <p class="hint">ابدأ بتفكيك التطبيق التجريبي من تبويب APKTool، ثم عد هنا لتحليل ملفاته.</p>
    <button class="primary" onclick="go('apk')">الذهاب إلى APKTool</button>`;
  return false;
}

/* ---------- شجرة الملفات ---------- */
function fileRow(p, a) {
  return `<button class="file" data-p="${esc(p)}"><i class="dot sev-${a.sev}"></i><span class="name">${esc(p.split("/").pop())}</span><span class="d">${esc(meta(p).desc)}</span></button>`;
}
function buildTree(paths) {
  const root = {};
  for (const p of paths) {
    const parts = p.split("/");
    let n = root;
    parts.forEach((s, i) => {
      if (i === parts.length - 1) n[s] = { __p: p };
      else { n[s] = n[s] && !n[s].__p ? n[s] : {}; n = n[s]; }
    });
  }
  return root;
}
function treeHTML(node) {
  return Object.keys(node)
    .sort((a, b) => (node[a].__p ? 1 : 0) - (node[b].__p ? 1 : 0) || a.localeCompare(b))
    .map(k => {
      const v = node[k];
      if (v.__p) return fileRow(v.__p, analyze(state.cur[v.__p]));
      return `<details open><summary>▸ ${esc(k)}/</summary>${treeHTML(v)}</details>`;
    }).join("");
}
function bindFileButtons(root) {
  root.querySelectorAll("[data-p]").forEach(b => b.onclick = () => openFile(b.dataset.p));
}

/* ---------- تبويب APKTool ---------- */
let decTimer = null;
function renderAPK() {
  const el = $("#v-apk");
  el.innerHTML = `<h2>APKTool — تفكيك التطبيق</h2>
    <p class="hint">هذه محاكاة تعليمية: لا يُفكَّك أي ملف حقيقي، والملفات المعروضة نماذج مكتوبة لأغراض الشرح.</p>
    <div class="row"><label for="apkSel">اختر ملف APK التجريبي</label>
      <select id="apkSel">${Object.entries(DEMO_APPS).map(([k, a]) =>
        `<option value="${k}" ${k === state.key ? "selected" : ""}>${esc(a.name)}</option>`).join("")}</select></div>
    <div class="row btns">
      <button class="primary" id="btnDec">بدء التفكيك</button>
      <button id="btnRe">إعادة التفكيك</button>
      <button id="btnReset">إعادة ضبط المختبر</button>
    </div>
    <div class="progress"><div id="bar" style="width:${state.done ? 100 : 0}%"></div></div>
    <p id="stat" class="mono">${state.done ? "اكتمل التفكيك ✓" : "بانتظار البدء"}</p>
    <div id="apkResult"></div>`;
  $("#apkSel").onchange = e => {
    clearInterval(decTimer); loadApp(e.target.value);
    $("#bar").style.width = "0%";
    $("#stat").textContent = "تم اختيار تطبيق جديد، ابدأ التفكيك";
    $("#apkResult").innerHTML = "";
  };
  $("#btnDec").onclick = decompile;
  $("#btnRe").onclick = decompile;
  $("#btnReset").onclick = () => {
    clearInterval(decTimer); loadApp(state.key);
    renderAPK();
  };
  if (state.done) drawTree();
}
function decompile() {
  clearInterval(decTimer);
  loadApp($("#apkSel").value);
  const steps = ["قراءة AndroidManifest.xml …", "فك ترميز resources.arsc …", "استخراج ملفات smali …", "نسخ assets وres …", "بناء شجرة الملفات …", "اكتمل التفكيك ✓"];
  let i = 0;
  $("#bar").style.width = "0%";
  $("#apkResult").innerHTML = "";
  decTimer = setInterval(() => {
    $("#stat").textContent = steps[i];
    i++;
    $("#bar").style.width = (i / steps.length * 100) + "%";
    if (i >= steps.length) { clearInterval(decTimer); state.done = true; drawTree(); }
  }, 500);
}
function drawTree() {
  const box = $("#apkResult");
  if (!box) return;
  const tree = buildTree(Object.keys(state.cur));
  box.innerHTML = `<div class="legend">${SEV_LABELS.map((l, i) =>
      `<span><i class="dot sev-${i}"></i>${l.split(" — ")[0]}</span>`).join("")}</div>
    <div class="tree">${treeHTML(tree)}</div>
    <h3 style="margin-top:18px">بحث في كل الملفات</h3>
    <input id="gq" type="text" placeholder="اسم ملف أو كلمة داخل الأكواد…">
    <div id="gres" style="margin-top:8px"></div>`;
  bindFileButtons(box);
  $("#gq").oninput = e => globalSearch(e.target.value);
}
function globalSearch(q) {
  const box = $("#gres");
  q = q.trim().toLowerCase();
  if (!q) { box.innerHTML = ""; return; }
  const hits = [];
  for (const p of Object.keys(state.cur)) {
    if (p.toLowerCase().includes(q)) hits.push({ p, no: "—", t: "اسم الملف" });
    state.cur[p].split("\n").forEach((ln, i) => {
      if (ln.toLowerCase().includes(q)) hits.push({ p, no: i + 1, t: ln.trim() });
    });
  }
  box.innerHTML = hits.length
    ? hits.slice(0, 80).map(h => `<button class="file" data-p="${esc(h.p)}"><span class="name">${esc(h.p.split("/").pop())}</span><span class="d">سطر ${h.no}: ${esc(h.t)}</span></button>`).join("")
    : `<p class="hint">لا توجد نتائج لـ "${esc(q)}".</p>`;
  bindFileButtons(box);
}

/* ---------- نافذة الملف ---------- */
function openFile(p) {
  state.openPath = p;
  const m = meta(p), txt = state.cur[p], a = analyze(txt);
  const clsFull = (txt.match(/^\.class .*?(L[\w\/$]+;)/m) || [])[1];
  const simple = clsFull ? clsFull.split("/").pop().replace(/;$/, "") : null;
  const related = simple ? Object.keys(state.cur).filter(q => q !== p && state.cur[q].includes(simple)) : [];
  const spyVerdict = a.sev >= 3
    ? "نعم، توجد أنماط تستوجب التحقيق."
    : "لا توجد مؤشرات مؤكدة في هذا الملف وحده، والسياق من الملفات الأخرى مهم.";
  $("#m-title").textContent = p.split("/").pop();
  $("#m-body").innerHTML = `
    <div class="meta">المسار: <code>${esc(p)}</code></div>
    <div class="severity-bar">${sevBadge(a.sev)}</div>
    <div class="card"><h3>وظيفة الملف</h3><p>${esc(m.desc)}</p></div>
    <div class="card"><h3>لماذا هذا اللون؟</h3>
      ${a.findings.length
        ? `<ul>${a.findings.slice(0, 8).map(f => `<li>سطر ${f.no}: ${f.ar}</li>`).join("")}</ul>`
        : "<p>لم تُرصد أي مؤشرات خاصة، لذلك يبقى الملف أخضر.</p>"}
      ${a.reasons.map(r => `<p><b>السياق:</b> ${r}</p>`).join("")}</div>
    <div class="card"><h3>مؤشرات التجسس</h3><p>${spyVerdict}</p></div>
    <div class="card"><h3>مستوى الخطورة والمعالجة</h3><p>${[
      "لا توجد مؤشرات تستدعي القلق.",
      "صلاحية حساسة: تأكد من أنها ضرورية لوظيفة التطبيق، وامنحها عند الحاجة فقط.",
      "مراجعة: الشبكة أو الخدمة الخلفية قد تكونان طبيعيتين، تحقق من الوجهة والتوقيت.",
      "مستوى تحقيق: راجع كل سطر مُلوَّن واسأل هل تحتاج الوظيفة هذا السلوك، وهل يعلم المستخدم به؟"
    ][a.sev]}</p></div>
    <div class="card"><h3>الارتباط ببقية الملفات</h3>
      ${related.length ? chips(related.map(q => q.split("/").pop())) : '<p class="mono">لا توجد إشارات واضحة إلى ملفات أخرى.</p>'}</div>
    <div id="fcode"></div>
    <div class="explain" id="fex">اضغط على أي سطر لشرحه بالعربية.</div>`;
  renderCodeInto($("#fcode"), txt, m.type === "smali" ? "smali" : "plain", $("#fex"));
  $("#modal").classList.remove("hidden");
}

/* ---------- تبويب Smali ---------- */
function renderSmali() {
  const el = $("#v-smali");
  if (!gate(el)) return;
  const files = Object.keys(state.cur).filter(p => p.endsWith(".smali"));
  el.innerHTML = `<h2>مفكك Smali</h2>
    <p class="hint">اختر ملف Smali لعرض صنفه ودواله وحقوله وعلاقاته ومحتواه.</p>
    <div class="smali-layout">
      <div class="list">${files.map(p => `<button class="item" data-p="${esc(p)}">${esc(p.replace(/^smali\//, ""))}</button>`).join("")}</div>
      <div id="sm-detail" class="detail"><p class="hint">لم تختر ملفاً بعد.</p></div>
    </div>`;
  el.querySelectorAll(".item").forEach(b => b.onclick = () => {
    el.querySelectorAll(".item").forEach(x => x.classList.remove("on"));
    b.classList.add("on");
    showSmali(b.dataset.p);
  });
}
function showSmali(p) {
  const txt = state.cur[p];
  const cls = (txt.match(/^\.class .*?(L[\w\/$]+;)/m) || [])[1] || "—";
  const sup = (txt.match(/^\.super (L[\w\/$]+;)/m) || [])[1] || "—";
  const methods = [...new Set([...txt.matchAll(/^\.method .*? (\w+)\(/gm)].map(m => m[1]))];
  const fields = [...new Set([...txt.matchAll(/^\.field .*? (\w+):/gm)].map(m => m[1]))];
  const calls = [...new Set([...txt.matchAll(/->([\w<>]+)\(/g)].map(m => m[1]))];
  const rels = [...new Set([...txt.matchAll(/(L[\w\/$]+;)->/g)].map(m => m[1]))];
  $("#sm-detail").innerHTML = `
    <div class="card">
      <h3>الصنف (Class)</h3>
      <div class="mono">${esc(cls)}</div>
      <p class="meta">يرث من: <code>${esc(sup)}</code></p>
      <p>${esc(meta(p).desc)}</p>
      ${sevBadge(analyze(txt).sev)}
    </div>
    <div class="card"><h3>الدوال (Methods)</h3>${chips(methods)}<h3>الحقول (Fields)</h3>${chips(fields)}</div>
    <div class="card"><h3>العلاقات واستدعاء الدوال</h3>
      <p>صنوف أخرى يتصل بها هذا الملف:</p>${chips(rels.map(r => r.replace(/^L/, "").replace(/;$/, "")))}
      <p>دوال يستدعيها:</p>${chips(calls)}</div>
    <input id="smq" type="text" placeholder="ابحث داخل هذا الملف…" style="width:100%;margin-bottom:10px">
    <div id="smcode"></div>
    <div class="explain" id="smex">اضغط على أي سطر لشرحه بالعربية.</div>`;
  renderCodeInto($("#smcode"), txt, "smali", $("#smex"));
  $("#smq").oninput = e => filterCode($("#smcode"), e.target.value);
}

/* ---------- تحليل الأمان: الألوان والارتباط بين الملفات ---------- */
function renderSecurity() {
  const el = $("#v-security");
  if (!gate(el)) return;
  const res = Object.keys(state.cur).map(p => ({ p, a: analyze(state.cur[p]) }));
  const counts = [0, 0, 0, 0];
  res.forEach(r => counts[r.a.sev]++);
  const by = c => res.filter(r => r.a.cats.includes(c)).map(r => r.p.split("/").pop());
  const groups = [["الميكروفون", "mic"], ["البيانات الحساسة", "data"], ["الشبكة", "net"], ["الخدمات الخلفية", "bg"], ["الإقلاع التلقائي", "boot"]];
  const verdict = res.some(r => r.a.sev === 3)
    ? "توجد ملفات تستوجب التحقيق، راجع سبب التلوين في كل ملف."
    : "لا يوجد نمط مجتمع يستدعي التحقيق في هذه العينة.";
  el.innerHTML = `<h2>نظام التلوين والتحليل الأمني</h2>
    <p class="hint">التلوين ناتج عن تحليل الأسطر الفعلية داخل كل ملف، ولا يُختار عشوائياً. وجود صلاحية أو خدمة لا يعني أن الملف خبيث بالضرورة.</p>
    <div class="legend">${SEV_LABELS.map((l, i) => `<span><i class="dot sev-${i}"></i>${l}</span>`).join("")}</div>
    <div class="stats-grid">${counts.map((c, i) =>
      `<div class="stat"><b>${c}</b><small>${["عادي", "حساس", "شبكة/خلفية", "تحقيق"][i]}</small></div>`).join("")}</div>
    <div class="card"><h3>ارتباط الملفات (السياق)</h3>
      ${groups.map(([n, c]) => `<p><b>${n}:</b> ${by(c).length ? by(c).map(esc).join("، ") : "لا يوجد"}</p>`).join("")}
      <p><b>الحكم:</b> ${verdict}</p></div>
    <h3>الملفات</h3>
    <div>${res.map(r => fileRow(r.p, r.a)).join("")}</div>`;
  bindFileButtons(el);
}

/* ---------- مختبر تحليل التجسس ---------- */
function renderSpy() {
  const el = $("#v-spy");
  if (!gate(el)) return;
  const res = Object.keys(state.cur).map(p => ({ p, a: analyze(state.cur[p]) }));
  const found = {};
  res.forEach(r => r.a.findings.forEach(f => (found[f.cat] = found[f.cat] || []).push({ p: r.p, no: f.no, ar: f.ar })));
  const hasSuspicious = res.some(r => r.a.sev === 3);
  const hiddenSend = res.some(r => r.a.cats.includes("susp") && r.a.cats.includes("net"));
  const verdict = hasSuspicious
    ? "توجد مؤشرات تستوجب التحقيق، تحديداً في المكونات المُلوَّنة بالأحمر."
    : "لا توجد مؤشرات تجسس واضحة، لكن راجع الصلاحيات المذكورة أدناه.";
  el.innerHTML = `<h2>مختبر تحليل التجسس</h2>
    <p class="hint">نبحث عن ثلاثة أشياء: صلاحيات حساسة، ومشغّلات خلفية، واتصالات تُرسل بيانات. ثم ننظر: هل تجتمع معاً؟</p>
    <div class="card"><h3>الحكم العام</h3><p>${verdict}</p>
      <p><b>محاولات إرسال مخفية:</b> ${hiddenSend ? "احتمال موجود، لأن ملفاً به سلوك مخفٍ يتصل بالشبكة في الوقت نفسه." : "لم تُرصد."}</p></div>
    ${Object.keys(CAT_INFO).filter(c => found[c]).map(c => `
      <div class="card">
        ${sevBadge(c === "susp" ? 3 : c === "net" || c === "bg" || c === "boot" ? 2 : 1)}
        <h3>${CAT_INFO[c].title}</h3>
        <p>${CAT_INFO[c].why}</p>
        <p class="meta">عدد المؤشرات: ${found[c].length}</p>
        <ul>${found[c].slice(0, 6).map(f => `<li><code>${esc(f.p.split("/").pop())}:${f.no}</code> — ${f.ar}</li>`).join("")}</ul>
        <p><b>طريقة الحماية:</b> ${CAT_INFO[c].tip}</p>
      </div>`).join("")}
    ${Object.keys(found).length ? "" : '<div class="card">لا توجد مؤشرات مُرصودة في هذا التطبيق.</div>'}`;
}

/* ---------- محاكاة Telegram (وهمية بالكامل) ---------- */
const TG = {
  legit: {
    steps: ["المستخدم يوافق على الإرسال", "التطبيق يرسل بيانات محدودة وغير حساسة", "الخادم يستقبل ويرد", "يظهر إشعار واضح للمستخدم"],
    msgs: [
      ["bot", "مرحباً! هذا بوت تجريبي وهمي لا يتصل بأي خدمة حقيقية."],
      ["app", "المستخدم وافق على المزامنة ✓"],
      ["app", "إرسال: عدد الملاحظات = 3 (بيانات عامة)"],
      ["bot", "تم الاستلام ✓ (وهمي)"]
    ],
    bad: false
  },
  susp: {
    steps: ["لا توجد موافقة من المستخدم", "تسجيل صوت في الخلفية دون واجهة", "رفع مقاطع دون أي إشعار", "لا أثر ظاهر للمستخدم"],
    msgs: [
      ["hidden-app", "[خفي] بدء تسجيل صوتي دون واجهة ظاهرة"],
      ["hidden-app", "[خفي] رفع مقطع صوتي إلى نطاق تجريبي"],
      ["bot", "استلام مقطع ✓ (وهمي)"],
      ["hidden-app", "[خفي] إخفاء الأيقونة من الشاشة"]
    ],
    bad: true
  }
};
let tgTimer = null;
function renderTelegram() {
  $("#v-telegram").innerHTML = `<h2>محاكاة Telegram</h2>
    <p class="hint">بوت تجريبي وهمي يوضّح كيف يتصل تطبيق Android بخدمة خارجية. لا يتصل بأي خدمة حقيقية ولا يرسل أي بيانات.</p>
    <div class="row btns"><button class="primary" data-m="legit">محاكاة اتصال مشروع</button><button data-m="susp">محاكاة اتصال مشبوه</button></div>
    <div class="flow" id="flow"><div class="node">اختر محاكاة لبدء المسار</div></div>
    <div class="chat" id="chat"><span class="mono">بوت وهمي: بانتظار المحاكاة…</span></div>
    <div class="card" style="margin-top:12px"><h3>الفرق بين الاتصالين</h3>
      <p>الاتصال المشروع يعرف فيه المستخدم ما يُرسل، ويكون الإرسال محدوداً ومعلناً. أما المشبوه فيعتمد على الإخفاء: لا موافقة، ولا إشعار، وبيانات حساسة تخرج دون علم صاحب الجهاز.</p></div>`;
  $$("#v-telegram [data-m]").forEach(b => b.onclick = () => runTG(b.dataset.m));
}
function runTG(mode) {
  clearInterval(tgTimer);
  const d = TG[mode], flow = $("#flow"), chat = $("#chat");
  chat.innerHTML = "";
  flow.innerHTML = d.steps.map((s, i) => `<div class="node ${d.bad ? "bad" : ""}" data-i="${i}">${i + 1}. ${esc(s)}</div>`).join("");
  let i = 0;
  tgTimer = setInterval(() => {
    if (i >= d.msgs.length) { clearInterval(tgTimer); return; }
    const [role, txt] = d.msgs[i];
    chat.insertAdjacentHTML("beforeend", `<div class="bubble ${role}">${esc(txt)}</div>`);
    flow.querySelector(`[data-i="${Math.min(i, d.steps.length - 1)}"]`)?.classList.add("lit");
    i++;
  }, 900);
}

/* ---------- محرر الأكواد ---------- */
function checkErrors(p, t) {
  const e = [];
  if (p.endsWith(".json")) {
    try { JSON.parse(t); } catch (x) { e.push("خطأ JSON: " + x.message); }
  }
  if (p.endsWith(".smali")) {
    const s = (t.match(/^\.method /gm) || []).length;
    const en = (t.match(/^\.end method/gm) || []).length;
    if (s !== en) e.push(`عدد .method (${s}) لا يساوي عدد .end method (${en})`);
  }
  return e.length ? e : ["لا توجد أخطاء بنيوية واضحة (فحص مبسّط)."];
}
function renderEditor() {
  const el = $("#v-editor");
  if (!gate(el)) return;
  const files = Object.keys(state.cur);
  if (!files.includes(state.file)) state.file = files[0];
  el.innerHTML = `<h2>محرر الأكواد</h2>
    <p class="hint">التعديل يتم داخل ملفات المختبر التجريبية فقط ولا يُرسل إلى أي مكان. يمكنك المقارنة مع النسخة الأصلية أو التراجع عنها.</p>
    <div class="row"><label for="edSel">الملف</label>
      <select id="edSel">${files.map(p => `<option value="${esc(p)}" ${p === state.file ? "selected" : ""}>${esc(p)}</option>`).join("")}</select></div>
    <div class="row"><input id="edQ" type="text" placeholder="ابحث داخل الكود…"></div>
    <div class="ed"><div class="gutter" id="gut"></div><textarea id="ed" spellcheck="false" wrap="off"></textarea></div>
    <div class="row btns" style="margin-top:12px">
      <button id="edUndo">تراجع للنسخة الأصلية</button>
      <button id="edDiff">مقارنة قبل وبعد</button>
      <button id="edCopy">نسخ الكود</button>
      <button id="edExp">شرح السطر الحالي</button>
      <button id="edChk">فحص الأخطاء</button>
    </div>
    <div id="edOut" class="explain">جاهز.</div>`;
  const ta = $("#ed"), gut = $("#gut"), out = $("#edOut");
  const syncGut = () => {
    const n = ta.value.split("\n").length;
    gut.textContent = Array.from({ length: n }, (_, i) => i + 1).join("\n");
  };
  const load = () => { ta.value = state.cur[state.file]; syncGut(); };
  ta.oninput = () => { state.cur[state.file] = ta.value; syncGut(); };
  ta.onscroll = () => { gut.scrollTop = ta.scrollTop; };
  $("#edSel").onchange = e => { state.file = e.target.value; load(); };
  $("#edQ").oninput = e => {
    const q = e.target.value.toLowerCase();
    if (!q) return;
    const idx = ta.value.toLowerCase().indexOf(q);
    if (idx < 0) { out.textContent = "لم يُعثر على النص."; return; }
    ta.focus(); ta.setSelectionRange(idx, idx + q.length);
    const line = ta.value.slice(0, idx).split("\n").length;
    out.innerHTML = `وُجد في السطر ${line}.`;
  };
  $("#edUndo").onclick = () => { state.cur[state.file] = state.orig[state.file]; load(); out.textContent = "تمت استعادة النسخة الأصلية."; };
  $("#edDiff").onclick = () => {
    const a = state.orig[state.file].split("\n"), b = state.cur[state.file].split("\n");
    const rows = [];
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      if (a[i] !== b[i]) rows.push(`<div class="mono">سطر ${i + 1}</div>` +
        (a[i] !== undefined ? `<div class="diff-del">- ${esc(a[i])}</div>` : "") +
        (b[i] !== undefined ? `<div class="diff-add">+ ${esc(b[i])}</div>` : ""));
    }
    out.innerHTML = rows.length ? `<b>${rows.length} سطر تغيّر</b>${rows.join("")}` : "لا توجد تغييرات مقارنةً بالنسخة الأصلية.";
  };
  $("#edCopy").onclick = async () => {
    try { await navigator.clipboard.writeText(ta.value); out.textContent = "تم نسخ الكود."; }
    catch (e) { ta.select(); out.textContent = "انسخ النص المحدد يدوياً."; }
  };
  $("#edExp").onclick = () => {
    const i = ta.value.slice(0, ta.selectionStart).split("\n").length - 1;
    const ln = ta.value.split("\n")[i] || "";
    out.innerHTML = `<b>السطر ${i + 1}:</b> <span class="mono">${esc(ln.trim() || "(فارغ)")}</span><br>${explainLine(ln)}`;
  };
  $("#edChk").onclick = () => { out.innerHTML = checkErrors(state.file, state.cur[state.file]).map(x => `<p>${esc(x)}</p>`).join(""); };
  load();
}

/* ---------- الصلاحيات ---------- */
function renderPerms() {
  $("#v-perms").innerHTML = `<h2>تحليل صلاحيات Android</h2>
    <p class="hint">اضغط على أي صلاحية لعرض وظيفتها، ومتى تكون طبيعية، ومتى تصبح مثيرة للشك.</p>` +
    PERMISSIONS.map(p => `<div class="card perm">
      <div class="head"><span class="pn">${p.name}</span>${sevBadge(p.sens)}</div>
      <div>${p.ar}</div>
      <div class="body">
        <p><b>وظيفتها:</b> ${p.use}</p>
        <p><b>متى تكون طبيعية؟</b> ${p.normal}</p>
        <p><b>متى تصبح مثيرة للشك؟</b> ${p.suspicious}</p>
        <p><b>مستوى الحساسية:</b> ${SEV_LABELS[p.sens].split(" — ")[1]}</p>
      </div></div>`).join("");
  $$(".perm").forEach(c => c.onclick = () => c.classList.toggle("open"));
}

/* ---------- الدروس ---------- */
function renderLessons() {
  $("#v-lessons").innerHTML = `<h2>الدروس</h2>
    <p class="hint">اقرأ الدرس لتكسب نقاطاً، ثم انتقل إلى تبويب الاختبارات.</p>` +
    LESSONS.map(l => `<button class="lesson-btn ${prog.read[l.id] ? "done" : ""}" data-id="${l.id}">
      <b>${l.id}. ${esc(l.title)}</b>${prog.read[l.id] ? ' <span class="mono">✓ مقروء</span>' : ""}</button>`).join("") +
    `<div id="lesson-body"></div>`;
  $$(".lesson-btn").forEach(b => b.onclick = () => {
    const id = +b.dataset.id, l = LESSONS.find(x => x.id === id);
    if (!prog.read[id]) { prog.read[id] = true; saveProg(); b.classList.add("done"); }
    $("#lesson-body").innerHTML = `<div class="card"><h3>${l.id}. ${esc(l.title)}</h3><p>${esc(l.body)}</p></div>`;
  });
}

/* ---------- الاختبارات ---------- */
let qIndex = 0;
function renderQuiz() {
  const correct = Object.keys(prog.ok).length;
  $("#v-quiz").innerHTML = `<h2>الاختبارات والتحديات</h2>
    <div class="stats-grid">
      <div class="stat"><b>${points()}</b><small>النقاط</small></div>
      <div class="stat"><b>${correct}/${QUIZ.length}</b><small>إجابات صحيحة</small></div>
      <div class="stat"><b>${levelName()}</b><small>المستوى</small></div>
    </div>
    <div id="qbox"></div>
    <button id="qReset" style="margin-top:12px">إعادة ضبط التقدم</button>`;
  drawQ();
  $("#qReset").onclick = () => {
    if (confirm("حذف النقاط والتقدم المحفوظ؟")) { prog = { read: {}, ans: {}, ok: {} }; saveProg(); renderQuiz(); }
  };
}
function drawQ() {
  const q = QUIZ[qIndex], box = $("#qbox");
  const chosen = prog.ans[q.id];
  const answered = chosen !== undefined;
  box.innerHTML = `<div class="card">
    <p class="mono">السؤال ${qIndex + 1} من ${QUIZ.length}</p>
    <h3>${esc(q.q)}</h3>
    ${q.opts.map((o, i) => {
      let cls = "";
      if (answered && i === q.a) cls = "right";
      else if (answered && i === chosen) cls = "wrong";
      return `<button class="opt ${cls}" data-i="${i}" ${answered ? "disabled" : ""}>${esc(o)}</button>`;
    }).join("")}
    ${answered ? `<div class="explain">${prog.ok[q.id] ? "إجابة صحيحة ✓ " : "إجابة خاطئة. "}${esc(q.why)}</div>` : ""}
    <div class="row btns" style="margin-top:10px">
      <button id="qPrev" ${qIndex === 0 ? "disabled" : ""}>السابق</button>
      <button id="qNext" class="primary" ${qIndex === QUIZ.length - 1 ? "disabled" : ""}>التالي</button>
    </div></div>`;
  box.querySelectorAll(".opt").forEach(b => b.onclick = () => {
    const i = +b.dataset.i;
    prog.ans[q.id] = i;
    if (i === q.a) prog.ok[q.id] = true;
    saveProg();
    renderQuiz();
  });
  $("#qPrev").onclick = () => { qIndex--; renderQuiz(); };
  $("#qNext").onclick = () => { qIndex++; renderQuiz(); };
}

/* ---------- التنقل والتشغيل ---------- */
const VIEWS = {
  apk: renderAPK, smali: renderSmali, security: renderSecurity, spy: renderSpy,
  telegram: renderTelegram, editor: renderEditor, perms: renderPerms,
  lessons: renderLessons, quiz: renderQuiz
};
function go(v) {
  if (!VIEWS[v]) v = "apk";
  $$("#tabs button").forEach(b => b.classList.toggle("on", b.dataset.v === v));
  $$(".view").forEach(s => s.classList.toggle("on", s.id === "v-" + v));
  VIEWS[v]();
  history.replaceState(null, "", "#" + v);
  window.scrollTo(0, 0);
}
window.go = go;

$$("#tabs button").forEach(b => b.onclick = () => go(b.dataset.v));
$("#m-close").onclick = () => $("#modal").classList.add("hidden");
$("#modal").onclick = e => { if (e.target.id === "modal") $("#modal").classList.add("hidden"); };

loadApp("notes");
renderXP();
go(location.hash.slice(1) || "apk");
