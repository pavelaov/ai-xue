/* 中英文切换和移动端菜单。不依赖网络请求，直接打开 index.html 也可使用。 */
(() => {
  "use strict";
  const root = document.querySelector(".ai-xue");
  if (!root) return;
  const messages = window.AX_CONTENT;
  const languageButtons = root.querySelectorAll("[data-language]");
  const supported = (value) => value === "en" || value === "zh";

  function setLanguage(language, announce = false) {
    if (!messages || !supported(language) || !messages[language]) return;
    const content = messages[language];
    // 只渲染本地翻译；URL 参数只能选择语言，不能成为 HTML 内容。
    root.querySelectorAll("[data-i18n]").forEach((element) => {
      const value = content[element.dataset.i18n];
      if (typeof value === "string") element.innerHTML = value;
    });
    root.querySelectorAll("[data-i18n-alt]").forEach((element) => {
      element.alt = content[element.dataset.i18nAlt];
    });
    root.querySelectorAll("[data-i18n-aria]").forEach((element) => {
      element.setAttribute("aria-label", content[element.dataset.i18nAria]);
    });
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
    root.lang = document.documentElement.lang;
    document.title = content.pageTitle;
    document.querySelector('meta[name="description"]')?.setAttribute("content", content.description);
    languageButtons.forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset.language === language));
    });
    if (announce) {
      const status = root.querySelector(".ax-language-status");
      if (status) status.textContent = content.languageChanged;
      try {
        const url = new URL(window.location.href);
        url.searchParams.set("lang", language);
        window.history.replaceState(null, "", url);
      } catch { /* 部分 file:// 环境不允许改写历史。 */ }
    }
  }

  if (messages?.en && messages?.zh) {
    const requestedLanguage = new URLSearchParams(window.location.search).get("lang");
    // 普通入口始终默认英文；只有明确的语言链接才覆盖默认值。
    const initialLanguage = supported(requestedLanguage) ? requestedLanguage : "en";
    setLanguage(initialLanguage);
    languageButtons.forEach((button) => {
      button.addEventListener("click", () => setLanguage(button.dataset.language, true));
    });
    root.classList.add("ax-language-ready");
  }

  const menuButton = root.querySelector(".ax-menu-toggle");
  const navigation = root.querySelector(".ax-navigation");
  if (!menuButton || !navigation) return;
  const mobileViewport = window.matchMedia("(max-width: 767px)");
  function setMenuOpen(open) {
    menuButton.setAttribute("aria-expanded", String(open));
    navigation.classList.toggle("is-open", open);
  }
  root.classList.add("ax-menu-ready");
  menuButton.addEventListener("click", () => setMenuOpen(menuButton.getAttribute("aria-expanded") !== "true"));
  navigation.addEventListener("click", (event) => {
    const link = event.target.closest("a[href^='#']");
    if (!link || !mobileViewport.matches) return;
    setMenuOpen(false);
    const target = document.getElementById(link.hash.slice(1));
    if (target) {
      target.setAttribute("tabindex", "-1");
      target.focus({ preventScroll: true });
    }
  });
  root.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && menuButton.getAttribute("aria-expanded") === "true") {
      setMenuOpen(false);
      menuButton.focus();
    }
  });
  mobileViewport.addEventListener("change", () => setMenuOpen(false));
})();

/* Accessible timeline tabs with keyboard support and preserved language state. */
(() => {
  const section = document.getElementById("personal-timeline");
  if (!section) return;
  const tabs = Array.from(section.querySelectorAll("[data-timeline-tab]"));
  const panels = Array.from(section.querySelectorAll("[data-timeline-panel]"));
  const status = section.querySelector(".ax-timeline-count");
  let selected = "all";

  function refresh() {
    tabs.forEach(tab => {
      const active = tab.dataset.timelineTab === selected;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
    });
    panels.forEach(panel => { panel.hidden = panel.dataset.timelinePanel !== selected; });
    const activeTab = tabs.find(tab => tab.dataset.timelineTab === selected);
    const panel = panels.find(panel => panel.dataset.timelinePanel === selected);
    const count = panel.querySelectorAll(".ax-timeline-item").length;
    status.textContent = document.documentElement.lang === "zh-CN"
      ? `${activeTab.textContent}：${count} 个节点。`
      : `${activeTab.textContent}: ${count} milestones.`;
  }
  function select(tab, focus = false) {
    selected = tab.dataset.timelineTab;
    refresh();
    if (focus) tab.focus();
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => select(tab));
    tab.addEventListener("keydown", event => {
      let next;
      if (event.key === "ArrowRight") next = (index + 1) % tabs.length;
      else if (event.key === "ArrowLeft") next = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = tabs.length - 1;
      else return;
      event.preventDefault();
      select(tabs[next], true);
    });
  });
  // Old section links continue to open the matching view in the unified module.
  function restoreLegacyLink() {
    if (window.location.hash === "#life-timeline") select(tabs.find(tab => tab.dataset.timelineTab === "resume"));
    else if (window.location.hash === "#research-timeline") select(tabs[0]);
  }
  window.addEventListener("hashchange", restoreLegacyLink);
  document.querySelectorAll("[data-language]").forEach(button => button.addEventListener("click", refresh));
  section.classList.add("ax-timeline-ready");
  refresh();
  restoreLegacyLink();
})();
