"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
;
var HTMLTokenizer = /** @class */ (function () {
    function HTMLTokenizer() {
        this.tagRegex = /<(\/?)([a-zA-Z][a-zA-Z]*)([^\<\>]*)/g;
        this.nullTagsRegex = /(area|base|br|col|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)/;
        this.classRegex = /\s*class=('[^']+'|"[^"]+")/;
        this.globalStack = [];
        this.stackMap = {};
        this.tags = {};
        this.classes = {};
        this.tokens = [];
    }
    HTMLTokenizer.prototype.reset = function () {
        this.classRegex.lastIndex = 0;
        this.nullTagsRegex.lastIndex = 0;
        this.tagRegex.lastIndex = 0;
        this.globalStack = [];
        this.stackMap = {};
        this.resultInfo = null;
        this.tags = {};
        this.classes = {};
        this.tokens = [];
    };
    HTMLTokenizer.prototype.feed = function (html) {
        while ((this.nextResult(html))) {
            this.resultInfo.hasCloseSign ?
                this.parseCloseTag() :
                this.parseOpeningTag();
        }
    };
    Object.defineProperty(HTMLTokenizer.prototype, "tokenListResult", {
        get: function () {
            // console.log(this.classes)
            return {
                tokens: this.tokens, tags: this.tags, classes: this.classes
            };
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(HTMLTokenizer.prototype, "lastTokenAdded", {
        get: function () {
            if (this.globalStack.length < 1)
                return null;
            var lastIndex = this.globalStack[this.globalStack.length - 1];
            return this.tokens[lastIndex];
        },
        enumerable: true,
        configurable: true
    });
    Object.defineProperty(HTMLTokenizer.prototype, "nextTokenIndex", {
        get: function () {
            return this.tokens.length;
        },
        enumerable: true,
        configurable: true
    });
    HTMLTokenizer.prototype.parseClasses = function () {
        var attrInfo = this.resultInfo.attrInfo;
        var classResult = attrInfo.match(this.classRegex);
        if (classResult && classResult.length > 0) {
            var classNames = classResult[1].replace(/['"]/g, "").split(/\s/);
            for (var i in classNames) {
                var className = classNames[i];
                this.classes[className] = this.classes[className] || [];
                this.classes[className].push(this.nextTokenIndex);
            }
        }
    };
    HTMLTokenizer.prototype.nextResult = function (html) {
        var result = this.tagRegex.exec(html);
        if (!result)
            return false;
        var hasCloseSign = result[1], tagName = result[2], attrInfo = result[3];
        var resultInfo = {
            hasCloseSign: !!hasCloseSign,
            tagName: tagName, attrInfo: attrInfo, index: result.index
        };
        this.tags[resultInfo.tagName] = this.tags[resultInfo.tagName] || [];
        this.stackMap[resultInfo.tagName] = this.stackMap[resultInfo.tagName] || [];
        this.resultInfo = resultInfo;
        return true;
    };
    HTMLTokenizer.prototype.parseCloseTag = function () {
        var stack = this.stackMap[this.resultInfo.tagName];
        if (stack.length > 0) {
            var i = stack.pop();
            var node = this.tokens[i];
            node.close = this.resultInfo.index;
        }
        if (this.globalStack.length > 0)
            this.globalStack.pop();
    };
    HTMLTokenizer.prototype.parseOpeningTag = function () {
        var result = this.resultInfo;
        this.parseClasses();
        var node = {
            name: result.tagName, start: result.index, close: null, children: []
        };
        if (this.globalStack.length > 0) {
            this.lastTokenAdded.children.push(this.nextTokenIndex);
        }
        if (!this.nullTagsRegex.test(result.tagName)) {
            this.stackMap[result.tagName].push(this.nextTokenIndex);
            this.globalStack.push(this.nextTokenIndex);
        }
        this.tags[result.tagName].push(this.nextTokenIndex);
        this.tokens.push(node);
    };
    return HTMLTokenizer;
}());
exports.HTMLTokenizer = HTMLTokenizer;
