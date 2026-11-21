/* Mac C.J. England Bathrooms: products, cart → WhatsApp checkout, WhatsApp links, motion. */

/* ===== EDIT HERE ===== */
// TEST number (the developer's own, 0903 671 9458), set 2026-11-21 for the live demo.
// Replace with Mac C.J.'s real WhatsApp number before handing over to the client.
const WHATSAPP_NUMBER = "2349036719458";
const BRAND = "Mac C.J. England Bathrooms";

const MESSAGES = {
  general:  () => `Hello ${BRAND}, I'd like to place an order (from website)`,
  category: (item) => `Hello ${BRAND}, I'd like to see your ${item} options. What do you have in stock? (from website)`,
  product:  (item) => `Hello ${BRAND}, I'm interested in the ${item}. Is it available, and what's the price? (from website)`,
  plan:     () => `Hello ${BRAND}, I'm planning a bathroom and would like help choosing fittings (from website)`,
  trade:    () => `Hello ${BRAND}, I'm sourcing fittings for a project and would like to send my list (from website)`,
  visit:    () => `Hello ${BRAND}, I'd like to visit the showroom (from website)`,
};

// Example products. Photos are Unsplash stock showing the style, not exact stock.
// No prices: they are confirmed on WhatsApp.
const PRODUCTS = [
  { id: "wc",        name: "Wall-hung WC",              cat: "WCs",        img: "images/p-wc.jpg",             desc: "Floating toilet with slim seat for a clean, modern look." },
  { id: "shower",    name: "Rain shower set, matte black", cat: "Showers",  img: "images/p-rain-shower.jpg",    desc: "Overhead rain shower with hand shower and wall controls." },
  { id: "vessel",    name: "Stone-look vessel basin",   cat: "Basins",     img: "images/p-vessel-basin.jpg",   desc: "Countertop bowl basin. Pairs well with a wall-mounted mixer." },
  { id: "mixer",     name: "Chrome basin mixer",        cat: "Taps",       img: "images/p-basin-mixer.jpg",    desc: "Single-lever mixer tap for everyday basins." },
  { id: "mirror",    name: "Arched framed mirror",      cat: "Mirrors",    img: "images/p-arched-mirror.jpg",  desc: "Slim black frame that suits modern vanities." },
  { id: "bath",      name: "Freestanding bathtub",      cat: "Baths",      img: "images/p-bathtub.jpg",        desc: "Double-ended freestanding bath, the centrepiece of the room." },
  { id: "enclosure", name: "Glass shower enclosure",    cat: "Cubicles",   img: "images/p-enclosure.jpg",      desc: "Clear glass enclosure for a walk-in shower." },
  { id: "vanity",    name: "Vanity unit with basin",    cat: "Cabinets",   img: "images/p-vanity.jpg",         desc: "Floor-standing storage unit with an integrated basin." },
];
/* ===================== */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const waUrl = (text) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

/* ---------- WhatsApp links ---------- */
function wireWhatsApp(root = document) {
  $$("[data-wa]", root).forEach((link) => {
    const build = MESSAGES[link.dataset.wa] || MESSAGES.general;
    link.href = waUrl(build(link.dataset.item || ""));
    link.target = "_blank";
    link.rel = "noopener";
  });
}

/* ---------- Products + filters ---------- */
const grid = $("#products");
grid.innerHTML = PRODUCTS.map((p, i) => `
  <article class="product" data-cat="${esc(p.cat)}" style="--i:${i % 4}">
    <div class="product-img">
      <img src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy" width="900" height="990">
      <span class="product-tag">${esc(p.cat)}</span>
      <a class="product-ask" href="#" data-wa="product" data-item="${esc(p.name)}" aria-label="Ask about the ${esc(p.name)} on WhatsApp">
        <svg aria-hidden="true"><use href="#wa"/></svg>
      </a>
    </div>
    <div class="product-body">
      <h3>${esc(p.name)}</h3>
      <p>${esc(p.desc)}</p>
      <div class="product-foot">
        <span class="price">Price on request</span>
        <button class="add" type="button" data-add="${esc(p.id)}">
          <svg aria-hidden="true"><use href="#bag"/></svg>
          <span class="add-label">Add to cart</span>
        </button>
      </div>
    </div>
  </article>`).join("");

const cats = ["All", ...new Set(PRODUCTS.map((p) => p.cat))];
const filters = $("#filters");
filters.innerHTML = cats.map((c, i) =>
  `<button class="chip" type="button" role="tab" aria-selected="${i === 0}" data-filter="${esc(c)}">${esc(c)}</button>`).join("");
filters.addEventListener("click", (e) => {
  const chip = e.target.closest("[data-filter]");
  if (!chip) return;
  $$(".chip", filters).forEach((c) => c.setAttribute("aria-selected", c === chip));
  const f = chip.dataset.filter;
  $$(".product", grid).forEach((card, i) => {
    const show = f === "All" || card.dataset.cat === f;
    card.classList.toggle("hide", !show);
    if (show && !reduced) {
      card.classList.remove("in");
      card.style.setProperty("--i", i % 4);
      requestAnimationFrame(() => requestAnimationFrame(() => card.classList.add("in")));
    }
  });
});

/* ---------- Cart (kept in this browser only) ---------- */
const STORE_KEY = "maccj-cart";
let cart = {};
try { cart = JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch (_) { cart = {}; }
const save = () => { try { localStorage.setItem(STORE_KEY, JSON.stringify(cart)); } catch (_) {} };
const findP = (id) => PRODUCTS.find((p) => p.id === id);

const cartEl = $("#cart"), overlay = $("#cartOverlay"), countEl = $("#cartCount"), openBtn = $("#cartOpen");
let lastFocus = null;

function renderCart() {
  const ids = Object.keys(cart).filter((id) => findP(id) && cart[id] > 0);
  const total = ids.reduce((n, id) => n + cart[id], 0);
  countEl.textContent = total;
  countEl.classList.toggle("has", total > 0);
  openBtn.setAttribute("aria-label", `Open cart, ${total} item${total === 1 ? "" : "s"}`);
  cartEl.classList.toggle("empty", total === 0);
  $("#cartEmpty").hidden = total > 0;
  $("#cartItems").innerHTML = ids.map((id) => {
    const p = findP(id);
    return `<li class="cart-item">
      <img src="${esc(p.img)}" alt="" width="64" height="64">
      <div><h3>${esc(p.name)}</h3><small>${esc(p.cat)} · price on request</small></div>
      <div class="qty" aria-label="Quantity of ${esc(p.name)}">
        <button type="button" data-dec="${esc(id)}" aria-label="One less">−</button>
        <span>${cart[id]}</span>
        <button type="button" data-inc="${esc(id)}" aria-label="One more">+</button>
      </div>
      <button type="button" class="cart-remove" data-rm="${esc(id)}">Remove</button>
    </li>`;
  }).join("");
  $$(".add", grid).forEach((b) => b.classList.toggle("added", !!cart[b.dataset.add]));
}

function openCart() {
  lastFocus = document.activeElement;
  overlay.hidden = false;
  requestAnimationFrame(() => overlay.classList.add("show"));
  cartEl.classList.add("open");
  cartEl.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";
  setTimeout(() => cartEl.focus(), 50);
}
function closeCart() {
  overlay.classList.remove("show");
  cartEl.classList.remove("open");
  cartEl.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
  setTimeout(() => { overlay.hidden = true; }, 500);
  if (lastFocus) lastFocus.focus();
}

let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

grid.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-add]");
  if (!btn) return;
  const id = btn.dataset.add;
  cart[id] = (cart[id] || 0) + 1;
  save(); renderCart();
  openBtn.classList.remove("bump"); void openBtn.offsetWidth; openBtn.classList.add("bump");
  toast(`Added: ${findP(id).name}`);
});

$("#cartItems").addEventListener("click", (e) => {
  const b = e.target.closest("button");
  if (!b) return;
  if (b.dataset.inc) cart[b.dataset.inc]++;
  if (b.dataset.dec) cart[b.dataset.dec] = Math.max(0, cart[b.dataset.dec] - 1);
  if (b.dataset.rm) cart[b.dataset.rm] = 0;
  Object.keys(cart).forEach((k) => { if (!cart[k]) delete cart[k]; });
  save(); renderCart();
});

openBtn.addEventListener("click", openCart);
$("#cartClose").addEventListener("click", closeCart);
overlay.addEventListener("click", closeCart);
$("#cartBrowse").addEventListener("click", closeCart);
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && cartEl.classList.contains("open")) closeCart(); });
$("#cartClear").addEventListener("click", () => { cart = {}; save(); renderCart(); });

// Checkout: the cart becomes a WhatsApp message
$("#cartForm").addEventListener("submit", (e) => {
  e.preventDefault();
  const ids = Object.keys(cart).filter((id) => cart[id] > 0 && findP(id));
  if (!ids.length) return;
  const f = new FormData(e.target);
  const name = String(f.get("name") || "").trim();
  const area = String(f.get("area") || "").trim();
  const lines = [
    `Hello ${BRAND}, I'd like to order:`,
    ...ids.map((id) => `• ${cart[id]} × ${findP(id).name}`),
    "",
    name ? `Name: ${name}` : null,
    area ? `Delivery area / pickup: ${area}` : null,
    "Please confirm price and availability. (from website)",
  ].filter((l) => l !== null);
  window.open(waUrl(lines.join("\n")), "_blank", "noopener");
});

/* ---------- Motion (kept simple) ---------- */
// Fade sections up once as they scroll into view
const io = new IntersectionObserver((entries) => {
  entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
}, { threshold: 0.15, rootMargin: "0px 0px -5% 0px" });
$$("[data-reveal], .product").forEach((el) => io.observe(el));

// Header gets a hairline and soft shadow once you scroll
const header = $("#header");
const onScroll = () => header.classList.toggle("scrolled", window.scrollY > 10);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

$("#year").textContent = new Date().getFullYear();

wireWhatsApp();
renderCart();

