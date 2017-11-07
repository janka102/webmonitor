const jobTimes = document.querySelectorAll('.job-time')

forEach(jobTimes, el => {
  el.textContent = new Date(el.textContent).toLocaleString()
})

function forEach(list, fn) {
  Array.prototype.forEach.call(list, fn)
}
