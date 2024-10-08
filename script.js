let animationSpeed = 0.5; // Начальная скорость анимации
    let animationFrameId;

    // Функция для загрузки SVG из файла
    function loadSVG() {
        fetch('svg-filter.html')
            .then(response => response.text())
            .then(data => {
                document.getElementById('svg-container').innerHTML = data;

                // Запуск анимации после загрузки SVG
                const svgFilter = document.getElementById('filter-0');
                const colorMatrix = svgFilter.querySelector('feColorMatrix');
                const turbulence = svgFilter.querySelector('feTurbulence');

                let currentValue = 0; // Начальное значение
                let direction = 1; // Направление анимации (1 - увеличиваем, -1 - уменьшаем)

                function animate() {
                    currentValue += direction * animationSpeed; // Увеличиваем или уменьшаем значение с учетом скорости

                    // Меняем направление, если значение достигло границ
                    if (currentValue >= 3500) {
                        direction = -1; // Меняем направление на уменьшение
                    } else if (currentValue <= 0) {
                        direction = 1; // Меняем направление на увеличение
                    }

                    colorMatrix.setAttribute('values', currentValue);
                    animationFrameId = requestAnimationFrame(animate); // Запрос следующего кадра
                }

                animate(); // Начинаем анимацию

                // Обработчик изменения скорости
                document.getElementById('speed-slider').addEventListener('input', (event) => {
                    animationSpeed = parseFloat(event.target.value); // Обновляем скорость анимации
                });

                // Обработчик изменения baseFrequency
                document.getElementById('frequency-slider').addEventListener('input', (event) => {
                   const baseFrequency = parseFloat(event.target.value); // Получаем новое значение baseFrequency
                   turbulence.setAttribute('baseFrequency', baseFrequency); // Устанавливаем новое значение baseFrequency
                });

                // Обработчик изменения numOctaves
               document.getElementById('octaves-slider').addEventListener('input', (event) => {
                   numOctaves = parseInt(event.target.value); // Получаем новое значение numOctaves
                   turbulence.setAttribute('numOctaves', numOctaves); // Устанавливаем новое значение numOctaves
               });
            })
            .catch(error => console.error('Ошибка загрузки SVG:', error));
    }

    // Загружаем SVG при загрузке страницы
    window.onload = loadSVG;
