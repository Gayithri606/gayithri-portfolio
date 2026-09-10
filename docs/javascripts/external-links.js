/*
 * Open external links in the site navigation (the GitHub and LinkedIn tabs)
 * in a new tab, so a visitor reaching one of those profiles keeps this site
 * open behind it. This matches the theme's own behaviour for the footer
 * social icons, which it already renders with target="_blank".
 *
 * document$ is provided by mkdocs-material. It is used instead of
 * DOMContentLoaded because navigation.instant is enabled: pages load without
 * a full refresh, so a DOMContentLoaded handler would run on the first page
 * view only. document$ emits on every page load, instant ones included.
 *
 * The selector deliberately uses the <nav> element rather than any theme CSS
 * class, so a future theme release cannot quietly break it. Links inside page
 * content are left alone.
 */
document$.subscribe(function () {
  document.querySelectorAll('nav a[href^="http"]').forEach(function (link) {
    if (link.hostname !== window.location.hostname) {
      link.target = "_blank"
      link.rel = "noopener"
      // the tab-bar labels are hidden by CSS, so surface them on hover
      link.title = link.textContent.trim()
    }
  })
})
