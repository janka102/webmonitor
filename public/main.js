var dayInputs = document.getElementById('dayPicker').getElementsByTagName('input'),
    timeInputs = document.getElementById('timePicker').getElementsByTagName('input'),
    intervalDisplay = document.getElementById('intervalDisplay'),
    form = document.forms.schedule,
    submit = document.getElementById('submit')

forEach(document.querySelectorAll('input + .input-label'), function(el) {
    function input(event) {
        var self = event.target;

        if (self.value.length) {
            self.classList.add('has-text');
            self.classList.remove('no-text');
        } else {
            self.classList.remove('has-text');
            self.classList.add('no-text');
        }
    }

    el.previousElementSibling.addEventListener('input', input);
    input({
        target: el.previousElementSibling
    });
});

forEach(dayInputs, function(input) {
    input.addEventListener('click', updateTime, false);
});

forEach(timeInputs, function(input) {
    input.addEventListener('input', function(event) {
        var el = event.target,
            value = parseInt(el.value),
            min = parseInt(el.min),
            max = parseInt(el.max);

        if (value >= min && value <= max) {
            el.value = value;
            updateTime();
        } else {
            el.value = '';
            updateTime();
        }
    }, false);
});

updateTime();

form.addEventListener('submit', function(event) {
    event.preventDefault();

    atomic.post(event.target.action, serialize(event.target))
        .success(function(text) {
            console.log('From server:', text);
        });
});

function updateTime() {
    var days = [],
        times = '';

    forEach(dayInputs, function(input) {
        if (input.checked) {
            days.push(capitalize(input.name).slice(0, 3));
        }
    });

    if (days.length === 7) {
        days = ''
    } else {
        days = days.join(', ');
    }

    forEach(timeInputs, function(input) {
        var time = parseInt(input.value);

        if (time > 0) {
            times += ' every ';

            if (time === 1) {
                times += input.name.slice(0, -1);
            } else {
                times += input.value + ' ' + input.name;
            }
        }
    });

    intervalDisplay.textContent = (days + times) || 'Never';
}

function forEach(list, fn) {
    Array.prototype.forEach.call(list, fn);
}

function capitalize(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function serialize(form) {
    // Based on http://stackoverflow.com/a/24435566/1307440
    var field, query = [];

    if (form && form.nodeName === 'FORM') {
        for (var i = 0, elLen = form.elements.length; i < elLen; i++) {
            field = form.elements[i];

            if (field.name && field.type !== 'file' && field.type !== 'reset') {
                if (field.type == 'select-multiple') {
                    for (var j = 0, optLen = field.options.length, option; j < optLen; j++) {
                        option = field.options[j];

                        if (option.selected) {
                            query.push(field.name + '=' + encodeURIComponent(option.value).replace(/%20/g, '+'));
                        }
                    }
                } else {
                    if (field.type !== 'submit' && field.type !== 'button') {
                        if ((field.type !== 'checkbox' && field.type !== 'radio') || field.checked) {
                            query.push(field.name + '=' + encodeURIComponent(field.value).replace(/%20/g, '+'));
                        }
                    }
                }
            }
        }
    }

    return query.join('&');
}
