const fetch = require('node-fetch');


function parse(html) {
    var tagRegex = /<(\/?)([a-zA-Z][a-zA-Z]*)((\s*[\w\-]+="[^"]*")*)/g;
    var nullTags = /(area|base|br|col|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)/;
    var classRegex = /\s*class=('[^']+'|"[^"]+")/;
    var result, indexes = [];
    var tags = {};
    var classes = {};
    var tokens = [];
    var stackMap = {};
    var globalStack = [];
    while ((result = tagRegex.exec(html))) {
        
        var hasCloseSign = result[1] === '/';
        var tagName = result[2];
        tags[tagName] = tags[tagName] || [];
        stackMap[tagName] = stackMap[tagName] || [];
        var stack = stackMap[tagName];
        if(hasCloseSign){
            if(stack.length > 0){
                var i = stack.pop();
                var node = tokens[i];
                node.cl = result.index;
            }
            if(globalStack.length > 0) globalStack.pop();
        }
        else {
            var classResult = result[3].match(classRegex);
            if(classResult && classResult.length > 0){
                var classNames = classResult[1].split(/\s/);
                for(var i in classNames){
                    var className = classNames[i];
                    classes[className] = classes[className] || [];
                    classes[className].push(tokens.length);
                }
            }
            var node = {name: tagName, st: result.index, ch:[]};
            if(globalStack.length > 0){
                var parentIndex = globalStack[globalStack.length - 1];
                var parent = tokens[parentIndex];
                parent.ch.push(tokens.length); 
            }
            if(!nullTags.test(tagName)){
                stack.push(tokens.length);
                globalStack.push(tokens.length);
            }
            tags[tagName].push(tokens.length);
            tokens.push(node);
        }
        
    }
    return {
        tk: tokens, cl: classes, tg: tags
    };
}


fetch('https://www.w3schools.com/tags/tag_input.asp')
    .then(res => res.text())
    .then(body => {
        body = body.replace(/[\n\r]/gm, '');
        var tk = parse(body).tk;
        console.log(tk[0]);
        var children = tk[0].ch
        for(var i in children){
            console.log(tk[children[i]]);
        }
    });
