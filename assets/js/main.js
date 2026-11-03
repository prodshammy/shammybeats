(function () {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("role", "status");
  document.body.appendChild(toast);
  let toastTimer;

  function showToast(msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
  }

  function absoluteUrl(path) {
    try {
      return new URL(path, window.location.href).href;
    } catch (e) {
      return path;
    }
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (_) {}
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.left = "-9999px";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (_) {}
    document.body.removeChild(ta);
    return ok;
  }

  document.addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-copy-link]");
    if (!btn) return;
    e.preventDefault();
    const path = btn.getAttribute("data-copy-link");
    const url = absoluteUrl(path);
    const ok = await copyText(url);
    btn.classList.add("copied");
    showToast(ok ? "Link copied" : "Copy failed");
    setTimeout(() => btn.classList.remove("copied"), 1600);
  });

  // Only one audio playing at a time
  const players = document.querySelectorAll("audio.player");
  players.forEach((audio) => {
    audio.addEventListener("play", () => {
      players.forEach((other) => {
        if (other !== audio && !other.paused) other.pause();
      });
    });
  });

  // Highlight card when landing on #anchor
  function highlightFromHash() {
    document.querySelectorAll(".beat-card.highlight").forEach((el) => {
      el.classList.remove("highlight");
    });
    const id = (location.hash || "").replace(/^#/, "");
    if (!id) return;
    const card = document.getElementById(id);
    if (card) {
      card.classList.add("highlight");
      card.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
  window.addEventListener("hashchange", highlightFromHash);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", highlightFromHash);
  } else {
    highlightFromHash();
  }
})();
