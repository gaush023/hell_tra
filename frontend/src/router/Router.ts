export type Route =
  | { name: 'login' }
  | { name: 'userlist' }
  | { name: 'profile'; userId?: string }
  | { name: 'friends' }
  | { name: 'stats'; userId?: string }
  | { name: 'match-history'; userId?: string }
  | { name: 'pong-game'; gameId: string }
  | { name: 'tank-game'; gameId: string }
  | { name: 'tournament' };

export type RouteHandler = (route: Route) => void;

export class Router {
  private currentRoute: Route | null = null;
  private handler: RouteHandler | null = null;
  private isNavigating: boolean = false;

  constructor() {
    // Listen for browser back/forward button
    window.addEventListener('popstate', (event) => {
      if (event.state && event.state.route) {
        this.isNavigating = true;
        this.handleRoute(event.state.route);
        this.isNavigating = false;
      }
    });
  }

  /**
   * Register a handler to be called when route changes
   */
  public onRouteChange(handler: RouteHandler): void {
    this.handler = handler;
  }

  /**
   * Navigate to a new route
   */
  public navigate(route: Route): void {
    if (this.isNavigating) {
      return; // Prevent infinite loops during popstate
    }

    // Update browser history
    const url = this.routeToUrl(route);
    const state = { route };

    // Only push to history if it's a different route
    if (!this.isSameRoute(this.currentRoute, route)) {
      window.history.pushState(state, '', url);
    }

    this.handleRoute(route);
  }

  /**
   * Replace current route without adding to history
   */
  public replace(route: Route): void {
    const url = this.routeToUrl(route);
    const state = { route };
    window.history.replaceState(state, '', url);
    this.handleRoute(route);
  }

  /**
   * Go back in history
   */
  public back(): void {
    window.history.back();
  }

  /**
   * Get current route
   */
  public getCurrentRoute(): Route | null {
    return this.currentRoute;
  }

  /**
   * Initialize router with current URL
   */
  public init(): void {
    const route = this.urlToRoute(window.location.pathname);
    // Use replaceState for the initial load to set up the state
    const state = { route };
    window.history.replaceState(state, '', window.location.pathname);
    this.handleRoute(route);
  }

  private handleRoute(route: Route): void {
    this.currentRoute = route;
    if (this.handler) {
      this.handler(route);
    }
  }

  private routeToUrl(route: Route): string {
    switch (route.name) {
      case 'login':
        return '/';
      case 'userlist':
        return '/lobby';
      case 'profile':
        return route.userId ? `/profile/${route.userId}` : '/profile';
      case 'friends':
        return '/friends';
      case 'stats':
        return route.userId ? `/stats/${route.userId}` : '/stats';
      case 'match-history':
        return route.userId ? `/history/${route.userId}` : '/history';
      case 'pong-game':
        return `/game/pong/${route.gameId}`;
      case 'tank-game':
        return `/game/tank/${route.gameId}`;
      case 'tournament':
        return '/tournament';
      default:
        return '/';
    }
  }

  private urlToRoute(path: string): Route {
    // Remove leading slash
    const cleanPath = path.replace(/^\//, '');

    if (!cleanPath || cleanPath === '') {
      return { name: 'login' };
    }

    if (cleanPath === 'lobby') {
      return { name: 'userlist' };
    }

    if (cleanPath === 'friends') {
      return { name: 'friends' };
    }

    if (cleanPath === 'tournament') {
      return { name: 'tournament' };
    }

    if (cleanPath.startsWith('profile/')) {
      const userId = cleanPath.split('/')[1];
      return { name: 'profile', userId };
    }

    if (cleanPath === 'profile') {
      return { name: 'profile' };
    }

    if (cleanPath.startsWith('stats/')) {
      const userId = cleanPath.split('/')[1];
      return { name: 'stats', userId };
    }

    if (cleanPath.startsWith('history/')) {
      const userId = cleanPath.split('/')[1];
      return { name: 'match-history', userId };
    }

    if (cleanPath.startsWith('game/pong/')) {
      const gameId = cleanPath.split('/')[2];
      return { name: 'pong-game', gameId };
    }

    if (cleanPath.startsWith('game/tank/')) {
      const gameId = cleanPath.split('/')[2];
      return { name: 'tank-game', gameId };
    }

    // Default to login
    return { name: 'login' };
  }

  private isSameRoute(route1: Route | null, route2: Route | null): boolean {
    if (!route1 || !route2) {
      return false;
    }

    if (route1.name !== route2.name) {
      return false;
    }

    // Compare additional properties based on route type
    switch (route1.name) {
      case 'profile':
      case 'stats':
      case 'match-history':
        return (route1 as any).userId === (route2 as any).userId;
      case 'pong-game':
      case 'tank-game':
        return (route1 as any).gameId === (route2 as any).gameId;
      default:
        return true;
    }
  }
}
