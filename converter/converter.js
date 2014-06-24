var util = new require('./util');

var CODE = "_____CODE_____";

var BOLD_OPEN = "_____BOLD_OPEN_____";
var BOLD_CLOSE = "_____BOLD_CLOSE_____";

var UNDERLINE_OPEN = "_____UNDERLINE_OPEN_____";
var UNDERLINE_CLOSE = "_____UNDERLINE_CLOSE_____";

function Converter() {
    this.paragraphStyle = [];
    this.excludeParagraphStyle = [];
    this.footnoteStyle = [];
}

Converter.run = function (templatePath, filePath, resultPath) {
    this.html = util.readHTML(templatePath);

    this.xml = util.readXML(filePath);
    this.resultPath = resultPath;

    this.headerStyle = {};

    this.footnoteCounter = 0;
    this.footnoteMap = {};

    this.asideCounter = 0;

    this.generateHTML(this.xml);

    console.log("created: " + resultPath  + "; footnotes count :" + this.footnoteCounter);
}

Converter.generateHTML = function (xml) {

    this.loadStyles();

    // get template body
    var bodyNode = this.html.getElementsByTagName("html")[0].getElementsByTagName("body")[0];

    var officeDocumentContent = xml.getElementsByTagName("office:document")[0];
    var officeBody = officeDocumentContent.getElementsByTagName("office:body")[0];
    var officeText = officeBody.getElementsByTagName("office:text")[0];


    var eList = officeText.childNodes;
    var n = eList.length;

    for (var i = 0; i < n; i++) {
        var elem = eList[i];
        if (elem.tagName == "text:p") { // paragraphs
            var style = elem.getAttribute("text:style-name");
            //if (style == "Normal_20__28_Web_29_" || style == "P2") { // main text
            //if (this.paragraphStyle || this.paragraphStyle.indexOf(style) != -1) { // main text

            // main text
            if (this.paragraphStyle) {
                if (this.paragraphStyle.indexOf(style) != -1) {
                    this.addParagraph(elem, bodyNode);
                }
            } else if (this.excludeParagraphStyle) {
                if (this.excludeParagraphStyle.indexOf(style) == -1) {
                    this.addParagraph(elem, bodyNode);
                }
            } else {
                this.addParagraph(elem, bodyNode);
            }
        } else if (elem.tagName == "text:h") { // headers
            var pNode = this.html.createElement('p');
            pNode.setAttribute("class", "chapter");
            pNode.textContent = elem.textContent;
            bodyNode.appendChild(pNode);
        } else if (elem.tagName == "table:table") {
            var pNode = this.html.createElement('p');
            pNode.textContent = elem.textContent;
            bodyNode.appendChild(pNode);
        }
    }

    var text = util.getText(this.html);

    // replace label "code" with footnote <a>
    text = this.addFootnote(text);
    text = this.replaceBoldAndUnderline(text);

    util.saveFile(this.resultPath, text);
}

Converter.addParagraph = function (pText, bodyNode) {

    var remove = []; // elements to delete
    var rSize = 0; // remove size

    var footnoteArray = [];
    var fSize = 0;

    for (var j = 0; j < pText.childNodes.length; j++) {
        var pCnt = pText.childNodes[j];
        if (pCnt.tagName && pCnt.tagName == "text:span") {
            var style = pCnt.getAttribute("text:style-name");
            //if (style == "Footnote_20_Symbol") {
            if (this.footnoteStyle && this.footnoteStyle.indexOf(style) != -1) {

                var note = pCnt.getElementsByTagName("text:note")[0];
                if (note) {
                    var noteBody = note.getElementsByTagName("text:note-body")[0];
                    var noteText = noteBody.getElementsByTagName("text:p")[0];


                    // replace footnotes tag with label "code"
                    var footnoteCode = CODE + this.footnoteCounter;
                    var val = [];
                    val[0] = this.asideCounter; // id
                    val[1] = noteText.textContent; // name
                    val[2] = fSize + 1; // index
                    //val[2] = noteCitation.textContent; // index

                    this.footnoteMap[footnoteCode] = val;
                    noteText.textContent = footnoteCode;
                    this.footnoteCounter++;

                    footnoteArray[fSize++] = val;

                    pText.replaceChild(noteText, pCnt);
                }
            } else { // search bold and underline
                this.searchBoldAndUnderline(pCnt);
            }
        } else if (!pCnt.data) {
            remove[rSize++] = pCnt;
        }
    }

    for (var j = 0; j < rSize; j++) {
        pText.removeChild(remove[j]);
    }

    // add our text to html
    var pNode = this.html.createElement('p');
    pNode.textContent = pText.textContent;
    bodyNode.appendChild(pNode);

    // add aside
    if (fSize > 0) {
        var aside = this.html.createElement('aside');
        for (var j = 0; j < fSize; j++) {
            var val = footnoteArray[j];
            var pTag = this.html.createElement('p');
            pTag.setAttribute("id", val[2]);
            pTag.textContent = val[1];
            aside.appendChild(pTag);
        }
        aside.setAttribute("name", "footnote_" + this.asideCounter);
        aside.setAttribute("class", "fn");
        this.asideCounter++;
        bodyNode.appendChild(aside);
    }
}

Converter.addFootnote = function (text) {
    for (var key in this.footnoteMap) {
        var val = this.footnoteMap[key];

        var a = "<a data-fnid='" + val[2] + "' onclick='openAside(\"footnote_" + val[0] + "\");'></a>";
        text = text.replace(key, a);
    }
    return text;
}

Converter.loadStyles = function () {
    var officeDocumentContent = this.xml.getElementsByTagName("office:document")[0];
    var officeStyle = officeDocumentContent.getElementsByTagName("office:automatic-styles")[0];

    var eList = officeStyle.childNodes;
    var n = eList.length;

    for (var i = 0; i < n; i++) {
        var elem = eList[i];
        if (elem.tagName == "style:style") { // paragraphs
            var name = elem.getAttribute("style:name");
            var properties = elem.getElementsByTagName("style:text-properties")[0];
            if (properties) {
                var isBold = false;
                var isUnderline = false;

                var boldAtr = properties.getAttribute("fo:font-weight");
                var underAtr = properties.getAttribute("style:text-underline-style");

                if (boldAtr) isBold = (boldAtr == "bold");
                if (underAtr) isUnderline = (underAtr == "solid");

                var hStyle = {};
                hStyle.isBold = isBold;
                hStyle.isUnderline = isUnderline;
                this.headerStyle[name] = hStyle;
            }
        }
    }
}

Converter.searchBoldAndUnderline = function (span) {
    var styleName = span.getAttribute("text:style-name");
    if (this.headerStyle.hasOwnProperty(styleName)) {
        var hStyle = this.headerStyle[styleName];
        if (hStyle) {
            if (hStyle.isBold) {
                var text = span.textContent;
                text = BOLD_OPEN + text + BOLD_CLOSE;
                span.textContent = text;
            }
            if (hStyle.isUnderline) {
                var text = span.textContent;
                text = UNDERLINE_OPEN + text + UNDERLINE_CLOSE;
                span.textContent = text;
            }
        }
    }
}

Converter.replaceBoldAndUnderline = function (text) {
    text = text.replace(new RegExp(BOLD_OPEN, 'g'), '<b>');
    text = text.replace(new RegExp(BOLD_CLOSE, 'g'), '</b>');
    text = text.replace(new RegExp(UNDERLINE_OPEN, 'g'), '<u>');
    text = text.replace(new RegExp(UNDERLINE_CLOSE, 'g'), '</u>');
    return text;
}

module.exports = Converter;