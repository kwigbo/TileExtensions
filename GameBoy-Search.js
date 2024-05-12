var gameboySearchFormat = {
	name: "Gameboy Search Format",
	extension: "search",
	write: function (map, fileName) {
		var file = new TextFile(fileName, TextFile.WriteOnly);
		for (y = 0; y < map.height; ++y) {
			var row = [];
			for (x = 0; x < map.width; ++x) {
				for (var i = 0; i < map.layerCount; ++i) {
					var layer = map.layerAt(i);
					var tile = layer.tileAt(x, y);
					var cell = layer.cellAt(x, y);
					// Add 1 so empty tiles are a 0
					var tileId = cell.tileId + 1
					if (layer.name == "Search") {
						var tileDirection = 0;

						if (tile) {
							var direction = tile.property("Direction");
							if (direction != null) {
								tileDirection = direction;
							}
						}
						tileId = tileId + tileDirection
						row.push("$" + tileId.toString(16));
					}
				}
			}
			var rowString = row.join(",").toString();
			file.writeLine("db " + rowString);
		}
		file.commit();
	},
};

tiled.registerMapFormat("search", gameboySearchFormat);
