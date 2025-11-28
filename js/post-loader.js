/**
 * Post Loader - 마크다운 로딩, 파싱, Giscus 댓글 연동
 */
(function () {
  'use strict';

  /**
   * URL에서 파일명 파라미터 추출
   */
  function getFileParam() {
    const params = new URLSearchParams(window.location.search);
    return params.get('file');
  }

  /**
   * Front Matter 파싱
   */
  function parseFrontMatter(content) {
    // UTF-8 BOM 제거 (Windows 호환)
    if (content.charCodeAt(0) === 0xfeff) {
      content = content.slice(1);
    }

    const frontMatterMatch = content.match(
      /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/
    );

    if (!frontMatterMatch) {
      return { metadata: {}, content: content };
    }

    const frontMatter = frontMatterMatch[1];
    const postContent = frontMatterMatch[2];
    const metadata = {};

    // Front Matter 라인 파싱
    const lines = frontMatter.split(/\r?\n/);
    lines.forEach(function (line) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        let value = line.substring(colonIndex + 1).trim();

        // 따옴표 제거
        if (
          (value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))
        ) {
          value = value.slice(1, -1);
        }

        // 배열 파싱 (tags)
        if (key === 'tags' && value.startsWith('[') && value.endsWith(']')) {
          try {
            value = JSON.parse(value);
          } catch (e) {
            value = value
              .slice(1, -1)
              .split(',')
              .map(function (tag) {
                return tag.trim().replace(/^['"]|['"]$/g, '');
              });
          }
        }

        metadata[key] = value;
      }
    });

    return { metadata: metadata, content: postContent };
  }

  /**
   * 마크다운을 HTML로 변환
   */
  function renderMarkdown(content) {
    if (typeof marked === 'undefined') {
      console.error('marked.js가 로드되지 않았습니다.');
      return content;
    }

    // marked 설정
    marked.setOptions({
      highlight: function (code, lang) {
        if (typeof Prism !== 'undefined' && lang && Prism.languages[lang]) {
          return Prism.highlight(code, Prism.languages[lang], lang);
        }
        return code;
      },
      breaks: true,
      gfm: true,
    });

    return marked.parse(content);
  }

  /**
   * 게시글 로드 및 렌더링
   */
  async function loadPost() {
    const filename = getFileParam();

    if (!filename) {
      showError('게시글을 찾을 수 없습니다.');
      return;
    }

    try {
      const response = await fetch('pages/' + filename);
      if (!response.ok) {
        throw new Error('게시글을 불러올 수 없습니다.');
      }

      const rawContent = await response.text();
      const parsed = parseFrontMatter(rawContent);
      const metadata = parsed.metadata;
      const content = parsed.content;

      // 메타데이터 렌더링
      renderMetadata(metadata, filename);

      // 본문 렌더링
      const postContent = document.getElementById('post-content');
      if (postContent) {
        postContent.innerHTML = renderMarkdown(content);

        // Prism.js 코드 하이라이팅 재적용
        if (typeof Prism !== 'undefined') {
          Prism.highlightAllUnder(postContent);
        }
      }

      // 페이지 제목 업데이트
      if (metadata.title) {
        document.title = metadata.title + ' - ceojinho\'s Blog';
      }

      // Giscus 댓글 로드
      loadGiscus();
    } catch (error) {
      console.error('게시글 로드 실패:', error);
      showError('게시글을 불러오는 중 오류가 발생했습니다.');
    }
  }

  /**
   * 메타데이터 렌더링
   */
  function renderMetadata(metadata, filename) {
    // 카테고리
    const categoryEl = document.getElementById('post-category');
    if (categoryEl && metadata.category) {
      categoryEl.textContent = metadata.category;
    }

    // 제목
    const titleEl = document.getElementById('post-title');
    if (titleEl) {
      titleEl.textContent = metadata.title || filename.replace('.md', '');
    }

    // 날짜
    const dateEl = document.getElementById('post-date');
    if (dateEl && metadata.date) {
      try {
        const date = new Date(metadata.date);
        dateEl.textContent = date.toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });
      } catch (e) {
        dateEl.textContent = metadata.date;
      }
    }

    // 태그
    const tagsEl = document.getElementById('post-tags');
    if (tagsEl && metadata.tags && Array.isArray(metadata.tags)) {
      tagsEl.innerHTML = metadata.tags
        .map(function (tag) {
          return '<span class="post-tag">' + escapeHtml(tag) + '</span>';
        })
        .join('');
    }
  }

  /**
   * Giscus 댓글 시스템 로드
   */
  function loadGiscus() {
    const container = document.getElementById('giscus-container');
    if (!container) return;

    // 기존 Giscus 제거
    container.innerHTML = '';

    // 현재 테마 확인
    const currentTheme =
      document.documentElement.getAttribute('data-theme') || 'light';
    const giscusTheme = currentTheme === 'dark' ? 'dark' : 'light';

    // Giscus 스크립트 생성
    const script = document.createElement('script');
    script.src = 'https://giscus.app/client.js';
    script.setAttribute('data-repo', 'ceojinho/ceojinho.github.io');
    script.setAttribute('data-repo-id', 'R_kgDOQec2gA'); // TODO: 실제 repo-id로 교체 필요
    script.setAttribute('data-category', 'General');
    script.setAttribute('data-category-id', 'DIC_kwDOQec2gM4CzIzc'); // TODO: 실제 category-id로 교체 필요
    script.setAttribute('data-mapping', 'pathname');
    script.setAttribute('data-strict', '0');
    script.setAttribute('data-reactions-enabled', '1');
    script.setAttribute('data-emit-metadata', '1');
    script.setAttribute('data-input-position', 'bottom');
    script.setAttribute('data-theme', giscusTheme);
    script.setAttribute('data-lang', 'ko');
    script.crossOrigin = 'anonymous';
    script.async = true;

    container.appendChild(script);
  }

  /**
   * 에러 메시지 표시
   */
  function showError(message) {
    const titleEl = document.getElementById('post-title');
    if (titleEl) {
      titleEl.textContent = '오류';
    }

    const contentEl = document.getElementById('post-content');
    if (contentEl) {
      contentEl.innerHTML =
        '<div class="no-results"><p>' + escapeHtml(message) + '</p>' +
        '<a href="index.html">목록으로 돌아가기</a></div>';
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
   * 초기화
   */
  document.addEventListener('DOMContentLoaded', function () {
    // 게시글 페이지에서만 실행
    if (document.getElementById('post-content')) {
      loadPost();
    }
  });
})();

