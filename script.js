const APP_VERSION = "1.0.2";

let teams = [];
let rounds = [];
let currentRound = 0;
let doubleRound = true;

// Função para carregar times padrão
function getDefaultTeams() {
    return [
        { name: "São Paulo", points: 0, wins: 0, draws: 0, losses: 0, gp: 0, gc: 0, sg: 0 },
        { name: "Palmeiras", points: 0, wins: 0, draws: 0, losses: 0, gp: 0, gc: 0, sg: 0 },
        { name: "Corinthians", points: 0, wins: 0, draws: 0, losses: 0, gp: 0, gc: 0, sg: 0 },
        { name: "Santos", points: 0, wins: 0, draws: 0, losses: 0, gp: 0, gc: 0, sg: 0 }
    ];
}

// Inicializa os times
function initializeTeams() {
    const savedTeams = localStorage.getItem('customTeams');
    const savedSettings = localStorage.getItem('tournamentSettings');
    
    if (savedSettings) {
        try {
            const settings = JSON.parse(savedSettings);
            doubleRound = settings.doubleRound !== undefined ? settings.doubleRound : true;
        } catch (e) {
            console.error("Erro ao carregar configurações:", e);
            doubleRound = true;
        }
    }

    if (savedTeams) {
        try {
            teams = JSON.parse(savedTeams);
        } catch (e) {
            console.error("Erro ao carregar times:", e);
            teams = getDefaultTeams();
        }
    } else {
        teams = getDefaultTeams();
        localStorage.setItem('customTeams', JSON.stringify(teams));
    }
    
    generateMatches();
    updateClassification();
    renderMatches();
    updateRoundInfo();
}

// Gera os jogos no sistema de turno/returno
function generateRoundRobinMatches(teams) {
    const numTeams = teams.length;
    const rounds = [];
    const teamList = teams.map(team => team.name);
    
    const isOdd = numTeams % 2 !== 0;
    if (isOdd) {
        teamList.push(null);
    }
    
    const half = Math.ceil(numTeams / 2);
    
    for (let i = 0; i < (isOdd ? numTeams : numTeams - 1); i++) {
        const round = [];
        for (let j = 0; j < half; j++) {
            const team1 = teamList[j];
            const team2 = teamList[teamList.length - 1 - j];
            
            if (team1 && team2) {
                const existingMatch = findExistingMatch(team1, team2);
                if (existingMatch) {
                    round.push(existingMatch);
                } else {
                    round.push({ team1, team2, score1: null, score2: null });
                }
            }
        }
        rounds.push(round);
        teamList.splice(1, 0, teamList.pop());
    }
    
    return rounds;
}

// Encontra jogos existentes
function findExistingMatch(team1, team2) {
    for (const round of rounds) {
        for (const match of round) {
            if ((match.team1 === team1 && match.team2 === team2) || 
                (match.team1 === team2 && match.team2 === team1)) {
                return match;
            }
        }
    }
    return null;
}

// Gera todos os jogos
function generateMatches() {
    rounds = generateRoundRobinMatches(teams);
    
    if (doubleRound) {
        const returnRounds = rounds.map(round => 
            round.map(match => ({
                team1: match.team2,
                team2: match.team1,
                score1: null,
                score2: null
            }))
        );
        rounds = rounds.concat(returnRounds);
    }
}

// Carrega dados salvos
function loadSavedData() {
    const savedData = localStorage.getItem('campeonatoData');
    const savedTeams = localStorage.getItem('customTeams');
    const savedSettings = localStorage.getItem('tournamentSettings');

    // Carrega times
    if (savedTeams) {
        try {
            teams = JSON.parse(savedTeams);
        } catch (e) {
            console.error("Erro ao carregar times:", e);
            teams = getDefaultTeams();
        }
    } else {
        teams = getDefaultTeams();
    }

    // Carrega configurações
    if (savedSettings) {
        try {
            const settings = JSON.parse(savedSettings);
            doubleRound = settings.doubleRound !== undefined ? settings.doubleRound : true;
        } catch (e) {
            console.error("Erro ao carregar configurações:", e);
            doubleRound = true;
        }
    }

    // Carrega rodadas
    if (savedData) {
        try {
            const { savedRounds, savedCurrentRound } = JSON.parse(savedData);
            if (savedRounds) rounds = savedRounds;
            if (savedCurrentRound !== undefined) currentRound = savedCurrentRound;
        } catch (e) {
            console.error("Erro ao carregar dados do campeonato:", e);
            generateMatches();
        }
    } else {
        generateMatches();
    }

    updateClassification();
    renderMatches();
    updateRoundInfo();
}

// Salva todos os dados
function saveData() {
    const dataToSave = {
        savedRounds: rounds,
        savedCurrentRound: currentRound,
        savedTeams: teams
    };
    
    try {
        localStorage.setItem('campeonatoData', JSON.stringify(dataToSave));
        console.log("Dados salvos com sucesso:", dataToSave);
    } catch (e) {
        console.error("Erro ao salvar dados:", e);
    }
}

// Zera todos os resultados (FUNÇÃO CORRIGIDA)
function resetAllMatches() {
    if (confirm('Tem certeza que deseja zerar TODOS os resultados do campeonato?\nEsta ação não pode ser desfeita.')) {
        // 1. Reseta estatísticas dos times
        teams = teams.map(team => ({
            name: team.name,
            points: 0,
            wins: 0,
            draws: 0,
            losses: 0,
            gp: 0,
            gc: 0,
            sg: 0
        }));
        
        // 2. Reseta todos os placares
        rounds = rounds.map(round => 
            round.map(match => ({
                team1: match.team1,
                team2: match.team2,
                score1: null,
                score2: null
            }))
        );
        
        // 3. Atualiza a exibição
        currentRound = 0;
        renderMatches();
        updateClassification();
        updateRoundInfo();
        
        // 4. Salva os dados resetados
        saveData();
        
        alert('Todos os resultados foram resetados com sucesso!');
    }
}

// Atualiza a classificação
function updateClassification() {
    // Reseta estatísticas
    teams.forEach(team => {
        team.points = 0;
        team.wins = 0;
        team.draws = 0;
        team.losses = 0;
        team.gp = 0;
        team.gc = 0;
        team.sg = 0;
    });

    // Calcula estatísticas dos jogos
    rounds.flat().forEach(match => {
        if (match.score1 !== null && match.score2 !== null) {
            const team1 = teams.find(team => team.name === match.team1);
            const team2 = teams.find(team => team.name === match.team2);

            if (team1 && team2) {
                team1.gp += match.score1;
                team1.gc += match.score2;
                team2.gp += match.score2;
                team2.gc += match.score1;
                team1.sg = team1.gp - team1.gc;
                team2.sg = team2.gp - team2.gc;

                if (match.score1 > match.score2) {
                    team1.points += 3;
                    team1.wins += 1;
                    team2.losses += 1;
                } else if (match.score1 < match.score2) {
                    team2.points += 3;
                    team2.wins += 1;
                    team1.losses += 1;
                } else {
                    team1.points += 1;
                    team2.points += 1;
                    team1.draws += 1;
                    team2.draws += 1;
                }
            }
        }
    });

    // Ordena a classificação
    teams.sort((a, b) => b.points - a.points || b.wins - a.wins || b.sg - a.sg || b.gp - a.gp);
    
    renderClassification();
    saveData();
}

// Renderiza a tabela de classificação
function renderClassification() {
    const tbody = document.querySelector("#classification tbody");
    tbody.innerHTML = "";
    
    teams.forEach((team, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${index + 1}</td>
            <td class="team-name" title="${team.name}">${team.name}</td>
            <td>${team.points}</td>
            <td>${team.wins + team.draws + team.losses}</td>
            <td>${team.wins}</td>
            <td>${team.draws}</td>
            <td>${team.losses}</td>
            <td>${team.sg}</td>
        `;
        tbody.appendChild(row);
    });
}

// Renderiza os jogos da rodada atual
function renderMatches() {
    const tbody = document.querySelector("#matches tbody");
    tbody.innerHTML = "";
    
    if (!rounds[currentRound]) return;
    
    rounds[currentRound].forEach((match, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td class="team-name" title="${match.team1}">${match.team1}</td>
            <td class="match-score">
                <input type="number" id="score1-${index}" value="${match.score1 ?? ''}" min="0">
                <span>x</span>
                <input type="number" id="score2-${index}" value="${match.score2 ?? ''}" min="0">
            </td>
            <td class="team-name" title="${match.team2}">${match.team2}</td>
        `;
        tbody.appendChild(row);

        const handleInput = () => {
            const score1 = document.getElementById(`score1-${index}`).value;
            const score2 = document.getElementById(`score2-${index}`).value;
            
            rounds[currentRound][index].score1 = score1 ? parseInt(score1) : null;
            rounds[currentRound][index].score2 = score2 ? parseInt(score2) : null;
            
            if (score1 && score2) {
                updateClassification();
            }
        };

        document.getElementById(`score1-${index}`).addEventListener('input', handleInput);
        document.getElementById(`score2-${index}`).addEventListener('input', handleInput);
    });
    
    // Mostra time de folga se necessário
    if (teams.length % 2 !== 0) {
        const allTeams = new Set(teams.map(t => t.name));
        const playingTeams = new Set();
        
        rounds[currentRound].forEach(match => {
            playingTeams.add(match.team1);
            playingTeams.add(match.team2);
        });
        
        const byeTeam = [...allTeams].find(team => !playingTeams.has(team));
        
        if (byeTeam) {
            const byeRow = document.createElement("tr");
            byeRow.className = "bye-row";
            byeRow.innerHTML = `
                <td colspan="3" class="bye-info">
                    ${byeTeam} está de folga nesta rodada
                </td>
            `;
            tbody.appendChild(byeRow);
        }
    }
}

// Atualiza a exibição da rodada
function updateRoundInfo() {
    document.getElementById("round-info").textContent = `Rodada ${currentRound + 1} de ${rounds.length}`;
    saveData();
}

// Mostra a versão do app
function updateVersionDisplay() {
    const versionElement = document.getElementById('app-version');
    if (versionElement) {
        versionElement.textContent = `Versão ${APP_VERSION}`;
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    loadSavedData();
    updateVersionDisplay();
});

document.getElementById("prev-round").addEventListener("click", () => {
    if (currentRound > 0) {
        currentRound--;
        renderMatches();
        updateRoundInfo();
    }
});

document.getElementById("next-round").addEventListener("click", () => {
    if (currentRound < rounds.length - 1) {
        currentRound++;
        renderMatches();
        updateRoundInfo();
    }
});

document.getElementById('reset-all').addEventListener('click', resetAllMatches);

document.getElementById('team-generator').addEventListener('click', function() {
    window.open('team-generator.html', 'Gerador de Times', 'width=600,height=800');
});

window.addEventListener('message', function(event) {
    if (event.data.type === 'teamsUpdated') {
        localStorage.setItem('customTeams', JSON.stringify(event.data.teams));
        if (event.data.doubleRound !== undefined) {
            doubleRound = event.data.doubleRound;
            localStorage.setItem('tournamentSettings', JSON.stringify({ doubleRound }));
        }
        initializeTeams();
    }
});