/**
 * How to integrate a heightmap:
 * 1. Download a terrain from https://terrain.party/ (or others)
 * 2. Using the file named *(ASTER 30m)* execute: magick "whatever Height Map (ASTER 30m).png" -resize 512 -contrast-stretch 0 -level 30% whatever.png
 * NOTE:when using magick, -level 30% is an experimental value. It seems to work, but may not be the proper
 * 		value for all maps. The idea is that water is black and more white means more height. The way to achieve
 * 		the most correct values may be using other parameters or adjusting it.
 * 3. Copy whatever.png to Documents\My Games\0ad\mods\user\maps\random
 * 4. Remember, do not use _ nor spaces in file names!!
 * 5. Assign heightfile with file name
 * 6. Adjust normalMaxHeight to whatever you like. Higher number means higher mountains
 * 7. Adjust normalMinHeight to 0 to have water or > 0 if you don't want water
 */


Engine.LoadLibrary("rmgen");
Engine.LoadLibrary("rmgen-common");
Engine.LoadLibrary("rmgen2");
Engine.LoadLibrary("rmbiome");
Engine.LoadLibrary("barcinolib");

TILE_CENTERED_HEIGHT_MAP = true;

const heightfile = "vannes.png";
const normalMinHeight = 0; // set to 0 to have water
const normalMaxHeight = 60; // like a height 'multiplier'. more bigger, more mountains

const heightScale = num => num * g_MapSettings.Size / 320;

const heightSeaGround = heightScale(-6);
const heightWaterLevel = heightScale(0);
const heightShoreline = heightScale(0.5);
const heightSnow = heightScale(10);


const tWater = "medit_sand_wet";
const tSnowedRocks = ["alpine_cliff_b", "alpine_cliff_snow"];

var selectedBiome = undefined;

// biomes
//"generic/temperate",
//"generic/snowy",
//"generic/desert",
//"generic/alpine",
//"generic/mediterranean",
//"generic/tropic",
//"generic/autumn"
//selectedBiome = "generic/autumn";

Engine.SetProgress(10);


if (!selectedBiome)
{
	setSelectedBiome();
	selectedBiome = g_MapSettings.Biome;
	if (!selectedBiome)
	{
		selectedBiome = "generic/temperate";
		setBiome(selectedBiome);
		print("setBiome(generic/temperate) (by default)");
	}
	else
	{
		print(" setSelectedBiome() = " + selectedBiome);
	}
}
else
{
	setBiome(selectedBiome);
	print("setBiome(\"" + selectedBiome + "\") (forced)");
}

//for (var v in g_Terrains)
//	print("g_Terrains." + v + " = " + g_Terrains[v]);
//for (var v in g_Decoratives)
//	print("g_Decoratives." + v + " = " + g_Decoratives[v]);


var g_Map = new RandomMap(heightWaterLevel, g_Terrains.mainTerrain);
var mapSize = g_Map.getSize();
var mapCenter = g_Map.getCenter();
var mapBounds = g_Map.getBounds();

g_Map.LoadHeightmapImage(heightfile, normalMinHeight, normalMaxHeight);
Engine.SetProgress(15);

initTileClasses(["shoreline", "mapTile"]);

g_Map.log("Lowering sea ground");
createArea(
	new MapBoundsPlacer(),
	new SmoothElevationPainter(ELEVATION_SET, heightSeaGround, 2),
	new HeightConstraint(-Infinity, heightWaterLevel));
Engine.SetProgress(20);

g_Map.log("Smoothing heightmap");
createArea(
	new MapBoundsPlacer(),
	new SmoothingPainter(1, scaleByMapSize(0.3, 0.8), 1));


Engine.SetProgress(25);

g_Map.log("Marking water");
createArea(
	new MapBoundsPlacer(),
	new TileClassPainter(g_TileClasses.water),
	new HeightConstraint(-Infinity, heightWaterLevel));
Engine.SetProgress(30);

g_Map.log("Marking land");
createArea(
	new DiskPlacer(fractionToTiles(0.5), mapCenter),
	new TileClassPainter(g_TileClasses.land),
	avoidClasses(g_TileClasses.water, 0));
Engine.SetProgress(35);


g_Map.log("Marking climate zones");
var position1 = new Vector2D(mapBounds.left, mapBounds.top);
var position2 =  new Vector2D(mapBounds.right, mapBounds.bottom);
createArea(
	new RectPlacer(position1, position2, Infinity),
	new TileClassPainter(g_TileClasses.mapTile),
	new NullConstraint());
createArea(
		new RectPlacer(position1, position2, Infinity),
		new TerrainPainter(g_Terrains.mainTerrain),
		[
			new HeightConstraint(heightWaterLevel, Infinity),
			new NullConstraint()
		]);


Engine.SetProgress(40);

g_Map.log("Fuzzing biome borders");
createLayeredPatches(
	[scaleByMapSize(3, 6), scaleByMapSize(5, 10), scaleByMapSize(8, 21)],
	[
		[g_Terrains.mainTerrain, g_Terrains.tier1Terrain],
		[g_Terrains.tier1Terrain, g_Terrains.tier2Terrain],
		[g_Terrains.tier2Terrain, g_Terrains.tier3Terrain]
	],
	[1, 1],
	[
		avoidClasses(
			g_TileClasses.forest, 2,
			g_TileClasses.water, 2,
			g_TileClasses.mountain, 2,
			g_TileClasses.dirt, 5,
			g_TileClasses.player, 8),
		borderClasses(g_TileClasses.mapTile, 3, 3), 

	],
	scaleByMapSize(20, 60),
	g_TileClasses.dirt);


Engine.SetProgress(45);

if (!isNomad())
{
	g_Map.log("Finding player positions");

	let [playerIDs, playerPosition] = playerPlacementRandom(
		sortAllPlayers(),
		[
			avoidClasses(g_TileClasses.mountain, 5),
			stayClasses(g_TileClasses.land, scaleByMapSize(8, 25))
		]);

	g_Map.log("Flatten the initial CC area and placing playerbases");
	for (let i = 0; i < getNumPlayers(); ++i)
	{
		g_Map.logger.printDuration();

		createArea(
			new ClumpPlacer(diskArea(defaultPlayerBaseRadius() * 0.8), 0.95, 0.6, Infinity, playerPosition[i]),
			new SmoothElevationPainter(ELEVATION_SET, g_Map.getHeight(playerPosition[i]), 6));

		createBase(playerIDs[i], playerPosition[i], mapSize >= 384);
	}
}
Engine.SetProgress(50);


g_Map.log("Painting shoreline");
createArea(
	new MapBoundsPlacer(),
	[
		new TerrainPainter(g_Terrains.shore),
		new TileClassPainter(g_TileClasses.shoreline)
	],
	[
		stayClasses(g_TileClasses.mapTile, 0),
		new HeightConstraint(-Infinity, heightShoreline)
	]);

g_Map.log("Painting cliffs");
createArea(
	new MapBoundsPlacer(),
	[
		new TerrainPainter(g_Terrains.cliff),
		new TileClassPainter(g_TileClasses.mountain),
	],
	[
		stayClasses(g_TileClasses.mapTile, 0),
		avoidClasses(g_TileClasses.water, 2),
		new SlopeConstraint(2, Infinity)
	]);

g_Map.log("Placing resources");
addElements([
	{
		"func": addMetal,
		"avoid": [
			g_TileClasses.berries, 5,
			g_TileClasses.forest, 3,
			g_TileClasses.mountain, 2,
			g_TileClasses.player, 30,
			g_TileClasses.rock, 10,
			g_TileClasses.metal, 25,
			g_TileClasses.water, 4
		],
		"stay": [g_TileClasses.mapTile, 0],
		"sizes": ["normal"],
		"mixes": ["same"],
		"amounts": [randomAmount()]
	},
	{
		"func": addStone,
		"avoid": [
			g_TileClasses.berries, 5,
			g_TileClasses.forest, 3,
			g_TileClasses.mountain, 2,
			g_TileClasses.player, 30,
			g_TileClasses.rock, 10,
			g_TileClasses.metal, 25,
			g_TileClasses.water, 4
		],
		"stay": [g_TileClasses.mapTile, 0],
		"sizes": ["normal"],
		"mixes": ["same"],
		"amounts": [randomAmount()]
	},
	{
		"func": addForests,
		"avoid": [
			g_TileClasses.berries, 3,
			g_TileClasses.forest, 15,
			g_TileClasses.metal, 3,
			g_TileClasses.mountain, 2,
			g_TileClasses.player, 12,
			g_TileClasses.rock, 2,
			g_TileClasses.water, 2
		],
		"stay": [g_TileClasses.mapTile, 0],
		"sizes": ["normal"],
		"mixes": ["normal"],
		"amounts": ["normal", "many"]
	},
	{
		"func": addSmallMetal,
		"avoid": [
			g_TileClasses.berries, 5,
			g_TileClasses.forest, 3,
			g_TileClasses.mountain, 2,
			g_TileClasses.player, 30,
			g_TileClasses.rock, 10,
			g_TileClasses.metal, 15,
			g_TileClasses.water, 4
		],
		"stay": [g_TileClasses.mapTile, 0],
		"sizes": ["normal"],
		"mixes": ["same"],
		"amounts": ["few", "normal", "many"]
	},
	{
		"func": addBerries,
		"avoid": [
			g_TileClasses.berries, 30,
			g_TileClasses.forest, 2,
			g_TileClasses.metal, 4,
			g_TileClasses.mountain, 2,
			g_TileClasses.player, 20,
			g_TileClasses.rock, 4,
			g_TileClasses.water, 2
		],
		"stay": [g_TileClasses.mapTile, 0],
		"sizes": ["normal"],
		"mixes": ["normal"],
		"amounts": [randomAmount()]
	},
	{
		"func": addAnimals,
		"avoid": [
			g_TileClasses.animals, 10,
			g_TileClasses.forest, 1,
			g_TileClasses.metal, 2,
			g_TileClasses.mountain, 1,
			g_TileClasses.player, 15,
			g_TileClasses.rock, 2,
			g_TileClasses.water, 3
		],
		"stay": [g_TileClasses.mapTile, 0],
		"sizes": ["normal"],
		"mixes": ["normal"],
		"amounts": [randomAmount()]
	},
			{
		"func": addAnimals,
		"avoid": [
			g_TileClasses.animals, 10,
			g_TileClasses.forest, 1,
			g_TileClasses.metal, 2,
			g_TileClasses.mountain, 1,
			g_TileClasses.player, 15,
			g_TileClasses.rock, 2,
			g_TileClasses.water, 1
		],
		"stay": [g_TileClasses.mapTile, 0],
		"sizes": ["small"],
		"mixes": ["normal"],
		"amounts": [randomAmount()]
	},
	{
		"func": addStragglerTrees,
		"avoid": [
			g_TileClasses.berries, 5,
			g_TileClasses.forest, 5,
			g_TileClasses.metal, 2,
			g_TileClasses.mountain, 1,
			g_TileClasses.player, 12,
			g_TileClasses.rock, 2,
			g_TileClasses.water, 3
		],
		"stay": [g_TileClasses.mapTile, 0],
		"sizes": ["normal"],
		"mixes": ["normal"],
		"amounts": [randomAmount()]
	},
	{
		"func": addLayeredPatches,
		"avoid": [
			g_TileClasses.dirt, 5,
			g_TileClasses.forest, 2,
			g_TileClasses.mountain, 2,
			g_TileClasses.player, 12,
			g_TileClasses.water, 3
		],
		"stay": [g_TileClasses.mapTile, 0],
		"sizes": ["normal"],
		"mixes": ["normal"],
		"amounts": [randomAmount()]
	},
	{
		"func": addDecoration,
		"avoid": [
			g_TileClasses.forest, 2,
			g_TileClasses.mountain, 2,
			g_TileClasses.player, 12,
			g_TileClasses.water, 4
		],
		"stay": [g_TileClasses.mapTile, 0],
		"sizes": ["small"],
		"mixes": ["same"],
		"amounts": [randomAmount()]
	}
]);


Engine.SetProgress(60);

g_Map.log("Painting water");
createArea(
	new MapBoundsPlacer(),
	new TerrainPainter(tWater),
	new HeightConstraint(-Infinity, heightWaterLevel));

/*
g_Map.log("Painting snow on mountains");
createArea(
	new MapBoundsPlacer(),
	new TerrainPainter(tSnowedRocks),
	[
		new HeightConstraint(heightSnow, Infinity),
		avoidClasses(
			g_TileClasses.africa, 0,
			g_TileClasses.southern_europe, 0,
			g_TileClasses.player, 6)
	]);
*/
Engine.SetProgress(70);


var clPlayer = g_Map.createTileClass();
var clHill = g_Map.createTileClass();
var clForest = g_Map.createTileClass();
var clDirt = g_Map.createTileClass();
var clRock = g_Map.createTileClass();
var clMetal = g_Map.createTileClass();
var clFood = g_Map.createTileClass();
var clBaseResource = g_Map.createTileClass();


g_Map.log("Creating dirt patches");
createLayeredPatches(
 [scaleByMapSize(3, 6), scaleByMapSize(5, 10), scaleByMapSize(8, 21)],
 [[g_Terrains.mainTerrain,g_Terrains.tier1Terrain],[g_Terrains.tier1Terrain,g_Terrains.tier2Terrain], [g_Terrains.tier2Terrain,g_Terrains.tier3Terrain]],
 [1, 1],
 avoidClasses(clForest, 0, clHill, 0, clDirt, 5, clPlayer, 12),
 scaleByMapSize(15, 45),
 clDirt);

g_Map.log("Creating grass patches");
createPatches(
 [scaleByMapSize(2, 4), scaleByMapSize(3, 7), scaleByMapSize(5, 15)],
 g_Terrains.tier4Terrain,
 avoidClasses(clForest, 0, clHill, 0, clDirt, 5, clPlayer, 12),
 scaleByMapSize(15, 45),
 clDirt);

 var planetm = 1;

 if (currentBiome() == "generic/tropic")
	 planetm = 8;
 
 createDecoration(
	 [
		 [new SimpleObject(g_Decoratives.rockMedium, 1, 3, 0, 1)],
		 [new SimpleObject(g_Decoratives.rockLarge, 1, 2, 0, 1), new SimpleObject(g_Decoratives.rockMedium, 1, 3, 0, 2)],
		 [new SimpleObject(g_Decoratives.grassShort, 1, 2, 0, 1)],
		 [new SimpleObject(g_Decoratives.grass, 2, 4, 0, 1.8), new SimpleObject(g_Decoratives.grassShort, 3,6, 1.2, 2.5)],
		 [new SimpleObject(g_Decoratives.bushMedium, 1, 2, 0, 2), new SimpleObject(g_Decoratives.bushSmall, 2, 4, 0, 2)]
	 ],
	 [
		 scaleByMapSize(16, 262),
		 scaleByMapSize(8, 131),
		 planetm * scaleByMapSize(13, 200),
		 planetm * scaleByMapSize(13, 200),
		 planetm * scaleByMapSize(13, 200)
	 ],
	 avoidClasses(clForest, 0, clPlayer, 0, clHill, 0));
 
 


g_Map.log("Placing fish");
g_Gaia.fish = "gaia/fish/generic";
addElements([
	{
		"func": addFish,
		"avoid": [
			g_TileClasses.fish, 10,
		],
		"stay": [g_TileClasses.water, 4],
		"sizes": ["many"],
		"mixes": ["normal"],
		"amounts": [randomAmount()]
	}
]);
Engine.SetProgress(85);

g_Map.log("Placing whale");
g_Gaia.fish = "gaia/fauna_whale_fin";
addElements([
	{
		"func": addFish,
		"avoid": [
			g_TileClasses.fish, 2,
			g_TileClasses.mapTile, 50
		],
		"stay": [g_TileClasses.water, 7],
		"sizes": ["small"],
		"mixes": ["same"],
		"amounts": ["scarce"]
	}
]);
Engine.SetProgress(95);

placePlayersNomad(
	g_Map.createTileClass(),
	[
		stayClasses(g_TileClasses.land, 5),
		avoidClasses(
			g_TileClasses.forest, 2,
			g_TileClasses.rock, 4,
			g_TileClasses.metal, 4,
			g_TileClasses.berries, 2,
			g_TileClasses.animals, 2,
			g_TileClasses.mountain, 2)
	]);

setAmbient(selectedBiome);

g_Map.ExportMap();
