"use strict";

(() => {
  const SETTINGS_KEY = "codextest.pomodoro.settings.v1";
  const STATS_KEY = "codextest.pomodoro.stats.v1";
  const DEFAULTS = { focus: 25, short: 5, long: 15 };
  const MODES = {
    focus: { name: "专注", caption: "现在，只做一件事", detail: "往前走一小步" },
    short: { name: "短休息", caption: "让注意力，轻轻放松", detail: "起身，给自己一点空白" },
    long: { name: "长休息", caption: "好好休息，再慢慢出发", detail: "这一刻，安心放松" },
  };
  const byId = (id) => document.getElementById(id);
  const modeButtons = [...document.querySelectorAll("[data-mode]")];
  const settingInputs = {
    focus: byId("focus-minutes"), short: byId("short-minutes"), long: byId("long-minutes"),
  };
  let storageAvailable = true;

  function localDate(timestamp = Date.now()) {
    const date = new Date(timestamp);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  }

  function emptyStats() {
    return { date: localDate(), sessions: 0, minutes: 0 };
  }

  function warnStorage() {
    storageAvailable = false;
    byId("storage-label").textContent = "当前设置与统计仅临时保留";
    byId("storage-warning").textContent = "浏览器本地存储暂不可用。计时仍可使用，本次设置与统计可能在刷新或关闭后丢失。";
    byId("storage-warning").hidden = false;
  }

  function readStored(key, fallback, validate) {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      const parsed = JSON.parse(raw);
      if (!validate(parsed)) throw new SyntaxError("Invalid saved data");
      return parsed;
    } catch (error) {
      if (error instanceof SyntaxError) {
        byId("storage-warning").textContent = "部分本地数据无法读取，已使用默认值。保存设置或完成专注后会重新保存对应数据。";
        byId("storage-warning").hidden = false;
      } else {
        warnStorage();
      }
      return fallback;
    }
  }

  function validSettings(value) {
    return value && Object.keys(DEFAULTS).every((key) =>
      Number.isInteger(value[key]) && value[key] >= 1 && value[key] <= 120);
  }

  function validStats(value) {
    return value && typeof value.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.date)
      && Number.isSafeInteger(value.sessions) && value.sessions >= 0
      && Number.isSafeInteger(value.minutes) && value.minutes >= 0;
  }

  const storedSettings = readStored(SETTINGS_KEY, DEFAULTS, validSettings);
  let settings = Object.fromEntries(Object.keys(DEFAULTS).map((key) => [key, storedSettings[key]]));
  const storedStats = readStored(STATS_KEY, emptyStats(), validStats);
  let stats = { date: storedStats.date, sessions: storedStats.sessions, minutes: storedStats.minutes };
  let mode = "focus";
  let state = "ready";
  let sessionMinutes = settings.focus;
  let totalMs = sessionMinutes * 60_000;
  let remainingMs = totalMs;
  let deadline = null;
  let completedFocusInVisit = 0;
  let nextMode = "short";
  let lastRenderedDay = "";

  function saveStored(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      warnStorage();
      return false;
    }
  }

  function announce(message) {
    byId("live-message").textContent = message;
  }

  function renderStats() {
    const today = localDate();
    const current = stats.date === today ? stats : emptyStats();
    byId("today-count").textContent = current.sessions;
    byId("today-minutes").textContent = current.minutes;
    byId("today-date").textContent = new Intl.DateTimeFormat("zh-CN", { month: "long", day: "numeric" }).format(new Date());
    lastRenderedDay = today;
  }

  function renderTime() {
    const seconds = Math.ceil(Math.max(0, remainingMs) / 1000);
    const minutesPart = Math.floor(seconds / 60);
    const secondsPart = seconds % 60;
    const display = `${String(minutesPart).padStart(2, "0")}:${String(secondsPart).padStart(2, "0")}`;
    byId("time-display").textContent = display;
    byId("time-display").setAttribute("aria-label", `剩余时间 ${minutesPart} 分 ${secondsPart} 秒`);
    byId("ring-progress").style.strokeDashoffset = String(100 * (1 - remainingMs / totalMs));
    document.title = state === "ready" ? "一刻 · 番茄钟" : `${display} · ${MODES[mode].name} · 一刻`;
    if (lastRenderedDay !== localDate()) renderStats();
  }

  function renderControls() {
    document.body.dataset.mode = mode;
    modeButtons.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.mode === mode)));
    byId("mode-caption").textContent = MODES[mode].caption;
    byId("clock-detail").textContent = state === "completed" ? "这一轮结束了，做得很好" : `${sessionMinutes} 分钟，${MODES[mode].detail}`;
    const labels = { ready: "准备开始", running: "计时中", paused: "已暂停", completed: "已完成" };
    byId("timer-status").textContent = labels[state];
    byId("start-label").textContent = state === "running" ? "暂停计时"
      : state === "paused" ? "继续计时" : state === "completed" ? "再来一轮" : `开始${MODES[mode].name}`;
    byId("start-button").firstElementChild.textContent = state === "running" ? "Ⅱ" : "▶";
    byId("next-session").hidden = state !== "completed";
    renderTime();
  }

  function resetTimer(selectedMode = mode) {
    mode = selectedMode;
    state = "ready";
    deadline = null;
    sessionMinutes = settings[mode];
    totalMs = sessionMinutes * 60_000;
    remainingMs = totalMs;
    renderControls();
  }

  function completeTimer() {
    if (state !== "running") return;
    const completionDay = localDate(deadline);
    state = "completed";
    remainingMs = 0;
    deadline = null;
    if (mode === "focus") {
      if (stats.date !== completionDay) stats = { date: completionDay, sessions: 0, minutes: 0 };
      stats.sessions += 1;
      stats.minutes += sessionMinutes;
      saveStored(STATS_KEY, stats);
      completedFocusInVisit += 1;
      nextMode = completedFocusInVisit % 4 === 0 ? "long" : "short";
      byId("next-message").textContent = nextMode === "long" ? "又完成了 4 轮专注，给自己一个长休息。" : "专注已计入完成当天的统计。休息一下，再继续出发。";
      if (!storageAvailable) byId("next-message").textContent = "已完成一轮专注。当前统计仅临时保留，休息一下吧。";
    } else {
      nextMode = "focus";
      byId("next-message").textContent = "休息结束。准备好了，再开始下一段专注。";
    }
    byId("next-button").textContent = nextMode === "focus" ? "准备下一段专注 →" : `准备${MODES[nextMode].name} →`;
    renderStats();
    renderControls();
    announce(`${MODES[mode].name}结束。${byId("next-message").textContent}`);
  }

  function updateClock() {
    if (state === "running") {
      remainingMs = Math.min(totalMs, Math.max(0, deadline - Date.now()));
      if (remainingMs === 0) {
        completeTimer();
        return;
      }
    }
    renderTime();
  }

  byId("start-button").addEventListener("click", () => {
    if (state === "running") {
      updateClock();
      if (state === "completed") return;
      state = "paused";
      deadline = null;
      announce("计时已暂停。");
    } else {
      if (state === "completed") resetTimer();
      deadline = Date.now() + remainingMs;
      state = "running";
      announce(`${MODES[mode].name}计时已开始。`);
    }
    renderControls();
  });

  byId("reset-button").addEventListener("click", () => {
    updateClock();
    resetTimer();
    announce(`已重置${MODES[mode].name}，当前时长 ${sessionMinutes} 分钟。`);
  });

  modeButtons.forEach((button) => button.addEventListener("click", () => {
    if (button.dataset.mode === mode) return;
    updateClock();
    resetTimer(button.dataset.mode);
    announce(`已切换至${MODES[mode].name}，计时已重置为 ${sessionMinutes} 分钟。`);
  }));

  byId("next-button").addEventListener("click", () => {
    resetTimer(nextMode);
    byId("start-button").focus();
    announce(`已准备${MODES[mode].name}，点击开始后计时。`);
  });

  Object.keys(DEFAULTS).forEach((key) => {
    settingInputs[key].value = settings[key];
    settingInputs[key].addEventListener("input", () => {
      settingInputs[key].setCustomValidity("");
      byId("settings-feedback").hidden = true;
    });
  });

  byId("settings-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const values = {};
    for (const key of Object.keys(DEFAULTS)) {
      const value = Number(settingInputs[key].value);
      if (!Number.isInteger(value) || value < 1 || value > 120) {
        settingInputs[key].setCustomValidity("请输入 1 到 120 之间的整数分钟。");
        settingInputs[key].reportValidity();
        return;
      }
      values[key] = value;
    }
    settings = values;
    const saved = saveStored(SETTINGS_KEY, settings);
    byId("settings-feedback").textContent = saved
      ? "设置已保存。当前计时保持不变，切换模式、重置或下一轮时生效。"
      : "设置已临时更新。当前计时保持不变，刷新或关闭后可能丢失。";
    byId("settings-feedback").hidden = false;
  });

  document.addEventListener("visibilitychange", updateClock);
  window.addEventListener("pageshow", updateClock);
  setInterval(updateClock, 250);
  renderStats();
  renderControls();
})();
