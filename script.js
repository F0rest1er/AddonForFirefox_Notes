document.addEventListener("DOMContentLoaded", function () {
  const addNoteButton = document.getElementById("add-note");
  const noteInput = document.getElementById("note-input");
  const notesList = document.getElementById("notes-list");
  const titleElement = document.querySelector("h1");
  const placeholderElement = document.getElementById("note-input");
  const addButtonElement = document.getElementById("add-note");

  titleElement.textContent = chrome.i18n.getMessage("title");
  placeholderElement.placeholder = chrome.i18n.getMessage("notePlaceholder");
  addButtonElement.textContent = chrome.i18n.getMessage("addButton");

  loadNotes();

  addNoteButton.addEventListener("click", function () {
    const noteText = noteInput.value.trim();
    if (noteText !== "") {
      addNoteToList(noteText);
      saveNoteToLocalStorage(noteText);
      noteInput.value = "";
    }
  });

  function addNoteToList(noteText, isEditing = false, index = -1) {
    const li = document.createElement("li");
    li.className = "note-item";

    const span = document.createElement("span");
    span.textContent = noteText;
    span.className = "note-content";

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = chrome.i18n.getMessage("deleteButton");
    deleteBtn.className = "delete-note";
    deleteBtn.addEventListener("click", function () {
      notesList.removeChild(li);
      deleteNoteFromLocalStorage(noteText);
    });

    const editBtn = document.createElement("button");
    editBtn.textContent = chrome.i18n.getMessage("editButton");
    editBtn.className = "edit-note";
    editBtn.addEventListener("click", function () {
      noteInput.value = noteText;
      addNoteButton.textContent = chrome.i18n.getMessage("saveButton");
      addNoteButton.dataset.editIndex = index;
    });

    const dateElement = document.createElement("span");
    dateElement.className = "note-date";
    const creationDate = new Date();
    dateElement.textContent = creationDate.toLocaleString();
    li.appendChild(dateElement);

    const actions = document.createElement("div");
    actions.className = "note-actions";
    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(span);
    li.appendChild(actions);
    notesList.appendChild(li);

    if (isEditing) {
      addNoteButton.dataset.editIndex = index;
    }
  }

  function saveNoteToLocalStorage(noteText) {
    let notes = JSON.parse(localStorage.getItem("notes")) || [];
    const editIndex = addNoteButton.dataset.editIndex;
    if (editIndex !== undefined) {
      notes[editIndex] = noteText;
      addNoteButton.textContent = chrome.i18n.getMessage("addButton");
      delete addNoteButton.dataset.editIndex;
    } else {
      notes.push(noteText);
    }
    localStorage.setItem("notes", JSON.stringify(notes));
  }

  function loadNotes() {
    let notes = JSON.parse(localStorage.getItem("notes")) || [];
    notes.forEach(function (noteText, index) {
      addNoteToList(noteText, false, index);
    });
  }

  function deleteNoteFromLocalStorage(noteText) {
    let notes = JSON.parse(localStorage.getItem("notes")) || [];
    notes = notes.filter((note) => note !== noteText);
    localStorage.setItem("notes", JSON.stringify(notes));
  }
});
