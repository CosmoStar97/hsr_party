document.addEventListener('DOMContentLoaded', () => {
    // DOM Element References
    const characterGrid = document.getElementById('characterGrid');
    const randomizeButton = document.getElementById('randomizeButton'); // Draw 4 button
    const randomizeOneButton = document.getElementById('randomizeOneButton'); // Draw 1 button
    const drawnTeamContainer = document.getElementById('drawnTeamContainer');
    const fiveStarWeightInput = document.getElementById('fiveStarWeight');
    const updateWeightButton = document.getElementById('updateWeightButton');
    const toggleAllSelectionButton = document.getElementById('toggleAllSelectionButton'); // Toggle all selected/deselected button
    const resetDrawPoolButton = document.getElementById('resetDrawPoolButton'); // 뽑기 풀 초기화 버튼

    // 새로운 숫자 뽑기 관련 DOM 요소
    const drawNumberButton = document.getElementById('drawNumberButton');
    const drawnNumberDisplay = document.getElementById('drawnNumberDisplay');


    const pathFilterButtons = document.getElementById('pathFilterButtons');
    const elementFilterButtons = document.getElementById('elementFilterButtons');
    const rarityFilterButtons = document.getElementById('rarityFilterButtons');

    // Global State Variables
    let allCharacters = []; // All character data
    let selectedCharacters = new Set(); // Currently selected character names (using Set for unique names)
    let fiveStarWeight = 1.0; // Probability multiplier for 5-star characters

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
            resetDrawPool(); // 캐릭터 로드 후 초기화 호출
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
            const passesRarityFilter = activeRarityFilters.has('all') || activeRarityFilters.has(String(char.rarity)); // rarity는 숫자가 될 수 있으므로 String으로 변환

            return passesPathFilter && passesElementFilter && passesRarityFilter;
        });

        if (filteredCharacters.length === 0) {
            characterGrid.innerHTML = '<p style="color: #a0a0a0; text-align: center; width: 100%;">선택된 필터에 해당하는 캐릭터가 없습니다.</p>';
            return;
        }

        filteredCharacters.forEach(char => {
            const card = document.createElement('div');
            card.classList.add('character-card');
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
        resetDrawPool();
    };

    // Function to update draw button states (not for character count buttons anymore)
    const resetDrawPool = () => {
        const hasSelectedChars = selectedCharacters.size > 0;
        randomizeButton.disabled = !hasSelectedChars; // 4명 뽑기 버튼
        randomizeOneButton.disabled = !hasSelectedChars; // 1명 뽑기 버튼
        // 숫자 뽑기 버튼은 캐릭터 선택과 무관하므로 항상 활성화 (drawNumberButton.disabled = false;)
    };


    // Function to draw random characters (중복 방지 로직 추가됨)
    const drawCharacter = (count = 1) => {
        drawnTeamContainer.innerHTML = ''; // Clear previous team
        const tempDrawPool = Array.from(selectedCharacters).map(name =>
            allCharacters.find(char => char.name === name)
        ).filter(Boolean); // 선택된 캐릭터만 가져옴

        if (tempDrawPool.length === 0) {
            drawnTeamContainer.innerHTML = '<p>선택된 캐릭터가 없습니다. 뽑을 캐릭터를 선택해주세요!</p>';
            return;
        }

        const drawnTeam = [];
        const drawnNames = new Set(); // 이미 뽑힌 캐릭터 이름을 저장
        let hasPioneer = false; // "개척자" 계열 캐릭터가 뽑혔는지 여부

        // 가중치 적용 풀을 동적으로 생성하고, 뽑을 때마다 제거
        let currentDrawPool = [];
        tempDrawPool.forEach(char => {
            if (char.rarity === 5) {
                for (let j = 0; j < fiveStarWeight * 10; j++) {
                    currentDrawPool.push(char);
                }
            } else { // 4성 캐릭터
                for (let j = 0; j < 10; j++) { // 4성 캐릭터도 가중치 1.0처럼 10번 추가 (공정한 비교를 위해)
                    currentDrawPool.push(char);
                }
            }
        });

        if (currentDrawPool.length === 0) {
            drawnTeamContainer.innerHTML = '<p>뽑을 수 있는 캐릭터가 없습니다 (가중치 설정 확인).</p>';
            return;
        }

        // 유니크한 캐릭터 수 확인 (개척자 중복 제외)
        const uniqueSelectableCharacters = new Set();
        let pioneerFoundInSelection = false;
        tempDrawPool.forEach(char => {
            if (char.name.includes('개척자')) {
                if (!pioneerFoundInSelection) { // 첫 개척자만 세트에 추가
                    uniqueSelectableCharacters.add('AnyPioneer'); // 개척자를 하나로 묶어서 처리
                    pioneerFoundInSelection = true;
                }
            } else {
                uniqueSelectableCharacters.add(char.name);
            }
        });

        // 실제 뽑을 수 있는 유니크 캐릭터의 총 수
        const actualUniqueCount = uniqueSelectableCharacters.size;

        // 만약 선택된 유니크 캐릭터 수가 요청된 뽑기 횟수보다 적으면 경고
        if (actualUniqueCount < count) {
            console.warn(`선택된 유니크 캐릭터 수 (${actualUniqueCount}명)가 요청된 뽑기 횟수 (${count}명)보다 적습니다.`);
            if (actualUniqueCount === 0) {
                 drawnTeamContainer.innerHTML = '<p>뽑을 수 있는 유니크 캐릭터가 없습니다. 캐릭터를 더 선택하거나 뽑기 횟수를 줄여주세요.</p>';
                 return;
            }
             // 뽑을 수 있는 최대 유니크 캐릭터 수로 조정 (사용자 경험 개선)
            count = actualUniqueCount;
            drawnTeamContainer.innerHTML = `<p style="color: yellow;">경고: 선택된 유니크 캐릭터 부족! ${count}명만 뽑습니다.</p>`;
        }


        for (let i = 0; i < count; i++) {
            if (currentDrawPool.length === 0) {
                console.warn('뽑을 수 있는 캐릭터가 더 이상 없습니다.');
                break;
            }

            let characterToDraw = null;
            let attemptCount = 0;
            const maxAttempts = currentDrawPool.length * 2; // 무한 루프 방지 (풀 크기 x 2)

            while (characterToDraw === null && attemptCount < maxAttempts) {
                const randomIndex = Math.floor(Math.random() * currentDrawPool.length);
                const potentialChar = currentDrawPool[randomIndex];

                const isPotentialPioneer = potentialChar.name.includes('개척자');

                let isDuplicate = drawnNames.has(potentialChar.name); // 일반 캐릭터 이름 중복 확인
                let isPioneerConflict = false;

                // 이미 개척자가 뽑혔는데, 또 다른 개척자를 뽑으려는 경우
                if (isPotentialPioneer && hasPioneer) {
                    isPioneerConflict = true;
                }

                if (!isDuplicate && !isPioneerConflict) {
                    characterToDraw = potentialChar;
                    drawnTeam.push(characterToDraw);
                    drawnNames.add(characterToDraw.name);

                    if (isPotentialPioneer) { // 뽑힌 캐릭터가 개척자라면 플래그 설정
                        hasPioneer = true;
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
        displayDrawnTeam(drawnTeam);
    };

    // Function to display the drawn team
    const displayDrawnTeam = (team) => {
        if (team.length === 0) {
            drawnTeamContainer.innerHTML = '<p>팀을 뽑아보세요!</p>';
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
    };

    // Event Listeners
    randomizeButton.addEventListener('click', () => drawCharacter(4)); // 기존 4명 뽑기 버튼 유지
    randomizeOneButton.addEventListener('click', () => drawCharacter(1)); // 기존 1명 뽑기 버튼 유지

    // 숫자 뽑기 버튼 이벤트 리스너 수정
    drawNumberButton.addEventListener('click', () => {
        // 1, 2, 3, 4, "Reroll" 중 하나를 뽑기 위한 배열
        const options = ['1', '2', '3', '4', 'Reroll'];
        const randomIndex = Math.floor(Math.random() * options.length);
        const result = options[randomIndex];
        drawnNumberDisplay.textContent = result; // 결과 표시
    });


    updateWeightButton.addEventListener('click', () => {
        const newWeight = parseFloat(fiveStarWeightInput.value);
        if (!isNaN(newWeight) && newWeight >= 0) {
            fiveStarWeight = newWeight;
            console.log('5성 캐릭터 확률 가중치 업데이트:', fiveStarWeight);
        } else {
            alert('유효한 숫자를 입력해주세요.');
            fiveStarWeightInput.value = fiveStarWeight;
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
            selectedCharacters.clear();
            filteredCharacters.forEach(char => {
                selectedCharacters.add(char.name);
                const cardElement = characterGrid.querySelector(`[data-name="${char.name}"]`);
                if (cardElement) {
                    if (char.rarity === 5) {
                        cardElement.classList.add('selected-5star');
                    } else if (char.rarity === 4) {
                        cardElement.classList.add('selected-4star');
                    }
                }
            });
        }
        renderCharacterSelection();
        resetDrawPool();
    });

    resetDrawPoolButton.addEventListener('click', () => {
        selectedCharacters.clear();
        renderCharacterSelection();
        resetDrawPool();
        displayDrawnTeam([]);
        drawnTeamContainer.innerHTML = '<p>팀을 뽑아보세요!</p>';
        drawnNumberDisplay.textContent = '?'; // 뽑기 풀 초기화 시 숫자도 초기화
    });

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
});
