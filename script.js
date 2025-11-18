// ========== 설정 ==========
const CONFIG = {
    GAME_TIME: 120,
    COOKING_TIME: 3,
    COOKED_TIME: 4,
    REQUEST_DURATION: 5,
    SCORE_NORMAL: 5,
    SCORE_REQUEST: 10,
    BURNT_PENALTY: -5,
};

// ========== 게임 상태 ==========
const game = {
    isPlaying: false,
    isPaused: false,
    score: 0,
    timeRemaining: CONFIG.GAME_TIME,
    character: {
        normal: null,
        happy: null,
        angry: null,
        happyText: '',
        angryText: '',
    },
    slots: [null, null, null, null],
    requestedFood: null,
    emotionTimer: null,
    textTimer: null,
    timers: {
        game: null,
        boil: null,
    },
};

// ========== DOM ==========
const $ = {
    gameWrapper: document.getElementById('gameWrapper'),
    gameContainer: document.getElementById('gameContainer'),
    gameScreen: document.getElementById('gameScreen'),
    setupModal: document.getElementById('setupModal'),
    pauseModal: document.getElementById('pauseModal'),
    gameoverModal: document.getElementById('gameoverModal'),
    
    characterImg: document.getElementById('characterImg'),
    scoreText: document.getElementById('scoreText'),
    timeGauge: document.getElementById('timeGauge'),
    
    speechBubble: document.getElementById('speechBubble'),
    requestFoodImg: document.getElementById('requestFoodImg'),
    textBubble: document.getElementById('textBubble'),
    textContent: document.getElementById('textContent'),
    
    trashImg: document.getElementById('trashImg'),
    potError: document.getElementById('potError'),
    
    countdown: document.getElementById('countdown'),
    readyImg: document.getElementById('readyImg'),
    goImg: document.getElementById('goImg'),
    
    gameoverImg: document.getElementById('gameoverImg'),
    gameoverContent: document.getElementById('gameoverContent'),
    finalScore: document.getElementById('finalScore'),
    
    heartParticles: document.getElementById('heartParticles'),
};

// ========== 초기화 ==========
window.addEventListener('DOMContentLoaded', () => {
    scaleGame();
    initSetup();
    initButtons();
    startBoilAnimation();
});

window.addEventListener('resize', scaleGame);

// ========== 스케일링 ==========
function scaleGame() {
    const scale = Math.min(
        window.innerWidth / 1080,
        window.innerHeight / 1920
    );
    $.gameContainer.style.transform = `scale(${scale})`;
}

// ========== 캐릭터 설정 ==========
function initSetup() {
    const inputs = {
        normal: document.getElementById('normalImage'),
        happy: document.getElementById('happyImage'),
        angry: document.getElementById('angryImage'),
        happyText: document.getElementById('happyText'),
        angryText: document.getElementById('angryText'),
    };
    
    inputs.normal.addEventListener('change', (e) => loadImage(e, 'normal', 'normalPreview'));
    inputs.happy.addEventListener('change', (e) => loadImage(e, 'happy', 'happyPreview'));
    inputs.angry.addEventListener('change', (e) => loadImage(e, 'angry', 'angryPreview'));
    
    document.getElementById('startBtn').addEventListener('click', () => {
        game.character.happyText = inputs.happyText.value.trim() || '맛있어!';
        game.character.angryText = inputs.angryText.value.trim() || '이건 아닌데...';
        
        if (!game.character.normal || !game.character.happy || !game.character.angry) {
            alert('모든 캐릭터 이미지를 업로드해주세요!');
            return;
        }
        
        $.setupModal.classList.remove('active');
        $.gameScreen.style.display = 'block';
        $.characterImg.src = game.character.normal;
        startCountdown();
    });
}

function loadImage(e, type, previewId) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
        const img = document.createElement('img');
        img.src = event.target.result;
        const preview = document.getElementById(previewId);
        preview.innerHTML = '';
        preview.appendChild(img);
        game.character[type] = event.target.result;
    };
    reader.readAsDataURL(file);
}

// ========== 버튼 ==========
function initButtons() {
    document.getElementById('pauseBtn').addEventListener('click', pauseGame);
    document.getElementById('resumeBtn').addEventListener('click', resumeGame);
    document.getElementById('restartFromPauseBtn').addEventListener('click', restart);
    document.getElementById('restartFromGameoverBtn').addEventListener('click', restart);
    document.getElementById('backToSetupBtn').addEventListener('click', backToSetup);
    document.getElementById('backToSetupBtn2').addEventListener('click', backToSetup);
}

function pauseGame() {
    game.isPaused = true;
    $.pauseModal.classList.add('active');
}

function resumeGame() {
    game.isPaused = false;
    $.pauseModal.classList.remove('active');
}

function restart() {
    clearInterval(game.timers.game);
    document.querySelectorAll('.food-icon').forEach(el => el.remove());
    $.pauseModal.classList.remove('active');
    $.gameoverModal.classList.remove('active');
    startCountdown();
}

function backToSetup() {
    clearInterval(game.timers.game);
    document.querySelectorAll('.food-icon').forEach(el => el.remove());
    game.isPlaying = false;
    game.isPaused = false;
    $.pauseModal.classList.remove('active');
    $.gameoverModal.classList.remove('active');
    $.gameScreen.style.display = 'none';
    $.setupModal.classList.add('active');
}

// ========== 카운트다운 ==========
function startCountdown() {
    $.countdown.style.display = 'block';
    $.readyImg.style.display = 'block';
    
    setTimeout(() => {
        $.readyImg.style.display = 'none';
        $.goImg.style.display = 'block';
        
        setTimeout(() => {
            $.countdown.style.display = 'none';
            startGame();
        }, 1000);
    }, 1000);
}

// ========== 게임 시작 ==========
function startGame() {
    game.isPlaying = true;
    game.isPaused = false;
    game.score = 0;
    game.timeRemaining = CONFIG.GAME_TIME;
    game.slots = [null, null, null, null];
    game.requestedFood = null;
    
    updateScore();
    startGameTimer();
    startRequestSystem();
    initDishes();
}

function startGameTimer() {
    const gaugeImg = new Image();
    gaugeImg.src = 'img/gadge_green.png';
    gaugeImg.onload = () => {
        const fullWidth = gaugeImg.width;
        
        // 초기 크기 설정 추가!
        document.getElementById('gaugeWrapper').style.width = fullWidth + 'px';
        document.getElementById('gaugeWrapper').style.height = gaugeImg.height + 'px';

        game.timers.game = setInterval(() => {
            if (game.isPaused) return;
            
            game.timeRemaining--;
            const percent = game.timeRemaining / CONFIG.GAME_TIME;
            document.getElementById('gaugeWrapper').style.width = (fullWidth * percent) + 'px';
            
            if (game.timeRemaining <= 0) {
                endGame();
            }
        }, 1000);
    };
}

function updateScore() {
    $.scoreText.textContent = game.score;
}

// ========== 끓는 애니메이션 ==========
function startBoilAnimation() {
    let toggle = false;
    game.timers.boil = setInterval(() => {
        document.getElementById('boil1').style.display = toggle ? 'none' : 'block';
        document.getElementById('boil2').style.display = toggle ? 'block' : 'none';
        toggle = !toggle;
    }, 500);
}

// ========== 재료 드래그 ==========
function initDishes() {
    document.querySelectorAll('.dish').forEach(dish => {
        dish.addEventListener('mousedown', startDishDrag);
        dish.addEventListener('touchstart', startDishDrag);
    });
}

let dragState = {
    active: false,
    element: null,
    foodType: null,
    offsetX: 0,
    offsetY: 0,
};

function startDishDrag(e) {
    if (!game.isPlaying || game.isPaused) return;
    
    e.preventDefault();
    const dish = e.currentTarget;
    const foodType = dish.dataset.food;
    
    // 드래그용 아이콘 생성
    const icon = document.createElement('img');
    icon.src = `img/food${foodType}_cooking.png`;
    icon.className = 'food-icon';
    
    const touch = e.type === 'touchstart' ? e.touches[0] : e;
    const rect = $.gameContainer.getBoundingClientRect();
    
    // 스케일 계산 수정
    const transform = window.getComputedStyle($.gameContainer).transform;
    let scale = 1;
    if (transform && transform !== 'none') {
        const matrix = transform.match(/matrix\(([^)]+)\)/);
        if (matrix) {
            scale = parseFloat(matrix[1].split(',')[0]);
        }
    }
    
    const x = (touch.clientX - rect.left) / scale;
    const y = (touch.clientY - rect.top) / scale;
    
    // 이미지 크기의 절반만큼 오프셋
    const img = new Image();
    img.src = icon.src;
    img.onload = () => {
        dragState.offsetX = img.width / 2;
        dragState.offsetY = img.height / 2;
    };
    
    icon.style.left = (x - 87) + 'px';
    icon.style.top = (y - 60) + 'px';
    
    $.gameContainer.appendChild(icon);
    
    dragState.active = true;
    dragState.element = icon;
    dragState.foodType = foodType;
    
    document.addEventListener('mousemove', onDishDrag);
    document.addEventListener('touchmove', onDishDrag);
    document.addEventListener('mouseup', endDishDrag);
    document.addEventListener('touchend', endDishDrag);
}

function onDishDrag(e) {
    if (!dragState.active) return;
    
    e.preventDefault();
    const touch = e.type === 'touchmove' ? e.touches[0] : e;
    const rect = $.gameContainer.getBoundingClientRect();
    
    // 스케일 계산 수정
    const transform = window.getComputedStyle($.gameContainer).transform;
    let scale = 1;
    if (transform && transform !== 'none') {
        const matrix = transform.match(/matrix\(([^)]+)\)/);
        if (matrix) {
            scale = parseFloat(matrix[1].split(',')[0]);
        }
    }
    
    const x = (touch.clientX - rect.left) / scale;
    const y = (touch.clientY - rect.top) / scale;
    
    dragState.element.style.left = (x - 87) + 'px';
    dragState.element.style.top = (y - 60) + 'px';
}

function endDishDrag(e) {
    if (!dragState.active) return;
    
    document.removeEventListener('mousemove', onDishDrag);
    document.removeEventListener('touchmove', onDishDrag);
    document.removeEventListener('mouseup', endDishDrag);
    document.removeEventListener('touchend', endDishDrag);
    
    const icon = dragState.element;
    const iconRect = icon.getBoundingClientRect();
    
    // 빈 슬롯 찾기
    let targetSlot = -1;
    document.querySelectorAll('.pot-slot').forEach((slot, idx) => {
        if (game.slots[idx] === null) {
            const slotRect = slot.getBoundingClientRect();
            if (isOverlap(iconRect, slotRect)) {
                targetSlot = idx;
            }
        }
    });
    
    if (targetSlot !== -1) {
        // 슬롯에 추가
        addToSlot(icon, targetSlot, dragState.foodType);
    } else {
        // 슬롯 꽉참
        if (!game.slots.includes(null)) {
            showError();
        }
        icon.remove();
    }
    
    dragState.active = false;
    dragState.element = null;
}

function addToSlot(icon, slotIdx, foodType) {
    const slot = document.querySelector(`.pot-slot[data-slot="${slotIdx}"]`);
    const slotLeft = parseInt(slot.style.left);
    const slotTop = parseInt(slot.style.top);
    
    icon.style.left = slotLeft + 'px';
    icon.style.top = slotTop + 'px';
    icon.classList.add('in-slot');
    icon.dataset.slotIdx = slotIdx;
    icon.dataset.state = 'cooking';
    
    game.slots[slotIdx] = {
        element: icon,
        foodType: foodType,
        state: 'cooking',
        timer: 0,
    };
    
    startCooking(slotIdx);
    enableSlotDrag(icon);
}

// ========== 조리 ==========
function startCooking(slotIdx) {
    const slot = game.slots[slotIdx];
    if (!slot) return;
    
    const interval = setInterval(() => {
        if (game.isPaused || !game.isPlaying) return;
        
        slot.timer++;
        
        if (slot.timer === CONFIG.COOKING_TIME && slot.state === 'cooking') {
            slot.state = 'cooked';
            slot.element.src = `img/food${slot.foodType}_cooked.png`;
            slot.element.dataset.state = 'cooked';
        }
        
        if (slot.timer === CONFIG.COOKING_TIME + CONFIG.COOKED_TIME && slot.state === 'cooked') {
            slot.state = 'burnt';
            slot.element.src = `img/food${slot.foodType}_burnt.png`;
            slot.element.dataset.state = 'burnt';
            clearInterval(interval);
        }
    }, 1000);
}

// ========== 슬롯 재료 드래그 ==========
function enableSlotDrag(icon) {
    let dragging = false;
    let offsetX, offsetY;
    
    const onStart = (e) => {
        if (!game.isPlaying || game.isPaused) return;
        
        e.preventDefault();
        e.stopPropagation();
        dragging = true;
        icon.classList.add('dragging');
        
        const touch = e.type === 'touchstart' ? e.touches[0] : e;
        const rect = icon.getBoundingClientRect();
        const containerRect = $.gameContainer.getBoundingClientRect();
        
        // 스케일 계산 수정
        const transform = window.getComputedStyle($.gameContainer).transform;
        let scale = 1;
        if (transform && transform !== 'none') {
            const matrix = transform.match(/matrix\(([^)]+)\)/);
            if (matrix) {
                scale = parseFloat(matrix[1].split(',')[0]);
            }
        }
        
        offsetX = (touch.clientX - rect.left) / scale;
        offsetY = (touch.clientY - rect.top) / scale;
    };
    
    const onMove = (e) => {
        if (!dragging) return;
        e.preventDefault();
        
        const touch = e.type === 'touchmove' ? e.touches[0] : e;
        const rect = $.gameContainer.getBoundingClientRect();
        
        // 스케일 계산 수정
        const transform = window.getComputedStyle($.gameContainer).transform;
        let scale = 1;
        if (transform && transform !== 'none') {
            const matrix = transform.match(/matrix\(([^)]+)\)/);
            if (matrix) {
                scale = parseFloat(matrix[1].split(',')[0]);
            }
        }
        
        const x = (touch.clientX - rect.left) / scale;
        const y = (touch.clientY - rect.top) / scale;
        
        icon.style.left = (x - offsetX) + 'px';
        icon.style.top = (y - offsetY) + 'px';
        
        // 휴지통 체크
        const trashRect = $.trashImg.getBoundingClientRect();
        const iconRect = icon.getBoundingClientRect();
        if (isOverlap(iconRect, trashRect)) {
            $.trashImg.src = 'img/trash_2.png';
        } else {
            $.trashImg.src = 'img/trash_1.png';
        }
    };
    
    const onEnd = (e) => {
        if (!dragging) return;
        dragging = false;
        icon.classList.remove('dragging');
        
        const iconRect = icon.getBoundingClientRect();
        const trashRect = $.trashImg.getBoundingClientRect();
        const charRect = $.characterImg.getBoundingClientRect();
        
        if (isOverlap(iconRect, trashRect)) {
            throwAway(icon);
        } else if (isOverlap(iconRect, charRect)) {
            feedCharacter(icon);
        } else {
            returnToSlot(icon);
        }
    };
    
    icon.addEventListener('mousedown', onStart);
    icon.addEventListener('touchstart', onStart);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('touchmove', onMove);
    document.addEventListener('mouseup', onEnd);
    document.addEventListener('touchend', onEnd);
}

function returnToSlot(icon) {
    const slotIdx = icon.dataset.slotIdx;
    const slot = document.querySelector(`.pot-slot[data-slot="${slotIdx}"]`);
    const slotLeft = parseInt(slot.style.left);
    const slotTop = parseInt(slot.style.top);
    
    icon.style.left = slotLeft + 'px';
    icon.style.top = slotTop + 'px';
}

function throwAway(icon) {
    $.trashImg.src = 'img/trash_2.png';
    setTimeout(() => {
        $.trashImg.src = 'img/trash_1.png';
    }, 500);
    
    const slotIdx = icon.dataset.slotIdx;
    game.slots[slotIdx] = null;
    icon.remove();
}

function feedCharacter(icon) {
    const slotIdx = icon.dataset.slotIdx;
    const foodType = game.slots[slotIdx].foodType;
    const state = icon.dataset.state;
    
    let score = 0;
    let emotion = 'normal';
    
    if (state === 'burnt' || state === 'cooking') {
        // burnt 또는 cooking 상태 = 화남
        score = CONFIG.BURNT_PENALTY;
        emotion = 'angry';
    } else if (state === 'cooked') {
        if (game.requestedFood === foodType) {
            score = CONFIG.SCORE_REQUEST;
            emotion = 'happy';
            createHearts();
            
            // 말풍선 들썩이는 효과 - 애니메이션 재시작
            $.speechBubble.classList.remove('bounce');
            $.requestFoodImg.classList.remove('bounce');
            // 리플로우 강제 (애니메이션 재시작)
            void $.speechBubble.offsetWidth;
            $.speechBubble.classList.add('bounce');
            $.requestFoodImg.classList.add('bounce');
            setTimeout(() => {
                $.speechBubble.classList.remove('bounce');
                $.requestFoodImg.classList.remove('bounce');
            }, 300);
            
            clearRequest();
        } else {
            score = CONFIG.SCORE_NORMAL;
            emotion = 'happy';
        }
    }
    
    game.score += score;
    updateScore();
    showEmotion(emotion);
    showScorePopup(score);
    
    game.slots[slotIdx] = null;
    icon.remove();
}

function showEmotion(type) {
    if (type === 'happy') {
        $.characterImg.src = game.character.happy;
        showText(game.character.happyText, true);
    } else if (type === 'angry') {
        $.characterImg.src = game.character.angry;
        showText(game.character.angryText, false);
    }
    
    // 이전 타이머 취소
    if (game.emotionTimer) {
        clearTimeout(game.emotionTimer);
    }
    
    // 새 타이머 시작
    game.emotionTimer = setTimeout(() => {
        $.characterImg.src = game.character.normal;
        game.emotionTimer = null;
    }, 2000);
}

function showText(text, shake) {
    const display = text.length > 24 ? text.substring(0, 23) + '...' : text;
    $.textBubble.style.display = 'block';
    $.textContent.style.display = 'flex';
    $.textContent.textContent = display;
    
    // 기존 shake 클래스 제거
    $.textBubble.classList.remove('shake');
    $.textContent.classList.remove('shake');
    
    if (shake) {
        // 리플로우 강제 (애니메이션 재시작)
        void $.textBubble.offsetWidth;
        $.textBubble.classList.add('shake');
        $.textContent.classList.add('shake');
    }
    
    // 이전 타이머 취소
    if (game.textTimer) {
        clearTimeout(game.textTimer);
    }
    
    // 새 타이머 시작
    game.textTimer = setTimeout(() => {
        $.textBubble.style.display = 'none';
        $.textContent.style.display = 'none';
        $.textBubble.classList.remove('shake');
        $.textContent.classList.remove('shake');
        game.textTimer = null;
    }, 2000);
}

// ========== 점수 팝업 ==========
function showScorePopup(score) {
    const popup = document.createElement('div');
    popup.className = 'score-popup';
    popup.classList.add(score > 0 ? 'positive' : 'negative');
    popup.textContent = score > 0 ? `+${score}` : `${score}`;
    
    $.gameContainer.appendChild(popup);
    
    setTimeout(() => {
        popup.remove();
    }, 1000);
}

// ========== 요청 시스템 ==========
function startRequestSystem() {
    function show() {
        if (!game.isPlaying || game.isPaused) {
            setTimeout(show, 1000);
            return;
        }
        
        const food = Math.floor(Math.random() * 6) + 1;
        game.requestedFood = food.toString();
        
        $.speechBubble.style.display = 'block';
        $.requestFoodImg.src = `img/food${food}_cooking.png`;
        $.requestFoodImg.style.display = 'block';
        
        setTimeout(() => {
            if (game.requestedFood === food.toString()) {
                clearRequest();
            }
        }, CONFIG.REQUEST_DURATION * 1000);
        
        setTimeout(show, 5000 + Math.random() * 5000);
    }
    
    setTimeout(show, 3000);
}

function clearRequest() {
    game.requestedFood = null;
    $.speechBubble.style.display = 'none';
    $.requestFoodImg.style.display = 'none';
}

// ========== 하트 파티클 ==========
function createHearts() {
    for (let i = 0; i < 10; i++) {
        const heart = document.createElement('img');
        heart.src = 'img/heart.png';
        heart.className = 'heart-particle';
        
        const angle = (Math.PI * 2 * i) / 10;
        const distance = 100 + Math.random() * 100;
        const endX = 540 + Math.cos(angle) * distance;
        const endY = 418 + Math.sin(angle) * distance;
        
        heart.style.position = 'absolute';
        heart.style.left = '540px';
        heart.style.top = '418px';
        heart.style.transition = 'all 1.5s ease-out';
        
        $.heartParticles.appendChild(heart);
        
        setTimeout(() => {
            heart.style.left = endX + 'px';
            heart.style.top = endY + 'px';
            heart.style.opacity = '0';
            
            setTimeout(() => heart.remove(), 1500);
        }, 10);
    }
}

// ========== 유틸 ==========
function isOverlap(rect1, rect2) {
    return !(rect1.right < rect2.left || 
             rect1.left > rect2.right || 
             rect1.bottom < rect2.top || 
             rect1.top > rect2.bottom);
}

function showError() {
    $.potError.classList.add('blink');
    $.potError.style.display = 'block';
    setTimeout(() => {
        $.potError.style.display = 'none';
        $.potError.classList.remove('blink');
    }, 500);
}

// ========== 게임 종료 ==========
function endGame() {
    game.isPlaying = false;
    clearInterval(game.timers.game);
    
    $.gameoverModal.classList.add('active');
    $.gameoverImg.style.display = 'block';
    
    setTimeout(() => {
        $.gameoverImg.style.display = 'none';
        $.gameoverContent.style.display = 'block';
        $.finalScore.textContent = game.score;
    }, 2000);
}
