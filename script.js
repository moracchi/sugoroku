// 【効果音対応版】音楽修正版 - ゲーム状態管理
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
        this.gameStarted = false;
        this.currentMusic = 1;
        this.musicEnabled = true;
        this.soundEnabled = true; // 効果音有効フラグ
        this.userInteracted = false;
        this.audioInitialized = false;
        this.soundEffectsLoaded = 0; // 読み込まれた効果音数
        
        // ミステリーボックスマスの配置
        this.mysteryBoxPositions = [6, 11, 16, 22, 27];
        
        // ギミックマス設定
        this.specialSquares = {
            3: { emoji: '🚀', name: 'ロケットダッシュ', action: () => this.warpTo(8), sound: 'rocket' },
            5: { emoji: '😭', name: '忘れ物', action: () => this.backToStart(), sound: 'sad' },
            7: { emoji: '✨', name: 'ラッキーセブン', action: () => this.rollAgain(), sound: 'lucky' },
            10: { emoji: '😴', name: 'お昼寝タイム', action: () => this.skipNextTurn(), sound: 'sleep' },
            12: { emoji: '💨', name: '追い風', action: () => this.doubleNextRoll(), sound: 'wind' },
            15: { emoji: '🔄', name: '場所交換', action: () => this.swapWithOther(), sound: 'swap' },
            18: { emoji: '💣', name: '爆弾', action: () => this.backTo(10), sound: 'bomb' },
            20: { emoji: '💰', name: 'お小遣いゲット', action: () => this.moveForward(5), sound: 'money' },
            21: { emoji: '🌀', name: 'ブラックホール', action: () => this.allToStart(), sound: 'blackhole' },
            24: { emoji: '⛈️', name: '大嵐', action: () => this.backTo(15), sound: 'storm' },
            28: { emoji: '🎲', name: '運命の分かれ道', action: () => this.fortuneChoice(), sound: 'fortune' },
            29: { emoji: '😱', name: 'ゴール目前で悲劇', action: () => this.backToStart(), sound: 'tragedy' }
        };
        
        // ミステリーボックスで発動可能なギミック配列
        this.mysteryGimmicks = [
            { emoji: '🚀', name: 'ロケットダッシュ', action: () => this.warpTo(8), sound: 'rocket' },
            { emoji: '😭', name: '忘れ物', action: () => this.backToStart(), sound: 'sad' },
            { emoji: '✨', name: 'ラッキーセブン', action: () => this.rollAgain(), sound: 'lucky' },
            { emoji: '😴', name: 'お昼寝タイム', action: () => this.skipNextTurn(), sound: 'sleep' },
            { emoji: '💨', name: '追い風', action: () => this.doubleNextRoll(), sound: 'wind' },
            { emoji: '🔄', name: '場所交換', action: () => this.swapWithOther(), sound: 'swap' },
            { emoji: '💣', name: '爆弾', action: () => this.backTo(10), sound: 'bomb' },
            { emoji: '💰', name: 'お小遣いゲット', action: () => this.moveForward(5), sound: 'money' }
        ];
        
        // 【新機能】効果音要素名のリスト
        this.soundEffects = [
            'anticipation', 'critical-hit', 'high-roll', 'low-roll', 'normal-roll', 'double-bonus',
            'move', 'skip', 'win', 'firework', 'mystery-box', 'rocket', 'sad', 'lucky', 'sleep',
            'wind', 'swap', 'bomb', 'money', 'blackhole', 'storm', 'fortune', 'tragedy'
        ];
        
        // DOM要素のキャッシュ
        this.dom = {
            board: document.getElementById('board'),
            dice: document.getElementById('dice'),
            diceResult: document.getElementById('dice-result'),
            rollButton: document.getElementById('roll-button'),
            bgmToggleButton: document.getElementById('bgm-toggle'),
            musicTestButton: document.getElementById('music-test'),
            soundTestButton: document.getElementById('sound-test'),
            musicStatus: document.getElementById('music-status'),
            backgroundMusic1: document.getElementById('background-music-1'),
            backgroundMusic2: document.getElementById('background-music-2'),
            logContent: document.getElementById('log-content'),
            modal: document.getElementById('game-end-modal'),
            winnerMessage: document.getElementById('winner-message'),
            animationOverlay: document.getElementById('animation-overlay'),
            specialEffect: document.getElementById('special-effect'),
            celebrationOverlay: document.getElementById('goal-celebration'),
            fireworksCanvas: document.getElementById('fireworks-canvas'),
            currentPlayerAvatar: document.getElementById('current-player-avatar'),
            currentPlayerName: document.getElementById('current-player-name'),
            excitementBars: document.querySelectorAll('.excitement-bar'),
            emojiModal: document.getElementById('emoji-selection-modal'),
            startGameButton: document.getElementById('start-game-button'),
            restartButton: document.getElementById('restart-button'),
            changeEmojiButton: document.getElementById('change-emoji-button'),
            criticalHitOverlay: document.getElementById('critical-hit-overlay'),
            criticalHitText: document.getElementById('critical-hit-text'),
            criticalHitSubtext: document.getElementById('critical-hit-subtext'),
            mysteryBoxOverlay: document.getElementById('mystery-box-overlay'),
            mysteryBoxAnimation: document.getElementById('mystery-box-animation'),
            mysteryBoxRoulette: document.getElementById('mystery-box-roulette'),
            mysteryResultText: document.getElementById('mystery-result-text')
        };
        
        this.init();
    }
    
    // ゲーム初期化
    init() {
        this.bindEvents();
        this.bindEmojiSelection();
        this.setupAudioElements();
        this.setupSoundEffects(); // 【新機能】効果音セットアップ
        this.showEmojiSelection();
        this.updateMusicStatus('ready');
    }
    
    // 音声要素の設定
    setupAudioElements() {
        [this.dom.backgroundMusic1, this.dom.backgroundMusic2].forEach(audio => {
            if (audio) {
                audio.loop = true;
                audio.volume = 0.3;
                
                audio.addEventListener('canplaythrough', () => {
                    console.log(`${audio.id} 読み込み完了`);
                    this.audioInitialized = true;
                });
                
                audio.addEventListener('play', () => {
                    console.log(`${audio.id} 再生開始`);
                });
                
                audio.addEventListener('error', (e) => {
                    console.error(`${audio.id} 再生エラー:`, e);
                    this.updateMusicStatus('error');
                });
            }
        });
    }
    
    // 【新機能】効果音要素のセットアップ
    setupSoundEffects() {
        this.soundEffects.forEach(soundName => {
            const audio = document.getElementById(`sound-${soundName}`);
            if (audio) {
                audio.addEventListener('canplaythrough', () => {
                    this.soundEffectsLoaded++;
                    console.log(`効果音 ${soundName} 読み込み完了 (${this.soundEffectsLoaded}/${this.soundEffects.length})`);
                    
                    // すべての効果音が読み込まれた場合
                    if (this.soundEffectsLoaded >= this.soundEffects.length) {
                        console.log('すべての効果音の読み込みが完了しました');
                        this.addLog('🔊 効果音の読み込みが完了しました！');
                    }
                });
                
                audio.addEventListener('error', (e) => {
                    console.error(`効果音 ${soundName} 読み込みエラー:`, e);
                });
            }
        });
    }
    
    // 音楽ステータス更新
    updateMusicStatus(status) {
        const statusEl = this.dom.musicStatus;
        
        switch (status) {
            case 'ready':
                statusEl.textContent = '♪ 音楽準備完了';
                statusEl.className = '';
                break;
            case 'playing1':
                statusEl.textContent = '♪ 通常BGM再生中';
                statusEl.className = 'playing';
                break;
            case 'playing2':
                statusEl.textContent = '♪ 終盤BGM再生中';
                statusEl.className = 'playing';
                break;
            case 'stopped':
                statusEl.textContent = '♪ BGM停止中';
                statusEl.className = 'stopped';
                break;
            case 'error':
                statusEl.textContent = '⚠️ 音楽ファイル読み込みエラー';
                statusEl.className = 'error';
                break;
        }
    }
    
    // 絵文字選択機能
    showEmojiSelection() {
        this.dom.emojiModal.style.display = 'flex';
    }
    
    hideEmojiSelection() {
        this.dom.emojiModal.style.display = 'none';
    }
    
    bindEmojiSelection() {
        // 絵文字選択イベント
        document.querySelectorAll('.emoji-option').forEach(option => {
            option.addEventListener('click', (e) => {
                const playerIndex = parseInt(e.target.closest('.emoji-options').dataset.player);
                const emoji = e.target.dataset.emoji;
                
                this.userInteracted = true;
                
                e.target.closest('.emoji-options').querySelectorAll('.emoji-option').forEach(opt => {
                    opt.classList.remove('selected');
                });
                
                e.target.classList.add('selected');
                this.players[playerIndex].color = emoji;
                this.playSound('normal-roll');
            });
        });
        
        // ゲームスタートボタン
        this.dom.startGameButton.addEventListener('click', () => {
            this.userInteracted = true;
            this.hideEmojiSelection();
            this.startGame();
        });
        
        // コマ変更ボタン
        this.dom.changeEmojiButton.addEventListener('click', () => {
            this.dom.modal.style.display = 'none';
            this.showEmojiSelection();
        });
    }
    
    // ゲーム開始
    startGame() {
        this.gameStarted = true;
        this.createBoard();
        this.updateDisplay();
        this.addLog('🎉 ドキドキ究極版ゲームを開始しました！');
        
        // 音楽開始
        setTimeout(() => {
            this.checkMusicChange();
        }, 500);
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
            } else if (this.mysteryBoxPositions.includes(i)) {
                square.classList.add('mystery');
                square.innerHTML = `<div>${i}</div><div>🎁</div>`;
            } else if (this.specialSquares[i]) {
                square.classList.add('special');
                const special = this.specialSquares[i];
                square.innerHTML = `<div>${i}</div><div>${special.emoji}</div>`;
            } else {
                square.classList.add('normal');
                square.innerHTML = `<div>${i}</div>`;
            }
            
            const playerPieces = document.createElement('div');
            playerPieces.className = 'player-pieces';
            square.appendChild(playerPieces);
            
            board.appendChild(square);
        }
    }
    
    // イベントバインド
    bindEvents() {
        // サイコロボタン
        this.dom.rollButton.addEventListener('click', () => {
            this.userInteracted = true;
            this.rollDice();
        });
        
        // スペースキーでサイコロ
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && this.gameStarted && !this.gameEnded && !this.dom.rollButton.disabled) {
                e.preventDefault();
                this.userInteracted = true;
                this.rollDice();
            }
        });
        
        // リスタートボタン
        this.dom.restartButton.addEventListener('click', () => {
            this.userInteracted = true;
            this.restart();
        });
        
        // BGMボタン
        this.dom.bgmToggleButton.addEventListener('click', () => {
            this.userInteracted = true;
            this.toggleBGM();
        });
        
        // 音楽テストボタン
        this.dom.musicTestButton.addEventListener('click', () => {
            this.userInteracted = true;
            this.testMusic();
        });
        
        // 【新機能】効果音テストボタン
        this.dom.soundTestButton.addEventListener('click', () => {
            this.userInteracted = true;
            this.testSoundEffects();
        });
        
        // ユーザーインタラクション検知
        ['click', 'touchstart', 'keydown'].forEach(eventType => {
            document.addEventListener(eventType, () => {
                if (!this.userInteracted) {
                    this.userInteracted = true;
                    console.log('ユーザーインタラクション検知');
                }
            }, { once: true });
        });
    }
    
    // 音楽テスト機能
    testMusic() {
        if (!this.userInteracted) {
            alert('まず何かボタンをクリックしてから音楽をテストしてください。');
            return;
        }
        
        console.log('音楽テスト開始');
        this.updateMusicStatus('playing1');
        
        if (this.dom.backgroundMusic1) {
            const playPromise = this.dom.backgroundMusic1.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log('音楽テスト成功');
                    setTimeout(() => {
                        this.dom.backgroundMusic1.pause();
                        this.dom.backgroundMusic1.currentTime = 0;
                        this.updateMusicStatus('ready');
                    }, 3000);
                }).catch(error => {
                    console.error('音楽テスト失敗:', error);
                    this.updateMusicStatus('error');
                });
            }
        } else {
            console.error('音楽要素が見つかりません');
            this.updateMusicStatus('error');
        }
    }
    
    // 【新機能】効果音テスト機能
    testSoundEffects() {
        if (!this.userInteracted) {
            alert('まず何かボタンをクリックしてから効果音をテストしてください。');
            return;
        }
        
        console.log('効果音テスト開始');
        this.addLog('🔊 効果音テストを開始します...');
        
        // 代表的な効果音を順次再生
        const testSounds = ['normal-roll', 'rocket', 'bomb', 'lucky', 'win'];
        let index = 0;
        
        const playNextSound = () => {
            if (index < testSounds.length) {
                const soundName = testSounds[index];
                this.addLog(`🔊 テスト中: ${soundName}`);
                this.playSound(soundName);
                index++;
                setTimeout(playNextSound, 1500); // 1.5秒間隔で再生
            } else {
                this.addLog('🔊 効果音テスト完了！');
            }
        };
        
        playNextSound();
    }

    // 音楽切り替え機能
    checkMusicChange() {
        if (!this.userInteracted || !this.musicEnabled) {
            return;
        }
        
        const anyPlayerIn24Plus = this.players.some(player => player.position >= 24);
        
        if (anyPlayerIn24Plus && this.currentMusic === 1) {
            this.currentMusic = 2;
            this.switchToMusic2();
            this.addLog('🎵 BGMが終盤モードに変わりました！');
        } else if (!anyPlayerIn24Plus && this.currentMusic === 2) {
            this.currentMusic = 1;
            this.switchToMusic1();
            this.addLog('🎵 BGMが通常モードに戻りました。');
        } else if (this.currentMusic === 1 && !anyPlayerIn24Plus) {
            this.switchToMusic1();
        }
    }
    
    // 音楽1に切り替え
    switchToMusic1() {
        if (!this.userInteracted || !this.musicEnabled) return;
        
        try {
            if (this.dom.backgroundMusic2) {
                this.dom.backgroundMusic2.pause();
                this.dom.backgroundMusic2.currentTime = 0;
            }
            
            if (this.dom.backgroundMusic1) {
                const playPromise = this.dom.backgroundMusic1.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        console.log('BGM1 再生開始');
                        this.updateMusicStatus('playing1');
                    }).catch(error => {
                        console.error('BGM1 再生失敗:', error);
                        this.updateMusicStatus('error');
                    });
                }
            }
        } catch (error) {
            console.error('音楽1切り替えエラー:', error);
            this.updateMusicStatus('error');
        }
    }
    
    // 音楽2に切り替え
    switchToMusic2() {
        if (!this.userInteracted || !this.musicEnabled) return;
        
        try {
            if (this.dom.backgroundMusic1) {
                this.dom.backgroundMusic1.pause();
                this.dom.backgroundMusic1.currentTime = 0;
            }
            
            if (this.dom.backgroundMusic2) {
                const playPromise = this.dom.backgroundMusic2.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        console.log('BGM2 再生開始');
                        this.updateMusicStatus('playing2');
                    }).catch(error => {
                        console.error('BGM2 再生失敗:', error);
                        this.updateMusicStatus('error');
                    });
                }
            }
        } catch (error) {
            console.error('音楽2切り替えエラー:', error);
            this.updateMusicStatus('error');
        }
    }

    // BGM切り替え
    toggleBGM() {
        if (!this.userInteracted) {
            alert('まず何かボタンをクリックしてから音楽を操作してください。');
            return;
        }
        
        const music1Playing = this.dom.backgroundMusic1 && !this.dom.backgroundMusic1.paused;
        const music2Playing = this.dom.backgroundMusic2 && !this.dom.backgroundMusic2.paused;
        
        if (music1Playing || music2Playing) {
            this.musicEnabled = false;
            if (this.dom.backgroundMusic1) this.dom.backgroundMusic1.pause();
            if (this.dom.backgroundMusic2) this.dom.backgroundMusic2.pause();
            this.dom.bgmToggleButton.textContent = '🔇 BGM OFF';
            this.updateMusicStatus('stopped');
        } else {
            this.musicEnabled = true;
            this.dom.bgmToggleButton.textContent = '🎵 BGM ON/OFF';
            this.checkMusicChange();
        }
    }
    
    // 【改良】効果音再生機能（mp3ファイル対応）
    playSound(soundType) {
        if (!this.soundEnabled || !this.userInteracted) {
            return;
        }
        
        const audio = document.getElementById(`sound-${soundType}`);
        if (audio) {
            // 音声を最初から再生するためにリセット
            audio.currentTime = 0;
            
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise.then(() => {
                    console.log(`効果音 ${soundType} 再生成功`);
                }).catch(error => {
                    console.error(`効果音 ${soundType} 再生失敗:`, error);
                    // フォールバック：Web Audio APIの合成音を再生
                    this.playSyntheticSound(soundType);
                });
            }
        } else {
            console.warn(`効果音 ${soundType} が見つかりません。合成音で代替します。`);
            // フォールバック：Web Audio APIの合成音を再生
            this.playSyntheticSound(soundType);
        }
    }
    
    // フォールバック用の合成音再生
    playSyntheticSound(type) {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        const sounds = {
            'anticipation': { freqs: [440, 523, 659, 784], duration: 1.5, type: 'triangle', vol: 0.15 },
            'critical-hit': { freqs: [1047, 1319, 1568, 2093], duration: 1.0, type: 'sawtooth', vol: 0.3 },
            'high-roll': { freqs: [784, 988, 1175, 1397], duration: 1.0, type: 'sine', vol: 0.2 },
            'low-roll': { freqs: [220, 175, 147], duration: 0.8, type: 'triangle', vol: 0.1 },
            'normal-roll': { freq: 440, duration: 0.3, type: 'square', vol: 0.1 },
            'double-bonus': { freqs: [659, 784, 988, 1175], duration: 1.2, type: 'sawtooth', vol: 0.2 },
            'move': { freq: 523, duration: 0.2, type: 'sine', vol: 0.1 },
            'skip': { freq: 349, duration: 0.25, type: 'triangle', vol: 0.1 },
            'win': { freqs: [523, 659, 784, 1047, 1319], duration: 3.0, type: 'triangle', vol: 0.25 },
            'firework': { freqs: [1047, 1319, 1568, 2093], duration: 0.8, type: 'sawtooth', vol: 0.2 },
            'mystery-box': { freqs: [523, 659, 784, 523], duration: 1.0, type: 'square', vol: 0.15 },
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
    
    // 合成音生成
    createTone(freq, dur, type, vol = 0.1) {
        if (!this.audioContext) return;
        
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
    
    // サイコロ演出（クリティカルヒット追加）
    rollDice() {
        if (this.gameEnded || !this.gameStarted) return;
        
        const player = this.players[this.currentPlayer];
        
        if (player.skipNext) {
            player.skipNext = false;
            this.addLog(`${player.name}は1回休みです。`);
            this.playSound('skip');
            this.nextPlayer();
            return;
        }
        
        this.dom.rollButton.disabled = true;
        this.dom.rollButton.textContent = '🎰 運命が決まる... 🎰';
        this.dom.diceResult.classList.remove('visible');
        
        this.animateExcitementMeter();
        this.playSound('anticipation');
        
        let diceValue = Math.floor(Math.random() * 6) + 1;
        
        // クリティカルヒット判定（6が出た場合）
        if (diceValue === 6) {
            this.dom.dice.classList.add('critical-hit');
        } else {
            this.dom.dice.classList.add('is-rolling');
        }
        
        setTimeout(() => {
            this.dom.dice.classList.remove('is-rolling', 'critical-hit');
            
            if (player.doubleNext) {
                diceValue *= 2;
                player.doubleNext = false;
                this.addLog(`${player.name}の追い風効果でサイコロが倍になりました！`);
                this.playSound('double-bonus');
            }
            
            this.dom.dice.textContent = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'][Math.min(diceValue - 1, 5)];
            this.dom.diceResult.textContent = `🎉 ${diceValue}が出ました！ 🎉`;
            this.dom.diceResult.classList.add('visible');
            
            // クリティカルヒット演出
            if (diceValue >= 6) {
                this.showCriticalHitEffect();
                this.playSound('critical-hit');
            } else if (diceValue >= 5) {
                this.playSound('high-roll');
            } else if (diceValue === 1) {
                this.playSound('low-roll');
            } else {
                this.playSound('normal-roll');
            }
            
            this.dom.rollButton.textContent = '🎰 運命を決める 🎰';
            
            setTimeout(() => {
                this.movePlayer(diceValue);
                this.dom.rollButton.disabled = false;
            }, diceValue >= 6 ? 3000 : 1500);

        }, 2000);
    }
    
    // クリティカルヒット演出
    showCriticalHitEffect() {
        this.dom.criticalHitOverlay.classList.add('active');
        
        setTimeout(() => {
            this.dom.criticalHitOverlay.classList.remove('active');
        }, 3000);
    }
    
    // 興奮度メーターアニメーション
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
    
    // プレイヤー移動（ミステリーボックス対応）
    movePlayer(steps) {
        const player = this.players[this.currentPlayer];
        const oldPosition = player.position;
        let newPosition = oldPosition + steps;
        
        if (newPosition > 30) {
            newPosition = 30 - (newPosition - 30);
        }
        
        player.position = newPosition;
        this.addLog(`${player.name}が${steps}マス進んで${newPosition}マス目に移動しました。`);
        
        this.animatePlayerMovement(oldPosition, newPosition, () => {
            this.checkMusicChange();
            
            if (newPosition === 30) {
                this.endGame(player.name);
                return;
            }
            
            if (this.mysteryBoxPositions.includes(newPosition)) {
                this.activateMysteryBox(newPosition);
            } else if (this.specialSquares[newPosition]) {
                this.activateSpecial(newPosition);
            } else {
                this.nextPlayer();
            }
        });
        
        this.playSound('move');
    }
    
    // プレイヤー移動アニメーション
    animatePlayerMovement(from, to, callback) {
        const playerIndex = this.currentPlayer;
        const playerClass = ['kenchan', 'papa', 'mama'][playerIndex];
        
        const oldSquare = document.getElementById(`square-${from}`);
        const oldPiece = oldSquare?.querySelector(`.player-piece.${playerClass}`);
        
        if (oldPiece) {
            oldPiece.classList.add('moving');
        }
        
        this.updatePlayerPositions();
        
        const targetSquare = document.getElementById(`square-${to}`);
        if (targetSquare) {
            targetSquare.style.transform = 'scale(1.2)';
            targetSquare.style.boxShadow = '0 0 20px #ff6b6b';
            
            const newPiece = targetSquare.querySelector(`.player-piece.${playerClass}`);
            if (newPiece) {
                newPiece.classList.add('moving');
            }
        }
        
        setTimeout(() => {
            if (targetSquare) {
                targetSquare.style.transform = '';
                targetSquare.style.boxShadow = '';
                
                const newPiece = targetSquare.querySelector(`.player-piece.${playerClass}`);
                if (newPiece) {
                    newPiece.classList.remove('moving');
                }
            }
            
            if (oldPiece) {
                oldPiece.classList.remove('moving');
            }
            
            callback();
        }, 1000);
    }
    
    // ミステリーボックス演出
    activateMysteryBox(position) {
        const player = this.players[this.currentPlayer];
        
        this.addLog(`${player.name}がミステリーボックスに止まりました！ 🎁`);
        this.playSound('mystery-box');
        
        this.dom.mysteryBoxOverlay.classList.add('active');
        
        setTimeout(() => {
            this.startMysteryRoulette();
        }, 2000);
    }
    
    // ミステリーボックスルーレット演出
    startMysteryRoulette() {
        this.dom.mysteryBoxRoulette.classList.add('active');
        
        const rouletteItems = document.querySelectorAll('.roulette-item');
        let currentIndex = 0;
        let spinCount = 0;
        const maxSpins = 20 + Math.floor(Math.random() * 10);
        
        const spinInterval = setInterval(() => {
            rouletteItems.forEach(item => item.classList.remove('selected'));
            rouletteItems[currentIndex].classList.add('selected');
            currentIndex = (currentIndex + 1) % rouletteItems.length;
            spinCount++;
            
            if (spinCount >= maxSpins) {
                clearInterval(spinInterval);
                
                const finalIndex = (currentIndex - 1 + rouletteItems.length) % rouletteItems.length;
                const selectedGimmick = this.mysteryGimmicks[finalIndex];
                
                this.dom.mysteryResultText.textContent = `${selectedGimmick.emoji} ${selectedGimmick.name}が発動！`;
                this.dom.mysteryResultText.classList.add('visible');
                
                setTimeout(() => {
                    this.dom.mysteryBoxOverlay.classList.remove('active');
                    this.dom.mysteryBoxRoulette.classList.remove('active');
                    this.dom.mysteryResultText.classList.remove('visible');
                    
                    setTimeout(() => {
                        selectedGimmick.action();
                        this.playSound(selectedGimmick.sound);
                    }, 300);
                }, 3000);
            }
        }, Math.max(50, 200 - spinCount * 5));
    }
    
    // 画面中央でのギミック演出
    activateSpecial(position) {
        const special = this.specialSquares[position];
        const player = this.players[this.currentPlayer];
        
        this.addLog(`${player.name}が「${special.name}」に止まりました！ ${special.emoji}`);
        this.playSound(special.sound || 'lucky');
        
        this.dom.specialEffect.textContent = special.emoji;
        this.dom.animationOverlay.classList.add('active');
        
        setTimeout(() => {
            this.dom.animationOverlay.classList.remove('active');
            setTimeout(() => {
                special.action();
            }, 300);
        }, 1500);
    }
    
    // 豪華なゴール演出
    showGoalCelebration(winnerName) {
        this.dom.celebrationOverlay.innerHTML = '';
        this.dom.celebrationOverlay.classList.add('active');
        this.dom.fireworksCanvas.classList.add('active');
        
        this.playSound('win');

        const goalMessage = document.createElement('div');
        goalMessage.className = 'goal-message';
        goalMessage.textContent = `🎉 ${winnerName} 優勝! 🎉`;
        this.dom.celebrationOverlay.appendChild(goalMessage);

        this.createFireworks();

        for (let i = 0; i < 300; i++) {
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
            this.dom.modal.style.display = 'flex';
        }, 4000);

        setTimeout(() => {
            this.dom.celebrationOverlay.classList.remove('active');
            this.dom.fireworksCanvas.classList.remove('active');
            this.dom.celebrationOverlay.innerHTML = '';
            this.dom.fireworksCanvas.innerHTML = '';
        }, 6000);
    }
    
    // 花火エフェクト生成
    createFireworks() {
        const colors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#ff69b4'];
        
        for (let i = 0; i < 10; i++) {
            setTimeout(() => {
                const firework = document.createElement('div');
                firework.className = 'firework';
                firework.style.left = Math.random() * 80 + 10 + '%';
                firework.style.top = Math.random() * 60 + 20 + '%';
                firework.style.width = '40px';
                firework.style.height = '40px';
                firework.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
                firework.style.boxShadow = `0 0 50px ${colors[Math.floor(Math.random() * colors.length)]}`;
                
                this.dom.fireworksCanvas.appendChild(firework);
                this.playSound('firework');
                
                setTimeout(() => {
                    if (firework.parentNode) {
                        firework.parentNode.removeChild(firework);
                    }
                }, 2000);
            }, i * 300);
        }
    }

    // ゲーム終了
    endGame(winnerName) {
        this.gameEnded = true;
        if (this.dom.backgroundMusic1) this.dom.backgroundMusic1.pause();
        if (this.dom.backgroundMusic2) this.dom.backgroundMusic2.pause();
        this.updateMusicStatus('stopped');
        this.addLog(`🏆 ${winnerName}がゴールしました！ゲーム終了です。`);
        this.showGoalCelebration(winnerName);
    }
    
    // 次のプレイヤーのターン
    nextPlayer() {
        if (this.gameEnded) return;
        this.currentPlayer = (this.currentPlayer + 1) % 3;
        this.updateDisplay();
    }
    
    // 画面表示更新
    updateDisplay() {
        const currentPlayerObj = this.players[this.currentPlayer];
        
        this.dom.currentPlayerAvatar.textContent = currentPlayerObj.color;
        this.dom.currentPlayerName.textContent = currentPlayerObj.name;
        
        this.players.forEach((player, index) => {
            const card = document.getElementById(`player-${['kenchan', 'papa', 'mama'][index]}`);
            const positionSpan = card.querySelector('.player-position span');
            const avatarDiv = card.querySelector('.player-avatar');
            
            card.classList.toggle('active', index === this.currentPlayer);
            positionSpan.textContent = player.position === 0 ? 'スタート' : `${player.position}マス目`;
            avatarDiv.textContent = player.color;
        });
        
        this.updatePlayerPositions();
    }
    
    // プレイヤーコマ位置更新
    updatePlayerPositions() {
        document.querySelectorAll('.player-pieces').forEach(pieces => {
            pieces.innerHTML = '';
        });
        
        this.players.forEach((player, index) => {
            const square = document.getElementById(`square-${player.position}`);
            if (square) {
                const piece = document.createElement('div');
                piece.className = `player-piece ${['kenchan', 'papa', 'mama'][index]}`;
                
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
        this.currentMusic = 1;
        
        this.dom.modal.style.display = 'none';
        this.dom.diceResult.textContent = '';
        this.dom.logContent.innerHTML = '<div class="log-entry">ゲームを再開しました！</div>';
        
        this.updateDisplay();
        
        setTimeout(() => {
            this.checkMusicChange();
        }, 500);
    }
    
    // ギミック効果関数群（効果音付き）
    warpTo(targetPosition) {
        const player = this.players[this.currentPlayer];
        player.position = targetPosition;
        this.addLog(`${player.name}が${targetPosition}マス目にワープしました！`);
        this.updatePlayerPositions();
        this.checkMusicChange();
        this.nextPlayer();
    }
    
    backToStart() {
        const player = this.players[this.currentPlayer];
        player.position = 0;
        this.addLog(`${player.name}がスタートに戻りました。`);
        this.updatePlayerPositions();
        this.checkMusicChange();
        this.nextPlayer();
    }
    
    backTo(position) {
        const player = this.players[this.currentPlayer];
        player.position = position;
        this.addLog(`${player.name}が${position}マス目に戻りました。`);
        this.updatePlayerPositions();
        this.checkMusicChange();
        this.nextPlayer();
    }
    
    rollAgain() {
        this.addLog(`${this.players[this.currentPlayer].name}はもう一度サイコロを振れます！`);
    }
    
    skipNextTurn() {
        const player = this.players[this.currentPlayer];
        player.skipNext = true;
        this.addLog(`${player.name}は次回1回休みになります。`);
        this.nextPlayer();
    }
    
    doubleNextRoll() {
        const player = this.players[this.currentPlayer];
        player.doubleNext = true;
        this.addLog(`${player.name}は次回サイコロの目が倍になります！`);
        this.nextPlayer();
    }
    
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
        this.checkMusicChange();
        
        if (newPosition === 30) {
            this.endGame(player.name);
        } else {
            this.nextPlayer();
        }
    }
    
    swapWithOther() {
        const currentPlayerObj = this.players[this.currentPlayer];
        const otherPlayers = this.players.filter((_, index) => index !== this.currentPlayer);
        const randomOther = otherPlayers[Math.floor(Math.random() * otherPlayers.length)];
        
        const tempPosition = currentPlayerObj.position;
        currentPlayerObj.position = randomOther.position;
        randomOther.position = tempPosition;
        
        this.addLog(`${currentPlayerObj.name}と${randomOther.name}が場所を交換しました！`);
        this.updatePlayerPositions();
        this.checkMusicChange();
        this.nextPlayer();
    }
    
    allToStart() {
        this.players.forEach(player => {
            player.position = 0;
        });
        this.addLog('全員がスタートに戻りました！');
        this.updatePlayerPositions();
        this.checkMusicChange();
        this.nextPlayer();
    }
    
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
            this.checkMusicChange();
            this.nextPlayer();
        }
    }
}

// ゲーム開始
document.addEventListener('DOMContentLoaded', () => {
    new SugorokuGame();
});
