import Parser from './Parser'

import express from 'express'
import bodyParser from 'body-parser'
// import formidable from 'formidable'
import CalculateGlobalStats from 'javascript/models/transformations/textitem/CalculateGlobalStats.jsx';

import CompactLines from 'javascript/models/transformations/lineitem/CompactLines.jsx';
import RemoveRepetitiveElements from 'javascript/models/transformations/lineitem/RemoveRepetitiveElements.jsx'
import VerticalToHorizontal from 'javascript/models/transformations/lineitem/VerticalToHorizontal.jsx';
import DetectTOC from 'javascript/models/transformations/lineitem/DetectTOC.jsx'
import DetectListItems from 'javascript/models/transformations/lineitem/DetectListItems.jsx'
import DetectHeaders from 'javascript/models/transformations/lineitem/DetectHeaders.jsx'

import GatherBlocks from 'javascript/models/transformations/textitemblock/GatherBlocks.jsx'
import DetectCodeQuoteBlocks from 'javascript/models/transformations/textitemblock/DetectCodeQuoteBlocks.jsx'
import DetectListLevels from 'javascript/models/transformations/textitemblock/DetectListLevels.jsx'
import ToTextBlocks from 'javascript/models/transformations/ToTextBlocks.jsx';
import ToMarkdown from 'javascript/models/transformations/ToMarkdown.jsx'
import ParseResult from 'javascript/models/ParseResult.jsx';

var transformations = [
    new CalculateGlobalStats(new Map()),
    new CompactLines(),
    new RemoveRepetitiveElements(),
    new VerticalToHorizontal(),
    new DetectTOC(),
    new DetectHeaders(),
    new DetectListItems(),

    new GatherBlocks(),
    new DetectCodeQuoteBlocks(),
    new DetectListLevels(),

    new ToTextBlocks(),
    new ToMarkdown()];


var app = express();
var port = process.env.PORT || 3000;

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));

app.listen(port);

var parser = new Parser()

console.log('todo list RESTful API server started on: ' + port);

app.post('/api/pdf2md', (req, res) => {
    var filePath = req.body.file
    parser.readBuffer(filePath)
    .then((pages) => {
        console.log(pages)
        toText(pages)
    })
    res.send('Received')

})

function toText(pages) {
    var parseResult = new ParseResult({
        pages: pages
    });
    var lastTransformation;
    transformations.forEach(transformation => {
        if (lastTransformation) {
            parseResult = lastTransformation.completeTransform(parseResult);
        }
        parseResult = transformation.transform(parseResult);
        lastTransformation = transformation;
    });

    var text = '';
    parseResult.pages.forEach(page => {
        page.items.forEach(item => {
            text += item + '\n';
        });
    });
    console.log(text)
}