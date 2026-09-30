export type ThemeSetting = 'system' | 'dark' | 'light';
export type ResolvedTheme = 'dark' | 'light';

export class ThemeService {
  private static mediaQueryListener: ((e: MediaQueryListEvent) => void) | null = null;

  /**
   * Resuelve el tema efectivo ('dark' | 'light') a partir del ajuste seleccionado
   */
  static resolveTheme(setting: ThemeSetting): ResolvedTheme {
    if (setting === 'system') {
      if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return 'dark'; // Fallback por defecto
    }
    return setting;
  }

  /**
   * Aplica las clases CSS, meta tags y variables de sistema para el tema indicado
   */
  static applyTheme(setting: ThemeSetting): ResolvedTheme {
    const resolved = this.resolveTheme(setting);
    if (typeof document === 'undefined') return resolved;

    const root = document.documentElement;
    const body = document.body;

    if (resolved === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
      if (body) {
        body.classList.remove('light-theme');
        body.classList.add('dark-theme');
      }
    } else {
      root.classList.remove('dark');
      root.classList.add('light');
      if (body) {
        body.classList.remove('dark-theme');
        body.classList.add('light-theme');
      }
    }

    // Sincronizar etiqueta meta theme-color para navegadores y WebView de Android
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', resolved === 'dark' ? '#090d16' : '#f8fafc');
    }

    return resolved;
  }

  /**
   * Inicializa la escucha de cambios de preferencia de sistema en tiempo real
   */
  static initSystemListener(getSetting: () => ThemeSetting, onThemeChanged?: (resolved: ResolvedTheme) => void): () => void {
    if (typeof window === 'undefined' || !window.matchMedia) {
      return () => {};
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    // Eliminar listener previo si existiera
    if (this.mediaQueryListener) {
      mediaQuery.removeEventListener('change', this.mediaQueryListener);
      this.mediaQueryListener = null;
    }

    this.mediaQueryListener = (e: MediaQueryListEvent) => {
      const currentSetting = getSetting();
      if (currentSetting === 'system') {
        const resolved = e.matches ? 'dark' : 'light';
        this.applyTheme('system');
        if (onThemeChanged) {
          onThemeChanged(resolved);
        }
      }
    };

    mediaQuery.addEventListener('change', this.mediaQueryListener);

    return () => {
      if (this.mediaQueryListener) {
        mediaQuery.removeEventListener('change', this.mediaQueryListener);
        this.mediaQueryListener = null;
      }
    };
  }
}
