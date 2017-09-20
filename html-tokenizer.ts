interface TokenIndexMap {
    [key: string]: number[];
};

type Token = {
    name: string, start: number, close: number, children: number[]
};

type ResultInfo = {
    index: number, hasCloseSign: boolean, tagName: string, attrInfo: string
};

export type TokenListResult = {
    src: string,
    all: number[];
    classes: TokenIndexMap,
    ids: TokenIndexMap,
    tags: TokenIndexMap,
    tokens: Token[]
}

export class HTMLTokenizer {
    private tagRegex: RegExp = /<(\/?)([a-zA-Z][a-zA-Z0-9]*)\/?[^\<\>]*/g;
    private globalStack: number[] = [];
    private stackMap: TokenIndexMap = {};
    private resultInfo: ResultInfo;

    private all: number[] = [];
    private tags: TokenIndexMap = {};
    private classes: TokenIndexMap = {};
    private ids: TokenIndexMap = {};
    private tokens: Token[] = [];
    private src:string = "";

    reset() {
        this.src = "";
        this.tagRegex.lastIndex = 0;
        this.globalStack = [];
        this.stackMap = {};
        this.resultInfo = null;
        this.tags = {};
        this.ids = {};
        this.classes = {};
        this.tokens = [];
    }

    feed(html) {
        this.src += html;
        while ((this.nextResult(html))) {
            this.resultInfo.hasCloseSign ?
                this.parseCloseTag() :
                this.parseOpeningTag();
        }
    }

    get tokenListResult(): TokenListResult {
        return {
            all: this.all,
            src: this.src,
            tokens: this.tokens,
            tags: this.tags,
            ids: this.ids,
            classes: this.classes
        }
    }

    private get lastTokenAdded(): Token {
        if (this.globalStack.length < 1) return null;
        var lastIndex = this.globalStack[this.globalStack.length - 1];
        return this.tokens[lastIndex];
    }

    private get nextTokenIndex() {
        return this.tokens.length;
    }

    private parseTrackedAttrs() {
        var result;
        var trackedAttrRegex = /\s*(class|id)=('[^']+'|"[^"]+")/g;
        while ((result = trackedAttrRegex.exec(this.resultInfo.attrInfo))) {
            var [, attr, content] = result;
            var dst = attr === 'id' ? this.ids : this.classes;
            var attrNames = content.replace(/['"]/g, "").split(/[\s,]/);
            for (const i in attrNames) {
                var name = attrNames[i];
                dst[name] = dst[name] || [];
                dst[name].push(this.nextTokenIndex);
            }
        }
    }

    private nextResult(html) {
        var result = this.tagRegex.exec(html);
        if (!result) return false;
        var [, hasCloseSign, tagName, attrInfo] = result;
        var resultInfo = {
            hasCloseSign: !!hasCloseSign,
            tagName, attrInfo, index: result.index
        };
        this.tags[resultInfo.tagName] = this.tags[resultInfo.tagName] || [];
        this.stackMap[resultInfo.tagName] = this.stackMap[resultInfo.tagName] || [];
        this.resultInfo = resultInfo;
        return true;
    }

    private parseCloseTag() {
        var stack = this.stackMap[this.resultInfo.tagName];
        if (stack.length > 0) {
            var i = stack.pop();
            var node = this.tokens[i];
            node.close = this.resultInfo.index;
        }
        if (this.globalStack.length > 0)
            this.globalStack.pop();
    }

    private parseOpeningTag() {
        var nullTagsRegex = /(area|base|br|col|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)/;
        var result = this.resultInfo;
        this.parseTrackedAttrs();
        this.parseTrackedAttrs();
        var node: Token = {
            name: result.tagName, start: result.index, close: null, children: []
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
    }
}