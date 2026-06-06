// Konfigurasi Phaser
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 720,
    height: 480,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 100 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

// Variabel global game
let game;
let kasurPemain;
let bantalGroup;
let score = 0;
let cursors;
let catchSound;

// Variabel Timer
let timeLeft = 30;
let timerEvent;
let gameActive = true;

// Highest Score
let highestScore = localStorage.getItem('bantalHighScore') ? parseInt(localStorage.getItem('bantalHighScore')) : 0;

// Daftar asset bantal yang jatuh
const BANTAL_JATUH_ASSETS = ['bantal', 'bantal2_bulat'];

// Inisialisasi game
window.onload = () => {
    game = new Phaser.Game(config);
    const highestSpan = document.getElementById('highest-score');
    if (highestSpan) highestSpan.innerText = highestScore;
};

// Fungsi preload
function preload() {
    this.load.image('background', 'assets/background.jpg');
    this.load.image('kasurPemain', 'assets/kasur.png');
    this.load.image('bantal', 'assets/bantal.png');
    this.load.image('bantal2', 'assets/bantal2.png');  // Asset bantal2 akan diolah jadi bulat
}

// Fungsi create
function create() {
    const scene = this;
    gameActive = true;
    timeLeft = 30;
    
    const domTimer = document.getElementById('timer-display');
    if (domTimer) domTimer.innerText = "30";
    const timerCard = document.querySelector('.timer-card');
    if (timerCard) timerCard.classList.remove('warning', 'critical');
    
    const modal = document.getElementById('gameover-modal');
    if (modal) modal.classList.remove('show');
    
    // --- LATAR BELAKANG ---
    let bg = this.add.image(0, 0, 'background').setOrigin(0, 0);
    bg.setDisplaySize(this.scale.width, this.scale.height);
    
    const overlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x0a1030, 0.1);
    overlay.setOrigin(0, 0);
    
    kasurPemain = this.physics.add.image(this.scale.width / 2, this.scale.height - 55, 'kasurPemain');
    kasurPemain.setDisplaySize(110, 60);
    kasurPemain.setCollideWorldBounds(true);
    kasurPemain.setImmovable(true);
    kasurPemain.body.setSize(kasurPemain.width, kasurPemain.height * 0.8);
    
    // --- KELOMPOK BANTAL JATUH ---
    bantalGroup = this.physics.add.group({
        allowGravity: true,
        immovable: false,
        bounceY: 0.05
    });
    
    // --- TUMBUKAN ---
    this.physics.add.collider(kasurPemain, bantalGroup, (pemain, bantalJatuh) => {
        if (!gameActive) return;
        
        bantalJatuh.destroy();
        score++;
        updateScoreDisplay();
        
        if (catchSound && catchSound.play) {
            catchSound.play();
        }
        
        scene.tweens.add({
            targets: pemain,
            y: pemain.y - 3,
            duration: 40,
            yoyo: true,
            repeat: 0
        });
    });
    
    // --- SPAWN BANTAL ---
    this.time.addEvent({
        delay: 1300,
        callback: spawnPillow,
        callbackScope: this,
        loop: true
    });
    
    // --- TIMER ---
    timerEvent = this.time.addEvent({
        delay: 1000,
        callback: updateTimer,
        callbackScope: this,
        loop: true
    });
    
    // --- KONTROL ---
    this.input.on('pointermove', (pointer) => {
        if (!gameActive) return;
        let newX = pointer.worldX;
        newX = Phaser.Math.Clamp(newX, 40, this.scale.width - 40);
        kasurPemain.x = newX;
    });
    
    this.input.on('touchmove', (pointer) => {
        if (!gameActive) return;
        let newX = pointer.worldX;
        newX = Phaser.Math.Clamp(newX, 40, this.scale.width - 40);
        kasurPemain.x = newX;
    });
    
    cursors = this.input.keyboard.createCursorKeys();
    
    // --- SUARA ---
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContextClass();
        
        catchSound = {
            play: () => {
                if (audioCtx.state === 'suspended') {
                    audioCtx.resume();
                }
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.type = 'sine';
                osc.frequency.value = 380;
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                gain.gain.value = 0.45;
                osc.start();
                gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.2);
                osc.stop(audioCtx.currentTime + 0.2);
            }
        };
    } catch(e) {
        catchSound = null;
    }
    
    // --- BINTANG LANGIT ---
    for(let i = 0; i < 25; i++) {
        let star = this.add.circle(
            Phaser.Math.Between(15, this.scale.width - 15), 
            Phaser.Math.Between(10, 70), 
            1.2, 
            0xfff5b0, 
            0.4
        );
        this.tweens.add({
            targets: star,
            alpha: 0.05,
            duration: 2000 + Math.random() * 3000,
            yoyo: true,
            repeat: -1,
            delay: Math.random() * 2000
        });
    }
    
    // --- BUAT TEXTURE BANTAL2 YANG BULAT (memotong bantal2.png menjadi lingkaran) ---
    createCircularBantal2Texture(this);
}

// Fungsi membuat bantal2 menjadi bulat (memotong asset menjadi lingkaran)
function createCircularBantal2Texture(scene) {
    // Ambil asset bantal2 yang sudah di-load
    const originalTexture = scene.textures.get('bantal2');
    const width = originalTexture.getSourceImage().width;
    const height = originalTexture.getSourceImage().height;
    const size = Math.min(width, height);
    
    // Buat canvas temporary
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Gambar asset ke canvas
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    
    // Gambar gambar asli di tengah
    const offsetX = (size - width) / 2;
    const offsetY = (size - height) / 2;
    const img = originalTexture.getSourceImage();
    ctx.drawImage(img, offsetX, offsetY);
    ctx.restore();
    
    // Tambahkan outline tipis agar terlihat rapi
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
    ctx.strokeStyle = '#c4a87c';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Generate texture baru
    scene.textures.addImage('bantal2_bulat', canvas);
}

// Fungsi spawn bantal - menggunakan bantal.png dan bantal2_bulat (yang sudah bulat)
function spawnPillow() {
    if (!gameActive) return;
    if (!bantalGroup || !bantalGroup.scene) return;
    
    const scene = bantalGroup.scene;
    const randX = Phaser.Math.Between(40, scene.scale.width - 40);
    
    // Pilih asset bantal secara acak (50% bantal.png, 50% bantal2_bulat)
    const randomBantal = BANTAL_JATUH_ASSETS[Math.floor(Math.random() * BANTAL_JATUH_ASSETS.length)];
    
    let pillow = bantalGroup.create(randX, -15, randomBantal);
    pillow.setDisplaySize(50, 50);
    pillow.setCircle(25);  // Collision lingkaran
    pillow.setBounceY(0.03);
    pillow.setGravityY(100);
    pillow.setCollideWorldBounds(false);
}

function updateTimer() {
    if (!gameActive) return;
    
    timeLeft--;
    
    const domTimer = document.getElementById('timer-display');
    if (domTimer) {
        domTimer.innerText = timeLeft;
        
        const timerCard = document.querySelector('.timer-card');
        if (timeLeft <= 10) {
            timerCard.classList.add('critical');
        } else if (timeLeft <= 20) {
            timerCard.classList.add('warning');
            timerCard.classList.remove('critical');
        } else {
            timerCard.classList.remove('warning', 'critical');
        }
    }
    
    if (timeLeft <= 0) {
        endGame();
    }
}

function endGame() {
    if (!gameActive) return;
    
    gameActive = false;
    
    if (timerEvent) timerEvent.remove();
    
    if (bantalGroup) {
        bantalGroup.setVelocityY(0);
        bantalGroup.children.iterate(bantal => {
            if (bantal) {
                bantal.body.setGravityY(0);
                bantal.body.setVelocityY(0);
            }
        });
    }
    
    if (kasurPemain) kasurPemain.setImmovable(true);
    
    if (score > highestScore) {
        highestScore = score;
        localStorage.setItem('bantalHighScore', highestScore);
    }
    
    showGameOverModal(score, highestScore);
}

function showGameOverModal(currentScore, highScore) {
    const modal = document.getElementById('gameover-modal');
    const finalScoreSpan = document.getElementById('final-score');
    const highestScoreSpan = document.getElementById('highest-score');
    
    if (finalScoreSpan) finalScoreSpan.innerText = currentScore;
    if (highestScoreSpan) highestScoreSpan.innerText = highScore;
    
    if (modal) modal.classList.add('show');
}

function updateScoreDisplay() {
    const domScore = document.getElementById('score-display');
    if (domScore) domScore.innerText = score;
}

function update() {
    if (!gameActive) return;
    if (!kasurPemain || !cursors) return;
    
    if (cursors.left.isDown) {
        kasurPemain.x -= 6;
    } else if (cursors.right.isDown) {
        kasurPemain.x += 6;
    }
    
    kasurPemain.x = Phaser.Math.Clamp(kasurPemain.x, 40, this.scale.width - 40);
}

function resetGame() {
    if (game && game.scene && game.scene.scenes && game.scene.scenes[0]) {
        const scene = game.scene.scenes[0];
        
        if (scene.timerEvent) scene.timerEvent.remove();
        if (bantalGroup) bantalGroup.clear(true, true);
        
        score = 0;
        timeLeft = 30;
        gameActive = true;
        
        updateScoreDisplay();
        const domTimer = document.getElementById('timer-display');
        if (domTimer) domTimer.innerText = "30";
        const timerCard = document.querySelector('.timer-card');
        if (timerCard) timerCard.classList.remove('warning', 'critical');
        
        if (kasurPemain) kasurPemain.x = config.width / 2;
        
        const modal = document.getElementById('gameover-modal');
        if (modal) modal.classList.remove('show');
        
        scene.scene.restart();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const resetBtn = document.getElementById('reset-button');
    if (resetBtn) resetBtn.addEventListener('click', resetGame);
    
    const modalResetBtn = document.getElementById('modal-reset-btn');
    if (modalResetBtn) modalResetBtn.addEventListener('click', resetGame);
});