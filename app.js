const STORAGE_KEY = "shicang.items.v1";
const CATEGORY_STORAGE_KEY = "shicang.customCategories.v1";
const HIDDEN_CATEGORY_STORAGE_KEY = "shicang.hiddenBaseCategories.v1";

const baseCategories = [
  { name: "全部收藏", color: "#202426" },
  { name: "摄影待拍", color: "#2563a6" },
  { name: "学习任务", color: "#0f766e" },
  { name: "美食打卡", color: "#667970" },
  { name: "攻略分享", color: "#a86812" },
  { name: "内容灵感", color: "#7c5c34" },
  { name: "生活清单", color: "#397449" },
  { name: "待整理", color: "#687174" },
];

let customCategories = loadCustomCategories();
let hiddenBaseCategories = loadHiddenBaseCategories();

const categoryRules = [
  {
    name: "摄影待拍",
    words: ["拍照", "摄影", "构图", "pose", "机位", "滤镜", "光影", "相机", "照片", "取景", "穿搭拍"],
  },
  {
    name: "学习任务",
    words: ["学习", "教程", "课程", "练习", "任务", "技能", "方法论", "怎么学", "笔记", "训练"],
  },
  {
    name: "美食打卡",
    words: [
      "美食",
      "餐厅",
      "咖啡",
      "咖啡店",
      "甜品",
      "探店",
      "打卡",
      "菜单",
      "菜品",
      "brunch",
      "吃",
      "饭店",
      "酒吧",
      "面包店",
      "小吃",
      "排队",
      "预订",
    ],
  },
  {
    name: "攻略分享",
    words: ["攻略", "路线", "避坑", "清单", "旅行", "酒店", "餐厅", "指南", "流程", "模板"],
  },
  {
    name: "内容灵感",
    words: [
      "抖音",
      "微博",
      "视频",
      "剪辑",
      "脚本",
      "选题",
      "灵感",
      "素材",
      "镜头",
      "开头",
      "标题",
      "句子",
      "观点",
      "文案",
      "表达",
      "摘抄",
      "金句",
      "评论",
    ],
  },
  {
    name: "生活清单",
    words: ["好物", "家居", "收纳", "食谱", "护肤", "穿搭", "店铺", "买", "清洁", "日常"],
  },
];

const platformRules = [
  { name: "微博", words: ["weibo.com", "m.weibo.cn"] },
  { name: "抖音", words: ["douyin.com", "iesdouyin.com"] },
  { name: "小红书", words: ["xiaohongshu.com", "xhslink.com"] },
  { name: "B站", words: ["bilibili.com", "b23.tv"] },
  { name: "YouTube", words: ["youtube.com", "youtu.be"] },
  { name: "网页", words: ["http://", "https://"] },
];

const seedItems = [
  {
    id: crypto.randomUUID(),
    raw: "微博：把复杂的事说清楚，是一种温柔，也是一种能力。",
    url: "",
    platform: "文字",
    title: "把复杂的事说清楚",
    category: "内容灵感",
    status: "已看",
    tags: ["表达", "写作", "观点"],
    userNote: "",
    analysisStatus: "已整理",
    analysisSource: "粘贴文字",
    sourceExcerpt: "把复杂的事说清楚，是一种温柔，也是一种能力。",
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: crypto.randomUUID(),
    raw: "https://www.xiaohongshu.com/explore/example 周末上海街区拍照机位，光影和构图可以学",
    url: "https://www.xiaohongshu.com/explore/example",
    platform: "小红书",
    title: "周末上海街区拍照机位",
    category: "摄影待拍",
    status: "未看",
    tags: ["小红书", "拍照", "构图"],
    userNote: "",
    analysisStatus: "正文不足",
    analysisSource: "补充文字",
    sourceExcerpt: "周末上海街区拍照机位，光影和构图可以学",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: crypto.randomUUID(),
    raw: "https://www.douyin.com/video/example 剪辑开头节奏案例，之后做短视频可以拆",
    url: "https://www.douyin.com/video/example",
    platform: "抖音",
    title: "剪辑开头节奏案例",
    category: "内容灵感",
    status: "浏览中",
    tags: ["抖音", "剪辑", "短视频"],
    userNote: "",
    analysisStatus: "正文不足",
    analysisSource: "补充文字",
    sourceExcerpt: "剪辑开头节奏案例，之后做短视频可以拆",
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
];

let items = loadItems();
let activeCategory = "全部收藏";
let activeView = "home";
let collectionMode = "list";
let browseIndex = 0;
let browseTouchStartX = null;
let browseAnimationDirection = "";
let browseIsAnimating = false;
let categoryEditMode = false;

const els = {
  mobileNavToggle: document.querySelector("#mobileNavToggle"),
  drawerScrim: document.querySelector("#drawerScrim"),
  homeViewButton: document.querySelector("#homeViewButton"),
  homeView: document.querySelector("#homeView"),
  collectionsView: document.querySelector("#collectionsView"),
  searchPanel: document.querySelector("#searchPanel"),
  categoryNav: document.querySelector("#categoryNav"),
  categoryManageDone: document.querySelector("#categoryManageDone"),
  categoryAddForm: document.querySelector("#categoryAddForm"),
  categoryNameInput: document.querySelector("#categoryNameInput"),
  categoryInput: document.querySelector("#categoryInput"),
  statusInput: document.querySelector("#statusInput"),
  sourceInput: document.querySelector("#sourceInput"),
  captureForm: document.querySelector("#captureForm"),
  pasteButton: document.querySelector("#pasteButton"),
  submitButton: document.querySelector("#submitButton"),
  searchInput: document.querySelector("#searchInput"),
  categoryFilter: document.querySelector("#categoryFilter"),
  statusFilter: document.querySelector("#statusFilter"),
  searchResults: document.querySelector("#searchResults"),
  boardTitle: document.querySelector("#boardTitle"),
  boardCount: document.querySelector("#boardCount"),
  listModeButton: document.querySelector("#listModeButton"),
  browseModeButton: document.querySelector("#browseModeButton"),
  browseView: document.querySelector("#browseView"),
  browseCard: document.querySelector("#browseCard"),
  browseCounter: document.querySelector("#browseCounter"),
  browsePrevButton: document.querySelector("#browsePrevButton"),
  browseNextButton: document.querySelector("#browseNextButton"),
  itemList: document.querySelector("#itemList"),
  analysisMode: document.querySelector("#analysisMode"),
};

init();

function init() {
  render();
  bindEvents();
}

function bindEvents() {
  lockPageZoom();

  els.mobileNavToggle.addEventListener("click", () => toggleMobileDrawer());
  els.drawerScrim.addEventListener("click", closeMobileDrawer);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMobileDrawer();
      return;
    }
    if (collectionMode !== "browse" || activeView !== "collections" || isEditingTarget(event.target)) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      stepBrowse(-1);
    }
    if (event.key === "ArrowRight") {
      event.preventDefault();
      stepBrowse(1);
    }
  });

  els.homeViewButton.addEventListener("click", () => {
    setActiveView("home");
    closeMobileDrawer();
  });

  els.captureForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    await withBusy("正在打开链接并整理...", async () => {
      const item = await buildItemFromForm({ remote: true });
      if (!item) return;
      addItem(item);
      els.captureForm.reset();
    });
  });

  els.pasteButton.addEventListener("click", async () => {
    try {
      const text = await navigator.clipboard.readText();
      els.sourceInput.value = text.trim();
      els.sourceInput.focus();
    } catch {
      els.sourceInput.focus();
    }
  });

  els.categoryAddForm.addEventListener("submit", (event) => {
    event.preventDefault();
    addCustomCategory(els.categoryNameInput.value);
  });
  els.categoryManageDone.addEventListener("click", () => {
    categoryEditMode = false;
    renderCategories();
  });

  els.listModeButton.addEventListener("click", () => setCollectionMode("list"));
  els.browseModeButton.addEventListener("click", () => setCollectionMode("browse"));
  els.browsePrevButton.addEventListener("click", () => stepBrowse(-1));
  els.browseNextButton.addEventListener("click", () => stepBrowse(1));
  els.browseView.addEventListener("touchstart", (event) => {
    if (event.touches.length !== 1) return;
    browseTouchStartX = event.touches[0].clientX;
  }, { passive: true });
  els.browseView.addEventListener("touchend", (event) => {
    if (browseTouchStartX === null || !event.changedTouches.length) return;
    const deltaX = event.changedTouches[0].clientX - browseTouchStartX;
    browseTouchStartX = null;
    if (Math.abs(deltaX) < 48) return;
    stepBrowse(deltaX < 0 ? 1 : -1);
  }, { passive: true });

  [els.searchInput, els.categoryFilter, els.statusFilter].forEach((node) => {
    node.addEventListener("input", renderSearchResults);
    node.addEventListener("change", renderSearchResults);
  });
}

function lockPageZoom() {
  ["gesturestart", "gesturechange", "gestureend"].forEach((eventName) => {
    document.addEventListener(eventName, (event) => event.preventDefault(), { passive: false });
  });

  document.addEventListener("touchmove", (event) => {
    if (event.touches.length > 1) {
      event.preventDefault();
    }
  }, { passive: false });
}

function renderCategoryOptions() {
  const selectedCaptureCategory = els.categoryInput.value;
  const selectedFilterCategory = els.categoryFilter.value;
  const categories = getCategories();

  els.categoryInput.innerHTML = `<option value="">自动</option>`;
  els.categoryFilter.innerHTML = "";

  categories
    .filter((category) => category.name !== "全部收藏")
    .forEach((category) => {
      const captureOption = document.createElement("option");
      captureOption.value = category.name;
      captureOption.textContent = category.name;
      els.categoryInput.append(captureOption);
    });

  categories.forEach((category) => {
    const filterOption = document.createElement("option");
    filterOption.value = category.name;
    filterOption.textContent = category.name;
    els.categoryFilter.append(filterOption);
  });

  if ([...els.categoryInput.options].some((option) => option.value === selectedCaptureCategory)) {
    els.categoryInput.value = selectedCaptureCategory;
  }
  if ([...els.categoryFilter.options].some((option) => option.value === selectedFilterCategory)) {
    els.categoryFilter.value = selectedFilterCategory;
  }
}

function render() {
  renderCategoryOptions();
  renderView();
  renderCategories();
  renderSearchResults();
  renderItems();
}

function renderView() {
  els.homeView.classList.toggle("active", activeView === "home");
  els.collectionsView.classList.toggle("active", activeView === "collections");
  els.homeViewButton.classList.toggle("active", activeView === "home");
  els.searchPanel.hidden = activeView !== "collections" || activeCategory !== "全部收藏";
}

function renderCategories() {
  els.categoryNav.innerHTML = "";
  els.categoryManageDone.hidden = !categoryEditMode;
  const categories = getCategories();
  const counts = categories.reduce((acc, category) => {
    acc[category.name] =
      category.name === "全部收藏"
        ? items.length
        : items.filter((item) => item.category === category.name).length;
    return acc;
  }, {});

  categories.forEach((category) => {
    const canRemove = canRemoveCategory(category.name);
    const wrapper = document.createElement("div");
    wrapper.className = [
      "category-item",
      canRemove ? "removable" : "",
      categoryEditMode ? "is-editing" : "",
    ].filter(Boolean).join(" ");

    const button = document.createElement("button");
    button.className = `category-button${activeView === "collections" && activeCategory === category.name ? " active" : ""}`;
    button.type = "button";
    button.innerHTML = `
      ${iconMarkup(categoryIcon(category.name), "category-icon")}
      <span class="category-label">${category.name}</span>
      <span class="category-count">${counts[category.name] ?? 0}</span>
    `;
    button.addEventListener("click", () => {
      if (categoryEditMode) return;
      activeCategory = category.name;
      browseIndex = 0;
      setActiveView("collections");
      closeMobileDrawer();
    });
    wrapper.append(button);

    if (canRemove) {
      wrapper.title = categoryEditMode ? "点击删除按钮删除分类" : "右键删除，长按进入编辑模式";
      bindCategoryDeleteGestures(wrapper, category.name);
      if (categoryEditMode) {
        const deleteButton = document.createElement("button");
        deleteButton.className = "category-delete-button";
        deleteButton.type = "button";
        deleteButton.setAttribute("aria-label", `删除分类 ${category.name}`);
        deleteButton.innerHTML = iconMarkup("trash");
        deleteButton.addEventListener("click", (event) => {
          event.stopPropagation();
          removeCategory(category.name);
        });
        wrapper.append(deleteButton);
      }
    }

    els.categoryNav.append(wrapper);
  });
}

function renderSearchResults() {
  const filtered = getSearchFilteredItems();
  if (!isSearchActive()) {
    els.searchResults.innerHTML = `<div class="search-hint">输入关键词，或选择板块、状态开始检索</div>`;
    return;
  }

  if (!filtered.length) {
    els.searchResults.innerHTML = `<div class="search-empty">没有匹配的收藏</div>`;
    return;
  }

  els.searchResults.innerHTML = filtered
    .slice(0, 8)
    .map(
      (item) => `
        <article class="result-card">
          <div class="item-meta">
            <span class="pill" data-tone="${toneForCategory(item.category)}">${escapeHtml(item.category)}</span>
            <span>${escapeHtml(item.platform)}</span>
            <span>${escapeHtml(item.analysisSource || "本地整理")}</span>
          </div>
          <h3>${escapeHtml(item.title)}</h3>
          <div class="tag-list">
            ${item.tags.map((tag) => `<button class="tag" type="button">${escapeHtml(tag)}</button>`).join("")}
          </div>
        </article>
      `,
    )
    .join("");

  els.searchResults.querySelectorAll(".tag").forEach((tag) => {
    tag.addEventListener("click", () => {
      els.searchInput.value = tag.textContent;
      renderSearchResults();
    });
  });
}

function renderItems() {
  const filtered = getCollectionItems();
  els.boardTitle.textContent = activeCategory;
  els.boardCount.textContent = `${filtered.length} 条`;
  renderCollectionModeControls(filtered.length);

  if (!filtered.length) {
    els.browseView.hidden = true;
    els.itemList.hidden = false;
    els.browseCard.innerHTML = "";
    els.browseCounter.textContent = "";
    els.itemList.innerHTML = `<div class="empty-state">没有匹配的收藏</div>`;
    return;
  }

  browseIndex = Math.min(Math.max(browseIndex, 0), filtered.length - 1);

  if (collectionMode === "browse") {
    renderBrowseItem(filtered);
    return;
  }

  els.itemList.hidden = false;
  els.browseView.hidden = true;
  els.browseCard.innerHTML = "";
  els.browseCounter.textContent = "";
  els.itemList.innerHTML = "";
  filtered.forEach((item) => {
    const card = document.createElement("article");
    card.className = "item-card";
    card.innerHTML = itemCardTemplate(item);
    bindItemCard(card, item);
    els.itemList.append(card);
  });
}

function renderBrowseItem(filtered) {
  const item = filtered[browseIndex];
  els.itemList.hidden = true;
  els.browseView.hidden = false;
  els.browseCounter.textContent = `${browseIndex + 1} / ${filtered.length}`;
  els.browseCard.innerHTML = "";

  const card = document.createElement("article");
  card.className = [
    "item-card",
    "browse-item-card",
    browseAnimationDirection ? `page-enter-${browseAnimationDirection}` : "",
  ].filter(Boolean).join(" ");
  card.innerHTML = itemCardTemplate(item);
  card.addEventListener("animationend", () => {
    card.classList.remove("page-enter-next", "page-enter-prev");
  }, { once: true });
  bindItemCard(card, item);
  els.browseCard.append(card);
}

function renderCollectionModeControls(count) {
  els.listModeButton.classList.toggle("active", collectionMode === "list");
  els.browseModeButton.classList.toggle("active", collectionMode === "browse");
  els.listModeButton.setAttribute("aria-pressed", String(collectionMode === "list"));
  els.browseModeButton.setAttribute("aria-pressed", String(collectionMode === "browse"));
  els.browsePrevButton.disabled = count < 2;
  els.browseNextButton.disabled = count < 2;
}

function bindItemCard(card, item) {
  card.querySelector(".status-select").addEventListener("change", (event) => {
    updateItem(item.id, { status: event.target.value });
  });

  card.querySelector(".analysis-title-input").addEventListener("change", (event) => {
    const title = normalizeText(event.target.value);
    updateItem(item.id, { title: title || item.title, analysisStatus: "已手动修改" });
  });

  card.querySelector(".analysis-platform-input").addEventListener("change", (event) => {
    const platform = normalizeText(event.target.value);
    updateItem(item.id, { platform: platform || item.platform, analysisStatus: "已手动修改" });
  });

  card.querySelector(".analysis-category-select").addEventListener("change", (event) => {
    updateItem(item.id, { category: event.target.value, analysisStatus: "已手动修改" });
  });

  card.querySelector(".tag-add-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const input = event.currentTarget.querySelector(".tag-input");
    const tag = input.value.trim();
    if (!tag) return;
    addItemTag(item.id, tag);
  });

  const tagEditor = card.querySelector(".tag-editor");
  const tagInput = tagEditor.querySelector(".tag-input");
  tagEditor.querySelector(".tag-add-toggle").addEventListener("click", () => {
    tagEditor.classList.add("is-adding");
    tagInput.focus();
  });
  tagEditor.querySelector(".tag-cancel-button").addEventListener("click", () => {
    tagInput.value = "";
    tagEditor.classList.remove("is-adding");
  });
  tagInput.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      event.preventDefault();
      tagInput.value = "";
      tagEditor.classList.remove("is-adding");
    }
  });

  card.querySelectorAll(".tag-chip").forEach((chip) => {
    bindTagDeleteGestures(chip, item.id);
  });

  const reanalyzeButton = card.querySelector(".reanalyze-button");
  if (reanalyzeButton) {
    reanalyzeButton.addEventListener("click", () => reanalyzeItem(item.id));
  }

  card.querySelector(".delete-button").addEventListener("click", () => {
    items = items.filter((candidate) => candidate.id !== item.id);
    saveItems();
    render();
  });

  card.querySelectorAll(".tag-search").forEach((tag) => {
    tag.addEventListener("click", () => {
      els.searchInput.value = tag.dataset.tag || tag.textContent;
      els.categoryFilter.value = "全部收藏";
      activeCategory = "全部收藏";
      browseIndex = 0;
      setActiveView("collections");
      renderSearchResults();
    });
  });
}

function itemCardTemplate(item) {
  const urlAction = item.url
    ? `<a href="${escapeAttr(item.url)}" target="_blank" rel="noreferrer">
         ${iconMarkup("external")}
         <span>打开链接</span>
       </a>
       <button class="reanalyze-button" type="button">
         ${iconMarkup("refresh")}
         <span>重新解析</span>
       </button>`
    : "";
  const created = new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(item.createdAt));

  return `
    <div class="item-top">
      <div>
        <h3>${escapeHtml(item.title)}</h3>
        <div class="item-meta">
          <span class="pill" data-tone="${toneForCategory(item.category)}">${escapeHtml(item.category)}</span>
          <span>${escapeHtml(item.platform)}</span>
          <span>${created}</span>
          <span>${escapeHtml(item.analysisStatus || "已整理")}</span>
        </div>
      </div>
      <div class="card-actions">
        ${urlAction}
        <button class="delete-button" type="button">
          ${iconMarkup("trash")}
          <span>删除</span>
        </button>
      </div>
    </div>

    <div class="item-edit-panel">
      ${analysisEditorTemplate(item)}
      ${tagEditorTemplate(item.tags)}
    </div>
  `;
}

function analysisEditorTemplate(item) {
  const categoryOptions = getCategories()
    .filter((category) => category.name !== "全部收藏")
    .map((category) => option(category.name, item.category))
    .join("");

  return `
    <div class="analysis-editor">
      <label class="analysis-field title-field">
        标题
        <input class="analysis-title-input" type="text" autocomplete="off" value="${escapeAttr(item.title)}" />
      </label>
      <label class="analysis-field">
        板块
        <select class="analysis-category-select">
          ${categoryOptions}
        </select>
      </label>
      <label class="analysis-field">
        来源
        <input class="analysis-platform-input" type="text" autocomplete="off" value="${escapeAttr(item.platform)}" />
      </label>
      <label class="analysis-field">
        状态
        <select class="status-select">
          ${["未看", "浏览中", "已看", "已完成"].map((status) => option(status, item.status)).join("")}
        </select>
      </label>
    </div>
  `;
}

function tagEditorTemplate(tags = []) {
  const normalizedTags = normalizeTags(tags);
  const tagChips = normalizedTags.length
    ? normalizedTags
        .map(
          (tag) => `
            <span class="tag-chip" data-tag="${escapeAttr(tag)}" title="右键或长按删除标签">
              <button class="tag-search" type="button" data-tag="${escapeAttr(tag)}">${escapeHtml(tag)}</button>
              <button class="tag-remove" type="button" data-tag="${escapeAttr(tag)}" aria-label="删除标签 ${escapeAttr(tag)}">
                ${iconMarkup("x")}
              </button>
            </span>
          `,
        )
        .join("")
    : `<span class="tag-empty">还没有标签</span>`;

  return `
    <div class="tag-editor">
      <div class="editable-tags">
        ${tagChips}
        <button class="tag-add-toggle" type="button">
          ${iconMarkup("plus")}
          <span>添加标签</span>
        </button>
        <form class="tag-add-form">
          <input class="tag-input" type="text" autocomplete="off" placeholder="新增标签" />
          <button class="tag-add-button" type="submit">
            <span>确认</span>
          </button>
          <button class="tag-cancel-button" type="button">取消</button>
        </form>
      </div>
    </div>
  `;
}

function bindTagDeleteGestures(chip, itemId) {
  let longPressTimer = null;
  let longPressTriggered = false;
  const tag = chip.dataset.tag;
  const removeButton = chip.querySelector(".tag-remove");

  removeButton?.addEventListener("click", (event) => {
    event.stopPropagation();
    removeItemTag(itemId, tag);
  });

  chip.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    removeItemTag(itemId, tag);
  });

  chip.addEventListener("touchstart", () => {
    longPressTriggered = false;
    longPressTimer = window.setTimeout(() => {
      longPressTriggered = true;
      removeItemTag(itemId, tag);
    }, 620);
  }, { passive: true });

  ["touchend", "touchcancel", "touchmove"].forEach((eventName) => {
    chip.addEventListener(eventName, (event) => {
      if (longPressTimer) {
        window.clearTimeout(longPressTimer);
        longPressTimer = null;
      }
      if (longPressTriggered) {
        event.preventDefault();
      }
    }, { passive: false });
  });
}

function bindCategoryDeleteGestures(categoryItem, categoryName) {
  let longPressTimer = null;
  let longPressTriggered = false;

  categoryItem.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    removeCategory(categoryName);
  });

  categoryItem.addEventListener("touchstart", () => {
    longPressTriggered = false;
    longPressTimer = window.setTimeout(() => {
      longPressTriggered = true;
      categoryEditMode = true;
      renderCategories();
    }, 620);
  }, { passive: true });

  ["touchend", "touchcancel", "touchmove"].forEach((eventName) => {
    categoryItem.addEventListener(eventName, (event) => {
      if (longPressTimer) {
        window.clearTimeout(longPressTimer);
        longPressTimer = null;
      }
      if (longPressTriggered) {
        event.preventDefault();
      }
    }, { passive: false });
  });
}

function getCollectionItems() {
  return items
    .filter((item) => activeCategory === "全部收藏" || item.category === activeCategory)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getSearchFilteredItems() {
  const query = els.searchInput.value.trim().toLowerCase();
  const category = els.categoryFilter.value;
  const status = els.statusFilter.value;

  return items
    .filter((item) => category === "全部收藏" || item.category === category)
    .filter((item) => status === "全部" || item.status === status)
    .filter((item) => {
      if (!query) return true;
      const haystack = [
        item.title,
        item.category,
        item.platform,
        item.analysisSource,
        item.sourceExcerpt,
        item.tags.join(" "),
        item.raw,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function isSearchActive() {
  return (
    els.searchInput.value.trim() ||
    els.categoryFilter.value !== "全部收藏" ||
    els.statusFilter.value !== "全部"
  );
}

async function buildItemFromForm({ remote }) {
  const raw = els.sourceInput.value.trim();
  if (!raw) {
    els.sourceInput.focus();
    return null;
  }

  return analyzeInput(raw, {
    categoryOverride: els.categoryInput.value,
    status: els.statusInput.value,
    remote,
  });
}

async function analyzeInput(raw, options = {}) {
  const local = analyzeSource(raw);
  let analysis = local;

  if (options.remote && local.url) {
    const remote = await fetchLinkAnalysis(local.url);
    analysis = mergeRemoteAnalysis(local, remote);
  }

  const category = resolveCategoryName(options.categoryOverride || analysis.category);
  const status = options.status || "未看";
  const tags = buildTags(analysis.textForRules, analysis.platform, category);

  return {
    id: crypto.randomUUID(),
    raw,
    url: analysis.url,
    platform: analysis.platform,
    title: analysis.title,
    category,
    status,
    tags,
    userNote: "",
    analysisStatus: analysis.analysisStatus,
    analysisSource: analysis.analysisSource,
    sourceExcerpt: analysis.sourceExcerpt,
    createdAt: new Date().toISOString(),
  };
}

function analyzeSource(raw) {
  const url = extractUrl(raw);
  const platform = detectPlatform(raw, url);
  const note = raw.replace(url, "").trim().replace(/\s+/g, " ");
  const textForRules = `${platform} ${raw}`.toLowerCase();
  const category = detectCategory(textForRules, platform);
  const title = buildTitle({ note, platform, category, url });
  const sourceExcerpt = note || "";

  return {
    url,
    platform,
    note,
    title,
    category,
    description: "",
    contentText: note,
    textForRules,
    analysisStatus: note ? "已整理" : "待解析",
    analysisSource: note ? "粘贴文字" : url ? "链接" : "本地规则",
    sourceExcerpt,
    remoteMessage: "",
  };
}

async function fetchLinkAnalysis(url) {
  try {
    const response = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    if (!response.ok) {
      return { ok: false, reason: "解析服务没有返回可用结果" };
    }
    return response.json();
  } catch {
    return {
      ok: false,
      reason: "解析服务未启动，或当前链接被浏览器/平台限制读取",
    };
  }
}

function mergeRemoteAnalysis(local, remote) {
  if (!remote?.ok) {
    return {
      ...local,
      analysisStatus: local.note ? "正文不足" : "解析受限",
      analysisSource: local.note ? "补充文字" : "链接元信息",
      remoteMessage: remote?.reason || "没有读到正文",
    };
  }

  const description = normalizeText(remote.description || "");
  const contentText = normalizeText(remote.text || "");
  const combinedText = normalizeText([description, contentText].filter(Boolean).join(" "));
  const textForRules = `${local.textForRules} ${remote.title || ""} ${description} ${combinedText}`.toLowerCase();
  const category = detectCategory(textForRules, local.platform);
  const hasUsefulContent = combinedText.length >= 40;
  const hasMetaDescription = description.length >= 30;
  const title = buildTitle({
    note: local.note,
    remoteTitle: remote.title,
    platform: local.platform,
    category,
    url: remote.finalUrl || local.url,
  });

  return {
    ...local,
    url: remote.finalUrl || local.url,
    title,
    category,
    description,
    contentText: combinedText || local.note,
    textForRules,
    analysisStatus: hasUsefulContent ? "已解析" : hasMetaDescription ? "正文不足" : "解析受限",
    analysisSource: hasUsefulContent ? "网页正文" : hasMetaDescription ? "网页元信息" : local.note ? "补充文字" : "链接元信息",
    sourceExcerpt: shorten(combinedText || description || local.note || remote.title || "", 160),
    remoteMessage: hasUsefulContent ? "" : "没有读到足够正文，可能需要登录、跳转或平台限制",
  };
}

function extractUrl(raw) {
  const match = raw.match(/https?:\/\/[^\s，。；、]+/i);
  return match ? match[0] : "";
}

function detectPlatform(raw, url) {
  const text = `${url} ${raw}`.toLowerCase();
  const found = platformRules.find((rule) => rule.words.some((word) => text.includes(word)));
  if (found) return found.name;
  return url ? "网页" : "文字";
}

function detectCategory(text, platform) {
  const scored = categoryRules
    .map((rule) => ({
      name: rule.name,
      score: rule.words.reduce((sum, word) => sum + (text.includes(word.toLowerCase()) ? 1 : 0), 0),
    }))
    .sort((a, b) => b.score - a.score);

  if (scored[0]?.score) return scored[0].name;
  if (platform === "抖音" || platform === "微博" || platform === "文字") return "内容灵感";
  if (platform === "小红书") return "攻略分享";
  return "待整理";
}

function buildTags(text, platform, category) {
  const keywords = new Set([platform, category]);
  categoryRules.forEach((rule) => {
    rule.words.forEach((word) => {
      if (text.includes(word.toLowerCase())) keywords.add(word);
    });
  });

  return Array.from(keywords)
    .filter((tag) => tag && tag !== "网页" && tag !== "文字")
    .slice(0, 7);
}

function buildTitle({ note, remoteTitle, platform, category, url }) {
  const cleanRemoteTitle = normalizeText(remoteTitle || "");
  if (cleanRemoteTitle.length > 3) return shorten(cleanRemoteTitle, 34);

  if (note) {
    return shorten(note.split(/[\n。！？!?]/).find(Boolean) || note, 34);
  }

  if (url) {
    try {
      const parsed = new URL(url);
      const path = parsed.pathname.split("/").filter(Boolean).slice(-2).join(" / ");
      return `${platform} · ${path || parsed.hostname}`;
    } catch {
      return `${platform}收藏`;
    }
  }

  return `${category}收藏`;
}

function addItem(item) {
  items = [item, ...items];
  saveItems();
  activeCategory = item.category;
  browseIndex = 0;
  setActiveView("collections");
}

async function reanalyzeItem(id) {
  const existing = items.find((item) => item.id === id);
  if (!existing) return;

  updateItem(id, { analysisStatus: "解析中", analysisSource: "正在读取链接" });
  await withBusy("正在重新解析链接...", async () => {
    const fresh = await analyzeInput(existing.raw, {
      remote: true,
      status: existing.status,
    });
    updateItem(id, {
      url: fresh.url,
      platform: fresh.platform,
      title: fresh.title,
      category: fresh.category,
      tags: fresh.tags,
      analysisStatus: fresh.analysisStatus,
      analysisSource: fresh.analysisSource,
      sourceExcerpt: fresh.sourceExcerpt,
    });
    activeCategory = fresh.category;
  });
}

function updateItem(id, patch) {
  items = items.map((item) => (item.id === id ? { ...item, ...patch } : item));
  saveItems();
  render();
}

function addItemTag(id, tag) {
  const normalizedTag = normalizeTag(tag);
  if (!normalizedTag) return;
  items = items.map((item) => {
    if (item.id !== id) return item;
    return { ...item, tags: normalizeTags([...(item.tags || []), normalizedTag]) };
  });
  saveItems();
  render();
}

function removeItemTag(id, tag) {
  const normalizedTag = normalizeTag(tag);
  items = items.map((item) => {
    if (item.id !== id) return item;
    return {
      ...item,
      tags: normalizeTags(item.tags || []).filter((candidate) => candidate !== normalizedTag),
    };
  });
  saveItems();
  render();
}

function setCollectionMode(mode) {
  collectionMode = mode === "browse" ? "browse" : "list";
  browseIndex = 0;
  browseAnimationDirection = "";
  browseIsAnimating = false;
  renderItems();
}

function stepBrowse(direction) {
  const filtered = getCollectionItems();
  if (collectionMode !== "browse" || filtered.length < 2 || browseIsAnimating) return;

  const directionName = direction > 0 ? "next" : "prev";
  const currentCard = els.browseCard.querySelector(".browse-item-card");
  browseIsAnimating = true;

  if (currentCard) {
    currentCard.classList.add(`page-exit-${directionName}`);
  }

  window.setTimeout(() => {
    browseIndex = (browseIndex + direction + filtered.length) % filtered.length;
    browseAnimationDirection = directionName;
    renderItems();

    window.setTimeout(() => {
      browseAnimationDirection = "";
      browseIsAnimating = false;
    }, 360);
  }, currentCard ? 170 : 0);
}

function setActiveView(view) {
  activeView = view;
  render();
}

function toggleMobileDrawer(force) {
  const shouldOpen = typeof force === "boolean" ? force : !document.body.classList.contains("drawer-open");
  document.body.classList.toggle("drawer-open", shouldOpen);
  els.mobileNavToggle.setAttribute("aria-expanded", String(shouldOpen));
  els.mobileNavToggle.setAttribute("aria-label", shouldOpen ? "关闭菜单" : "打开菜单");
}

function closeMobileDrawer() {
  if (!document.body.classList.contains("drawer-open")) return;
  toggleMobileDrawer(false);
}

function isEditingTarget(target) {
  return ["INPUT", "TEXTAREA", "SELECT"].includes(target?.tagName) || target?.isContentEditable;
}

async function withBusy(message, task) {
  els.submitButton.disabled = true;
  const previous = els.analysisMode.textContent;
  els.analysisMode.textContent = message;
  try {
    await task();
  } finally {
    els.submitButton.disabled = false;
    els.analysisMode.textContent = previous;
  }
}

function loadItems() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return structuredClone(seedItems);
  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed.map(migrateItem).filter(Boolean) : structuredClone(seedItems);
  } catch {
    return structuredClone(seedItems);
  }
}

function migrateItem(item) {
  if (!item || typeof item !== "object") return null;
  const { summary, revisit, progress, ...rest } = item;
  const allowed = new Set(getCategories().map((category) => category.name));
  const category = rest.category === "好句观点" ? "内容灵感" : rest.category;
  return {
    ...rest,
    category: allowed.has(category) ? category : "待整理",
    tags: normalizeTags(rest.tags || []).filter((tag) => tag !== "好句观点").slice(0, 7),
    userNote: rest.userNote || "",
    analysisStatus: rest.analysisStatus || "已整理",
    analysisSource: rest.analysisSource || "历史数据",
    sourceExcerpt: rest.sourceExcerpt || "",
  };
}

function saveItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function getCategories() {
  const hiddenBaseNames = new Set(hiddenBaseCategories);
  const customCategoryItems = customCategories.map((name) => ({
    name,
    color: "#687174",
    custom: true,
  }));
  return [
    ...baseCategories.filter((category) => category.name === "全部收藏" || !hiddenBaseNames.has(category.name)),
    ...customCategoryItems,
  ];
}

function resolveCategoryName(categoryName) {
  const availableCategories = getCategories().filter((category) => category.name !== "全部收藏");
  if (availableCategories.some((category) => category.name === categoryName)) return categoryName;
  return availableCategories[0]?.name || "待整理";
}

function addCustomCategory(rawName) {
  const name = normalizeCategoryName(rawName);
  if (!name) {
    els.categoryNameInput.focus();
    return;
  }

  const hiddenBaseCategory = baseCategories.find((category) => (
    category.name.toLowerCase() === name.toLowerCase() && hiddenBaseCategories.includes(category.name)
  ));
  if (hiddenBaseCategory) {
    hiddenBaseCategories = hiddenBaseCategories.filter((category) => category !== hiddenBaseCategory.name);
    saveHiddenBaseCategories();
    els.categoryNameInput.value = "";
    activeCategory = hiddenBaseCategory.name;
    setActiveView("collections");
    return;
  }

  const existingCategory = getCategories().find((category) => category.name.toLowerCase() === name.toLowerCase());
  if (existingCategory) {
    els.categoryNameInput.value = "";
    activeCategory = existingCategory.name;
    setActiveView("collections");
    return;
  }

  customCategories = [...customCategories, name];
  saveCustomCategories();
  els.categoryNameInput.value = "";
  activeCategory = name;
  setActiveView("collections");
}

function canRemoveCategory(categoryName) {
  if (categoryName === "全部收藏") return false;
  return getCategories().some((category) => category.name === categoryName);
}

function removeCategory(categoryName) {
  const normalizedCategoryName = normalizeCategoryName(categoryName);
  if (!normalizedCategoryName) return;
  if (!canRemoveCategory(normalizedCategoryName)) return;

  const remainingCategories = getCategories().filter((category) => (
    category.name !== "全部收藏" && category.name !== normalizedCategoryName
  ));
  if (!remainingCategories.length) return;

  const isCustom = customCategories.some((name) => name === normalizedCategoryName);
  if (isCustom) {
    customCategories = customCategories.filter((name) => name !== normalizedCategoryName);
  } else {
    hiddenBaseCategories = normalizeHiddenBaseCategories([...hiddenBaseCategories, normalizedCategoryName]);
  }

  const fallbackCategory = remainingCategories[0].name;
  items = items.map((item) => (
    item.category === normalizedCategoryName ? { ...item, category: fallbackCategory } : item
  ));
  if (activeCategory === normalizedCategoryName) {
    activeCategory = "全部收藏";
    browseIndex = 0;
  }
  saveCustomCategories();
  saveHiddenBaseCategories();
  saveItems();
  render();
}

function loadCustomCategories() {
  const saved = localStorage.getItem(CATEGORY_STORAGE_KEY);
  if (!saved) return [];
  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? normalizeCustomCategories(parsed) : [];
  } catch {
    return [];
  }
}

function saveCustomCategories() {
  localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(customCategories));
}

function loadHiddenBaseCategories() {
  const saved = localStorage.getItem(HIDDEN_CATEGORY_STORAGE_KEY);
  if (!saved) return [];
  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? normalizeHiddenBaseCategories(parsed) : [];
  } catch {
    return [];
  }
}

function saveHiddenBaseCategories() {
  localStorage.setItem(HIDDEN_CATEGORY_STORAGE_KEY, JSON.stringify(hiddenBaseCategories));
}

function normalizeCustomCategories(values) {
  const baseNames = new Set(baseCategories.map((category) => category.name.toLowerCase()));
  const seen = new Set();
  return values
    .map(normalizeCategoryName)
    .filter(Boolean)
    .filter((name) => {
      const key = name.toLowerCase();
      if (baseNames.has(key) || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function normalizeHiddenBaseCategories(values) {
  const removableBaseNames = new Set(
    baseCategories
      .filter((category) => category.name !== "全部收藏")
      .map((category) => category.name),
  );
  return [...new Set(values.map(normalizeCategoryName).filter((name) => removableBaseNames.has(name)))];
}

function toneForCategory(category) {
  const tones = {
    摄影待拍: "blue",
    学习任务: "green",
    美食打卡: "green",
    攻略分享: "amber",
    内容灵感: "coral",
    生活清单: "green",
  };
  return tones[category] || "";
}

function categoryIcon(category) {
  const icons = {
    全部收藏: "archive",
    摄影待拍: "camera",
    学习任务: "book",
    美食打卡: "utensils",
    攻略分享: "map",
    内容灵感: "spark",
    生活清单: "checklist",
    待整理: "inbox",
  };
  return icons[category] || "folder";
}

function iconMarkup(name, className = "ui-icon") {
  const paths = {
    archive: '<path d="M5 7h14" /><path d="M5 7l1.2 13h11.6L19 7" /><path d="M8 7V5h8v2" /><path d="M9.5 12h5" />',
    camera: '<path d="M4 8h4l1.6-2h4.8L16 8h4v11H4z" /><circle cx="12" cy="13.5" r="3.2" />',
    book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z" /><path d="M4 5.5v16" /><path d="M8 7h8" />',
    utensils: '<path d="M7 3v7" /><path d="M4.5 3v7" /><path d="M9.5 3v7" /><path d="M4.5 10h5" /><path d="M7 10v11" /><path d="M15 3v18" /><path d="M15 3c3 1.6 4.5 4.2 4.5 7.5 0 2.6-1.5 4.5-4.5 4.5" />',
    map: '<path d="M8 5 3 7v13l5-2 8 2 5-2V5l-5 2z" /><path d="M8 5v13" /><path d="M16 7v13" />',
    spark: '<path d="M12 3v4" /><path d="M12 17v4" /><path d="M3 12h4" /><path d="M17 12h4" /><path d="m6.5 6.5 2.8 2.8" /><path d="m14.7 14.7 2.8 2.8" /><path d="m17.5 6.5-2.8 2.8" /><path d="m9.3 14.7-2.8 2.8" />',
    checklist: '<path d="m4 7 2 2 3-4" /><path d="M11 7h9" /><path d="m4 15 2 2 3-4" /><path d="M11 15h9" />',
    inbox: '<path d="M4 4h16v16H4z" /><path d="M4 14h4l2 3h4l2-3h4" />',
    folder: '<path d="M3 6h6l2 2h10v10.5A2.5 2.5 0 0 1 18.5 21h-13A2.5 2.5 0 0 1 3 18.5z" /><path d="M3 9h18" />',
    external: '<path d="M14 4h6v6" /><path d="m10 14 10-10" /><path d="M20 14v5H5V4h5" />',
    refresh: '<path d="M20 6v5h-5" /><path d="M4 18v-5h5" /><path d="M18 11a6.5 6.5 0 0 0-11-4.5L4 9" /><path d="M6 13a6.5 6.5 0 0 0 11 4.5l3-2.5" />',
    trash: '<path d="M4 7h16" /><path d="M10 11v6" /><path d="M14 11v6" /><path d="M6 7l1 14h10l1-14" /><path d="M9 7V4h6v3" />',
    plus: '<path d="M12 5v14" /><path d="M5 12h14" />',
    x: '<path d="M18 6 6 18" /><path d="m6 6 12 12" />',
  };
  return `<span class="${className}" aria-hidden="true"><svg viewBox="0 0 24 24">${paths[name] || paths.inbox}</svg></span>`;
}

function normalizeTags(tags) {
  const seen = new Set();
  return tags
    .map(normalizeTag)
    .filter(Boolean)
    .filter((tag) => {
      const key = tag.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function normalizeTag(tag) {
  return normalizeText(tag)
    .replace(/^#+/, "")
    .replace(/[，,、]+/g, "")
    .slice(0, 16);
}

function normalizeCategoryName(value) {
  return normalizeText(value)
    .replace(/[，,、/\\]+/g, "")
    .slice(0, 12);
}

function normalizeText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .replace(/[\u200b-\u200f\ufeff]/g, "")
    .trim();
}

function shorten(value, length) {
  const text = normalizeText(value);
  return text.length > length ? `${text.slice(0, length)}...` : text;
}

function option(value, selected) {
  return `<option value="${escapeAttr(value)}"${value === selected ? " selected" : ""}>${escapeHtml(value)}</option>`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return map[char];
  });
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}
