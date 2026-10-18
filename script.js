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

function saveManualSlot(index, secStr, msStr) {
    let secVal = parseInt(secStr) || 0;
    let msVal = parseInt(msStr) || 0;

    if (msStr.length === 1) msVal = msVal * 10;

    const totalMs = (secVal * 1000) + (msVal * 10);
    
    asanaSlots[index] = totalMs;
    
    syncAsanaCount();
    updateMainButtonState();
    renderMatrix();

    if (sessionStartTime === null) {
        sessionStartTime = Date.now();
        sessionInterval = setInterval(updateTotalTime, 10);
    }
    updateTotalTime();
}

function showInlineInput(index, itemDiv) {
    const asanaNumber = index + 1;
    const currentMs = asanaSlots[index];
    
    let defaultSec = "";
    let defaultMs = "";
    
    if (currentMs !== null) {
        defaultSec = String(Math.floor(currentMs / 1000)).padStart(2, '0');
        defaultMs = String(Math.floor((currentMs % 1000) / 10)).padStart(2, '0');
    }
    
    itemDiv.innerHTML = `
        <span class="matrix-label">A${asanaNumber}</span>
        <div class="matrix-edit-container exact-place">
            <input type="text" inputmode="numeric" pattern="[0-9]*" class="inline-text-field sec-box" placeholder="00" maxlength="2" value="${defaultSec}">
            <span class="time-dot-field">.</span>
            <input type="text" inputmode="numeric" pattern="[0-9]*" class="inline-text-field ms-box" placeholder="00" maxlength="2" value="${defaultMs}">
        </div>
        <div class="matrix-actions editing">
            <button class="inline-cancel-btn">Cancel</button>
        </div>
    `;

    const secInput = itemDiv.querySelector(".sec-box");
    const msInput = itemDiv.querySelector(".ms-box");
    const cancelBtn = itemDiv.querySelector(".inline-cancel-btn");

    setTimeout(() => {
        secInput.focus();
        if (currentMs !== null) {
            secInput.select();
        }
    }, 10);

    secInput.addEventListener("input", () => {
        secInput.value = secInput.value.replace(/[^0-9]/g, '');
        if (secInput.value.length >= 2) {
            msInput.focus();
            if (currentMs !== null) {
                msInput.select();
            }
        }
    });

    msInput.addEventListener("input", () => {
        msInput.value = msInput.value.replace(/[^0-9]/g, '');
        if (msInput.value.length >= 2) {
            saveManualSlot(index, secInput.value, msInput.value);
        }
    });

    msInput.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && msInput.value.length === 0) {
            secInput.focus();
        }
    });

    secInput.addEventListener("keypress", (e) => { 
        if (e.key === "Enter" && secInput.value !== "") {
            saveManualSlot(index, secInput.value, msInput.value);
        } 
    });
    msInput.addEventListener("keypress", (e) => { 
        if (e.key === "Enter" && (secInput.value !== "" || msInput.value !== "")) {
            saveManualSlot(index, secInput.value, msInput.value);
        } 
    });

    cancelBtn.addEventListener("click", () => {
        renderMatrix();
    });
}

function renderMatrix() {
    singleColumn.innerHTML = "";
    let lastFilledIndex = -1; // आखिरी सेव हुए सेल का इंडेक्स ट्रैक करने के लिए
    
    asanaSlots.forEach((timeMs, index) => {
        const asanaNumber = index + 1;
        const itemDiv = document.createElement("div");
        itemDiv.className = "matrix-item";
        itemDiv.setAttribute("data-index", index); // इंडेक्स को एट्रिब्यूट में सेव किया
        
        if (timeMs !== null) {
            itemDiv.classList.add("filled");
            lastFilledIndex = index; // जैसे ही कोई फिल्ड सेल मिलेगा, यह अपडेट हो जाएगा
            
            if (timeMs < 4500) {
                itemDiv.classList.add("hold-red");
            } else {
                itemDiv.classList.add("hold-sky");
            }

            const formattedTime = formatHoldingTime(timeMs);
            itemDiv.innerHTML = `
                <span class="matrix-label">A${asanaNumber}</span>
                <span class="matrix-time">${formattedTime}</span>
                <div class="matrix-actions filled-actions">
                    <button class="inline-edit-btn">Edit</button>
                </div>
            `;
            
            itemDiv.querySelector(".inline-edit-btn").addEventListener("click", () => {
                showInlineInput(index, itemDiv);
            });
        } else {
            itemDiv.innerHTML = `
                <span class="matrix-label">A${asanaNumber}</span>
                <span class="matrix-time">--.--</span>
                <div class="matrix-actions">
                    <button class="inline-edit-btn">Edit</button>
                </div>
            `;
            
            itemDiv.querySelector(".inline-edit-btn").addEventListener("click", () => {
                showInlineInput(index, itemDiv);
            });
        }
        
        singleColumn.appendChild(itemDiv);
    });

    // मैजिक लाइन: अगर कोई सेल सेव हुआ है, तो उसे मोबाइल स्क्रीन पर ऑटोमैटिक स्क्रॉल करके सामने लाएं
    if (lastFilledIndex !== -1) {
        setTimeout(() => {
            const activeItem = singleColumn.querySelector(`[data-index="${lastFilledIndex}"]`);
            if (activeItem) {
                activeItem.scrollIntoView({ behavior: "smooth", block: "center" });
            }
        }, 100);
    }
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

        if (elapsedTime > 0) {
            const nextEmptyIndex = asanaSlots.findIndex(slot => slot === null);
            if (nextEmptyIndex !== -1 && nextEmptyIndex < 10) {
                asanaSlots[nextEmptyIndex] = elapsedTime;
                syncAsanaCount();
                renderMatrix();
            }
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
