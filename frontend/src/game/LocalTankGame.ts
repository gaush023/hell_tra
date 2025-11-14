import { Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3, MeshBuilder, StandardMaterial, Color3, DirectionalLight, Mesh } from '@babylonjs/core';

interface TankState {
  position: { x: number; y: number; z: number };
  rotation: number;
  turretRotation: number;
  lives: number;
  lastShot: number;
}

interface BulletState {
  position: { x: number; y: number; z: number };
  direction: { x: number; z: number };
  mesh: Mesh;
  active: boolean;
  playerId: number;
}

export class LocalTankGame {
  private canvas: HTMLCanvasElement;
  private engine: Engine;
  private scene: Scene;
  private camera: ArcRotateCamera;
  private onGameEnd: () => void;

  private tank1Body: Mesh | null = null;
  private tank1Turret: Mesh | null = null;
  private tank2Body: Mesh | null = null;
  private tank2Turret: Mesh | null = null;
  private walls: Mesh[] = [];
  private bullets: BulletState[] = [];

  private keys: { [key: string]: boolean } = {};

  // Game state
  private tank1: TankState = {
    position: { x: -8, y: 0.25, z: 0 },
    rotation: 0,
    turretRotation: 0,
    lives: 3,
    lastShot: 0
  };

  private tank2: TankState = {
    position: { x: 8, y: 0.25, z: 0 },
    rotation: Math.PI,
    turretRotation: Math.PI,
    lives: 3,
    lastShot: 0
  };

  private gameRunning = false;

  private readonly FIELD_WIDTH = 30;
  private readonly FIELD_DEPTH = 20;
  private readonly TANK_SPEED = 0.1;
  private readonly TURN_SPEED = 0.05;
  private readonly TURRET_TURN_SPEED = 0.05;
  private readonly BULLET_SPEED = 0.3;
  private readonly SHOT_COOLDOWN = 1000; // milliseconds

  constructor(canvas: HTMLCanvasElement, onGameEnd: () => void) {
    this.canvas = canvas;
    this.engine = new Engine(canvas, true);
    this.scene = new Scene(this.engine);
    this.onGameEnd = onGameEnd;

    this.camera = new ArcRotateCamera('camera', 0, Math.PI / 4, 35, Vector3.Zero(), this.scene);
  }

  init(): void {
    this.setupScene();
    this.createGameField();
    this.createTanks();
    this.setupControls();
    this.startGame();

    this.engine.runRenderLoop(() => {
      this.updateGame();
      this.scene.render();
    });

    window.addEventListener('resize', () => {
      this.engine.resize();
    });
  }

  private setupScene(): void {
    this.camera.attachControl(this.canvas, true);

    const light = new HemisphericLight('light', new Vector3(0, 1, 0), this.scene);
    light.intensity = 0.7;

    const dirLight = new DirectionalLight('dirLight', new Vector3(-1, -1, -1), this.scene);
    dirLight.intensity = 0.5;

    this.scene.createDefaultSkybox();
  }

  private createGameField(): void {
    // Create ground
    const ground = MeshBuilder.CreateGround('ground', { width: this.FIELD_WIDTH, height: this.FIELD_DEPTH }, this.scene);
    const groundMaterial = new StandardMaterial('groundMaterial', this.scene);
    groundMaterial.diffuseColor = new Color3(0.2, 0.3, 0.1);
    ground.material = groundMaterial;

    // Create boundary walls
    const wallHeight = 2;
    const wallThickness = 0.5;

    const wallConfigs = [
      { name: 'northWall', position: new Vector3(0, wallHeight / 2, this.FIELD_DEPTH / 2), size: { width: this.FIELD_WIDTH + wallThickness, height: wallHeight, depth: wallThickness } },
      { name: 'southWall', position: new Vector3(0, wallHeight / 2, -this.FIELD_DEPTH / 2), size: { width: this.FIELD_WIDTH + wallThickness, height: wallHeight, depth: wallThickness } },
      { name: 'eastWall', position: new Vector3(this.FIELD_WIDTH / 2, wallHeight / 2, 0), size: { width: wallThickness, height: wallHeight, depth: this.FIELD_DEPTH } },
      { name: 'westWall', position: new Vector3(-this.FIELD_WIDTH / 2, wallHeight / 2, 0), size: { width: wallThickness, height: wallHeight, depth: this.FIELD_DEPTH } }
    ];

    wallConfigs.forEach(wall => {
      const wallMesh = MeshBuilder.CreateBox(wall.name, wall.size, this.scene);
      wallMesh.position = wall.position;
      const wallMaterial = new StandardMaterial(`${wall.name}Material`, this.scene);
      wallMaterial.diffuseColor = new Color3(0.4, 0.4, 0.4);
      wallMesh.material = wallMaterial;
      this.walls.push(wallMesh);
    });
  }

  private createTanks(): void {
    // Create Tank 1 (Green)
    this.tank1Body = MeshBuilder.CreateBox('tank1Body', { width: 2, height: 0.5, depth: 3 }, this.scene);
    this.tank1Body.position = new Vector3(this.tank1.position.x, this.tank1.position.y, this.tank1.position.z);
    const body1Material = new StandardMaterial('tank1BodyMaterial', this.scene);
    body1Material.diffuseColor = new Color3(0, 0.8, 0);
    this.tank1Body.material = body1Material;

    this.tank1Turret = MeshBuilder.CreateCylinder('tank1Turret', { diameter: 1.2, height: 0.3 }, this.scene);
    this.tank1Turret.position = this.tank1Body.position.clone();
    this.tank1Turret.position.y = this.tank1Body.position.y + 0.4;
    const turret1Material = new StandardMaterial('tank1TurretMaterial', this.scene);
    turret1Material.diffuseColor = new Color3(0, 0.6, 0);
    this.tank1Turret.material = turret1Material;

    const barrel1 = MeshBuilder.CreateCylinder('tank1Barrel', { diameter: 0.2, height: 2 }, this.scene);
    barrel1.rotation.z = Math.PI / 2;
    barrel1.position = this.tank1Turret.position.clone();
    barrel1.position.x += 1;
    barrel1.setParent(this.tank1Turret);
    const barrel1Material = new StandardMaterial('tank1BarrelMaterial', this.scene);
    barrel1Material.diffuseColor = new Color3(0.3, 0.3, 0.3);
    barrel1.material = barrel1Material;

    // Create Tank 2 (Red)
    this.tank2Body = MeshBuilder.CreateBox('tank2Body', { width: 2, height: 0.5, depth: 3 }, this.scene);
    this.tank2Body.position = new Vector3(this.tank2.position.x, this.tank2.position.y, this.tank2.position.z);
    const body2Material = new StandardMaterial('tank2BodyMaterial', this.scene);
    body2Material.diffuseColor = new Color3(0.8, 0, 0);
    this.tank2Body.material = body2Material;

    this.tank2Turret = MeshBuilder.CreateCylinder('tank2Turret', { diameter: 1.2, height: 0.3 }, this.scene);
    this.tank2Turret.position = this.tank2Body.position.clone();
    this.tank2Turret.position.y = this.tank2Body.position.y + 0.4;
    const turret2Material = new StandardMaterial('tank2TurretMaterial', this.scene);
    turret2Material.diffuseColor = new Color3(0.6, 0, 0);
    this.tank2Turret.material = turret2Material;

    const barrel2 = MeshBuilder.CreateCylinder('tank2Barrel', { diameter: 0.2, height: 2 }, this.scene);
    barrel2.rotation.z = Math.PI / 2;
    barrel2.position = this.tank2Turret.position.clone();
    barrel2.position.x += 1;
    barrel2.setParent(this.tank2Turret);
    const barrel2Material = new StandardMaterial('tank2BarrelMaterial', this.scene);
    barrel2Material.diffuseColor = new Color3(0.3, 0.3, 0.3);
    barrel2.material = barrel2Material;
  }

  private setupControls(): void {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
      this.keys[e.key] = true; // For special keys like Shift, Enter
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
      this.keys[e.key] = false;
    });
  }

  private startGame(): void {
    this.gameRunning = true;
    this.updateScore();
  }

  private updateGame(): void {
    if (!this.gameRunning) return;

    const now = Date.now();

    // Tank 1 controls (WASD, Q/E for turret, Shift to fire)
    if (this.tank1.lives > 0) {
      let moveForward = 0;
      let turn = 0;
      let turretTurn = 0;

      if (this.keys['w']) moveForward = 1;
      if (this.keys['s']) moveForward = -1;
      if (this.keys['a']) turn = -1;
      if (this.keys['d']) turn = 1;
      if (this.keys['q']) turretTurn = -1;
      if (this.keys['e']) turretTurn = 1;

      this.updateTank(this.tank1, moveForward, turn, turretTurn);

      if (this.keys['Shift'] && now - this.tank1.lastShot > this.SHOT_COOLDOWN) {
        this.fireBullet(1, this.tank1);
        this.tank1.lastShot = now;
      }
    }

    // Tank 2 controls (Arrow keys, [/] for turret, Enter to fire)
    if (this.tank2.lives > 0) {
      let moveForward = 0;
      let turn = 0;
      let turretTurn = 0;

      if (this.keys['arrowup']) moveForward = 1;
      if (this.keys['arrowdown']) moveForward = -1;
      if (this.keys['arrowleft']) turn = -1;
      if (this.keys['arrowright']) turn = 1;
      if (this.keys['[']) turretTurn = -1;
      if (this.keys[']']) turretTurn = 1;

      this.updateTank(this.tank2, moveForward, turn, turretTurn);

      if (this.keys['Enter'] && now - this.tank2.lastShot > this.SHOT_COOLDOWN) {
        this.fireBullet(2, this.tank2);
        this.tank2.lastShot = now;
      }
    }

    // Update tank meshes
    if (this.tank1Body && this.tank1Turret) {
      this.tank1Body.position = new Vector3(this.tank1.position.x, this.tank1.position.y, this.tank1.position.z);
      this.tank1Body.rotation.y = this.tank1.rotation;
      this.tank1Turret.position = new Vector3(this.tank1.position.x, this.tank1.position.y + 0.4, this.tank1.position.z);
      this.tank1Turret.rotation.y = this.tank1.turretRotation;
      this.tank1Body.setEnabled(this.tank1.lives > 0);
      this.tank1Turret.setEnabled(this.tank1.lives > 0);
    }

    if (this.tank2Body && this.tank2Turret) {
      this.tank2Body.position = new Vector3(this.tank2.position.x, this.tank2.position.y, this.tank2.position.z);
      this.tank2Body.rotation.y = this.tank2.rotation;
      this.tank2Turret.position = new Vector3(this.tank2.position.x, this.tank2.position.y + 0.4, this.tank2.position.z);
      this.tank2Turret.rotation.y = this.tank2.turretRotation;
      this.tank2Body.setEnabled(this.tank2.lives > 0);
      this.tank2Turret.setEnabled(this.tank2.lives > 0);
    }

    // Update bullets
    this.updateBullets();
  }

  private updateTank(tank: TankState, moveForward: number, turn: number, turretTurn: number): void {
    // Rotate tank
    tank.rotation += turn * this.TURN_SPEED;

    // Move tank
    if (moveForward !== 0) {
      const newX = tank.position.x + Math.sin(tank.rotation) * moveForward * this.TANK_SPEED;
      const newZ = tank.position.z + Math.cos(tank.rotation) * moveForward * this.TANK_SPEED;

      // Check boundaries
      const maxX = this.FIELD_WIDTH / 2 - 1;
      const maxZ = this.FIELD_DEPTH / 2 - 1.5;

      if (Math.abs(newX) < maxX && Math.abs(newZ) < maxZ) {
        tank.position.x = newX;
        tank.position.z = newZ;
      }
    }

    // Rotate turret
    tank.turretRotation += turretTurn * this.TURRET_TURN_SPEED;
  }

  private fireBullet(playerId: number, tank: TankState): void {
    const direction = {
      x: Math.sin(tank.turretRotation),
      z: Math.cos(tank.turretRotation)
    };

    const bulletMesh = MeshBuilder.CreateSphere(`bullet_${Date.now()}`, { diameter: 0.3 }, this.scene);
    bulletMesh.position = new Vector3(
      tank.position.x + direction.x * 2,
      0.5,
      tank.position.z + direction.z * 2
    );

    const bulletMaterial = new StandardMaterial(`bulletMaterial_${Date.now()}`, this.scene);
    bulletMaterial.diffuseColor = new Color3(1, 1, 0);
    bulletMaterial.emissiveColor = new Color3(0.5, 0.5, 0);
    bulletMesh.material = bulletMaterial;

    this.bullets.push({
      position: { x: bulletMesh.position.x, y: bulletMesh.position.y, z: bulletMesh.position.z },
      direction,
      mesh: bulletMesh,
      active: true,
      playerId
    });
  }

  private updateBullets(): void {
    const bulletsToRemove: number[] = [];

    this.bullets.forEach((bullet, index) => {
      if (!bullet.active) {
        bulletsToRemove.push(index);
        return;
      }

      // Move bullet
      bullet.position.x += bullet.direction.x * this.BULLET_SPEED;
      bullet.position.z += bullet.direction.z * this.BULLET_SPEED;
      bullet.mesh.position = new Vector3(bullet.position.x, bullet.position.y, bullet.position.z);

      // Check boundaries
      const maxX = this.FIELD_WIDTH / 2;
      const maxZ = this.FIELD_DEPTH / 2;

      if (Math.abs(bullet.position.x) > maxX || Math.abs(bullet.position.z) > maxZ) {
        bullet.active = false;
        bullet.mesh.dispose();
        bulletsToRemove.push(index);
        return;
      }

      // Check collision with tanks
      const hitRadius = 1.5;

      // Check Tank 1
      if (bullet.playerId !== 1 && this.tank1.lives > 0) {
        const dx = bullet.position.x - this.tank1.position.x;
        const dz = bullet.position.z - this.tank1.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance < hitRadius) {
          this.tank1.lives--;
          bullet.active = false;
          bullet.mesh.dispose();
          bulletsToRemove.push(index);
          this.updateScore();
          this.checkWin();
          return;
        }
      }

      // Check Tank 2
      if (bullet.playerId !== 2 && this.tank2.lives > 0) {
        const dx = bullet.position.x - this.tank2.position.x;
        const dz = bullet.position.z - this.tank2.position.z;
        const distance = Math.sqrt(dx * dx + dz * dz);

        if (distance < hitRadius) {
          this.tank2.lives--;
          bullet.active = false;
          bullet.mesh.dispose();
          bulletsToRemove.push(index);
          this.updateScore();
          this.checkWin();
          return;
        }
      }
    });

    // Remove inactive bullets
    bulletsToRemove.reverse().forEach(index => {
      this.bullets.splice(index, 1);
    });
  }

  private updateScore(): void {
    const scoreElement = document.getElementById('game-score');
    if (scoreElement) {
      scoreElement.textContent = `Player 1: ${this.tank1.lives} lives - Player 2: ${this.tank2.lives} lives`;
    }
  }

  private checkWin(): void {
    if (this.tank1.lives <= 0 && this.tank2.lives <= 0) {
      this.gameRunning = false;
      this.showGameEndModal('Draw');
    } else if (this.tank1.lives <= 0) {
      this.gameRunning = false;
      this.showGameEndModal('Player 2 (Red)');
    } else if (this.tank2.lives <= 0) {
      this.gameRunning = false;
      this.showGameEndModal('Player 1 (Green)');
    }
  }

  private showGameEndModal(winner: string): void {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center';
    modal.innerHTML = `
      <div class="bg-gray-800 p-8 rounded-lg text-center border-2 ${winner === 'Draw' ? 'border-yellow-500' : 'border-green-500'}">
        <h2 class="text-3xl font-bold mb-4 ${winner === 'Draw' ? 'text-yellow-400' : 'text-green-400'}">
          ${winner === 'Draw' ? 'Draw!' : 'Victory!'}
        </h2>
        <p class="text-xl text-gray-300 mb-2">
          ${winner === 'Draw' ? 'Both tanks destroyed!' : `${winner} wins the tank battle!`}
        </p>
        <div class="flex space-x-4 justify-center mt-6">
          <button id="play-again" class="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded">
            Play Again
          </button>
          <button id="back-to-menu" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded">
            Back to Menu
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('play-again')!.addEventListener('click', () => {
      document.body.removeChild(modal);
      this.resetGame();
    });

    document.getElementById('back-to-menu')!.addEventListener('click', () => {
      document.body.removeChild(modal);
      this.onGameEnd();
    });
  }

  private resetGame(): void {
    // Reset tank states
    this.tank1 = {
      position: { x: -8, y: 0.25, z: 0 },
      rotation: 0,
      turretRotation: 0,
      lives: 3,
      lastShot: 0
    };

    this.tank2 = {
      position: { x: 8, y: 0.25, z: 0 },
      rotation: Math.PI,
      turretRotation: Math.PI,
      lives: 3,
      lastShot: 0
    };

    // Clear bullets
    this.bullets.forEach(bullet => bullet.mesh.dispose());
    this.bullets = [];

    this.updateScore();
    this.gameRunning = true;
  }

  dispose(): void {
    this.bullets.forEach(bullet => bullet.mesh.dispose());
    this.engine.dispose();
  }
}
