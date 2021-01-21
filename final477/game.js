/*
    So this game is actually a game where you can't actually shoot. You have an experimental
    on board weapon that converts all kinetic energy beams into energy that you can use to 
    power a devastating weapon. The only catch is that after the discharge you will be vunerable
    to attack by the opoosing enemeies for about 10 secs. They will do all they can to take 
    you out. So time your attacks carefully!
*/
//set some global vars
let gameState = {
    charge: 0,
    hull: 100,
    earthHealth: 100,
    overcharge: 0,
    vunerable: false
};
let earthicon;
let vunState;
let energyBar;
let player;
let cursors

class GameMain extends Phaser.Scene {
    constructor() {
        super('GameMain')
    }
    
    preload() {
        //Uncomment this when you are ready to publish playable build on website
        this.load.setBaseURL('http://dtc-wsuv.org/anicholas20/final477');
    
        //Scripts and Plugins
        this.load.script('WeaponPlugin', '/node_modules/phaser3-weapon-plugin/dist/WeaponPlugin.js', 'WeaponPlugin', 'weapons');
    
        //Images and Sprites
        this.load.image('ship', 'assets/ship.png');
        this.load.image('laser', 'assets/laser.png');
        this.load.image('enemy', 'assets/enemy.png');
        this.load.image('dash', 'assets/dashboard.png');
        this.load.image('earth', 'assets/earth.png');
        this.load.image('earthtarget', 'assets/earthtarget.png');

        //Audio
        this.load.audio('fight', 'assets/audio/fight.mp3');
        this.load.audio('discharge', 'assets/audio/discharge.wav');
        this.load.audio('earthimpact', 'assets/audio/earthimpact.wav');
        this.load.audio('playerimpact', 'assets/audio/playerimpact.wav');
        this.load.audio('enemyimpact', 'assets/audio/enemyimpact.wav');
        this.load.audio('overcharge', 'assets/audio/overcharge.wav');
        this.load.audio('overexplode', 'assets/audio/overexplode.wav');
    }
    
    create() {
        let m_MainConfig = {
            volume: 0.35,
            loop: true
        }
        let mainGameSound = this.sound.add('fight');
        mainGameSound.play(m_MainConfig);
        //let goNext = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER);
        //goNext.on('down', () => {
        //    this.physics.pause();
        //    this.scene.restart();
        //})
        //Installing plugin into scene
        //I'm only doing it in this one its okay
        //to add the line here instead of config, since I'm using only one scene
        //this.plugins.installScenePlugin('WeaponPlugin', WeaponPlugin.WeaponPlugin, 'weapons', this);
        
        //UI
        gameState.earthTarget = this.physics.add.staticGroup();
        gameState.earthTarget.create(400, 575, 'earthtarget');
        const dashboard = this.physics.add.staticGroup();
        dashboard.create(400, 700, 'dash');
        this.add.text(30, 620, 'Charge (SPACE)', { fontFamily: 'pressstart', fill: '#FFFFFF' });
        this.add.text(27, 705, 'HULL INTEGRITY  ', { fontFamily: 'pressstart', fill: '#FFFFFF' });
        this.add.text(410, 735, 'Over\ncharge', { fontFamily: 'pressstart', fill: '#FFFFFF' });
        earthicon = this.add.image(653, 709, 'earth').setScale(.87)
        
        //Energy and Hull Bars
        energyBar = this.makeBar(31, 649, 0x0000fe);
        this.setValue(energyBar, gameState.charge);

        gameState.hullBar = this.makeBar(31, 732, 0xFFFFFF);
        this.setValue(gameState.hullBar, gameState.hull);
        
        gameState.overBar = this.makeBar(314, 732, 0xfe00000)
        this.setValue(gameState.overBar, gameState.overcharge);

        //Render objects to screen and other stuff
        //Create keyboard inputs for controls
        cursors = this.input.keyboard.createCursorKeys();
        gameState.fire = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        
        //set timer and show it count up
        gameState.countUp = this.add.text(322, 665, '', { fontFamily: 'pressstart', fontSize: '40px', fill: '#ffad63' });
        
        gameState.timedEvent = this.time.addEvent({delay: 120000, callback: winCon, callbackScope: this, repeat: 0});
        
        function winCon() {
            mainGameSound.stop();
            this.scene.stop('GameMain');
            this.scene.start('GameWin');
        }
        //Render player and initialize player settings
        gameState.player =  this.physics.add.image(420, 450, 'ship').setScale(1.20);
        gameState.player.setOrigin(0.5);
        gameState.player.setDrag(300);
        gameState.player.setMaxVelocity(400);
        gameState.player.angle = gameState.player.body.angle = -90;
        
        //dummy target because I just need this to work for now
        gameState.dummy =  this.physics.add.image(420, 700, 'ship').setScale(1.20);
        gameState.dummy.alpha = 0;
        
        //Special Weapon
        gameState.chargeWeapon = this.physics.add.image(400, 775, 'dash');
        gameState.chargeWeapon.alpha = 0;

        //Enemy ships    
        gameState.enemy = this.physics.add.group();
        
        function genEnemy () {
            const xCoord = Math.random() * config.width;
            gameState.enemy.create(xCoord, 10, 'enemy').setAngle(90).setDrag(200);
          }
    
        const enemyLoop = this.time.addEvent({
            delay: 1000, //changes how fast enemies spawn
            callback: genEnemy,
            callbackScope: this,
            loop: true,
        });
    
        //gameState.laser.trackSprite(gameState.boss, 0, 0, true);
    
        //Special Weapon?
        this.physics.add.collider(gameState.enemy, gameState.chargeWeapon, (weapon, enemy) => {
            enemy.destroy();
        });

        //Collision Stuff
        this.physics.add.collider(gameState.enemy, gameState.player, (ship, enemy) => {
            enemy.destroy();
            if (gameState.vunerable) {
                this.sound.add('playerimpact').play();
                gameState.hull -= 50;              
                //gameState.hullBar.destroy();
                if (gameState.hull <= 0) {
                    this.cameras.main.shake(1000);
                    //Game Over State
                    mainGameSound.stop();
                    this.scene.stop('GameMain');
                    this.scene.start('GameOver');    
                }
                //fade to black
            }
            if (gameState.charge < 100) {
                this.sound.add('enemyimpact').play();
                gameState.charge += 20;
            } else {
                this.sound.add('overcharge').play();
                gameState.charge = 100;
                gameState.overcharge += 10;
                console.log(gameState.overcharge);
                if (gameState.overcharge >= 40) {
                    this.sound.add('overexplode').play();
                    //Game Over State
                    this.cameras.main.shake(3000, .05)
                    mainGameSound.stop();
                    //fade to black
                    this.scene.stop('GameMain');
                    this.scene.start('GameOver');
                }
            }
        });
        
        //Earth Game Over
        this.physics.add.collider(gameState.enemy, gameState.earthTarget, (enemy) => {
            enemy.destroy();
            gameState.earthHealth -= 4;
            this.sound.add('earthimpact').play();
            console.log("Earth Health: " + gameState.earthHealth)

            if (gameState.earthHealth <= 25) {
                earthicon.setTint(0xfe0000)
            } else if (gameState.earthHealth <= 50) {
                earthicon.setTint(0xfe8600);
            } else if (gameState.earthHealth <= 75) {
                earthicon.setTint(0xbbfe00)
            }

            if (gameState.earthHealth <= 0) {
                //Game Over State
                mainGameSound.stop();
                this.cameras.main.shake(3000, 0.05);
                this.scene.stop('GameMain');
                this.scene.start('GameOver');
                //fade to black
            }
                
        });

        this.physics.add.collider(gameState.player, dashboard);
        this.physics.add.collider(gameState.enemy, dashboard);
        this.physics.add.collider(gameState.player, gameState.earthTarget);
        this.physics.add.collider(gameState.enemy, gameState.earthTarget);
    
        //Make sure the player and enemies don't go out of bounds
        gameState.player.setCollideWorldBounds(true);
        //gameState.enemy.setCollideWorldBounds(false);
        
    }
    
    makeBar(x, y, color) {
        let bar = this.add.graphics();
        bar.fillStyle(color, 1);
        bar.fillRect(0, 0, 215, 36);
        bar.x = x;
        bar.y = y;
        return bar;
    }

    setValue(bar, percentage) {
        bar.scaleX = percentage/100;
    }

    update() {
        this.setValue(energyBar, gameState.charge); 
        this.setValue(gameState.hullBar, gameState.hull); 
        this.setValue(gameState.overBar, gameState.overcharge);
        
        //stuff to make timer look nice and formated (eventually)
        let elapsedTime = gameState.timedEvent.getElapsedSeconds();
        let roundedTime = Math.floor(elapsedTime);
        let minutes = Math.floor(elapsedTime / 60);
        let seconds = Math.floor(elapsedTime - (minutes * 60));
        let countDown = 120 - elapsedTime;
        let cdMin = countDown / 60;
        let cdSec = 59 - seconds;
        
        if (cdSec > 9) {
                gameState.countUp.setText('0' + Math.floor(cdMin) + ':' + cdSec);
            } else {
                gameState.countUp.setText('0' + Math.floor(cdMin) + ':0' + cdSec);
            }
            if (countDown < 60) {
            gameState.countUp.setText(countDown.toString().substr(0, 4))
            }
        
        //player control logic
        if (gameState.chargeWeapon.y < -30) {
            gameState.chargeWeapon.y = 775;
            gameState.chargeWeapon.setVelocityY(0);

        }
        if (cursors.left.isDown) { //rotate left
            gameState.player.setAngularVelocity(-300);
        } else if (cursors.right.isDown) { //rotate right
            gameState.player.setAngularVelocity(300);
        } else { //stop rotation
            gameState.player.setAngularVelocity(0);
        }
        if (cursors.up.isDown) { //acceleration forward
            this.physics.velocityFromRotation(gameState.player.rotation, 600, gameState.player.body.acceleration);
        } else { //stay put
            gameState.player.setAcceleration(0);
        }

        function onTimerComplete() {
            gameState.vunerable = false;
            console.log(gameState.vunerable + 'invincibleagain!');
        }

        if (gameState.fire.isDown) { 
            if (gameState.charge >= 100) {
                this.sound.add('discharge').play();
                gameState.charge -= 100;
                this.cameras.main.shake(500, .05)
                gameState.vunerable = true;
                console.log(gameState.vunerable + "You are vunerable!");
                gameState.chargeWeapon.setVelocityY(-10000)
                vunState = this.time.addEvent({
                    callback: onTimerComplete,
                    callbackScope: this,
                    delay: 9000 //this is how long you are vunerable for in ms
                })
    
            }
        }
        
        //Enemy control logic
        gameState.enemy.getChildren().forEach((el) => {
            //gameState.player coord
            let tx = gameState.player.x;
            let ty = gameState.player.y;

            //earth coord
            let dx = gameState.dummy.x;
            let dy = gameState.dummy.y;

            //enemy coord
            let ex = el.x;
            let ey = el.y;
            let playerAngle = Phaser.Math.Angle.Between(ex, ey, tx, ty);
            //set angle towards gameState.player
            //eventually set it towards planet and have a conditional to set it towards gameState.player.
            el.rotation = playerAngle;
            
            //I need to set angle towards earth
            let earthAngle = Phaser.Math.Angle.Between(ex, ey, dx, dy);
            
            if (gameState.vunerable) {
                
            this.physics.velocityFromAngle(el.angle, 100, el.body.acceleration)
            } else {
                el.rotation = earthAngle
                this.physics.velocityFromAngle(el.angle, 50, el.body.acceleration)
                //this.physics.moveTo(el, gameState.earthTarget.x, player.y, 100);
            }

        })
    
        
    }
}

class GameStart extends Phaser.Scene {
    constructor() {
        super('StartGame')
    }

    preload() {
        //images
        this.load.image('collide', 'assets/logo.png')
        //audio
        this.load.audio('startscreen', 'assets/audio/intro.mp3'); 
        this.load.audio('continue', 'assets/audio/continue.wav')   
    }

    create() {
        let m_titleConfig = {
            volume: 0.35,
            loop: true
        }
        let logoIcon = this.add.image(400, 300, 'collide').setScale(0.30);
        this.tweens.add({
            targets: logoIcon,
            y: 310,
            ease: 'Linear',
            duration: 2500,
            repeat: -1,
            yoyo: true,
        })

        let titleScreen = this.sound.add('startscreen');
        titleScreen.play(m_titleConfig);
        let titleText = this.add.text(200, 520, 'Press Space to Start', { fontFamily: 'pressstart', fontSize: '20px', fill: '#FFFFFF' });
        this.add.text(700, 380, 'v1.0', { fontFamily: 'pressstart', fontSize: '20px', fill: '#FFFFFF' });
        this.tweens.add({
            targets: titleText,
            y: 515,
            ease: 'Linear',
            duration: 500,
            repeat: -1,
            yoyo: true,
        })


        let goNext = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        goNext.on('down', () => {
            this.sound.add('continue').play();
            this.scene.stop('GameStart');
            this.scene.start('Tutorial');
            titleScreen.stop()
        }
        )
    }
}

class Tutorial extends Phaser.Scene {
    constructor() {
        super('Tutorial')
    }

    preload() {
        //images
        //this.load.image('tutorial', 'assets/tutorial.png');
        //audio
    }
    create() {
        this.add.text(35, 140, "You are humanity's last hope. Armed with an", { fontFamily: 'pressstart', fill: '#FFFFFF' });
        this.add.text(35, 180, 'experimental ship and weapon, the COLLIDITRON.', { fontFamily: 'pressstart', fill: '#FFFFFF' });
        this.add.text(35, 220, 'Your mission is to buy enough time for Earth', { fontFamily: 'pressstart', fill: '#FFFFFF' });
        this.add.text(35, 260, 'to launch its counterattack. Crash into enemy', { fontFamily: 'pressstart', fill: '#FFFFFF' });
        this.add.text(35, 300, 'ships before they crash into Earth. Your', { fontFamily: 'pressstart', fill: '#FFFFFF' });
        this.add.text(35, 340, 'weapon can be discharged which destroys all', { fontFamily: 'pressstart', fill: '#FFFFFF' });
        this.add.text(35, 380, "enemies, but leaves you vunerable for 9 secs.", { fontFamily: 'pressstart', fill: '#FFFFFF' });
        this.add.text(35, 420, "Be careful, if you overload the COLLIDITRON", { fontFamily: 'pressstart', fill: '#FFFFFF' });
        this.add.text(35, 460, "by over 300% you'll explode. Good luck!", { fontFamily: 'pressstart', fill: '#FFFFFF' });
        this.add.text(220, 560, "Press Space to Start!", { fontFamily: 'pressstart', fill: '#FFFFFF' });
        let goNext = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        goNext.on('down', () => {
            this.sound.add('continue').play();
            this.scene.stop('Tutorial');
            this.scene.start('GameMain');
        }
        )
    }
}

class GameOver extends Phaser.Scene {
    constructor() {
        super('GameOver')
    }

    preload() {
        this.load.image('earthlose', 'assets/earth.png');
        this.load.audio('gameover', 'assets/audio/gameover.mp3')
    }

    create() {
        let m_overConfig = {
            volume: 0.5,
            loop: false
        }
        this.sound.add('gameover').play(m_overConfig);
        this.add.text(240, 120, 'The Earth is dead...', { fontFamily: 'pressstart', fill: '#FFFFFF' });
        this.add.text(260, 620, '    Game Over\n\n Click to Restart', { fontFamily: 'pressstart', fill: '#FFFFFF' });

        let deadEarth = this.add.image(400, 350, 'earthlose').setScale(2.5).setTint(0x673636);
        //reset
        gameState.charge = 0;
        gameState.hull = 100;
        gameState.energyBar = 0;
        gameState.earthHealth = 100;
        gameState.overcharge = 0;
        gameState.vunerable = false;
        this.input.on('pointerdown', () => {

            this.sys.game.destroy(true);
    
            document.addEventListener('mousedown', function newGame () {
    
                game = new Phaser.Game(configRestart);
    
                document.removeEventListener('mousedown', newGame);
            })
        });
    }
}

class GameWin extends Phaser.Scene {
    constructor() {
        super('GameWin')
    }
    preload() {
        this.load.image('earth', 'assets/earth.png');
        this.load.audio('win', 'assets/audio/gamewin.mp3')
    }
    create() {
        let m_winConfig = {
            volume: 0.5,
            loop: true
        }
        this.add.text(240, 80, 'You Saved the Earth!\n\n  Click to Restart', { fontFamily: 'pressstart', fill: '#FFFFFF' });
        this.add.text(245, 620, 'Thanks for Playing!', { fontFamily: 'pressstart', fill: '#FFFFFF' });

        this.sound.add('win').play(m_winConfig);
        let youSavedEarth = this.add.image(400, 350, 'earth').setScale(2.5);

        //reset
        gameState.charge = 0;
        gameState.hull = 100;
        gameState.energyBar = 0;
        gameState.earthHealth = 100;
        gameState.overcharge = 0;
        gameState.vunerable = false;
        this.input.on('pointerdown', () => {

            this.sys.game.destroy(true);
    
            document.addEventListener('mousedown', function newGame () {
    
                game = new Phaser.Game(configRestart);
    
                document.removeEventListener('mousedown', newGame);
            })
        });
    }
}
const config = {
    width: 800,
    height: 800,
    backgroundColor: '#0b0924',
    scene: [GameStart,Tutorial, GameMain, GameOver, GameWin],
    physics: {
        default: 'arcade',
        arcade: {
            enableBody: true,
            debug: false
        }
    }
};

const configRestart = {
    width: 800,
    height: 800,
    backgroundColor: '#0b0924',
    scene: [GameMain, GameOver, GameWin],
    physics: {
        default: 'arcade',
        arcade: {
            enableBody: true,
            debug: false
        }
    }
};

let game = new Phaser.Game(config);