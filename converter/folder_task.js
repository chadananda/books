var converter = new require('./converter');
var path = require('path');
var fs = require('fs');

//converter.paragraphStyle = ["Normal_20__28_Web_29_", "P2", "P9"];
converter.footnoteStyle = ["Footnote_20_Symbol"];

var dirInPath = "../fodt/Romanian"; // where search fodt files
var dirOutPath = "../dst/Romanian"; // where put html files
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

