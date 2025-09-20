document.addEventListener("DOMContentLoaded", function () {
  const browserAPI = (typeof browser !== 'undefined') ? browser : (typeof chrome !== 'undefined') ? chrome : null;
  
  if (!browserAPI || !browserAPI.i18n) {
    console.error('Browser extension API not available');
    return;
  }

  function sanitizeHTML(str) {
    if (typeof str !== 'string') return str;
    
    const temp = document.createElement('div');
    temp.textContent = str;
    
    const allowedTags = ['<b>', '</b>', '<strong>', '</strong>', '<i>', '</i>', 
                        '<em>', '</em>', '<u>', '</u>', '<s>', '</s>', '<strike>', '</strike>'];
    
    let sanitized = temp.textContent;
    
    const replacements = {
      '&lt;b&gt;': '<b>',
      '&lt;/b&gt;': '</b>',
      '&lt;strong&gt;': '<strong>',
      '&lt;/strong&gt;': '</strong>',
      '&lt;i&gt;': '<i>',
      '&lt;/i&gt;': '</i>',
      '&lt;em&gt;': '<em>',
      '&lt;/em&gt;': '</em>',
      '&lt;u&gt;': '<u>',
      '&lt;/u&gt;': '</u>',
      '&lt;s&gt;': '<s>',
      '&lt;/s&gt;': '</s>',
      '&lt;strike&gt;': '<strike>',
      '&lt;/strike&gt;': '</strike>'
    };
    
    Object.keys(replacements).forEach(key => {
      sanitized = sanitized.replace(new RegExp(key, 'gi'), replacements[key]);
    });
    
    return sanitized;
  }

  function safeSetHTML(element, htmlContent) {
    element.textContent = '';
    
    if (typeof htmlContent !== 'string') {
      element.textContent = htmlContent || '';
      return;
    }
    
    const sanitizedContent = sanitizeHTML(htmlContent);
    
    const parts = sanitizedContent.split(/(<\/?(?:b|strong|i|em|u|s|strike)>)/i);
    
    let currentElement = element;
    const tagStack = [];
    
    parts.forEach(part => {
      if (!part) return;
      
      const tagMatch = part.match(/^<(\/?)(b|strong|i|em|u|s|strike)>$/i);
      
      if (tagMatch) {
        const isClosing = tagMatch[1] === '/';
        const tagName = tagMatch[2].toLowerCase();
        
        if (isClosing) {
          if (tagStack.length > 0 && tagStack[tagStack.length - 1].tagName === tagName) {
            tagStack.pop();
            currentElement = tagStack.length > 0 ? tagStack[tagStack.length - 1].element : element;
          }
        } else {
          const newElement = document.createElement(tagName);
          currentElement.appendChild(newElement);
          tagStack.push({ tagName, element: newElement });
          currentElement = newElement;
        }
      } else {
        const textNode = document.createTextNode(part);
        currentElement.appendChild(textNode);
      }
    });
  }
  const addNoteButton = document.getElementById("add-note");
  const noteInput = document.getElementById("note-input");
  const notesList = document.getElementById("notes-list");
  const titleElement = document.querySelector("h1");
  const placeholderElement = document.getElementById("note-input");
  const addButtonElement = document.getElementById("add-note");
  const supportButtonElement = document.getElementById("support-button");
  
  titleElement.textContent = browserAPI.i18n.getMessage("title");
  placeholderElement.placeholder = browserAPI.i18n.getMessage("notePlaceholder");
  addButtonElement.textContent = browserAPI.i18n.getMessage("addButton");
  supportButtonElement.textContent = browserAPI.i18n.getMessage("supportButton");

  loadNotes();

  const formatButtons = document.querySelectorAll('.format-btn');
  formatButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      e.preventDefault();
      const command = this.dataset.command;
      document.execCommand(command, false, null);
      noteInput.focus();
      updateFormatButtons();
    });
  });

  function updateFormatButtons() {
    formatButtons.forEach(button => {
      const command = button.dataset.command;
      if (document.queryCommandState(command)) {
        button.classList.add('active');
      } else {
        button.classList.remove('active');
      }
    });
  }

  noteInput.addEventListener('mouseup', updateFormatButtons);
  noteInput.addEventListener('keyup', updateFormatButtons);

  addNoteButton.addEventListener("click", function () {
    const noteText = noteInput.textContent.trim();
    if (noteText !== "" && noteText !== "<br>") {
      const editIndex = addNoteButton.dataset.editIndex;
      if (editIndex !== undefined) {
        saveNoteToLocalStorage(noteText);
        while (notesList.firstChild) {
          notesList.removeChild(notesList.firstChild);
        }
        loadNotes();
      } else {
        const currentTime = new Date().toISOString();
        const noteObj = {
          text: noteText,
          created: currentTime,
          lastModified: currentTime
        };
        addNoteToList(noteObj);
        saveNoteToLocalStorage(noteText);
      }
      noteInput.textContent = "";
    }
  });

  function addNoteToList(noteData, isEditing = false, index = -1) {
    const li = document.createElement("li");
    li.className = "note-item";

    const span = document.createElement("span");
    safeSetHTML(span, typeof noteData === 'string' ? noteData : noteData.text);
    span.className = "note-content";

    const deleteBtn = document.createElement("button");
    deleteBtn.textContent = browserAPI.i18n.getMessage("deleteButton");
    deleteBtn.className = "delete-note";
    deleteBtn.addEventListener("click", function () {
      notesList.removeChild(li);
      deleteNoteFromLocalStorage(index);
    });

    const editBtn = document.createElement("button");
    editBtn.textContent = browserAPI.i18n.getMessage("editButton");
    editBtn.className = "edit-note";
    editBtn.addEventListener("click", function () {
      safeSetHTML(noteInput, typeof noteData === 'string' ? noteData : noteData.text);
      addNoteButton.textContent = browserAPI.i18n.getMessage("saveButton");
      addNoteButton.dataset.editIndex = index;
    });

    const dateElement = document.createElement("span");
    dateElement.className = "note-date";
    
    let displayDate;
    if (typeof noteData === 'string') {
      displayDate = new Date();
    } else {
      displayDate = new Date(noteData.lastModified || noteData.created);
    }
    
    dateElement.textContent = displayDate.toLocaleString();
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
    const currentTime = new Date().toISOString();
    
    if (editIndex !== undefined) {
      const existingNote = notes[editIndex];
      const noteObj = {
        text: noteText,
        created: typeof existingNote === 'string' ? currentTime : existingNote.created,
        lastModified: currentTime
      };
      notes[editIndex] = noteObj;
      addNoteButton.textContent = browserAPI.i18n.getMessage("addButton");
      delete addNoteButton.dataset.editIndex;
    } else {
      const noteObj = {
        text: noteText,
        created: currentTime,
        lastModified: currentTime
      };
      notes.push(noteObj);
    }
    localStorage.setItem("notes", JSON.stringify(notes));
  }

  function loadNotes() {
    let notes = JSON.parse(localStorage.getItem("notes")) || [];
    notes.forEach(function (noteData, index) {
      addNoteToList(noteData, false, index);
    });
  }

  function deleteNoteFromLocalStorage(index) {
    let notes = JSON.parse(localStorage.getItem("notes")) || [];
    notes.splice(index, 1);
    localStorage.setItem("notes", JSON.stringify(notes));
    while (notesList.firstChild) {
      notesList.removeChild(notesList.firstChild);
    }
    loadNotes();
  }
});
