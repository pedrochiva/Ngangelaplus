function getNotifySettings() {
  return JSON.parse(localStorage.getItem("notify")) || {
    enabled: true
  };
}


function requestNotifyPermission() {
  if ("Notification" in window && Notification.permission === "default") {
    Notification.requestPermission();
  }
}


function sendNotification(title, body) {
  const settings = getNotifySettings();
  if (!settings.enabled) return;

  if (Notification.permission === "granted") {
    new Notification(title, { body });
  }
}



function checkStreakNotification() {
  const stats = getStats();

  if (stats.streak === 3) {
    sendNotification("🔥 Bom trabalho!", "3 dias seguidos a traduzir!");
  }

  if (stats.streak === 7) {
    sendNotification("🏆 Incrível!", "7 dias seguidos!");
  }
}



function dailyReminder() {
  const last = localStorage.getItem("lastUse");
  const today = new Date().toDateString();

  if (last !== today) {
    sendNotification("👋 Ei!", "Que tal traduzir algo hoje?");
  }
}


function onTranslate() {
  const stats = getStats();
  const today = new Date().toDateString();

  stats.total++;
  stats.daily[today] = (stats.daily[today] || 0) + 1;
  stats.streak++;

  localStorage.setItem("stats", JSON.stringify(stats));
  localStorage.setItem("lastUse", today);

  checkStreakNotification();
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