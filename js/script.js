document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("filtersModal");
  const modalClose = document.querySelector(".modal__close");
  const moreLinks = document.querySelectorAll(".filters__more");
  const allFiltersBtn = document.querySelector(".selected-filters__all");
  const selectedFilters = document.getElementById("selectedFilters");
  const topFilterItems = document.querySelectorAll(".filters__list li");
  const modalTabs = document.querySelectorAll(".modal__tab");
  const modalPanels = document.querySelectorAll(".modal__panel");
  const container = document.getElementById("cards-container");
  const searchInput = document.querySelector(".search--input");

  let companiesData = [];
  let searchQuery = "";

  // -------------------------------
  // Helpers LocalStorage
  // -------------------------------
  function saveFilters() {
    const values = Array.from(selectedFilters.children).map(
      (chip) => chip.dataset.value
    );
    localStorage.setItem("selectedFilters", JSON.stringify(values));
  }

  // синхронизировать состояния в модалке на основании чипов
  function syncModalFilters() {
    if (!modal) return;
    const selectedValues = Array.from(selectedFilters.children).map(
      (c) => c.dataset.value
    );
    const modalItems = modal.querySelectorAll(".modal__panel li");
    modalItems.forEach((li) => {
      const v = li.textContent.trim();
      if (selectedValues.includes(v)) li.classList.add("selected");
      else li.classList.remove("selected");
    });
  }

  // создаёт чип (если ещё нет) и синхронизирует модалку
  function createChip(value) {
    if (!value) return;
    // предотвращаем дубликаты
    if ([...selectedFilters.children].some((c) => c.dataset.value === value))
      return;

    const chip = document.createElement("div");
    chip.className = "selected-filters__chip";
    chip.dataset.value = value;
    chip.innerHTML = `${value} <button type="button" aria-label="удалить">×</button>`;

    const btn = chip.querySelector("button");
    btn.addEventListener("click", () => {
      chip.remove();
      saveFilters();
      applyFilters();
      syncModalFilters();
    });

    selectedFilters.appendChild(chip);
    saveFilters();
    applyFilters();
    syncModalFilters();
  }

  function removeChipByValue(value) {
    const chips = Array.from(selectedFilters.children);
    const found = chips.find((c) => c.dataset.value === value);
    if (found) {
      found.remove();
      saveFilters();
      applyFilters();
      syncModalFilters();
    }
  }

  function restoreFilters() {
    const saved = JSON.parse(localStorage.getItem("selectedFilters") || "[]");
    saved.forEach((v) => {
      // используем createChip — она сама синхронизирует
      createChip(v);
    });
  }

  function handleFilterSelection(value, closeAfter = false) {
    if (!value) return;
    createChip(value);
    if (closeAfter) closeModal();
  }

  // -------------------------------
  // Modal open/close + sync on open
  // -------------------------------
  function openModal(e) {
    if (e?.preventDefault) e.preventDefault();
    modal?.classList.add("active");

    if (!document.querySelector(".modal__tab.active") && modalTabs[0]) {
      modalTabs[0].classList.add("active");
      const firstPanel = document.getElementById(modalTabs[0].dataset.target);
      firstPanel?.classList.add("active");
    }

    // синхронизируем отметки при открытии
    syncModalFilters();
  }

  function closeModal() {
    modal?.classList.remove("active");
  }

  moreLinks.forEach((link) => link.addEventListener("click", openModal));
  if (allFiltersBtn) allFiltersBtn.addEventListener("click", openModal);
  if (modalClose) modalClose.addEventListener("click", closeModal);

  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal?.classList.contains("active")) {
      closeModal();
    }
  });

  // -------------------------------
  // Верхние фильтры (быстрый выбор)
  // -------------------------------
  topFilterItems.forEach((item) =>
    item.addEventListener("click", () =>
      handleFilterSelection(item.textContent.trim())
    )
  );

  // -------------------------------
  // Внутри модалки: клики по элементам (toggle)
  // -------------------------------
  if (modal) {
    const modalPanelItems = modal.querySelectorAll(".modal__panel li");
    modalPanelItems.forEach((item) => {
      item.addEventListener("click", () => {
        const value = item.textContent.trim();
        const chipExists = [...selectedFilters.children].some(
          (c) => c.dataset.value === value
        );

        if (chipExists) {
          // удаляем чип и снимаем выделение
          removeChipByValue(value);
          item.classList.remove("selected");
        } else {
          // добавляем чип и помечаем
          createChip(value);
          item.classList.add("selected");
        }
      });
    });
  }

  // вкладки модалки
  modalTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      modalTabs.forEach((t) => t.classList.remove("active"));
      modalPanels.forEach((p) => p.classList.remove("active"));
      tab.classList.add("active");
      document.getElementById(tab.dataset.target)?.classList.add("active");
    });
  });

  restoreFilters();

  // -------------------------------
  // Создание карточки (DOM, чтобы управлять video.play())
  // -------------------------------
  function createCompanyCard(company) {
    const card = document.createElement("div");
    card.classList.add("company-card");

    const cover = company["Обложка"];
    const logoWrap = document.createElement("div");
    logoWrap.className = "company-card__logo";

    if (cover) {
      const lower = String(cover).toLowerCase();
      // картинка
      if (/\.(jpg|jpeg|png|gif|svg|webp)$/i.test(lower)) {
        const img = document.createElement("img");
        img.src = cover;
        img.alt = "cover";
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.objectFit = "cover";
        img.style.borderRadius = "12px";
        logoWrap.appendChild(img);
      } else {
        // всё остальное — видео
        const videoEl = document.createElement("video");
        videoEl.src = cover;
        videoEl.autoplay = true;
        videoEl.muted = true;
        videoEl.loop = true;
        videoEl.playsInline = true;
        videoEl.preload = "auto";
        videoEl.controls = false;
        videoEl.style.width = "100%";
        videoEl.style.height = "100%";
        videoEl.style.objectFit = "cover";
        videoEl.style.borderRadius = "12px";
        videoEl.style.pointerEvents = "none";
        // запрещаем контекстное меню
        videoEl.addEventListener("contextmenu", (e) => e.preventDefault());

        logoWrap.appendChild(videoEl);

        // попыться запустить программно
        const p = videoEl.play();
        if (p && typeof p.catch === "function")
          p.catch(() => {
            /* ignore */
          });
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
    vacancies.textContent = `${company["Вакансии"] || 0} вакансии`;

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

  // -------------------------------
  // Фильтрация + Поиск
  // -------------------------------
  function applyFilters() {
    const activeFilters = Array.from(selectedFilters.children).map((chip) =>
      chip.dataset.value.toLowerCase()
    );

    container.innerHTML = "";

    let filteredCompanies = companiesData.slice();

    // фильтрация по чипам (OR)
    if (activeFilters.length > 0) {
      filteredCompanies = filteredCompanies.filter((company) => {
        const values = [
          company["Название компании"],
          company["Сфера"],
          company["Локация"],
        ]
          .filter(Boolean)
          .map((v) => v.toLowerCase());

        return activeFilters.some((f) => values.some((v) => v.includes(f)));
      });
    }

    // фильтрация по поиску
    if (searchQuery) {
      filteredCompanies = filteredCompanies.filter((company) => {
        const values = [
          company["Название компании"],
          company["Сфера"],
          company["Локация"],
        ]
          .filter(Boolean)
          .map((v) => v.toLowerCase());
        return values.some((v) => v.includes(searchQuery));
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

    // синхронизируем модалку (на случай, если чипы/удаления были изменены)
    syncModalFilters();
  }

  // -------------------------------
  // Поиск
  // -------------------------------
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      searchQuery = e.target.value.trim().toLowerCase();
      applyFilters();
    });
  }

  // -------------------------------
  // Загрузка компаний
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

      applyFilters();
    } catch (err) {
      console.error("Ошибка загрузки:", err);
      container.innerHTML = `<p class="error">Не удалось загрузить данные</p>`;
    }
  }

  if (container) loadCompanies();
});
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("filtersModal");
  const modalClose = document.querySelector(".modal__close");
  const modalTabs = document.querySelectorAll(".modal__tab");
  const modalPanels = document.querySelectorAll(".modal__panel");

  // -------------------------------
  // Открыть / закрыть модалку
  // -------------------------------
  function openModal() {
    modal?.classList.add("active");

    // если нет активной вкладки — включаем первую
    if (!document.querySelector(".modal__tab.active") && modalTabs[0]) {
      modalTabs[0].classList.add("active");
      document
        .getElementById(modalTabs[0].dataset.target)
        ?.classList.add("active");
    }
  }

  function closeModal() {
    modal?.classList.remove("active");
  }

  if (modalClose) modalClose.addEventListener("click", closeModal);

  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal?.classList.contains("active")) {
      closeModal();
    }
  });

  // -------------------------------
  // Мобильные кнопки
  // -------------------------------
  const mobileFilterButtons = document.querySelectorAll(".mobile-filter__item");
  const allFiltersBtn = document.querySelector(".mobile-filter__all");

  mobileFilterButtons.forEach((btn, index) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      openModal();

      // выключаем все вкладки и панели
      modalTabs.forEach((t) => t.classList.remove("active"));
      modalPanels.forEach((p) => p.classList.remove("active"));

      // активируем вкладку с таким же индексом
      if (modalTabs[index]) {
        modalTabs[index].classList.add("active");
        document
          .getElementById(modalTabs[index].dataset.target)
          ?.classList.add("active");
      }
    });
  });

  if (allFiltersBtn) {
    allFiltersBtn.addEventListener("click", (e) => {
      e.preventDefault();
      openModal();

      // сброс, активируем первую вкладку
      modalTabs.forEach((t) => t.classList.remove("active"));
      modalPanels.forEach((p) => p.classList.remove("active"));
      if (modalTabs[0]) {
        modalTabs[0].classList.add("active");
        document
          .getElementById(modalTabs[0].dataset.target)
          ?.classList.add("active");
      }
    });
  }
});
