var MessageFormat = require("messageformat");
var fs = require("fs");
var path = require("path");
var _ = require("lodash");

var fileOptions = {encoding: 'utf8'};

var MessageFormatTranslator = {
	directory: function (directory, locale) {
		var body = MessageFormatTranslator.directoryBody(directory, locale);

		return new (new Function(body));
	},
	directoryBody: function (directory, locale) {
		var mf = new MessageFormat(locale);
		var extension = ".json";
		var body = "this[\"" + mf.globalName + "\"]=" + mf.functions() + ";\n";
		_.forEach(fs.readdirSync(directory), function (item) {
			if (path.extname(item) === extension) {
				var fullPath = _.trimRight(directory, "/") + "/" + item;
				var read = fs.readFileSync(fullPath, fileOptions);
				var fileBaseName = path.basename(item, extension);

				var parsedObject = JSON.parse(read);
				if (typeof parsedObject !== "object") {
					return;
				}

				body += "this[\"" + mf.globalName + "\"][\"" + fileBaseName + "\"] = {};\n";
				_.forEach(parsedObject, function (value, key) {
					if (typeof value !== "string") {
						delete parsedObject[key];
						return;
					}

					body += "this[\"" + mf.globalName + "\"][\"" + fileBaseName + "\"][\"" + key + "\"] = " + mf.compile(value).toString() + ";\n";
				});
			}
		});
		body += "this.getNamespace = function(namespace) { " +
		"if( ! this[\"" + mf.globalName + "\"].hasOwnProperty(namespace)) { return false;}" +
		"return this[\"" + mf.globalName + "\"][namespace];" +
		"}";
		return body;
	}
};

module.exports = MessageFormatTranslator;
