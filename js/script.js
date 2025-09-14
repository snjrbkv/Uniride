const filterItems = document.querySelectorAll(".filters__list li");
const selectedFilters = document.getElementById("selectedFilters");

// функция для сохранения фильтров в localStorage
function saveFilters() {
  const values = [...selectedFilters.children].map(
    (chip) => chip.dataset.value
  );
  localStorage.setItem("selectedFilters", JSON.stringify(values));
}

// функция для создания чипа
function createChip(value) {
  const chip = document.createElement("div");
  chip.classList.add("selected-filters__chip");
  chip.dataset.value = value;
  chip.innerHTML = `${value} <button>&times;</button>`;

  // удаление по клику
  chip.querySelector("button").addEventListener("click", () => {
    chip.remove();
    saveFilters(); // обновляем localStorage
  });

  selectedFilters.appendChild(chip);
}

// восстановление фильтров при загрузке
function restoreFilters() {
  const saved = JSON.parse(localStorage.getItem("selectedFilters")) || [];
  saved.forEach((value) => createChip(value));
}

// обработка клика по фильтрам сверху
filterItems.forEach((item) => {
  item.addEventListener("click", () => {
    const value = item.textContent.trim();

    // проверяем, есть ли уже выбранный фильтр
    if (
      ![...selectedFilters.children].some(
        (chip) => chip.dataset.value === value
      )
    ) {
      createChip(value);
      saveFilters();
    }
  });
});

// восстанавливаем при старте
restoreFilters();
fetch("./js/data.json")
  .then((res) => {
    if (!res.ok) throw new Error("Ошибка загрузки данных");
    return res.json();
  })
  .then((data) => {
    console.log("Загруженные данные:", data);

    const container = document.getElementById("cards-container");
    if (!container) {
      console.error("Контейнер #cards-container не найден!");
      return;
    }

    // проходим именно по data.list
    data.list.forEach((company) => {
      // карточка компании
      const card = document.createElement("div");
      card.classList.add("company-card");

      card.innerHTML = `
        <div class="company-card__logo"></div>
        <div class="company-card__header">
        <div class="company-card__icon">T</div>
        <h3>${company["Название компании"] || "Компания"}</h3>
        </div>
        <div class="company-card__field"> <img src="/images/job.svg" alt="job"/> ${
          company["Сфера"] || "Сфера не указана"
        }</div>
        <div class="company-card__location"><img src="/images/location.svg" alt="location"/> ${
          company["Локация"] || "Локация не указана"
        }</div>
        <div class="company-card__footer">
          <span class="company-card__vacancies">${
            company["Вакансии"] || 0
          } вакансий</span>
          <a href="#" class="company-card__btn">Исследовать</a>
        </div>
      `;

      // вакансии (если есть массив)
      //   if (company._nc_m2m_Uniride_Вакансииs?.length) {
      //     const jobsList = document.createElement("ul");
      //     company._nc_m2m_Uniride_Вакансииs.forEach((job) => {
      //       const li = document.createElement("li");
      //       li.textContent = `${job["Название вакансии"]} (${job["Зарплата"]})`;
      //       jobsList.appendChild(li);
      //     });
      //     card.appendChild(jobsList);
      //   }

      container.appendChild(card);
    });
  })
  .catch((err) => {
    console.error("Ошибка загрузки:", err);
  });
