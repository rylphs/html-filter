export class Filter {
    constructor(private data:any, private filtered?){
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

    down(type){
        var origin  = /^\./.test(type) ?
            this.data.cl : this.data.tg;
        var found = this.getIntersecionArray(this.filtered.ch, origin);
        return new Filter(this.data, found);
    }

    across(type){}

    lookDown(type){}

    lookAcross(type){}

    contains(text){}

    private getIntersecionArray(arr1, arr2){
        if(!arr1) return arr2;

        return arr1.filter(arr1.filter((item)=> arr2.indexOf(item) >= 0));
    }
}