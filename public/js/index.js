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

form.addEventListener('submit', function(event) {
  event.preventDefault()

  atomic.post(event.target.action, serialize(event.target)).success(function(text) {
    console.log('From server:', text)
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

function serialize(form) {
  // Based on http://stackoverflow.com/a/24435566/1307440
  var field,
    query = []

  if (form && form.nodeName === 'FORM') {
    for (var i = 0, elLen = form.elements.length; i < elLen; i++) {
      field = form.elements[i]

      if (field.name && field.type !== 'file' && field.type !== 'reset') {
        if (field.type == 'select-multiple') {
          for (var j = 0, optLen = field.options.length, option; j < optLen; j++) {
            option = field.options[j]

            if (option.selected) {
              query.push(field.name + '=' + encodeURIComponent(option.value).replace(/%20/g, '+'))
            }
          }
        } else {
          if (field.type !== 'submit' && field.type !== 'button') {
            if ((field.type !== 'checkbox' && field.type !== 'radio') || field.checked) {
              query.push(field.name + '=' + encodeURIComponent(field.value).replace(/%20/g, '+'))
            }
          }
        }
      }
    }
  }

  return query.join('&')
}
