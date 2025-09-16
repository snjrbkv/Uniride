document.addEventListener("DOMContentLoaded", () => {
  // -------------------------------
  // DOM элементы
  // -------------------------------
  const modal = document.getElementById("filtersModal");
  const modalClose = document.querySelector(".modal__close");
  const moreLinks = document.querySelectorAll(".filters__more");
  const allFiltersBtn = document.querySelector(".selected-filters__all");
  const selectedFilters = document.getElementById("selectedFilters");
  let topFilterItems = document.querySelectorAll(".filters__list li");
  const modalTabs = document.querySelectorAll(".modal__tab");
  const modalPanels = document.querySelectorAll(".modal__panel");
  const container = document.getElementById("cards-container");
  const searchInput = document.querySelector(".search--input");
  const filterTitles = document.querySelectorAll(".filters__title");
  const mobileFilterButtons = document.querySelectorAll(".mobile-filter__item");
  const mobileAllFilters = document.querySelector(".mobile-filter__all");

  let companiesData = [];
  let searchQuery = "";

  // -------------------------------
  // Helpers
  // -------------------------------
  function normalizeText(str) {
    return String(str || "")
      .trim()
      .replace(/[.,;:!?]+$/, "") // убираем точки, запятые и пр. в конце
      .replace(/\s+/g, " ") // заменяем двойные пробелы
      .toLowerCase();
  }

  function uniqueArray(arr) {
    const seen = new Set();
    return arr.filter((item) => {
      const norm = normalizeText(item);
      if (seen.has(norm)) return false;
      seen.add(norm);
      return true;
    });
  }

  // -------------------------------
  // LocalStorage helpers
  // -------------------------------
  function saveFilters() {
    if (!selectedFilters) return;
    const values = Array.from(selectedFilters.children).map(
      (chip) => chip.dataset.value
    );
    localStorage.setItem("selectedFilters", JSON.stringify(values));
  }

  // -------------------------------
  // Универсально: получить вакансии
  // -------------------------------
  function getVacancyEntries(company) {
    const res = [];
    for (const k in company) {
      const val = company[k];
      if (Array.isArray(val)) {
        val.forEach((item) => {
          if (item && typeof item === "object") {
            if ("Вакансии" in item && item["Вакансии"]) {
              res.push(item["Вакансии"]);
            } else {
              res.push(item);
            }
          }
        });
      }
    }
    return res.flat();
  }

  // -------------------------------
  // Парсинг "Форма занятости"
  // -------------------------------
  function parseEmployment(str) {
    if (!str) return [];
    let s = String(str || "");
    s = s
      .replace(/Компания\s+практикует[\s\S]*?:/i, "")
      .replace(/Контент/i, "");
    return s
      .split(/[\/,;\n]+/)
      .map((x) => x.trim())
      .filter(Boolean);
  }

  // -------------------------------
  // Обновление внешнего вида блоков
  // -------------------------------
  function updateBlocksState() {
    document.querySelectorAll(".filters__block").forEach((block) => {
      const hasActive = Boolean(
        block.querySelector("li.active") || block.querySelector("li.selected")
      );
      block.classList.toggle("has-active", hasActive);
    });
  }

  // -------------------------------
  // Active/selected по значению
  // -------------------------------
  function setActiveStateForValue(value, active) {
    if (!value) return;
    const norm = normalizeText(value);
    document
      .querySelectorAll(".filters__list li, .modal__panel li")
      .forEach((li) => {
        if (normalizeText(li.textContent) === norm) {
          li.classList.toggle("active", !!active);
          li.classList.toggle("selected", !!active);
        }
      });
    updateBlocksState();
  }

  // -------------------------------
  // Sync modal filters
  // -------------------------------
  function syncModalFilters() {
    if (!selectedFilters) return;
    const selectedValues = Array.from(selectedFilters.children).map((c) =>
      normalizeText(c.dataset.value)
    );

    document
      .querySelectorAll(".modal__panel li, .filters__list li")
      .forEach((li) => {
        li.classList.toggle(
          "selected",
          selectedValues.includes(normalizeText(li.textContent))
        );
        li.classList.toggle(
          "active",
          selectedValues.includes(normalizeText(li.textContent))
        );
      });

    updateBlocksState();
  }

  // -------------------------------
  // Чипы
  // -------------------------------
  function createChip(value) {
    if (!value || !selectedFilters) return;
    const norm = normalizeText(value);
    if (
      [...selectedFilters.children].some(
        (c) => normalizeText(c.dataset.value) === norm
      )
    )
      return;

    const chip = document.createElement("div");
    chip.className = "selected-filters__chip";
    chip.dataset.value = value;
    chip.innerHTML = `${value} <button type="button" aria-label="удалить">×</button>`;

    chip.querySelector("button").addEventListener("click", () => {
      chip.remove();
      saveFilters();
      applyFilters();
      syncModalFilters();
    });

    selectedFilters.appendChild(chip);
    setActiveStateForValue(value, true);
    saveFilters();
    applyFilters();
    syncModalFilters();
  }

  function removeChipByValue(value) {
    if (!selectedFilters) return;
    const norm = normalizeText(value);
    const chips = Array.from(selectedFilters.children);
    const found = chips.find((c) => normalizeText(c.dataset.value) === norm);
    if (found) {
      found.remove();
      setActiveStateForValue(value, false);
      saveFilters();
      applyFilters();
      syncModalFilters();
    }
  }

  function restoreFilters() {
    if (!selectedFilters) return;
    const saved = JSON.parse(localStorage.getItem("selectedFilters") || "[]");
    saved.forEach((v) => createChip(v));
    syncModalFilters();
    updateBlocksState();
  }

  function handleFilterSelection(value, closeAfter = false) {
    if (!value) return;
    const norm = normalizeText(value);
    const exists = [...selectedFilters.children].some(
      (c) => normalizeText(c.dataset.value) === norm
    );
    if (exists) removeChipByValue(value);
    else createChip(value);
    if (closeAfter) closeModal();
  }

  // -------------------------------
  // Modal open/close
  // -------------------------------
  function openModal(tabIndex = 0) {
    if (!modal) return;
    modal.classList.add("active");

    modalTabs.forEach((t) => t.classList.remove("active"));
    modalPanels.forEach((p) => p.classList.remove("active"));

    const idx = Math.max(0, Math.min(tabIndex, modalTabs.length - 1));
    if (modalTabs[idx]) {
      modalTabs[idx].classList.add("active");
      const target = modalTabs[idx].dataset.target;
      if (target) {
        const panel = document.getElementById(target);
        if (panel) panel.classList.add("active");
      } else {
        if (modalPanels[idx]) modalPanels[idx].classList.add("active");
      }
    }

    syncModalFilters();
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove("active");
  }

  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
  }
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal && modal.classList.contains("active"))
      closeModal();
  });

  // -------------------------------
  // Создание карточки компании
  // -------------------------------
  function createCompanyCard(company) {
    const card = document.createElement("div");
    card.classList.add("company-card");

    // логотип / обложка
    const cover = company["Обложка"];
    const logoWrap = document.createElement("div");
    logoWrap.className = "company-card__logo";
    if (cover) {
      const lower = String(cover).toLowerCase();
      if (/\.(jpg|jpeg|png|gif|svg|webp)$/i.test(lower)) {
        const img = document.createElement("img");
        img.src = cover;
        img.alt = "cover";
        img.style.cssText =
          "width:100%;height:100%;object-fit:cover;border-radius:12px;";
        logoWrap.appendChild(img);
      } else {
        const videoEl = document.createElement("video");
        videoEl.src = cover;
        videoEl.autoplay = true;
        videoEl.muted = true;
        videoEl.loop = true;
        videoEl.playsInline = true;
        videoEl.preload = "auto";
        videoEl.controls = false;
        videoEl.style.cssText =
          "width:100%;height:100%;object-fit:cover;border-radius:12px;pointer-events:none;";
        videoEl.addEventListener("contextmenu", (e) => e.preventDefault());
        logoWrap.appendChild(videoEl);
        const p = videoEl.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
      }
    }

    const header = document.createElement("div");
    header.className = "company-card__header";
    const icon = document.createElement("div");
    icon.className = "company-card__icon";
    if (company["Лого (1:1)"]) {
      const logoImg = document.createElement("img");
      logoImg.src = company["Лого (1:1)"];
      logoImg.alt = "logo";
      icon.appendChild(logoImg);
    }
    const title = document.createElement("h3");
    title.textContent = company["Название компании"] || "Компания";
    header.appendChild(icon);
    header.appendChild(title);

    const field = document.createElement("div");
    field.className = "company-card__field";
    field.innerHTML = `<img src="/images/job.svg" alt="job"/> ${
      company["Сфера"] || "Сфера не указана"
    }`;

    const location = document.createElement("div");
    location.className = "company-card__location";
    location.innerHTML = `<img src="/images/location.svg" alt="location"/> ${
      company["Локация"] || "Локация не указана"
    }`;

    const footer = document.createElement("div");
    footer.className = "company-card__footer";
    const vacancies = document.createElement("span");
    vacancies.className = "company-card__vacancies";
    const count = Number(company["Вакансии"]) || 0;
    vacancies.textContent =
      count === 0 ? "Нет вакансий" : `${count} ${pluralizeVacancies(count)}`;

    const recordId = company.Id ?? company.id ?? company["ID"] ?? "";
    const a = document.createElement("a");
    a.className = "company-card__btn";
    a.href = `company.html?id=${encodeURIComponent(String(recordId))}`;
    a.textContent = "Исследовать";

    footer.appendChild(vacancies);
    footer.appendChild(a);

    card.appendChild(logoWrap);
    card.appendChild(header);
    card.appendChild(field);
    card.appendChild(location);
    card.appendChild(footer);

    return card;
  }

  function pluralizeVacancies(n) {
    n = Number(n) || 0;
    const abs = Math.abs(n);
    const mod100 = abs % 100;
    const mod10 = abs % 10;
    if (mod100 >= 11 && mod100 <= 19) return "вакансий";
    if (mod10 === 1) return "вакансия";
    if (mod10 >= 2 && mod10 <= 4) return "вакансии";
    return "вакансий";
  }

  // -------------------------------
  // Apply filters + search
  // -------------------------------
  function applyFilters() {
    const activeFilters = Array.from(selectedFilters?.children || []).map(
      (chip) => normalizeText(chip.dataset.value)
    );

    container.innerHTML = "";
    let filteredCompanies = companiesData.slice();

    if (activeFilters.length > 0) {
      filteredCompanies = filteredCompanies.filter((company) => {
        const values = [
          company["Название компании"],
          company["Сфера"],
          company["Локация"],
          company["Направление"],
        ]
          .filter(Boolean)
          .map((v) => normalizeText(v));

        const vacancyEntries = getVacancyEntries(company)
          .flatMap((vac) =>
            vac && typeof vac === "object"
              ? [
                  vac.Title,
                  vac.Направление,
                  vac.Локация,
                  vac.Регион,
                  vac["О работе"],
                  vac["Форма занятости"],
                ]
              : [vac]
          )
          .filter(Boolean)
          .map((v) => normalizeText(v));

        return activeFilters.some(
          (f) =>
            values.some((v) => v.includes(f)) ||
            vacancyEntries.some((v) => v.includes(f))
        );
      });
    }

    if (searchQuery) {
      const q = normalizeText(searchQuery);
      filteredCompanies = filteredCompanies.filter((company) => {
        const companyValues = [
          company["Название компании"],
          company["Сфера"],
          company["Локация"],
          company["Направление"],
        ]
          .filter(Boolean)
          .map((v) => normalizeText(v));

        const vacancyValues = getVacancyEntries(company)
          .flatMap((vac) =>
            vac && typeof vac === "object"
              ? [
                  vac.Title,
                  vac.Направление,
                  vac.Локация,
                  vac.Регион,
                  vac["О работе"],
                  vac["Форма занятости"],
                ]
              : [vac]
          )
          .filter(Boolean)
          .map((v) => normalizeText(v));

        return (
          companyValues.some((v) => v.includes(q)) ||
          vacancyValues.some((v) => v.includes(q))
        );
      });
    }

    if (filteredCompanies.length === 0) {
      container.innerHTML =
        '<div class="notfound"><h3>Вакансии не найдены</h3><p>Попробуйте поискать что-нибудь другое.</p></div>';
      syncModalFilters();
      return;
    }

    filteredCompanies.forEach((company) =>
      container.appendChild(createCompanyCard(company))
    );
    syncModalFilters();
  }

  // -------------------------------
  // Search input
  // -------------------------------
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      applyFilters();
    });
  }

  // -------------------------------
  // Render filters (no duplicates)
  // -------------------------------
  function renderFilters() {
    const sets = {
      sphere: new Set(),
      directions: new Set(),
      employment: new Set(),
      region: new Set(),
    };

    companiesData.forEach((company) => {
      if (company["Сфера"]) sets.sphere.add(String(company["Сфера"]).trim());

      if (company["Локация"]) {
        const country = String(company["Локация"]).split(",")[0].trim();
        if (country) sets.region.add(country);
      }

      if (company["Форма занятости"]) {
        parseEmployment(company["Форма занятости"]).forEach(
          (v) => v && sets.employment.add(v)
        );
      }

      getVacancyEntries(company).forEach((vac) => {
        if (!vac || typeof vac !== "object") return;
        if (vac["Направление"])
          sets.directions.add(String(vac["Направление"]).trim());
        if (vac["Регион"]) sets.region.add(String(vac["Регион"]).trim());
        if (vac["Локация"]) {
          const country = String(vac["Локация"]).split(",")[0].trim();
          if (country) sets.region.add(country);
        }
        if (vac["Форма занятости"]) {
          parseEmployment(vac["Форма занятости"]).forEach(
            (v) => v && sets.employment.add(v)
          );
        }
      });
    });

    const panelsMap = {
      sphere: document.getElementById("sphere"),
      directions: document.getElementById("directions"),
      employment: document.getElementById("employment"),
      region: document.getElementById("region"),
    };

    Object.entries(panelsMap).forEach(([key, panel]) => {
      if (!panel) return;
      const ul = panel.querySelector("ul");
      if (!ul) return;

      const fixed = Array.from(ul.querySelectorAll("li")).map((li) =>
        li.textContent.trim()
      );

      ul.innerHTML = "";

      fixed.forEach((val) => {
        if (!val) return;
        const li = document.createElement("li");
        li.textContent = val;
        li.classList.add("_fixed");
        li.addEventListener("click", () => handleFilterSelection(val));
        ul.appendChild(li);
      });

      const values = uniqueArray(Array.from(sets[key] || [])).filter(
        (v) => !fixed.some((f) => normalizeText(f) === normalizeText(v))
      );
      values.sort((a, b) => a.localeCompare(b, "ru"));

      values.forEach((val) => {
        const li = document.createElement("li");
        li.textContent = val;
        li.addEventListener("click", () => handleFilterSelection(val));
        ul.appendChild(li);
      });
    });

    topFilterItems = document.querySelectorAll(".filters__list li");
    topFilterItems.forEach((li) => {
      li.removeEventListener("click", topFilterClickHandler);
      li.addEventListener("click", topFilterClickHandler);
    });

    syncModalFilters();
    updateBlocksState();
  }

  function topFilterClickHandler(e) {
    const value = e.currentTarget.textContent.trim();
    const chipExists = [...selectedFilters.children].some(
      (c) => normalizeText(c.dataset.value) === normalizeText(value)
    );
    if (chipExists) removeChipByValue(value);
    else createChip(value);
  }

  // -------------------------------
  // Load companies
  // -------------------------------
  async function loadCompanies() {
    try {
      const res = await fetch("https://bd.uniride.io/data/table_records.txt");
      if (!res.ok) throw new Error(`Ошибка HTTP: ${res.status}`);
      const data = await res.json();

      if (!data?.list?.length) {
        container.innerHTML =
          "<h3>Вакансии не найдены</h3><p>Попробуйте поискать что-нибудь другое.</p>";
        return;
      }

      companiesData = data.list.filter(
        (c) => c["Активация страницы"] !== false
      );

      renderFilters();
      applyFilters();
    } catch (err) {
      console.error("Ошибка загрузки:", err);
      if (container)
        container.innerHTML = `<p class="error">Не удалось загрузить данные</p>`;
    }
  }

  function bindModalStaticListeners() {
    modalTabs.forEach((tab, index) =>
      tab.addEventListener("click", () => openModal(index))
    );
  }

  moreLinks.forEach((link, index) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      openModal(index);
    });
  });

  if (allFiltersBtn) {
    allFiltersBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openModal(0);
    });
  }

  filterTitles.forEach((title, index) => {
    title.addEventListener("click", (e) => {
      e.preventDefault();
      openModal(index);
    });
  });

  mobileFilterButtons.forEach((btn, index) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openModal(index);
    });
  });
  if (mobileAllFilters) {
    mobileAllFilters.addEventListener("click", (e) => {
      e.preventDefault();
      openModal(0);
    });
  }

  restoreFilters();
  bindModalStaticListeners();
  if (container) loadCompanies();
});
