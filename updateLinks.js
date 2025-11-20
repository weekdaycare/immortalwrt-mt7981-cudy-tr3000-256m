async function updateDownloadLinksAndTimesByIndex() {
  const apiUrl =
    "https://api.github.com/repos/weekdaycare/immortalwrt-mt7981-cudy-tr3000/releases";
  try {
    const response = await fetch(apiUrl);
    if (!response.ok) throw new Error("GitHub API error: " + response.status);
    const releases = await response.json();

    const keys = ["256M", "128M", "128M_Ubootmod", "uboot"];
    const latestReleases = {
      "256M": null,
      "128M": null,
      "128M_Ubootmod": null,
      uboot: null,
    };

    for (const release of releases) {
      const name = release.name;
      for (const key of keys) {
        if (name === key || name.startsWith(key + "-")) {
          const currentTime = latestReleases[key]?.timestamp || null;
          const publishedAt = release.published_at;
          if (!publishedAt) continue;
          if (!currentTime || publishedAt > currentTime) {
            latestReleases[key] = { release, timestamp: publishedAt };
          }
        }
      }
    }

    const linkElements = Array.from(
      document.querySelectorAll(".item.grid-6 > a"),
    );
    const timeIds = [
      "time-256M",
      "time-128M",
      "time-128M-ubootmod",
      "time-uboot",
    ];

    keys.forEach((key, index) => {
      const data = latestReleases[key];
      if (data && linkElements[index]) {
        const hrefElem = linkElements[index];
        const timeElem = document.getElementById(timeIds[index]);
        const timeStr = data.timestamp.replace(/T/, " ").replace(/Z/, "");
        timeElem.textContent = timeStr;
        if (key === "uboot") {
          hrefElem.href = data.release.html_url;
        } else {
          const asset = data.release.assets.find((a) =>
            a.browser_download_url.includes("sysupgrade.bin"),
          );
          hrefElem.href = asset.browser_download_url;
        }
      }
    });
  } catch (err) {
    console.error("Failed to update links:", err);
  }
}

// 只在主页首次加载和用户切回主页时执行更新
function runUpdateOnHomepage() {
  if (window.location.pathname === "/") {
    updateDownloadLinksAndTimesByIndex();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", runUpdateOnHomepage);
} else {
  runUpdateOnHomepage();
}

window.addEventListener("popstate", runUpdateOnHomepage);

(function () {
  const pushState = history.pushState;
  history.pushState = function () {
    pushState.apply(history, arguments);
    runUpdateOnHomepage();
  };
  const replaceState = history.replaceState;
  history.replaceState = function () {
    replaceState.apply(history, arguments);
    runUpdateOnHomepage();
  };
})();
