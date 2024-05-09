var gameboyTileMapFormat = {
	name: "Gameboy Map Format",
	extension: "tilemap",
	write: function (map, fileName) {
		var file = new TextFile(fileName, TextFile.WriteOnly);
		for (var i = 0; i < map.layerCount; ++i) {
			var layer = map.layerAt(i);
			if (layer.isTileLayer) {
				for (y = 0; y < layer.height; ++y) {
					var row = [];
					for (x = 0; x < layer.width; ++x) {
						// Minus 128 here is to offset for signed tile data
						var tileId = layer.cellAt(x, y).tileId - 128;
						row.push(String(tileId));
					}
					var rowString = row.join(",").toString();
					file.writeLine("db " + rowString);
				}
			}
		}
		file.commit();
	},
};

tiled.registerMapFormat("tilemap", gameboyTileMapFormat);
