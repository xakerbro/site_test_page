let currentVariant = null;
let highlightResults = {};
let testData = null;
let currentQuestionIndex = 0;
let userAnswers = {};

document.getElementById("result").textContent = "";
function loadTest(variantNumber) {
  const jsonFile = `tests/variant${variantNumber}.json`;
  fetch(jsonFile)
    .then(response => response.json())
    .then(data => {
      testData = data;
  currentVariant = variantNumber;
  highlightTestButton(variantNumber);
  currentVariant = variantNumber;
      currentQuestionIndex = 0;
      userAnswers = {};
      document.getElementById("result").textContent = "";
highlightResults = {};
      
renderQuestion(currentQuestionIndex);
  renderQuestionNav();
  });
}

function generateMixedTest() {
  const variantCount = 11;
  const promises = [];
  for (let i = 1; i <= variantCount; i++) {
    promises.push(fetch(`tests/variant${i}.json`).then(res => res.json()));
  }

  Promise.all(promises).then(variants => {
    const questions = [];

    // 1–2: берем 0,1 из случайного варианта
    const v1 = getRandomVariant(variants);
    questions.push(v1.questions[0]);
    questions.push(v1.questions[1]);

    // 3–4: берем 2,3
    const v2 = getRandomVariant(variants);
    questions.push(v2.questions[2]);
    questions.push(v2.questions[3]);

    // Остальные (5–22): 4–21
    for (let i = 4; i < 22; i++) {
      const v = getRandomVariant(variants);
      questions.push(v.questions[i]);
    }

    currentVariant = "🎲";
highlightTestButton("🎲");
  testData = {
      title: "Смешанный тест",
      questions: questions
    };

    userAnswers = {};
    document.getElementById("result").textContent = "";
highlightResults = {};
  
    currentQuestionIndex = 0;

    
renderQuestion(currentQuestionIndex);
    renderQuestionNav();
  });
}

function getRandomVariant(variants) {
  const i = Math.floor(Math.random() * variants.length);
  return variants[i];
}



function renderQuestion(index) {
  const container = document.getElementById("test-container");
  container.innerHTML = "";

  const group = getQuestionGroup(index);
  let groupHtml = `<div class="question">`;

group.forEach((qIndex, i) => {

  const q = testData.questions[qIndex];
  let html = `<p><strong>Задание №${qIndex + 1}</strong></p>`;

  let formattedText = q.text
    .split('\n\n')
    .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('');

  formattedText = formattedText.replace(/<input([^>]*?)name=['"]q(\d+)['"]([^>]*?)>/g, (match, before, qIndex, after) => {
    const value = userAnswers[qIndex] !== undefined ? ` value="${userAnswers[qIndex]}"` : "";
    const handler = ` oninput="userAnswers[${qIndex}] = this.value; updateCheckButtonState()"`;
    return `<input${before}name="q${qIndex}"${after}${value}${handler}>`;
  });

  if (formattedText.includes("<table")) {
    const tableIndex = formattedText.indexOf("<table");
    const beforeTable = formattedText.slice(0, tableIndex);
    const tableHtml = formattedText.slice(tableIndex);
    html += beforeTable;
    html += `<div class="separator"></div>`;
    html += tableHtml;
  } else {
    html += formattedText;
    html += `<div class="separator"></div>`;
  }

  if (q.audio) {
    html += `
      <audio controls preload="none">
        <source src="${q.audio}" type="audio/mpeg" />
        Ваш браузер не поддерживает аудио.
      </audio>
    `;
  }

  if (q.options && Array.isArray(q.options)) {
    html += q.options.map((opt, idx) => {
  let className = "";
  const userAnswer = userAnswers[qIndex];
  const correctAnswer = q.correct;

  if (highlightResults[qIndex]) {
    if (userAnswer === correctAnswer) {
      if (idx === correctAnswer) className = "highlight-correct";
    } else {
      if (idx === userAnswer) className = "highlight-wrong";
      if (idx === correctAnswer) className = "highlight-correct";
    }
  }

  const checked = userAnswer !== undefined && userAnswer == idx ? "checked" : "";
  return `
    <label class="${className}">
      <input type="radio" name="q${qIndex}" value="${idx}" ${checked}
        onchange="userAnswers[${qIndex}] = ${idx}; updateCheckButtonState()" />
      ${opt}
    </label>
  `;
}).join('');
  } else if (q.correctText && !q.text.includes("<input")) {
    const val = userAnswers[qIndex] || "";
    const className = highlightResults[qIndex] === 'correct'
      ? "highlight-correct"
      : highlightResults[qIndex] === 'wrong'
      ? "highlight-wrong"
      : "";
    html += `<p><input type="text" name="q${qIndex}" class="custom-input ${className}" value="${val}"
      oninput="userAnswers[${qIndex}] = this.value; updateCheckButtonState()" /></p>`;
  }
  if (i > 0) groupHtml += '<div class="inner-separator"></div>';
  groupHtml += html;
});

container.innerHTML += groupHtml + '</div>';

  renderNavButtons();
  updateQuestionNavHighlight();

  if (currentQuestionIndex === 19) {
    container.innerHTML += `
      <div style="text-align:center; margin-top: 30px;">
        <button id="check-button" onclick="checkAnswers()" disabled>Проверить результат</button>
      </div>
    `;
  }

  // Первый setTimeout: восстановление значений
  setTimeout(() => {
    const inputs = document.querySelectorAll("input");
    inputs.forEach(input => {
      const name = input.name;
      const match = name.match(/^q(\d+)$/);
      if (!match) return;

      const qIndex = parseInt(match[1]);
      const value = userAnswers[qIndex];

      if (input.type === "radio" && parseInt(input.value) === value) {
        input.checked = true;
      } else if (input.type === "text" && value !== undefined) {
        input.value = value;
      }
    });
  }, 0);

  // Второй setTimeout: обновляем кнопку, когда DOM точно готов
  setTimeout(() => {
    updateCheckButtonState();
  }, 50);
}


function getQuestionGroup(index) {
  if (index === 0) return [0, 1];
  if (index === 1) return [2, 3];
  return [index + 2];
}

function renderNavButtons() {
  const nav = document.getElementById("navigation-buttons");
  nav.innerHTML = `
    <button onclick="prevQuestion()" ${currentQuestionIndex === 0 ? "disabled" : ""} aria-label="Предыдущий">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" viewBox="0 0 16 16">
        <path d="M11 1.5a.5.5 0 0 1 .5.5v12a.5.5 0 0 1-.79.407l-7-6a.5.5 0 0 1 0-.814l7-6A.5.5 0 0 1 11 1.5z"/>
      </svg>
    </button>
    <button onclick="nextQuestion()" ${currentQuestionIndex === 19 ? "disabled" : ""} aria-label="Следующий">
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="white" viewBox="0 0 16 16">
        <path d="M5 1.5a.5.5 0 0 1 .79-.407l7 6a.5.5 0 0 1 0 .814l-7 6A.5.5 0 0 1 5 14.5v-12z"/>
      </svg>
    </button>
  `;
}

function renderQuestionNav() {
  const nav = document.getElementById("question-nav");
  nav.innerHTML = "";
  const total = 20;

  for (let i = 0; i < total; i++) {
    const displayNumber = i === 0 ? "1–2" : i === 1 ? "3–4" : i + 3;
    let qIndices;

    if (i === 0) qIndices = [0, 1];
    else if (i === 1) qIndices = [2, 3];
    else qIndices = [i + 2];

    let hasWrong = false;
    let hasCorrect = false;

    for (let qIndex of qIndices) {
      const res = highlightResults[qIndex];
      if (res === "wrong") {
        hasWrong = true;
        break;
      } else if (res === "correct") {
        hasCorrect = true;
      }
    }

    let extraClass = hasWrong ? "nav-wrong" : hasCorrect ? "nav-correct" : "";

    nav.innerHTML += `<button onclick="goTo(${i})" id="qnav-${i}" class="${extraClass}">${displayNumber}</button>`;
  }

  updateQuestionNavHighlight();
}

function updateQuestionNavHighlight() {
  for (let i = 0; i < 20; i++) {
    const btn = document.getElementById(`qnav-${i}`);
    if (btn) {
      btn.classList.toggle("active", i === currentQuestionIndex);
    }
  }
}

function prevQuestion() {
  if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    
renderQuestion(currentQuestionIndex);
  renderQuestionNav();
  }
}

function nextQuestion() {
  if (currentQuestionIndex < 19) {
    currentQuestionIndex++;
    
renderQuestion(currentQuestionIndex);
  renderQuestionNav();
  }
}

function goTo(index) {
  currentQuestionIndex = index;
  
renderQuestion(currentQuestionIndex);
  renderQuestionNav();
  }

function checkAnswers() {
  let correct = 0;
  highlightResults = {};
  

  testData.questions.forEach((q, i) => {
    const userAnswer = userAnswers[i];
    let isCorrect = false;

    if (q.options && typeof q.correct === "number") {
      if (userAnswer === q.correct) {
        correct++;
        isCorrect = true;
      }
    } else if (q.correctText) {
      const correctText = q.correctText.trim().toLowerCase();
      const userText = (userAnswer || "").trim().toLowerCase();
      if (userText === correctText) {
        correct++;
        isCorrect = true;
      }
    }

    highlightResults[i] = isCorrect ? 'correct' : 'wrong';
  });

  const resultElement = document.getElementById("result");
if (resultElement) {
  resultElement.textContent = `Ваш результат: ${correct} из ${testData.questions.length}`;

  function countCorrectInRange(start, end) {
  let correct = 0;
  for (let i = start; i <= end; i++) {
    if (highlightResults[i] === "correct") correct++;
  }
  return correct;
}

function updateThemeBlock(id, correct, total) {
  const block = document.querySelector(id);
  block.querySelector("span").textContent = `${correct} / ${total}`;
  block.classList.remove("theme-correct", "theme-wrong");
  if (correct / total >= 0.5) {
    block.classList.add("theme-correct");
  } else {
    block.classList.add("theme-wrong");
  }
}

updateThemeBlock("#theme-ru", countCorrectInRange(0, 10), 11);
updateThemeBlock("#theme-history", countCorrectInRange(11, 15), 5);
updateThemeBlock("#theme-law", countCorrectInRange(16, 21), 6);
}
  
renderQuestion(currentQuestionIndex);
  renderQuestionNav();
  }


function updateCheckButtonState() {
  const checkBtn = document.getElementById("check-button");
  if (checkBtn) {
    checkBtn.disabled = false;
  }
}

document.addEventListener("input", updateCheckButtonState);
document.addEventListener("change", updateCheckButtonState);

function highlightTestButton(variant) {
  const buttons = document.querySelectorAll("#test-buttons button");
  buttons.forEach(btn => btn.classList.remove("active"));

  const index = typeof variant === "number" ? variant : "🎲";
  buttons.forEach(btn => {
    if (btn.textContent.trim() === String(index)) {
      btn.classList.add("active");
    }
  });
}