var stop = document.getElementById('stop'),
    dialog = document.getElementById('dialog');

stop.addEventListener('click', function(event) {
    atomic.post(window.location.pathname)
        .success(function() {
            dialog.querySelector('.spinner').style.display = 'none';

            dialog.querySelector('.message').textContent = '✔ Done';
        })
        .error(function(err) {
            console.log(err);
        });

    event.target.disabled = true;
    dialog.classList.add('show');
});
