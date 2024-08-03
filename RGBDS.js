var RGBDSFormat = {
	name: "RGBDS Format",
	extension: "asm",
	write: function (map, fileName) {
        var file = new TextFile(fileName, TextFile.WriteOnly);
        let mapName = getMapName(fileName);
        writeHeader(map, file, mapName);
        writeTileMap(map, file, mapName);
        let portalMap = writeMetaData(map, file, mapName);
        writePortalData(map, file, mapName, portalMap);
        writeSearchData(map, file, mapName);
        file.commit();
	},
};

tiled.registerMapFormat("asm", RGBDSFormat);

const walkable = 0b00000001;
const ladder = 0b00000010;

/*
* Function used to generate the ROMX section that will 
* will hold all the map data
*
* @param map: The map object to get header details from
* @param file: The file to write the header to
* @param mapName: The name of the file being generated
*/
function writeHeader(map, file, mapName) {
    let bank = map.property("RomBank");
    if (stringIsValid(bank)) {
        file.writeLine("SECTION \"" + mapName + "\", ROMX, BANK[" + bank + "]");
    } else {
        file.writeLine("SECTION \"" + mapName + "\", ROMX");
    }
}

/*
* Function used to generate the tile map
*
* @param map: The map object to generate from
* @param file: The file to write to
* @param mapName: The name of the map being generated
*/
function writeTileMap(map, file, mapName) {
    let startKey = mapName + "TileMapStart"
    let endKey = mapName + "TileMapEnd"
    file.writeLine("export " + startKey);
    file.writeLine("export " + endKey);
    file.writeLine(startKey + ":");
    for (var i = 0; i < map.layerCount; ++i) {
		var layer = map.layerAt(i);
		if (
			layer.isTileLayer &&
			(layer.name == "Map" || layer.name == "OffsetMap")
		) {
			for (y = 0; y < layer.height; ++y) {
				var row = [];
				for (x = 0; x < layer.width; ++x) {
					if (layer.name == "OffsetMap") {
						// Minus 128 here is to offset for signed tile data
						var tileId = layer.cellAt(x, y).tileId - 128;
						row.push(String(tileId));
					}
					if (layer.name == "Map") {
						var tileId = layer.cellAt(x, y).tileId;
						row.push(String(tileId));
					}
				}
				var rowString = row.join(",").toString();
				file.writeLine("db " + rowString);
			}
		}
	}
    file.writeLine(endKey + ":");
}

/*
* Function used to generate the meta data map
*
* @param map: The map object to generate from
* @param file: The file to write to
* @param mapName: The name of the map being generated
*/
function writeMetaData(map, file, mapName) {
    let startKey = mapName + "Meta"
    file.writeLine("export " + startKey);
    file.writeLine(startKey + ":");
    let total = map.width * map.height;
	let objectLayer = new Array(total);
	objectLayer.fill(0);
	let portalLayer = new Array(total);
	portalLayer.fill(0);
	let columnTotal = map.width;
	// file.writeLine("columnTotal: " + columnTotal);
	for (var i = 0; i < map.layerCount; ++i) {
		var layer = map.layerAt(i);
		if (layer.name == "MetaData") {
			for (let key in layer.objects) {
				let object = layer.objects[key];
				let data = object.property("portalId");
				if (data.length > 0) {
					let objectX = object.x;
					// Subtract 8 since the coordinate is on the bottom of the object
					let objectY = object.y - 8;
					let column = objectX/8;
					let row = objectY/8;
					let realIndex = row * columnTotal + column;
					// file.writeLine("Adding Object - column: " + column + " / row: " + row);
					// file.writeLine("Object Data: " + data);
					objectLayer[realIndex] = 1;
					portalLayer[realIndex] = data
				}
			}
		}
	}

	// file.writeLine("Object Layer: " + objectLayer);
	for (y = 0; y < map.height; ++y) {
		var row = [];
		for (x = 0; x < map.width; ++x) {
			var metadata = 0b00000000;
			for (var i = 0; i < map.layerCount; ++i) {
				var layer = map.layerAt(i);
				if (!layer.isTileLayer) {
					continue;
				}
				var tile = layer.cellAt(x, y);
				var tileId = tile.tileId;
				if (layer.name == "Walkable") {
					// Less than zero is walkable. All set tiles are not.
					if (tileId < 0) {
						metadata = walkable;
					}
				}
				if (layer.name == "Ladder") {
					// Greater than 0 has ladder
					if (tileId == 0) {
						metadata = ladder;
					}
				}
			}
			let realIndex = y * columnTotal + x;
			var objectData = objectLayer[realIndex];
			objectData = parseInt(objectData, 2);
			objectData = objectData.toString(16);
			// row.push("$" + realIndex);
			// row.push("$" + objectData);
			row.push("$" + objectData + metadata.toString(16));
		}
		var rowString = row.join(",").toString();
		file.writeLine("db " + rowString);
	}
    return portalLayer
}

/*
* Function used to generate the meta data map
*
* @param map: The map object to generate from
* @param file: The file to write to
* @param mapName: The name of the map being generated
* @param portalMap: The map of portals in the map
*/
function writePortalData(map, file, mapName, portalMap) {
    let startKey = mapName + "Portal"
    file.writeLine("export " + startKey);
    file.writeLine(startKey + ":");
    let columnTotal = map.width;
	for (y = 0; y < map.height; ++y) {
		var row = [];
		for (x = 0; x < map.width; ++x) {
			let realIndex = y * columnTotal + x;
			var objectData = parseInt(portalMap[realIndex]);
			row.push("$" + objectData.toString(16));
		}
		var rowString = row.join(",").toString();
		file.writeLine("db " + rowString);
	}
}

/*
* Function used to generate the search data map
*
* @param map: The map object to generate from
* @param file: The file to write to
* @param mapName: The name of the map being generated
*/
function writeSearchData(map, file, mapName) {
    let startKey = mapName + "Search"
    file.writeLine("export " + startKey);
    file.writeLine(startKey + ":");
    for (y = 0; y < map.height; ++y) {
		var row = [];
		for (x = 0; x < map.width; ++x) {
			for (var i = 0; i < map.layerCount; ++i) {
				var layer = map.layerAt(i);
				if (!layer.isTileLayer) {
					continue;
				}
				var tile = layer.tileAt(x, y);
				var cell = layer.cellAt(x, y);
				// Add 1 so empty tiles are a 0
				var tileId = cell.tileId + 1;
				if (layer.name == "Search") {
					tileId = tileId;
					row.push("$" + tileId.toString(16));
				}
			}
		}
		var rowString = row.join(",").toString();
		file.writeLine("db " + rowString);
	}
}

// MARK: Utility Methods

/*
* Get the name of the map from the current file path
*
* @param filePath: The file path to get the name from
*/
function getMapName(filePath) {
    let fileName = filePath.substring(filePath.lastIndexOf('/') + 1)
    let split = fileName.split('.');
    split.pop();
    return split.join("."); 
}

/*
* Utility function to check if a string is valid
*
* @param str: The string to check
*/
function stringIsValid(str) {
    if ((typeof str === "string" && 
        str.trim().length === 0) || 
        str === null) {
        return false
      }
      return true
}

