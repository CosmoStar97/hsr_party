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
    const resetNumberDrawResultButton = document.getElementById('resetDrawResultButton'); // ID 수정: resetNumberDrawResultButton

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

    // 캐릭터 뽑기 함수 (단일 캐릭터)
    function drawCharacter() {
        if (selectedCharacters.size === 0) {
            alert('뽑을 수 있는 캐릭터가 없습니다. 캐릭터를 선택해주세요.');
            return null;
        }

        const selectableCharacters = characters.filter(char => selectedCharacters.has(char.name));

        // 가중치 적용하여 뽑을 캐릭터 풀 생성
        const weightedPool = [];
        selectableCharacters.forEach(char => {
            if (char.rarity === 5) {
                weightedPool.push(char); // 5성은 기본 가중치 1
            } else if (char.rarity === 4) {
                // 4성은 fourStarWeight 값만큼 반복 추가
                for (let i = 0; i < fourStarWeight; i++) {
                    weightedPool.push(char);
                }
            }
        });

        if (weightedPool.length === 0) {
            alert('가중치가 적용된 캐릭터 풀에 캐릭터가 없습니다. 4성 가중치를 확인하거나 다른 캐릭터를 선택해주세요.');
            return null;
        }

        const randomIndex = Math.floor(Math.random() * weightedPool.length);
        return weightedPool[randomIndex];
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

    // ===== 이벤트 리스너 =====

    // "캐릭터 4명 뽑기" 버튼
    randomizeButton.addEventListener('click', () => {
        drawnTeam = []; // 4명 뽑기 시 기존 팀 초기화
        for (let i = 0; i < 4; i++) {
            const char = drawCharacter();
            if (char) {
                drawnTeam.push(char);
            } else {
                drawnTeam = []; // 오류 발생 시 팀 초기화
                break;
            }
        }
        renderDrawnTeam();
    });

    // "캐릭터 1명 뽑기" 버튼
    randomizeOneButton.addEventListener('click', () => {
        const char = drawCharacter();
        if (char) {
            // drawnTeam에 추가하고, 4명을 초과하면 가장 오래된(첫 번째) 캐릭터 제거
            drawnTeam.push(char);
            if (drawnTeam.length > 4) {
                drawnTeam.shift(); // 배열의 첫 번째 요소 제거
            }
            renderDrawnTeam();
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

    // ===== 번호 뽑기 기능 =====
    if (drawNumberButton && numberDrawResult) {
        drawNumberButton.addEventListener('click', () => {
            let min = 1;
            let max = 99;
            let result;

            if (rerollToggle.checked) {
                // 리롤 ON: 1~90 (90%) 또는 91~99 (10%)
                const randomNumber = Math.random();
                if (randomNumber < 0.9) { // 90% 확률로 1~90
                    result = Math.floor(Math.random() * 90) + 1;
                } else { // 10% 확률로 91~99
                    result = Math.floor(Math.random() * 9) + 91;
                }
            } else if (noneToggle.checked) {
                // None ON: 1~75 (90%) 또는 76~99 (10%)
                const randomNumber = Math.random();
                if (randomNumber < 0.9) { // 90% 확률로 1~75
                    result = Math.floor(Math.random() * 75) + 1;
                } else { // 10% 확률로 76~99
                    result = Math.floor(Math.random() * 24) + 76;
                }
            } else {
                // 둘 다 OFF: 1~99
                result = Math.floor(Math.random() * (max - min + 1)) + min;
            }

            numberDrawResult.textContent = `뽑힌 번호: ${result}`;
        });
    }

    // 토글 버튼들이 동시에 활성화되지 않도록
    if (rerollToggle && noneToggle) {
        rerollToggle.addEventListener('change', () => {
            if (rerollToggle.checked) {
                noneToggle.checked = false;
            }
        });

        noneToggle.addEventListener('change', () => {
            if (noneToggle.checked) {
                rerollToggle.checked = false;
            }
        });
    }

    // 번호 뽑기 결과 초기화 버튼
    if (resetNumberDrawResultButton && numberDrawResult) {
        resetNumberDrawResultButton.addEventListener('click', () => {
            numberDrawResult.textContent = '번호를 뽑아보세요!';
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
});
