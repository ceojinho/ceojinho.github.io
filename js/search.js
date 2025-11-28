/**
 * Search Module - 클라이언트 사이드 검색 기능
 */
(function () {
  'use strict';

  // 검색용 게시글 데이터 (고유한 변수명 사용)
  let searchPosts = [];
  let searchTimeout = null;

  /**
   * 검색 데이터 설정
   */
  function setSearchData(posts) {
    searchPosts = posts || [];
  }

  /**
   * 검색 실행
   */
  function performSearch(query) {
    query = query.trim().toLowerCase();

    if (!query) {
      // 검색어가 없으면 전체 목록 표시
      if (window.BlogApp && typeof window.BlogApp.renderPosts === 'function') {
        window.BlogApp.renderPosts(searchPosts);
      }
      return;
    }

    // 검색어로 필터링
    const results = searchPosts.filter(function (post) {
      // 제목에서 검색
      if (post.title && post.title.toLowerCase().includes(query)) {
        return true;
      }
      // 설명에서 검색
      if (post.description && post.description.toLowerCase().includes(query)) {
        return true;
      }
      // 발췌문에서 검색
      if (post.excerpt && post.excerpt.toLowerCase().includes(query)) {
        return true;
      }
      // 태그에서 검색
      if (post.tags && Array.isArray(post.tags)) {
        for (let i = 0; i < post.tags.length; i++) {
          if (post.tags[i].toLowerCase().includes(query)) {
            return true;
          }
        }
      }
      // 카테고리에서 검색
      if (post.category && post.category.toLowerCase().includes(query)) {
        return true;
      }
      return false;
    });

    // 결과 렌더링
    if (window.BlogApp && typeof window.BlogApp.renderPosts === 'function') {
      window.BlogApp.renderPosts(results);
    }
  }

  /**
   * 디바운스된 검색 (입력 중 과도한 검색 방지)
   */
  function debouncedSearch(query) {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    searchTimeout = setTimeout(function () {
      performSearch(query);
    }, 200);
  }

  /**
   * 검색 입력 핸들러
   */
  function handleSearchInput(event) {
    const query = event.target.value;
    const clearButton = document.getElementById('search-clear');

    // 지우기 버튼 표시/숨김
    if (clearButton) {
      clearButton.style.display = query ? 'flex' : 'none';
    }

    debouncedSearch(query);
  }

  /**
   * 검색어 지우기
   */
  function clearSearch() {
    const searchInput = document.getElementById('search-input');
    const clearButton = document.getElementById('search-clear');

    if (searchInput) {
      searchInput.value = '';
      searchInput.focus();
    }

    if (clearButton) {
      clearButton.style.display = 'none';
    }

    // 전체 목록 표시
    if (window.BlogApp && typeof window.BlogApp.renderPosts === 'function') {
      window.BlogApp.renderPosts(searchPosts);
    }
  }

  /**
   * 키보드 단축키 처리
   */
  function handleKeyDown(event) {
    // Escape 키로 검색어 지우기
    if (event.key === 'Escape') {
      clearSearch();
    }
  }

  /**
   * 전역 단축키 (Cmd/Ctrl + K로 검색창 포커스)
   */
  function handleGlobalKeyDown(event) {
    if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
      event.preventDefault();
      const searchInput = document.getElementById('search-input');
      if (searchInput) {
        searchInput.focus();
        searchInput.select();
      }
    }
  }

  /**
   * 초기화
   */
  function init() {
    const searchInput = document.getElementById('search-input');
    const clearButton = document.getElementById('search-clear');

    if (searchInput) {
      searchInput.addEventListener('input', handleSearchInput);
      searchInput.addEventListener('keydown', handleKeyDown);
    }

    if (clearButton) {
      clearButton.addEventListener('click', clearSearch);
    }

    // 전역 키보드 단축키
    document.addEventListener('keydown', handleGlobalKeyDown);
  }

  /**
   * 전역 API 노출
   */
  window.SearchModule = {
    setData: setSearchData,
    search: performSearch,
    clear: clearSearch,
  };

  /**
   * DOM 로드 후 초기화
   */
  document.addEventListener('DOMContentLoaded', init);
})();

