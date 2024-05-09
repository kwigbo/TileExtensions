const walkable = 0b00000001;

var gameboyMetadataFormat = {
	name: "Gameboy Metadata Format",
	extension: "metadata",
	write: function (map, fileName) {
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
				}
				row.push("$" + metadata.toString(16));
			}
			var rowString = row.join(",").toString();
			file.writeLine("db " + rowString);
		}
		file.commit();
	},
};

tiled.registerMapFormat("metadata", gameboyMetadataFormat);
