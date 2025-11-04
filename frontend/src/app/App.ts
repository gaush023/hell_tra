import { LoginForm } from '../components/LoginForm';
import { UserList } from '../components/UserList';
import { Tournament } from '../components/Tournament';
import { PongGame } from '../game/PongGame';
import { TankGame } from '../game/TankGame';
import { WebSocketService } from '../services/WebSocketService';
import { User } from '../types/User';
import { Router } from '../router/Router';
import { ROUTES, buildRoute } from '../router/routes';

export class App {
  private container: HTMLElement;
  private wsService: WebSocketService;
  private router: Router;
  private currentUser: User | null = null;
  private currentGame: PongGame | null = null;
  private currentTankGame: TankGame | null = null;
  private tournament: Tournament | null = null;
  private resizeHandler: (() => void) | null = null;
  private inTournament: boolean = false;
  private currentUserList: UserList | null = null;

  constructor() {
    this.container = document.getElementById('app')!;
    this.wsService = new WebSocketService();
    this.router = new Router();
    this.setupRoutes();
  }

  /**
   * 認証ガード付きのルートをセットアップ
   */
  private setupRoutes(): void {
    // ホーム（ユーザーリスト） - 認証が必要
    this.router.on(ROUTES.HOME, async () => {
      if (this.currentUser) {
        await this.showUserList();
      } else {
        this.router.navigate(buildRoute.login());
      }
    });

    // ログイン
    this.router.on(ROUTES.LOGIN, () => {
      this.showLogin();
    });

    // ポンゲーム - 認証とgameIdが必要
    this.router.on(ROUTES.GAME, async (params) => {
      if (!this.currentUser) {
        console.warn('Not authenticated, redirecting to login');
        this.router.navigate(buildRoute.login());
        return;
      }

      if (params.id) {
        // WebSocketイベントからのgameIdを信頼
        // 手動でアクセスされた場合、ゲームが無効なIDを処理
        this.startGame(params.id);
      } else {
        console.error('Game ID is missing');
        this.router.navigate(buildRoute.home());
      }
    });

    // タンクゲーム - 認証とgameIdが必要
    this.router.on(ROUTES.TANK_GAME, async (params) => {
      if (!this.currentUser) {
        console.warn('Not authenticated, redirecting to login');
        this.router.navigate(buildRoute.login());
        return;
      }

      if (params.id) {
        this.startTankGame(params.id);
      } else {
        console.error('Tank game ID is missing');
        this.router.navigate(buildRoute.home());
      }
    });

    // トーナメント - 認証が必要
    this.router.on(ROUTES.TOURNAMENT, () => {
      if (!this.currentUser) {
        console.warn('Not authenticated, redirecting to login');
        this.router.navigate(buildRoute.login());
        return;
      }

      this.showTournament();
    });

    // プロフィール - 認証が必要
    this.router.on(ROUTES.PROFILE, async () => {
      if (!this.currentUser) {
        console.warn('Not authenticated, redirecting to login');
        this.router.navigate(buildRoute.login());
        return;
      }

      await this.showUserList();
      if (this.currentUserList) {
        this.currentUserList.showProfile();
      }
    });

    // フレンド - 認証が必要
    this.router.on(ROUTES.FRIENDS, async () => {
      if (!this.currentUser) {
        console.warn('Not authenticated, redirecting to login');
        this.router.navigate(buildRoute.login());
        return;
      }

      await this.showUserList();
      if (this.currentUserList) {
        this.currentUserList.showFriends();
      }
    });

    // 試合履歴 - 認証が必要
    this.router.on(ROUTES.MATCH_HISTORY, async () => {
      if (!this.currentUser) {
        console.warn('Not authenticated, redirecting to login');
        this.router.navigate(buildRoute.login());
        return;
      }

      await this.showUserList();
      if (this.currentUserList) {
        this.currentUserList.showMatchHistory();
      }
    });

    // 統計 - 認証が必要
    this.router.on(ROUTES.STATS, async () => {
      if (!this.currentUser) {
        console.warn('Not authenticated, redirecting to login');
        this.router.navigate(buildRoute.login());
        return;
      }

      await this.showUserList();
      if (this.currentUserList) {
        await this.currentUserList.showStats();
      }
    });
  }

  async init(): Promise<void> {
    const savedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (savedUser && token) {
      this.currentUser = JSON.parse(savedUser);
    }

    // ルーターを初期化（URLに基づいてルーティング開始）
    this.router.init();

    // 初回アクセス時にハッシュがない場合、デフォルトルートに遷移
    if (!window.location.hash) {
      if (this.currentUser) {
        this.router.navigate(buildRoute.home());
      } else {
        this.router.navigate(buildRoute.login());
      }
    }
  }

  private showLogin(): void {
    const loginForm = new LoginForm(this.container, async (user: User) => {
      this.currentUser = user;
      this.router.navigate(buildRoute.home());
    });
    loginForm.render();
  }

  private async showUserList(): Promise<void> {
    // 前回のUserListが存在する場合はクリーンアップ
    if (this.currentUserList) {
      this.currentUserList.destroy();
      this.currentUserList = null;
    }

    try {
      console.log('Attempting to connect to WebSocket...');
      await this.wsService.connect();
      console.log('WebSocket connected successfully');

      console.log('Sending authentication token...');
      this.wsService.send('authenticate', {
        token: localStorage.getItem('token')
      });

      console.log('Initializing user list...');
      this.currentUserList = new UserList(
        this.container,
        this.currentUser!,
        this.wsService,
        (gameId: string) => this.router.navigate(buildRoute.game(gameId)),
        (gameId: string) => this.router.navigate(buildRoute.tankGame(gameId)),
        () => this.router.navigate(buildRoute.tournament()),
        (path: string) => this.router.navigate(path)
      );

      await this.currentUserList.init();
      console.log('User list initialized successfully');
    } catch (error) {
      console.error('Failed to connect to server:', error);
      console.log('Falling back to login screen');
      this.router.navigate(buildRoute.login());
    }
  }

  private async startGame(gameId: string): Promise<void> {
    this.container.innerHTML = `
      <div class="fixed inset-0 bg-gray-900 flex flex-col">
        <div class="bg-gray-800 p-4 shadow-lg">
          <div class="flex justify-between items-center">
            <h1 class="text-2xl font-bold text-white">Pong Game</h1>
            <div id="game-score" class="text-xl text-white">
              Waiting for game to start...
            </div>
            <button id="leave-game" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">
              Leave Game
            </button>
          </div>
        </div>
        
        <div class="flex-1 flex flex-col items-center justify-center p-4">
          <canvas id="game-canvas" class="w-full h-full max-w-none max-h-none bg-black rounded-lg shadow-2xl"></canvas>
          <div class="absolute bottom-4 text-center text-gray-300 bg-black bg-opacity-50 px-4 py-2 rounded">
            <div class="text-sm">
              <p><strong>Controls:</strong></p>
              <p>2-Player: W/S or ↑/↓ to move paddle</p>
              <p>4-Player: W/A/S/D or Arrow Keys to move paddle</p>
            </div>
          </div>
        </div>
      </div>
    `;

    const canvas = document.getElementById('game-canvas') as unknown as HTMLCanvasElement;

    // 利用可能なスペースに合わせてキャンバスサイズを設定
    const resizeCanvas = () => {
      const container = canvas.parentElement!;
      const containerRect = container.getBoundingClientRect();

      // 利用可能なスペースを計算（パディングを除く）
      const availableWidth = containerRect.width - 32; // 各辺16pxのパディング
      const availableHeight = containerRect.height - 32;

      // アスペクト比を維持（2:1）
      const aspectRatio = 2;
      let canvasWidth = availableWidth;
      let canvasHeight = canvasWidth / aspectRatio;

      if (canvasHeight > availableHeight) {
        canvasHeight = availableHeight;
        canvasWidth = canvasHeight * aspectRatio;
      }

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
    };
    
    resizeCanvas();
    this.resizeHandler = resizeCanvas;
    window.addEventListener('resize', this.resizeHandler);

    this.currentGame = new PongGame(
      canvas,
      this.wsService,
      gameId,
      this.currentUser,
      () => this.endGame()
    );

    await this.currentGame.init();

    document.getElementById('leave-game')!.addEventListener('click', () => {
      this.wsService.send('leaveGame', { gameId });
      this.endGame();
    });
  }

  private endGame(): void {
    if (this.currentGame) {
      this.currentGame.dispose();
      this.currentGame = null;
    }

    if (this.currentTankGame) {
      this.currentTankGame.dispose();
      this.currentTankGame = null;
    }

    // リサイズイベントリスナーをクリーンアップ
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }

    // トーナメント中ならトーナメント画面に戻る、そうでなければメイン画面へ
    if (this.inTournament) {
      if (this.tournament) {
        // 既存のトーナメントコンポーネントに戻る
        this.tournament.returnFromGame();
      } else {
        // トーナメントコンポーネントが存在しない場合は新規作成
        this.router.navigate(buildRoute.tournament());
      }
    } else {
      this.router.navigate(buildRoute.home());
    }
  }

  private async startTankGame(gameId: string): Promise<void> {
    this.container.innerHTML = `
      <div class="fixed inset-0 bg-gray-900 flex flex-col">
        <div class="bg-gray-800 p-4 shadow-lg">
          <div class="flex justify-between items-center">
            <h1 class="text-2xl font-bold text-white">🚗 Tank Battle</h1>
            <div id="game-score" class="text-xl text-white">
              Waiting for tank battle to start...
            </div>
            <button id="leave-game" class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded">
              Leave Game
            </button>
          </div>
        </div>

        <div class="flex-1 flex flex-col items-center justify-center p-4">
          <canvas id="game-canvas" class="w-full h-full max-w-none max-h-none bg-black rounded-lg shadow-2xl"></canvas>
          <div class="absolute bottom-4 text-center text-gray-300 bg-black bg-opacity-50 px-4 py-2 rounded">
            <div class="text-sm">
              <p><strong>Tank Controls:</strong></p>
              <p>W/A/S/D: Move tank and rotate</p>
              <p>Q/E: Rotate turret</p>
              <p>Space: Fire bullets</p>
              <p>Each tank has 3 lives. Last tank standing wins!</p>
            </div>
          </div>
        </div>
      </div>
    `;

    const canvas = document.getElementById('game-canvas') as unknown as HTMLCanvasElement;

    // Set canvas size to match available space
    const resizeCanvas = () => {
      const container = canvas.parentElement!;
      const containerRect = container.getBoundingClientRect();

      const availableWidth = containerRect.width - 32;
      const availableHeight = containerRect.height - 32;

      const aspectRatio = 1.5; // Tank game uses wider aspect ratio
      let canvasWidth = availableWidth;
      let canvasHeight = canvasWidth / aspectRatio;

      if (canvasHeight > availableHeight) {
        canvasHeight = availableHeight;
        canvasWidth = canvasHeight * aspectRatio;
      }

      canvas.width = canvasWidth;
      canvas.height = canvasHeight;
    };

    resizeCanvas();
    this.resizeHandler = resizeCanvas;
    window.addEventListener('resize', this.resizeHandler);

    this.currentTankGame = new TankGame(
      canvas,
      this.wsService,
      gameId,
      this.currentUser,
      () => this.endTankGame()
    );

    await this.currentTankGame.init();

    document.getElementById('leave-game')!.addEventListener('click', () => {
      this.wsService.send('leaveTankGame', { gameId });
      this.endTankGame();
    });
  }

  private endTankGame(): void {
    if (this.currentTankGame) {
      this.currentTankGame.dispose();
      this.currentTankGame = null;
    }

    // リサイズイベントリスナーをクリーンアップ
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }

    this.router.navigate(buildRoute.home());
  }

  private showTournament(): void {
    this.inTournament = true;
    this.tournament = new Tournament(
      this.container,
      this.wsService,
      this.currentUser!,
      (gameId: string) => this.startGame(gameId),
      (gameId: string) => this.startTankGame(gameId),
      () => this.endTournament()
    );
    this.tournament.render();
  }

  private endTournament(): void {
    this.inTournament = false;
    this.tournament = null;
    this.router.navigate(buildRoute.home());
  }
}