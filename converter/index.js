var path = require('path');
var util = new require('./util');


// here set the path to files
var filePath = path.join(__dirname, 'doc/Kitab-i-Iqan.fodt'); // fodt file path
var templatePath = path.join(__dirname, 'doc/template.html'); // html template file path
var resultPath = path.join(__dirname, 'doc/Kitab-i-Iqan.html'); // html result file path

var html = util.readHTML(templatePath);

var xml = util.readXML(filePath);

var footnoteCounter = 0;
var footnoteMap = {};
var CODE = "_____CODE_____";
var asideCounter = 0;

var paragraphStyle = ["Normal_20__28_Web_29_", "P2", "P9"];
var footnoteStyle = ["Footnote_20_Symbol"];

var headerStyle = {};
var BOLD_OPEN = "_____BOLD_OPEN_____";
var BOLD_CLOSE = "_____BOLD_CLOSE_____";

var UNDERLINE_OPEN = "_____UNDERLINE_OPEN_____";
var UNDERLINE_CLOSE = "_____UNDERLINE_CLOSE_____";

generateHTML(xml);

function generateHTML(xml) {

    loadStyles();

    // get template body
    var bodyNode = html.getElementsByTagName("html")[0].getElementsByTagName("body")[0];

    // get odt text
    /* // odt
     var officeDocumentContent = xml.getElementsByTagName("office:document-content")[0];
     var officeBody = officeDocumentContent.getElementsByTagName("office:body")[0];
     var officeText = officeBody.getElementsByTagName("office:text")[0];
     */

    // odtf
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
            if (paragraphStyle.indexOf(style) != -1) { // main text
                addParagraph(elem, bodyNode);
            }
        } else if (elem.tagName == "text:h") { // headers
            var style = elem.getAttribute("text:style-name");
            //console.log(style)
            // if (style == "P15" || style == "P14") { // chapter text
            var pNode = html.createElement('p');
            pNode.setAttribute("class", "chapter");
            pNode.textContent = elem.textContent;
            bodyNode.appendChild(pNode);
            //}
        }
    }

    var text = util.getText(html);

    // replace label "code" with footnote <a>
    text = addFootnote(text);
    text = replaceBoldAndUnderline(text);

    util.saveFile(resultPath, text);
}

function addParagraph(pText, bodyNode) {

    var remove = []; // elements to delete
    var rSize = 0; // remove size

    var footnoteArray = [];
    var fSize = 0;

    for (var j = 0; j < pText.childNodes.length; j++) {
        var pCnt = pText.childNodes[j];
        if (pCnt.tagName && pCnt.tagName == "text:span") {
            var style = pCnt.getAttribute("text:style-name");
            //if (style == "Footnote_20_Symbol") {
            if (footnoteStyle.indexOf(style) != -1) {

                //if (footnoteStyle.indexOf(style) != -1) {
                var note = pCnt.getElementsByTagName("text:note")[0];
                //var noteCitation = note.getElementsByTagName("text:note-citation")[0];
                if (note) {
                    var noteBody = note.getElementsByTagName("text:note-body")[0];
                    var noteText = noteBody.getElementsByTagName("text:p")[0];


                    // replace footnotes tag with label "code"
                    var footnoteCode = CODE + footnoteCounter;
                    var val = [];
                    val[0] = asideCounter; // id
                    val[1] = noteText.textContent; // name
                    val[2] = fSize + 1; // index
                    //val[2] = noteCitation.textContent; // index

                    footnoteMap[footnoteCode] = val;
                    noteText.textContent = footnoteCode;
                    footnoteCounter++;

                    footnoteArray[fSize++] = val;

                    pText.replaceChild(noteText, pCnt);
                }
            } else { // search bold and underline
                searchBoldAndUnderline(pCnt);
            }
        } else if (!pCnt.data) {
            remove[rSize++] = pCnt;
        }
    }

    for (var j = 0; j < rSize; j++) {
        pText.removeChild(remove[j]);
    }

    // add our text to html
    var pNode = html.createElement('p');
    pNode.textContent = pText.textContent;
    bodyNode.appendChild(pNode);

    // add aside
    if (fSize > 0) {
        var aside = html.createElement('aside');
        for (var j = 0; j < fSize; j++) {
            var val = footnoteArray[j];
            var pTag = html.createElement('p');
            pTag.setAttribute("id", val[2]);
            pTag.textContent = val[1];
            aside.appendChild(pTag);
        }
        aside.setAttribute("name", "footnote_" + asideCounter);
        aside.setAttribute("class", "fn");
        asideCounter++;
        bodyNode.appendChild(aside);
    }
}

function addFootnote(text) {
    for (var key in footnoteMap) {
        var val = footnoteMap[key];

        var a = "<a data-fnid='" + val[2] + "' onclick='openAside(\"footnote_" + val[0] + "\");'></a>";
        text = text.replace(key, a);
    }
    return text;
}

function loadStyles() {
    var officeDocumentContent = xml.getElementsByTagName("office:document")[0];
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
                headerStyle[name] = hStyle;
            }
        }
    }
}

function searchBoldAndUnderline(span) {
    var styleName = span.getAttribute("text:style-name");
    if (headerStyle.hasOwnProperty(styleName)) {
        var hStyle = headerStyle[styleName];
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

function replaceBoldAndUnderline(text) {
    text = text.replace(new RegExp(BOLD_OPEN, 'g'), '<b>');
    text = text.replace(new RegExp(BOLD_CLOSE, 'g'), '</b>');
    text = text.replace(new RegExp(UNDERLINE_OPEN, 'g'), '<u>');
    text = text.replace(new RegExp(UNDERLINE_CLOSE, 'g'), '</u>');
    return text;
}