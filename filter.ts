import {HTMLTokenizer, TokenListResult} from './html-tokenizer';

export class Filter {
    private children:any[] = [];

    constructor(private tokenizer:TokenListResult, private filtered?:number[]){
        /*if(!filtered) {
            this.filtered = tokenizer.tokens.reduce((tk, curr, i)=>{
                tk.push(i);
                return tk;
            },[]);
        }*/
    }

    get results(){
        if(!this.filtered) return this.tokenizer.tokens;
        return this.tokenizer.tokens.filter(
            (item, i)=> {
                return this.filtered.indexOf(i) >= 0
            }
        );
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

    hasDescendant(query: string){
         return new Filter(this.tokenizer, 
            this.lookAllWayDown(query, this.filtered, this.tokenizer));
    }

    private getOrigin(query:string, tk: TokenListResult){
        
        var origin =  /^\./.test(query) ?
            tk.classes[query.replace(/^\./,'')] : tk.tags[query];
        return origin || [];
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

    lookAllWayDown(query:string, filtered:number[], tk: TokenListResult){
        return filtered.reduce((flat, item)=>{
            var childrenFound = this.allWayDown(query, [item], tk);
            if(childrenFound.length > 0) flat.push(item);
            return flat;
        }, []);
    }

    contains(text){}

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
        var tk = new HTMLTokenizer();
        tk.feed(body);
        var f:Filter = new Filter(tk.tokenListResult, null);
        var res = f.get(".w3-col").hasDescendant(".w3-code").results;
        
        for(var i in res){
            var r = res[i];
            console.log(body.substring(r.start, r.close+6));
            console.log("----");
        }

        // var start= 57355;
        // var close= 57809;
        // console.log(body.substring(start, close+6))
        
    });