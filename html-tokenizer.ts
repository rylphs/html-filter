interface TokenIndexMap { 
    [key: string]: number[];
};

type Token = {
    name: string, start: number, close: number, children: number[]
};

type ResultInfo = {
    index:number, hasCloseSign: boolean, tagName: string, attrInfo: string
};

export type TokenListResult = {
    classes: TokenIndexMap, tags: TokenIndexMap, tokens:  Token[]
}

export class HTMLTokenizer {
    private tagRegex: RegExp = /<(\/?)([a-zA-Z][a-zA-Z]*)([^\<\>]*)/g;
    private nullTagsRegex = /(area|base|br|col|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)/;
    private classRegex = /\s*class=('[^']+'|"[^"]+")/;
    private globalStack: number[] = [];
    private stackMap: TokenIndexMap = {};
    private resultInfo: ResultInfo;

    public tags: TokenIndexMap = {};
    public classes: TokenIndexMap = {};
    public tokens: Token[] = [];

    reset(){
        this.classRegex.lastIndex = 0;
        this.nullTagsRegex.lastIndex = 0;
        this.tagRegex.lastIndex = 0;

        this.globalStack = [];
        this.stackMap = {};
        this.resultInfo = null;
        this.tags = {};
        this.classes = {};
        this.tokens = [];
    }

    feed(html) {
        while ((this.nextResult(html))) {
            this.resultInfo.hasCloseSign ? 
                this.parseCloseTag() :
                this.parseOpeningTag();
        }
    }

    get tokenListResult():TokenListResult {
        return {
            tokens: this.tokens, tags: this.tags, classes: this.classes
        }
    }

    private get lastTokenAdded(): Token{
        if(this.globalStack.length < 1) return null;
        var lastIndex = this.globalStack[this.globalStack.length - 1];
        return this.tokens[lastIndex];
    }

    private get nextTokenIndex() {
        return this.tokens.length;
    }

    private parseClasses() {
        var attrInfo = this.resultInfo.attrInfo;
        var classResult = attrInfo.match(this.classRegex);
        if (classResult && classResult.length > 0) {
            var classNames = classResult[1].replace(/['"]/g, "").split(/\s/);
            for (const i in classNames) {
                var className = classNames[i];
                this.classes[className] = this.classes[className] || [];
                this.classes[className].push(this.nextTokenIndex);
            }
        }
    }

    private nextResult(html){
        var result = this.tagRegex.exec(html);
        if(!result) return false;
        var [, hasCloseSign, tagName, attrInfo] = result;
        var resultInfo = {
            hasCloseSign : !!hasCloseSign,
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
        var result = this.resultInfo;
        this.parseClasses();
        var node: Token = {
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
    }
}