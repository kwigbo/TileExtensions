var gameboyTileMapFormat = {
	name: "Gameboy Map Format",
	extension: "tilemap",
	write: function (map, fileName) {
		writeTileMap(map, fileName);
		fileName = fileName.replace(".tilemap", ".metadata")
		writeMetadataMap(map, fileName);
		fileName = fileName.replace(".metadata", ".search")
		writeSearchMap(map, fileName);
	},
};

tiled.registerMapFormat("tilemap", gameboyTileMapFormat);

function writeTileMap(map, fileName) {
	var file = new TextFile(fileName, TextFile.WriteOnly);
	for (var i = 0; i < map.layerCount; ++i) {
		var layer = map.layerAt(i);
		if (layer.isTileLayer && 
			(layer.name == "Map" || layer.name == "OffsetMap")) {
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
	file.commit();
}

const walkable = 0b00000001;
const story = 0b00000010;
function writeMetadataMap(map, fileName) {
	var file = new TextFile(fileName, TextFile.WriteOnly);
		for (y = 0; y < map.height; ++y) {
			var row = [];
			for (x = 0; x < map.width; ++x) {
				var metadata = 0b00000000;
				for (var i = 0; i < map.layerCount; ++i) {
					var layer = map.layerAt(i);
					var tile = layer.cellAt(x, y);
					var tileId = tile.tileId
					if (layer.name == "Walkable") {
						// Less than zero is walkable. All set tiles are not.
						if (tileId < 0) {
							metadata = metadata | walkable
						}
					}
					if (layer.name == "Story") {
						// Less than zero is walkable. All set tiles are not.
						if (tileId < 0) {
							metadata = metadata | story
						}
					}
				}
				row.push("$" + metadata.toString(16));
			}
			var rowString = row.join(",").toString();
			file.writeLine("db " + rowString);
		}
		file.commit();
}

function writeSearchMap(map, fileName) {
	var file = new TextFile(fileName, TextFile.WriteOnly);
		for (y = 0; y < map.height; ++y) {
			var row = [];
			for (x = 0; x < map.width; ++x) {
				for (var i = 0; i < map.layerCount; ++i) {
					var layer = map.layerAt(i);
					var tile = layer.tileAt(x, y);
					var cell = layer.cellAt(x, y);
					// Add 1 so empty tiles are a 0
					var tileId = cell.tileId + 1;
					if (layer.name == "Search") {
						var tileDirection = 0;

						if (tile) {
							var direction = tile.property("Direction");
							if (direction != null) {
								tileDirection = direction;
							}
						}
						tileId = tileId + tileDirection;
						row.push("$" + tileId.toString(16));
					}
				}
			}
			var rowString = row.join(",").toString();
			file.writeLine("db " + rowString);
		}
		file.commit();
}
