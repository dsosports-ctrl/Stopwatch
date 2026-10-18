let startTime = 0;
let elapsedTime = 0;
let timerInterval = null;
let isRunning = false;
let asanaCount = 0;

let sessionStartTime = null;
let sessionInterval = null;

let asanaSlots = Array(10).fill(null);

const display = document.getElementById("display");
const mainBTN = document.getElementById("mainBTN");
const singleColumn = document.getElementById("singleColumn");
const totalTimeContainer = document.getElementById("totalTimeContainer");
const totalDisplay = document.getElementById("totalDisplay");

const customModal = document.getElementById("customModal");
const modalYes = document.getElementById("modalYes");
const modalNo = document.getElementById("modalNo");

function syncAsanaCount() {
    asanaCount = asanaSlots.filter((slot) => slot !== null).length;
}

function updateMainButtonState() {
    if (isRunning) {
        mainBTN.textContent = "Stop";
        mainBTN.className = "btn stop";
        return;
    }

    if (asanaCount >= 10) {
        mainBTN.textContent = "Clear All";
        mainBTN.className = "btn reset-state";
    } else {
        mainBTN.textContent = "Start";
        mainBTN.className = "btn start";
    }
}

function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((ms % 1000) / 10);

    const padM = String(minutes).padStart(2, '0');
    const padS = String(seconds).padStart(2, '0');
    const padMS = String(milliseconds).padStart(2, '0');

    return {
        mainTime: `${padM}:${padS}`,
        msTime: `.${padMS}`
    };
}

function formatHoldingTime(ms) {
    const rawSeconds = Math.floor(ms / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);

    const padS = String(rawSeconds).padStart(2, '0');
    const padMS = String(milliseconds).padStart(2, '0');

    return `${padS}.${padMS}`;
}

function formatTotalSeconds(ms) {
    return Math.round(ms / 1000);
}

function updateDisplay() {
    elapsedTime = Date.now() - startTime;
    const time = formatTime(elapsedTime);
    display.innerHTML = `${time.mainTime}<span id="ms">${time.msTime}</span>`;
}

function updateTotalTime() {
    if (sessionStartTime) {
        const totalMs = Date.now() - sessionStartTime;
        const totalSecondsInt = formatTotalSeconds(totalMs);
        
        totalDisplay.textContent = totalSecondsInt;
        totalDisplay.classList.remove('bg-red', 'bg-green');

        if (totalSecondsInt <= 150 || totalSecondsInt > 190) {
            totalDisplay.classList.add('bg-red');
        } else if (totalSecondsInt >= 151 && totalSecondsInt <= 190) {
            totalDisplay.classList.add('bg-green');
        }
    }
}

function renderMatrix() {
    singleColumn.innerHTML = "";
    
    asanaSlots.forEach((timeMs, index) => {
        const asanaNumber = index + 1;
        const itemDiv = document.createElement("div");
        itemDiv.className = "matrix-item";
        
        if (timeMs !== null) {
            itemDiv.classList.add("filled");
            
            if (timeMs < 4500) {
                itemDiv.classList.add("hold-red");
            } else {
                itemDiv.classList.add("hold-sky");
            }

            const formattedTime = formatHoldingTime(timeMs);
            itemDiv.innerHTML = `
                <span class="matrix-label">A${asanaNumber}</span>
                <span class="matrix-time">${formattedTime}</span>
                <div class="matrix-actions">
                    <button class="inline-delete-btn">Delete</button>
                </div>
            `;
            
            itemDiv.querySelector(".inline-delete-btn").addEventListener("click", () => {
                deleteSlot(index);
            });
        } else {
            itemDiv.innerHTML = `
                <span class="matrix-label">A${asanaNumber}</span>
                <span class="matrix-time">--.--</span>
                <div class="matrix-actions"></div>
            `;
        }
        
        singleColumn.appendChild(itemDiv);
    });
}

function deleteSlot(index) {
    asanaSlots[index] = null;
    syncAsanaCount();
    updateMainButtonState();
    renderMatrix();
}

renderMatrix();

mainBTN.addEventListener("click", () => {
    if (asanaCount >= 10 && !isRunning) {
        customModal.classList.add("active");
        return;
    }

    if (!isRunning) {
        if (sessionStartTime === null) {
            sessionStartTime = Date.now();
            sessionInterval = setInterval(updateTotalTime, 10);
        }

        clearInterval(timerInterval);
        startTime = Date.now() - elapsedTime;
        timerInterval = setInterval(updateDisplay, 10);

        isRunning = true;
        updateMainButtonState();
    } else {
        clearInterval(timerInterval);
        timerInterval = null;

        if (elapsedTime > 0 && asanaCount < 10) {
            asanaSlots[asanaCount] = elapsedTime;
            syncAsanaCount();
            renderMatrix();
        }

        elapsedTime = 0;
        display.innerHTML = `00:00<span id="ms">.00</span>`;
        isRunning = false;

        if (asanaCount >= 10) {
            clearInterval(sessionInterval);
            sessionInterval = null;
            updateTotalTime();
        }

        updateMainButtonState();
    }
});

modalYes.addEventListener("click", () => {
    asanaSlots = Array(10).fill(null);
    asanaCount = 0;
    renderMatrix();

    clearInterval(sessionInterval);
    sessionInterval = null;
    sessionStartTime = null;
    totalDisplay.textContent = "0";
    totalDisplay.classList.remove('bg-red', 'bg-green');

    clearInterval(timerInterval);
    timerInterval = null;

    elapsedTime = 0;
    display.innerHTML = `00:00<span id="ms">.00</span>`;
    isRunning = false;
    updateMainButtonState();

    customModal.classList.remove("active");
});

modalNo.addEventListener("click", () => {
    customModal.classList.remove("active");
});
