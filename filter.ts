import {HTMLTokenizer, TokenListResult} from './html-tokenizer';

export class Filter {
    private children:any[] = [];

    constructor(private tokenizer:TokenListResult, private filtered?:number[]){
        if(!filtered) {
            this.filtered = tokenizer.tokens.reduce((tk, curr, i)=>{
                tk.push(i);
                return tk;
            },[]);
        }
    }

    get results(){
        if(!this.filtered) return this.tokenizer.tokens;
        return this.tokenizer.tokens.filter(
            (item, i)=> {
                return this.filtered.indexOf(i) >= 0
            }
        );
    }

    getResults(contentOnly: boolean = false){
        if(!this.filtered){
            return this.tokenizer.src;
        }
        return this.filtered.map(
            (item, i)=> {
                var token = this.tokenizer.tokens[item];
                var start = contentOnly ? token.openEnd : token.openStart;
                var end = contentOnly ? token.closeStart : token.closeEnd;
                return this.tokenizer.src.substring(start, end);
            }, []
        );
    }

    hasExp(exp:RegExp){ 
        
        return new Filter(this.tokenizer, 
            this.containsExp(exp, this.filtered, this.tokenizer));
    }

    get(query: string){
        var ch = this.results[0].children;
        console.log(this.results); 
        for(var i in ch) console.log(this.tokenizer.tokens[ch[i]]);
       // if(1) return [];
        return new Filter(this.tokenizer, 
            this.is(query, this.filtered, this.tokenizer));
    }

    getChildren(query: string){
        return new Filter(this.tokenizer, 
            this.down(query, this.filtered, this.tokenizer));
    }

    getDescendants(query:string){
         return new Filter(this.tokenizer, 
            this.allWayDown(query, this.filtered, this.tokenizer));
    }

    hasChildren(query: string){
        return new Filter(this.tokenizer, 
            this.lookDown(query, this.filtered, this.tokenizer));
    }

    hasDescendants(query: string){
         return new Filter(this.tokenizer, 
            this.lookAllWayDown(query, this.filtered, this.tokenizer));
    }

    private getOrigin(query:string, tk: TokenListResult){
        if(!query || query === '') return [];
        var [,typeChar,key] = query.match(/^([\.\#\*]?)(.*)/);
        if(typeChar === '*') return tk.all;
        else if(typeChar === '#') return tk.ids[key] || [];
        else if(typeChar === '.') return tk.classes[key] || [];
        return tk.tags[key] || [];
    }

    private is(query: string, filtered: number[], tk: TokenListResult){

        var origin = this.getOrigin(query, tk);
        var found = this.getIntersecionArray(filtered, origin);
        return found;
    }

    private down(query: string, filtered: number[], tk: TokenListResult) {
        var origin = this.getOrigin(query, tk); 
        var found = filtered.reduce((flat, item)=>{
            var children = tk.tokens[item].children;
            flat.push.apply(flat, this.getIntersecionArray(children, origin));
            return flat;
        }, []);
        return found;
    }

    private allWayDown(query:string, filtered:number[], tk: TokenListResult){
        var origin = this.getOrigin(query, tk); 
        var found = filtered.reduce((flat, item)=>{
            var children = tk.tokens[item].children;
            flat.push.apply(flat, this.getIntersecionArray(children, origin));
            flat.push.apply(flat, this.allWayDown(query, children, tk));
            return flat;
        }, []);
        return found;
    }

    private lookDown(query:string, filtered:number[], tk: TokenListResult){
       var origin = this.getOrigin(query, tk); 
       var found = filtered.reduce((flat, item)=>{
            var children = tk.tokens[item].children;
            var intersection = this.getIntersecionArray(children, origin);
            if(intersection.length > 0) flat.push(item);
            return flat;
       }, []);
       return found;
    }

    private lookAllWayDown(query:string, filtered:number[], tk: TokenListResult){
        return filtered.reduce((flat, item)=>{
            var childrenFound = this.allWayDown(query, [item], tk);
            if(childrenFound.length > 0) flat.push(item);
            return flat;
        }, []);
    }

    private containsExp(text:RegExp, filtered:number[], tk: TokenListResult){
        return filtered.reduce((flat, item)=>{
            var tag = tk.tokens[item];
            var start = tag.openEnd;
            var tagContent = "";
            var children = tk.tokens[item].children;
            for(var i in children){
                var child = tk.tokens[children[i]];
                tagContent += tk.src.substring(start, child.openStart);
                start = child.closeEnd || child.openEnd ;// if(i == "4") break;
            }
            tagContent += tk.src.substring(start, tag.closeStart || tag.openStart);
            console.log(tagContent);
            if(text.test(tagContent)) flat.push(item);
            return flat;
        }, []);
    }

    private getIntersecionArray(arr1, arr2){
        if(!arr1) return arr2;

        return arr1.reduce((flat, item)=> {
            if(arr2.indexOf(item) >= 0) flat.push(item);
            return flat;
        }, []);
    }
}

import fetch from 'node-fetch';

fetch('https://www.w3schools.com/tags/tag_input.asp', {})
    .then(res => res.text())
    .then(body => {
        body = body.replace(/[\n\r]/gm, '');
        var t1 = new Date().getTime();
        var tk = new HTMLTokenizer();
        tk.feed(body);
        var f:Filter = new Filter(tk.tokenListResult, null);
        var res = f.get("body").hasExp(/Example/);
        var t2 = new Date().getTime();
        console.log("result in: " + (t2-t1));
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