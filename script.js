// Функция для загрузки SVG из файла
function loadSVG() {
    fetch('svg-filter.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('svg-container').innerHTML = data;

            // Запуск анимации после загрузки SVG
            const svgFilter = document.getElementById('filter-0');
            const colorMatrix = svgFilter.querySelector('feColorMatrix');

            let currentValue = 0; // Начальное значение
            let direction = 1; // Направление анимации (1 - увеличиваем, -1 - уменьшаем)

            function animate() {
                currentValue += direction; // Увеличиваем или уменьшаем значение

                // Меняем направление, если значение достигло границ
                if (currentValue >= 3500) {
                    direction = -1; // Меняем направление на уменьшение
                } else if (currentValue <= 0) {
                    direction = 1; // Меняем направление на увеличение
                }

                colorMatrix.setAttribute('values', currentValue);
                requestAnimationFrame(animate); // Запрос следующего кадра
            }
            animate(); // Начинаем анимацию
        })
        .catch(error => console.error('Ошибка загрузки SVG:', error));
}

// Загружаем SVG при загрузке страницы
window.onload = loadSVG;
