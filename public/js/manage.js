const pauseButton = document.getElementById('pause-button')
const resumeButton = document.getElementById('resume-button')
const deleteButton = document.getElementById('delete-button')

forEach(document.querySelectorAll('.job-time'), el => {
  el.textContent = new Date(el.textContent).toLocaleString()
})

forEach(document.querySelectorAll('.job-kind'), el => {
  if (el.textContent === 'error') {
    el.parentElement.classList.add('error-value')
  }
})

pauseButton.addEventListener('click', event => {
  atomic
    .ajax({
      type: 'POST',
      url: location.pathname + '/pause'
    })
    .success(res => {
      pauseButton.hidden = true
      resumeButton.hidden = false
    })
})

resumeButton.addEventListener('click', event => {
  atomic
    .ajax({
      type: 'POST',
      url: location.pathname + '/resume'
    })
    .success(res => {
      resumeButton.hidden = true
      pauseButton.hidden = false
    })
})

deleteButton.addEventListener('click', event => {
  atomic
    .ajax({
      type: 'POST',
      url: location.pathname + '/delete'
    })
    .success(res => {
      location = '/list'
    })
})

function forEach(list, fn) {
  Array.prototype.forEach.call(list, fn)
}
