

function forcePlacePlayersNomad(playerClass, constraints)
{
	g_Map.log("Placing nomad starting units");

	let distance = scaleByMapSize(60, 240);
	let constraint = new StaticConstraint(constraints);

	let numPlayers = getNumPlayers();
	let playerIDs = shuffleArray(sortAllPlayers());
	let playerPosition = [];

	for (let i = 0; i < numPlayers; ++i)
	{
		let objects = getStartingEntities(playerIDs[i]).filter(ents => ents.Template.startsWith("units/")).map(
			ents => new SimpleObject(ents.Template, ents.Count || 1, ents.Count || 1, 1, 3));

		// Add treasure if too few resources for a civic center
		let ccCost = Engine.GetTemplate("structures/" + getCivCode(playerIDs[i]) + "/civil_centre").Cost.Resources;
		for (let resourceType in ccCost)
		{
			let treasureTemplate = g_NomadTreasureTemplates[resourceType];

			let count = Math.max(0, Math.ceil(
				(ccCost[resourceType] - (g_MapSettings.StartingResources || 0)) /
				Engine.GetTemplate(treasureTemplate).ResourceSupply.Amount));

			objects.push(new SimpleObject(treasureTemplate, count, count, 3, 5));
		}

		// Try place these entities at a random location
		let group = new SimpleGroup(objects, true, playerClass);
		let success = false;
		for (let distanceFactor of [1, 1/2, 1/4, 0])
			if (createObjectGroups(group, playerIDs[i], new AndConstraint([constraint, avoidClasses(playerClass, distance * distanceFactor)]), 1, 200, false).length)
			{
				success = true;
				playerPosition[i] = group.centerPosition;
				break;
			}

		if (!success)
			throw new Error("Could not place starting units for player " + playerIDs[i] + "!");
	}

	return [playerIDs, playerPosition];
}
