function checkInstallation() {
  if (process.server) {
    return false;
  }

  // https://thomashunter.name/posts/2021-12-11-detecting-if-pwa-twa-is-installed
  const ua = navigator.userAgent;
  const ios = ua.match(/iPhone|iPad|iPod/);
  const standalone = window.matchMedia('(display-mode: standalone)').matches;
  const isInstalled = !!(standalone || (ios && !ua.match(/Safari/)));

  return isInstalled;
}

export const isInstalled = checkInstallation();
