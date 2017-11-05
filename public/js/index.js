const dayInputs = document.querySelectorAll('#day-picker input')
const timeInputs = document.querySelectorAll('#time-picker input')
const intervalDisplay = document.getElementById('interval-display')
const form = document.forms.schedule
const submit = document.getElementById('submit')

forEach(dayInputs, input => {
  input.addEventListener('click', updateInterval)
})

forEach(timeInputs, input => {
  input.addEventListener('input', event => {
    const el = event.target
    const value = parseInt(el.value)
    const min = parseInt(el.min)
    const max = parseInt(el.max)

    if (value >= min && value <= max) {
      el.value = value
      updateInterval()
    } else {
      el.value = '0'
      updateInterval()
    }
  })
})

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
  const times = []

  forEach(dayInputs, input => {
    if (input.checked) {
      days.push(capitalize(input.name).slice(0, 3))
    }
  })

  if (days.length === 7) {
    days.length = 0
  }

  forEach(timeInputs, input => {
    const time = parseInt(input.value)

    if (time > 0) {
      if (time === 1) {
        times.push(input.name.slice(0, -1))
      } else {
        times.push(input.value + ' ' + input.name)
      }
    }
  })

  intervalDisplay.textContent = 'Will run '
  intervalDisplay.textContent += times.length ? days.join(', ') + ' every ' + times.join(' and ') : 'never'
}

function forEach(list, fn) {
  Array.prototype.forEach.call(list, fn)
}

function capitalize(string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}
