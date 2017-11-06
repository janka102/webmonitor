const dayInputs = document.querySelectorAll('#day-picker input')
const intervalSelect = document.getElementById('interval')
const intervalDisplay = document.getElementById('interval-display')
const form = document.forms.schedule
const submit = document.getElementById('submit')

forEach(dayInputs, input => {
  input.addEventListener('click', updateInterval)
})

intervalSelect.addEventListener('change', updateInterval)

updateInterval()

form.addEventListener('submit', event => {
  event.preventDefault()

  const params = []

  for (const pair of new FormData(form)) {
    params.push(encodeURIComponent(pair[0]) + '=' + encodeURIComponent(pair[1]))
  }

  atomic
    .ajax({
      type: 'POST',
      url: event.target.action,
      data: params.join('&')
    })
    .success(res => {
      console.log('From server:', res)
    })
})

function updateInterval() {
  const days = []
  const interval = intervalSelect.querySelector(`option[value="${intervalSelect.value}"]`).textContent

  forEach(dayInputs, input => {
    if (input.checked) {
      const name = capitalize(input.id)
      days.push(name)
    }
  })

  if (days.length === 7) {
    days.length = 0
  }

  intervalDisplay.textContent = `Will check ${days.join(', ')} ${interval}`
}

function forEach(list, fn) {
  Array.prototype.forEach.call(list, fn)
}

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}
