"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var html_tokenizer_1 = require("./html-tokenizer");
var Filter = /** @class */ (function () {
    function Filter(tokenizer, filtered) {
        this.tokenizer = tokenizer;
        this.filtered = filtered;
        this.children = [];
        if (!filtered) {
            this.filtered = tokenizer.tokens.reduce(function (tk, curr, i) {
                tk.push(i);
                return tk;
            }, []);
        }
    }
    Object.defineProperty(Filter.prototype, "results", {
        get: function () {
            var _this = this;
            if (!this.filtered)
                return this.tokenizer.tokens;
            return this.tokenizer.tokens.filter(function (item, i) {
                return _this.filtered.indexOf(i) >= 0;
            });
        },
        enumerable: true,
        configurable: true
    });
    Filter.prototype.getResults = function (contentOnly) {
        var _this = this;
        if (contentOnly === void 0) { contentOnly = false; }
        if (!this.filtered) {
            return this.tokenizer.src;
        }
        return this.filtered.map(function (item, i) {
            var token = _this.tokenizer.tokens[item];
            var start = contentOnly ? token.openEnd : token.openStart;
            var end = contentOnly ? token.closeStart : token.closeEnd;
            return _this.tokenizer.src.substring(start, end);
        }, []);
    };
    Filter.prototype.hasExp = function (exp) {
        var ch = this.results[0].children;
        console.log(this.results);
        for (var i in ch)
            console.log(this.tokenizer.tokens[ch[i]]);
        if (1)
            return [];
        return new Filter(this.tokenizer, this.containsExp(exp, this.filtered, this.tokenizer));
    };
    Filter.prototype.get = function (query) {
        return new Filter(this.tokenizer, this.is(query, this.filtered, this.tokenizer));
    };
    Filter.prototype.getChildren = function (query) {
        return new Filter(this.tokenizer, this.down(query, this.filtered, this.tokenizer));
    };
    Filter.prototype.getDescendants = function (query) {
        return new Filter(this.tokenizer, this.allWayDown(query, this.filtered, this.tokenizer));
    };
    Filter.prototype.hasChildren = function (query) {
        return new Filter(this.tokenizer, this.lookDown(query, this.filtered, this.tokenizer));
    };
    Filter.prototype.hasDescendants = function (query) {
        return new Filter(this.tokenizer, this.lookAllWayDown(query, this.filtered, this.tokenizer));
    };
    Filter.prototype.getOrigin = function (query, tk) {
        if (!query || query === '')
            return [];
        var _a = query.match(/^([\.\#\*]?)(.*)/), typeChar = _a[1], key = _a[2];
        if (typeChar === '*')
            return tk.all;
        else if (typeChar === '#')
            return tk.ids[key] || [];
        else if (typeChar === '.')
            return tk.classes[key] || [];
        return tk.tags[key] || [];
    };
    Filter.prototype.is = function (query, filtered, tk) {
        var origin = this.getOrigin(query, tk);
        var found = this.getIntersecionArray(filtered, origin);
        return found;
    };
    Filter.prototype.down = function (query, filtered, tk) {
        var _this = this;
        var origin = this.getOrigin(query, tk);
        var found = filtered.reduce(function (flat, item) {
            var children = tk.tokens[item].children;
            flat.push.apply(flat, _this.getIntersecionArray(children, origin));
            return flat;
        }, []);
        return found;
    };
    Filter.prototype.allWayDown = function (query, filtered, tk) {
        var _this = this;
        var origin = this.getOrigin(query, tk);
        var found = filtered.reduce(function (flat, item) {
            var children = tk.tokens[item].children;
            flat.push.apply(flat, _this.getIntersecionArray(children, origin));
            flat.push.apply(flat, _this.allWayDown(query, children, tk));
            return flat;
        }, []);
        return found;
    };
    Filter.prototype.lookDown = function (query, filtered, tk) {
        var _this = this;
        var origin = this.getOrigin(query, tk);
        var found = filtered.reduce(function (flat, item) {
            var children = tk.tokens[item].children;
            var intersection = _this.getIntersecionArray(children, origin);
            if (intersection.length > 0)
                flat.push(item);
            return flat;
        }, []);
        return found;
    };
    Filter.prototype.lookAllWayDown = function (query, filtered, tk) {
        var _this = this;
        return filtered.reduce(function (flat, item) {
            var childrenFound = _this.allWayDown(query, [item], tk);
            if (childrenFound.length > 0)
                flat.push(item);
            return flat;
        }, []);
    };
    Filter.prototype.containsExp = function (text, filtered, tk) {
        return filtered.reduce(function (flat, item) {
            var tag = tk.tokens[item];
            var start = tag.openEnd;
            var tagContent = "";
            var children = tk.tokens[item].children;
            for (var i in children) {
                var child = tk.tokens[children[i]];
                tagContent += tk.src.substring(start, child.openStart);
                start = child.closeEnd || child.openEnd; // if(i == "4") break;
            }
            tagContent += tk.src.substring(start, tag.closeStart || tag.openStart);
            console.log(tagContent);
            if (text.test(tagContent))
                flat.push(item);
            return flat;
        }, []);
    };
    Filter.prototype.getIntersecionArray = function (arr1, arr2) {
        if (!arr1)
            return arr2;
        return arr1.reduce(function (flat, item) {
            if (arr2.indexOf(item) >= 0)
                flat.push(item);
            return flat;
        }, []);
    };
    return Filter;
}());
exports.Filter = Filter;
var node_fetch_1 = require("node-fetch");
node_fetch_1.default('https://www.w3schools.com/tags/tag_input.asp', {})
    .then(function (res) { return res.text(); })
    .then(function (body) {
    body = body.replace(/[\n\r]/gm, '');
    var t1 = new Date().getTime();
    var tk = new html_tokenizer_1.HTMLTokenizer();
    tk.feed(body);
    var f = new Filter(tk.tokenListResult, null);
    var res = f.get("body").hasExp(/Example/);
    var t2 = new Date().getTime();
    console.log("result in: " + (t2 - t1));
    //var res = f.get("#main").hasDescendant(".w3-code").results;
    // console.log(res.getResults(true));
    // for(var i in res){
    //     var r = res[i];
    //     console.log(body.substring(r.openStart, r.closeEnd));
    //     console.log(body.substring(r.openEnd, r.closeStart));
    //     console.log("----");
    // }
    // var start= 57355;
    // var close= 57809;
    // console.log(body.substring(start, close+6))
});
