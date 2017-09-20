"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
;
var HTMLTokenizer = /** @class */ (function () {
    function HTMLTokenizer() {
        this.tagRegex = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\/?[^\<\>]*/g;
        this.globalStack = [];
        this.stackMap = {};
        this.all = [];
        this.tags = {};
        this.classes = {};
        this.ids = {};
        this.tokens = [];
        this.src = "";
    }
    HTMLTokenizer.prototype.reset = function () {
        this.src = "";
        this.tagRegex.lastIndex = 0;
        this.globalStack = [];
        this.stackMap = {};
        this.resultInfo = null;
        this.tags = {};
        this.ids = {};
        this.classes = {};
        this.tokens = [];
    };
    HTMLTokenizer.prototype.feed = function (html) {
        this.src += html;
        while ((this.nextResult(html))) {
            this.resultInfo.hasCloseSign ?
                this.parseCloseTag() :
                this.parseOpeningTag();
        }
    };
    Object.defineProperty(HTMLTokenizer.prototype, "tokenListResult", {
        get: function () {
            return {
                all: this.all,
                src: this.src,
                tokens: this.tokens,
                tags: this.tags,
                ids: this.ids,
                classes: this.classes
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
    HTMLTokenizer.prototype.parseTrackedAttrs = function () {
        var result;
        var trackedAttrRegex = /\s*(class|id)=('[^']+'|"[^"]+")/g;
        while ((result = trackedAttrRegex.exec(this.resultInfo.attrInfo))) {
            var attr = result[1], content = result[2];
            var dst = attr === 'id' ? this.ids : this.classes;
            var attrNames = content.replace(/['"]/g, "").split(/[\s,]/);
            for (var i in attrNames) {
                var name = attrNames[i];
                dst[name] = dst[name] || [];
                dst[name].push(this.nextTokenIndex);
            }
        }
    };
    HTMLTokenizer.prototype.nextResult = function (html) {
        var result = this.tagRegex.exec(html);
        if (!result)
            return false;
        var tagText = result[0], hasCloseSign = result[1], tagName = result[2], attrInfo = result[3];
        var resultInfo = {
            tagText: tagText,
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
            node.closeStart = this.resultInfo.index;
            node.closeEnd = this.resultInfo.index + this.resultInfo.tagText.length + 1;
        }
        if (this.globalStack.length > 0)
            this.globalStack.pop();
    };
    HTMLTokenizer.prototype.parseOpeningTag = function () {
        var nullTagsRegex = /(area|base|br|col|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)/;
        var result = this.resultInfo;
        this.parseTrackedAttrs();
        this.parseTrackedAttrs();
        var node = {
            name: result.tagName,
            openStart: result.index,
            openEnd: result.index + result.tagText.length + 1,
            closeStart: null,
            closeEnd: null,
            children: []
        };
        if (this.globalStack.length > 0) {
            this.lastTokenAdded.children.push(this.nextTokenIndex);
        }
        if (!nullTagsRegex.test(result.tagName)) {
            this.stackMap[result.tagName].push(this.nextTokenIndex);
            this.globalStack.push(this.nextTokenIndex);
        }
        this.tags[result.tagName].push(this.nextTokenIndex);
        this.all.push(this.nextTokenIndex);
        this.tokens.push(node);
    };
    return HTMLTokenizer;
}());
exports.HTMLTokenizer = HTMLTokenizer;
