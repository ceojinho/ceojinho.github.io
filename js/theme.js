/**
 * Theme Manager - 다크/라이트 모드 토글 기능
 */
(function () {
  'use strict';

  const THEME_KEY = 'blog-theme';
  const DARK_THEME = 'dark';
  const LIGHT_THEME = 'light';

  /**
   * 저장된 테마 또는 시스템 설정 기반 테마 가져오기
   */
  function getPreferredTheme() {
    const savedTheme = localStorage.getItem(THEME_KEY);
    if (savedTheme) {
      return savedTheme;
    }
    // 시스템 다크 모드 설정 확인
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? DARK_THEME
      : LIGHT_THEME;
  }

  /**
   * 테마 적용
   */
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);

    // Giscus 테마도 함께 변경 (있는 경우)
    const giscusFrame = document.querySelector('iframe.giscus-frame');
    if (giscusFrame) {
      const giscusTheme = theme === DARK_THEME ? 'dark' : 'light';
      giscusFrame.contentWindow.postMessage(
        { giscus: { setConfig: { theme: giscusTheme } } },
        'https://giscus.app'
      );
    }
  }

  /**
   * 테마 토글
   */
  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === DARK_THEME ? LIGHT_THEME : DARK_THEME;
    applyTheme(newTheme);
  }

  /**
   * 초기화
   */
  function init() {
    // 페이지 로드 전 테마 적용 (깜빡임 방지)
    const preferredTheme = getPreferredTheme();
    applyTheme(preferredTheme);

    // DOM 로드 후 이벤트 리스너 등록
    document.addEventListener('DOMContentLoaded', function () {
      const themeToggle = document.getElementById('theme-toggle');
      if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
      }

      // 시스템 테마 변경 감지
      window
        .matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', function (e) {
          // 사용자가 수동으로 테마를 설정하지 않은 경우에만 자동 변경
          if (!localStorage.getItem(THEME_KEY)) {
            applyTheme(e.matches ? DARK_THEME : LIGHT_THEME);
          }
        });
    });
  }

  // 전역으로 테마 관련 함수 노출
  window.ThemeManager = {
    toggle: toggleTheme,
    apply: applyTheme,
    get: getPreferredTheme,
  };

  // 초기화 실행
  init();
})();

