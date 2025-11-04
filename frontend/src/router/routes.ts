/**
 * ルートパス定数
 */
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  GAME: '/game/:id',
  TANK_GAME: '/tank/:id',
  TOURNAMENT: '/tournament',
  PROFILE: '/profile',
  FRIENDS: '/friends',
  MATCH_HISTORY: '/match-history',
  STATS: '/stats',
} as const;

/**
 * ルートパスを構築するためのヘルパー関数
 */
export const buildRoute = {
  home: () => '/',
  login: () => '/login',
  game: (id: string) => `/game/${id}`,
  tankGame: (id: string) => `/tank/${id}`,
  tournament: () => '/tournament',
  profile: () => '/profile',
  friends: () => '/friends',
  matchHistory: () => '/match-history',
  stats: () => '/stats',
};

/**
 * ルートの説明（デバッグ用）
 */
export const ROUTE_DESCRIPTIONS = {
  '/': 'ホーム（ユーザーリスト）',
  '/login': 'ログイン画面',
  '/game/:id': 'ポンゲーム',
  '/tank/:id': 'タンクゲーム',
  '/tournament': 'トーナメント',
  '/profile': 'ユーザープロフィール',
  '/friends': 'フレンドリスト',
  '/match-history': '試合履歴',
  '/stats': '統計情報',
};
