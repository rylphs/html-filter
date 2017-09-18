export class Filter {
    private children:any[] = [];

    constructor(private data:any, private filtered?){
        if(!filtered) {
            this.filtered = data.tk.reduce((item, i)=>i);
        }
        this.children = filtered.reduce(
            (flat, item) => {
                flat.push.apply(flat, this.data.tk[item].ch);
                return flat;
            },[]);
    }

    get results(){
        if(!this.filtered) return this.data.tk;

        return this.data.tk.filter((item, i)=> this.filtered.indexOf(i) > 0);
    }

    is(type){
        var origin  = /^\./.test(type) ?
            this.data.cl : this.data.tg;
        var found = this.getIntersecionArray(this.filtered, origin);
        return new Filter(this.data, found);
    }

    down(type):Filter{
        var origin  = /^\./.test(type) ?
            this.data.cl : this.data.tg;
        var found = this.filtered.reduce((flat, item)=>{
            var children = this.data.tk[item].ch;
            flat.push.apply(flat, this.getIntersecionArray(children, origin));
            return flat;
        }, []);
        return new Filter(this.data, found);
    }

    across(type):Filter{
        var found = <Filter>this;
        var results = [];
        while(found.children.length > 0) {
            found = found.down(type);
            results.push.apply(results, found.results);
        };
        return new Filter(this.data, results);
    }

    lookDown(type){
        var origin  = /^\./.test(type) ?
            this.data.cl : this.data.tg;
        var found = this.filtered.reduce((flat, item)=>{
            var children = this.data.tk[item].ch;
            var filtered = this.getIntersecionArray(children, origin);
            if(filtered.length > 0) flat.push(item);
            return flat;
        }, []);
        return new Filter(this.data, found);
    }

    lookAcross(type){
        var found = <Filter>this;
        var results = [];
        while(found.children.length > 0) {
            found = found.down(type);
            results.push.apply(results, found.results);
        };
        return new Filter(this.data, results);
    }

    contains(text){}

    private getChildren(arr){
        return arr.reduce((flat, item) => flat.push.apply(flat, this.data.tk[item].ch), []);
    }

    private getIntersecionArray(arr1, arr2){
        if(!arr1) return arr2;

        return arr1.filter(arr1.filter((item)=> arr2.indexOf(item) >= 0));
    }
}