export interface RouteParams {
  [key: string]: string;
}

export interface Route {
  path: string;
  handler: (params: RouteParams) => void | Promise<void>;
}

export class Router {
  private routes: Route[] = [];
  private currentPath: string = '';

  constructor() {
    // ここでinit()を呼ばない - App.init()から呼ばれる
  }

  /**
   * ルートを登録する
   * @param path - ルートパス（例: '/game/:id', '/profile/:userId?'）
   * @param handler - ルートハンドラー関数
   */
  on(path: string, handler: (params: RouteParams) => void | Promise<void>): void {
    this.routes.push({ path, handler });
  }

  /**
   * ルーターを初期化する（hashchangeイベントをリッスン）
   */
  init(): void {
    window.addEventListener('hashchange', () => this.handleRouteChange());
    window.addEventListener('load', () => this.handleRouteChange());
  }

  /**
   * プログラム的にルートに遷移する
   * @param path - 遷移先のパス
   */
  navigate(path: string): void {
    window.location.hash = `#${path}`;
  }

  /**
   * ハッシュから現在のパスを取得する
   */
  private getCurrentPath(): string {
    const hash = window.location.hash.slice(1); // '#'を削除
    return hash || '/';
  }

  /**
   * ルート変更を処理する
   */
  private async handleRouteChange(): Promise<void> {
    const path = this.getCurrentPath();
    this.currentPath = path;

    let wildcardHandler: Route | null = null;

    // マッチするルートを検索
    for (const route of this.routes) {
      // ワイルドカードハンドラーは後で使うため保存
      if (route.path === '*') {
        wildcardHandler = route;
        continue;
      }

      const params = this.matchRoute(route.path, path);
      if (params !== null) {
        try {
          await route.handler(params);
          return;
        } catch (error) {
          console.error('Route handler error:', error);
          return;
        }
      }
    }

    // ワイルドカードハンドラーがあれば試す
    if (wildcardHandler) {
      try {
        await wildcardHandler.handler({});
        return;
      } catch (error) {
        console.error('Wildcard handler error:', error);
      }
    }

    // 最後の手段: ホームにリダイレクト（既にホームでない場合のみ）
    if (path !== '/') {
      console.warn('No route matched for:', path);
      this.navigate('/');
    } else {
      console.error('No handler for root path!');
    }
  }

  /**
   * ルートパターンとパスをマッチングする
   * @param pattern - ルートパターン（例: '/game/:id'）
   * @param path - 実際のパス（例: '/game/abc123'）
   * @returns パラメータオブジェクト、マッチしない場合はnull
   */
  private matchRoute(pattern: string, path: string): RouteParams | null {
    // クエリパラメータを削除
    const cleanPath = path.split('?')[0];
    const patternParts = pattern.split('/').filter(p => p);
    const pathParts = cleanPath.split('/').filter(p => p);

    // パーツ数が一致するかチェック（オプションパラメータを考慮）
    const hasOptionalParams = pattern.includes('?');
    if (!hasOptionalParams && patternParts.length !== pathParts.length) {
      return null;
    }

    const params: RouteParams = {};

    for (let i = 0; i < patternParts.length; i++) {
      const patternPart = patternParts[i];
      const pathPart = pathParts[i];

      // 動的パラメータ（例: :id）
      if (patternPart.startsWith(':')) {
        const paramName = patternPart.slice(1).replace('?', ''); // '?'を削除
        const isOptional = patternPart.endsWith('?');

        if (pathPart !== undefined) {
          params[paramName] = decodeURIComponent(pathPart);
        } else if (!isOptional) {
          return null; // 必須パラメータが欠落
        }
      }
      // 静的パス
      else if (patternPart !== pathPart) {
        return null;
      }
    }

    return params;
  }

  /**
   * 現在のパスを取得する
   */
  getCurrentRoute(): string {
    return this.currentPath;
  }
}
