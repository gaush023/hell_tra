import { Engine, Scene, ArcRotateCamera, HemisphericLight, Vector3, MeshBuilder, StandardMaterial, Color3, DirectionalLight, Mesh } from '@babylonjs/core';

export class LocalPongGame {
  private canvas: HTMLCanvasElement;
  private engine: Engine;
  private scene: Scene;
  private camera: ArcRotateCamera;
  private onGameEnd: () => void;

  private ball: Mesh | null = null;
  private paddle1: Mesh | null = null;
  private paddle2: Mesh | null = null;
  private walls: Mesh[] = [];

  private keys: { [key: string]: boolean } = {};

  // Game state
  private ballPosition = { x: 0, y: 0.25, z: 0 };
  private ballVelocity = { x: 0.15, y: 0, z: 0.12 };
  private paddle1Position = 0;
  private paddle2Position = 0;
  private player1Score = 0;
  private player2Score = 0;
  private gameRunning = false;

  private readonly FIELD_WIDTH = 20;
  private readonly FIELD_DEPTH = 10;
  private readonly PADDLE_SPEED = 0.2;
  private readonly PADDLE_SIZE = 2;
  private readonly BALL_SPEED = 0.15;
  private readonly WIN_SCORE = 5;

  constructor(canvas: HTMLCanvasElement, onGameEnd: () => void) {
    this.canvas = canvas;
    this.engine = new Engine(canvas, true);
    this.scene = new Scene(this.engine);
    this.onGameEnd = onGameEnd;

    this.camera = new ArcRotateCamera('camera', 0, Math.PI / 3, 25, Vector3.Zero(), this.scene);
  }

  init(): void {
    this.setupScene();
    this.createGameObjects();
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

  private createGameObjects(): void {
    // Create ground
    const ground = MeshBuilder.CreateGround('ground', { width: this.FIELD_WIDTH, height: this.FIELD_DEPTH }, this.scene);
    const groundMaterial = new StandardMaterial('groundMaterial', this.scene);
    groundMaterial.diffuseColor = new Color3(0.1, 0.1, 0.2);
    ground.material = groundMaterial;

    // Create ball
    this.ball = MeshBuilder.CreateSphere('ball', { diameter: 0.5 }, this.scene);
    this.ball.position = new Vector3(this.ballPosition.x, this.ballPosition.y, this.ballPosition.z);
    const ballMaterial = new StandardMaterial('ballMaterial', this.scene);
    ballMaterial.diffuseColor = new Color3(1, 1, 1);
    ballMaterial.emissiveColor = new Color3(0.2, 0.2, 0.2);
    this.ball.material = ballMaterial;

    // Create paddles
    const paddleSize = { width: 0.2, height: 1, depth: this.PADDLE_SIZE };

    // Player 1 paddle (left, green)
    this.paddle1 = MeshBuilder.CreateBox('paddle1', paddleSize, this.scene);
    this.paddle1.position = new Vector3(-9, 0.5, this.paddle1Position);
    const paddle1Material = new StandardMaterial('paddle1Material', this.scene);
    paddle1Material.diffuseColor = new Color3(0, 1, 0);
    paddle1Material.emissiveColor = new Color3(0, 0.2, 0);
    this.paddle1.material = paddle1Material;

    // Player 2 paddle (right, red)
    this.paddle2 = MeshBuilder.CreateBox('paddle2', paddleSize, this.scene);
    this.paddle2.position = new Vector3(9, 0.5, this.paddle2Position);
    const paddle2Material = new StandardMaterial('paddle2Material', this.scene);
    paddle2Material.diffuseColor = new Color3(1, 0, 0);
    paddle2Material.emissiveColor = new Color3(0.2, 0, 0);
    this.paddle2.material = paddle2Material;

    // Create walls (top and bottom)
    const wallConfigs = [
      { name: 'topWall', position: new Vector3(0, 0.5, this.FIELD_DEPTH / 2), size: { width: this.FIELD_WIDTH, height: 1, depth: 0.2 } },
      { name: 'bottomWall', position: new Vector3(0, 0.5, -this.FIELD_DEPTH / 2), size: { width: this.FIELD_WIDTH, height: 1, depth: 0.2 } }
    ];

    wallConfigs.forEach(wall => {
      const wallMesh = MeshBuilder.CreateBox(wall.name, wall.size, this.scene);
      wallMesh.position = wall.position;
      const wallMaterial = new StandardMaterial(`${wall.name}Material`, this.scene);
      wallMaterial.diffuseColor = new Color3(0.3, 0.3, 0.3);
      wallMesh.material = wallMaterial;
      this.walls.push(wallMesh);
    });
  }

  private setupControls(): void {
    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
  }

  private startGame(): void {
    this.gameRunning = true;
    this.resetBall();
  }

  private resetBall(): void {
    this.ballPosition = { x: 0, y: 0.25, z: 0 };

    // Random direction
    const angle = (Math.random() - 0.5) * Math.PI / 3; // -30 to 30 degrees
    const direction = Math.random() < 0.5 ? 1 : -1; // Left or right

    this.ballVelocity = {
      x: direction * this.BALL_SPEED * Math.cos(angle),
      y: 0,
      z: this.BALL_SPEED * Math.sin(angle)
    };
  }

  private updateGame(): void {
    if (!this.gameRunning) return;

    // Update paddles based on input
    // Player 1: W/S
    if (this.keys['w']) {
      this.paddle1Position += this.PADDLE_SPEED;
    }
    if (this.keys['s']) {
      this.paddle1Position -= this.PADDLE_SPEED;
    }

    // Player 2: Arrow keys
    if (this.keys['arrowup']) {
      this.paddle2Position += this.PADDLE_SPEED;
    }
    if (this.keys['arrowdown']) {
      this.paddle2Position -= this.PADDLE_SPEED;
    }

    // Clamp paddle positions
    const maxPaddleZ = this.FIELD_DEPTH / 2 - this.PADDLE_SIZE / 2;
    this.paddle1Position = Math.max(-maxPaddleZ, Math.min(maxPaddleZ, this.paddle1Position));
    this.paddle2Position = Math.max(-maxPaddleZ, Math.min(maxPaddleZ, this.paddle2Position));

    // Update paddle meshes
    if (this.paddle1) {
      this.paddle1.position.z = this.paddle1Position;
    }
    if (this.paddle2) {
      this.paddle2.position.z = this.paddle2Position;
    }

    // Update ball position
    this.ballPosition.x += this.ballVelocity.x;
    this.ballPosition.z += this.ballVelocity.z;

    // Ball collision with top/bottom walls
    const maxBallZ = this.FIELD_DEPTH / 2 - 0.25;
    if (this.ballPosition.z > maxBallZ || this.ballPosition.z < -maxBallZ) {
      this.ballVelocity.z *= -1;
      this.ballPosition.z = Math.max(-maxBallZ, Math.min(maxBallZ, this.ballPosition.z));
    }

    // Ball collision with paddles
    const ballRadius = 0.25;
    const paddleHalfWidth = 0.1;
    const paddleHalfDepth = this.PADDLE_SIZE / 2;

    // Player 1 paddle (left)
    if (this.ballPosition.x - ballRadius <= -9 + paddleHalfWidth &&
        this.ballPosition.x - ballRadius >= -9 - paddleHalfWidth &&
        Math.abs(this.ballPosition.z - this.paddle1Position) <= paddleHalfDepth) {
      this.ballVelocity.x *= -1.05; // Increase speed slightly
      this.ballPosition.x = -9 + paddleHalfWidth + ballRadius;

      // Add spin based on where the ball hits the paddle
      const hitOffset = (this.ballPosition.z - this.paddle1Position) / paddleHalfDepth;
      this.ballVelocity.z += hitOffset * 0.05;
    }

    // Player 2 paddle (right)
    if (this.ballPosition.x + ballRadius >= 9 - paddleHalfWidth &&
        this.ballPosition.x + ballRadius <= 9 + paddleHalfWidth &&
        Math.abs(this.ballPosition.z - this.paddle2Position) <= paddleHalfDepth) {
      this.ballVelocity.x *= -1.05; // Increase speed slightly
      this.ballPosition.x = 9 - paddleHalfWidth - ballRadius;

      // Add spin based on where the ball hits the paddle
      const hitOffset = (this.ballPosition.z - this.paddle2Position) / paddleHalfDepth;
      this.ballVelocity.z += hitOffset * 0.05;
    }

    // Check for scoring
    if (this.ballPosition.x < -10) {
      // Player 2 scores
      this.player2Score++;
      this.updateScore();
      this.checkWin();
      this.resetBall();
    } else if (this.ballPosition.x > 10) {
      // Player 1 scores
      this.player1Score++;
      this.updateScore();
      this.checkWin();
      this.resetBall();
    }

    // Update ball mesh
    if (this.ball) {
      this.ball.position.x = this.ballPosition.x;
      this.ball.position.z = this.ballPosition.z;
    }
  }

  private updateScore(): void {
    const scoreElement = document.getElementById('game-score');
    if (scoreElement) {
      scoreElement.textContent = `Player 1: ${this.player1Score} - Player 2: ${this.player2Score}`;
    }
  }

  private checkWin(): void {
    if (this.player1Score >= this.WIN_SCORE) {
      this.gameRunning = false;
      this.showGameEndModal('Player 1 (Green)');
    } else if (this.player2Score >= this.WIN_SCORE) {
      this.gameRunning = false;
      this.showGameEndModal('Player 2 (Red)');
    }
  }

  private showGameEndModal(winner: string): void {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center';
    modal.innerHTML = `
      <div class="bg-gray-800 p-8 rounded-lg text-center border-2 border-green-500">
        <h2 class="text-3xl font-bold mb-4 text-green-400">
          Game Over!
        </h2>
        <p class="text-xl text-gray-300 mb-2">
          ${winner} wins!
        </p>
        <p class="text-lg text-gray-400 mb-6">
          Final Score: ${this.player1Score} - ${this.player2Score}
        </p>
        <div class="flex space-x-4 justify-center">
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
      this.player1Score = 0;
      this.player2Score = 0;
      this.updateScore();
      this.startGame();
    });

    document.getElementById('back-to-menu')!.addEventListener('click', () => {
      document.body.removeChild(modal);
      this.onGameEnd();
    });
  }

  dispose(): void {
    this.engine.dispose();
  }
}
