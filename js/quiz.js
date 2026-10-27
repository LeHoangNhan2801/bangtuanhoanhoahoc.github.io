let allElements = [];
        let questionPool = [];
        let currentQuestionIndex = 0;
        let score = 0;
        let TOTAL_QUESTIONS = 20;
        let isDailyMode = false;

        fetch("./elements.json")
            .then(res => res.json())
            .then(data => {
                allElements = data.elements || data;
                
                const urlParams = new URLSearchParams(window.location.search);
                if (urlParams.get('mode') === 'daily') {
                    startDailyChallenge();
                }
                // If not daily mode, it stays on the setup screen until the user selects a count and clicks start.
            })
            .catch(err => {
                document.getElementById('quiz-body').innerHTML = `<div style="text-align: center; color: #f87171;">Lỗi khi tải dữ liệu nguyên tố!</div>`;
                console.error(err);
            });

        function translateCategory(cat) {
            if (!cat) return 'Không rõ';
            cat = cat.toLowerCase();
            if (cat.includes('transition metal')) return 'Kim loại chuyển tiếp';
            if (cat.includes('alkali metal')) return 'Kim loại kiềm';
            if (cat.includes('alkaline earth')) return 'Kim loại kiềm thổ';
            if (cat.includes('post-transition')) return 'Kim loại hậu chuyển tiếp';
            if (cat.includes('metalloid')) return 'Á kim';
            if (cat.includes('nonmetal')) return 'Phi kim';
            if (cat.includes('noble gas')) return 'Khí hiếm';
            if (cat.includes('lanthanide')) return 'Lanthanide';
            if (cat.includes('actinide')) return 'Actinide';
            return cat;
        }

        function translatePhase(phase) {
            if (!phase) return 'Không rõ';
            phase = phase.toLowerCase();
            if (phase === 'solid') return 'Thể rắn';
            if (phase === 'liquid') return 'Thể lỏng';
            if (phase === 'gas') return 'Thể khí';
            return phase;
        }

        function generateBasePool() {
            let pool = [];
            allElements.forEach(el => {
                pool.push({
                    q: `Nguyên tố có kí hiệu hóa học **${el.symbol}** là gì?`,
                    correct: el.name,
                    generator: () => getRandomWrongOptions(el.name, allElements.map(x => x.name))
                });
                pool.push({
                    q: `Kí hiệu hóa học của nguyên tố **${el.name}** là gì?`,
                    correct: el.symbol,
                    generator: () => getRandomWrongOptions(el.symbol, allElements.map(x => x.symbol))
                });
                pool.push({
                    q: `Nguyên tố nào có số hiệu nguyên tử bằng **${el.number}**?`,
                    correct: el.name,
                    generator: () => getRandomWrongOptions(el.name, allElements.map(x => x.name))
                });
                pool.push({
                    q: `Số hiệu nguyên tử của nguyên tố **${el.name}** là bao nhiêu?`,
                    correct: String(el.number),
                    generator: () => getRandomWrongOptions(String(el.number), allElements.map(x => String(x.number)))
                });
                if (el.category) {
                    let catVi = translateCategory(el.category);
                    pool.push({
                        q: `Nguyên tố **${el.name}** (${el.symbol}) thuộc loại nào?`,
                        correct: catVi,
                        generator: () => getRandomWrongOptions(catVi, [...new Set(allElements.map(x => translateCategory(x.category)))])
                    });
                }
            });
            return pool;
        }

        function startCustomQuiz() {
            const countSelect = document.getElementById('question-count');
            TOTAL_QUESTIONS = parseInt(countSelect.value);
            document.getElementById('total-q-label').innerText = TOTAL_QUESTIONS;
            document.getElementById('quiz-header').style.display = 'flex';

            // Build question pool
            let basePool = generateBasePool();
            let shuffledPool = basePool.sort(() => Math.random() - 0.5);
            
            questionPool = [];
            for (let i = 0; i < TOTAL_QUESTIONS; i++) {
                let item = shuffledPool[i % shuffledPool.length];
                questionPool.push({
                    q: item.q,
                    correct: item.correct,
                    options: shuffleArray([item.correct, ...item.generator()])
                });
            }

            currentQuestionIndex = 0;
            score = 0;
            document.getElementById('score').innerText = score;
            
            // Switch view to question layout
            document.getElementById('quiz-body').innerHTML = `
                <div class="question-box" id="question-text"></div>
                <div class="options-grid" id="options-container"></div>
            `;

            loadNextQuestion();
        }

        function startDailyChallenge() {
            isDailyMode = true;
            const todayStr = new Date().toISOString().slice(0, 10);
            const storageKey = `daily_completed_${todayStr}`;

            if (localStorage.getItem(storageKey) === 'true') {
                document.getElementById('quiz-body').innerHTML = `
                    <div style="text-align: center; padding: 30px;">
                        <h3>🌟 Bạn đã hoàn thành Thử Thách Hàng Ngày hôm nay rồi!</h3>
                        <p style="color: #94a3b8; margin-top: 10px;">Hãy quay lại vào ngày mai để tiếp tục thử thách mới nhé.</p>
                        <a href="./quiz.html" class="start-btn" style="display: inline-block; margin-top: 20px; text-decoration: none;">Chế độ luyện tập thường</a>
                    </div>
                `;
                return;
            }

            TOTAL_QUESTIONS = 10;
            document.getElementById('total-q-label').innerText = TOTAL_QUESTIONS;
            document.getElementById('quiz-header').style.display = 'flex';

            let basePool = generateBasePool();
            let seed = todayStr.split('-').reduce((acc, val) => acc + parseInt(val), 0);
            let pseudoRandom = () => {
                seed = (seed * 9301 + 49297) % 233280;
                return seed / 233280;
            };

            basePool.sort(() => pseudoRandom() - 0.5);

            questionPool = [];
            for (let i = 0; i < TOTAL_QUESTIONS; i++) {
                let item = basePool[i % basePool.length];
                questionPool.push({
                    q: `[Thử Thách Ngày ${todayStr}] ${item.q}`,
                    correct: item.correct,
                    options: shuffleArray([item.correct, ...item.generator()])
                });
            }

            document.getElementById('quiz-body').innerHTML = `
                <div class="question-box" id="question-text"></div>
                <div class="options-grid" id="options-container"></div>
            `;

            loadNextQuestion();
        }

        function getRandomWrongOptions(correctVal, allPossibleValues) {
            let filtered = allPossibleValues.filter(val => val !== correctVal && val);
            let shuffled = filtered.sort(() => Math.random() - 0.5);
            return shuffled.slice(0, 3);
        }

        function shuffleArray(array) {
            return array.sort(() => Math.random() - 0.5);
        }

        function loadNextQuestion() {
            if (currentQuestionIndex >= TOTAL_QUESTIONS) {
                if (isDailyMode) {
                    const todayStr = new Date().toISOString().slice(0, 10);
                    localStorage.setItem(`daily_completed_${todayStr}`, 'true');
                }

                document.getElementById('quiz-body').innerHTML = `
                    <div style="text-align: center; padding: 40px;">
                        <h2>🎉 Hoàn thành thử thách!</h2>
                        <p style="font-size: 18px; margin-top: 15px;">Điểm số của bạn: <strong>${score} / ${TOTAL_QUESTIONS}</strong></p>
                        <a href="./quiz.html" class="start-btn" style="display: inline-block; margin-top: 20px; text-decoration: none;">Làm lại / Chọn số câu khác</a>
                    </div>
                `;
                document.getElementById('next-btn').style.display = 'none';
                return;
            }

            const currentQ = questionPool[currentQuestionIndex];
            document.getElementById('current-q').innerText = currentQuestionIndex + 1;
            document.getElementById('question-text').innerHTML = currentQ.q;
            
            const optionsContainer = document.getElementById('options-container');
            optionsContainer.innerHTML = '';
            
            currentQ.options.forEach(option => {
                const btn = document.createElement('button');
                btn.className = 'option-btn';
                btn.innerText = option;
                btn.onclick = () => selectAnswer(btn, option, currentQ.correct);
                optionsContainer.appendChild(btn);
            });

            document.getElementById('next-btn').style.display = 'none';
        }

        function selectAnswer(selectedBtn, chosen, correct) {
            const allButtons = document.querySelectorAll('.option-btn');
            allButtons.forEach(btn => btn.disabled = true);

            if (chosen === correct) {
                selectedBtn.classList.add('correct');
                score++;
                document.getElementById('score').innerText = score;
            } else {
                selectedBtn.classList.add('wrong');
                allButtons.forEach(btn => {
                    if (btn.innerText === correct) {
                        btn.classList.add('correct');
                    }
                });
            }

            currentQuestionIndex++;
            document.getElementById('next-btn').style.display = 'block';
        }