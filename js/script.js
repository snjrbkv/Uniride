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
  const searchInput = document.querySelector(".search--input"); // 🔍 поле поиска

  let companiesData = []; // сохраняем все компании
  let searchQuery = ""; // текущее значение поиска

  // -------------------------------
  // Helpers LocalStorage
  // -------------------------------
  function saveFilters() {
    const values = Array.from(selectedFilters.children).map(
      (chip) => chip.dataset.value
    );
    localStorage.setItem("selectedFilters", JSON.stringify(values));
  }

  function createChip(value) {
    if (!value) return;
    if ([...selectedFilters.children].some((c) => c.dataset.value === value))
      return;

    const chip = document.createElement("div");
    chip.className = "selected-filters__chip";
    chip.dataset.value = value;
    chip.innerHTML = `${value} <button type="button" aria-label="удалить">×</button>`;

    chip.querySelector("button").addEventListener("click", () => {
      chip.remove();
      saveFilters();
      applyFilters();
    });

    selectedFilters.appendChild(chip);
    applyFilters();
  }

  function restoreFilters() {
    const saved = JSON.parse(localStorage.getItem("selectedFilters") || "[]");
    saved.forEach((v) => createChip(v));
  }

  function handleFilterSelection(value, closeAfter = false) {
    if (!value) return;
    createChip(value);
    saveFilters();
    if (closeAfter) closeModal();
  }

  // -------------------------------
  // Modal
  // -------------------------------
  function openModal(e) {
    if (e?.preventDefault) e.preventDefault();
    modal?.classList.add("active");

    if (!document.querySelector(".modal__tab.active") && modalTabs[0]) {
      modalTabs[0].classList.add("active");
      const firstPanel = document.getElementById(modalTabs[0].dataset.target);
      firstPanel?.classList.add("active");
    }
  }

  function closeModal() {
    modal?.classList.remove("active");
  }

  moreLinks.forEach((link) => link.addEventListener("click", openModal));
  allFiltersBtn?.addEventListener("click", openModal);
  modalClose?.addEventListener("click", closeModal);

  modal?.addEventListener("click", (e) => {
    if (e.target === modal) closeModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal?.classList.contains("active")) {
      closeModal();
    }
  });

  // -------------------------------
  // Фильтры
  // -------------------------------
  topFilterItems.forEach((item) =>
    item.addEventListener("click", () =>
      handleFilterSelection(item.textContent.trim())
    )
  );

  if (modal) {
    const modalPanelItems = modal.querySelectorAll(".modal__panel li");

    modalPanelItems.forEach((item) => {
      item.addEventListener("click", () => {
        const value = item.textContent.trim();
        const chip = [...selectedFilters.children].find(
          (c) => c.dataset.value === value
        );

        if (chip) {
          chip.remove();
          item.classList.remove("selected");
          saveFilters();
          applyFilters();
        } else {
          handleFilterSelection(value);
          item.classList.add("selected");
        }
      });
    });
  }

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
  // Карточки компаний
  // -------------------------------
  function createCompanyCard(company) {
    const card = document.createElement("div");
    card.classList.add("company-card");

    const cover = company["Обложка"];
    let coverContent = "";

    if (cover) {
      const lower = cover.toLowerCase();

      if (cover.includes("kinescope.io")) {
        // 🔹 Kinescope (встраиваем через iframe)
        coverContent = `
      <iframe 
        src="${cover}" 
        frameborder="0" 
        allow="autoplay; fullscreen; picture-in-picture"
        style="width:100%;height:100%;border-radius:12px;"
      ></iframe>
    `;
      } else if (/\.(mp4|webm|ogg)$/i.test(lower)) {
        coverContent = `
      <video 
        src="${cover}" 
        autoplay 
        muted 
        loop 
        playsinline
        style="width:100%;height:100%;object-fit:cover;border-radius:12px;"
      ></video>
    `;
      } else if (/\.(jpg|jpeg|png|gif|svg|webp)$/i.test(lower)) {
        coverContent = `
      <img 
        src="${cover}" 
        alt="cover" 
        style="width:100%;height:100%;object-fit:cover;border-radius:12px;"
      />
    `;
      } else {
        // fallback — вдруг это просто ссылка без расширения
        coverContent = `
      <img 
        src="${cover}" 
        alt="cover" 
        style="width:100%;height:100%;object-fit:cover;border-radius:12px;"
      />
    `;
      }
    }

    const recordId = company.Id || company.id || company["ID"] || "";

    card.innerHTML = `
      <div class="company-card__logo">
        ${coverContent}
      </div>

      <div class="company-card__header">
        <div class="company-card__icon">
          ${
            company["Лого (1:1)"]
              ? `<img src="${company["Лого (1:1)"]}" alt="logo"/>`
              : ""
          }
        </div>
        <h3>${company["Название компании"] || "Компания"}</h3>
      </div>

      <div class="company-card__field">
        <img src="/images/job.svg" alt="job"/>
        ${company["Сфера"] || "Сфера не указана"}
      </div>

      <div class="company-card__location">
        <img src="/images/location.svg" alt="location"/>
        ${company["Локация"] || "Локация не указана"}
      </div>

      <div class="company-card__footer">
        <span class="company-card__vacancies">
          ${company["Вакансии"] || 0} вакансий
        </span>
        <a href="company.html?id=${recordId}" class="company-card__btn">
          Исследовать
        </a>
      </div>
    `;

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

    let filteredCompanies = companiesData;

    // фильтрация по чипам
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
        "<div class=notfound><h3>Вакансии не найдены</h3> <br/> <p>Попробуйте поискать что-нибудь другое.</p></div>";
      return;
    }

    filteredCompanies.forEach((company) =>
      container.appendChild(createCompanyCard(company))
    );
  }

  // -------------------------------
  // Поиск (input)
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
          "<h3>Вакансии не найдены</h3> <br/> <p>Попробуйте поискать что-нибудь другое.</p>";
        return;
      }

      companiesData = data.list.filter(
        (c) => c["Активация страницы"] !== false
      );

      applyFilters(); // применяем фильтры и поиск
    } catch (err) {
      console.error("Ошибка загрузки:", err);
      container.innerHTML = `<p class="error">Не удалось загрузить данные</p>`;
    }
  }

  if (container) loadCompanies();
});
