/**
 * Global classes for barcino mod
 * This mod intends to help making "epic" games. So, if you want fast games, do not use it
 * Does not support save/load (it's intended to be used in multiplayer mode)
 */


/**
 * Balances population, market and initial resources between teams.
 * The balancing is produced only when there are two teams and they are unbalanced (eg. 5v3, 2v6, etc.)
 */
class BalanceCalc
{
    constructor()
    {
        this.teams = [];
        this.smallTeam = 0;
        this.bigTeam = 0;
        this.teamsProportion = 1;
        this.nPlayers = 0;
        this.players = [];
    }

    /**
     * Calculates team counts. Used in BalanceTeamsPopulation
     * @param {*} settings 
     * @returns an array where each element is an object as follows: { "number": team_number, "count": player_count }. Starting team is 0
     */
    calcTeams(settings)
    {
        var teams = [];
        for (let i = 1; i < settings.PlayerData.length +1; ++i)
        {
            if (settings.PlayerData[i])
            {
                let team = settings.PlayerData[i]["Team"];
                if (!teams.find(t => t.number == team))
                {
                    let newteam = {"number" : team, "count" : 1};
                    teams.push(newteam);
                }
                else
                {
                    for (let t in teams)
                    {
                        if (teams[t].number == team)
                            teams[t].count++;
                    }
                }	
            }
        }
        return teams;
    }
 
    /**
     * Adjust the parameters below when there are 2 teams and they have different number of players:
     * - Assings population max using the formula: (players_n / players_n_of_team)*(player_max_population / 2)
     * - Multiplies initial resources by (big_team_player_count / small_team_player_count), only for small team
     * @param {*} settings 
     * @returns 
     */
    balanceTeams(settings)
    {
        for (let i = 1; i < settings.PlayerData.length; ++i)
        {
            this.players.push({"player" : i, "team" : settings.PlayerData[i].Team})
        }

        this.teams = this.calcTeams(settings);
    
        if (this.teams.length < 2)
        {
            this.teamsProportion = 1;
        }
        else
        {
            this.smallTeam = this.teams[0].count < this.teams[1].count? 0: 1;
            this.bigTeam = this.teams[0].count < this.teams[1].count? 1: 0;
            this.teamsProportion = this.teams[this.bigTeam].count / this.teams[this.smallTeam].count;
            print("smallTeam=" + this.smallTeam + " bigTeam=" + this.bigTeam + " teamsProportion=" + this.teamsProportion );
        }
    
        if (this.teams.length != 2 || this.teams[0].count == this.teams[1].count)
            return;
    
        this.nPlayers = settings.PlayerData.length -1;
        print("nPlayers=" + this.nPlayers);
    
        // loop over all players (not including gaia which is 0) to set resources and population
        for (let i = 1; i < settings.PlayerData.length; ++i)
        {
            if (settings.PlayerData[i])
            {
                let cmpPlayer = QueryPlayerIDInterface(i);
                let configuredPopulation = cmpPlayer.GetMaxPopulation();
                let player_team = settings.PlayerData[i]["Team"];
    
                // set population
                let player_population = Math.round((this.nPlayers / this.teams[player_team].count)*(configuredPopulation/2));
                print("Player " + i + " civ=" + settings.PlayerData[i].Civ + " original max pop=" + configuredPopulation + " new max pop=" + player_population);
                cmpPlayer.SetMaxPopulation(player_population);
    
                // set resources
                let resourceCounts = cmpPlayer.GetResourceCounts();
                let newResourceCounts = {};
                for (let resouce in resourceCounts)
                {
                    if (player_team == this.smallTeam)
                    {
                        let new_resource_count = Math.round(resourceCounts[resouce] * this.teamsProportion)*1.5; // AQUI arbitrario *2
                        print("Player " + i + " set resource " + resouce + " to " + new_resource_count);
                        newResourceCounts[resouce] = new_resource_count;
                    }
                }
                cmpPlayer.SetResourceCounts(newResourceCounts);
            }
        }
    }

    getPlayerTeam(player)
    {
        return this.players[player-1].team;
    }

    getTeamBalancing(team)
    {
        if (team == this.smallTeam)
        {
            return this.teamsProportion;
        }
        else
        {
            return 1;
        }

    }

}

/**
 * Barcino mod global adjustments
 */
class Barcino
{
    constructor()
    {
        this.balancing = new BalanceCalc();
    }

    /**
     * Initializes mod. 
     * Calculates balancing parameters for unbalanced teams (when teams=2)
     * Called from InitGame
     * @param {*} settings 
     */
    Init(settings)
    {
        this.balancing.balanceTeams(settings);
    }

    /**
     * Returns the "team proportion" parameter for a determined entity.
     * Used to balance resources and market of small teams.
     * @param {*} ent 
     * @returns Real team proportion. eg. for two teams 5v3 returns 1.66 for the 3 players team and 1 for the 5 players team
     */
    getTeamPoportionModifierForEntity(ent)
    {
        let owner = QueryOwnerInterface(ent, IID_Player).GetPlayerID();
        let team = this.balancing.getPlayerTeam(owner);
        return this.balancing.getTeamBalancing(team);
    }

    /**
     * OBSOLETE?
     * Gets "team proportion" when trading between markets of the same team
     * @param {*} market1 
     * @param {*} market2 
     * @returns 
     */
    getTradingProportionModifierForMarkets(market1, market2)
    {
        let cmpMarket1Player = QueryOwnerInterface(market1);
        let cmpMarket2Player = QueryOwnerInterface(market2);
        if (!cmpMarket1Player || !cmpMarket2Player)
            return 1;
        let owner1 =  cmpMarket1Player.GetPlayerID();
        let owner2 =  cmpMarket2Player.GetPlayerID();
        let team1 = this.balancing.getPlayerTeam(owner1);
        let team2 = this.balancing.getPlayerTeam(owner2);
        if (team1 != undefined && team2 != undefined && team1 == team2)
        {
            let teamBalancing=this.balancing.getTeamBalancing(team1);
            if (teamBalancing==1)
                return 1;
            else
                return teamBalancing*2; // AQUI ver ese arbitrario *2
        }
        else
        {
            return 1;
        }
    }
}


Engine.RegisterGlobal("Barcino", Barcino);

global.barcino = new Barcino();

