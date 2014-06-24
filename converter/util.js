var fs = require('fs');
var DOMParser = require('xmldom').DOMParser;
var XMLSerializer = require('xmldom').XMLSerializer;


function Util() {
}

Util.readOdt = function (filePath, onEnd) {
    fs.createReadStream(filePath)
        .pipe(unzip.Parse())
        .on('entry', function (entry) {
            var fileName = entry.path;
            var type = entry.type; // 'Directory' or 'File'
            var size = entry.size;
            if (fileName === "content.xml") {
                var context = "";
                entry.on('readable', function () {
                    var data = entry.read();
                    context = context + data.toString();
                });
                entry.on('end', function () {
                    var xml = new DOMParser().parseFromString(context, 'text/xml');
                    //generateHTML(xml);
                    onEnd(xml);
                });
            } else {
                entry.autodrain();
            }
        });
};

Util.readHTML = function (filePath) {
    var content = fs.readFileSync(filePath, {encoding: 'utf8'});
    var html = new DOMParser().parseFromString(content, 'text/html');
    return html;
}

Util.readXML = function (filePath) {
    var content = fs.readFileSync(filePath, {encoding: 'utf8'});
    var xml = new DOMParser().parseFromString(content, 'text/xml');
    return xml;
}

Util.saveXML = function (filePath, xml) {
    var text = new XMLSerializer().serializeToString(xml);
    fs.writeFileSync(filePath, text);
}

Util.saveFile = function (filePath, text) {
    fs.writeFileSync(filePath, text);
}

Util.getText = function (xml) {
    var text = new XMLSerializer().serializeToString(xml);
    return text;
}

module.exports = Util;
