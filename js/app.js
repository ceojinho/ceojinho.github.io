/**
 * Main Application - 게시글 목록 및 필터링
 */
(function () {
  'use strict';

  // 전역 변수 (고유한 이름 사용)
  let allPosts = [];
  let allTags = [];
  let selectedTag = null;

  /**
   * posts.json에서 게시글 데이터 로드
   */
  async function loadPosts() {
    try {
      const response = await fetch('posts.json');
      if (!response.ok) {
        throw new Error('posts.json을 불러올 수 없습니다.');
      }
      allPosts = await response.json();
      
      // 태그 추출
      extractTags();
      
      // 게시글 렌더링
      renderPosts(allPosts);
      
      // 로딩 숨김
      hideLoading();
      
      // 검색 모듈에 데이터 전달
      if (window.SearchModule && typeof window.SearchModule.setData === 'function') {
        window.SearchModule.setData(allPosts);
      }
    } catch (error) {
      console.error('게시글 로드 실패:', error);
      showError('게시글을 불러오는 중 오류가 발생했습니다.');
    }
  }

  /**
   * 모든 게시글에서 고유한 태그 추출
   */
  function extractTags() {
    const tagCount = {};
    
    allPosts.forEach(function (post) {
      if (post.tags && Array.isArray(post.tags)) {
        post.tags.forEach(function (tag) {
          tagCount[tag] = (tagCount[tag] || 0) + 1;
        });
      }
    });
    
    // 태그를 빈도순으로 정렬
    allTags = Object.entries(tagCount)
      .sort(function (a, b) { return b[1] - a[1]; })
      .map(function (entry) {
        return { name: entry[0], count: entry[1] };
      });
    
    renderTags();
  }

  /**
   * 태그 목록 렌더링
   */
  function renderTags() {
    const container = document.getElementById('tags-container');
    if (!container || allTags.length === 0) return;

    let html = '';
    
    // "전체" 태그 추가
    html += '<button class="tag' + (selectedTag === null ? ' active' : '') + '" data-tag="">';
    html += '전체 <span class="tag-count">' + allPosts.length + '</span>';
    html += '</button>';
    
    allTags.forEach(function (tag) {
      const isActive = selectedTag === tag.name;
      html += '<button class="tag' + (isActive ? ' active' : '') + '" data-tag="' + escapeHtml(tag.name) + '">';
      html += escapeHtml(tag.name) + ' <span class="tag-count">' + tag.count + '</span>';
      html += '</button>';
    });

    container.innerHTML = html;
    
    // 태그 클릭 이벤트 등록
    container.querySelectorAll('.tag').forEach(function (tagEl) {
      tagEl.addEventListener('click', function () {
        const tagName = this.getAttribute('data-tag');
        filterByTag(tagName || null);
      });
    });
  }

  /**
   * 태그로 필터링
   */
  function filterByTag(tag) {
    selectedTag = tag;
    
    // 태그 UI 업데이트
    document.querySelectorAll('.tag').forEach(function (tagEl) {
      const tagName = tagEl.getAttribute('data-tag');
      if ((tag === null && tagName === '') || tag === tagName) {
        tagEl.classList.add('active');
      } else {
        tagEl.classList.remove('active');
      }
    });
    
    // 게시글 필터링
    let filteredPosts = allPosts;
    if (tag !== null) {
      filteredPosts = allPosts.filter(function (post) {
        return post.tags && post.tags.includes(tag);
      });
    }
    
    renderPosts(filteredPosts);
    
    // 검색 모듈에 필터링된 데이터 전달
    if (window.SearchModule && typeof window.SearchModule.setData === 'function') {
      window.SearchModule.setData(filteredPosts);
    }
  }

  /**
   * 게시글 목록 렌더링
   */
  function renderPosts(posts) {
    const container = document.getElementById('posts-container');
    const noResults = document.getElementById('no-results');
    
    if (!container) return;

    if (posts.length === 0) {
      container.innerHTML = '';
      if (noResults) noResults.style.display = 'block';
      return;
    }

    if (noResults) noResults.style.display = 'none';

    let html = '';
    posts.forEach(function (post) {
      html += createPostCard(post);
    });

    container.innerHTML = html;
  }

  /**
   * 게시글 카드 HTML 생성
   */
  function createPostCard(post) {
    const tagsHtml = (post.tags || [])
      .map(function (tag) {
        return '<span class="post-card-tag">' + escapeHtml(tag) + '</span>';
      })
      .join('');

    return (
      '<a href="post.html?file=' + encodeURIComponent(post.file) + '" class="post-card">' +
      (post.category
        ? '<span class="post-card-category">' + escapeHtml(post.category) + '</span>'
        : '') +
      '<h2 class="post-card-title">' + escapeHtml(post.title) + '</h2>' +
      '<p class="post-card-excerpt">' + escapeHtml(post.excerpt || post.description || '') + '</p>' +
      '<div class="post-card-meta">' +
      '<time class="post-card-date">' + formatDate(post.date) + '</time>' +
      (tagsHtml ? '<div class="post-card-tags">' + tagsHtml + '</div>' : '') +
      '</div>' +
      '</a>'
    );
  }

  /**
   * 날짜 포맷팅
   */
  function formatDate(dateStr) {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch (e) {
      return dateStr;
    }
  }

  /**
   * HTML 이스케이프
   */
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 로딩 UI 숨김
   */
  function hideLoading() {
    const loading = document.getElementById('loading');
    if (loading) {
      loading.style.display = 'none';
    }
  }

  /**
   * 에러 메시지 표시
   */
  function showError(message) {
    hideLoading();
    const container = document.getElementById('posts-container');
    if (container) {
      container.innerHTML =
        '<div class="no-results"><p>' + escapeHtml(message) + '</p></div>';
    }
  }

  /**
   * 전역 API 노출
   */
  window.BlogApp = {
    getPosts: function () { return allPosts; },
    getTags: function () { return allTags; },
    renderPosts: renderPosts,
    filterByTag: filterByTag,
  };

  /**
   * 초기화
   */
  document.addEventListener('DOMContentLoaded', function () {
    // 메인 페이지에서만 실행
    if (document.getElementById('posts-container')) {
      loadPosts();
    }
  });
})();

