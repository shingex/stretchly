document.body.classList.add(window.runtime.platform())
if (window.runtime.windowsStore()) {
  document.body.classList.add('store')
}
export default {}
