// Konfigurasi Phaser
const config = {
    type: Phaser.AUTO,
    parent: 'game-container',
    width: 900,
    height: 600,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 120 },
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
let kasur;
let bantalGroup;
let score = 0;
let cursors;
let catchSound;

// Variabel Timer
let timeLeft = 30;
let timerEvent;
let gameActive = true;

// Daftar asset bantal
const BANTAL_ASSETS = ['bantal', 'bantal2'];

// Inisialisasi game
window.onload = () => {
    game = new Phaser.Game(config);
};

// Fungsi preload
function preload() {
    this.load.image('background', 'assets/background.jpg');
    this.load.image('kasur', 'assets/kasur.png');
    this.load.image('bantal', 'assets/bantal.png');
    this.load.image('bantal2', 'assets/bantal2.png');
}

// Fungsi create
function create() {
    const scene = this;
    gameActive = true;
    timeLeft = 30;
    
    // Reset tampilan timer di DOM
    const domTimer = document.getElementById('timer-display');
    if (domTimer) domTimer.innerText = "30";
    const timerCard = document.querySelector('.timer-card');
    if (timerCard) timerCard.classList.remove('warning', 'critical');
    
    // --- LATAR BELAKANG ---
    let bg = this.add.image(0, 0, 'background').setOrigin(0, 0);
    bg.setDisplaySize(this.scale.width, this.scale.height);
    
    // Dekorasi atas
    let topBorder = this.add.rectangle(0, 0, this.scale.width, 12, 0x2c1e12, 0.5);
    topBorder.setOrigin(0, 0);
    let topLine = this.add.rectangle(0, 12, this.scale.width, 2, 0xf5e7d9, 0.6);
    topLine.setOrigin(0, 0);
    
    // Hiasan bulan
    let moon = this.add.circle(this.scale.width - 45, 28, 18, 0xfff5b0, 0.7);
    let moonGlow = this.add.circle(this.scale.width - 45, 28, 24, 0xfff5b0, 0.2);
    
    // Hiasan bintang dekoratif
    for(let i = 0; i < 12; i++) {
        let starDecor = this.add.circle(
            Phaser.Math.Between(20, this.scale.width - 20), 
            Phaser.Math.Between(18, 50), 
            2, 
            0xfff5b0, 
            0.5
        );
        this.tweens.add({
            targets: starDecor,
            alpha: 0.1,
            duration: 1500 + Math.random() * 2000,
            yoyo: true,
            repeat: -1,
            delay: Math.random() * 2000
        });
    }
    
    // Overlay malam
    const overlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x0a1030, 0.15);
    overlay.setOrigin(0, 0);
    
    // --- KASUR ---
    kasur = this.physics.add.image(this.scale.width / 2, this.scale.height - 70, 'kasur');
    kasur.setCollideWorldBounds(true);
    kasur.setImmovable(true);
    kasur.body.setSize(kasur.width * 0.7, kasur.height * 0.6);
    kasur.setDisplaySize(130, 70);
    
    // --- KELOMPOK BANTAL ---
    bantalGroup = this.physics.add.group({
        allowGravity: true,
        immovable: false,
        bounceY: 0.05
    });
    
    // --- TUMBUKAN ---
    this.physics.add.collider(kasur, bantalGroup, (kasurObj, bantal) => {
        if (!gameActive) return;
        
        bantal.destroy();
        score++;
        updateScoreDisplay();
        
        if (catchSound && catchSound.play) {
            catchSound.play();
        }
        
        scene.tweens.add({
            targets: kasurObj,
            y: kasurObj.y - 4,
            duration: 50,
            yoyo: true,
            repeat: 0
        });
    });
    
    // --- SPAWN BANTAL ---
    this.time.addEvent({
        delay: 1400,
        callback: spawnPillow,
        callbackScope: this,
        loop: true
    });
    
    // --- TIMER 30 DETIK ---
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
        newX = Phaser.Math.Clamp(newX, 50, this.scale.width - 50);
        kasur.x = newX;
    });
    
    this.input.on('touchmove', (pointer) => {
        if (!gameActive) return;
        let newX = pointer.worldX;
        newX = Phaser.Math.Clamp(newX, 50, this.scale.width - 50);
        kasur.x = newX;
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
    for(let i = 0; i < 35; i++) {
        let star = this.add.circle(
            Phaser.Math.Between(30, this.scale.width - 30), 
            Phaser.Math.Between(20, 100), 
            1.5, 
            0xfff5b0, 
            0.6
        );
        this.tweens.add({
            targets: star,
            alpha: 0.1,
            duration: 2000 + Math.random() * 3000,
            yoyo: true,
            repeat: -1,
            delay: Math.random() * 3000
        });
    }
}

// Fungsi update timer
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

// Fungsi mengakhiri game
function endGame() {
    if (!gameActive) return;
    
    gameActive = false;
    
    if (timerEvent) {
        timerEvent.remove();
    }
    
    if (bantalGroup) {
        bantalGroup.setVelocityY(0);
        bantalGroup.children.iterate(bantal => {
            if (bantal) {
                bantal.body.setGravityY(0);
                bantal.body.setVelocityY(0);
            }
        });
    }
    
    if (kasur) {
        kasur.setImmovable(true);
    }
    
    const centerX = this.scale.width / 2;
    const centerY = this.scale.height / 2;
    
    this.add.text(centerX, centerY - 50, '⏰ WAKTU HABIS! ⏰', {
        fontFamily: 'monospace',
        fontSize: '36px',
        backgroundColor: '#000000cc',
        padding: { x: 20, y: 12 },
        color: '#ffcc88',
        borderRadius: 30
    }).setOrigin(0.5).setScrollFactor(0);
    
    this.add.text(centerX, centerY + 20, `Skor Akhir: ${score}`, {
        fontFamily: 'monospace',
        fontSize: '32px',
        backgroundColor: '#000000aa',
        padding: { x: 20, y: 10 },
        color: '#FFF8E7',
        borderRadius: 30
    }).setOrigin(0.5).setScrollFactor(0);
    
    this.add.text(centerX, centerY + 80, 'Klik "MULAI ULANG" untuk bermain lagi', {
        fontFamily: 'monospace',
        fontSize: '18px',
        backgroundColor: '#00000088',
        padding: { x: 15, y: 8 },
        color: '#dddddd',
        borderRadius: 20
    }).setOrigin(0.5).setScrollFactor(0);
}

// Fungsi spawn bantal - BANTAL DIPERBESAR
function spawnPillow() {
    if (!gameActive) return;
    if (!bantalGroup || !bantalGroup.scene) return;
    
    const scene = bantalGroup.scene;
    const randX = Phaser.Math.Between(50, scene.scale.width - 50);
    const randomBantal = BANTAL_ASSETS[Math.floor(Math.random() * BANTAL_ASSETS.length)];
    
    let pillow = bantalGroup.create(randX, -20, randomBantal);
    pillow.setDisplaySize(64, 64);  // DIUBAH: 48x48 → 64x64 (lebih besar)
    pillow.setCircle(30);            // DIUBAH: 22 → 30 (lingkaran collision lebih besar)
    pillow.setBounceY(0.03);
    pillow.setGravityY(120);
    pillow.setCollideWorldBounds(false);
}

function updateScoreDisplay() {
    const domScore = document.getElementById('score-display');
    if (domScore) domScore.innerText = score;
}

function update() {
    if (!gameActive) return;
    if (!kasur || !cursors) return;
    
    if (cursors.left.isDown) {
        kasur.x -= 7;
    } else if (cursors.right.isDown) {
        kasur.x += 7;
    }
    
    kasur.x = Phaser.Math.Clamp(kasur.x, 50, this.scale.width - 50);
}

// Tombol reset
document.addEventListener('DOMContentLoaded', () => {
    const resetBtn = document.getElementById('reset-button');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (game && game.scene && game.scene.scenes && game.scene.scenes[0]) {
                const scene = game.scene.scenes[0];
                
                if (scene.timerEvent) {
                    scene.timerEvent.remove();
                }
                
                if (bantalGroup) {
                    bantalGroup.clear(true, true);
                }
                
                score = 0;
                timeLeft = 30;
                gameActive = true;
                
                updateScoreDisplay();
                const domTimer = document.getElementById('timer-display');
                if (domTimer) domTimer.innerText = "30";
                const timerCard = document.querySelector('.timer-card');
                if (timerCard) timerCard.classList.remove('warning', 'critical');
                
                if (kasur) kasur.x = config.width / 2;
                
                scene.scene.restart();
            }
        });
    }
});