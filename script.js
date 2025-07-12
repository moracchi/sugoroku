// ゲーム状態管理
class SugorokuGame {
    constructor() {
        // プレイヤー設定
        this.players = [
            { name: 'けんちゃん', position: 0, color: '🔴', skipNext: false, doubleNext: false },
            { name: 'パパ', position: 0, color: '🔵', skipNext: false, doubleNext: false },
            { name: 'ママ', position: 0, color: '🟡', skipNext: false, doubleNext: false }
        ];
        
        this.currentPlayer = 0;
        this.gameEnded = false;
        
        // 【改良】ギミックマス設定（22番を21番に移動）
        this.specialSquares = {
            3: { emoji: '🚀', name: 'ロケットダッシュ', action: () => this.warpTo(8), sound: 'rocket' },
            5: { emoji: '😭', name: '忘れ物', action: () => this.backToStart(), sound: 'sad' },
            7: { emoji: '✨', name: 'ラッキーセブン', action: () => this.rollAgain(), sound: 'lucky' },
            10: { emoji: '😴', name: 'お昼寝タイム', action: () => this.skipNextTurn(), sound: 'sleep' },
            12: { emoji: '💨', name: '追い風', action: () => this.doubleNextRoll(), sound: 'wind' },
            15: { emoji: '🔄', name: '場所交換', action: () => this.swapWithOther(), sound: 'swap' },
            18: { emoji: '💣', name: '爆弾', action: () => this.backTo(10), sound: 'bomb' },
            20: { emoji: '💰', name: 'お小遣いゲット', action: () => this.moveForward(5), sound: 'money' },
            21: { emoji: '🌀', name: 'ブラックホール', action: () => this.allToStart(), sound: 'blackhole' }, // 22から21へ移動
            24: { emoji: '⛈️', name: '大嵐', action: () => this.backTo(15), sound: 'storm' },
            28: { emoji: '🎲', name: '運命の分かれ道', action: () => this.fortuneChoice(), sound: 'fortune' },
            29: { emoji: '😱', name: 'ゴール目前で悲劇', action: () => this.backToStart(), sound: 'tragedy' }
        };
        
        // DOM要素のキャッシュ
        this.dom = {
            board: document.getElementById('board'),
            message: document.getElementById('message'),
            dice: document.getElementById('dice'),
            diceResult: document.getElementById('dice-result'),
            rollButton: document.getElementById('roll-button'),
            bgmToggleButton: document.getElementById('bgm-toggle'),
            backgroundMusic: document.getElementById('background-music'),
            logContent: document.getElementById('log-content'),
            modal: document.getElementById('game-end-modal'),
            winnerMessage: document.getElementById('winner-message'),
            animationOverlay: document.getElementById('animation-overlay'),
            specialEffect: document.getElementById('special-effect'),
            celebrationOverlay: document.getElementById('goal-celebration'),
            currentPlayerAvatar: document.getElementById('current-player-avatar'),
            currentPlayerName: document.getElementById('current-player-name'),
            excitementBars: document.querySelectorAll('.excitement-bar')
        };
        
        // 音声コンテキスト初期化
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.init();
    }
    
    // ゲーム初期化
    init() {
        this.createBoard();
        this.updateDisplay();
        this.bindEvents();
        this.addLog('ゲームを開始しました！');
    }
    
    // すごろくボード作成
    createBoard() {
        const board = this.dom.board;
        board.innerHTML = '';
        
        for (let i = 0; i <= 30; i++) {
            const square = document.createElement('div');
            square.className = 'square';
            square.id = `square-${i}`;
            
            if (i === 0) {
                square.classList.add('start');
                square.innerHTML = '<div>スタート</div><div>🏁</div>';
            } else if (i === 30) {
                square.classList.add('goal');
                square.innerHTML = '<div>ゴール</div><div>🏆</div>';
            } else if (this.specialSquares[i]) {
                square.classList.add('special');
                const special = this.specialSquares[i];
                square.innerHTML = `<div>${i}</div><div>${special.emoji}</div>`;
            } else {
                square.classList.add('normal');
                square.innerHTML = `<div>${i}</div>`;
            }
            
            // プレイヤーコマ表示用div追加
            const playerPieces = document.createElement('div');
            playerPieces.className = 'player-pieces';
            square.appendChild(playerPieces);
            
            board.appendChild(square);
        }
    }
    
    // イベントバインド
    bindEvents() {
        this.dom.rollButton.addEventListener('click', () => this.rollDice());
        document.getElementById('restart-button').addEventListener('click', () => this.restart());
        this.dom.bgmToggleButton.addEventListener('click', () => this.toggleBGM());
        
        // ユーザーの最初の操作でBGMを開始するためのイベント
        document.body.addEventListener('click', () => this.tryStartBGM(), { once: true });
    }

    // BGM再生機能
    tryStartBGM() {
        if (this.dom.backgroundMusic.paused) {
            this.dom.backgroundMusic.play().catch(e => console.log("BGM再生に失敗:", e));
        }
    }

    toggleBGM() {
        if (this.dom.backgroundMusic.paused) {
            this.dom.backgroundMusic.play();
            this.dom.bgmToggleButton.textContent = '🎵 BGM ON/OFF';
        } else {
            this.dom.backgroundMusic.pause();
            this.dom.bgmToggleButton.textContent = '🔇 BGM OFF';
        }
    }
    
    // 【改良】射幸性を大幅に煽るサイコロ演出
    rollDice() {
        if (this.gameEnded) return;
        
        const player = this.players[this.currentPlayer];
        
        // スキップチェック
        if (player.skipNext) {
            player.skipNext = false;
            this.addLog(`${player.name}は1回休みです。`);
            this.playSound('skip');
            this.nextPlayer();
            return;
        }
        
        // ボタンを無効化し、期待感を演出
        this.dom.rollButton.disabled = true;
        this.dom.rollButton.textContent = '🎰 運命が決まる... 🎰';
        this.dom.diceResult.classList.remove('visible');
        
        // 興奮度メーターアニメーション
        this.animateExcitementMeter();
        
        // 射幸性を煽る演出音
        this.playSound('anticipation');
        
        // サイコロを超絶回転
        this.dom.dice.classList.add('is-rolling');
        
        // 2秒間の期待感演出
        setTimeout(() => {
            this.dom.dice.classList.remove('is-rolling');
            
            let diceValue = Math.floor(Math.random() * 6) + 1;
            
            // 倍ロール効果
            if (player.doubleNext) {
                diceValue *= 2;
                player.doubleNext = false;
                this.addLog(`${player.name}の追い風効果でサイコロが倍になりました！`);
                this.playSound('double-bonus');
            }
            
            // 結果表示
            this.dom.dice.textContent = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][diceValue - 1];
            this.dom.diceResult.textContent = `🎉 ${diceValue}が出ました！ 🎉`;
            this.dom.diceResult.classList.add('visible');
            
            // 結果に応じた演出音
            if (diceValue >= 5) {
                this.playSound('high-roll');
            } else if (diceValue === 1) {
                this.playSound('low-roll');
            } else {
                this.playSound('normal-roll');
            }
            
            // ボタンを元に戻す
            this.dom.rollButton.textContent = '🎰 運命を決める 🎰';
            
            setTimeout(() => {
                this.movePlayer(diceValue);
                this.dom.rollButton.disabled = false;
            }, 1500);

        }, 2000); // 2秒間の演出
    }
    
    // 【新規】興奮度メーターアニメーション
    animateExcitementMeter() {
        this.dom.excitementBars.forEach((bar, index) => {
            setTimeout(() => {
                bar.style.background = '#ff6b6b';
                bar.style.transform = 'scaleY(2)';
            }, index * 100);
        });
        
        setTimeout(() => {
            this.dom.excitementBars.forEach(bar => {
                bar.style.background = '#333';
                bar.style.transform = 'scaleY(1)';
            });
        }, 2000);
    }
    
    // プレイヤー移動
    movePlayer(steps) {
        const player = this.players[this.currentPlayer];
        const oldPosition = player.position;
        let newPosition = oldPosition + steps;
        
        // ぴったりゴールルール
        if (newPosition > 30) {
            newPosition = 30 - (newPosition - 30);
        }
        
        player.position = newPosition;
        this.addLog(`${player.name}が${steps}マス進んで${newPosition}マス目に移動しました。`);
        
        // プレイヤーコマ移動アニメーション
        this.animatePlayerMovement(oldPosition, newPosition, () => {
            // ゴールチェック
            if (newPosition === 30) {
                this.endGame(player.name);
                return;
            }
            
            // ギミックチェック
            if (this.specialSquares[newPosition]) {
                this.activateSpecial(newPosition);
            } else {
                this.nextPlayer();
            }
        });
        
        this.playSound('move');
    }
    
    // プレイヤー移動アニメーション
    animatePlayerMovement(from, to, callback) {
        this.updatePlayerPositions();
        
        // 移動先のマスにアニメーション効果
        const targetSquare = document.getElementById(`square-${to}`);
        targetSquare.style.transform = 'scale(1.2)';
        targetSquare.style.boxShadow = '0 0 20px #ff6b6b';
        
        setTimeout(() => {
            targetSquare.style.transform = '';
            targetSquare.style.boxShadow = '';
            callback();
        }, 800);
    }
    
    // 画面中央でのギミック演出
    activateSpecial(position) {
        const special = this.specialSquares[position];
        const player = this.players[this.currentPlayer];
        
        this.addLog(`${player.name}が「${special.name}」に止まりました！ ${special.emoji}`);
        this.playSound(special.sound || 'special');
        
        // 中央オーバーレイでアニメーション表示
        this.dom.specialEffect.textContent = special.emoji;
        this.dom.animationOverlay.classList.add('active');
        
        // 演出が終わったら非表示にしてからアクション実行
        setTimeout(() => {
            this.dom.animationOverlay.classList.remove('active');
            setTimeout(() => {
                special.action();
            }, 300);
        }, 1500);
    }
    
    // 画面中央での豪華なゴール演出
    showGoalCelebration(winnerName) {
        this.dom.celebrationOverlay.innerHTML = '';
        this.dom.celebrationOverlay.classList.add('active');
        this.playSound('win');

        // 中央に勝利メッセージを表示
        const goalMessage = document.createElement('div');
        goalMessage.className = 'goal-message';
        goalMessage.textContent = `🎉 ${winnerName} 優勝! 🎉`;
        this.dom.celebrationOverlay.appendChild(goalMessage);

        // 紙吹雪を生成
        for (let i = 0; i < 200; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            confetti.style.left = Math.random() * 100 + 'vw';
            confetti.style.animationDelay = Math.random() * 3 + 's';
            confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 60%)`;
            confetti.style.transform = `scale(${Math.random() * 1 + 0.5})`;
            this.dom.celebrationOverlay.appendChild(confetti);
        }

        setTimeout(() => {
            this.dom.winnerMessage.textContent = `🎉 ${winnerName}の勝利！ おめでとう！ 🎉`;
            this.dom.modal.style.display = 'block';
        }, 3000);

        setTimeout(() => {
            this.dom.celebrationOverlay.classList.remove('active');
            this.dom.celebrationOverlay.innerHTML = '';
        }, 5000);
    }

    // ゲーム終了
    endGame(winnerName) {
        this.gameEnded = true;
        this.dom.backgroundMusic.pause();
        this.addLog(`${winnerName}がゴールしました！ゲーム終了です。`);
        this.showGoalCelebration(winnerName);
    }
    
    // 次のプレイヤーのターン
    nextPlayer() {
        if (this.gameEnded) return;
        this.currentPlayer = (this.currentPlayer + 1) % 3;
        this.updateDisplay();
    }
    
    // 画面表示更新（プレイヤーターンを大きく強調）
    updateDisplay() {
        const currentPlayerObj = this.players[this.currentPlayer];
        
        // ヘッダーの大きなプレイヤーターン表示を更新
        this.dom.currentPlayerAvatar.textContent = currentPlayerObj.color;
        this.dom.currentPlayerName.textContent = currentPlayerObj.name;
        
        // メッセージ更新
        this.dom.message.textContent = `サイコロを振ってね 🎯`;
        
        // プレイヤーカード更新
        this.players.forEach((player, index) => {
            const card = document.getElementById(`player-${['kenchan', 'papa', 'mama'][index]}`);
            const positionSpan = card.querySelector('.player-position span');
            const statusDiv = card.querySelector('.player-status');
            
            card.classList.toggle('active', index === this.currentPlayer);
            positionSpan.textContent = player.position === 0 ? 'スタート' : `${player.position}マス目`;
            
            // プレイヤーステータス更新
            if (index === this.currentPlayer) {
                statusDiv.textContent = '🎯 出番です！';
                statusDiv.style.background = '#ffeb3b';
                statusDiv.style.color = '#333';
            } else {
                statusDiv.textContent = '待機中...';
                statusDiv.style.background = '#e8f4f8';
                statusDiv.style.color = '#4a90e2';
            }
        });
        
        // プレイヤーコマ更新
        this.updatePlayerPositions();
    }
    
    // プレイヤーコマ位置更新（現在のプレイヤーを特別に強調）
    updatePlayerPositions() {
        // 全てのマスからプレイヤーコマを削除
        document.querySelectorAll('.player-pieces').forEach(pieces => {
            pieces.innerHTML = '';
        });
        
        // 各プレイヤーのコマを配置
        this.players.forEach((player, index) => {
            const square = document.getElementById(`square-${player.position}`);
            if (square) {
                const piece = document.createElement('div');
                piece.className = `player-piece ${['kenchan', 'papa', 'mama'][index]}`;
                
                // 現在のプレイヤーのコマを特別に強調
                if (index === this.currentPlayer) {
                    piece.classList.add('current-player');
                }
                
                piece.textContent = player.color;
                square.querySelector('.player-pieces').appendChild(piece);
            }
        });
    }
    
    // ログ追加
    addLog(message) {
        const logContent = this.dom.logContent;
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.textContent = message;
        
        logContent.appendChild(logEntry);
        logContent.scrollTop = logContent.scrollHeight;
    }
    
    // ゲームリスタート
    restart() {
        this.players.forEach(player => {
            player.position = 0;
            player.skipNext = false;
            player.doubleNext = false;
        });
        
        this.currentPlayer = 0;
        this.gameEnded = false;
        
        this.dom.modal.style.display = 'none';
        this.dom.diceResult.textContent = '';
        this.dom.logContent.innerHTML = '<div class="log-entry">ゲームを再開しました！</div>';
        
        this.updateDisplay();
        
        if (this.dom.bgmToggleButton.textContent.includes('ON')) {
            this.dom.backgroundMusic.play();
        }
    }
    
    // 【改良】効果音再生（射幸性を煽る音を追加）
    playSound(type) {
        if (!this.audioContext) return;
        
        const sounds = {
            'anticipation': { freqs: [440, 523, 659, 784], duration: 1.5, type: 'triangle', vol: 0.15 },
            'high-roll': { freqs: [784, 988, 1175, 1397], duration: 1.0, type: 'sine', vol: 0.2 },
            'low-roll': { freqs: [220, 175, 147], duration: 0.8, type: 'triangle', vol: 0.1 },
            'normal-roll': { freq: 440, duration: 0.3, type: 'square', vol: 0.1 },
            'double-bonus': { freqs: [659, 784, 988, 1175], duration: 1.2, type: 'sawtooth', vol: 0.2 },
            'move': { freq: 523, duration: 0.2, type: 'sine', vol: 0.1 },
            'skip': { freq: 349, duration: 0.25, type: 'triangle', vol: 0.1 },
            'win': { freqs: [523, 659, 784, 1047], duration: 2.0, type: 'triangle', vol: 0.2 },
            'rocket': { freqs: [440, 880, 1320], duration: 0.8, type: 'sawtooth', vol: 0.15 },
            'sad': { freqs: [440, 220, 110], duration: 0.8, type: 'sine', vol: 0.1 },
            'lucky': { freqs: [523, 659, 784, 1047], duration: 1.0, type: 'triangle', vol: 0.15 },
            'sleep': { freqs: [440, 220], duration: 1.2, type: 'sine', vol: 0.1 },
            'wind': { freqs: [1000, 1500, 2000], duration: 0.7, type: 'sawtooth', vol: 0.1 },
            'swap': { freqs: [440, 880, 440], duration: 0.5, type: 'square', vol: 0.1 },
            'bomb': { freq: 100, duration: 0.4, type: 'sawtooth', vol: 0.2 },
            'money': { freqs: [659, 784, 988], duration: 0.6, type: 'sine', vol: 0.15 },
            'blackhole': { freqs: [880, 440, 220, 110], duration: 1.0, type: 'triangle', vol: 0.1 },
            'storm': { freqs: [300, 200, 400, 150], duration: 0.8, type: 'sawtooth', vol: 0.1 },
            'fortune': { freqs: [523, 440, 659, 784], duration: 1.2, type: 'square', vol: 0.1 },
            'tragedy': { freqs: [440, 220, 110, 55], duration: 1.0, type: 'sawtooth', vol: 0.1 }
        };
        
        const sound = sounds[type];
        if (!sound) return;

        if (sound.freqs) {
            const noteDuration = sound.duration / sound.freqs.length;
            sound.freqs.forEach((freq, index) => {
                setTimeout(() => this.createTone(freq, noteDuration * 0.9, sound.type, sound.vol), index * noteDuration * 1000);
            });
        } else {
            this.createTone(sound.freq, sound.duration, sound.type, sound.vol);
        }
    }

    // 効果音生成
    createTone(freq, dur, type, vol = 0.1) {
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(this.audioContext.destination);
        
        osc.frequency.setValueAtTime(freq, this.audioContext.currentTime);
        osc.type = type || 'sine';
        
        gain.gain.setValueAtTime(vol, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + dur);
        
        osc.start();
        osc.stop(this.audioContext.currentTime + dur);
    }
    
    // ギミック効果: ワープ
    warpTo(targetPosition) {
        const player = this.players[this.currentPlayer];
        player.position = targetPosition;
        this.addLog(`${player.name}が${targetPosition}マス目にワープしました！`);
        this.updatePlayerPositions();
        this.nextPlayer();
    }
    
    // ギミック効果: スタートに戻る
    backToStart() {
        const player = this.players[this.currentPlayer];
        player.position = 0;
        this.addLog(`${player.name}がスタートに戻りました。`);
        this.updatePlayerPositions();
        this.nextPlayer();
    }
    
    // ギミック効果: 指定位置に戻る
    backTo(position) {
        const player = this.players[this.currentPlayer];
        player.position = position;
        this.addLog(`${player.name}が${position}マス目に戻りました。`);
        this.updatePlayerPositions();
        this.nextPlayer();
    }
    
    // ギミック効果: もう一度サイコロ
    rollAgain() {
        this.addLog(`${this.players[this.currentPlayer].name}はもう一度サイコロを振れます！`);
        // 次のプレイヤーに移らずそのまま続行
    }
    
    // ギミック効果: 1回休み
    skipNextTurn() {
        const player = this.players[this.currentPlayer];
        player.skipNext = true;
        this.addLog(`${player.name}は次回1回休みになります。`);
        this.nextPlayer();
    }
    
    // ギミック効果: 次回倍ロール
    doubleNextRoll() {
        const player = this.players[this.currentPlayer];
        player.doubleNext = true;
        this.addLog(`${player.name}は次回サイコロの目が倍になります！`);
        this.nextPlayer();
    }
    
    // ギミック効果: 前進
    moveForward(steps) {
        const player = this.players[this.currentPlayer];
        const oldPosition = player.position;
        let newPosition = oldPosition + steps;
        
        if (newPosition > 30) {
            newPosition = 30 - (newPosition - 30);
        }
        
        player.position = newPosition;
        this.addLog(`${player.name}が${steps}マス進んで${newPosition}マス目に移動しました。`);
        this.updatePlayerPositions();
        
        if (newPosition === 30) {
            this.endGame(player.name);
        } else {
            this.nextPlayer();
        }
    }
    
    // ギミック効果: 他プレイヤーと場所交換
    swapWithOther() {
        const currentPlayerObj = this.players[this.currentPlayer];
        const otherPlayers = this.players.filter((_, index) => index !== this.currentPlayer);
        const randomOther = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
        
        const tempPosition = currentPlayerObj.position;
        currentPlayerObj.position = randomOther.position;
        randomOther.position = tempPosition;
        
        this.addLog(`${currentPlayerObj.name}と${randomOther.name}が場所を交換しました！`);
        this.updatePlayerPositions();
        this.nextPlayer();
    }
    
    // ギミック効果: 全員スタートに戻る
    allToStart() {
        this.players.forEach(player => {
            player.position = 0;
        });
        this.addLog('全員がスタートに戻りました！');
        this.updatePlayerPositions();
        this.nextPlayer();
    }
    
    // ギミック効果: 運命の分かれ道
    fortuneChoice() {
        const player = this.players[this.currentPlayer];
        const isEven = Math.random() < 0.5;
        
        if (isEven) {
            player.position = 30;
            this.addLog(`${player.name}の運命の分かれ道で偶数が出ました！ゴールです！`);
            this.updatePlayerPositions();
            this.endGame(player.name);
        } else {
            player.position = Math.max(0, player.position - 5);
            this.addLog(`${player.name}の運命の分かれ道で奇数が出ました。5マス戻ります。`);
            this.updatePlayerPositions();
            this.nextPlayer();
        }
    }
}

// ゲーム開始
document.addEventListener('DOMContentLoaded', () => {
    new SugorokuGame();
});
