// Wallpaper: a local file (also listed on D: under assets). If it fails to load the desktop stays teal.
const CONFIG = { wallpaper: 'assets/wallpaper.jpg' };
if (CONFIG.wallpaper) document.getElementById('desk').style.setProperty('--wp', 'url("' + new URL(CONFIG.wallpaper, document.baseURI).href + '")');
