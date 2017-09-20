"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var html_tokenizer_1 = require("./html-tokenizer");
var Filter = /** @class */ (function () {
    function Filter(tokenizer, filtered) {
        this.tokenizer = tokenizer;
        this.filtered = filtered;
        this.children = [];
        /*if(!filtered) {
            this.filtered = tokenizer.tokens.reduce((tk, curr, i)=>{
                tk.push(i);
                return tk;
            },[]);
        }*/
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
    Filter.prototype.hasDescendant = function (query) {
        return new Filter(this.tokenizer, this.lookAllWayDown(query, this.filtered, this.tokenizer));
    };
    Filter.prototype.getOrigin = function (query, tk) {
        var origin = /^\./.test(query) ?
            tk.classes[query.replace(/^\./, '')] : tk.tags[query];
        return origin || [];
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
    Filter.prototype.contains = function (text) { };
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
    var tk = new html_tokenizer_1.HTMLTokenizer();
    tk.feed(body);
    var f = new Filter(tk.tokenListResult, null);
    var res = f.get(".w3-col").hasDescendant(".w3-code").results;
    for (var i in res) {
        var r = res[i];
        console.log(body.substring(r.start, r.close + 6));
        console.log("----");
    }
    // var start= 57355;
    // var close= 57809;
    // console.log(body.substring(start, close+6))
});
