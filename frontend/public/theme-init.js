try {
  var savedTheme = localStorage.getItem('mlm-theme')
  var theme = savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : 'dark'
  document.documentElement.dataset.theme = theme
  var scheme = document.querySelector('meta[name="color-scheme"]')
  if (scheme) scheme.setAttribute('content', theme)
  var themeColor = document.querySelector('meta[name="theme-color"]')
  if (themeColor) themeColor.setAttribute('content', theme === 'light' ? '#ecf8ef' : '#06120a')
} catch {
  document.documentElement.dataset.theme = 'dark'
}
