document.addEventListener('DOMContentLoaded', () => {
    // DOM Element References
    const characterGrid = document.getElementById('characterGrid');
    const randomizeButton = document.getElementById('randomizeButton'); // Draw 4 button
    const randomizeOneButton = document.getElementById('randomizeOneButton'); // Draw 1 button
    const drawnTeamContainer = document.getElementById('drawnTeamContainer');
    const fiveStarWeightInput = document.getElementById('fiveStarWeight');
    const updateWeightButton = document.getElementById('updateWeightButton');
    const toggleAllSelectionButton = document.getElementById('toggleAllSelectionButton'); // Toggle all selected/deselected button
    const resetDrawPoolButton = document.getElementById('resetDrawPoolButton'); // 새로 추가된 뽑기 풀 초기화 버튼

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
            // ⭐ 변경된 부분: 초기 렌더링 시 등급에 따른 클래스 추가 ⭐
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

            card.addEventListener('click', () => toggleCharacterSelection(char.name, char.rarity, card)); // rarity 인자 추가
            characterGrid.appendChild(card);
        });
    };

    // Function to toggle character selection
    const toggleCharacterSelection = (characterName, characterRarity, cardElement) => { // characterRarity 인자 추가
        if (selectedCharacters.has(characterName)) {
            selectedCharacters.delete(characterName);
            // ⭐ 변경된 부분: 기존의 등급별 클래스 제거 ⭐
            cardElement.classList.remove('selected-4star', 'selected-5star');
        } else {
            selectedCharacters.add(characterName);
            // ⭐ 변경된 부분: 등급에 따른 클래스 추가 ⭐
            if (characterRarity === 5) {
                cardElement.classList.add('selected-5star');
            } else if (characterRarity === 4) {
                cardElement.classList.add('selected-4star');
            }
        }
        resetDrawPool(); // 선택된 캐릭터 변경 시 뽑기 풀 초기화
    };

    // Function to create the draw pool from selected characters
    const resetDrawPool = () => {
        if (selectedCharacters.size === 0) {
            console.warn('뽑기 풀이 비어있습니다. 캐릭터를 선택해주세요.');
            // 뽑기 버튼 비활성화 또는 메시지 표시
            randomizeButton.disabled = true;
            randomizeOneButton.disabled = true;
        } else {
            randomizeButton.disabled = false;
            randomizeOneButton.disabled = false;
        }
    };

    // Function to draw 4 random characters
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
        for (let i = 0; i < count; i++) {
            let characterToDraw = null;
            let weightedPool = [];

            // 가중치 적용하여 뽑기 풀 생성
            tempDrawPool.forEach(char => {
                if (char.rarity === 5) {
                    for (let j = 0; j < fiveStarWeight * 10; j++) { // fiveStarWeight가 1.0이면 10번, 1.5면 15번 추가 (조절 가능)
                        weightedPool.push(char);
                    }
                } else {
                    weightedPool.push(char);
                }
            });

            if (weightedPool.length === 0) { // 가중치 풀이 비어있을 경우 (모든 5성 가중치 0 등)
                weightedPool = tempDrawPool; // 기본 풀로 대체
                if (weightedPool.length === 0) { // 기본 풀도 비어있으면 중단
                    console.warn('가중치 풀 및 기본 풀이 비어있습니다.');
                    break;
                }
            }

            const randomIndex = Math.floor(Math.random() * weightedPool.length);
            characterToDraw = weightedPool[randomIndex];

            if (characterToDraw) {
                drawnTeam.push(characterToDraw);
            }
        }
        displayDrawnTeam(drawnTeam);
    };

    // Function to display the drawn team
    const displayDrawnTeam = (team) => {
        if (team.length === 0) {
            drawnTeamContainer.innerHTML = '<p>아직 뽑힌 팀이 없습니다.</p>';
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
    randomizeButton.addEventListener('click', () => drawCharacter(4));
    randomizeOneButton.addEventListener('click', () => drawCharacter(1));

    updateWeightButton.addEventListener('click', () => {
        const newWeight = parseFloat(fiveStarWeightInput.value);
        if (!isNaN(newWeight) && newWeight >= 0) {
            fiveStarWeight = newWeight;
            console.log('5성 캐릭터 확률 가중치 업데이트:', fiveStarWeight);
            // 가중치 변경 시 뽑기 풀을 초기화할 필요는 없지만, 뽑기 로직에 적용될 것이므로 괜찮음.
        } else {
            alert('유효한 숫자를 입력해주세요.');
            fiveStarWeightInput.value = fiveStarWeight; // 유효하지 않으면 이전 값으로 되돌림
        }
    });

    toggleAllSelectionButton.addEventListener('click', () => {
        // 현재 필터링된 캐릭터 목록을 가져옵니다.
        const filteredCharacters = allCharacters.filter(char => {
            const passesPathFilter = activePathFilters.has('all') || activePathFilters.has(char.path);
            const passesElementFilter = activeElementFilters.has('all') || activeElementFilters.has(char.element);
            const passesRarityFilter = activeRarityFilters.has('all') || activeRarityFilters.has(String(char.rarity));
            return passesPathFilter && passesElementFilter && passesRarityFilter;
        });

        // 필터링된 캐릭터 수와 현재 선택된 캐릭터 수가 같으면 모두 해제, 그렇지 않으면 모두 선택
        const areAllFilteredSelected = filteredCharacters.every(char => selectedCharacters.has(char.name));

        if (areAllFilteredSelected && filteredCharacters.length > 0) {
            filteredCharacters.forEach(char => {
                selectedCharacters.delete(char.name);
                // 해당 카드 요소에서 등급별 클래스 제거 (필터링된 카드만 처리)
                const cardElement = characterGrid.querySelector(`[data-name="${char.name}"]`);
                if (cardElement) {
                    cardElement.classList.remove('selected-4star', 'selected-5star');
                }
            });
        } else {
            selectedCharacters.clear(); // 전체 선택 전에 기존 선택 초기화
            filteredCharacters.forEach(char => {
                selectedCharacters.add(char.name);
                // 해당 카드 요소에 등급별 클래스 추가 (필터링된 카드만 처리)
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
        // renderCharacterSelection(); // UI 업데이트 (이미 위에서 클래스를 직접 변경했으므로 필요 없을 수 있음)
        // 위에서 직접 클래스를 조작했으므로, 여기서는 굳이 다시 렌더링할 필요가 없음.
        // 하지만 혹시 모를 상황을 대비하여 전체 렌더링을 유지하거나,
        // 더 최적화된 방식으로 선택 상태만 업데이트하도록 변경할 수 있습니다.
        // 현재는 renderCharacterSelection()이 모든 카드를 다시 그리므로, 위에 클래스 변경 로직과 중복됩니다.
        // 따라서, toggleAllSelectionButton 클릭 시에는 renderCharacterSelection() 대신,
        // 단순히 DOM에서 모든 카드를 순회하며 selectedCharacters Set에 따라 클래스를 추가/제거하는 로직이 더 효율적입니다.
        // 여기서는 간단하게 renderCharacterSelection()을 호출하여 전체를 다시 그리도록 하겠습니다.
        renderCharacterSelection(); // 변경된 선택 상태를 반영하여 전체 그리드를 다시 그림
        resetDrawPool(); // 뽑기 풀 업데이트
    });

    resetDrawPoolButton.addEventListener('click', () => {
        selectedCharacters.clear(); // 선택된 모든 캐릭터 해제
        renderCharacterSelection(); // UI 업데이트 (선택 해제된 상태 반영)
        resetDrawPool(); // 뽑기 풀 비활성화
        displayDrawnTeam([]); // 뽑힌 팀 초기화
        drawnTeamContainer.innerHTML = '<p>팀을 뽑아보세요!</p>'; // 초기 메시지 표시
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
                // '모두' 버튼 클릭 시
                activeFiltersSet.clear();
                activeFiltersSet.add(allButtonDataValue);
                // 모든 필터 버튼의 active 클래스 제거
                container.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
                // '모두' 버튼만 active 클래스 추가
                button.classList.add('active');
            } else {
                // 다른 필터 버튼 클릭 시
                if (activeFiltersSet.has(allButtonDataValue)) {
                    activeFiltersSet.delete(allButtonDataValue); // '모두' 필터 해제
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

                // 특정 필터들이 모두 해제되어 Set이 비게 되면, '모두' 버튼을 다시 활성화
                if (activeFiltersSet.size === 0) {
                    if (allButton) {
                        allButton.classList.add('active');
                        activeFiltersSet.add(allButtonDataValue);
                    }
                }
            }
            renderCharacterSelection();
            resetDrawPool(); // 필터 변경 시 뽑기 풀 초기화
        });
    }

    // Path 필터 버튼 초기화 및 "모두" 버튼 동적 추가 (HTML에 없다면)
    if (!pathFilterButtons.querySelector('[data-path="all"]')) {
        pathFilterButtons.innerHTML += '<button data-path="all" class="active"><span>모두</span></button>';
    }
    setupFilterButtons('pathFilterButtons', 'path', 'all');

    // Element 필터 버튼 초기화 및 "모두" 버튼 동적 추가 (HTML에 없다면)
    if (!elementFilterButtons.querySelector('[data-element="all"]')) {
        elementFilterButtons.innerHTML += '<button data-element="all" class="active"><span>모두</span></button>';
    }
    setupFilterButtons('elementFilterButtons', 'element', 'all');

    // Rarity 필터 버튼 초기화 ('모두' 버튼은 HTML에 이미 있음)
    setupFilterButtons('rarityFilterButtons', 'rarity', 'all');

    // Initial load
    fetchCharacters();
});