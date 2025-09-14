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

  // --- LocalStorage helpers ---
  function saveFilters() {
    const values = Array.from(selectedFilters.children).map(
      (chip) => chip.dataset.value
    );
    localStorage.setItem("selectedFilters", JSON.stringify(values));
  }

  function createChip(value) {
    if (!value) return;
    if (
      Array.from(selectedFilters.children).some(
        (c) => c.dataset.value === value
      )
    )
      return;

    const chip = document.createElement("div");
    chip.className = "selected-filters__chip";
    chip.dataset.value = value;
    chip.innerHTML = `${value} <button type="button" aria-label="удалить">×</button>`;

    const btn = chip.querySelector("button");
    btn.addEventListener("click", () => {
      chip.remove();
      saveFilters();
    });

    selectedFilters.appendChild(chip);
  }

  function restoreFilters() {
    const saved = JSON.parse(localStorage.getItem("selectedFilters") || "[]");
    saved.forEach((v) => createChip(v));
  }

  function handleFilterSelection(value, closeAfter = false) {
    if (!value) return;
    createChip(value);
    saveFilters();
    if (closeAfter && modal) closeModal();
  }

  // --- modal open/close ---
  function openModal(e) {
    if (e && e.preventDefault) e.preventDefault();
    if (!modal) return;
    modal.classList.add("active");
    const activeTab = document.querySelector(".modal__tab.active");
    if (!activeTab && modalTabs[0]) {
      modalTabs[0].classList.add("active");
      const id = modalTabs[0].dataset.target;
      const p = document.getElementById(id);
      if (p) p.classList.add("active");
    }
  }
  function closeModal() {
    if (!modal) return;
    modal.classList.remove("active");
  }

  moreLinks.forEach((link) => link.addEventListener("click", openModal));
  if (allFiltersBtn) allFiltersBtn.addEventListener("click", openModal);
  if (modalClose) modalClose.addEventListener("click", closeModal);
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal && modal.classList.contains("active")) {
      closeModal();
    }
  });

  // --- клики по фильтрам сверху ---
  topFilterItems.forEach((item) =>
    item.addEventListener("click", () => {
      const value = item.textContent.trim();
      handleFilterSelection(value, false);
    })
  );

  // --- клики по элементам внутри модалки ---
  if (modal) {
    const modalPanelItems = modal.querySelectorAll(".modal__panel li");
    let modalSelectionCount = 0;
    modalPanelItems.forEach((item) => {
      item.addEventListener("click", () => {
        const value = item.textContent.trim();
        handleFilterSelection(value, false);
        modalSelectionCount++;
        if (modalSelectionCount >= 3) {
          closeModal();
          modalSelectionCount = 0;
        }
      });
    });
  }

  modalTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      modalTabs.forEach((t) => t.classList.remove("active"));
      modalPanels.forEach((p) => p.classList.remove("active"));
      tab.classList.add("active");
      const target = tab.dataset.target;
      const panel = document.getElementById(target);
      if (panel) panel.classList.add("active");
    });
  });

  restoreFilters();

  // --- загрузка компаний из data.json ---
  fetch("./js/data.json")
    .then((res) => {
      if (!res.ok) throw new Error("Ошибка загрузки данных");
      return res.json();
    })
    .then((data) => {
      console.log("Загруженные данные:", data);
      if (!container) return;

      data.list.forEach((company) => {
        const card = document.createElement("div");
        card.classList.add("company-card");

        card.innerHTML = `
          <div class="company-card__logo"></div>
          <div class="company-card__header">
            <div class="company-card__icon">T</div>
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
            <a href="#" class="company-card__btn">Исследовать</a>
          </div>
        `;

        container.appendChild(card);
      });
    })
    .catch((err) => {
      console.error("Ошибка загрузки:", err);
    });
});
