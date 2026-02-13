const customDictionary = JSON.parse(
  localStorage.getItem("customDictionary")
) || {
  "pt-ng": {},
  "ng-pt": {},
  "phrases": {
    "pt-ng": {},
    "ng-pt": {}
  }
};

function getMergedDictionary() {
  return {
    "pt-ng": {
      ...dictionary["pt-ng"],
      ...customDictionary["pt-ng"]
    },
    "ng-pt": {
      ...dictionary["ng-pt"],
      ...customDictionary["ng-pt"]
    },
    "phrases": {
      "pt-ng": {
        ...dictionary.phrases?.["pt-ng"],
        ...customDictionary.phrases["pt-ng"]
      },
      "ng-pt": {
        ...dictionary.phrases?.["ng-pt"],
        ...customDictionary.phrases["ng-pt"]
      }
    }
  };
}

/*Registar tradução*/
function registerTranslation(original, translated, direction) {
  const today = new Date().toISOString().slice(0, 10);

  // Estatísticas diárias e streak
  let stats = JSON.parse(localStorage.getItem("stats")) || {
    daily: {},
    total: 0,
    streak: 0,
    lastDay: null,
    totalTime: 0
  };

  stats.daily[today] = (stats.daily[today] || 0) + 1;
  stats.total++;

  // Lógica de Streak: Aumenta apenas uma vez por dia
  if (stats.lastDay !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (stats.lastDay === yesterday) {
      stats.streak += 1;
    } else {
      stats.streak = 1;
    }
    stats.lastDay = today;
  }

  localStorage.setItem("stats", JSON.stringify(stats));

  // Palavras para histórico e progresso
  let words = JSON.parse(localStorage.getItem("dictionary")) || [];
  
  // Verifica se a palavra já existe para não duplicar no progresso
  const exists = words.find(w => w.original === original);
  if (!exists) {
    words.push({
      original,
      translated,
      direction,
      date: today,
      stats: { learned: false }
    });
    localStorage.setItem("dictionary", JSON.stringify(words));
  }
}

/* ================= DICIONÁRIO ================= */

let dictionaryLoaded = false;
let dictionary = {
  "pt-ng": {},
  "ng-pt": {}
};

fetch("dictionary.json")
  .then(res => res.json())
  .then(data => {
    dictionary = data;
    dictionaryLoaded = true;
    console.log("Dicionário carregado");
  })
  .catch(err => {
    console.error("Erro ao carregar dicionário", err);
  });

let direction = "pt-ng";

/* ================= TEMA ================= */

const themeToggle = document.getElementById("themeToggle");
const savedTheme = localStorage.getItem("theme");

if (savedTheme) {
  document.body.classList.add(savedTheme);
  if (themeToggle) themeToggle.textContent = savedTheme === "dark" ? "☀️" : "🌙";
} else {
  document.body.classList.add("dark");
}

if (themeToggle) {
  themeToggle.onclick = () => {
    const isDark = document.body.classList.contains("dark");
    document.body.classList.toggle("dark", !isDark);
    document.body.classList.toggle("light", isDark);
    const newTheme = isDark ? "light" : "dark";
    themeToggle.textContent = newTheme === "dark" ? "☀️" : "🌙";
    localStorage.setItem("theme", newTheme);
  };
}

/* ================= TRADUTOR ================= */

const fromLang = document.getElementById("fromLang");
const toLang = document.getElementById("toLang");
const inputEl = document.getElementById("inputText");
const outputEl = document.getElementById("outputText");

if (document.getElementById("swap")) {
  document.getElementById("swap").onclick = () => {
    direction = direction === "pt-ng" ? "ng-pt" : "pt-ng";
    fromLang.textContent = direction === "pt-ng" ? "Português" : "Ngangela";
    toLang.textContent = direction === "pt-ng" ? "Ngangela" : "Português";
  };
}

/* ================= HISTÓRICO ================= */

const historyList = document.getElementById("historyList");
const clearBtn = document.getElementById("clearHistory");

let history = JSON.parse(localStorage.getItem("history")) || [];

function renderHistory() {
  if (!historyList) return;
  historyList.innerHTML = "";
  history.forEach(item => {
    const li = document.createElement("li");
    li.innerHTML = `
      <small>${item.from} → ${item.to}</small><br>
      ${item.original} → <strong>${item.translated}</strong>
    `;
    historyList.appendChild(li);
  });
}

if (clearBtn) {
  clearBtn.onclick = () => {
    history = [];
    localStorage.removeItem("history");
    renderHistory();
  };
}

function detectLanguage(text) {
  const merged = getMergedDictionary();
  const words = text.toLowerCase().split(/\s+/);
  let ptScore = 0;
  let ngScore = 0;
  words.forEach(word => {
    if (merged["pt-ng"][word]) ptScore++;
    if (merged["ng-pt"][word]) ngScore++;
  });
  if (ptScore > ngScore) return "pt-ng";
  if (ngScore > ptScore) return "ng-pt";
  return direction;
}

function translateWithPhrases(text, direction) {
  let result = text;
  const phrases = getMergedDictionary().phrases?.[direction] || {};
  Object.keys(phrases)
    .sort((a, b) => b.length - a.length)
    .forEach(phrase => {
      const regex = new RegExp(`\\b${phrase}\\b`, "g");
      result = result.replace(regex, phrases[phrase]);
    });
  return result;
}

/* ================= FUNÇÃO DE TRADUÇÃO ================= */

function traduzir() {
  if (!dictionaryLoaded) {
    outputEl.textContent = "⏳ A carregar dicionário, aguarde...";
    return;
  }
  const input = inputEl.value.toLowerCase().trim();
  if (!input) {
    outputEl.textContent = "Digite algo para traduzir.";
    return;
  }
  direction = detectLanguage(input);
  fromLang.textContent = direction === "pt-ng" ? "Português" : "Ngangela";
  toLang.textContent = direction === "pt-ng" ? "Ngangela" : "Português";
  
  const merged = getMergedDictionary();
  const dict = direction === "pt-ng" ? merged["pt-ng"] : merged["ng-pt"];
  let processed = translateWithPhrases(input, direction);
  const translated = processed
    .split(/\s+/)
    .map(word => dict[word] ?? word)
    .join(" ");
  
  outputEl.textContent = translated;
  
  welcomeNotification();
  
  registerTranslation(input, translated, direction);
  
  history.unshift({
    from: direction === "pt-ng" ? "Português" : "Ngangela",
    to: direction === "pt-ng" ? "Ngangela" : "Português",
    original: input,
    translated
  });
  history = history.slice(0, 20);
  localStorage.setItem("history", JSON.stringify(history));
  renderHistory();
}

renderHistory();

/* ================= VOZ (TTS) ================= */

const speakBtn = document.getElementById("speakBtn");
const stopSpeakBtn = document.getElementById("stopSpeakBtn");
let voices = [];

function loadVoices() {
  voices = window.speechSynthesis.getVoices();
}
window.speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();

function speakText(text, lang) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  let selectedVoice = null;
  if (lang === "pt") {
    selectedVoice = voices.find(v => v.lang.startsWith("pt"));
    utterance.lang = "pt-PT";
  } else {
    selectedVoice = voices.find(v => v.lang.startsWith("en")) || voices.find(v => v.lang.startsWith("pt"));
    utterance.lang = selectedVoice?.lang || "en-US";
  }
  if (selectedVoice) utterance.voice = selectedVoice;
  window.speechSynthesis.speak(utterance);
}

if (speakBtn) {
  speakBtn.onclick = () => {
    const text = outputEl.textContent.trim();
    if (!text || text === "Tradução aparecerá aqui") return;
    const lang = direction === "pt-ng" ? "ng" : "pt";
    speakText(text, lang);
  };
}

if (stopSpeakBtn) {
  stopSpeakBtn.onclick = () => {
    window.speechSynthesis.cancel();
  };
}

/* ================= MODO PROFESSOR ================= */

const saveEntryBtn = document.getElementById("saveEntry");
if (saveEntryBtn) {
  saveEntryBtn.onclick = () => {
    const type = document.getElementById("entryType").value;
    const dir = document.getElementById("entryDirection").value;
    const from = document.getElementById("entryFrom").value.toLowerCase().trim();
    const to = document.getElementById("entryTo").value.toLowerCase().trim();
    if (!from || !to) return alert("Campos vazios!");
    if (type === "word") {
      customDictionary[dir][from] = to;
    } else {
      customDictionary.phrases[dir][from] = to;
    }
    localStorage.setItem("customDictionary", JSON.stringify(customDictionary));
    alert("Guardado com sucesso!");
  };
}

document.addEventListener("DOMContentLoaded", () => {
  
  welcomeNotification();
  
  const openBtn = document.getElementById("openTeacher");
  const closeBtn = document.getElementById("closeTeacher");
  const panel = document.getElementById("teacherPanel");
  if (openBtn && panel) {
    openBtn.onclick = () => panel.classList.remove("hidden");
  }
  if (closeBtn && panel) {
    closeBtn.onclick = () => panel.classList.add("hidden");
  }
  
  const exportBtn = document.getElementById("exportDictionary");
  if (exportBtn) {
    exportBtn.onclick = () => {
      const dataStr = JSON.stringify(customDictionary, null, 2);
      const blob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "dicionario_ngangela.json";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };
  }

  const importInput = document.getElementById("importDictionary");
  if (importInput) {
    importInput.onchange = e => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          const imported = JSON.parse(ev.target.result);
          customDictionary["pt-ng"] = { ...customDictionary["pt-ng"], ...imported["pt-ng"] };
          customDictionary["ng-pt"] = { ...customDictionary["ng-pt"], ...imported["ng-pt"] };
          customDictionary.phrases["pt-ng"] = { ...customDictionary.phrases["pt-ng"], ...imported.phrases["pt-ng"] };
          customDictionary.phrases["ng-pt"] = { ...customDictionary.phrases["ng-pt"], ...imported.phrases["ng-pt"] };
          localStorage.setItem("customDictionary", JSON.stringify(customDictionary));
          alert("Dicionário importado com sucesso!");
        } catch (err) {
          alert("Erro ao importar JSON: " + err.message);
        }
      };
      reader.readAsText(file);
    };
  }
});

/* ================= ESTATÍSTICAS ================= */

function updateStats() {
  const words = JSON.parse(localStorage.getItem("dictionary")) || [];
  const stats = JSON.parse(localStorage.getItem("stats")) || { total: 0, streak: 0, totalTime: 0 };
  
  // Progresso: Consideramos "aprendidas" as palavras traduzidas. 
  // Para uma barra de progresso real, definimos uma meta (ex: 500 palavras)
  const goal = 500; 
  const totalWords = words.length;
  const progress = Math.min(Math.round((totalWords / goal) * 100), 100);
  
  const totalSeconds = stats.totalTime || 0;
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  
  // Atualizar UI
  const progressFill = document.querySelector(".progress-fill");
  const progressValue = document.querySelector(".progress-card .value");
  if (progressFill) progressFill.style.width = progress + "%";
  if (progressValue) progressValue.textContent = progress + "%";
  
  const statWords = document.getElementById("statWords");
  const statLearned = document.getElementById("statLearned");
  const statTime = document.getElementById("statTime");
  const statStreak = document.getElementById("statStreak");
  
  if (statWords) statWords.textContent = totalWords;
  if (statLearned) statLearned.textContent = totalWords; // No momento, traduzida = aprendida
  if (statTime) statTime.textContent = `${hours}h ${minutes}m`;
  if (statStreak) statStreak.textContent = (stats.streak || 0) + " dias";
  
  // Idiomas
  const ptNgCount = words.filter(w => w.direction === "pt-ng").length;
  const ngPtCount = words.filter(w => w.direction === "ng-pt").length;
  const statPtNg = document.getElementById("statPtNg");
  const statNgPt = document.getElementById("statNgPt");
  if (statPtNg) statPtNg.textContent = ptNgCount;
  if (statNgPt) statNgPt.textContent = ngPtCount;
}

const statsPanel = document.querySelector(".stats");
const openStatsBtn = document.getElementById("openStats");
const closeStatsBtn = document.getElementById("closeStats");

if (openStatsBtn) {
  openStatsBtn.onclick = () => {
    updateStats();
    if (typeof renderDailyChart === 'function') renderDailyChart();
    statsPanel.classList.add("show");
  };
}

if (closeStatsBtn) {
  closeStatsBtn.onclick = () => {
    statsPanel.classList.remove("show");
  };
}

// Tracking de tempo
setInterval(() => {
  let stats = JSON.parse(localStorage.getItem("stats")) || { totalTime: 0 };
  stats.totalTime = (stats.totalTime || 0) + 60;
  localStorage.setItem("stats", JSON.stringify(stats));
}, 60000);

if ("Notification" in window) {
  Notification.requestPermission();
}


function welcomeNotification() {

  const alreadySeen = localStorage.getItem("welcomeShown");
  if (alreadySeen) return;

  localStorage.setItem("welcomeShown", "true");

  if (Notification.permission === "granted") {
    new Notification("👋 Bem-vindo ao Ngangela+", {
      body: "Começa a traduzir e aprende todos os dias!"
    });
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        new Notification("👋 Bem-vindo ao Ngangela+", {
          body: "Começa a traduzir e aprende todos os dias!"
        });
      }
    });
  }
}