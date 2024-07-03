var gameboyTileMapFormat = {
	name: "Gameboy Map Format",
	extension: "tilemap",
	write: function (map, fileName) {
		writeTileMap(map, fileName);
		fileName = fileName.replace(".tilemap", ".metadata");
		writeMetadataMap(map, fileName);
		fileName = fileName.replace(".metadata", ".search");
		writeSearchMap(map, fileName);
	},
};

tiled.registerMapFormat("tilemap", gameboyTileMapFormat);

function writeTileMap(map, fileName) {
	var file = new TextFile(fileName, TextFile.WriteOnly);
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
	file.commit();
}

const walkable = 0b00000001;
const ladder = 0b00000010;
function writeMetadataMap(map, fileName) {
	var file = new TextFile(fileName, TextFile.WriteOnly);
	let total = map.width * map.height;
	let objectLayer = new Array(total);
	objectLayer.fill(0);
	let columnTotal = map.width/8;
	// file.writeLine("columnTotal: " + columnTotal);
	for (var i = 0; i < map.layerCount; ++i) {
		var layer = map.layerAt(i);
		if (layer.name == "MetaData") {
			for (let key in layer.objects) {
				let object = layer.objects[key];
				let data = object.property("data");
				if (data.length > 0) {
					let objectX = object.x;
					// Subtract 8 since the coordinate is on the bottom of the object
					let objectY = object.y - 8;
					let column = objectX/8;
					let row = objectY/8;
					let realIndex = row * columnTotal + column;
					// file.writeLine("Adding Object - column: " + column + " / row: " + row);
					// file.writeLine("Object Data: " + data);
					objectLayer[realIndex] = data;
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
			
			row.push("$" + objectData + metadata.toString(16));
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
	file.commit();
}
