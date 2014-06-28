var Converter = require('converter');
var path = require('path');
var fs = require('fs');

var converter = new Converter();

converter.footnoteStyle = ["Footnote_20_Symbol"];

converter.languageProperties = converter.languageCode.Arabic;

var dirInPath = "../fodt/Arabic"; // where search fodt files
var dirOutPath = "../dst/Arabic"; // where put html files
var templatePath = path.join(__dirname, 'doc/template.html'); // html template file path

var files = fs.readdirSync(dirInPath);

for (var i = 0; i < files.length; i++) {
    var fullName = files[i];
    var dotIx = fullName.lastIndexOf(".");
    var extension = fullName.substring(dotIx + 1);
    var name = fullName.substring(0, dotIx);
    if (extension.toLowerCase() == "fodt") {
        var filePath = path.join(dirInPath, fullName);
        var resultFile = name + ".html";
        var resultPath = path.join(dirOutPath, resultFile);
        converter.run(templatePath, filePath, resultPath);
    }
}

