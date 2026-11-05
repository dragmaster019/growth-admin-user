try {
  var savedTheme = localStorage.getItem('mlm-theme')
  document.documentElement.dataset.theme =
    savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : 'dark'
} catch {
  document.documentElement.dataset.theme = 'dark'
}
