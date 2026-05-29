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
            gravity: { y: 200 },
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
let scoreText;
let cursors;
let catchSound;

// Daftar asset bantal (variasi)
const BANTAL_ASSETS = ['bantal', 'bantal2'];

// Inisialisasi game setelah DOM siap
window.onload = () => {
    game = new Phaser.Game(config);
};

// Fungsi preload: muat asset
function preload() {
    this.load.image('background', 'assets/background.jpg');
    this.load.image('kasur', 'assets/kasur.png');
    this.load.image('bantal', 'assets/bantal.png');
    this.load.image('bantal2', 'assets/bantal2.png');
}

// Fungsi create: atur dunia game
function create() {
    const scene = this;
    
    // --- LATAR BELAKANG ---
    let bg = this.add.image(0, 0, 'background').setOrigin(0, 0);
    bg.setDisplaySize(this.scale.width, this.scale.height);
    
    // === DEKORASI ATAS AGAR TIDAK MEPET ===
    // 1. Border dekoratif atas (seperti bingkai)
    let topBorder = this.add.rectangle(0, 0, this.scale.width, 12, 0x2c1e12, 0.5);
    topBorder.setOrigin(0, 0);
    
    // 2. Garis dekoratif tipis
    let topLine = this.add.rectangle(0, 12, this.scale.width, 2, 0xf5e7d9, 0.6);
    topLine.setOrigin(0, 0);
    
    // 3. Hiasan tambahan (lampu tidur / bulan kecil) di pojok kanan atas
    let moon = this.add.circle(this.scale.width - 45, 28, 18, 0xfff5b0, 0.7);
    let moonGlow = this.add.circle(this.scale.width - 45, 28, 24, 0xfff5b0, 0.2);
    
    // 4. Hiasan bintang kecil di area atas
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
    
    // Overlay malam (tipis)
    const overlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x0a1030, 0.15);
    overlay.setOrigin(0, 0);
    
    // --- KASUR (PEMAIN) ---
    kasur = this.physics.add.image(this.scale.width / 2, this.scale.height - 70, 'kasur');
    kasur.setCollideWorldBounds(true);
    kasur.setImmovable(true);
    kasur.body.setSize(kasur.width * 0.7, kasur.height * 0.6);
    kasur.setDisplaySize(130, 70);
    
    // --- KELOMPOK BANTAL ---
    bantalGroup = this.physics.add.group({
        allowGravity: true,
        immovable: false,
        bounceY: 0.1
    });
    
    // --- TUMBUKAN: kasur vs bantal ---
    this.physics.add.collider(kasur, bantalGroup, (kasurObj, bantal) => {
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
    
    // --- SPAWN BANTAL (dengan variasi) ---
    this.time.addEvent({
        delay: 1200,
        callback: spawnPillow,
        callbackScope: this,
        loop: true
    });
    
    // --- SKOR TEKS ---
    scoreText = this.add.text(25, 22, 'Skor: 0', {
        fontFamily: 'monospace',
        fontSize: '30px',
        backgroundColor: '#000000aa',
        padding: { x: 14, y: 8 },
        color: '#FFF8E7',
        borderRadius: 24
    }).setScrollFactor(0);
    
    // --- KONTROL: mouse / touch ---
    this.input.on('pointermove', (pointer) => {
        let newX = pointer.worldX;
        newX = Phaser.Math.Clamp(newX, 50, this.scale.width - 50);
        kasur.x = newX;
    });
    
    this.input.on('touchmove', (pointer) => {
        let newX = pointer.worldX;
        newX = Phaser.Math.Clamp(newX, 50, this.scale.width - 50);
        kasur.x = newX;
    });
    
    // --- KONTROL KEYBOARD ---
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
        console.log("Web Audio tidak didukung");
        catchSound = null;
    }
    
    // --- HIASAN BINTANG UTAMA (di langit) ---
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

// Fungsi spawn bantal dengan variasi
function spawnPillow() {
    if (!bantalGroup || !bantalGroup.scene) return;
    const scene = bantalGroup.scene;
    const randX = Phaser.Math.Between(50, scene.scale.width - 50);
    
    // Pilih asset bantal secara acak
    const randomBantal = BANTAL_ASSETS[Math.floor(Math.random() * BANTAL_ASSETS.length)];
    
    let pillow = bantalGroup.create(randX, -20, randomBantal);
    pillow.setDisplaySize(48, 48);
    pillow.setCircle(22);
    pillow.setBounceY(0.05);
    pillow.setGravityY(200);
    pillow.setCollideWorldBounds(false);
}

function updateScoreDisplay() {
    const domScore = document.getElementById('score-display');
    if (domScore) domScore.innerText = score;
    if (scoreText) scoreText.setText(`Skor: ${score}`);
}

function update() {
    if (!kasur || !cursors) return;
    
    if (cursors.left.isDown) {
        kasur.x -= 8;
    } else if (cursors.right.isDown) {
        kasur.x += 8;
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
                if (bantalGroup) {
                    bantalGroup.clear(true, true);
                }
                score = 0;
                updateScoreDisplay();
                if (kasur) kasur.x = config.width / 2;
            }
        });
    }
});