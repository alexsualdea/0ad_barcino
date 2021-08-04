Trigger.prototype.ConquestOwnershipChanged = function(msg)
{
	if (!this.conquestDataInit)
		return;

	for (let query of this.conquestQueries)
	{
		if (!TriggerHelper.EntityMatchesClassList(msg.entity, query.classFilter))
			continue;

		if (msg.to > 0)
			query.entitiesByPlayer[msg.to].push(msg.entity);

		if (msg.from <= 0)
			continue;

		let entities = query.entitiesByPlayer[msg.from];
		let index = entities.indexOf(msg.entity);
		if (index != -1)
			entities.splice(index, 1);

		// AQUI 
		// remove non-finished structures so the player loses when all constructed structures are destroyed or captured
		//print("ConquesCommon entities = " + entities);
		for (let e in entities)
		{
			let ent = entities[e];
			let identity = Engine.QueryInterface(ent, IID_Identity);
			let cmpFoundation = Engine.QueryInterface(ent, IID_Foundation);
			let cmpHealth = Engine.QueryInterface(ent, IID_Health);

			if (identity.HasClass("Structure"))
			{
				//print(" ent=" + ent + " cmpFoundation=" + cmpFoundation + " GetHitpoints=" + cmpHealth.GetHitpoints() + " GetMaxHitpoints=" + cmpHealth.GetMaxHitpoints() + " IsInjured=" + cmpHealth.IsInjured());
				if (cmpFoundation)
				{
					//print("GetBuildProgress=" + cmpFoundation.GetBuildProgress());
					// remove unfinished structures
					if (cmpFoundation.GetBuildProgress() < 1) 
					{
						entities.splice(e, 1);
					}
					else
					{
						// remove just placed structures
						if (cmpHealth.GetHitpoints() == 1)
						{
							entities.splice(e, 1);
						}
					}
				}
			}	
		}
		// AQUI

		if (!entities.length)
		{
			let cmpPlayer = QueryPlayerIDInterface(msg.from);
			if (cmpPlayer)
				cmpPlayer.SetState("defeated", query.defeatReason);
		}
	}
};

Trigger.prototype.ConquestStartGameCount = function()
{
	if (!this.conquestQueries.length)
	{
		warn("ConquestStartGameCount: no conquestQueries set");
		return;
	}

	let cmpRangeManager = Engine.QueryInterface(SYSTEM_ENTITY, IID_RangeManager);
	let entitiesByPlayer = Engine.QueryInterface(SYSTEM_ENTITY, IID_PlayerManager).GetAllPlayers().map(playerID =>
		cmpRangeManager.GetEntitiesByPlayer(playerID));

	for (let query of this.conquestQueries)
		query.entitiesByPlayer = entitiesByPlayer.map(
			ents => ents.filter(
				ent => TriggerHelper.EntityMatchesClassList(ent, query.classFilter)));

	this.conquestDataInit = true;
};

Trigger.prototype.ConquestAddVictoryCondition = function(data)
{
	this.conquestQueries.push(data);
};

{
	let cmpTrigger = Engine.QueryInterface(SYSTEM_ENTITY, IID_Trigger);
	cmpTrigger.conquestDataInit = false;
	cmpTrigger.conquestQueries = [];
	cmpTrigger.RegisterTrigger("OnOwnershipChanged", "ConquestOwnershipChanged", { "enabled": true });
	cmpTrigger.DoAfterDelay(0, "ConquestStartGameCount", null);
}
