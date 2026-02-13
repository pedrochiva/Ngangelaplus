let dailyChart;

function getStats() {
  return JSON.parse(localStorage.getItem("stats")) || {
    daily: {},
    total: 0,
    streak: 0
  };
}

function renderDailyChart() {
  const stats = getStats();
  const days = Object.keys(stats.daily);
  const values = Object.values(stats.daily);

  const ctx = document.getElementById("dailyChart").getContext("2d");

  if (dailyChart) dailyChart.destroy();

  dailyChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: days,
      datasets: [{
        data: values,
        borderWidth: 2,
        tension: 0.4
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      responsive: true
    }
  });
}