'use strict';

/**
 * Object 扩展
 */
 (function(){
    if(Object.prototype.clone){
        return;
    }

    /**
     * 对象复制
     * @param expKey    不复制的键正则表达式或名
     * @return          复制的对象
     */

    Object.prototype.clone = function(expKey){
        let map = new WeakMap();
        let src = this;
        let retObj = clone(src);
        map = null;
        return retObj;

        /**
         * clone对象
         * @param src   待clone对象
         * @return      克隆后的对象
         */
        function clone(src){
            let dst;
            if(nodom.isObject(src)){
                dst = new Object();
                //把对象加入map，如果后面有新克隆对象，则用新克隆对象进行覆盖
                map.set(src,dst);
                Object.getOwnPropertyNames(src).forEach((prop)=>{
                    //不克隆的键
                    if(expKey){
                        if(expKey.constructor === RegExp && expKey.test(prop)       //正则表达式匹配的键不复制
                            || expKey.constructor === String && expKey === prop     //被排除的键不复制
                            ){
                            return;
                        }
                    }
                    //数组或对象继续克隆
                    if(nodom.isObject(src[prop]) || nodom.isArray(src[prop])){
                        let co = null;
                        if(!map.has(src[prop])){  //clone新对象
                            co = clone(src[prop]);
                            //存储已克隆对象，避免重复创建或对象相互引用带来的溢出
                            map.set(src[prop],co);
                        }else{                    //从map中获取对象
                            co = map.get(src[prop]);
                        }
                        dst[prop] = co;
                    }else{  //直接复制
                        dst[prop] = src[prop];
                    }
                });
            } else if(nodom.isArray(src)){
                dst = new Array();
                //把对象加入map，如果后面有新克隆对象，则用新克隆对象进行覆盖
                map.set(src,dst);
            
                src.forEach(function(item,i){
                   if(nodom.isObject(item) || nodom.isArray(item)){
                        dst[i] = clone(item);
                    }else{  //直接复制
                        dst[i] = item;
                    } 
                });
            }
            return dst;
        }
    }
 }());
 

/**
 * @description 基础服务库
 * @author      yanglei
 * @since       1.0.0
 * @create      2016-09-28
 */
class nodom{
    //唯一主键
    static genId(){
        return this.generatedId++;
    }
    
    /******对象相关******/

    /**
     * 合并多个对象并返回
     * @param   参数数组
     * @return  返回对象
     */
    static merge(){
        for(let i=0;i<arguments.length;i++){
            if(!nodom.isObject(arguments[i])){
                throw Error.handle('invoke','nodom.merge',i,'object');    
            }
        }

        let retObj = Object.assign.apply(null,arguments);
        
        subObj(retObj);
        return retObj;
        //处理子对象
        function subObj(retObj){
            for(let o in retObj){
                if(nodom.isObject(retObj[o]) || nodom.isArray(retObj[o])){ //对象或数组
                    retObj[o] = retObj[o].clone();
                }
            }
        }
    }

    
    /**
     * 把obj2对象所有属性赋值给obj1
     */
    static assign(obj1,obj2){
        if(Object.assign){
            Object.assign(obj1,obj2);
        }else{
            nodom.getOwnProps(obj2).forEach(function(p){
                obj1[p] = obj2[p];
            });    
        }
        return obj1;
    }

    /**
     * 获取对象自有属性
     */
    static getOwnProps(obj){
        if(!obj){
            return [];
        }
        return Object.getOwnPropertyNames(obj);
    }
    /**************对象判断相关************/
    /**
     * 是否为函数
     * @param foo   检查的对象
     * @return true/false
     */
    static isFunction(foo){
        return foo !== undefined && foo !== null && foo.constructor === Function;
    }
    /**
     * 是否为数组
     * @param obj   检查的对象
     * @return true/false
     */
    static isArray(obj) {
        return Array.isArray(obj);
    }

    /**
     * 是否为对象
     * @param obj   检查的对象
     * @return true/false
     */
    static isObject(obj) {
        return obj !== null && obj !== undefined && obj.constructor === Object;
    }

    /**
     * 判断是否为整数
     */
    static isInt(x) {
        return Number.isInteger(x);
    }
    /**
     * 判断是否为number
     */
    static isNumber(v){
        return typeof v === 'number';
    }

    /**
     * 判断是否为boolean
     */
    static isBoolean(v){
        return typeof v === 'boolean';
    }
    /**
     * 判断是否为字符串
     */
    static isString(str){
        return typeof str === 'string';
    }

    /**
     * 是否为数字串
     */
    static isNumberString(str){
        return /^\d+\.?\d*$/.test(str);
    }

    /**
     * 对象/字符串是否为空
     * @param obj   检查的对象
     * @return true/false
     */
    static isEmpty(obj){
        if(obj === null || obj === undefined)
            return true;
        let tp = typeof obj;
        if(nodom.isObject(obj)){
            let keys = Object.keys(obj);
            if(keys !== undefined){
                return keys.length === 0;
            }
        }else if(tp === 'string'){
            return obj === '';
        }
        return false;
    }


    /**
     * 对象相关
     */

    
    /**
     * 找到符合符合属性值条件的对象（深度遍历）
     * @param obj       待查询对象
     * @param props     属性值对象
     * @param one       是否满足一个条件就可以，默认false
     */ 
    static findObjByProps(obj,props,one){
        if(!nodom.isObject(obj)){
            throw Error.handle('invoke','nodom.findObjByProps',0,'Object');
        }

        //默认false
        one = one || false;
        let ps = nodom.getOwnProps(props);
        let find = false;
        if(one === false){  //所有条件都满足
            find = true;
            for(let i=0;i<ps.length;i++){
                let p = ps[i];
                if(obj[p] !== props[p]){
                    find = false;
                    break;
                }
            }
        }else{              //一个条件满足
            for(let i=0;i<ps.length;i++){
                let p = ps[i];
                if(obj[p] === props[p]){
                    console.log(p);
                    find = true;
                    break;
                }
            }
        }
        if(find){
            return obj;
        }


        //子节点查找
        for(let p in obj){
            let o = obj[p];
            if(o !== null){
                if(nodom.isObject(o)){      //子对象
                    //递归查找
                    let oprops = nodom.getOwnProps(o);
                    for(let i=0;i<oprops.length;i++){
                        let item = oprops[i];
                        if(item !== null && nodom.isObject(item)){
                            let r = nodom.findObjByProps(item,props,one);
                            if(r !== null){
                                return r;
                            }           
                        }
                    }
                }else if(nodom.isArray(o)){ //数组对象
                    for(let i=0;i<o.length;i++){
                        let item = o[i];
                        if(item !== null && nodom.isObject(item)){
                            let r = nodom.findObjByProps(item,props,one);
                            if(r !== null){
                                return r;
                            }
                        }
                    }
                }
            }
        }
        return null;
    }

   /**********dom相关***********/
    /**
     * 获取dom节点
     * @param selector  选择器
     * @param findAll   是否获取所有，默认为false
     * @param pview     父对象
     * @return element/null 或 element数组/[]
     */
    static get(selector,findAll,pview){
        pview = pview || document;
        if(findAll === true){
            return pview.querySelectorAll(selector);
        }
        return pview.querySelector(selector);
    }

    /**
     * 追加子节点
     * @param el    父element
     * @param dom   要添加的dom节点或dom串
     */
    static append(el,dom){
        if(nodom.isNode(dom)){
            el.appendChild(dom);
        }else if(nodom.isString(dom)){
            let div = nodom.newEl('div');
            div.innerHTML = dom;
            nodom.transChildren(div,el);
        }
    }
    /**
     * 是否为element
     * @param el 传入的对象
     * @return true/false
     */
    static isEl(el){
        return el instanceof HTMLElement;
    }

    /**
     * 是否为node
     * @param node 传入的对象
     * @return true/false
     */
    static isNode(node){
        return node !== undefined && node !== null && (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE || node.nodeType === Node.DOCUMENT_FRAGMENT_NODE);  
    }
    
    /**
     * 获取translate3d 数据
     * @param view  element
     */
    static getTranslate(el){
        let tr = el.style.transform;
        let arr;
        if(tr && tr !== 'none'){
            arr = [];
            let va = tr.substring(tr.indexOf('(')+1,tr.indexOf(')')-1);
            va = va.split(',');
            for(let i=0;i<va.length;i++){
                arr.push(parseInt(va[i]));
            }
        }
        if(arr){
            return arr;
        }
        return [0,0,0];
    }

    /**
     * 新建dom
     * @param tagName   标签名
     * @param config    属性集合
     * @param text      innerText
     * @return 新建的elelment
     */
    static newEl(tagName,config,text){
        if(!nodom.isString(tagName) || nodom.isEmpty(tagName)){
            throw Error.handle('invoke','nodom.newEl',0,'string');   
        }
        let el = document.createElement(tagName);
        if(nodom.isObject(config)){
            nodom.attr(el,config);
        }else if(nodom.isString(text)){
            el.innerHTML = text;
        }
        return el;
    }
    /**
     * 新建svg element
     * @param tagName   标签名
     * @return          svg element
     */
    static newSvgEl(tagName){
        return document.createElementNS("http://www.w3.org/2000/svg",tagName);
    }
    /**
     * 把srcNode替换为nodes
     * @param srcNode       源dom
     * @param nodes         替换的dom或dom数组
     * @param srcPropCopy   是否保留原有dom的扩展view参数，缺省false
     */
    static replaceNode(srcNode,nodes,srcPropCopy){
        if(!nodom.isNode(srcNode)){
            throw Error.handle('invoke','nodom.replaceNode',0,'Node');
        }
        
        if(!nodom.isNode(nodes) && !nodom.isArray(nodes)){
            throw Error.handle('invoke1','nodom.replaceNode',1,'Node','Node Array');
        }

        srcPropCopy = srcPropCopy || false;

        let pnode = srcNode.parentNode;
        let bnode = srcNode.nextSibling;
        if(pnode === null){
            return;
        }
        pnode.removeChild(srcNode);
        if(!nodom.isArray(nodes)){
            nodes = [nodes];
        }
        
        nodes.forEach(function(node){
            if(bnode === undefined || bnode === null){
                pnode.appendChild(node);
            }else{
                pnode.insertBefore(node,bnode);
            }
            if(srcPropCopy !== false){
                srcPropCopy = true;
            }
            // 扩展node处理 参数复制
            if(srcPropCopy && srcNode.$isView){
                nodom.copyProp(node,srcNode);
            }
        });
    }
    /**
     * 在srcNode后面插入newNode,如果srcNode无效，则插入到第一个
     * @param newNode   新节点或数组
     * @param oldNode   旧节点
     */
    static insertAfter(newNode,srcNode,pNode){
        const me = this;
        if(!nodom.isNode(newNode)){
            throw Error.handle('invoke','nodom.insertAfter',0,'Node');
        }
        if(!nodom.isNode(srcNode) && !nodom.isNode(pNode)){
            throw Error.handle('invoke2','nodom.insertAfter',1,2,'Node');
        }
        let bNode=null;
        //如果srcNode不存在，则添加在第一个位置
        if(srcNode === undefined || srcNode === null){
            bNode = pNode.firstChild;
        }else{
            pNode = srcNode.parentNode;
            bNode = srcNode.nextSibling;
        }
        if(!nodom.isNode(pNode)){
            return;
        }
        if(bNode === null){
            if(nodom.isArray(newNode)){
                newNode.forEach(function(n){
                    if(me.isEl(n)){
                        pNode.appendChild(n);
                    }
                });
            }else{
                pNode.appendChild(newNode);
            }
        }else{
            if(nodom.isArray(newNode)){
                newNode.forEach(function(n){
                    if(me.isEl(n)){
                        pNode.insertBefore(n,bNode);
                    }
                });
            }else{
                pNode.insertBefore(newNode,bNode);
            }
        }
    }

    /**
     * 清空子节点
     * @param el
     */
    static empty(el){
        const me = this;
        if(!me.isEl(el)){
            throw Error.handle('invoke','nodom.empty',0,'Element');
        }
        let nodes = el.childNodes;
        for(let i=nodes.length-1;i>=0;i--){
            el.removeChild(nodes[i]);
        }
    }
    /**
     * 删除自己
     * @param node
     */
    static remove(node){
        const me = this;
        if(!me.isNode(node)){
            throw Error.handle('invoke','nodom.remove',0,'Node');
        }

        if(node.parentNode !== null){
            node.parentNode.removeChild(node);
        }
    }

    
    /**
     * 获取／设置属性
     * @param el    element
     * @param param 属性名，设置多个属性时用对象
     * @param value 属性值，获取属性时不需要设置
     */
    static attr(el,param,value){
        const me = this;
        if(!me.isEl(el)){
            throw Error.handle('invoke','nodom.attr',0,'Element');
        }
        if(nodom.isEmpty(param)){
            throw Error.handle('invoke','nodom.attr',1,'string','object');   
        }
        if(value === undefined || value === null){
            if(nodom.isObject(param)){ //设置多个属性
                nodom.getOwnProps(param).forEach(function(k){
                    if(k === 'value'){
                        el[k] = param[k];
                    }else{
                        el.setAttribute(k,param[k]);
                    }
                });
            }else if(nodom.isString(param)){ //获取属性
                if(param === 'value'){
                    return param.value
                }
                return el.getAttribute(param);
            }
        }else { //设置属性
            if(param === 'value'){
                    el[param] = value;
            }else{
                el.setAttribute(param,value);
            }
        }
    }
    

    /**
     * 获取或设置宽度
     * @param el        elment
     * @param value     如果为false，则获取外部width(含panodom.ng)，否则获取内部width，如果为数字，则设置width + px
     */
    static width(el,value){
        if(!nodom.isEl(el)){
            throw Error.handle('invoke','nodom.width',0,'Element');
        }
        if(nodom.isNumber(value)){
            el.style.width = value + 'px';
        }else{
            let compStyle;
            //ie 9+ firefox chrome safari
            if(window.getComputedStyle){
                compStyle = window.getComputedStyle(el,null);
            }
            if(!compStyle){
                return null;
            }
            let w = parseInt(compStyle['width']);
            if(value === true){
                let pw = parseInt(compStyle['panodom.ngLeft'])+parseInt(compStyle['panodom.ngRight']);
                w -= pw;    
            }
            return w;
        }
    }

    static height(el,value){
        if(!nodom.isEl(el)){
            throw Error.handle('invoke','nodom.height',0,'Element');
        }
        if(nodom.isNumber(value)){
            el.style.height = value + 'px';
        }else{
            let compStyle;
            //ie 9+ firefox chrome safari
            if(window.getComputedStyle){
                compStyle = window.getComputedStyle(el,null);
            }
            if(!compStyle){
                return null;
            }
            let w = parseInt(compStyle['height']);
            if(value === true){
                let pw = parseInt(compStyle['panodom.ngTop'])+parseInt(compStyle['panodom.ngBotto,']);
                w -= pw;    
            }
            return w;
        }
    }
    /**
     * 添加class
     * @param el        element
     * @param cls   类名
     */
    static addClass(el,cls){
        if(!nodom.isEl(el)){
            throw Error.handle('invoke','nodom.addClass',0,'Element');
        }
        if(nodom.isEmpty(cls)){
            throw Error.handle('invoke','nodom.addClass',1,'string');   
        }

        let cn = el.className.trim();
        if(nodom.isEmpty(cn)){
            el.className = cls;
        }else{
            let arr = cn.split(/\s+/);
            //遍历class数组，如果存在cls，则不操作
            for(let i=0;i<arr.length;i++){
                if(arr[i] === cls){
                    return;
                }
            }
            //追加cls
            arr.push(cls);
            el.className = arr.join(' ');
        }
    }
    /**
     * 移除cls
     * @param el        element
     * @param cls   类名
     */
    static removeClass(el,cls){
        if(!nodom.isEl(el)){
            throw Error.handle('invoke','nodom.removeClass',0,'Element');
        }
        if(nodom.isEmpty(cls)){
            throw Error.handle('invoke','nodom.removeClass',1,'string');   
        }

        let cn = el.className.trim();
        if(!nodom.isEmpty(cn)){
            let arr = cn.split(/\s+/);
            //遍历class数组，如果存在cls，则移除
            for(let i=0;i<arr.length;i++){
                if(arr[i] === cls){
                    arr.splice(i,1);
                    el.className = arr.join(' ');
                    return;
                }
            }
        }
    }

    /******日期相关******/
    /**
     * 日期格式化
     * @param srcDate   原始日期
     * @param format    日期格式
     * @return          日期串
     */
    static formatDate(srcDate,format){
        if(nodom.isString(srcDate)){
            //排除日期格式串,只处理时间戳
            let reg = new RegExp(/^\d+$/);
            if(reg.exec(srcDate) !== null){
                try{
                    srcDate = parseInt(srcDate);
                }catch(e){}    
            }
        }
            
        //得到日期
        srcDate = new Date(srcDate);
        // invalid date
        if(isNaN(srcDate.getDay())){
            return '';
            // throw Error.handle('invoke','nodom.formatDate',0,'date string','date');
        }

        let o = {
            "M+" : srcDate.getMonth()+1, //月份
            "d+" : srcDate.getDate(), //日
            "h+" : srcDate.getHours()%12 === 0 ? 12 : srcDate.getHours()%12, //小时
            "H+" : srcDate.getHours(), //小时
            "m+" : srcDate.getMinutes(), //分
            "s+" : srcDate.getSeconds(), //秒
            "q+" : Math.floor((srcDate.getMonth()+3)/3), //季度
            "S" : srcDate.getMilliseconds() //毫秒
        };
        let week = {
            "0" : "日",
            "1" : "一",
            "2" : "二",
            "3" : "三",
            "4" : "四",
            "5" : "五",
            "6" : "六"
       };
       //年份单独处理
       if(/(y+)/.test(format)){
           format=format.replace(RegExp.$1, (srcDate.getFullYear()+"").substr(4 - RegExp.$1.length));
       }
       //月日
       nodom.getOwnProps(o).forEach(function(k){
           if(new RegExp("("+ k +")").test(format)){
               format = format.replace(RegExp.$1, (RegExp.$1.length==1) ? (o[k]) : (("00"+ o[k]).substr((""+ o[k]).length)));
           }
       });

       //星期
       if(/(E+)/.test(format)){
           format=format.replace(RegExp.$1, ((RegExp.$1.length>1) ? (RegExp.$1.length>2 ? "/u661f/u671f" : "/u5468") : "") + week[srcDate.getDay() + ""]);
       }
       return format;
    }

    /**
     * 日期串转日期
     * @param dateStr   日期串
     * @return          日期
     */
    static toDate(dateStr){
        let date1;
        try{
            date1 = new Date(Date.parse(dateStr));
        }catch(e){

        }
        if(!date1){
            throw Error.handle('invoke','nodom.toDate',0,'date string');
        }

        //处理非标准日期串
        //14位
        if(isNaN(date1) || isNaN(date1.getDay())){
            if(dateStr.length === 14){
                dateStr = dateStr.substr(0,4) + '/' + dateStr.substr(4,2) + '/' + dateStr.substr(6,2) + ' ' +
                          dateStr.substr(8,2) + ':' + dateStr.substr(10,2) + ':' + dateStr.substr(12);
                date1 = new Date(Date.parse(dateStr));
            }else if(dateStr.length === 8){ //8位
                dateStr = dateStr.substr(0,4) + '/' + dateStr.substr(4,2) + '/' + dateStr.substr(6,2);
                date1 = new Date(Date.parse(dateStr));
            }
        }
        return date1;
    }
    /******字符串相关*****/
    /**
     * 编译字符串
     * @param str 待编译的字符串
     * @param args1,args2,args3,... 待替换的参数
     * @return 转换后的消息
     */
    static compileStr(){
        let reg = new RegExp(/\{.+?\}/);
        let arr = [];
        let r;
        let args = arguments;
        let str = args[0];
        while((r=reg.exec(str))!==null){
            let rep;
            let sIndex = r[0].substr(1,r[0].length-2);
            let pIndex = parseInt(sIndex)+1;
            if(args[pIndex] !== undefined){
                rep = args[pIndex];
            }else{
                rep = '';
            }
            str = str.replace(reg,rep);
        }
        return str;
    }
    
    /**
     * 为字符串值两端添加引号
     * @param srcStr    带转换的字符串
     * @param quot      引号 " 或 ' 或 `
     */
    static addStrQuot(srcStr,quot){
        srcStr = srcStr.replace(/\'/g,'\\\'');
        srcStr = srcStr.replace(/\"/g,'\\\"');
        srcStr = srcStr.replace(/\`/g,'\\\`');
        quot = quot || '"';
        srcStr  = quot + srcStr + quot;
        return srcStr;
    }

    /**
     * 函数调用
     * @param foo   函数
     * @param obj   this指向
     * @param args  参数数组
     */
    static apply(foo,obj,args){
        return Reflect.apply(foo,obj,args);
    }
    
}

//主键
nodom.generatedId = 1;

