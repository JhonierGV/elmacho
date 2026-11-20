
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.JardinState = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var STYLES = ["lily", "tulip", "rose", "daisy", "sunflower", "lavender"];
  var LEGACY_STYLES = { pixel: "daisy", line: "lavender", neon: "sunflower" };
  var KEY = "jardin-nadia:v2";
  var LEGACY_KEY = "jardin-nadia:v1";
  var MAX = 60;
  var PER_STYLE = 3;
  var seq = 0;


  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, Number(value)));
  }

  function create() {
    return {
      version: 2,
      flowers: [],
      completed: false,
      cockroachFound: 0,
      lastVisit: 0
    };
  }

  function validateFlower(raw) {
    if (!raw) return null;
    var style = LEGACY_STYLES[raw.style] || raw.style;
    if (STYLES.indexOf(style) === -1) return null;
    var x = Number(raw.x);
    var y = Number(raw.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    return {
      id: String(raw.id || "f_" + Date.now() + "_" + (++seq)),
      style: style,
      x: clamp(x, 0.05, 0.95),
      y: clamp(y, 0.06, 0.96),
      scale: clamp(Number(raw.scale) || 1, 0.7, 1.2),
      variant: Math.abs(Math.floor(Number(raw.variant) || 0)) % 3,
      createdAt: Number(raw.createdAt) || Date.now()
    };
  }

  function countByStyle(state) {
    var counts = {};
    STYLES.forEach(function (id) { counts[id] = 0; });
    (state.flowers || []).forEach(function (item) {
      if (counts[item.style] != null) counts[item.style] += 1;
    });
    return counts;
  }

  function total(state) {
    return (state.flowers || []).length;
  }

  function isComplete(state) {
    var counts = countByStyle(state);
    return STYLES.every(function (id) { return counts[id] >= PER_STYLE; });
  }

  function sanitize(raw) {
    if (!raw || typeof raw !== "object") return create();
    var state = create();
    var list = Array.isArray(raw.flowers) ? raw.flowers.slice(0, MAX) : [];
    list.forEach(function (item) {
      var flower = validateFlower(item);
      if (flower) state.flowers.push(flower);
    });
    state.completed = Boolean(raw.completed) || isComplete(state);
    state.cockroachFound = Math.max(0, Math.floor(Number(raw.cockroachFound) || 0));
    state.lastVisit = Math.max(0, Number(raw.lastVisit) || 0);
    return state;
  }

  function addFlower(state, input) {
    var flower = validateFlower(input);
    if (!flower) return { added: false, flower: null, removed: null, completedBefore: state.completed };
    var completedBefore = state.completed;
    var removed = null;
    if (state.flowers.length >= MAX) {
      var oldestIndex = 0;
      for (var i = 1; i < state.flowers.length; i += 1) {
        if (state.flowers[i].createdAt < state.flowers[oldestIndex].createdAt) oldestIndex = i;
      }
      removed = state.flowers.splice(oldestIndex, 1)[0];
    }
    state.flowers.push(flower);
    if (isComplete(state)) state.completed = true;
    return { added: true, flower: flower, removed: removed, completedBefore: completedBefore };
  }

  function load(storage) {
    if (!storage) return create();
    try {
      var raw = storage.getItem(KEY) || storage.getItem(LEGACY_KEY);
      if (!raw) return create();
      return sanitize(JSON.parse(raw));
    } catch (error) {
      return create();
    }
  }

  function save(storage, state) {
    if (!storage) return false;
    try {
      storage.setItem(KEY, JSON.stringify(sanitize(state)));
      return true;
    } catch (error) {
      return false;
    }
  }

  return {
    STYLES: STYLES,
    KEY: KEY,
    MAX: MAX,
    PER_STYLE: PER_STYLE,
    clamp: clamp,
    create: create,
    validateFlower: validateFlower,
    sanitize: sanitize,
    countByStyle: countByStyle,
    total: total,
    isComplete: isComplete,
    addFlower: addFlower,
    load: load,
    save: save
  };
});


;

(function (root) {
  "use strict";

  // Original paths and palette from the six-flower illustration.
  var illustrations = {
    lily: {
      name: "Lilies",
      stem: `<path class="flower-stem" d="M32 37 V78"/>`,
      leaves: `<path class="leaf" d="M32 64 C18 49 9 51 11 57 C15 67 25 69 32 70Z"/>
    <path class="leaf" d="M32 69 C45 49 53 50 52 57 C50 66 40 70 32 72Z"/>`,
      bloom: `<g>
      <path class="petal" d="M32 33 Q17 19 31 3 Q45 18 32 33Z"/>
      <path class="petal" d="M32 33 Q17 19 31 3 Q45 18 32 33Z" transform="rotate(60 32 33)"/>
      <path class="petal" d="M32 33 Q17 19 31 3 Q45 18 32 33Z" transform="rotate(120 32 33)"/>
      <path class="petal" d="M32 33 Q17 19 31 3 Q45 18 32 33Z" transform="rotate(180 32 33)"/>
      <path class="petal" d="M32 33 Q17 19 31 3 Q45 18 32 33Z" transform="rotate(240 32 33)"/>
      <path class="petal" d="M32 33 Q17 19 31 3 Q45 18 32 33Z" transform="rotate(300 32 33)"/>
    </g>
    <path class="detail" d="M31 31 L25 21 M32 31 L32 18 M33 31 L39 21"/>
    <circle class="center" cx="25" cy="20" r="2"/><circle class="center" cx="32" cy="17" r="2"/><circle class="center" cx="39" cy="20" r="2"/>`
    },
    tulip: {
      name: "Tulips",
      stem: `<path class="flower-stem" d="M32 38 V79"/>`,
      leaves: `<path class="leaf" d="M32 67 Q15 62 14 44 Q28 48 32 67Z"/>
    <path class="leaf" d="M32 73 Q47 65 51 48 Q36 49 32 73Z"/>`,
      bloom: `<path class="petal" d="M17 16 Q21 20 32 18 Q43 20 47 16 L46 31 Q42 42 32 42 Q22 42 18 31Z"/>
    <path class="accent" d="M18 15 Q23 16 32 30 Q41 16 46 15 Q44 31 32 40 Q20 32 18 15Z"/>
    <path class="petal" d="M32 33 Q25 23 32 10 Q39 23 32 33Z"/>`
    },
    rose: {
      name: "Roses",
      stem: `<path class="flower-stem" d="M32 47 V79"/>`,
      leaves: `<path class="leaf" d="M32 67 Q13 57 10 62 Q18 73 32 72Z"/>
    <path class="leaf" d="M32 60 Q46 50 55 55 Q47 66 32 67Z"/>`,
      bloom: `<path class="petal" d="M32 15 C20 3 9 18 13 28 C8 41 20 49 32 47 C47 50 57 35 50 26 C54 15 42 7 32 15Z"/>
    <path class="accent" d="M18 23 Q25 13 35 18 Q49 13 47 29 Q46 41 32 43 Q17 40 18 23Z"/>
    <path class="detail" d="M20 28 C22 18 37 17 42 25 C46 34 36 38 31 35 C24 32 28 25 34 26 C39 27 36 31 33 30"/>`
    },
    daisy: {
      name: "Daisies",
      stem: `<path class="flower-stem" d="M32 37 V79"/>`,
      leaves: `<path class="leaf" d="M32 68 Q17 52 10 58 Q18 71 32 72Z"/>
    <path class="leaf" d="M32 61 Q45 51 53 55 Q47 64 32 67Z"/>`,
      bloom: `<g class="petal">
      <ellipse cx="32" cy="14" rx="6.1" ry="12"/>
      <ellipse cx="32" cy="14" rx="6.1" ry="12" transform="rotate(45 32 32)"/>
      <ellipse cx="32" cy="14" rx="6.1" ry="12" transform="rotate(90 32 32)"/>
      <ellipse cx="32" cy="14" rx="6.1" ry="12" transform="rotate(135 32 32)"/>
      <ellipse cx="32" cy="14" rx="6.1" ry="12" transform="rotate(180 32 32)"/>
      <ellipse cx="32" cy="14" rx="6.1" ry="12" transform="rotate(225 32 32)"/>
      <ellipse cx="32" cy="14" rx="6.1" ry="12" transform="rotate(270 32 32)"/>
      <ellipse cx="32" cy="14" rx="6.1" ry="12" transform="rotate(315 32 32)"/>
    </g>
    <circle class="center" cx="32" cy="32" r="9"/>
    <circle class="detail" cx="32" cy="32" r="6"/>`
    },
    sunflower: {
      name: "Sunflowers",
      stem: `<path class="flower-stem" d="M32 42 V79"/>`,
      leaves: `<path class="leaf" d="M32 64 Q14 50 10 57 Q17 68 32 69Z"/>
    <path class="leaf" d="M32 68 Q47 49 55 55 Q50 67 32 72Z"/>`,
      bloom: `<g class="petal">
      <ellipse cx="32" cy="12" rx="5.4" ry="11"/>
      <ellipse cx="32" cy="12" rx="5.4" ry="11" transform="rotate(30 32 30)"/>
      <ellipse cx="32" cy="12" rx="5.4" ry="11" transform="rotate(60 32 30)"/>
      <ellipse cx="32" cy="12" rx="5.4" ry="11" transform="rotate(90 32 30)"/>
      <ellipse cx="32" cy="12" rx="5.4" ry="11" transform="rotate(120 32 30)"/>
      <ellipse cx="32" cy="12" rx="5.4" ry="11" transform="rotate(150 32 30)"/>
      <ellipse cx="32" cy="12" rx="5.4" ry="11" transform="rotate(180 32 30)"/>
      <ellipse cx="32" cy="12" rx="5.4" ry="11" transform="rotate(210 32 30)"/>
      <ellipse cx="32" cy="12" rx="5.4" ry="11" transform="rotate(240 32 30)"/>
      <ellipse cx="32" cy="12" rx="5.4" ry="11" transform="rotate(270 32 30)"/>
      <ellipse cx="32" cy="12" rx="5.4" ry="11" transform="rotate(300 32 30)"/>
      <ellipse cx="32" cy="12" rx="5.4" ry="11" transform="rotate(330 32 30)"/>
    </g>
    <circle class="center" cx="32" cy="30" r="11"/>
    <circle cx="27" cy="26" r="1.2" class="accent"/><circle cx="34" cy="25" r="1.2" class="accent"/>
    <circle cx="30" cy="32" r="1.2" class="accent"/><circle cx="37" cy="32" r="1.2" class="accent"/>
    <circle cx="26" cy="35" r="1.2" class="accent"/><circle cx="33" cy="37" r="1.2" class="accent"/>`
    },
    lavender: {
      name: "Lavender",
      stem: `<path class="flower-stem" d="M31 14 Q30 42 33 79"/>`,
      leaves: `<path class="leaf" d="M32 65 Q13 58 12 52 Q25 50 32 65Z"/>
    <path class="leaf" d="M32 72 Q45 56 53 57 Q48 69 32 73Z"/>`,
      bloom: `<g class="petal">
      <ellipse cx="30" cy="11" rx="4" ry="7"/>
      <ellipse cx="24" cy="19" rx="4.5" ry="6.5" transform="rotate(-25 24 19)"/>
      <ellipse cx="36" cy="19" rx="4.5" ry="6.5" transform="rotate(25 36 19)"/>
      <ellipse cx="23" cy="29" rx="5" ry="7" transform="rotate(-30 23 29)"/>
      <ellipse cx="38" cy="29" rx="5" ry="7" transform="rotate(30 38 29)"/>
      <ellipse cx="26" cy="39" rx="4.5" ry="6.5" transform="rotate(-25 26 39)"/>
      <ellipse cx="37" cy="39" rx="4.5" ry="6.5" transform="rotate(25 37 39)"/>
      <ellipse cx="30" cy="47" rx="3.7" ry="5.5"/>
    </g>
    <g class="accent">
      <ellipse cx="31" cy="19" rx="3" ry="4"/>
      <ellipse cx="31" cy="31" rx="3.5" ry="5"/>
      <ellipse cx="31" cy="41" rx="3" ry="4"/>
    </g>`
    }
  };

  function get(id) {
    return Object.prototype.hasOwnProperty.call(illustrations, id) ? illustrations[id] : null;
  }

  function illustration(id) {
    var art = get(id);
    return '<svg class="flower-illustration flower-illustration--' + id +
      '" viewBox="0 0 64 82" aria-hidden="true" focusable="false">' + art.stem +
      '<g class="flower-leaves">' + art.leaves + '</g>' +
      '<g class="flower-head">' + art.bloom + '</g></svg>';
  }

  function list() {
    return root.JardinState.STYLES.map(function (id) {
      return { id: id, name: get(id).name, icon: illustration(id) };
    });
  }

  function escapeAttribute(value) {
    return String(value).replace(/[&<>"]/g, function (character) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[character];
    });
  }

  function render(flower) {
    var x = (flower.x * 100).toFixed(3);
    var y = (flower.y * 100).toFixed(3);
    var depth = Math.round(flower.y * 1000);
    return '<div class="flower" data-id="' + escapeAttribute(flower.id) + '" data-style="' + flower.style +
      '" style="left:' + x + '%;top:' + y + '%;--scale:' + flower.scale + ';z-index:' + depth + '">' +
      '<div class="flower__art">' + illustration(flower.style) + '</div></div>';
  }

  root.FlowerStyles = { list: list, get: get, render: render };
})(window);


;

(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.JardinSnoopy = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var TEXTS = ["woof", "another one", "so pretty", "♥"];
  var DEFAULT_ASSET = "snoopy.png";
  var bubbleTimer = null;
  var celebrateTimer = null;

  function markup(src) {
    return '<div class="snoopy__bubble" aria-hidden="true"></div>' +
      '<img class="snoopy__art" src="' + (src || DEFAULT_ASSET) + '" alt="" draggable="false">' +
      '<button type="button" class="snoopy__hit" aria-label="Say hi to Snoopy"></button>';
  }

  function mount(el, src) {
    if (!el) return null;
    el.innerHTML = markup(src);
    return api;
  }

  function react(kind) {
    var el = document.getElementById("snoopy");
    if (!el || el.classList.contains("is-celebrating")) return;
    var bubble = el.querySelector(".snoopy__bubble");
    if (!bubble) return;
    bubble.textContent = kind === "hello" ? "hi" : TEXTS[Math.floor(Math.random() * TEXTS.length)];
    el.classList.add("is-reacting");
    clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(function () {
      el.classList.remove("is-reacting");
    }, 1500);
  }

  function celebrate() {
    var el = document.getElementById("snoopy");
    if (!el) return;
    el.classList.add("is-celebrating");
    clearTimeout(celebrateTimer);
    celebrateTimer = setTimeout(function () {
      el.classList.remove("is-celebrating");
    }, 4200);
  }

  function setComplete(value) {
    var el = document.getElementById("snoopy");
    if (!el) return;
    var complete = Boolean(value);
    el.classList.toggle("is-complete", complete);
    var hit = el.querySelector(".snoopy__hit");
    if (hit) hit.setAttribute("aria-label", complete ? "Replay the ending" : "Say hi to Snoopy");
  }

  var api = { asset: DEFAULT_ASSET, markup: markup, mount: mount, react: react, celebrate: celebrate, setComplete: setComplete };
  return api;
});


;

(function (root) {
  "use strict";

  var State = root.JardinState;
  var Styles = root.FlowerStyles;
  var Snoopy = root.JardinSnoopy;
  var COCKROACH_LINES = [
    "Found you, cucaracha polaca.",
    "I'll always find you, even from far away.",
    "A cucaracha polaca deserves flowers too."
  ];

  var api = {};
  var state = null;
  var opts = null;
  var ground = null;
  var layer = null;
  var cockroach = null;
  var flowersById = {};
  var lastPointer = null;
  var lastPlantAt = 0;
  var cockroachTimer = null;
  var cockroachHideTimer = null;

  function init(options) {
    opts = options;
    state = options.state;
    ground = document.getElementById("ground");
    layer = document.getElementById("flowers");
    cockroach = document.getElementById("cockroach");
    renderAll();
    bind();
    scheduleCockroach(2600);
  }

  function bind() {
    ground.addEventListener("pointerdown", function (event) {
      lastPointer = { x: event.clientX, y: event.clientY };
    });

    ground.addEventListener("pointerup", function (event) {
      if (!lastPointer) return;
      var dx = event.clientX - lastPointer.x;
      var dy = event.clientY - lastPointer.y;
      lastPointer = null;
      if (Math.hypot(dx, dy) > 8) return;
      if (event.target.closest(".cockroach")) return;
      if (document.body.classList.contains("is-finale")) return;
      var rect = ground.getBoundingClientRect();
      api.plant(opts.selectedStyle(), {
        x: (event.clientX - rect.left) / rect.width,
        y: (event.clientY - rect.top) / rect.height
      });
    });

    cockroach.addEventListener("click", onCockroach);
  }

  function plant(styleId, point) {
    var now = Date.now();
    if (now - lastPlantAt < 120) return null;
    lastPlantAt = now;
    if (!Styles.get(styleId)) return null;
    var spot = findFreeSpot(point);
    var scale = 0.78 + spot.y * 0.32;
    var result = State.addFlower(state, {
      style: styleId,
      x: spot.x,
      y: spot.y,
      scale: scale
    });
    if (!result.added) return null;
    if (result.removed) removeFlowerEl(result.removed.id, true);
    addFlowerEl(result.flower, true);
    if (Snoopy) Snoopy.react("plant");
    if (opts.onPlant) opts.onPlant(result, state);
    return result.flower;
  }

  function addFlowerEl(flower, isNew) {
    var template = document.createElement("template");
    template.innerHTML = Styles.render(flower);
    var node = template.content.firstElementChild;
    if (!node) return;
    if (isNew) node.classList.add("is-new");
    layer.appendChild(node);
    flowersById[flower.id] = node;
    if (isNew) {
      setTimeout(function () { node.classList.remove("is-new"); }, 750);
    }
  }

  function removeFlowerEl(id, animate) {
    var node = flowersById[id];
    if (!node) return;
    delete flowersById[id];
    if (!animate) {
      node.remove();
      return;
    }
    node.classList.add("is-leaving");
    setTimeout(function () { node.remove(); }, 650);
  }

  function renderAll() {
    layer.innerHTML = "";
    flowersById = {};
    state.flowers.forEach(function (flower) {
      addFlowerEl(flower, false);
    });
  }

  function nearestDistance(point) {
    var min = 2;
    state.flowers.forEach(function (flower) {
      var dx = flower.x - point.x;
      var dy = (flower.y - point.y) * 1.15;
      var distance = Math.sqrt(dx * dx + dy * dy);
      if (distance < min) min = distance;
    });
    return min;
  }

  function randomSpot() {
    var best = { x: 0.5, y: 0.5 };
    var bestDistance = -1;
    for (var i = 0; i < 30; i += 1) {
      var point = { x: 0.08 + Math.random() * 0.84, y: 0.1 + Math.random() * 0.82 };
      var distance = nearestDistance(point);
      if (distance > bestDistance) {
        bestDistance = distance;
        best = point;
      }
    }
    return best;
  }

  function isFree(point) {
    return nearestDistance(point) >= 0.045;
  }

  function findFreeSpot(preferred) {
    var base = preferred && Number.isFinite(preferred.x) && Number.isFinite(preferred.y)
      ? { x: State.clamp(preferred.x, 0.06, 0.94), y: State.clamp(preferred.y, 0.08, 0.94) }
      : randomSpot();
    if (isFree(base)) return base;
    for (var ring = 1; ring <= 12; ring += 1) {
      for (var i = 0; i < 8; i += 1) {
        var angle = (i / 8) * Math.PI * 2 + ring * 0.4;
        var radius = 0.045 * ring;
        var candidate = {
          x: State.clamp(base.x + Math.cos(angle) * radius, 0.06, 0.94),
          y: State.clamp(base.y + Math.sin(angle) * radius, 0.08, 0.94)
        };
        if (isFree(candidate)) return candidate;
      }
    }
    return base;
  }

  function scheduleCockroach(delay) {
    clearTimeout(cockroachTimer);
    cockroachTimer = setTimeout(function () {
      if (document.body.classList.contains("is-finale")) {
        scheduleCockroach(3200);
        return;
      }
      moveCockroach();
      scheduleCockroach(8000 + Math.random() * 6000);
    }, delay);
  }

  function moveCockroach() {
    if (!cockroach) return;
    var point = { x: 0.1 + Math.random() * 0.8, y: 0.2 + Math.random() * 0.7 };
    cockroach.style.left = (point.x * 100).toFixed(1) + "%";
    cockroach.style.top = (point.y * 100).toFixed(1) + "%";
    cockroach.classList.remove("is-hidden");
    cockroach.tabIndex = 0;
    cockroach.removeAttribute("aria-hidden");
  }

  function hideCockroach() {
    cockroach.classList.add("is-hidden");
    cockroach.tabIndex = -1;
    cockroach.setAttribute("aria-hidden", "true");
  }

  function onCockroach(event) {
    event.stopPropagation();
    if (cockroach.classList.contains("is-hidden")) return;
    state.cockroachFound = Math.max(0, Number(state.cockroachFound) || 0) + 1;
    var line = COCKROACH_LINES[(state.cockroachFound - 1) % COCKROACH_LINES.length];
    if (opts.onCockroach) opts.onCockroach(line, state);
    hideCockroach();
    clearTimeout(cockroachHideTimer);
    cockroachHideTimer = setTimeout(function () {
      scheduleCockroach(1200);
    }, 20000);
  }

  api.init = init;
  api.plant = plant;
  api.renderAll = renderAll;
  api.findFreeSpot = findFreeSpot;
  api.counts = function () { return State.countByStyle(state); };
  root.JardinGarden = api;
})(window);


;

(function () {
  "use strict";

  var State = window.JardinState;
  var Styles = window.FlowerStyles;
  var Snoopy = window.JardinSnoopy;
  var Garden = window.JardinGarden;

  var app = document.getElementById("app");
  var seedsEl = document.getElementById("seeds");
  var counterEl = document.getElementById("counter");
  var plantBtn = document.getElementById("plantBtn");
  var snoopyEl = document.getElementById("snoopy");
  var finale = document.getElementById("finale");
  var readFinale = document.getElementById("readFinale");
  var goal = State.STYLES.length * State.PER_STYLE;
  var finaleReturnFocus = null;
  var toastEl = document.getElementById("toast");
  var srEl = document.getElementById("sr");
  var starsEl = document.getElementById("stars");
  var skyToggle = document.getElementById("skyToggle");
  var firefly = document.getElementById("firefly");
  var gardenEl = document.getElementById("garden");
  var storage = safeStorage();
  var state = State.load(storage);
  var selected = "lily";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var saveTimer = null;
  var toastTimer = null;
  var srTimer = null;
  var finaleTimer = null;
  var book = document.getElementById("book");
  var jacket = document.getElementById("jacket");
  var seedPage = document.getElementById("seedPage");
  var turnTimer;

  var progressEl = document.getElementById("progress");
  var gardenInstructions = document.getElementById("gardenInstructions");
  var skyLabel = document.getElementById("skyLabel");

  function safeStorage() {
    try {
      var test = "__jardin_test__";
      window.localStorage.setItem(test, "1");
      window.localStorage.removeItem(test);
      return window.localStorage;
    } catch (error) {
      return null;
    }
  }

  function buildSeeds() {
    Styles.list().forEach(function (style) {
      var button = document.createElement("button");
      button.type = "button";
      button.className = "seed";
      button.dataset.style = style.id;
      button.setAttribute("aria-pressed", String(style.id === selected));
      button.innerHTML = '<span class="seed__icon" aria-hidden="true">' + style.icon + '</span>' +
        '<span class="seed__name">' + style.name + '</span>' +
        '<span class="seed__dots" aria-hidden="true"><i></i><i></i><i></i></span>';
      button.addEventListener("click", function () { selectStyle(style.id); });
      seedsEl.appendChild(button);
    });
  }

  function selectStyle(id) {
    selected = id;
    Array.prototype.forEach.call(seedsEl.querySelectorAll(".seed"), function (seed) {
      seed.setAttribute("aria-pressed", String(seed.dataset.style === selected));
    });
    announce(Styles.get(selected).name + " selected.");
  }

  function updateSeeds(counts) {
    Array.prototype.forEach.call(seedsEl.querySelectorAll(".seed"), function (seed) {
      var count = counts[seed.dataset.style] || 0;
      seed.setAttribute("aria-label", seed.querySelector(".seed__name").textContent +
        ", " + Math.min(count, State.PER_STYLE) + " of " + State.PER_STYLE + " grown");
      Array.prototype.forEach.call(seed.querySelectorAll(".seed__dots i"), function (dot, index) {
        dot.classList.toggle("on", index < count);
      });
    });
  }

  function update() {
    var counts = State.countByStyle(state);
    var total = State.STYLES.reduce(function (progress, style) {
      return progress + Math.min(counts[style], State.PER_STYLE);
    }, 0);
    counterEl.textContent = total + " / " + goal;
    progressEl.max = goal;
    progressEl.value = total;
    readFinale.hidden = !state.completed;
    if (state.completed) gardenInstructions.textContent = "Your dedication is ready. Keep planting to fill the meadow.";
    updateSeeds(counts);
  }

  function announce(message) {
    clearTimeout(srTimer);
    srEl.textContent = "";
    srTimer = setTimeout(function () { srEl.textContent = message; }, 30);
  }

  function scheduleSave() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(saveNow, 250);
  }

  function saveNow() {
    State.save(storage, state);
  }

  function toast(message, duration) {
    toastEl.textContent = message;
    toastEl.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove("is-visible");
    }, duration || 3200);
  }

  function buildStars() {
    if (starsEl.childElementCount) return;
    var html = "";
    for (var i = 0; i < 28; i += 1) {
      html += '<i class="star" style="left:' + (Math.random() * 100).toFixed(1) + '%;top:' +
        (Math.random() * 52).toFixed(1) + '%;--tw:' + (2.2 + Math.random() * 3.5).toFixed(1) +
        's;--twd:' + (Math.random() * 4).toFixed(1) + 's"></i>';
    }
    starsEl.innerHTML = html;
  }

  function syncSky() {
    if (!skyToggle) return;
    var night = app.classList.contains("is-night");
    var label = night ? "Switch to day" : "Switch to night";
    skyToggle.setAttribute("aria-label", label);
    skyToggle.setAttribute("title", label);
    skyLabel.textContent = night ? "Day" : "Night";
    if (firefly) {
      if (!night && document.activeElement === firefly) skyToggle.focus();
      firefly.hidden = !night;
    }
  }

  function toggleSky() {
    var night = !app.classList.contains("is-night");
    app.classList.toggle("is-night", night);
    if (night) buildStars();
    syncSky();
    announce(night ? "Night sky." : "Daylight.");
  }

  function toggleFireflies() {
    var lit = firefly.getAttribute("aria-pressed") !== "true";
    firefly.setAttribute("aria-pressed", String(lit));
    announce(lit ? "The fireflies light up." : "The fireflies go dark.");
  }

  function finishTurn() {
    if (book.dataset.state !== "opening") return;
    clearTimeout(turnTimer);
    book.dataset.state = "open";
    jacket.hidden = true;
    seedPage.inert = false;
    gardenEl.inert = false;
    seedPage.removeAttribute("aria-hidden");
    gardenEl.removeAttribute("aria-hidden");
    document.getElementById("garden-title").focus({ preventScroll: true });
  }

  function openBook(instant) {
    if (book.dataset.state !== "closed") return;
    book.dataset.state = "opening";
    if (instant || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finishTurn();
    } else {
      turnTimer = setTimeout(finishTurn, 850);
    }
  }

  function enterNight(animate) {
    app.classList.add("is-night");
    Snoopy.setComplete(true);
    buildStars();
    syncSky();
    if (animate) {
      Snoopy.celebrate();
      clearTimeout(finaleTimer);
      finaleTimer = setTimeout(showFinale, reduced ? 0 : 1700);
    }
  }

  function showFinale() {
    if (finale.open) return;
    finaleReturnFocus = document.activeElement;
    finale.showModal();
    document.body.classList.add("is-finale");
  }

  function hideFinale() {
    if (!finale.open) return;
    finale.close();
    document.body.classList.remove("is-finale");
    var target = finaleReturnFocus && finaleReturnFocus !== document.body ? finaleReturnFocus : plantBtn;
    target.focus();
  }

  function onPlant(result) {
    update();
    scheduleSave();
    var name = Styles.get(result.flower.style).name;
    var count = State.countByStyle(state)[result.flower.style];
    announce(name + " planted. " + name + ": " + Math.min(count, State.PER_STYLE) + " of " + State.PER_STYLE + ".");
    if (state.completed && !result.completedBefore) enterNight(true);
  }

  function onCockroach(line) {
    toast(line, 3600);
    scheduleSave();
  }

  function boot() {
    Snoopy.mount(snoopyEl);
    Garden.init({
      state: state,
      selectedStyle: function () { return selected; },
      onPlant: onPlant,
      onCockroach: onCockroach
    });
    buildSeeds();
    update();

    if (state.completed) enterNight(false);

    var now = Date.now();
    var away = state.lastVisit > 0 && now - state.lastVisit > 12 * 60 * 60 * 1000;
    state.lastVisit = now;
    scheduleSave();
    if (away) {
      setTimeout(function () { toast("your garden missed you", 4200); }, 900);
    }

    plantBtn.addEventListener("click", function () {
      Garden.plant(selected);
    });

    if (skyToggle) skyToggle.addEventListener("click", toggleSky);
    if (firefly) firefly.addEventListener("click", toggleFireflies);
    syncSky();

    finale.querySelector(".finale__close").addEventListener("click", hideFinale);

    snoopyEl.addEventListener("click", function (event) {
      if (!event.target.closest(".snoopy__hit")) return;
      if (state.completed) {
        Snoopy.celebrate();
        clearTimeout(finaleTimer);
        finaleTimer = setTimeout(showFinale, reduced ? 0 : 1400);
      } else {
        Snoopy.react("hello");
      }
    });

    readFinale.addEventListener("click", showFinale);
    finale.addEventListener("cancel", function (event) {
      event.preventDefault();
      hideFinale();
    });
    jacket.addEventListener("click", function () { openBook(false); });
    document.querySelector(".garden-link").addEventListener("click", function (event) {
      event.preventDefault();
      if (book.dataset.state === "open") document.getElementById("garden-title").focus();
      else openBook(false);
    });
    book.addEventListener("transitionend", function (event) {
      if (event.propertyName === "transform" &&
          (event.target.id === "bookLeaf" || event.target === jacket)) finishTurn();
    });
    function openLinkedGarden() {
      if (location.hash === "#garden-title" || location.hash === "#garden") openBook(true);
    }
    window.addEventListener("hashchange", openLinkedGarden);
    openLinkedGarden();
    window.addEventListener("pagehide", saveNow);
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "hidden") saveNow();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();

