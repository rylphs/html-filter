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
    Filter.prototype.hasText = function (text) {
        return new Filter(this.tokenizer, this.containsText(text, this.filtered, this.tokenizer));
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
    Filter.prototype.containsText = function (text, filtered, tk) {
        console.log("filtered", tk.tags);
        return filtered.reduce(function (flat, item) {
            var tag = tk.tokens[item];
            var htmlText = tk.src.substring(tag.start, tag.close);
            var start = tag.start;
            var c = "";
            var children = tk.tokens[item].children;
            for (var i in children) {
                var child = tk.tokens[children[i]];
                c += tk.src.substring(start, child.start);
                start = (child.close || start) + child.name.length + 3; // if(i == "4") break;
            }
            c += tk.src.substring(start, tag.close);
            console.log(tag.name, tag.start, tag.close, c);
            if (c.indexOf(text) >= 0)
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
    var res = f.get("h2").hasText("Definition and Usage").results;
    var t2 = new Date().getTime();
    console.log("result in: " + (t2 - t1));
    //var res = f.get("#main").hasDescendant(".w3-code").results;
    for (var i in res) {
        var r = res[i];
        console.log(body.substring(r.start, r.close + 6));
        console.log("----");
    }
    // var start= 57355;
    // var close= 57809;
    // console.log(body.substring(start, close+6))
});
