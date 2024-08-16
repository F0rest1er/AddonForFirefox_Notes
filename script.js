document.addEventListener("DOMContentLoaded", function () {
  const addNoteButton = document.getElementById("add-note");
  const noteInput = document.getElementById("note-input");
  const notesList = document.getElementById("notes-list");

  // Получение локализованных строк
  const title = browser.i18n.getMessage("title");
  const addButton = browser.i18n.getMessage("addButton");
  const notePlaceholder = browser.i18n.getMessage("notePlaceholder");

  // Установка текста для элементов HTML
  document.querySelector("h1").textContent = title;
  addNoteButton.textContent = addButton;
  noteInput.placeholder = notePlaceholder;

  // Загрузка заметок из локального хранилища при загрузке страницы
  loadNotes();

  // Добавление новой заметки
  addNoteButton.addEventListener("click", function () {
    const noteText = noteInput.value.trim();
    if (noteText !== "") {
      addNoteToList(noteText);
      saveNoteToLocalStorage(noteText);
      noteInput.value = "";
    }
  });

  // Функция добавления заметки в список
  function addNoteToList(noteText) {
    const li = document.createElement("li");
    li.className = "note-item";

    const span = document.createElement("span");
    span.textContent = noteText;

    const deleteButton = document.createElement("button");
    deleteButton.textContent = browser.i18n.getMessage("deleteButton");
    deleteButton.className = "delete-note";
    deleteButton.addEventListener("click", function () {
      notesList.removeChild(li);
      deleteNoteFromLocalStorage(noteText);
    });

    li.appendChild(span);
    li.appendChild(deleteButton);
    notesList.appendChild(li);
  }

  // Сохранение заметки в локальное хранилище
  function saveNoteToLocalStorage(noteText) {
    let notes = JSON.parse(localStorage.getItem("notes")) || [];
    notes.push(noteText);
    localStorage.setItem("notes", JSON.stringify(notes));
  }

  // Загрузка заметок из локального хранилища
  function loadNotes() {
    let notes = JSON.parse(localStorage.getItem("notes")) || [];
    notes.forEach(function (noteText) {
      addNoteToList(noteText);
    });
  }

  // Удаление заметки из локального хранилища
  function deleteNoteFromLocalStorage(noteText) {
    let notes = JSON.parse(localStorage.getItem("notes")) || [];
    notes = notes.filter((note) => note !== noteText);
    localStorage.setItem("notes", JSON.stringify(notes));
  }
});
