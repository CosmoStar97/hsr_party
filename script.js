document.addEventListener('DOMContentLoaded', () => {
    // DOM Element References
    const characterGrid = document.getElementById('characterGrid');
    const randomizeButton = document.getElementById('randomizeButton'); // Draw 4 button
    const randomizeOneButton = document.getElementById('randomizeOneButton'); // Draw 1 button
    const drawnTeamContainer = document.getElementById('drawnTeamContainer');
    const fourStarWeightInput = document.getElementById('fourStarWeight'); // fiveStarWeight -> fourStarWeight
    const updateWeightButton = document.getElementById('updateWeightButton');
    const toggleAllSelectionButton = document.getElementById('toggleAllSelectionButton'); // Toggle all selected/deselected button
    const resetDrawPoolButton = document.getElementById('resetDrawPoolButton'); // 새로 추가된 뽑기 풀 초기화 버튼

    const pathFilterButtons = document.getElementById('pathFilterButtons');
    const elementFilterButtons = document.getElementById('elementFilterButtons');
    const rarityFilterButtons = document.getElementById('rarityFilterButtons');

    // ===== 번호 뽑기 관련 요소 추가 =====
    const drawNumberButton = document.getElementById('drawNumberButton');
    const rerollToggle = document.getElementById('rerollToggle');
    const noneToggle = document.getElementById('noneToggle');
    const numberDrawResult = document.getElementById('numberDrawResult');
    const resetNumberDrawResultButton = document.getElementById('resetNumberDrawResultButton');
    // ===================================

    // Global State Variables
    let allCharacters = []; // All character data
    let selectedCharacters = new Set(); // Currently selected character names (using Set for unique names)
    let fourStarWeight = 1.0; // Probability multiplier for 4-star characters (fiveStarWeight -> fourStarWeight)
    let drawnCharacters = []; // 1명씩 뽑을 때 현재 뽑힌 캐릭터들을 저장

    let drawnNumbers = []; // 번호 뽑기에서 뽑힌 숫자들을 저장할 배열

    // Current active filter states (using Sets for multiple selection)
    let activePathFilters = new Set();
    let activeElementFilters = new Set();
    let activeRarityFilters = new Set();

    // Function to fetch characters from JSON
    const fetchCharacters = async () => {
        try {
            const response = await fetch('characters.json');
            allCharacters = await response.json();
            console.log('Characters loaded:', allCharacters);
            // 초기 로드 시 '모두' 필터를 활성화
            activePathFilters.add('all');
            activeElementFilters.add('all');
            activeRarityFilters.add('all');
            renderCharacterSelection();
            resetDrawPool();
        } catch (error) {
            console.error('Error fetching characters:', error);
        }
    };

    // Function to create rarity stars HTML
    const createRarityStars = (rarity) => {
        let starsHtml = '';
        for (let i = 0; i < rarity; i++) {
            starsHtml += `<img src="images/elements/level_star.webp" alt="${rarity}성" class="rarity-icon">`;
        }
        return `<div class="rarity-icons-container">${starsHtml}</div>`;
    };

    // Function to render character selection grid based on filters
    const renderCharacterSelection = () => {
        characterGrid.innerHTML = ''; // Clear current grid

        const filteredCharacters = allCharacters.filter(char => {
            // 경로 필터 적용
            const passesPathFilter = activePathFilters.has('all') || activePathFilters.has(char.path);
            // 원소 필터 적용
            const passesElementFilter = activeElementFilters.has('all') || activeElementFilters.has(char.element);
            // 등급 필터 적용
            const passesRarityFilter = activeRarityFilters.has('all') || activeRarityFilters.has(String(char.rarity));

            return passesPathFilter && passesElementFilter && passesRarityFilter;
        });

        if (filteredCharacters.length === 0) {
            characterGrid.innerHTML = '<p style="color: #a0a0a0; text-align: center; width: 100%;">선택된 필터에 해당하는 캐릭터가 없습니다.</p>';
            return;
        }

        filteredCharacters.forEach(char => {
            const card = document.createElement('div');
            card.classList.add('character-card');
            // 필터링 상태를 유지한 채 선택 상태만 해제하려면, 여기서 selectedCharacters.has(char.name)만 확인
            if (selectedCharacters.has(char.name)) {
                if (char.rarity === 5) {
                    card.classList.add('selected-5star');
                } else if (char.rarity === 4) {
                    card.classList.add('selected-4star');
                }
            }
            card.dataset.name = char.name;
            card.dataset.rarity = char.rarity;
            card.dataset.element = char.element;
            card.dataset.path = char.path;

            card.innerHTML = `
                <img src="images/characters/${char.name}.webp" alt="${char.name}">
                <p>${char.name}</p>
                ${createRarityStars(char.rarity)} `;

            card.addEventListener('click', () => toggleCharacterSelection(char.name, char.rarity, card));
            characterGrid.appendChild(card);
        });
    };

    // Function to toggle character selection
    const toggleCharacterSelection = (characterName, characterRarity, cardElement) => {
        if (selectedCharacters.has(characterName)) {
            selectedCharacters.delete(characterName);
            cardElement.classList.remove('selected-4star', 'selected-5star');
        } else {
            selectedCharacters.add(characterName);
            if (characterRarity === 5) {
                cardElement.classList.add('selected-5star');
            } else if (characterRarity === 4) {
                cardElement.classList.add('selected-4star');
            }
        }
        resetDrawPool(); // 선택된 캐릭터 변경 시 뽑기 풀 초기화 (drawnCharacters, drawnTeamContainer만)
    };

    // Function to create the draw pool from selected characters
    const resetDrawPool = () => {
        if (selectedCharacters.size === 0) {
            console.warn('뽑기 풀이 비어있습니다. 캐릭터를 선택해주세요.');
            randomizeButton.disabled = true;
            randomizeOneButton.disabled = true;
        } else {
            randomizeButton.disabled = false;
            // 1명씩 뽑기 버튼 활성화/비활성화는 drawnCharacters 상태에 따라 결정되므로 여기서 설정하지 않음.
            // 아래 displayDrawnTeam 함수에서 설정.
        }
        drawnCharacters = []; // 뽑기 풀 초기화 시 뽑힌 캐릭터 배열도 초기화
        displayDrawnTeam([]); // 뽑힌 팀 디스플레이 초기화
    };

    // Function to draw random characters (중복 방지 로직 추가됨)
    // count: 뽑을 캐릭터 수 (일반 뽑기), isSingleDraw: 1명씩 뽑기 여부
    const drawCharacter = (count = 1, isSingleDraw = false) => {
        const tempDrawPool = Array.from(selectedCharacters).map(name =>
            allCharacters.find(char => char.name === name)
        ).filter(Boolean); // 선택된 캐릭터만 가져옴

        if (tempDrawPool.length === 0) {
            drawnTeamContainer.innerHTML = '<p>선택된 캐릭터가 없습니다. 뽑을 캐릭터를 선택해주세요!</p>';
            randomizeButton.disabled = true;
            randomizeOneButton.disabled = true;
            return;
        }

        let currentDrawPool = [];
        // 4명 뽑기 시에는 현재 선택된 캐릭터 전체에서 시작
        // 1명 뽑기 시에는 기존 drawnCharacters를 제외한 풀에서 시작
        if (isSingleDraw) {
             tempDrawPool.forEach(char => {
                // 이미 뽑힌 캐릭터(drawnCharacters)는 현재 뽑기 풀에서 제외
                if (!drawnCharacters.some(dChar => dChar.name === char.name)) {
                    if (char.rarity === 4) { // 4성 캐릭터 확률 가중치 적용
                        for (let j = 0; j < fourStarWeight * 10; j++) { // fourStarWeight 적용
                            currentDrawPool.push(char);
                        }
                    } else { // 5성 캐릭터는 기본 가중치
                        for (let j = 0; j < 10; j++) {
                            currentDrawPool.push(char);
                        }
                    }
                }
            });
        } else { // 4명 뽑기
            tempDrawPool.forEach(char => {
                if (char.rarity === 4) { // 4성 캐릭터 확률 가중치 적용
                    for (let j = 0; j < fourStarWeight * 10; j++) { // fourStarWeight 적용
                        currentDrawPool.push(char);
                    }
                } else { // 5성 캐릭터는 기본 가중치
                    for (let j = 0; j < 10; j++) {
                        currentDrawPool.push(char);
                    }
                }
            });
        }


        if (currentDrawPool.length === 0 && !isSingleDraw) { // 4명 뽑기인데 뽑을 캐릭터가 없으면
            drawnTeamContainer.innerHTML = '<p>뽑을 수 있는 캐릭터가 없습니다 (가중치 설정 또는 중복 확인).</p>';
            randomizeButton.disabled = true;
            randomizeOneButton.disabled = true;
            return;
        } else if (currentDrawPool.length === 0 && isSingleDraw) { // 1명 뽑기인데 뽑을 캐릭터가 없으면
             // 4명 모두 뽑힌 경우
            randomizeOneButton.disabled = true;
            return; // 더 이상 뽑을 수 없으므로 함수 종료
        }


        // 1명씩 뽑기일 경우, 뽑을 개수는 1개로 고정
        const actualCount = isSingleDraw ? 1 : count;

        const newlyDrawn = []; // 현재 뽑기 세션에서 새로 뽑힌 캐릭터들을 저장할 임시 배열
        const currentSessionPioneers = new Set(); // 현재 뽑기 세션에서 뽑힌 개척자들을 추적 (4명 뽑기 시 초기화, 1명 뽑기 시 누적)

        // 이미 뽑힌 캐릭터(drawnCharacters)에 개척자가 있는지 확인 (1명 뽑기 시 초기 상태 로드)
        if (isSingleDraw) {
            drawnCharacters.forEach(dChar => {
                if (dChar.name.includes('개척자')) {
                    currentSessionPioneers.add(dChar.name);
                }
            });
        }

        for (let i = 0; i < actualCount; i++) {
            if (currentDrawPool.length === 0) {
                console.warn('뽑을 수 있는 유니크한 캐릭터가 더 이상 없습니다.');
                break;
            }

            let characterToDraw = null;
            let attemptCount = 0;
            const maxAttempts = currentDrawPool.length * 2; // 무한 루프 방지

            while (characterToDraw === null && attemptCount < maxAttempts) {
                const randomIndex = Math.floor(Math.random() * currentDrawPool.length);
                const potentialChar = currentDrawPool[randomIndex];

                const isPioneer = potentialChar.name.includes('개척자');

                // 현재 뽑기 세션 내에서 이미 뽑힌 캐릭터(newlyDrawn)와 중복되는지 확인
                let isDuplicateInNewlyDrawn = newlyDrawn.some(nChar => nChar.name === potentialChar.name);
                let isPioneerConflictInSession = false;

                // 현재 뽑기 세션(newlyDrawn 또는 이전에 뽑힌 개척자)에 이미 개척자가 있고, 새로 뽑으려는 것이 개척자일 경우
                if (isPioneer && currentSessionPioneers.size > 0) {
                    isPioneerConflictInSession = true;
                }

                if (!isDuplicateInNewlyDrawn && !isPioneerConflictInSession) { // 중복 및 개척자 충돌 방지
                    characterToDraw = potentialChar;
                    newlyDrawn.push(characterToDraw);
                    // 개척자라면 현재 세션 개척자 Set에 추가
                    if (isPioneer) {
                        currentSessionPioneers.add(characterToDraw.name);
                    }

                    // 뽑힌 캐릭터는 다음 뽑기에서 제외하기 위해 currentDrawPool에서 제거 (모든 인스턴스 제거)
                    currentDrawPool = currentDrawPool.filter(char => char.name !== characterToDraw.name);
                }
                attemptCount++;
            }

            if (characterToDraw === null) {
                console.warn('충분한 유니크한 캐릭터를 뽑을 수 없습니다. 선택된 캐릭터와 뽑기 횟수를 확인하세요.');
                break;
            }
        }

        if (isSingleDraw) {
            // 1명씩 뽑기일 경우 기존 캐릭터에 새로 뽑힌 캐릭터 추가
            drawnCharacters = [...drawnCharacters, ...newlyDrawn];
        } else {
            // 4명 뽑기일 경우 drawnCharacters를 새로 뽑힌 캐릭터로 초기화
            drawnCharacters = newlyDrawn;
        }

        displayDrawnTeam(drawnCharacters);

        // 1명씩 뽑기 후, 팀이 4명이 되면 버튼 비활성화
        if (isSingleDraw && drawnCharacters.length >= 4) {
            randomizeOneButton.disabled = true;
        } else if (isSingleDraw && drawnCharacters.length < 4) {
            randomizeOneButton.disabled = false; // 4명 미만이면 계속 활성화
        }
    };

    // Function to display the drawn team
    const displayDrawnTeam = (team) => {
        if (team.length === 0) {
            drawnTeamContainer.innerHTML = '<p>팀을 뽑아보세요!</p>';
            randomizeOneButton.disabled = false; // 팀이 비어있으면 1명 뽑기 가능
            randomizeButton.disabled = false; // 4명 뽑기도 가능
            return;
        }
        drawnTeamContainer.innerHTML = '';
        team.forEach(char => {
            const teamCard = document.createElement('div');
            teamCard.classList.add('team-card');
            teamCard.innerHTML = `
                <img src="images/characters/${char.name}.webp" alt="${char.name}">
                <p>${char.name}</p>
                ${createRarityStars(char.rarity)} `;
            drawnTeamContainer.appendChild(teamCard);
        });

        // 4명 뽑기가 완료되었거나 1명씩 뽑기로 4명이 되면, 1명 뽑기 버튼 비활성화
        if (team.length >= 4) {
            randomizeOneButton.disabled = true;
        } else {
            randomizeOneButton.disabled = false;
        }
    };

    // Event Listeners
    randomizeButton.addEventListener('click', () => {
        drawnCharacters = []; // 4명 뽑기 시 기존 팀 초기화
        drawCharacter(4, false);
    });

    randomizeOneButton.addEventListener('click', () => {
        if (drawnCharacters.length < 4) {
            drawCharacter(1, true); // 1명씩 뽑기 호출, isSingleDraw를 true로 전달
        } else {
            console.warn('이미 4명의 캐릭터가 뽑혔습니다.');
            randomizeOneButton.disabled = true; // 만약을 위해 다시 비활성화
        }
    });


    updateWeightButton.addEventListener('click', () => {
        const newWeight = parseFloat(fourStarWeightInput.value); // fiveStarWeightInput -> fourStarWeightInput
        if (!isNaN(newWeight) && newWeight >= 0) {
            fourStarWeight = newWeight; // fiveStarWeight -> fourStarWeight
            console.log('4성 캐릭터 확률 가중치 업데이트:', fourStarWeight); // 메시지 변경
        } else {
            alert('유효한 숫자를 입력해주세요.');
            fourStarWeightInput.value = fourStarWeight; // fiveStarWeight -> fourStarWeight
        }
    });

    toggleAllSelectionButton.addEventListener('click', () => {
        const filteredCharacters = allCharacters.filter(char => {
            const passesPathFilter = activePathFilters.has('all') || activePathFilters.has(char.path);
            const passesElementFilter = activeElementFilters.has('all') || activeElementFilters.has(char.element);
            const passesRarityFilter = activeRarityFilters.has('all') || activeRarityFilters.has(String(char.rarity));
            return passesPathFilter && passesElementFilter && passesRarityFilter;
        });

        const areAllFilteredSelected = filteredCharacters.every(char => selectedCharacters.has(char.name));

        if (areAllFilteredSelected && filteredCharacters.length > 0) {
            filteredCharacters.forEach(char => {
                selectedCharacters.delete(char.name);
                const cardElement = characterGrid.querySelector(`[data-name="${char.name}"]`);
                if (cardElement) {
                    cardElement.classList.remove('selected-4star', 'selected-5star');
                }
            });
        } else {
            selectedCharacters = new Set(filteredCharacters.map(char => char.name));
        }
        renderCharacterSelection();
        resetDrawPool(); // 선택 변경 시 뽑기 풀과 뽑힌 캐릭터 초기화
    });

    // ===== 이 부분을 다시 수정합니다. =====
    resetDrawPoolButton.addEventListener('click', () => {
        // selectedCharacters.clear(); // <-- 이 줄을 제거하여 선택된 캐릭터를 유지합니다.
        renderCharacterSelection(); // 현재 필터 상태와 선택 상태를 유지한 채로 UI 업데이트
        resetDrawPool(); // 뽑기 풀과 뽑힌 팀 결과 초기화 (selectedCharacters에 기반)
        drawnTeamContainer.innerHTML = '<p>팀을 뽑아보세요!</p>'; // 확실히 메시지 보이도록
    });
    // ===========================================

    // ===== 번호 뽑기 함수 및 이벤트 리스너 수정 =====
    // 뽑힌 번호를 화면에 표시하는 함수
    const displayDrawnNumbers = (numbers) => {
        if (numbers.length === 0) {
            numberDrawResult.innerHTML = '<p>버튼을 눌러 번호를 뽑아보세요.</p>';
        } else {
            numberDrawResult.innerHTML = `<p>${numbers.join(', ')}</p>`;
        }
        // 뽑힌 번호가 4개면 뽑기 버튼 비활성화, 아니면 활성화
        if (numbers.length >= 4) {
            drawNumberButton.disabled = true;
        } else {
            drawNumberButton.disabled = false;
        }
    };


    if (drawNumberButton) {
        drawNumberButton.addEventListener('click', () => {
            // 이미 4개의 번호가 뽑혔으면 더 이상 뽑지 않음
            if (drawnNumbers.length >= 4) {
                console.warn('이미 4개의 번호가 뽑혔습니다. 초기화하세요.');
                drawNumberButton.disabled = true; // 만약을 위해 비활성화
                return;
            }

            let pool = ['1', '2', '3', '4'];
            if (rerollToggle.checked) {
                pool.push('reroll');
            }
            if (noneToggle.checked) {
                pool.push('none');
            }

            // 현재 뽑힌 번호를 제외한 새로운 풀 생성
            let availablePool = pool.filter(item => !drawnNumbers.includes(item));

            if (availablePool.length === 0) {
                numberDrawResult.innerHTML = '<p style="color: red;">더 이상 뽑을 수 있는 번호가 없습니다!</p>';
                drawNumberButton.disabled = true;
                return;
            }

            const numberOfDraws = 1; // 1로 고정

            // 중복되지 않는 뽑기를 위해 사용 가능한 풀을 섞습니다.
            for (let i = availablePool.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [availablePool[i], availablePool[j]] = [availablePool[j], availablePool[i]];
            }

            const newDraws = []; // 새로 뽑은 번호를 저장할 배열
            for (let i = 0; i < numberOfDraws; i++) { // numberOfDraws가 항상 1이므로 1번만 실행
                newDraws.push(availablePool[i]);
            }


            // 뽑힌 번호 배열에 추가
            drawnNumbers.push(...newDraws); // spread operator로 배열 추가

            // 화면 업데이트
            displayDrawnNumbers(drawnNumbers);
        });
    }

    if (resetNumberDrawResultButton) {
        resetNumberDrawResultButton.addEventListener('click', () => {
            drawnNumbers = []; // 뽑힌 번호 배열 초기화
            displayDrawnNumbers(drawnNumbers); // 화면 초기화
            drawNumberButton.disabled = false; // 뽑기 버튼 다시 활성화
        });
    }
    // ===========================================

    // Helper function to setup filter buttons
    const setupFilterButtons = (containerId, filterType, allButtonDataValue) => {
        const container = document.getElementById(containerId);
        const allButton = container.querySelector(`[data-${filterType}="${allButtonDataValue}"]`);
        let activeFiltersSet;

        if (filterType === 'path') {
            activeFiltersSet = activePathFilters;
        } else if (filterType === 'element') {
            activeFiltersSet = activeElementFilters;
        } else if (filterType === 'rarity') {
            activeFiltersSet = activeRarityFilters;
        }

        container.addEventListener('click', (event) => {
            const button = event.target.closest('button');
            if (!button) return;

            const filterValue = button.dataset[filterType];

            if (filterValue === allButtonDataValue) {
                activeFiltersSet.clear();
                activeFiltersSet.add(allButtonDataValue);
                container.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
            } else {
                if (activeFiltersSet.has(allButtonDataValue)) {
                    activeFiltersSet.delete(allButtonDataValue);
                    if (allButton) {
                        allButton.classList.remove('active');
                    }
                }

                if (activeFiltersSet.has(filterValue)) {
                    activeFiltersSet.delete(filterValue);
                    button.classList.remove('active');
                } else {
                    activeFiltersSet.add(filterValue);
                    button.classList.add('active');
                }

                if (activeFiltersSet.size === 0) {
                    if (allButton) {
                        allButton.classList.add('active');
                        activeFiltersSet.add(allButtonDataValue);
                    }
                }
            }
            renderCharacterSelection();
            resetDrawPool();
        });
    }

    // Filter button setup calls
    if (!pathFilterButtons.querySelector('[data-path="all"]')) {
        pathFilterButtons.innerHTML += '<button data-path="all" class="active"><span>모두</span></button>';
    }
    setupFilterButtons('pathFilterButtons', 'path', 'all');

    if (!elementFilterButtons.querySelector('[data-element="all"]')) {
        elementFilterButtons.innerHTML += '<button data-element="all" class="active"><span>모두</span></button>';
    }
    setupFilterButtons('elementFilterButtons', 'element', 'all');

    setupFilterButtons('rarityFilterButtons', 'rarity', 'all');

    // Initial load
    fetchCharacters();
    // 페이지 로드 시 번호 뽑기 결과도 초기 상태로 표시
    displayDrawnNumbers(drawnNumbers);
});
