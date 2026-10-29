// Where the Python API is running
const API_URL = "http://localhost:8005";

// Data the page keeps track of
let questions = [];    // the list of questions from the API
let currentIndex = 0;  // which question is showing in the main area
let editingId = null;  // the id of the question currently being edited

// Grab the HTML elements we need (CSS-style selectors: "#id" or ".class")
const previewList = document.querySelector("#preview-list");
const cardArea = document.querySelector("#card-area");
const errorMessage = document.querySelector("#error-message");
const newQuestion = document.querySelector("#new-question");
const newAnswer = document.querySelector("#new-answer");
const editDialog = document.querySelector("#edit-dialog");
const editQuestion = document.querySelector("#edit-question");
const editAnswer = document.querySelector("#edit-answer");
// TODO: grab references to any necessary elements you added to index.html (search, counter, prev/next buttons)
const prevButton = document.getElementById("prev-button");
const nextButton = document.getElementById("next-button");
const counter = document.getElementById("counter");


// ---------- Errors ----------

function showError(message) {
  errorMessage.textContent = message;
  errorMessage.classList.remove("hidden");
}

function hideError() {
  errorMessage.classList.add("hidden");
}


// ---------- Talking to the API ----------

async function apiGet(path) {
  try {
    const response = await fetch(API_URL + path);
    if (!response.ok) {
      throw new Error("Server returned " + response.status);
    }
    return await response.json();
  } catch (error) {
    showError("Could not reach API: " + error.message);
    return [];
  }
}

async function apiSend(method, path, data) {
  try {
    const response = await fetch(API_URL + path, {
      method: method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    if (!response.ok) {
      throw new Error("Server returned " + response.status);
    }
    return true;
  } catch (error) {
    showError("Could not reach API: " + error.message);
    return false;
  }
}


// ---------- Showing the page ----------

// Get the questions from the API, then redraw everything.
async function renderPage() {
  hideError();
  questions = await apiGet("/questions");
  showPage();
}

// Redraw the sidebar and the main card from the data we already have.
function showPage() {
  // keep currentIndex inside the list (e.g. after a delete)
  if (currentIndex >= questions.length) currentIndex = questions.length - 1;
  if (currentIndex < 0) currentIndex = 0;
  renderPreviews();
  showCard();
}

// Sidebar: one preview per question. Clicking a preview shows that card.
function renderPreviews() {
  previewList.innerHTML = "";
  questions.forEach(function (question, index) {
    const preview = document.createElement("div");
    preview.className = "preview";
    if (index === currentIndex) {
      preview.classList.add("active");
    }
    preview.textContent = question.q;
    preview.addEventListener("click", function () {
      currentIndex = index;
      showPage();
    });
    previewList.append(preview);
  });
}

// Create a card to represent current question/answer (stored at questions[currentIndex])
function showCard() {
  cardArea.innerHTML = "";
  if (questions.length === 0) {
    cardArea.textContent = "No questions to show.";
    return;
  }
  const question = questions[currentIndex];

  const card = document.createElement("div");
  card.className = "card";

  const deleteButton = document.createElement("button");
  deleteButton.textContent = "Delete";
  deleteButton.addEventListener("click", function () {
    deleteQuestion(question);
  });
    //https://www.wikihow.tech/Change-Button-Color-in-Javascript
    deleteButton.style.backgroundColor = "#E34A2D";

  const editButton = document.createElement("button");
  editButton.textContent = "Edit";
  editButton.addEventListener("click", function () {
    openEditDialog(question);
  });
    editButton.style.backgroundColor = "#FADF75";
    
  const questionText = document.createElement("p");
  questionText.className = "question";
  questionText.textContent = question.q;

  const answerText = document.createElement("p");
  answerText.className = "answer hidden";
  answerText.textContent = question.a;

  questionText.addEventListener("click", function () {
    answerText.classList.toggle("hidden");
  });
    
    const hintText = document.createElement("p");
    hintText.className = "hint";
    hintText.textContent = "(click question to reveal answer)";
    
    //const prevButton = document.createElement("button");
//    prevButton.textContent = "Previous";
//    prevButton.addEventListener("click", function () {
//      prevCard();
//    });
    
    //counter.textContent = "test content";
    
    //const nextButton = document.createElement("button");
//    nextButton.textContent = "Next";
//    nextButton.addEventListener("click", function () {
//      nextCard();
//    });

  card.append(questionText, answerText, hintText, deleteButton, editButton);
  cardArea.append(card);
    
  updateCounter()
    
}


// ---------- Navigation and search ----------

// TODO: Previous / Next. Write functions that change currentIndex to the appropriate value
// (wrapping around at both ends) and then call showPage(). Then write event listeners to attach these
// functions to the appropriate Previous/Next buttons. 
function prevCard() {
    if (questions.length === 0) {
        return;
    }
    
    currentIndex = ((currentIndex - 1) % questions.length);
    //updateCounter()
    showPage();
}

function nextCard() {
    if (questions.length === 0) {
        return;
    }
    
    currentIndex = ((currentIndex + 1) % questions.length);
    //updateCounter()
    showPage();
}

//https://www.w3schools.com/jsref/met_document_addeventlistener.asp
prevButton.addEventListener("click", prevCard);
nextButton.addEventListener("click", nextCard);

// TODO: Update the progress text ("Card 3 of 3") in the counter whenever the card changes.
function updateCounter() {
    //add one so it goes from 1 to total instead of 0 to 1 less than totla
    counter.textContent = "Card " + (currentIndex + 1) + " of " + questions.length;
}


// ---------- Actions ----------

async function deleteQuestion(question) {
  await apiSend("DELETE", "/delete/" + question.id);
  renderPage();
}

function openEditDialog(question) {
  editingId = question.id;
  editQuestion.value = question.q;
  editAnswer.value = question.a;
  editDialog.showModal();
}

document.querySelector("#close-dialog").addEventListener("click", function () {
  editDialog.close();
});

document.querySelector("#update-button").addEventListener("click", async function () {
  editDialog.close();
  await apiSend("PUT", "/update/" + editingId, {
    question: editQuestion.value,
    answer: editAnswer.value
  });
  renderPage();
});

document.querySelector("#add-button").addEventListener("click", async function () {
    if (newQuestion.value != "" && newAnswer.value != "") {
        await apiSend("POST", "/add", {
          question: newQuestion.value,
          answer: newAnswer.value
        });
        newQuestion.value = "";
        newAnswer.value = "";
        currentIndex = questions.length;
        renderPage();
    }
  
});


// ---------- Start the app ----------
renderPage();
