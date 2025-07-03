document.addEventListener('DOMContentLoaded', () => {
    // DOM Element References
    const characterGrid = document.getElementById('characterGrid');
    const randomizeButton = document.getElementById('randomizeButton'); // Draw 4 button
    const randomizeOneButton = document.getElementById('randomizeOneButton'); // Draw 1 button
    const drawnTeamContainer = document.getElementById('drawnTeamContainer');
    const fourStarWeightInput = document.getElementById('fourStarWeight');
    const updateWeightButton = document.getElementById('updateWeightButton');
    const toggleAllSelectionButton = document.getElementById('toggleAllSelectionButton');
    const resetDrawPoolButton = document.getElementById('resetDrawPoolButton');

    const pathFilterButtons = document.getElementById('pathFilterButtons');
    const elementFilterButtons = document.getElementById('elementFilterButtons');
    const rarityFilterButtons = document.getElementById('rarityFilterButtons');

    // ===== 번호 뽑기 관련 요소 추가 =====
    const drawNumberButton = document.getElementById('drawNumberButton');
    const rerollToggle = document.getElementById('rerollToggle');
    const noneToggle = document.getElementById('noneToggle');
    const numberDrawResult = document.getElementById('numberDrawResult');
    const resetNumberDrawResultButton = document.getElementById('resetNumberDrawResultButton');

    let characters = []; // 전체 캐릭터 데이터
    let selectedCharacters = new Set(); // 사용자가 선택한 캐릭터 (뽑기 풀)
    let fourStarWeight = parseFloat(fourStarWeightInput.value); // 4성 가중치

    // 뽑힌 팀 캐릭터를 저장할 배열 (최대 4개)
    let drawnTeam = [];

    // 필터 상태를 저장할 객체
    const filters = {
        path: 'all',
        element: 'all',
        rarity: 'all'
    };

    // 데이터 로드
    async function loadCharacters() {
        try {
            const response = await fetch('characters.json');
            const data = await response.json();
            characters = data;
            console.log('Characters loaded:', characters); // 데이터 로드 확인
            initializeSelection(); // 로드 후 초기 선택
            renderCharacterSelection();
        } catch (error) {
            console.error('Error loading characters:', error);
        }
    }

    // 초기 선택 (모두 선택)
    function initializeSelection() {
        characters.forEach(char => selectedCharacters.add(char.name));
        updateToggleAllSelectionButton(); // 버튼 텍스트 업데이트
    }

    // 뽑기 풀 초기화 (선택된 캐릭터 해제)
    function resetDrawPool() {
        selectedCharacters.clear();
        characters.forEach(char => selectedCharacters.add(char.name)); // 모든 캐릭터 다시 선택
        renderCharacterSelection(); // UI 업데이트
        updateToggleAllSelectionButton();
        console.log("뽑기 풀 초기화됨. 모든 캐릭터가 다시 선택되었습니다.");
    }


    // 캐릭터 카드 렌더링
    function renderCharacterSelection() {
        characterGrid.innerHTML = ''; // 기존 내용 지우기

        const filteredCharacters = characters.filter(char => {
            const pathMatch = filters.path === 'all' || char.path === filters.path;
            const elementMatch = filters.element === 'all' || char.element === filters.element;
            const rarityMatch = filters.rarity === 'all' || String(char.rarity) === filters.rarity;
            return pathMatch && elementMatch && rarityMatch;
        });

        filteredCharacters.forEach(char => {
            const card = document.createElement('div');
            card.classList.add('character-card');
            card.dataset.name = char.name;
            card.dataset.rarity = char.rarity; // 레어도 데이터 속성 추가
            card.dataset.path = char.path; // 역할 데이터 속성 추가
            card.dataset.element = char.element; // 속성 데이터 속성 추가

            // 배경 이미지 설정
            const bgImage = char.rarity === 5 ? 'images/backgrounds/5star_bg.webp' : 'images/backgrounds/4star_bg.webp';
            card.style.backgroundImage = `url('${bgImage}')`;


            // 선택된 상태 클래스 추가
            if (selectedCharacters.has(char.name)) {
                if (char.rarity === 5) {
                    card.classList.add('selected-5star');
                } else if (char.rarity === 4) {
                    card.classList.add('selected-4star');
                }
            }

            const img = document.createElement('img');
            img.src = `images/characters/${char.name}.webp`;
            img.alt = char.name;
            img.onerror = () => {
                img.src = 'images/characters/default.webp'; // 대체 이미지
                img.alt = '이미지 없음';
            };


            const infoDiv = document.createElement('div');
            infoDiv.classList.add('card-info');

            const nameP = document.createElement('p');
            nameP.classList.add('character-name');
            nameP.textContent = char.name;

            // 레어도 별 이미지 추가
            const rarityIconsContainer = document.createElement('div');
            rarityIconsContainer.classList.add('rarity-icons-container');
            for (let i = 0; i < char.rarity; i++) {
                const star = document.createElement('img');
                star.src = 'images/elements/level_star.webp'; // 별 이미지 경로
                star.alt = 'star';
                star.classList.add('rarity-icon');
                rarityIconsContainer.appendChild(star);
            }

            infoDiv.appendChild(nameP);
            infoDiv.appendChild(rarityIconsContainer);
            card.appendChild(img);
            card.appendChild(infoDiv);


            card.addEventListener('click', () => toggleCharacterSelection(char.name, char.rarity));
            characterGrid.appendChild(card);
        });
    }

    // 캐릭터 선택/해제 토글
    function toggleCharacterSelection(characterName, rarity) {
        const card = characterGrid.querySelector(`[data-name="${characterName}"]`);
        if (selectedCharacters.has(characterName)) {
            selectedCharacters.delete(characterName);
            if (rarity === 5) {
                card.classList.remove('selected-5star');
            } else if (rarity === 4) {
                card.classList.remove('selected-4star');
            }
        } else {
            selectedCharacters.add(characterName);
            if (rarity === 5) {
                card.classList.add('selected-5star');
            } else if (rarity === 4) {
                card.classList.add('selected-4star');
            }
        }
        updateToggleAllSelectionButton();
        console.log('Selected characters:', Array.from(selectedCharacters));
    }

    // 전체 선택/해제 버튼 텍스트 업데이트
    function updateToggleAllSelectionButton() {
        const allFilteredCharacters = characters.filter(char => {
            const pathMatch = filters.path === 'all' || char.path === filters.path;
            const elementMatch = filters.element === 'all' || char.element === filters.element;
            const rarityMatch = filters.rarity === 'all' || String(char.rarity) === filters.rarity;
            return pathMatch && elementMatch && rarityMatch;
        });

        const allSelected = allFilteredCharacters.every(char => selectedCharacters.has(char.name));
        const toggleButton = document.getElementById('toggleAllSelectionButton');
        if (allFilteredCharacters.length === 0) {
            toggleButton.textContent = '선택할 캐릭터 없음';
            toggleButton.disabled = true;
        } else if (allSelected) {
            toggleButton.textContent = '현재 필터의 모든 캐릭터 선택 해제';
            toggleButton.disabled = false;
        } else {
            toggleButton.textContent = '현재 필터의 모든 캐릭터 선택';
            toggleButton.disabled = false;
        }
    }

    // 필터 버튼 설정 함수
    function setupFilterButtons(containerId, filterType, allValue) {
        const container = document.getElementById(containerId);
        container.addEventListener('click', (event) => {
            const clickedButton = event.target.closest('button');
            if (clickedButton) {
                // Remove active class from all buttons in this container
                Array.from(container.children).forEach(btn => btn.classList.remove('active'));
                // Add active class to the clicked button
                clickedButton.classList.add('active');

                const value = clickedButton.dataset[filterType];
                filters[filterType] = value;
                renderCharacterSelection(); // Re-render the grid with new filters
                updateToggleAllSelectionButton(); // Update toggle button state
                console.log(`Filter ${filterType} set to: ${value}`);
            }
        });
    }

    // New helper function to create a weighted pool from a given array of characters
    function getWeightedPool(charsToWeight) {
        const weightedPool = [];
        charsToWeight.forEach(char => {
            if (char.rarity === 5) {
                weightedPool.push(char); // 5성은 기본 가중치 1
            } else if (char.rarity === 4) {
                // 4성은 fourStarWeight 값만큼 반복 추가
                for (let i = 0; i < fourStarWeight; i++) {
                    weightedPool.push(char);
                }
            }
        });
        return weightedPool;
    }

    // Modified drawCharacter function to draw a unique character from a given pool
    // It returns the drawn character and the updated pool (without the drawn character)
    function drawCharacterFromPool(pool) {
        if (pool.length === 0) {
            return { char: null, remainingPool: [] };
        }

        const weightedPool = getWeightedPool(pool); // Get weighted pool from the *current* pool

        if (weightedPool.length === 0) {
            // This case indicates that even with weighting, there are no valid characters to draw.
            return { char: null, remainingPool: pool };
        }

        const randomIndexInWeightedPool = Math.floor(Math.random() * weightedPool.length);
        const drawnChar = weightedPool[randomIndexInWeightedPool];

        // Find the actual index of the drawn character in the original 'pool'
        let originalPoolIndex = pool.findIndex(c => c.name === drawnChar.name);

        // Create a new array without the drawn character
        const remainingPool = [...pool];
        if (originalPoolIndex !== -1) {
            remainingPool.splice(originalPoolIndex, 1);
        }

        return { char: drawnChar, remainingPool: remainingPool };
    }

    // 뽑힌 팀 렌더링
    function renderDrawnTeam() {
        drawnTeamContainer.innerHTML = ''; // 기존 팀 카드 모두 제거

        if (drawnTeam.length === 0) {
            const p = document.createElement('p');
            p.textContent = '팀을 뽑아보세요!';
            drawnTeamContainer.appendChild(p);
            return;
        }

        drawnTeam.forEach(char => {
            const card = document.createElement('div');
            card.classList.add('team-card');
            card.dataset.rarity = char.rarity; // 레어도 데이터 속성 추가

            // 배경 이미지 설정
            const bgImage = char.rarity === 5 ? 'images/backgrounds/5star_bg.webp' : 'images/backgrounds/4star_bg.webp';
            card.style.backgroundImage = `url('${bgImage}')`;

            const img = document.createElement('img');
            img.src = `images/characters/${char.name}.webp`;
            img.alt = char.name;
            img.onerror = () => {
                img.src = 'images/characters/default.webp'; // 대체 이미지
                img.alt = '이미지 없음';
            };

            const infoDiv = document.createElement('div');
            infoDiv.classList.add('card-info');

            const nameP = document.createElement('p');
            nameP.classList.add('character-name');
            nameP.textContent = char.name;

            // 레어도 별 이미지 추가
            const rarityIconsContainer = document.createElement('div');
            rarityIconsContainer.classList.add('rarity-icons-container');
            for (let i = 0; i < char.rarity; i++) {
                const star = document.createElement('img');
                star.src = 'images/elements/level_star.webp'; // 별 이미지 경로
                star.alt = 'star';
                star.classList.add('rarity-icon');
                rarityIconsContainer.appendChild(star);
            }

            infoDiv.appendChild(nameP);
            infoDiv.appendChild(rarityIconsContainer);
            card.appendChild(img);
            card.appendChild(infoDiv);

            drawnTeamContainer.appendChild(card);
        });
    }

    // Helper function to check if a character is a Trailblazer
    function isTrailblazer(char) {
        return char.name.startsWith('개척자');
    }

    // New helper function to check if a character is '삼칠이' or '검칠이'
    function isSevenOrBlackSeven(char) {
        // characters.json에 '검칠이'가 없으면 이 조건은 '삼칠이'에 대해서만 작동합니다.
        return char.name === '삼칠이' || char.name === '검칠이';
    }

    // ===== 이벤트 리스너 =====

    // "캐릭터 4명 뽑기" 버튼
    randomizeButton.addEventListener('click', () => {
        if (selectedCharacters.size === 0) {
            alert('뽑을 수 있는 캐릭터가 없습니다. 캐릭터를 선택해주세요.');
            return;
        }

        drawnTeam = []; // 4명 뽑기 시 기존 팀 초기화
        let availableCharactersForSession = characters.filter(char => selectedCharacters.has(char.name));

        for (let i = 0; i < 4; i++) {
            // Determine the pool for this specific draw
            let poolForThisDraw = [...availableCharactersForSession];

            // 개척자 중복 방지 로직
            const hasTrailblazerInDrawnTeam = drawnTeam.some(char => isTrailblazer(char));
            if (hasTrailblazerInDrawnTeam) {
                poolForThisDraw = poolForThisDraw.filter(char => !isTrailblazer(char));
            }

            // 삼칠이/검칠이 중복 방지 로직 추가
            const hasSevenOrBlackSevenInDrawnTeam = drawnTeam.some(char => isSevenOrBlackSeven(char));
            if (hasSevenOrBlackSevenInDrawnTeam) {
                poolForThisDraw = poolForThisDraw.filter(char => !isSevenOrBlackSeven(char));
            }


            const { char: drawnChar } = drawCharacterFromPool(poolForThisDraw);

            if (drawnChar) {
                drawnTeam.push(drawnChar);

                // Update the session's available characters:
                // 1. Remove the drawn character.
                availableCharactersForSession = availableCharactersForSession.filter(c => c.name !== drawnChar.name);

                // 2. If the drawn character is a Trailblazer, remove all other Trailblazer variants
                //    from the session's available characters to prevent drawing another one later.
                if (isTrailblazer(drawnChar)) {
                    availableCharactersForSession = availableCharactersForSession.filter(c => !isTrailblazer(c));
                }
                // 3. If the drawn character is 삼칠이 or 검칠이, remove all others from that group
                if (isSevenOrBlackSeven(drawnChar)) {
                    availableCharactersForSession = availableCharactersForSession.filter(c => !isSevenOrBlackSeven(c));
                }

            } else {
                alert('더 이상 뽑을 수 있는 캐릭터가 없습니다. 선택된 캐릭터 수를 확인해주세요.');
                break;
            }
        }
        renderDrawnTeam();
    });

    // "캐릭터 1명 뽑기" 버튼
    randomizeOneButton.addEventListener('click', () => {
        if (selectedCharacters.size === 0) {
            alert('뽑을 수 있는 캐릭터가 없습니다. 캐릭터를 선택해주세요.');
            return;
        }

        // Create a pool of characters that are selected AND not currently in drawnTeam
        let availableForOneDraw = characters.filter(char =>
            selectedCharacters.has(char.name) && !drawnTeam.some(dChar => dChar.name === char.name)
        );

        // 개척자 중복 방지 로직
        const hasTrailblazerInDrawnTeam = drawnTeam.some(char => isTrailblazer(char));
        if (hasTrailblazerInDrawnTeam) {
            availableForOneDraw = availableForOneDraw.filter(char => !isTrailblazer(char));
        }

        // 삼칠이/검칠이 중복 방지 로직 추가
        const hasSevenOrBlackSevenInDrawnTeam = drawnTeam.some(char => isSevenOrBlackSeven(char));
        if (hasSevenOrBlackSevenInDrawnTeam) {
            availableForOneDraw = availableForOneDraw.filter(char => !isSevenOrBlackSeven(char));
        }


        if (availableForOneDraw.length === 0) {
             alert('더 이상 뽑을 수 있는 캐릭터가 없습니다. 모든 선택된 캐릭터가 현재 팀에 포함되어 있거나, 다른 개척자/삼칠이/검칠이가 이미 팀에 있습니다.');
             return;
        }

        const { char: newChar } = drawCharacterFromPool(availableForOneDraw);
        if (newChar) {
            // Add the new character to the team
            drawnTeam.push(newChar);
            // If the team size exceeds 4, remove the oldest character
            if (drawnTeam.length > 4) {
                drawnTeam.shift();
            }
            renderDrawnTeam();
        } else {
            alert('캐릭터를 뽑지 못했습니다. 선택된 캐릭터와 팀 상태를 확인해주세요.');
        }
    });


    // "확률 업데이트" 버튼
    updateWeightButton.addEventListener('click', () => {
        const newWeight = parseFloat(fourStarWeightInput.value);
        if (!isNaN(newWeight) && newWeight >= 0) {
            fourStarWeight = newWeight;
            alert(`4성 캐릭터 가중치가 ${fourStarWeight}으로 업데이트되었습니다.`);
            console.log('4성 가중치:', fourStarWeight);
        } else {
            alert('유효한 숫자를 입력해주세요 (0 이상).');
            fourStarWeightInput.value = fourStarWeight; // 유효하지 않으면 이전 값으로 되돌림
        }
    });

    // "모든 캐릭터 선택/해제" 버튼
    toggleAllSelectionButton.addEventListener('click', () => {
        const allFilteredCharacters = characters.filter(char => {
            const pathMatch = filters.path === 'all' || char.path === filters.path;
            const elementMatch = filters.element === 'all' || char.element === filters.element;
            const rarityMatch = filters.rarity === 'all' || String(char.rarity) === filters.rarity;
            return pathMatch && elementMatch && rarityMatch;
        });

        const allSelected = allFilteredCharacters.every(char => selectedCharacters.has(char.name));

        if (allSelected) {
            // 모두 선택 해제
            allFilteredCharacters.forEach(char => selectedCharacters.delete(char.name));
        } else {
            // 모두 선택
            allFilteredCharacters.forEach(char => selectedCharacters.add(char.name));
        }
        renderCharacterSelection();
        updateToggleAllSelectionButton();
    });

    // "뽑기 풀 초기화" 버튼
    if (resetDrawPoolButton) { // 버튼이 존재하는지 확인
        resetDrawPoolButton.addEventListener('click', () => {
            resetDrawPool(); // 뽑기 풀 초기화 함수 호출
            drawnTeam = []; // 뽑힌 팀도 초기화
            renderDrawnTeam(); // 화면 갱신
            alert('뽑기 풀이 초기화되었습니다. 모든 캐릭터가 선택되었습니다.');
        });
    }

    // Filter button setup calls
    // '모두' 버튼이 없으면 추가
    if (!pathFilterButtons.querySelector('[data-path="all"]')) {
        pathFilterButtons.innerHTML += '<button data-path="all" class="active"><span>모두</span></button>';
    }
    setupFilterButtons('pathFilterButtons', 'path', 'all');

    if (!elementFilterButtons.querySelector('[data-element="all"]')) {
        elementFilterButtons.innerHTML += '<button data-element="all" class="active"><span>모두</span></button>';
    }
    setupFilterButtons('elementFilterButtons', 'element', 'all');

    setupFilterButtons('rarityFilterButtons', 'rarity', 'all');

    // Array to store the last 4 drawn numbers for the number draw feature
    let drawnNumbersHistory = [];
    const MAX_NUMBER_DRAW_HISTORY = 4; // Define maximum history size

    // Function to render the drawn number history
    function renderNumberDrawHistory() {
        if (drawnNumbersHistory.length === 0) {
            numberDrawResult.innerHTML = '<p>번호를 뽑아보세요!</p>';
        } else {
            // Clear existing content
            numberDrawResult.innerHTML = '';
            // Create a single <p> tag for the joined string
            const p = document.createElement('p');
            p.textContent = drawnNumbersHistory.join(', '); // 수정된 부분: 쉼표로 구분하여 표시
            numberDrawResult.appendChild(p);
        }
    }

    // ===== 번호 뽑기 기능 =====
    if (drawNumberButton && numberDrawResult) {
        drawNumberButton.addEventListener('click', () => {
            let resultValue;
            const isRerollChecked = rerollToggle.checked;
            const isNoneChecked = noneToggle.checked;

            // 기본적으로 1~4 사이의 숫자를 뽑는 함수
            const getRandomNumber = () => Math.floor(Math.random() * 4) + 1;

            if (isRerollChecked && isNoneChecked) {
                const rand = Math.random();
                if (rand < 0.3) {
                    resultValue = '모든팀 바꾸기';
                } else if (rand < 0.6) {
                    resultValue = '바꾸지 않기';
                } else {
                    resultValue = getRandomNumber();
                }
            } else if (isRerollChecked) {
                if (Math.random() < 0.5) {
                    resultValue = '모든팀 바꾸기';
                } else {
                    resultValue = getRandomNumber();
                }
            }
            else if (isNoneChecked) {
                if (Math.random() < 0.5) {
                    resultValue = '바꾸지 않기';
                } else {
                    resultValue = getRandomNumber();
                }
            } else {
                resultValue = getRandomNumber();
            }

            // Add the new result to history
            drawnNumbersHistory.push(resultValue);

            // Maintain maximum history size
            if (drawnNumbersHistory.length > MAX_NUMBER_DRAW_HISTORY) {
                drawnNumbersHistory.shift(); // Remove the oldest result
            }

            renderNumberDrawHistory(); // Render the updated history
        });
    }

    // 번호 뽑기 결과 초기화 버튼
    if (resetNumberDrawResultButton && numberDrawResult) {
        resetNumberDrawResultButton.addEventListener('click', () => {
            drawnNumbersHistory = []; // Clear the history
            renderNumberDrawHistory(); // Render the empty history
        });
    }


    // ===== 최상단 올리기 버튼 로직 추가 =====
    const scrollToTopBtn = document.getElementById('scrollToTopBtn');

    // When the user scrolls down 20px from the top of the document, show the button
    window.onscroll = function() {
        if (document.body.scrollTop > 20 || document.documentElement.scrollTop > 20) {
            scrollToTopBtn.style.display = "block";
        } else {
            scrollToTopBtn.style.display = "none";
        }
    };

    // When the user clicks on the button, scroll to the top of the document
    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth' // Smooth scroll
        });
    });
    // ===================================

    // 초기 로드
    loadCharacters();
    renderDrawnTeam(); // 초기에는 '팀을 뽑아보세요!' 메시지 표시
    renderNumberDrawHistory(); // 초기에는 '번호를 뽑아보세요!' 메시지 표시
});
