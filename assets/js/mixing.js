(function () {
  function escapeHtml(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function resolveUrl(path, base) {
    if (!path) return "";
    try {
      return new URL(path, base || window.location.href).href;
    } catch (_) {
      return path;
    }
  }

  function renderEmpty(grid) {
    grid.innerHTML =
      '<div class="portfolio-empty" role="status">' +
      '<p class="portfolio-empty-title rgb-fringe">Portfolio coming soon</p>' +
      '<p class="portfolio-empty-body">Before / after cuts will land here. No filler — only real work.</p>' +
      "</div>";
  }

  function renderCard(entry, assetBase) {
    const title = escapeHtml(entry.title || "Untitled");
    const artist = escapeHtml(entry.artist || "");
    const cover = entry.cover
      ? '<div class="cover-wrap"><img src="' +
        escapeHtml(resolveUrl(entry.cover, assetBase)) +
        '" alt="' +
        title +
        ' cover" loading="lazy" width="960" height="540"></div>'
      : '<div class="cover-wrap portfolio-cover-placeholder" aria-hidden="true"></div>';

    let audioBlock = "";
    if (entry.beforeAudio || entry.afterAudio) {
      audioBlock += '<div class="portfolio-audio">';
      if (entry.beforeAudio) {
        audioBlock +=
          '<label class="audio-label">Before</label>' +
          '<audio class="player" controls preload="none" src="' +
          escapeHtml(resolveUrl(entry.beforeAudio, assetBase)) +
          '"></audio>';
      }
      if (entry.afterAudio) {
        audioBlock +=
          '<label class="audio-label">After</label>' +
          '<audio class="player" controls preload="none" src="' +
          escapeHtml(resolveUrl(entry.afterAudio, assetBase)) +
          '"></audio>';
      }
      audioBlock += "</div>";
    }

    return (
      '<article class="beat-card portfolio-card">' +
      cover +
      '<div class="card-body">' +
      '<h3 class="beat-title rgb-fringe" style="font-size:1.35rem">' +
      title +
      "</h3>" +
      (artist
        ? '<div class="beat-meta"><span>' + artist + "</span></div>"
        : "") +
      audioBlock +
      "</div></article>"
    );
  }

  async function loadMixingConfig() {
    const candidates = [
      "mixing.json",
      "../mixing.json",
      "assets/js/mixing.json",
      "../assets/js/mixing.json",
    ];
    for (const url of candidates) {
      try {
        const res = await fetch(url, { cache: "no-store" });
        if (res.ok) return { data: await res.json(), url };
      } catch (_) {}
    }
    return null;
  }

  async function init() {
    const grid = document.querySelector("[data-mixing-portfolio]");
    if (!grid) return;
    const loaded = await loadMixingConfig();
    if (!loaded) {
      renderEmpty(grid);
      return;
    }
    const portfolio = Array.isArray(loaded.data.portfolio)
      ? loaded.data.portfolio
      : [];
    if (!portfolio.length) {
      renderEmpty(grid);
      return;
    }
    const assetBase = new URL(".", new URL(loaded.url, window.location.href)).href;
    grid.innerHTML = portfolio.map((e) => renderCard(e, assetBase)).join("");

    // Re-bind single-player behavior for dynamically added audio
    const players = grid.querySelectorAll("audio.player");
    players.forEach((audio) => {
      audio.addEventListener("play", () => {
        document.querySelectorAll("audio.player").forEach((other) => {
          if (other !== audio && !other.paused) other.pause();
        });
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
