"use strict";

(() => {
  const STORAGE_KEY = "hello-github-demo.tasks.v1";
  const MAX_TASK_LENGTH = 160;
  const form = document.querySelector("#task-form");
  const input = document.querySelector("#task-input");
  const list = document.querySelector("#task-list");
  const filters = [...document.querySelectorAll("[data-filter]")];
  const clearButton = document.querySelector("#clear-completed");
  const liveMessage = document.querySelector("#live-message");
  let filter = "all";
  let storageAvailable = true;
  let idCounter = 0;

  function makeId() {
    idCounter += 1;
    return `${Date.now().toString(36)}-${idCounter}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function sampleTasks() {
    return [
      { id: makeId(), text: "开启我的 GitHub 新旅程", completed: true },
      { id: makeId(), text: "亲手运行这个小 Demo", completed: false },
      { id: makeId(), text: "写下今天的一个小目标", completed: false },
    ];
  }

  function showStorageWarning(message) {
    const warning = document.querySelector("#storage-warning");
    warning.textContent = message;
    warning.hidden = false;
  }

  function readTasks() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === null) return sampleTasks();
      const parsed = JSON.parse(saved);
      const ids = new Set();
      if (!Array.isArray(parsed) || !parsed.every((task) => {
        if (!task || typeof task.id !== "string" || !task.id || ids.has(task.id)
          || typeof task.text !== "string" || !task.text.trim()
          || task.text.length > MAX_TASK_LENGTH || typeof task.completed !== "boolean") {
          return false;
        }
        ids.add(task.id);
        return true;
      })) {
        throw new SyntaxError("Invalid saved task format");
      }
      return parsed.map(({ id, text, completed }) => ({ id, text, completed }));
    } catch (error) {
      if (error instanceof SyntaxError) {
        showStorageWarning("本地清单格式无法读取，已载入示例事项。添加或修改任务后将重新保存。");
      } else {
        storageAvailable = false;
        document.querySelector("#storage-label").textContent = "当前仅临时保存";
        showStorageWarning("浏览器暂不允许本地存储。你仍可使用清单，但关闭或刷新页面后，本次修改可能丢失。");
      }
      return sampleTasks();
    }
  }

  let tasks = readTasks();

  function saveTasks() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      storageAvailable = true;
      document.querySelector("#storage-label").textContent = "仅保存在此浏览器";
      document.querySelector("#storage-warning").hidden = true;
    } catch {
      storageAvailable = false;
      document.querySelector("#storage-label").textContent = "当前仅临时保存";
      showStorageWarning("本地存储不可用或空间已满。本次修改仅临时保留，刷新或关闭页面后可能丢失。");
    }
  }

  function announce(message) {
    liveMessage.textContent = message + (storageAvailable ? "" : "。当前修改仅临时保存");
  }

  function visibleTasks() {
    return tasks.filter((task) => filter === "all"
      || (filter === "completed" ? task.completed : !task.completed));
  }

  function render() {
    const completed = tasks.filter((task) => task.completed).length;
    const remaining = tasks.length - completed;
    const percent = tasks.length ? Math.round(completed / tasks.length * 100) : 0;
    const visible = visibleTasks();
    const fragment = document.createDocumentFragment();

    visible.forEach((task) => {
      const item = document.createElement("li");
      item.className = `task-item${task.completed ? " is-completed" : ""}`;
      const label = document.createElement("label");
      label.className = "task-label";
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "task-check";
      checkbox.checked = task.completed;
      checkbox.dataset.id = task.id;
      checkbox.dataset.action = "toggle";
      const text = document.createElement("span");
      text.className = "task-text";
      text.textContent = task.text;
      label.append(checkbox, text);
      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "delete-button";
      deleteButton.dataset.id = task.id;
      deleteButton.dataset.action = "delete";
      deleteButton.setAttribute("aria-label", `删除：${task.text}`);
      deleteButton.title = "删除事项";
      deleteButton.textContent = "×";
      item.append(label, deleteButton);
      fragment.append(item);
    });

    list.replaceChildren(fragment);
    list.hidden = visible.length === 0;
    document.querySelector("#empty-state").hidden = visible.length !== 0;
    const emptyMessages = {
      all: ["留点空白，也很好", "添加第一件小事，开启今天的清单。"],
      active: ["今天的小事，都完成了", "做得很好。歇一会儿，或者再写下一个小目标。"],
      completed: ["好事，正在发生", "完成一个小目标，就能在这里看到它。"],
    };
    const emptyMessage = tasks.length ? emptyMessages[filter] : emptyMessages.all;
    document.querySelector("#empty-title").textContent = emptyMessage[0];
    document.querySelector("#empty-description").textContent = emptyMessage[1];
    document.querySelector("#total-count").textContent = tasks.length;
    document.querySelector("#remaining-count").textContent = `${remaining} 件待完成`;
    document.querySelector("#progress-number").textContent = `${percent}%`;
    const progress = document.querySelector("#task-progress");
    progress.value = percent;
    progress.textContent = `${percent}%`;
    document.querySelector("#progress-detail").textContent = `${tasks.length} 项任务，${completed} 项已完成`;
    document.querySelector("#progress-message").textContent = !tasks.length
      ? "准备好迈出第一步了吗？"
      : remaining === 0 ? "全部完成，给自己一点掌声！" : "每完成一件，离目标更近一点";
    clearButton.disabled = completed === 0;
    filters.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.filter === filter)));
  }

  function focusTask(id, action, fallbackIndex) {
    const controls = [...list.querySelectorAll(`[data-action="${action}"]`)];
    const target = controls.find((control) => control.dataset.id === id)
      || controls[Math.min(fallbackIndex, controls.length - 1)]
      || filters.find((button) => button.dataset.filter === filter);
    target.focus();
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const text = input.value.trim();
    if (!text) {
      input.setCustomValidity("请写下一件想完成的小事。");
      input.reportValidity();
      return;
    }
    tasks.push({ id: makeId(), text: text.slice(0, MAX_TASK_LENGTH), completed: false });
    if (filter === "completed") filter = "all";
    saveTasks();
    render();
    form.reset();
    input.focus();
    list.scrollTop = list.scrollHeight;
    announce(`已添加：${text}`);
  });

  input.addEventListener("input", () => input.setCustomValidity(""));

  filters.forEach((button) => button.addEventListener("click", () => {
    filter = button.dataset.filter;
    render();
    announce(`当前显示${button.textContent.trim()}，共 ${visibleTasks().length} 项`);
  }));

  list.addEventListener("change", (event) => {
    const checkbox = event.target;
    if (!checkbox.matches('[data-action="toggle"]')) return;
    const task = tasks.find((item) => item.id === checkbox.dataset.id);
    if (!task) return;
    const previousIndex = visibleTasks().findIndex((item) => item.id === task.id);
    task.completed = checkbox.checked;
    saveTasks();
    render();
    focusTask(task.id, "toggle", previousIndex);
    announce(`${task.completed ? "已完成" : "恢复待办"}：${task.text}`);
  });

  list.addEventListener("click", (event) => {
    const button = event.target.closest('[data-action="delete"]');
    if (!button) return;
    const index = visibleTasks().findIndex((task) => task.id === button.dataset.id);
    const task = tasks.find((item) => item.id === button.dataset.id);
    if (!task) return;
    tasks = tasks.filter((item) => item.id !== task.id);
    saveTasks();
    render();
    focusTask(null, "delete", index);
    announce(`已删除：${task.text}`);
  });

  clearButton.addEventListener("click", () => {
    const count = tasks.filter((task) => task.completed).length;
    tasks = tasks.filter((task) => !task.completed);
    saveTasks();
    render();
    filters.find((button) => button.dataset.filter === filter).focus();
    announce(`已清除 ${count} 项已完成事项`);
  });

  document.querySelector("#today-label").textContent = new Intl.DateTimeFormat("zh-CN", {
    month: "long", day: "numeric", weekday: "long",
  }).format(new Date());
  render();
})();
