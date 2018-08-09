const enableButton = document.getElementById('enable-button');
const disableButton = document.getElementById('disable-button');
const deleteButton = document.getElementById('delete-button');

forEach(document.querySelectorAll('.job-time'), (el) => {
  el.textContent = new Date(el.textContent).toLocaleString();
});

forEach(document.querySelectorAll('.job-kind'), (el) => {
  if (el.textContent === 'error') {
    el.parentElement.classList.add('error-value');
  }
});

enableButton.addEventListener('click', (event) => {
  atomic
    .ajax({
      type: 'POST',
      url: location.pathname + '/enable'
    })
    .success((res) => {
      enableButton.hidden = true;
      disableButton.hidden = false;
    });
});

disableButton.addEventListener('click', (event) => {
  atomic
    .ajax({
      type: 'POST',
      url: location.pathname + '/disable'
    })
    .success((res) => {
      disableButton.hidden = true;
      enableButton.hidden = false;
    });
});

deleteButton.addEventListener('click', (event) => {
  atomic
    .ajax({
      type: 'POST',
      url: location.pathname + '/delete'
    })
    .success((res) => {
      location.pathname = '/list';
    });
});

function forEach(list, fn) {
  Array.prototype.forEach.call(list, fn);
}
