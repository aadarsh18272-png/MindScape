console.log("MINDSCAPE SCRIPT LOADED");
"use strict";

/* =========================================================
   MINDSCAPE
   Central application state
   ========================================================= */

const STORAGE_KEY = "mindscape_v2";
const API_BASE_URL = "http://localhost:5000";

function getAuthToken() {
    return localStorage.getItem("mindscape_token");
}

const DEFAULT_DATA = {
    settings: {
        focusDuration: 25,
        shortBreak: 5,
        longBreak: 15,
        dailyGoal: 120,
        theme: "dark",
        environment: "ice",
        soundEnabled: true,
        volume: 50
    },

    tasks: [],

    subjects: [],

    flashcards: [
        {
            id: "demo-1",
            question: "What is an algorithm?",
            answer: "A finite sequence of well-defined steps used to solve a problem or perform a computation.",
            category: "Computer Science",
            reviews: 0
        }
    ],

    sessions: [],

    distractions: [],

    achievements: [],

    timer: {
        duration: 25 * 60,
        remaining: 25 * 60,
        running: false,
        mode: "focus",
        intention: "",
        environment: "ice"
    }
};

let data = loadData();

let timerState = {
    endTimestamp: null,
    lastRenderedSecond: null,
    animationFrame: null
};

let audioState = {
    context: null,
    masterGain: null,
    nodes: [],
    currentSound: "lofi",
    muted: false
};

let flashcardIndex = 0;

/* =========================================================
   STORAGE
   ========================================================= */

function cloneDefaultData() {
    return JSON.parse(JSON.stringify(DEFAULT_DATA));
}

function loadData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);

        if (!raw) {
            return cloneDefaultData();
        }

        const parsed = JSON.parse(raw);

        return {
            ...cloneDefaultData(),
            ...parsed,
            settings: {
                ...DEFAULT_DATA.settings,
                ...(parsed.settings || {})
            },
            timer: {
                ...DEFAULT_DATA.timer,
                ...(parsed.timer || {})
            },
            tasks: Array.isArray(parsed.tasks) ? parsed.tasks : [],
            subjects: Array.isArray(parsed.subjects) ? parsed.subjects : [],
            flashcards: Array.isArray(parsed.flashcards)
                ? parsed.flashcards
                : DEFAULT_DATA.flashcards,
            sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
            distractions: Array.isArray(parsed.distractions)
                ? parsed.distractions
                : [],
            achievements: Array.isArray(parsed.achievements)
                ? parsed.achievements
                : []
        };
    } catch (error) {
        console.error("Mindscape storage error:", error);
        return cloneDefaultData();
    }
}

function saveData() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
        console.error("Could not save Mindscape data:", error);
    }
}

/* =========================================================
   DOM HELPERS
   ========================================================= */

function $(selector) {
    return document.querySelector(selector);
}

function $$(selector) {
    return Array.from(document.querySelectorAll(selector));
}

/* =========================================================
   INITIALIZATION
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM READY");

    setupAuthentication();

    console.log("AUTH INITIALIZED");
});

function init() {
    console.log("INIT START");

    applySettings();

    bindNavigation();
    bindTimerControls();
    bindTaskControls();
    bindStudyControls();
    bindFlashcardControls();
    bindTools();
    bindAI();
    bindSound();
    bindSettings();
    bindKeyboardShortcuts();

    setupAuthentication();

    renderDashboard();
    renderTasks();
    renderSubjects();
    renderFlashcard();
    renderDistractions();
    renderAnalytics();
    renderAchievements();

    updateTimerDisplay();
    updateEnvironment(0);
    updateEnvironmentSelection();

    setDate();
    updateGreeting();

    console.log("INIT COMPLETE");
    const logoutBtn = document.getElementById("logoutBtn");
    console.log("AUTH ELEMENTS:", {
    loginForm,
    registerForm,
    showRegisterBtn,
    showLoginBtn,
    logoutBtn
});

logoutBtn?.addEventListener("click", () => {
    localStorage.removeItem("mindscape_token");

    hideLoginScreen();

    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    if (loginForm) {
        loginForm.hidden = false;
        loginForm.reset();
    }

    if (registerForm) {
        registerForm.hidden = true;
        registerForm.reset();
    }

    const loginError =
        document.getElementById("loginError");

    const registerError =
        document.getElementById("registerError");

    if (loginError) {
        loginError.textContent = "";
    }

    if (registerError) {
        registerError.textContent = "";
    }

    showLoginScreen();
});
}

/* =========================================================
   NAVIGATION
   ========================================================= */

function bindNavigation() {
    $$("[data-page]").forEach(button => {
        button.addEventListener("click", () => {
            const page = button.dataset.page;

            if (!page) return;

            showPage(page);
        });
    });

    const mobileMenu = $("#mobileMenuBtn");

    if (mobileMenu) {
        mobileMenu.addEventListener("click", () => {
            $("#sidebar").classList.toggle("open");
            mobileMenu.setAttribute(
                "aria-expanded",
                String($("#sidebar").classList.contains("open"))
            );
        });
    }
}

function showPage(pageName) {
    $$(".page").forEach(page => {
        page.classList.toggle(
            "active",
            page.id === `page-${pageName}`
        );
    });

    $$(".nav-item").forEach(item => {
        item.classList.toggle(
            "active",
            item.dataset.page === pageName
        );
        if (item.dataset.page) {
            item.setAttribute(
                "aria-current",
                item.dataset.page === pageName ? "page" : "false"
            );
        }
    });

    const sidebar = $("#sidebar");

    if (sidebar) {
        sidebar.classList.remove("open");
    }

    if (pageName === "dashboard") {
        renderDashboard();
    }

    if (pageName === "analytics") {
        renderAnalytics();
    }

    if (pageName === "achievements") {
        renderAchievements();
    }
}

/* =========================================================
   DATE / GREETING
   ========================================================= */

function setDate() {
    const element = $("#currentDate");

    if (!element) return;

    const date = new Date();

    element.textContent = date.toLocaleDateString(undefined, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}

function updateGreeting() {
    const hour = new Date().getHours();

    let greeting = "Good evening.";

    if (hour < 12) {
        greeting = "Good morning.";
    } else if (hour < 18) {
        greeting = "Good afternoon.";
    }

    const element = $("#greeting");

    if (element) {
        element.textContent = greeting;
    }
}

/* =========================================================
   TIMER
   ========================================================= */

function bindTimerControls() {
    $$(".preset-btn[data-duration]").forEach(button => {
        button.addEventListener("click", () => {
            const minutes = Number(button.dataset.duration);

            setTimerDuration(minutes * 60);
        });
    });

    $("#customDurationBtn")?.addEventListener("click", () => {
        openModal("customTimerModal");
    });

    $("#applyCustomTimer")?.addEventListener("click", applyCustomDuration);

    $("#timerStartBtn")?.addEventListener("click", toggleTimer);

    $("#timerResetBtn")?.addEventListener("click", resetTimer);

    $("#focusIntention")?.addEventListener("input", event => {
        data.timer.intention = event.target.value;
        saveData();
        updateIntentionDisplay();
    });

    $$(".environment-option").forEach(button => {
        button.addEventListener("click", () => {
            setEnvironment(button.dataset.environment);
        });
    });
}

function setTimerDuration(seconds) {
    if (data.timer.running) {
        showToast("Pause or reset the session before changing duration.");
        return;
    }

    if (!Number.isFinite(seconds) || seconds < 60) {
        return;
    }

    data.timer.duration = seconds;
    data.timer.remaining = seconds;
    data.timer.mode = "focus";

    saveData();

    $$(".preset-btn").forEach(button => {
        button.classList.toggle(
            "active",
            Number(button.dataset.duration) * 60 === seconds
        );
    });

    updateTimerDisplay();
    updateEnvironment(0);
}

function applyCustomDuration() {
    const hours = Number($("#customHours").value) || 0;
    const minutes = Number($("#customMinutes").value) || 0;

    const totalMinutes = hours * 60 + minutes;

    if (totalMinutes < 1) {
        $("#customTimerError").textContent =
            "Enter a duration greater than zero.";
        return;
    }

    if (totalMinutes > 720) {
        $("#customTimerError").textContent =
            "Maximum custom duration is 12 hours.";
        return;
    }

    $("#customTimerError").textContent = "";

    setTimerDuration(totalMinutes * 60);
    closeModals();
}

function toggleTimer() {
    if (data.timer.running) {
        pauseTimer();
    } else {
        startTimer();
    }
}

function startTimer() {
    if (data.timer.remaining <= 0) {
        data.timer.remaining = data.timer.duration;
    }

    if (data.timer.mode === "focus") {
        data.timer.intention =
            $("#focusIntention").value.trim();
    }

    data.timer.running = true;

    timerState.endTimestamp =
        Date.now() + data.timer.remaining * 1000;

    saveData();

    updateTimerButton();
    updateTimerDisplay();
    startEnvironmentAnimation();

    if (
        data.settings.soundEnabled &&
        audioState.currentSound
    ) {
        startSound(audioState.currentSound);
    }

    requestTimerFrame();
}

function pauseTimer() {
    if (!data.timer.running) return;

    const remaining = Math.max(
        0,
        Math.ceil(
            (timerState.endTimestamp - Date.now()) / 1000
        )
    );

    data.timer.remaining = remaining;
    data.timer.running = false;

    cancelAnimationFrame(timerState.animationFrame);

    saveData();

    updateTimerButton();
    updateTimerDisplay();
    updateEnvironment(getProgress());

    stopSound();

    $("#timerState").textContent = "Paused";
}

function resetTimer() {
    data.timer.running = false;
    data.timer.mode = "focus";
    data.timer.remaining = data.timer.duration;

    cancelAnimationFrame(timerState.animationFrame);

    timerState.endTimestamp = null;

    saveData();

    updateTimerButton();
    updateTimerDisplay();
    updateEnvironment(0);

    stopSound();

    $("#timerState").textContent = "Ready";
}

function requestTimerFrame() {
    cancelAnimationFrame(timerState.animationFrame);

    function frame() {
        if (!data.timer.running) return;

        const remaining = Math.max(
            0,
            Math.ceil(
                (timerState.endTimestamp - Date.now()) / 1000
            )
        );

        data.timer.remaining = remaining;

        if (
            timerState.lastRenderedSecond !== remaining
        ) {
            timerState.lastRenderedSecond = remaining;

            updateTimerDisplay();
            updateEnvironment(getProgress());
        }

        if (remaining <= 0) {
            completeTimer();
            return;
        }

        timerState.animationFrame =
            requestAnimationFrame(frame);
    }

    frame();
}

function completeTimer() {
    data.timer.remaining = 0;
    data.timer.running = false;

    cancelAnimationFrame(timerState.animationFrame);

    if (data.timer.mode === "focus") {
        completeFocusSession();
    } else {
        finishBreak();
    }

    saveData();

    updateTimerButton();
    updateTimerDisplay();
    stopSound();

    playCompletionSound();

    if ("Notification" in window &&
        Notification.permission === "granted") {
        new Notification("Mindscape", {
            body: data.timer.mode === "focus"
                ? "Focus session complete. Great work."
                : "Break complete. Ready when you are."
        });
    }
}

function completeFocusSession() {
    const minutes = Math.max(
        1,
        Math.round(data.timer.duration / 60)
    );
    const token = getAuthToken();

    
if (token) {
    fetch(`${API_BASE_URL}/api/focus`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
            subject: data.timer.intention || "Focus Session",
            duration: minutes,
            startTime: new Date(
                Date.now() - data.timer.duration * 1000
            ).toISOString(),
            endTime: new Date().toISOString(),
            status: "completed"
        })
    })
    .then(async (response) => {
        const result = await response.json();

        if (!response.ok) {
            throw new Error(
                result.message || "Failed to save focus session"
            );
        }

        console.log(
            "Focus session saved to backend:",
            result
        );
    })
    .catch((error) => {
        console.error(
            "Backend focus session error:",
            error
        );
    });
}

    data.sessions.push({
        id: createId(),
        date: getDateKey(new Date()),
        timestamp: Date.now(),
        minutes,
        intention: data.timer.intention || "Focus session",
        environment: data.timer.environment
    });

    updateStreakAfterSession();
    checkAchievements();

    showToast(
        `Focus complete — ${minutes} minutes added to your progress.`
    );

    data.timer.mode = "focus";
    data.timer.remaining = data.timer.duration;

    updateEnvironment(1);

    renderDashboard();
    renderAnalytics();
    renderAchievements();
}

function finishBreak() {
    showToast("Break complete. Time to refocus.");

    data.timer.mode = "focus";
    data.timer.remaining = data.timer.duration;

    updateEnvironment(0);
}

function startBreak(minutes) {
    if (data.timer.running) {
        pauseTimer();
    }

    data.timer.mode = "break";
    data.timer.duration = minutes * 60;
    data.timer.remaining = minutes * 60;

    saveData();

    updateTimerDisplay();
    updateTimerButton();
    updateEnvironment(0);

    startTimer();

    $("#timerState").textContent =
        "Break — stretch, hydrate, rest your eyes";
}

function getProgress() {
    if (data.timer.mode !== "focus") {
        return 0;
    }

    if (data.timer.duration <= 0) {
        return 0;
    }

    return Math.min(
        1,
        Math.max(
            0,
            1 - (
                data.timer.remaining /
                data.timer.duration
            )
        )
    );
}

function updateTimerDisplay() {
    const display = $("#timerDisplay");

    if (!display) return;

    display.textContent =
        formatTime(data.timer.remaining);

    updateTimerButton();
    updateIntentionDisplay();
}

function formatTime(totalSeconds) {
    const seconds = Math.max(
        0,
        Math.floor(totalSeconds)
    );

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
        return [
            String(hours).padStart(2, "0"),
            String(minutes).padStart(2, "0"),
            String(secs).padStart(2, "0")
        ].join(":");
    }

    return [
        String(minutes).padStart(2, "0"),
        String(secs).padStart(2, "0")
    ].join(":");
}

function updateTimerButton() {
    const button = $("#timerStartBtn");

    if (!button) return;

    if (data.timer.running) {
        button.textContent = "Pause";
    } else if (
        data.timer.remaining <
        data.timer.duration
    ) {
        button.textContent = "Resume";
    } else {
        button.textContent =
            data.timer.mode === "break"
                ? "Start Break"
                : "Start Focus";
    }
}

function updateIntentionDisplay() {
    const input = $("#focusIntention");
    const display = $("#intentionDisplay");

    if (!input || !display) return;

    if (document.activeElement !== input &&
        input.value !== data.timer.intention) {
        input.value = data.timer.intention || "";
    }

    display.textContent =
        data.timer.intention ||
        "Ready for your next session";
}

/* =========================================================
   ENVIRONMENTS
   ========================================================= */

function setEnvironment(environment) {
    const allowed = [
        "ice",
        "candle",
        "tree",
        "campfire"
    ];

    if (!allowed.includes(environment)) {
        return;
    }

    data.timer.environment = environment;
    data.settings.environment = environment;

    saveData();

    updateEnvironmentSelection();
    updateEnvironment(getProgress());
}

function updateEnvironmentSelection() {
    $$(".environment-option").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.environment ===
            data.timer.environment
        );
    });

    const setting = $("#settingEnvironment");

    if (setting) {
        setting.value = data.settings.environment;
    }
}

function updateEnvironment(progress) {
    progress = Math.min(1, Math.max(0, progress));

    if (data.timer.mode === "break") {
        progress = 0;
    }

    const environment =
        data.timer.environment || "ice";

    $$(".environment-scene").forEach(scene => {
        scene.classList.remove("active");
    });

    const sceneIdMap = {
        ice: "iceScene",
        candle: "candleScene",
        tree: "treeScene",
        campfire: "fireScene"
    };

    const scene = $(`#${sceneIdMap[environment]}`);

    if (scene) {
        scene.classList.add("active");
    }

    // keep the rest of your existing updateEnvironment()
    // code exactly as it is

    const percent = $("#environmentPercent");

    if (percent) {
        percent.textContent =
            `${Math.round(progress * 100)}%`;
    }

    const name = $("#environmentName");

    const names = {
        ice: "Frozen Focus",
        candle: "Quiet Flame",
        tree: "Growing Mind",
        campfire: "Deep Fire"
    };

    if (name) {
        name.textContent =
            names[environment] || "Focus Environment";
    }

    if (environment === "ice") {
        updateIce(progress);
    }

    if (environment === "candle") {
        updateCandle(progress);
    }

    if (environment === "tree") {
        updateTree(progress);
    }

    if (environment === "campfire") {
        updateFire(progress);
    }
}

function startEnvironmentAnimation() {
    updateEnvironment(getProgress());
}

function updateIce(progress) {
    const block = $("#iceBlock");
    const water = $("#iceWater");

    if (!block || !water) return;

    const remaining = 1 - progress;

    block.style.height =
        `${Math.max(8, 190 * remaining)}px`;

    block.style.width =
        `${Math.max(20, 220 * (0.35 + remaining * 0.65))}px`;

    block.style.opacity =
        `${Math.max(0, remaining)}`;

    block.style.transform =
        `scale(${0.82 + remaining * 0.18})`;

    block.style.borderRadius =
        `${25 + progress * 30}px ${50 - progress * 20}px ${25 + progress * 30}px ${45 - progress * 20}px`;

    water.style.transform =
        `scaleX(${0.35 + progress * 0.9})`;

    $$(".ice-crack").forEach((crack, index) => {
        const threshold = [0.25, 0.35, 0.45][index];
        crack.style.opacity =
            progress >= threshold
                ? Math.min(1, (progress - threshold) * 5)
                : 0;
    });

    $$(".ice-droplet").forEach((drop, index) => {
        const threshold = 0.3 + index * 0.08;

        drop.style.opacity =
            progress > threshold
                ? Math.min(1, (progress - threshold) * 5)
                : 0;

        drop.style.transform =
            progress > threshold
                ? `translateY(${progress * 35}px)`
                : "translateY(0)";
    });

    let status = "Solid";

    if (progress >= 0.8) {
        status = "Almost melted";
    } else if (progress >= 0.6) {
        status = "Melting";
    } else if (progress >= 0.4) {
        status = "Cracking";
    } else if (progress >= 0.2) {
        status = "Softening";
    }

    $("#iceStatus").textContent = status;
}

function updateCandle(progress) {
    const body = $("#candleBody");
    const flame = $(".candle-scene .flame");

    if (!body || !flame) return;

    const remaining = 1 - progress;

    body.style.height =
        `${Math.max(35, 230 * remaining)}px`;

    flame.style.bottom =
        `${Math.max(48, 245 * remaining)}px`;

    const flameScale =
        0.7 + remaining * 0.3;

    flame.style.transform =
    `translateX(-50%) rotate(45deg) scale(${scale})`;

    let status = "Fresh";

    if (progress >= 0.8) {
        status = "Almost burned";
    } else if (progress >= 0.55) {
        status = "Burning";
    } else if (progress >= 0.25) {
        status = "Melting";
    }

    $("#candleStatus").textContent = status;
}

function updateTree(progress) {
    const tree = $("#treeWorld");

    if (!tree) return;

    const scale =
        0.12 + progress * 0.88;

    tree.style.transform =
        `translateX(-50%) scale(${scale})`;

    let status = "Seed";

    if (progress >= 0.8) {
        status = "Full growth";
    } else if (progress >= 0.6) {
        status = "Growing";
    } else if (progress >= 0.3) {
        status = "Branches forming";
    } else if (progress >= 0.1) {
        status = "Sprout";
    }

    $("#treeStatus").textContent = status;
}

function updateFire(progress) {
    const flame = $(".fire-scene .fire-flame");
    const glow = $(".fire-glow");

    if (!flame || !glow) return;

    const scale =
        0.4 + progress * 0.8;

    flame.style.transform =
        `rotate(45deg) scale(${scale})`;

    glow.style.transform =
    `translateX(-50%) scale(${0.6 + progress * 0.7})`;

    $$(".spark").forEach((spark, index) => {
        const threshold = 0.35 + index * 0.1;

        spark.style.opacity =
            progress > threshold
                ? Math.min(1, (progress - threshold) * 5)
                : 0;

        spark.style.transform =
            progress > threshold
                ? `translateY(-${progress * (35 + index * 15)}px)`
                : "translateY(0)";
    });

    let status = "Starting";

    if (progress >= 0.8) {
        status = "Strong fire";
    } else if (progress >= 0.55) {
        status = "Building";
    } else if (progress >= 0.25) {
        status = "Warming";
    }

    $("#fireStatus").textContent = status;
}

/* =========================================================
   TASKS
   ========================================================= */
   function saveTask() {
    const nameInput = document.getElementById("taskNameInput");
    const priorityInput = document.getElementById("taskPriorityInput");
    const subjectInput = document.getElementById("taskSubjectInput");
    const timeInput = document.getElementById("taskTimeInput");

    if (!nameInput) {
        console.error("taskNameInput not found");
        return;
    }

    const name = nameInput.value.trim();

    if (!name) {
        showToast("Please enter a task name.");
        return;
    }

    const task = {
        id: createId(),
        name: name,
        priority: priorityInput ? priorityInput.value : "medium",
        subject: subjectInput ? subjectInput.value.trim() : "",
        minutes: Math.max(
            1,
            Number(timeInput?.value) || 30
        ),
        completed: false,
        createdAt: Date.now()
    };

    data.tasks.push(task);

    saveData();
    renderTasks();

    nameInput.value = "";

    if (subjectInput) subjectInput.value = "";
    if (timeInput) timeInput.value = "";

    showToast("Task added successfully.");
}

function bindTaskControls() {
    $("#dashboardAddTask")?.addEventListener(
        "click",
        () => openModal("taskModal")
    );
    document.addEventListener("click", event => {
        if (event.target.closest("#dashboardEmptyTaskCta")) {
            openModal("taskModal");
        }
    });

    $("#saveTaskBtn")?.addEventListener(
        "click",
        addTask
    );
}

async function addTask() {
    const name = $("#taskNameInput").value.trim();

    if (!name) {
        showToast("Enter a task name.");
        return;
    }

    const token = localStorage.getItem("mindscape_token");

if (!token) {
    showToast("Please log in again.");
    return;
}

try {
    const taskData = {
        title: name,
        priority: $("#taskPriorityInput").value,
        subject: $("#taskSubjectInput").value.trim(),
        estimatedMinutes:
            Math.max(
                1,
                Number($("#taskTimeInput").value) || 30
            )
    };

    const response = await fetch(
        `${API_BASE_URL}/api/tasks`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },

            body: JSON.stringify(taskData)
        }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
        throw new Error(
            result.message || "Failed to create task"
        );
    }

    // Keep frontend state synchronized with MongoDB
    data.tasks.push({
        id: result.task._id,
        name: result.task.title,
        priority: result.task.priority,
        subject: result.task.subject,
        minutes: result.task.estimatedMinutes,
        completed: result.task.completed,
        createdAt: result.task.createdAt
    });

    saveData();
    renderTasks();

    showToast("Task created successfully.");

} catch (error) {
    console.error("Create task error:", error);
    showToast(error.message || "Failed to create task.");
}
    $("#taskNameInput").value = "";
    $("#taskSubjectInput").value = "";

    closeModals();

    renderTasks();
    renderDashboard();
    checkAchievements();

    showToast("Task added.");
}

function toggleTask(id) {
    const task = data.tasks.find(
        item => item.id === id
    );

    if (!task) return;

    task.completed = !task.completed;

    saveData();

    renderTasks();
    renderDashboard();
    renderAchievements();
}

function deleteTask(id) {
    data.tasks = data.tasks.filter(
        task => task.id !== id
    );

    saveData();

    renderTasks();
    renderDashboard();
}

function renderTasks() {
    const container = $("#dashboardTasks");

    if (!container) return;

    const tasks = data.tasks.slice(0, 8);

    if (!tasks.length) {
        container.innerHTML =
            `<div class="empty-state">No tasks yet. Add something worth finishing.</div>`;
        return;
    }

    container.innerHTML = tasks.map(task => `
        <div class="task-item ${task.completed ? "completed" : ""}">
            <button
                class="task-checkbox ${task.completed ? "done" : ""}"
                data-task-toggle="${task.id}"
                aria-label="Complete task"
            ></button>

            <div class="task-text">
                ${escapeHTML(task.name)}
            </div>

            <span class="priority ${task.priority}"></span>

            <button
                class="task-delete"
                data-task-delete="${task.id}"
            aria-label="Delete task"><svg class="icon"><use href="#icon-trash"></use></svg></button>
        </div>
    `).join("");

    $$("[data-task-toggle]").forEach(button => {
        button.addEventListener("click", () => {
            toggleTask(button.dataset.taskToggle);
        });
    });

    $$("[data-task-delete]").forEach(button => {
        button.addEventListener("click", () => {
            deleteTask(button.dataset.taskDelete);
        });
    });
}

/* =========================================================
   STUDY SUBJECTS
   ========================================================= */

function bindStudyControls() {
    $("#addSubjectBtn")?.addEventListener(
        "click",
        () => openModal("subjectModal")
    );

    $("#saveSubjectBtn")?.addEventListener(
        "click",
        saveSubject
    );
}

function saveSubject() {
    const name = $("#subjectNameInput").value.trim();

    if (!name) {
        showToast("Enter a subject name.");
        return;
    }

    const topicText =
        $("#subjectTopicsInput").value.trim();

    const topics = topicText
        ? topicText
            .split(",")
            .map(topic => topic.trim())
            .filter(Boolean)
            .map(topic => ({
                id: createId(),
                name: topic,
                completed: false
            }))
        : [];

    data.subjects.push({
        id: createId(),
        name,
        examDate: $("#subjectExamInput").value,
        topics
    });

    saveData();

    $("#subjectNameInput").value = "";
    $("#subjectExamInput").value = "";
    $("#subjectTopicsInput").value = "";

    closeModals();

    renderSubjects();
    renderDashboard();

    showToast("Subject added.");
}

function toggleTopic(subjectId, topicId) {
    const subject = data.subjects.find(
        item => item.id === subjectId
    );

    if (!subject) return;

    const topic = subject.topics.find(
        item => item.id === topicId
    );

    if (!topic) return;

    topic.completed = !topic.completed;

    saveData();

    renderSubjects();
    renderDashboard();
    checkAchievements();
}

function deleteSubject(subjectId) {
    data.subjects = data.subjects.filter(
        subject => subject.id !== subjectId
    );

    saveData();

    renderSubjects();
    renderDashboard();
}

function renderSubjects() {
    const container = $("#subjectsGrid");
    const examContainer = $("#examList");

    if (!container) return;

    if (!data.subjects.length) {
        container.innerHTML = `
            <div class="empty-state">
                No subjects yet. Add your first subject and build your study plan.
            </div>
        `;
    } else {
        container.innerHTML =
            data.subjects.map(subject => {

                const total = subject.topics.length;
                const completed =
                    subject.topics.filter(
                        topic => topic.completed
                    ).length;

                const percentage =
                    total === 0
                        ? 0
                        : Math.round(
                            completed / total * 100
                        );

                return `
                    <div class="subject-card glass">

                        <div class="panel-header">
                            <div>
                                <h3>${escapeHTML(subject.name)}</h3>
                                <span class="subject-date">
                                    ${subject.examDate
                                        ? formatDate(subject.examDate)
                                        : "No exam date"}
                                </span>
                            </div>

                            <button
                                class="task-delete"
                                data-subject-delete="${subject.id}"
                            aria-label="Delete task"><svg class="icon"><use href="#icon-trash"></use></svg></button>
                        </div>

                        <div class="subject-progress">

                            <div class="subject-progress-head">
                                <span>Topic progress</span>
                                <strong>${percentage}%</strong>
                            </div>

                            <div class="progress-bar">
                                <span style="width:${percentage}%"></span>
                            </div>

                        </div>

                        <div class="topic-list">

                            ${
                                subject.topics.length
                                    ? subject.topics.map(topic => `
                                        <label class="topic-item">
                                            <input
                                                type="checkbox"
                                                ${topic.completed ? "checked" : ""}
                                                data-topic-toggle="${subject.id}|${topic.id}"
                                            >
                                            <span>
                                                ${escapeHTML(topic.name)}
                                            </span>
                                        </label>
                                    `).join("")
                                    : `<span class="subject-date">No topics added.</span>`
                            }

                        </div>

                    </div>
                `;
            }).join("");
    }

    $$("[data-topic-toggle]").forEach(input => {
        input.addEventListener("change", () => {
            const [subjectId, topicId] =
                input.dataset.topicToggle.split("|");

            toggleTopic(subjectId, topicId);
        });
    });

    $$("[data-subject-delete]").forEach(button => {
        button.addEventListener("click", () => {
            deleteSubject(button.dataset.subjectDelete);
        });
    });

    if (examContainer) {
        const exams = data.subjects
            .filter(subject => subject.examDate)
            .sort(
                (a, b) =>
                    new Date(a.examDate) -
                    new Date(b.examDate)
            );

        if (!exams.length) {
            examContainer.innerHTML =
                `<div class="empty-state">No exam dates added.</div>`;
        } else {
            examContainer.innerHTML =
                exams.map(subject => `
                    <div class="exam-row">
                        <div>
                            <strong>${escapeHTML(subject.name)}</strong>
                            <span>${formatDate(subject.examDate)}</span>
                        </div>

                        <strong class="days-left">
                            ${daysUntil(subject.examDate)}
                        </strong>
                    </div>
                `).join("");
        }
    }
}

/* =========================================================
   FLASHCARDS
   ========================================================= */

function bindFlashcardControls() {
    $("#addFlashcardBtn")?.addEventListener(
        "click",
        () => openModal("flashcardModal")
    );

    $("#saveFlashcardBtn")?.addEventListener(
        "click",
        saveFlashcard
    );

    $("#flashcard")?.addEventListener(
        "click",
        () => {
            $("#flashcard").classList.toggle("flipped");
        }
    );

    $$(".difficulty-btn").forEach(button => {
        button.addEventListener(
            "click",
            () => reviewFlashcard(button.dataset.review)
        );
    });
}

function saveFlashcard() {
    const question =
        $("#flashcardQuestionInput").value.trim();

    const answer =
        $("#flashcardAnswerInput").value.trim();

    if (!question || !answer) {
        showToast("Add both question and answer.");
        return;
    }

    data.flashcards.push({
        id: createId(),
        question,
        answer,
        category:
            $("#flashcardCategoryInput").value.trim() ||
            "General",
        reviews: 0
    });

    saveData();

    $("#flashcardQuestionInput").value = "";
    $("#flashcardAnswerInput").value = "";
    $("#flashcardCategoryInput").value = "";

    closeModals();

    flashcardIndex =
        data.flashcards.length - 1;

    renderFlashcard();

    showToast("Flashcard created.");
}

function renderFlashcard() {
    const card = $("#flashcard");

    if (!card) return;

    card.classList.remove("flipped");

    if (!data.flashcards.length) {
        $("#flashcardQuestion").textContent =
            "Add your first flashcard";

        $("#flashcardAnswer").textContent =
            "Your answer will appear here.";

        $("#flashcardCounter").textContent = "0 / 0";

        return;
    }

    if (
        flashcardIndex >= data.flashcards.length
    ) {
        flashcardIndex = 0;
    }

    const current =
        data.flashcards[flashcardIndex];

    $("#flashcardQuestion").textContent =
        current.question;

    $("#flashcardAnswer").textContent =
        current.answer;

    $("#flashcardCategory").textContent =
        current.category || "General";

    $("#flashcardCounter").textContent =
        `${flashcardIndex + 1} / ${data.flashcards.length}`;
}

function reviewFlashcard(review) {
    const current =
        data.flashcards[flashcardIndex];

    if (!current) return;

    current.reviews =
        (current.reviews || 0) + 1;

    saveData();

    flashcardIndex =
        (flashcardIndex + 1) %
        data.flashcards.length;

    renderFlashcard();

    showToast(
        `Marked ${review}. Next card ready.`
    );
}

/* =========================================================
   AI TUTOR
   ========================================================= */

function bindAI() {
    const sendButton = $("#sendChatBtn");
    const input = $("#chatInput");
    const historyToggle = $("#chatHistoryToggle");
    const history = $("#chatHistory");
    const subjectSelect = $("#tutorSubjectSelect");
    const subjectChips = $$(".subject-chip");

    const setSubject = (subject) => {
        subjectChips.forEach(chip => {
            chip.classList.toggle("active", chip.dataset.tutorSubject === subject);
        });
        if (subjectSelect) subjectSelect.value = subject;
    };

    subjectChips.forEach(chip => {
        chip.addEventListener("click", () => setSubject(chip.dataset.tutorSubject));
    });
    subjectSelect?.addEventListener("change", () => setSubject(subjectSelect.value));

    historyToggle?.addEventListener("click", () => {
        const isOpen = !history?.hidden;
        if (history) history.hidden = isOpen;
        historyToggle.setAttribute("aria-expanded", String(!isOpen));
    });
    history?.querySelector("button")?.addEventListener("click", () => {
        $("#chatMessages").innerHTML = `
            <div class="chat-empty-state">
                <div class="empty-tutor-avatar"><svg class="icon"><use href="#icon-tutor"></use></svg></div>
                <h3>What would you like to learn?</h3>
                <p>Pick a starting point or ask me anything.</p>
            </div>`;
        $(".ai-actions")?.classList.remove("has-started");
        history.hidden = true;
        historyToggle.setAttribute("aria-expanded", "false");
    });

    if (sendButton) {
        sendButton.addEventListener("click", function (event) {
            event.preventDefault();
            sendChat();
        });
    }

    if (input) {
        const resizeInput = () => {
            input.style.height = "auto";
            input.style.height = `${Math.min(input.scrollHeight, 130)}px`;
        };
        input.addEventListener("input", resizeInput);
        input.addEventListener("keydown", function (event) {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                sendChat();
            }
        });
    }

    $$("[data-ai-action]").forEach(function (button) {
        button.addEventListener("click", function () {

            const action = button.dataset.aiAction;

            const messages = {
                explain: "Explain a topic to me in very simple terms.",
                quiz: "Quiz me on Computer Science.",
                summary: "Help me create a short study summary.",
                flashcards: "Help me create useful flashcards."
            };

            if (input) {
                input.value = messages[action] || "";
                input.focus();
                input.dispatchEvent(new Event("input"));
            }
        });
    });
}


async function sendChat() {

    const input = $("#chatInput");

    if (!input) {
        console.error("AI Tutor: chatInput not found.");
        return;
    }

    const text = input.value.trim();

    if (!text) {
        return;
    }

    // The empty state and suggestion grid are only useful before the first prompt.
    $(".chat-empty-state")?.remove();
    $(".ai-actions")?.classList.add("has-started");

    addChatMessage(text, "user");

    // Clear input
    input.value = "";

    try {

        const response = await fetch(
            "http://localhost:5000/api/ai-tutor",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    message: text,
                    subject: $("#tutorSubjectSelect")?.value || "General"
                })
            }
        );

        const result = await response.json();

        console.log("AI Tutor response:", result);

        if (!response.ok || !result.success) {
            throw new Error(
                result.error ||
                result.message ||
                "AI Tutor request failed."
            );
        }

        const thinking = addThinkingMessage();
        await streamAssistantMessage(result.reply, thinking);

    } catch (error) {

        console.error(
            "AI Tutor error:",
            error
        );

        addChatMessage("AI Tutor connection failed: " + error.message, "assistant");
    }
}

function addThinkingMessage() {
    const container = $("#chatMessages");
    const message = document.createElement("div");
    message.className = "chat-message assistant thinking-message";
    message.innerHTML = `
        <div class="message-avatar"><svg class="icon"><use href="#icon-tutor"></use></svg></div>
        <div class="message-bubble thinking-dots"><i></i><i></i><i></i></div>
    `;
    container.appendChild(message);
    container.scrollTop = container.scrollHeight;
    return message;
}

function streamAssistantMessage(text, thinkingMessage) {
    return new Promise(resolve => {
        const bubble = thinkingMessage.querySelector(".message-bubble");
        const words = String(text || "I’m ready when you are.").split(/\s+/);
        let index = 0;
        bubble.classList.remove("thinking-dots");
        bubble.innerHTML = "";

        const renderNext = () => {
            bubble.textContent += `${index ? " " : ""}${words[index]}`;
            index += 1;
            const container = $("#chatMessages");
            if (container) container.scrollTop = container.scrollHeight;
            if (index < words.length) {
                window.setTimeout(renderNext, 28);
            } else {
                bubble.innerHTML = formatAIResponse(bubble.textContent);
                resolve();
            }
        };
        window.setTimeout(renderNext, 260);
    });
}

function formatAIResponse(text) {
    // Escape HTML first for security
    let html = escapeHTML(text);

    // Code blocks
    html = html.replace(
        /```([\s\S]*?)```/g,
        '<pre class="ai-code"><code>$1</code></pre>'
    );

    // Headings
    html = html.replace(
        /^### (.*?)$/gm,
        '<h4>$1</h4>'
    );

    html = html.replace(
        /^## (.*?)$/gm,
        '<h3>$1</h3>'
    );

    html = html.replace(
        /^# (.*?)$/gm,
        '<h2>$1</h2>'
    );

    // Bold
    html = html.replace(
        /\*\*(.*?)\*\*/g,
        '<strong>$1</strong>'
    );

    // Italic
    html = html.replace(
        /(?<!\*)\*([^*\n]+)\*(?!\*)/g,
        '<em>$1</em>'
    );

    // Inline code
    html = html.replace(
        /`([^`\n]+)`/g,
        '<code class="ai-inline-code">$1</code>'
    );

    // Horizontal rule
    html = html.replace(
        /^---$/gm,
        '<hr>'
    );

    // Bullet points
    html = html.replace(
        /^[•*-] (.*?)$/gm,
        '<li>$1</li>'
    );

    // Numbered lists
    html = html.replace(
        /^\d+\.\s+(.*?)$/gm,
        '<li>$1</li>'
    );

    // Wrap consecutive list items
    html = html.replace(
        /(<li>.*?<\/li>\s*)+/gs,
        '<ul>$&</ul>'
    );

    // Paragraphs / line breaks
    html = html.replace(
        /\n{2,}/g,
        '</p><p>'
    );

    html = html.replace(
        /\n/g,
        '<br>'
    );

    return `<p>${html}</p>`;
}


function addChatMessage(text, type) {
    const container = $("#chatMessages");

    if (!container) return;

    const message = document.createElement("div");

    message.className =
        `chat-message ${type}`;

    const formattedText =
        type === "assistant"
            ? formatAIResponse(text)
            : escapeHTML(text).replace(/\n/g, "<br>");

    message.innerHTML = `
        <div class="message-avatar">
            ${type === "assistant"
                ? '<svg class="icon"><use href="#icon-tutor"></use></svg>'
                : "You"}
        </div>

        <div class="message-bubble">
            ${formattedText}
        </div>
    `;

    container.appendChild(message);

    container.scrollTop =
        container.scrollHeight;
}

function generateStudyResponse(question) {
    const text = question.toLowerCase();

    if (
        text.includes("javascript") ||
        text.includes("js")
    ) {
        return `For JavaScript, use active recall instead of only watching lectures. Break the topic into small concepts, write a few examples yourself, then solve problems without looking at the answer. If you're studying arrays, focus on map, filter, reduce, find and forEach.`;
    }

    if (
        text.includes("deadlock")
    ) {
        return `A deadlock happens when processes are stuck waiting for resources held by each other. The four classic conditions are mutual exclusion, hold and wait, no preemption and circular wait.`;
    }

    if (
        text.includes("network") ||
        text.includes("tcp")
    ) {
        return `For Computer Networks, learn the concept first, then draw the flow yourself. For TCP, remember that it is connection-oriented and provides reliable, ordered delivery using mechanisms such as acknowledgements and retransmission.`;
    }

    if (
        text.includes("study") ||
        text.includes("exam")
    ) {
        return `Use a three-step cycle: understand → recall → practice. Spend less time rereading and more time solving questions, explaining concepts from memory and reviewing mistakes.`;
    }

    return `I can help you structure this as a study problem. First identify the exact concept, then break it into definition, how it works, example and common mistakes. For a real AI-powered answer system, Mindscape can later be connected to an AI API through a secure backend.`;
}

/* =========================================================
   STUDENT TOOLS
   ========================================================= */

function bindTools() {
    $("#calculatePercentage")?.addEventListener(
        "click",
        () => {
            const value =
                Number($("#percentageValue").value);

            const total =
                Number($("#percentageTotal").value);

            if (
                !Number.isFinite(value) ||
                !Number.isFinite(total) ||
                total === 0
            ) {
                $("#percentageResult").textContent =
                    "Enter valid values";
                return;
            }

            $("#percentageResult").textContent =
                `${((value / total) * 100).toFixed(2)}%`;
        }
    );

    $("#calculateExpression")?.addEventListener(
        "click",
        () => {
            const expression =
                $("#calculatorInput").value.trim();

            if (!/^[0-9+\-*/().%\s]+$/.test(expression)) {
                $("#calculatorResult").textContent =
                    "Invalid expression";
                return;
            }

            try {
                const result =
                    Function(`"use strict"; return (${expression})`)();

                if (!Number.isFinite(result)) {
                    throw new Error();
                }

                $("#calculatorResult").textContent =
                    result;
            } catch {
                $("#calculatorResult").textContent =
                    "Invalid expression";
            }
        }
    );

    $("#calculateCGPA")?.addEventListener(
        "click",
        () => {
            const values =
                $("#cgpaInput").value
                    .split(",")
                    .map(Number)
                    .filter(Number.isFinite);

            if (!values.length) {
                $("#cgpaResult").textContent =
                    "Enter semester values";
                return;
            }

            const average =
                values.reduce(
                    (sum, value) => sum + value,
                    0
                ) / values.length;

            $("#cgpaResult").textContent =
                average.toFixed(2);
        }
    );

    $("#textCounterInput")?.addEventListener(
        "input",
        updateTextCounter
    );
}

function updateTextCounter() {
    const text =
        $("#textCounterInput").value;

    const words =
        text.trim()
            ? text.trim().split(/\s+/).length
            : 0;

    $("#wordCount").textContent =
        words;

    $("#characterCount").textContent =
        text.length;
}

/* =========================================================
   SOUND ENGINE
   ========================================================= */

function bindSound() {
    $$(".sound-option").forEach(button => {
        button.addEventListener("click", () => {
            audioState.currentSound =
                button.dataset.sound;

            $$(".sound-option").forEach(item => {
                item.classList.toggle(
                    "active",
                    item === button
                );
            });

            if (data.settings.soundEnabled) {
                startSound(audioState.currentSound);
            }
        });
    });

    $("#volumeSlider")?.addEventListener(
        "input",
        event => {
            const volume =
                Number(event.target.value);

            data.settings.volume = volume;

            $("#volumeValue").textContent =
                `${volume}%`;

            if (audioState.masterGain) {
                audioState.masterGain.gain.value =
                    volume / 100 * 0.08;
            }

            saveData();
        }
    );

    $("#muteSoundBtn")?.addEventListener(
        "click",
        () => {
            audioState.muted =
                !audioState.muted;

            $("#muteSoundBtn").textContent =
                audioState.muted
                    ? "Unmute"
                    : "Mute";

            if (audioState.muted) {
                stopSound();
            } else if (
                data.timer.running &&
                data.settings.soundEnabled
            ) {
                startSound(audioState.currentSound);
            }
        }
    );
}

function ensureAudioContext() {
    if (!audioState.context) {
        audioState.context =
            new (window.AudioContext ||
                window.webkitAudioContext)();

        audioState.masterGain =
            audioState.context.createGain();

        audioState.masterGain.gain.value =
            data.settings.volume / 100 * 0.08;

        audioState.masterGain.connect(
            audioState.context.destination
        );
    }

    if (
        audioState.context.state === "suspended"
    ) {
        audioState.context.resume();
    }
}

function startSound(type) {
    if (
        audioState.muted ||
        !data.settings.soundEnabled
    ) {
        return;
    }

    try {
        ensureAudioContext();

        stopSound();

        const ctx = audioState.context;

        if (type === "lofi") {
            createLofi(ctx);
        } else if (type === "rain") {
            createNoise(ctx, 0.25);
        } else if (type === "forest") {
            createForest(ctx);
        } else if (type === "fireplace") {
            createFireplace(ctx);
        } else {
            createNoise(ctx, 0.15);
        }
    } catch (error) {
        console.warn("Audio unavailable:", error);
    }
}

function stopSound() {
    audioState.nodes.forEach(node => {
        try {
            node.stop?.();
            node.disconnect?.();
        } catch {
            /* intentionally ignored */
        }
    });

    audioState.nodes = [];
}

function createLofi(ctx) {
    const oscillator =
        ctx.createOscillator();

    const gain =
        ctx.createGain();

    const filter =
        ctx.createBiquadFilter();

    oscillator.type = "triangle";
    oscillator.frequency.value = 110;

    filter.type = "lowpass";
    filter.frequency.value = 700;

    gain.gain.value = 0.12;

    oscillator
        .connect(filter)
        .connect(gain)
        .connect(audioState.masterGain);

    oscillator.start();

    audioState.nodes.push(
        oscillator,
        gain,
        filter
    );
}

function createNoise(ctx, amount) {
    const buffer =
        ctx.createBuffer(
            1,
            ctx.sampleRate * 2,
            ctx.sampleRate
        );

    const output =
        buffer.getChannelData(0);

    for (let i = 0; i < output.length; i++) {
        output[i] =
            (Math.random() * 2 - 1) *
            amount;
    }

    const source =
        ctx.createBufferSource();

    const filter =
        ctx.createBiquadFilter();

    const gain =
        ctx.createGain();

    source.buffer = buffer;
    source.loop = true;

    filter.type = "lowpass";
    filter.frequency.value = 1800;

    gain.gain.value = 0.5;

    source
        .connect(filter)
        .connect(gain)
        .connect(audioState.masterGain);

    source.start();

    audioState.nodes.push(
        source,
        filter,
        gain
    );
}

function createForest(ctx) {
    createNoise(ctx, 0.07);

    const oscillator =
        ctx.createOscillator();

    const gain =
        ctx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = 520;

    gain.gain.value = 0.012;

    oscillator
        .connect(gain)
        .connect(audioState.masterGain);

    oscillator.start();

    audioState.nodes.push(
        oscillator,
        gain
    );
}

function createFireplace(ctx) {
    createNoise(ctx, 0.18);
}

function playCompletionSound() {
    try {
        ensureAudioContext();

        const oscillator =
            audioState.context.createOscillator();

        const gain =
            audioState.context.createGain();

        oscillator.type = "sine";
        oscillator.frequency.value = 660;

        gain.gain.value = 0.12;

        oscillator
            .connect(gain)
            .connect(audioState.masterGain);

        oscillator.start();

        gain.gain.exponentialRampToValueAtTime(
            0.001,
            audioState.context.currentTime + 0.8
        );

        oscillator.stop(
            audioState.context.currentTime + 0.8
        );
    } catch {
        /* Audio may be blocked by browser. */
    }
}

/* =========================================================
   ANALYTICS
   ========================================================= */

function renderAnalytics() {
    const totalMinutes =
        data.sessions.reduce(
            (sum, session) =>
                sum + Number(session.minutes || 0),
            0
        );

    const sessions =
        data.sessions.length;

    const average =
        sessions
            ? Math.round(totalMinutes / sessions)
            : 0;

    const best =
        getBestDay();

    $("#analyticsTotalMinutes").textContent =
        `${totalMinutes} min`;

    $("#analyticsSessions").textContent =
        sessions;

    $("#analyticsAverage").textContent =
        `${average} min`;

    $("#analyticsBestDay").textContent =
        best.label;

    $("#analyticsStreak").textContent =
        calculateCurrentStreak();

    $("#analyticsLongestStreak").textContent =
        calculateLongestStreak();

    const score = calculateFocusScore();

    $("#analyticsScore").textContent =
        score;

    $("#analyticsScoreLabel").textContent =
        getScoreLabel(score);

    renderWeeklyChart();
}

function renderWeeklyChart() {
    const container = $("#weeklyChart");

    if (!container) return;

    const days = [];

    for (let i = 6; i >= 0; i--) {
        const date =
            new Date();

        date.setDate(
            date.getDate() - i
        );

        const key =
            getDateKey(date);

        const minutes =
            data.sessions
                .filter(
                    session =>
                        session.date === key
                )
                .reduce(
                    (sum, session) =>
                        sum + Number(session.minutes || 0),
                    0
                );

        days.push({
            date,
            minutes
        });
    }

    const max =
        Math.max(
            1,
            ...days.map(day => day.minutes)
        );

    container.innerHTML =
        days.map(day => {

            const height =
                Math.max(
                    3,
                    day.minutes / max * 220
                );

            return `
                <div class="chart-column">
                    <span class="chart-value">
                        ${day.minutes}
                    </span>

                    <div
                        class="chart-bar"
                        style="height:${height}px"
                    ></div>

                    <span class="chart-label">
                        ${day.date.toLocaleDateString(
                            undefined,
                            { weekday: "short" }
                        )}
                    </span>
                </div>
            `;
        }).join("");
}

function getBestDay() {
    if (!data.sessions.length) {
        return {
            label: "—",
            minutes: 0
        };
    }

    const totals = {};

    data.sessions.forEach(session => {
        totals[session.date] =
            (totals[session.date] || 0) +
            Number(session.minutes || 0);
    });

    const best =
        Object.entries(totals)
            .sort((a, b) => b[1] - a[1])[0];

    return {
        label: formatDate(best[0]),
        minutes: best[1]
    };
}

/* =========================================================
   STREAK
   ========================================================= */

function updateStreakAfterSession() {
    /* Streak is derived from actual session dates. */
}

function calculateCurrentStreak() {
    const dates = new Set(
        data.sessions.map(
            session => session.date
        )
    );

    let streak = 0;

    const today =
        new Date();

    while (true) {
        const key =
            getDateKey(today);

        if (!dates.has(key)) {
            break;
        }

        streak++;

        today.setDate(
            today.getDate() - 1
        );
    }

    return streak;
}

function calculateLongestStreak() {
    const dates =
        Array.from(
            new Set(
                data.sessions.map(
                    session => session.date
                )
            )
        ).sort();

    if (!dates.length) {
        return 0;
    }

    let longest = 1;
    let current = 1;

    for (let i = 1; i < dates.length; i++) {

        const previous =
            new Date(`${dates[i - 1]}T00:00:00`);

        const currentDate =
            new Date(`${dates[i]}T00:00:00`);

        const difference =
            Math.round(
                (currentDate - previous) /
                86400000
            );

        if (difference === 1) {
            current++;
            longest =
                Math.max(longest, current);
        } else {
            current = 1;
        }
    }

    return longest;
}

/* =========================================================
   FOCUS SCORE
   ========================================================= */

function calculateFocusScore() {
    const today = getDateKey(new Date());
    const sessions = data.sessions.filter(session => session.date === today);
    const todaySessionCount = sessions.length;
    const todayMinutes = getTodayMinutes();

    const currentStreak =
        calculateCurrentStreak();

    const taskTotal =
        data.tasks.length;

    const completedTasks =
        data.tasks.filter(
            task => task.completed
        ).length;

    const goal =
        Math.max(
            1,
            Number(data.settings.dailyGoal)
        );

    const goalCompletion =
        Math.min(
            1,
            todayMinutes / goal
        );

    const taskCompletion =
        taskTotal
            ? completedTasks / taskTotal
            : 0;

    const sessionScore = Math.min(25, todaySessionCount * 8.33);
    const minuteScore = goalCompletion * 45;

    const consistencyScore = Math.min(15, currentStreak * 3);

    const taskScore = taskCompletion * 15;

    return Math.round(
        Math.min(
            100,
            sessionScore +
            minuteScore +
            consistencyScore +
            taskScore
        )
    );
}

function getScoreLabel(score) {
    if (score >= 90) return "Exceptional";
    if (score >= 75) return "Excellent";
    if (score >= 55) return "Strong";
    if (score >= 30) return "Building";
    return "Getting started";
}

/* =========================================================
   ACHIEVEMENTS
   ========================================================= */

const ACHIEVEMENTS = [
    {
        id: "first-focus",
        icon: "icon-focus",
        title: "First Focus",
        description: "Complete your first focus session.",
        check: stats => stats.sessions >= 1
    },
    {
        id: "five-sessions",
        icon: "5",
        title: "Five Sessions",
        description: "Complete five focus sessions.",
        check: stats => stats.sessions >= 5
    },
    {
        id: "ten-sessions",
        icon: "10",
        title: "Ten Sessions",
        description: "Complete ten focus sessions.",
        check: stats => stats.sessions >= 10
    },
    {
        id: "ten-hours",
        icon: "10",
        title: "10 Hours Focused",
        description: "Accumulate ten hours of focus.",
        check: stats => stats.minutes >= 600
    },
    {
        id: "twenty-five-hours",
        icon: "25",
        title: "25 Hours Focused",
        description: "Accumulate twenty-five hours.",
        check: stats => stats.minutes >= 1500
    },
    {
        id: "seven-streak",
        icon: "7",
        title: "Seven Day Streak",
        description: "Study for seven consecutive days.",
        check: stats => stats.longestStreak >= 7
    },
    {
        id: "thirty-streak",
        icon: "30",
        title: "Thirty Day Streak",
        description: "Study for thirty consecutive days.",
        check: stats => stats.longestStreak >= 30
    },
    {
        id: "ice-melt",
        icon: "icon-spark",
        title: "First Ice Melt",
        description: "Complete a session using Ice.",
        check: stats =>
            stats.environments.includes("ice")
    },
    {
        id: "tree-growth",
        icon: "icon-tree",
        title: "First Tree Growth",
        description: "Complete a session using Tree.",
        check: stats =>
            stats.environments.includes("tree")
    },
    {
        id: "twenty-five-tasks",
        icon: "icon-check",
        title: "25 Tasks Completed",
        description: "Complete twenty-five tasks.",
        check: stats =>
            stats.completedTasks >= 25
    },
    {
        id: "hundred-hours",
        icon: "100",
        title: "100 Hours Focused",
        description: "Accumulate one hundred hours.",
        check: stats => stats.minutes >= 6000
    }
];

function getAchievementStats() {
    return {
        sessions: data.sessions.length,

        minutes:
            data.sessions.reduce(
                (sum, session) =>
                    sum + Number(session.minutes || 0),
                0
            ),

        longestStreak:
            calculateLongestStreak(),

        completedTasks:
            data.tasks.filter(
                task => task.completed
            ).length,

        environments:
            data.sessions.map(
                session => session.environment
            )
    };
}

function checkAchievements() {
    const stats =
        getAchievementStats();

    ACHIEVEMENTS.forEach(achievement => {

        if (
            achievement.check(stats) &&
            !data.achievements.includes(
                achievement.id
            )
        ) {
            data.achievements.push(
                achievement.id
            );

            showToast(
                `Achievement unlocked: ${achievement.title}`
            );
        }
    });

    saveData();

    renderAchievements();
}

function renderAchievements() {
    const container =
        $("#achievementsGrid");

    if (!container) return;

    container.innerHTML =
        ACHIEVEMENTS.map(achievement => {

            const unlocked =
                data.achievements.includes(
                    achievement.id
                );

            return `
                <div class="achievement-card glass ${unlocked ? "unlocked" : ""}">

                    <div class="achievement-icon">
                        ${achievement.icon.startsWith("icon-")
                            ? `<svg class="icon"><use href="#${achievement.icon}"></use></svg>`
                            : `<span class="achievement-badge">${achievement.icon}</span>`}
                    </div>

                    <h3>
                        ${achievement.title}
                    </h3>

                    <p>
                        ${achievement.description}
                    </p>

                    <div class="achievement-status">
                        ${unlocked
                            ? "Unlocked"
                            : "Locked"}
                    </div>

                </div>
            `;
        }).join("");
}

/* =========================================================
   DASHBOARD
   ========================================================= */

function renderDashboard() {
    const todayMinutes =
        getTodayMinutes();
    const todayKey = getDateKey(new Date());
    const todaySessions = data.sessions.filter(session => session.date === todayKey);

    const goal =
        Number(data.settings.dailyGoal) || 120;

    const percentage =
        Math.min(
            100,
            Math.round(
                todayMinutes / goal * 100
            )
        );

    const score =
        calculateFocusScore();

    animateCount($("#todayMinutes"), todayMinutes);
    animateCount($("#totalSessions"), todaySessions.length);
    animateCount($("#currentStreak"), calculateCurrentStreak());
    animateCount($("#tasksDone"), data.tasks.filter(task => task.completed).length);

    $("#goalMinutesDisplay").textContent =
        todayMinutes;

    $("#goalTargetDisplay").textContent =
        goal;

    $("#goalPercentage").textContent =
        `${percentage}%`;

    $("#dailyGoalBar").style.width =
        `${percentage}%`;

    animateCount($("#dashboardScore"), score);

    $("#dashboardScoreLabel").textContent =
        getScoreLabel(score);

    const ring = $("#dashboardScoreRing");
    if (ring) ring.style.setProperty("--score", score);

    renderScoreHistory();

    const sidebarStreak = $("#sidebarStreak");
    if (sidebarStreak) sidebarStreak.textContent = calculateCurrentStreak();
    const sidebarNextSession = $("#sidebarNextSession");
    if (sidebarNextSession) {
        sidebarNextSession.textContent = data.timer.running
            ? "Next session: in progress"
            : `Next session: ${Math.round((data.timer.duration || 1500) / 60)} min focus`;
    }

    const heroProgress = $("#heroPlanProgress");
    const heroBar = $("#heroPlanBar");
    const heroMinutes = $("#heroPlanMinutes");
    const heroTarget = $("#heroPlanTarget");
    if (heroProgress) heroProgress.textContent = percentage;
    if (heroBar) heroBar.style.width = `${percentage}%`;
    if (heroMinutes) heroMinutes.textContent = todayMinutes;
    if (heroTarget) heroTarget.textContent = goal;

    renderDashboardTasks();
    renderDashboardExams();
}

function animateCount(element, target) {
    if (!element) return;
    const value = Number(target) || 0;
    const start = Number(element.dataset.value || 0);
    element.dataset.value = value;
    if (start === value || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        element.textContent = value;
        return;
    }
    const started = performance.now();
    const duration = 550;
    function tick(now) {
        const progress = Math.min(1, (now - started) / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = Math.round(start + (value - start) * eased);
        if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}

function renderScoreHistory() {
    const chart = $("#scoreMiniChart");
    if (!chart) return;
    const goal = Math.max(1, Number(data.settings.dailyGoal) || 120);
    const today = new Date();
    const hasSessions = data.sessions.length > 0;
    const sampleValues = [28, 52, 36, 68, 46, 74, 58];
    const days = Array.from({ length: 7 }, (_, index) => {
        const date = new Date(today);
        date.setDate(today.getDate() - (6 - index));
        const key = getDateKey(date);
        const minutes = data.sessions
            .filter(session => session.date === key)
            .reduce((sum, session) => sum + Number(session.minutes || 0), 0);
        const value = hasSessions
            ? Math.min(100, Math.round(minutes / goal * 100))
            : sampleValues[index];
        return { label: date.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 1), value, sample: !hasSessions };
    });
    chart.innerHTML = days.map(day => `
        <span class="mini-chart-bar-wrap">
            <span class="mini-chart-bar" style="height:${Math.max(8, day.value)}%" title="${day.sample ? "Sample " : ""}${day.value}%"></span>
            <small>${day.label}</small>
        </span>
    `).join("");
}

function renderDashboardTasks() {
    const container =
        $("#dashboardTasks");

    if (!container) return;

    const tasks =
        data.tasks.slice(0, 6);

    if (!tasks.length) {
        container.innerHTML =
            `<div class="empty-state">
                <strong>Your day is a blank canvas.</strong>
                <span>Add one small task to get moving.</span>
                <button class="outline-btn" id="dashboardEmptyTaskCta" type="button">Add your first task</button>
            </div>`;
        return;
    }

    container.innerHTML =
        tasks.map(task => `
            <div class="task-item ${task.completed ? "completed" : ""}">

                <button
                    class="task-checkbox ${task.completed ? "done" : ""}"
                    data-task-toggle="${task.id}"
                ></button>

                <div class="task-text">
                    ${escapeHTML(task.name)}
                </div>

                <span class="priority ${task.priority}"></span>

                <button
                    class="task-delete"
                    data-task-delete="${task.id}"
                aria-label="Delete task"><svg class="icon"><use href="#icon-trash"></use></svg></button>

            </div>
        `).join("");

    $$("[data-task-toggle]").forEach(button => {
        button.onclick = () =>
            toggleTask(button.dataset.taskToggle);
    });

    $$("[data-task-delete]").forEach(button => {
        button.onclick = () =>
            deleteTask(button.dataset.taskDelete);
    });
}

function renderDashboardExams() {
    const container =
        $("#dashboardExams");

    if (!container) return;

    const exams =
        data.subjects
            .filter(subject => subject.examDate)
            .sort(
                (a, b) =>
                    new Date(a.examDate) -
                    new Date(b.examDate)
            )
            .slice(0, 3);

    if (!exams.length) {
        container.innerHTML =
            `<div class="empty-state">
                <strong>No deadlines on the horizon.</strong>
                <span>Keep your next milestone somewhere visible.</span>
                <button class="outline-btn" type="button" onclick="showPage('study')">Add a study subject</button>
            </div>`;
        return;
    }

    container.innerHTML =
        exams.map(subject => `
            <div class="exam-mini">

                <div>
                    <strong>
                        ${escapeHTML(subject.name)}
                    </strong>

                    <span>
                        ${formatDate(subject.examDate)}
                    </span>
                </div>

                <span class="days-left">
                    ${daysUntil(subject.examDate)}
                </span>

            </div>
        `).join("");
}

/* =========================================================
   DISTRACTIONS
   ========================================================= */

function renderDistractions() {
    const container =
        $("#distractionList");

    if (!container) return;

    if (!data.distractions.length) {
        container.innerHTML = "";
        return;
    }

    container.innerHTML =
        data.distractions.map(item => `
            <div class="distraction-item">
                <span>${escapeHTML(item.text)}</span>

                <button
                    data-distraction-delete="${item.id}"
                aria-label="Delete distraction"><svg class="icon"><use href="#icon-trash"></use></svg></button>
            </div>
        `).join("");

    $$("[data-distraction-delete]").forEach(
        button => {
            button.addEventListener(
                "click",
                () => {
                    data.distractions =
                        data.distractions.filter(
                            item =>
                                item.id !==
                                button.dataset.distractionDelete
                        );

                    saveData();
                    renderDistractions();
                }
            );
        }
    );
}

$("#addDistractionBtn")?.addEventListener(
    "click",
    addDistraction
);

$("#distractionInput")?.addEventListener(
    "keydown",
    event => {
        if (event.key === "Enter") {
            addDistraction();
        }
    }
);

function addDistraction() {
    const input =
        $("#distractionInput");

    const text =
        input.value.trim();

    if (!text) return;

    data.distractions.push({
        id: createId(),
        text,
        createdAt: Date.now()
    });

    saveData();

    input.value = "";

    renderDistractions();
}

/* =========================================================
   SETTINGS
   ========================================================= */

function bindSettings() {
    $("#settingFocusDuration")?.addEventListener(
        "change",
        event => {
            const minutes =
                Number(event.target.value);

            data.settings.focusDuration =
                minutes;

            setTimerDuration(
                minutes * 60
            );

            saveData();
        }
    );

    $("#settingShortBreak")?.addEventListener(
        "change",
        event => {
            data.settings.shortBreak =
                Number(event.target.value);

            saveData();
        }
    );

    $("#settingLongBreak")?.addEventListener(
        "change",
        event => {
            data.settings.longBreak =
                Number(event.target.value);

            saveData();
        }
    );

    $("#settingDailyGoal")?.addEventListener(
        "change",
        event => {
            const value =
                Math.min(
                    1440,
                    Math.max(
                        15,
                        Number(event.target.value) || 120
                    )
                );

            data.settings.dailyGoal =
                value;

            event.target.value =
                value;

            saveData();

            renderDashboard();
        }
    );

    $("#settingTheme")?.addEventListener(
        "change",
        event => {
            data.settings.theme =
                event.target.value;

            applyTheme();
            saveData();
        }
    );

    $("#settingEnvironment")?.addEventListener(
        "change",
        event => {
            setEnvironment(
                event.target.value
            );
        }
    );

    $("#settingSoundEnabled")?.addEventListener(
        "change",
        event => {
            data.settings.soundEnabled =
                event.target.checked;

            saveData();

            if (!event.target.checked) {
                stopSound();
            }
        }
    );

    $("#settingVolume")?.addEventListener(
        "input",
        event => {
            const value =
                Number(event.target.value);

            data.settings.volume =
                value;

            $("#volumeSlider").value =
                value;

            $("#volumeValue").textContent =
                `${value}%`;

            if (audioState.masterGain) {
                audioState.masterGain.gain.value =
                    value / 100 * 0.08;
            }

            saveData();
        }
    );

    $("#exportDataBtn")?.addEventListener(
        "click",
        exportData
    );

    $("#clearDataBtn")?.addEventListener(
        "click",
        clearData
    );

    populateSettings();
}

function populateSettings() {
    $("#settingFocusDuration").value =
        data.settings.focusDuration;

    $("#settingShortBreak").value =
        data.settings.shortBreak;

    $("#settingLongBreak").value =
        data.settings.longBreak;

    $("#settingDailyGoal").value =
        data.settings.dailyGoal;

    $("#settingTheme").value =
        data.settings.theme;

    $("#settingEnvironment").value =
        data.settings.environment;

    $("#settingSoundEnabled").checked =
        data.settings.soundEnabled;

    $("#settingVolume").value =
        data.settings.volume;

    $("#volumeSlider").value =
        data.settings.volume;

    $("#volumeValue").textContent =
        `${data.settings.volume}%`;
}

function applySettings() {
    applyTheme();

    data.timer.environment =
        data.settings.environment;

    if (
        !data.timer.duration ||
        data.timer.duration <= 0
    ) {
        data.timer.duration =
            data.settings.focusDuration * 60;

        data.timer.remaining =
            data.timer.duration;
    }

    const input =
        $("#focusIntention");

    if (input) {
        input.value =
            data.timer.intention || "";
    }

    populateSettings();
}

function applyTheme() {
    document.documentElement.dataset.theme =
        data.settings.theme;
}

/* =========================================================
   EXPORT / CLEAR
   ========================================================= */

function exportData() {
    const exportObject = {
        ...data,
        exportedAt: new Date().toISOString()
    };

    const blob =
        new Blob(
            [JSON.stringify(
                exportObject,
                null,
                2
            )],
            {
                type: "application/json"
            }
        );

    const url =
        URL.createObjectURL(blob);

    const link =
        document.createElement("a");

    link.href = url;
    link.download =
        `mindscape-data-${getDateKey(new Date())}.json`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);

    showToast("Study data exported.");
}

function clearData() {
    const confirmed =
        window.confirm(
            "Delete all Mindscape data? This cannot be undone."
        );

    if (!confirmed) return;

    localStorage.removeItem(STORAGE_KEY);

    data = cloneDefaultData();

    location.reload();
}

/* =========================================================
   MODALS
   ========================================================= */

function openModal(id) {
    const modal =
        document.getElementById(id);

    if (!modal) return;

    modal.classList.add("open");
}

function closeModals() {
    $$(".modal-backdrop").forEach(
        modal => modal.classList.remove("open")
    );
}

$$("[data-close-modal]").forEach(button => {
    button.addEventListener(
        "click",
        closeModals
    );
});

$$(".modal-backdrop").forEach(backdrop => {
    backdrop.addEventListener(
        "click",
        event => {
            if (event.target === backdrop) {
                backdrop.classList.remove("open");
            }
        }
    );
});

/* =========================================================
   KEYBOARD SHORTCUTS
   ========================================================= */

function bindKeyboardShortcuts() {
    document.addEventListener(
        "keydown",
        event => {

            const tag =
                document.activeElement?.tagName;

            const typing =
                tag === "INPUT" ||
                tag === "TEXTAREA" ||
                tag === "SELECT";

            if (
                event.code === "Space" &&
                !typing
            ) {
                event.preventDefault();
                toggleTimer();
            }

            if (
                event.key.toLowerCase() === "r" &&
                !typing
            ) {
                resetTimer();
            }

            if (event.key === "Escape") {
                closeModals();
            }
        }
    );
}

/* =========================================================
   BREAK SHORTCUT
   ========================================================= */

document.addEventListener(
    "keydown",
    event => {

        if (
            event.key.toLowerCase() === "b" &&
            !event.ctrlKey &&
            !event.metaKey
        ) {
            const tag =
                document.activeElement?.tagName;

            if (
                tag !== "INPUT" &&
                tag !== "TEXTAREA"
            ) {
                startBreak(
                    data.settings.shortBreak
                );
            }
        }
    }
);

/* =========================================================
   UTILITIES
   ========================================================= */

function getDateKey(date) {
    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(2, "0");

    const day =
        String(
            date.getDate()
        ).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function getTodayMinutes() {
    const today =
        getDateKey(new Date());

    return data.sessions
        .filter(
            session =>
                session.date === today
        )
        .reduce(
            (sum, session) =>
                sum + Number(session.minutes || 0),
            0
        );
}

function daysUntil(dateString) {
    const target =
        new Date(`${dateString}T00:00:00`);

    const today =
        new Date();

    today.setHours(0, 0, 0, 0);

    const difference =
        Math.ceil(
            (target - today) /
            86400000
        );

    if (difference < 0) {
        return "Passed";
    }

    if (difference === 0) {
        return "Today";
    }

    if (difference === 1) {
        return "1 day";
    }

    return `${difference} days`;
}

function formatDate(dateString) {
    if (!dateString) return "—";

    const date =
        new Date(`${dateString}T00:00:00`);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleDateString(
        undefined,
        {
            day: "numeric",
            month: "short",
            year: "numeric"
        }
    );
}

function createId() {
    return (
        Date.now().toString(36) +
        Math.random()
            .toString(36)
            .slice(2, 8)
    );
}

function escapeHTML(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function showToast(message) {
    const container =
        $("#toastContainer");

    if (!container) return;

    const toast =
        document.createElement("div");

    toast.className = "toast";
    toast.textContent = message;

    container.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3500);
}

/* =========================================================
   SAVE INITIAL STATE
   ========================================================= */

saveData();
/* =========================================================
   AUTHENTICATION
   ========================================================= */

const AUTH_API_URL = "http://localhost:5000/api/auth";

function showLoginScreen() {
    const loginScreen = document.getElementById("loginScreen");

    if (loginScreen) {
        loginScreen.style.display = "flex";
    }
}

function hideLoginScreen() {
    const loginScreen = document.getElementById("loginScreen");

    if (loginScreen) {
        loginScreen.style.display = "none";
    }
}

function setupAuthentication() {
    console.log("AUTH SETUP RUNNING");
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    const showRegisterBtn =
        document.getElementById("showRegisterBtn");

    const showLoginBtn =
        document.getElementById("showLoginBtn");

    const logoutBtn =
        document.getElementById("logoutBtn");

    if (!loginForm || !registerForm) {
    console.error("AUTH FORMS NOT FOUND");
    return;
}

console.log("AUTH FORMS FOUND");

    // Restore existing login session
    const existingToken =
        localStorage.getItem("mindscape_token");

    if (existingToken) {
        hideLoginScreen();
    } else {
        showLoginScreen();
    }

    // Show registration form
    showRegisterBtn?.addEventListener("click", () => {
        loginForm.hidden = true;
        registerForm.hidden = false;
    });

    // Show login form
    showLoginBtn?.addEventListener("click", () => {
        registerForm.hidden = true;
        loginForm.hidden = false;
    });

    // LOGIN
    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const email =
            document.getElementById("loginEmail").value.trim();

        const password =
            document.getElementById("loginPassword").value;

        const errorElement =
            document.getElementById("loginError");

        errorElement.textContent = "";

        try {
            const response = await fetch(
                `${AUTH_API_URL}/login`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        email,
                        password
                    })
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message || "Login failed."
                );
            }

            if (!result.token) {
                throw new Error(
                    "Login succeeded but no authentication token was received."
                );
            }

            localStorage.setItem(
                "mindscape_token",
                result.token
            );

            hideLoginScreen();

            showToast(
                "Welcome back to Mindscape."
            );

        } catch (error) {
            console.error(
                "Login error:",
                error
            );

            errorElement.textContent =
                error.message ||
                "Unable to login.";
        }
    });

    // REGISTER
    registerForm.addEventListener("submit", async (event) => {
        event.preventDefault();

        const name =
            document.getElementById("registerName").value.trim();

        const email =
            document.getElementById("registerEmail").value.trim();

        const password =
            document.getElementById("registerPassword").value;

        const errorElement =
            document.getElementById("registerError");

        errorElement.textContent = "";

        try {
            const response = await fetch(
                `${AUTH_API_URL}/register`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify({
                        name,
                        email,
                        password
                    })
                }
            );

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(
                    result.message ||
                    "Registration failed."
                );
            }

            if (result.token) {
                localStorage.setItem(
                    "mindscape_token",
                    result.token
                );

                hideLoginScreen();

                showToast(
                    "Account created successfully."
                );
            } else {
                registerForm.hidden = true;
                loginForm.hidden = false;

                document.getElementById("loginError")
                    .textContent =
                    "Account created. Please sign in.";
            }

        } catch (error) {
            console.error(
                "Registration error:",
                error
            );

            errorElement.textContent =
                error.message ||
                "Unable to create account.";
        }
    });

    // LOGOUT
    logoutBtn?.addEventListener("click", () => {
        localStorage.removeItem("mindscape_token");

        showLoginScreen();

        loginForm.reset();
        registerForm.reset();

        loginForm.hidden = false;
        registerForm.hidden = true;

        showToast("Logged out successfully.");
    });
}
document.addEventListener("DOMContentLoaded", init);