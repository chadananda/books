var converter = new require('./converter');
var path = require('path');

//converter.excludeParagraphStyle = ["P39"];
converter.footnoteStyle = ["Footnote_20_Symbol"];

var filePath = path.join(__dirname, "../fodt/English/Abd-A_Traveler's_Narrative.fodt");
var templatePath = path.join(__dirname, 'doc/template.html');
var resultPath = path.join(__dirname, "../dst/English/Abd-A_Traveler's_Narrative.html");

converter.run(templatePath, filePath, resultPath);
