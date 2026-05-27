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
            gravity: { y: 180 },
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
let touchMove = null;
let catchSound;

// Inisialisasi game setelah DOM siap
window.onload = () => {
    game = new Phaser.Game(config);
};

// Fungsi preload: muat asset
function preload() {
    // --- LOAD ASSET (gunakan gambar dari folder assets) ---
    // Background kamar tidur
    this.load.image('background', 'assets/background.jpg');
    // Kasur (pemain)
    this.load.image('kasur', 'assets/kasur.png');
    // Bantal
    this.load.image('bantal', 'assets/bantal.png');
    
    // (Opsional) variasi bantal kedua - bisa aktifkan jika punya file
    // this.load.image('bantal2', 'assets/bantal2.png');
    
    // Efek suara "dug" sederhana (menggunakan Web Audio, fallback jika file tidak ada)
    // Kita buat secara prosedural jika tidak ada asset suara
}

// Fungsi create: atur dunia game
function create() {
    const scene = this;
    
    // --- LATAR BELAKANG ---
    // Background kamar (skala penuhi layar)
    let bg = this.add.image(0, 0, 'background').setOrigin(0, 0);
    bg.setDisplaySize(this.scale.width, this.scale.height);
    
    // Efek gradasi malam tambahan (overlay semi-transparan)
    const overlay = this.add.rectangle(0, 0, this.scale.width, this.scale.height, 0x0a1030, 0.25);
    overlay.setOrigin(0, 0);
    
    // --- FISIK & KASUR ---
    kasur = this.physics.add.image(this.scale.width / 2, this.scale.height - 70, 'kasur');
    kasur.setCollideWorldBounds(true);
    kasur.setImmovable(true);
    kasur.body.setSize(kasur.width * 0.7, kasur.height * 0.6);
    kasur.setDisplaySize(130, 70);
    
    // --- KELOMPOK BANTAL ---
    bantalGroup = this.physics.add.group({
        allowGravity: true,
        immovable: false,
        bounceX: 0,
        bounceY: 0.2
    });
    
    // --- TUMBUKAN: kasur vs bantal ---
    this.physics.add.collider(kasur, bantalGroup, (kasurObj, bantal) => {
        // Tangkap bantal
        bantal.destroy();
        score++;
        updateScoreDisplay();
        
        // Mainkan efek suara "dug" (lembut)
        if (catchSound && catchSound.play) {
            catchSound.play();
        } else {
            // Fallback: buat suara pendek prosedural
            try {
                const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                osc.frequency.value = 280;
                gain.gain.value = 0.15;
                osc.start();
                gain.gain.exponentialRampToValueAtTime(0.00001, audioCtx.currentTime + 0.3);
                osc.stop(audioCtx.currentTime + 0.25);
                if (audioCtx.state === 'suspended') audioCtx.resume();
            } catch(e) { /* silent */ }
        }
        
        // Efek getar kecil pada kasur (animasi singkat)
        scene.tweens.add({
            targets: kasurObj,
            y: kasurObj.y - 5,
            duration: 60,
            yoyo: true,
            repeat: 0
        });
    });
    
    // --- SPAWN BANTAL (timer setiap 1.2 detik ~ 1300ms) ---
    this.time.addEvent({
        delay: 1200,
        callback: spawnPillow,
        callbackScope: this,
        loop: true
    });
    
    // --- SKOR TEKS ---
    scoreText = this.add.text(20, 18, 'Skor: 0', {
        fontFamily: 'monospace',
        fontSize: '32px',
        backgroundColor: '#000000aa',
        padding: { x: 12, y: 6 },
        color: '#FFF8E7',
        borderRadius: 20
    }).setScrollFactor(0);
    
    // --- KONTROL: keyboard dan mouse/touch ---
    cursors = this.input.keyboard.createCursorKeys();
    
    // Kontrol mouse / touch (gerakan horizontal)
    this.input.on('pointermove', (pointer) => {
        let newX = pointer.worldX;
        newX = Phaser.Math.Clamp(newX, 50, this.scale.width - 50);
        kasur.x = newX;
    });
    
    // Untuk layar sentuh juga handle secara langsung
    this.input.on('touchmove', (pointer) => {
        let newX = pointer.worldX;
        newX = Phaser.Math.Clamp(newX, 50, this.scale.width - 50);
        kasur.x = newX;
    });
    
    // --- BUAT SEDERHANA SUARA "DUG" (pake Web Audio) ---
    try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContextClass();
        const gainNode = audioCtx.createGain();
        gainNode.gain.value = 0;
        gainNode.connect(audioCtx.destination);
        
        catchSound = {
            play: () => {
                if (audioCtx.state === 'suspended') {
                    audioCtx.resume();
                }
                const osc = audioCtx.createOscillator();
                osc.type = 'sine';
                osc.frequency.value = 320;
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);
                gain.gain.value = 0.2;
                osc.start();
                gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.25);
                osc.stop(audioCtx.currentTime + 0.25);
            }
        };
    } catch(e) {
        catchSound = null;
    }
    
    // Efek malam (bintang jatuh sederhana sebagai hiasan)
    for(let i = 0; i < 60; i++) {
        let star = this.add.circle(Phaser.Math.Between(10, this.scale.width-10), Phaser.Math.Between(10, 150), 1.5, 0xfff5b0, 0.7);
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

// Fungsi spawn bantal
function spawnPillow() {
    if (!bantalGroup || !bantalGroup.scene) return;
    const scene = bantalGroup.scene;
    const randX = Phaser.Math.Between(40, scene.scale.width - 40);
    // Gunakan asset 'bantal', bisa juga random bantal2 jika ingin variasi
    let pillow = bantalGroup.create(randX, 10, 'bantal');
    pillow.setDisplaySize(48, 48);
    pillow.setCircle(22);
    pillow.setBounceY(0.15);
    pillow.setGravityY(180);
    pillow.setCollideWorldBounds(false);
    // Efek kecil skala spawn
    scene.tweens.add({
        targets: pillow,
        scaleX: 1.05,
        scaleY: 0.95,
        duration: 150,
        yoyo: true,
        repeat: 0
    });
}

// Update tampilan skor dari DOM dan Phaser text
function updateScoreDisplay() {
    const domScore = document.getElementById('score-display');
    if (domScore) domScore.innerText = score;
    if (scoreText) scoreText.setText(`Skor: ${score}`);
}

// Fungsi update per-frame (gerakan keyboard)
function update() {
    if (!kasur || !cursors) return;
    // Gerakan keyboard kiri/kanan
    if (cursors.left.isDown) {
        kasur.x -= 8;
    } else if (cursors.right.isDown) {
        kasur.x += 8;
    }
    // Batasi posisi kasur
    kasur.x = Phaser.Math.Clamp(kasur.x, 45, this.scale.width - 45);
}

// Tombol reset dari luar
document.addEventListener('DOMContentLoaded', () => {
    const resetBtn = document.getElementById('reset-button');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            if (game && game.scene && game.scene.scenes && game.scene.scenes[0]) {
                const scene = game.scene.scenes[0];
                // Hancurkan bantal yang tersisa
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

// Ekspor agar bisa direset lewat global (optional)
window.resetGameManually = () => {
    if (game && game.scene && game.scene.scenes && game.scene.scenes[0]) {
        const scene = game.scene.scenes[0];
        if (bantalGroup) bantalGroup.clear(true, true);
        score = 0;
        updateScoreDisplay();
        if (kasur) kasur.x = config.width / 2;
    }
};