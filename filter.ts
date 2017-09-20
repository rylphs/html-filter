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

    hasText(text:string){
        return new Filter(this.tokenizer, 
            this.containsText(text, this.filtered, this.tokenizer));
    }

    get(query: string){
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

    private containsText(text, filtered:number[], tk: TokenListResult){
        return filtered.reduce((flat, item)=>{
            var tag = tk.tokens[item];
            var start = tag.openEnd;
            var c = "";
            var children = tk.tokens[item].children;
            for(var i in children){
                var child = tk.tokens[children[i]];
                c += tk.src.substring(start, child.openStart);
                start = child.closeEnd || child.openEnd ;// if(i == "4") break;
            }
            c += tk.src.substring(start, tag.closeStart || tag.openStart);
            
            if(c.indexOf(text) >= 0) flat.push(item);
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
        var res = f.get("*").hasText("Definition and Usage").results;
        var t2 = new Date().getTime();
        console.log("result in: " + (t2-t1));
        //var res = f.get("#main").hasDescendant(".w3-code").results;
        
        for(var i in res){
            var r = res[i];
            console.log(body.substring(r.openStart, r.closeEnd));
            console.log(body.substring(r.openEnd, r.closeStart));
            console.log("----");
        }

        // var start= 57355;
        // var close= 57809;
        // console.log(body.substring(start, close+6))
        
    });