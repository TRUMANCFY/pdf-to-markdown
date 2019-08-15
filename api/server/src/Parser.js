// import CalculateGlobalStats from 'javascript/models/transformations/textitem/CalculateGlobalStats.jsx';

// import CompactLines from 'javascript/models/transformations/lineitem/CompactLines.jsx';
// import RemoveRepetitiveElements from 'javascript/models/transformations/lineitem/RemoveRepetitiveElements.jsx'
// import VerticalToHorizontal from 'javascript/models/transformations/lineitem/VerticalToHorizontal.jsx';
// import DetectTOC from 'javascript/models/transformations/lineitem/DetectTOC.jsx'
// import DetectListItems from 'javascript/models/transformations/lineitem/DetectListItems.jsx'
// import DetectHeaders from 'javascript/models/transformations/lineitem/DetectHeaders.jsx'

// import GatherBlocks from 'javascript/models/transformations/textitemblock/GatherBlocks.jsx'
// import DetectCodeQuoteBlocks from 'javascript/models/transformations/textitemblock/DetectCodeQuoteBlocks.jsx'
// import DetectListLevels from 'javascript/models/transformations/textitemblock/DetectListLevels.jsx'
// import ToTextBlocks from 'javascript/models/transformations/ToTextBlocks.jsx';
// import ToMarkdown from 'javascript/models/transformations/ToMarkdown.jsx'

import React from 'react';
import FaCheck from 'react-icons/lib/fa/check'

import pdfjs from 'pdfjs-dist';
import { Line } from 'rc-progress';

var fs = require('fs')

import Metadata from 'javascript/models/Metadata.jsx';
import Page from 'javascript/models/Page.jsx';
import TextItem from 'javascript/models/TextItem.jsx';

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

export default class Parser {
    constructor() {
        const progress = new Progress({
            stages: [
                new ProgressStage('Parsing Metadata', 2),
                new ProgressStage('Parsing Pages'),
                new ProgressStage('Parsing Fonts', 0)
            ]
        });

        
        Progress.prototype.metadataStage = () => {
            return progress.stages[0]
        };
        Progress.prototype.pageStage = () => {
            return progress.stages[1]
        };
        Progress.prototype.fontStage = () => {
            return progress.stages[2]
        };

        this.state = {
            document: null,
            metadata: null,
            pages: [],
            fontIds: new Set(),
            fontMap: new Map(),
            progress: progress,
        };

        this.fileBuffer = null;
        this.pages = null

        this.transformations = [
            new CalculateGlobalStats(this.state.fontMap),
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
    }

    async readBuffer(filePath) {
        var buffer = fs.readFileSync(filePath, null).buffer;
        this.fileBuffer = buffer;
        console.log('buffer update')

        var pages = await this.parse()
        return pages
    }

    // cleanBuffer() {
    //     this.state = {
    //         document: null,
    //         metadata: null,
    //         pages: [],
    //         fondIds: new Set(),
    //         fontMap: new Map(),
    //         progress: progress
    //     }
    // }

    documentParsed(document) {
        const metadataStage = this.state.progress.metadataStage();
        const pageStage = this.state.progress.pageStage();
        metadataStage.stepsDone++;

        const numPages = document.numPages;
        pageStage.steps = numPages;
        pageStage.stepsDone;

        var pages = [];
        for (var i = 0; i < numPages; i++) {
            pages.push(new Page({
                index: i
            }));
        }


        this.state.document = document
        this.state.pages = pages
    }

    metadataParsed(metadata) {
        const metadataStage = this.state.progress.metadataStage();
        metadataStage.stepsDone++;
        // console.debug(new Metadata(metadata));
        this.state.metadata = new Metadata(metadata)
    }

    pageParsed(index, textItems) {
        const pageStage = this.state.progress.pageStage();

        pageStage.stepsDone = pageStage.stepsDone + 1;
        this.state.pages[index].items = textItems; // eslint-disable-line react/no-direct-mutation-state
        this.progress = this.state.progress
    }

    fontParsed(fontId, font) {
        const fontStage = this.state.progress.fontStage();
        this.state.fontMap.set(fontId, font); // eslint-disable-line react/no-direct-mutation-state
        fontStage.stepsDone++;
        if (this.state.progress.activeStage() === fontStage) {
            this.state.fontMap = this.state.fontMap
        }
    }

    parse() {
        const fontStage = this.state.progress.fontStage();
        var self = this;
        
        console.log(self.fileBuffer)

        pdfjs.getDocument({
            data: self.fileBuffer,
            cMapUrl: 'cmaps/',
            cMapPacked: true
        }).then(async function(pdfDocument) { // eslint-disable-line no-undef
            // console.debug(pdfDocument);
            await pdfDocument.getMetadata().then(function(metadata) {
                // console.debug(metadata);
                self.metadataParsed(metadata);
            });
            await self.documentParsed(pdfDocument);
            for (var j = 1; j <= pdfDocument.numPages; j++) {
                await pdfDocument.getPage(j).then(async function(page) {
                    // console.debug(page);
                    var scale = 1.0;
                    var viewport = page.getViewport(scale);

                    await page.getTextContent().then(async function(textContent) {
                        // console.debug(textContent);
                        const textItems = textContent.items.map(function(item) {
                            //trigger resolving of fonts
                            const fontId = item.fontName;
                            if (!self.state.fontIds.has(fontId) && fontId.startsWith('g_d0')) {
                                // console.log(this.state.document._transport)
                                self.state.document._transport.commonObjs.get(fontId, function(font) {
                                    self.fontParsed(fontId, font);
                                });
                                self.state.fontIds.add(fontId);
                                fontStage.steps = self.state.fontIds.size;
                            }

                            const tx = pdfjs.Util.transform( // eslint-disable-line no-undef
                                viewport.transform,
                                item.transform
                            );

                            const fontHeight = Math.sqrt((tx[2] * tx[2]) + (tx[3] * tx[3]));
                            const dividedHeight = item.height / fontHeight;
                            return new TextItem({
                                x: Math.round(item.transform[4]),
                                y: Math.round(item.transform[5]),
                                width: Math.round(item.width),
                                height: Math.round(dividedHeight <= 1 ? item.height : dividedHeight),
                                text: item.str,
                                font: item.fontName
                            });
                        });
                        await self.pageParsed(page.pageIndex, textItems);
                    });
                });
            }
        }).then(
            () => {
                //console.log(self.state.pages)
                self.toText()
            }
        );
    }

    toText() {
        console.log(this)
        var parseResult = new ParseResult({
            pages: this.state.pages
        });
        var lastTransformation;
        this.transformations.forEach(transformation => {
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
}

class Progress {

    constructor(options) {
        this.stages = options.stages;
        this.currentStage = 0;
    }

    completeStage() {
        this.currentStage++;
    }

    isComplete() {
        return this.currentStage == this.stages.length;
    }

    activeStage() {
        return this.stages[this.currentStage];
    }

}

class ProgressStage {

    constructor(name, steps) {
        this.name = name;
        this.steps = steps ;
        this.stepsDone = 0;
    }

    isComplete() {
        return this.stepsDone == this.steps;
    }

    percentDone() {
        if (typeof this.steps === 'undefined') {
            // if (!this.steps) {
            return 0;
        }
        if (this.steps == 0) {
            return 100;
        }

        return this.stepsDone / this.steps * 100;
    }
}