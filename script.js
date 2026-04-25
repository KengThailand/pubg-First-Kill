const BASE_IMAGE_URL = "http://localhost/Keng/assets/"; 
const LOGO_FOLDER = "team_logos/";
const EXTENSION = ".png"; 

// เปลี่ยนเป็น false เมื่อเริ่มใช้งานแข่งขันจริง
const TEST_MODE = false; 

// ==========================================
// 🔍 ระบบอ่าน Tournament ID จาก URL ลิงก์
// ==========================================
const urlParams = new URLSearchParams(window.location.search);
const currentTournamentId = urlParams.get('id') || "sea-ctf1"; // ถ้าไม่มีการใส่มา จะใช้ sea-ctf1 เป็นค่าเริ่มต้น

const API_URL = `https://domestic.atum.live/api/pubg/liveleaderboard?account_id=nattapon7799&series=${currentTournamentId}&tournament_id=${currentTournamentId}&mode=post&all_teams=true`;
console.log("Current Tournament ID:", currentTournamentId);

// ตัวแปรระบบ
let isFirstKillTriggered = false; 
let previousPlayersKills = {}; 
let currentMatchId = null; 

function triggerFirstKill(teamAbbr, playerName) {
    const wrapper = document.getElementById('first-kill-wrapper');
    const logoImg = document.getElementById('fk-team-logo');
    const nameText = document.getElementById('fk-player-name');

    nameText.innerText = playerName;
    logoImg.src = `${BASE_IMAGE_URL}${LOGO_FOLDER}${teamAbbr}${EXTENSION}`;

    // 2. ระบบ Auto-Resize ชื่อผู้เล่น
    let currentFontSize = 38;
    nameText.style.fontSize = currentFontSize + 'px';
    const MAX_TEXT_WIDTH = 380; 
    
    while (nameText.scrollWidth > MAX_TEXT_WIDTH && currentFontSize > 14) {
        currentFontSize--;
        nameText.style.fontSize = currentFontSize + 'px';
    }

    wrapper.classList.remove('animate-in', 'animate-out');
    void wrapper.offsetWidth; 
    wrapper.classList.add('animate-in');

    setTimeout(() => {
        wrapper.classList.remove('animate-in');
        wrapper.classList.add('animate-out');
    }, 6000);
}

async function fetchFirstKillData() {
    try {
        const response = await fetch(API_URL);
        const result = await response.json();
        
        if (!result.data) return;

        const fetchedMatchId = result.data.matchId;

        if (!currentMatchId && fetchedMatchId) {
            currentMatchId = fetchedMatchId;
        }

        if (fetchedMatchId && currentMatchId !== fetchedMatchId) {
            console.log("เริ่มเกมใหม่! รีเซ็ตระบบ First Kill");
            currentMatchId = fetchedMatchId;
            isFirstKillTriggered = false;
            previousPlayersKills = {};
            return; 
        }

        if (isFirstKillTriggered) return;

        if (!result.data.teams) return;
        const teams = result.data.teams;

        if (Object.keys(previousPlayersKills).length === 0) {
            teams.forEach(team => {
                team.players.forEach(player => {
                    previousPlayersKills[player.name] = player.match_kills || 0;
                });
            });
            return; 
        }

        let foundKillerName = null;
        let foundKillerTeam = null;

        for (const team of teams) {
            for (const player of team.players) {
                let currentKills = player.match_kills || 0;
                let prevKills = previousPlayersKills[player.name] || 0;
                
                if (currentKills > prevKills && prevKills === 0) {
                    if (!foundKillerName) {
                        foundKillerName = player.name;
                        foundKillerTeam = team.team_tag;
                    }
                }
                previousPlayersKills[player.name] = currentKills;
            }
        }

        if (foundKillerName && !isFirstKillTriggered) {
            isFirstKillTriggered = true; 
            triggerFirstKill(foundKillerTeam, foundKillerName);
        }
        
    } catch (error) { 
        console.error("API Error:", error); 
    }
}

window.onload = () => {
    if (TEST_MODE) {
        setTimeout(() => {
            triggerFirstKill("FW", "FW_Conaxy_Test_LongName_yg"); 
            setTimeout(() => { isFirstKillTriggered = false; }, 7000);
        }, 1000);
    }
    
    setInterval(fetchFirstKillData, 2000);
};