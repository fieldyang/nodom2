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
        if(this.generatedId === undefined){
            this.generatedId = 1;
        }
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
/**
 * 系统配置
 * 1.配置app路径
 * 2.配置app view  路径
 * 3.配置app model 路径
 * 4.配置app viewmodel 路径
 */

nodom.config = {
	renderTick:50,								//渲染时间间隔
    appPath:'/page/',							//应用加载默认路径,
    deviceType:'ontouchend' in document?1:2,	//设备类型  1:触屏，2:非触屏	
    routerPrePath:'/route'						//路由前置路径
};


/**
 * class类，用于模拟java反射，服务于反序列化
 */
class Class{
	/**
	 * 添加class
	 * @param clsName 	类名
	 * @param cls 		class
	 */
	static add(clsName,cls){
		this.items.set(clsName,cls);
	}

	/** 
	 * 通过类名获取class
	 * @param clsName 	类名
	 * @return 			类
	 */
	static getClass(clsName){
		return this.items.get(clsName);
	}

	/**
	 * 创建实例(对象)
	 * @param clsName 	类名
	 * @param params 	参数数组
	 * @return 			根据类创建的实例
	 */
	static newInstance(clsName,params){
		let cls = this.items.get(clsName);
		if(cls === undefined){
			return null;
		}
		return Reflect.construct(cls,params||[]);
	}

	static getClassName(obj){
		if(obj.constructor){
			return obj.constructor.name;	
		}
	}
}

Class.items = new Map();

/**
 * 链式操作器
 */
class Linker{
	constructor(type,config){
		const me = this;
		let p;
		switch(type){
			case 'ajax':  //单个ajax
				p = me.ajax(config);
				break;
			case 'getfiles': //ajax get 多个文件
				p = me.getfiles(config);
				break;
			case 'dolist': 	//同步操作组
				if(arguments.length === 3){
					p = me.dolist(arguments[1],0,arguments[2]);
				}else{
					p = me.dolist(arguments[1],0);		
				}
				
		}
		return p;
	}

	/**
	 * ajax 请求
	 * @param config 	url 				请求地址
	 *					reqType 			请求类型 GET(默认) POST
	 *					params 				参数，json格式
	 *					async 				异步，默认true
	 *  				timeout 			超时时间
	 *					withCredentials 	同源策略，跨域时cookie保存，默认false
	 * 					
	 */
	ajax(config){
		return new Promise((resolve,reject)=>{
			//随机数
	        if(config.rand){  //针对数据部分，仅在app中使用
	            config.params = config.params || {};
	            config.params.$rand = Math.random();
	        }
	        const url = config.url;
	        const async = config.async===false?false:true;
			const req = new XMLHttpRequest();
		    //设置同源策略
		    req.withCredentials = config.withCredentials;
		    //类型默认为get
		    const reqType = config.reqType||'GET';
		    //超时，同步时不能设置
		    req.timeout = async?config.timeout:0;
		    
		    req.onload = ()=>{
		    	if(req.status === 200){
		    		let r = req.responseText;
			    	if(config.type === 'json'){
	                    try{
	                        r = JSON.parse(r);
	                    }catch(e){
	                        reject({type:"jsonparse"});
	                    }
	                }
	                resolve(r);
		    	}else{
		    		reject({type:'error',url:url});
		    	}
		    }

            req.ontimeout = () => reject({type:'timeout'});
	        req.onerror = () => reject({type:'error',url:url});

		    switch(reqType){
	            case 'GET':
	                //参数
	                let pa;
	                if(nodom.isObject(config.params)){
	                    let ar = [];
	                    nodom.getOwnProps(config.params).forEach(function(key){
	                        ar.push(key + '=' + config.params[key]);
	                    });
	                    pa = ar.join('&');
	                }
	                if(pa !== undefined){
	                    if(url.indexOf('?') !== -1){
	                        url += '&' + pa;
	                    }else{
	                        url += '?' + pa;
	                    }
	                }
	                req.open(reqType,url,async,config.user,config.pwd);
	                req.send(null);
	                break;
	            case 'POST':
	                let fd = new FormData();
	                for(let o in config.params){
	                    fd.append(o,config.params[o]);
	                }
	                req.open(reqType,url,async,config.user,config.pwd);
	                req.send(fd);
	                break;
	        }
	    }).catch((re)=>{
	    	switch(re.type){
	    		case "error":
	    			throw Error.handle("notexist1",nodom.words.resource,re.url);
	    		case "timeout":
	    			throw Error.handle("timeout");
	    		case "jsonparse":
	    			throw Error.handle("jsonparse");
	    	}
	    });
	}

	/**
	 * 通过get获取多个文件
	 */
	getfiles(urls){
		let promises = [];
		urls.forEach((url)=>{
			promises.push(new Promise((resolve,reject)=>{
				const req = new XMLHttpRequest();
		    	req.onload = () => resolve(req.responseText);
			    req.onerror = () => reject(url);
			    req.open("GET", url);
			    req.send();
			}));
		});

		return Promise.all(promises).catch((text)=>{
			throw Error.handle("notexist1",nodom.words.resource,text);
		});
	}

	/**
	 * 同步顺序执行
	 * @param funcArr 	函数数组
	 * @param index 	当前index	
	 * @param paramArr 	参数数组
	 * @return 			promise对象
	 */
	dolist(funcArr,index,paramArr){
		const me = this;
		return foo(funcArr,index,paramArr);
	
		function foo(fa,i,pa){
			if(fa.length === 0){
				return Promise.resolve();
			}else{
				return new Promise((resolve,reject)=>{
					if(pa !== null || pa !== undefined){
						fa[i](resolve,reject,pa[i]);
					}else{
						fa[i](resolve,reject);	
					}
				}).then((success)=>{
					if(i<fa.length-1){
						return foo(fa,i+1,pa);
					}
				});	
			}
		}
	}	
}
/**
 * 工厂基类
 */
class Factory{
	constructor(module){
		if(module !== undefined){
			this.moduleName = module.name;
		}
		//容器map
		this.items = Object.create(null);
	}

	/**
	 * 添加到工厂
	 */
	add(name,item){
		this.items[name] = item;
	}

	/**
	 * 获得item
	 */
	get(name){
		return this.items[name];
	}

 	/**
 	 * 从容器移除
 	 */
	remove(name){
		delete this.items[name];
	}

	
}

/**
 * 消息工厂
 */
class MessageFactory{
	static add(from,to,data){
		this.messages.push({from:from,to:to,msg:data,read:false});
	}

	static broadcast(){
		
		for(let i=0;i<MessageFactory.messages.length;i++){
			let msg = MessageFactory.messages[i];
			let module = ModuleFactory.get(msg.to);
			// 模块状态未未激活或激活才接受消息
			if(module && module.state === 2 || module.state === 3){
				module.receive(msg.from,msg.msg);
			}
			// 清除已接受消息，或已死亡模块的消息
			if(module && module.state >= 2){
				MessageFactory.messages.splice(i--,1);
			}
 		}
	}
}

MessageFactory.messages = new Array();
/**
 * 过滤器工厂，存储模块过滤器
 */
class ModuleFactory{
	/**
	 * 添加到工厂
	 */
	static add(name,item){
		this.items.set(name,item);
	}

	/**
	 * 获得item
	 */
	static get(name){
		return this.items.get(name);
	}

 	/**
 	 * 从容器移除
 	 */
	static remove(name){
		this.items.delete(name);
	}

	static setMain(m){
		this.mainModule = m;
	}

	static getMain(){
		return this.mainModule;
	}
}

ModuleFactory.items = new Map();
ModuleFactory.mainModule = undefined; 	//主模块
/**
 * 表达式工厂
 */
class ExpressionFactory extends Factory{
}

/**
 * 指令工厂
 */
class DirectiveFactory extends Factory{
	
}
/**
/**
 * 编译器，负责模版的编译
 * @since 1.0
 */

class Compiler {
    /**
     * 编译 
     * @param view      指定的view
     * @param module    模块
     * @return          view
     */
    static compile(view){
        return compileEl(view);
    }

    /**
     * 编译
     * @param element   待编译element
     * @return          虚拟element
     */
    static compile(module,elementStr){
        let dom = new Element();
        const div = nodom.newEl('div');
        div.innerHTML = elementStr;
        dom.isRoot = true;
        //调用编译
        this.compileDom(module,div,dom);
        return dom;
    }

    /**
     * 编译dom
     * @param ele           待编译element
     * @param parent        父节点（virtualdom）   
     * @param expressions   表达式数组
     * @param directives    指令数组
     */

    static compileDom(module,ele,parent){
        const me = this;
        let oe = new Element();
        let props = oe.props;
        //注视标志
        let isComment = false;
        switch(ele.nodeType) {
            case Node.ELEMENT_NODE:             //元素
                oe.tagName = ele.tagName;
                //遍历attributes
                for(let i=0;i<ele.attributes.length;i++){
                    let attr = ele.attributes[i];
                    let v = attr.value.trim();
                    if(attr.name.startsWith('x-')){         //指令
                        //添加到dom指令集
                        oe.directives.push(new Directive(attr.name.substr(2),v,oe,module,ele));
                    }else if(attr.name.startsWith('e-')){    //事件
                        let en = attr.name.substr(2);
                        oe.events[en] = new Event(en,attr.value.trim());
                    }else{
                        let isExpr = false;
                        if(v !== ''){
                            let ra = me.compileExpression(module,v);
                            if(nodom.isArray(ra)){
                                oe.exprProps[attr.name] = ra;
                                isExpr = true;
                            }
                        }
                        if(!isExpr){
                            oe.props[attr.name] = v;
                        }
                    }
                }
                let subEls = [];
                //子节点编译
                ele.childNodes.forEach(function(nd){
                    subEls.push(me.compileDom(module,nd,oe));
                });

                //指令按优先级排序
                oe.directives.sort((a,b)=>{
                    return DirectiveManager.getType(a.type).prio - DirectiveManager.getType(b.type).prio;
                });
                break;
            case Node.TEXT_NODE:                    //文本节点
                let txt = ele.textContent;
                if(txt === ""){  //内容为空不加入树
                    return;
                }
                let expA = me.compileExpression(module,txt);
                if(typeof expA === 'string'){   //无表达式
                    oe.textContent = expA;
                }else{                          //含表达式
                    oe.expressions = expA;    
                }
                break;
            case Node.COMMENT_NODE:             //注释
                isComment = true;
                break;
        }
        
        //添加到子节点,comment节点不需要    
        if(!isComment && parent){
            parent.children.push(oe);    
        }
        return oe;
    }
    

    /**
     * 处理含表达式串
     * @param exprStr   含表达式的串
     * @return          处理后的字符串和表达式数组
     */
    static compileExpression(module,exprStr){
        let reg = new RegExp("\{\{.+?\}\}",'g');
        if(reg.test(exprStr) === false){
            return exprStr;
        }
        let retA = new Array();
        let ite = exprStr.matchAll(/\{\{.+?\}\}/g);
        let re,oIndex=0;
        for (re of ite) {
            let ind = re.index;
            //字符串
            if(ind>oIndex){
                let s = exprStr.substring(oIndex,ind);
                retA.push(s);
            }

            //实例化表达式对象
            let exp = new Expression(re[0].substring(2,re[0].length-2),module);
            //加入工厂
            module.expressionFactory.add(exp.id,exp);
            retA.push(exp.id);
            oIndex = ind + re[0].length;
        }
        //最后的字符串
        if(re && re.index + re[0].length < exprStr.length-1){
            retA.push(exprStr.substr(re.index + re[0].length));
        }
        return retA;
    }
}

class Renderer{
	/**
	 * 添加到渲染列表
	 * @param module 		模块
	 */
	static add(module){
		const me = this;
		//非激活状态
		if(module.state !== 3){
			return;
		}
		//如果已经在列表中，不再添加
		if(me.waitList.indexOf(module.name) === -1){
			//计算优先级
			me.waitList.push(module.name);
		}
	}
	//从列表移除
	static remove(module){
		let ind;
		if((ind = me.waitList.indexOf(module.name)) !== -1){
			me.waitList.splice(ind,1);
		}
	}

	/**
	 * 队列渲染
	 */
	static render(){
		const me = this;

		//调用队列渲染
		for(let i=0;i<Renderer.waitList.length;i++){
			let m = ModuleFactory.get(Renderer.waitList[i]);
			if(!m || m.render()){
				Renderer.waitList.splice(i--,1);
			}
		}
	}
}

Renderer.waitList = [];


/**
 * 调度器，用于每次空闲的待操作序列调度
 */
class Scheduler{
	static dispatch(){
		Scheduler.tasks.forEach((foo)=>{
			if(nodom.isFunction(foo)){
				foo();	
			}
		});
	}

	static start(){
		Scheduler.dispatch();
		if(window.requestAnimationFrame){
		 	window.requestAnimationFrame(Scheduler.start);
		}else{
			window.setTimeout(Scheduler.start,nodom.config.renderTick);
		}		
	}

	/**
	 * 添加任务
	 * @param foo 	任务
	 */
	static addTask(foo){
		if(!nodom.isFunction(foo)){
			throw Error.handle("invoke","Scheduler.addTask","0","function");
		}
		if(Scheduler.tasks.indexOf(foo) !== undefined){
			Scheduler.tasks.push(foo);	
		}
	}

	/**
	 * 移除任务
	 * @param foo 	任务
	 */
	static removeTask(foo){
		if(!nodom.isFunction(foo)){
			throw Error.handle("invoke","Scheduler.removeTask","0","function");
		}
		let ind = -1;
		if((ind = Scheduler.tasks.indexOf(foo)) !== -1){
			Scheduler.tasks.splice(ind,1);
		}	
	}
}

Scheduler.tasks = [];

//消息工厂发消息
Scheduler.addTask(MessageFactory.broadcast);

//渲染器启动渲染
Scheduler.addTask(Renderer.render);
//启动调度
Scheduler.start();




class Expression{
	/**
	 * @param exprStr	表达式串
	 */
	constructor(exprStr,module){
		const me = this;
		//旧值
		me.fields = [];  				// 字段数组
		me.modelMap = {}; 				//一个expression可能被多次使用，以modelid进行区分，针对不同的模型id构建对象{modelId:{fieldValue:,value:}
		me.id = nodom.genId();
		if(module){
			me.moduleName = module.name;
			module.expressionFactory.add(me.id,me);
		}

		if(exprStr){
			me.stack = this.init(exprStr);
		}
	}

	/**
	 * 初始化，把表达式串转换成堆栈
	 * @param exprStr 	表达式串
	 */
	init(exprStr){
		const me = this;
		//字符串开始
		let startStr = undefined;
		let type = 0; // 1字符串 2变量 3函数 4过滤器
		//字符串开始结束符
		let strings = "'`\"";
        //运算符
        let operand = "()!|*/+-><=&%";
        let spaceChar = " 	";
        //堆栈
        let stack = new Array();
        let sTmp = '';
        for(let i=0;i<exprStr.length;i++){
        	let c = exprStr[i];
        	//变量和函数的空格不处理
			if((type !== 1) && spaceChar.indexOf(c) !== -1){	
				continue;
			}
        	switch(type){
        		case 1: //当前为字符串
        			//字符串标识
        			if(strings.indexOf(c) !== -1){
        				if(c === startStr){
        					me.addStr(sTmp + c,stack);
		        			startStr = undefined;
		        			sTmp = '';
		        			type = 0;
		        			continue;
		        		}
        			}
        			break;
        		case 2: //当前为变量
        			if(operand.indexOf(c) !== -1){
        				//转为函数
        				if(c === '('){
        					type = 3;
        				}else{ //变量结束
        					me.addVar(sTmp,stack);
        					sTmp = '';
	        				type = 0;		
        				}


        			}
        			break;
        		case 3: //当前为函数
        			if(c === ')'){
        				let a = sTmp.trim().split('(');
        				//函数名
        				let fn = a[0];

        				//参数
        				let pa = a[1].split(',');
        				for(let j=0;j<pa.length;j++){
        					let field = pa[j].trim();
        					pa[j] = field;

        					// 添加字段到集合 
        					me.addField(field);
        				}
        				
        				//函数入栈
        				stack.push({
        					val:fn,
        					params:pa,
        					type:'function'
        				});
        				sTmp = '';
        				type = 0;
        				continue;
        			}
        			break;
        		default:
        			//字符串开始
        			if(strings.indexOf(c) !== -1){
        				startStr = c;
        				type = 1;
        			}else if(operand.indexOf(c) === -1){ //变量开始
						type = 2;
        				if(sTmp !== ''){
        					me.addStr(sTmp,stack);
	        				sTmp = '';
        				}
        			}
        	}

        	//过滤器标志
        	let isFilter = false;
        	//过滤器
        	if(c === '|'){ 
				let j = i+1;
				let nextc = exprStr[j];
				if(nextc >= 'a' && nextc <= 'z'){
					let strCh = '';
					for(;j<exprStr.length;j++){
						let ch = exprStr[j];
						if(strings.indexOf(ch) !== -1){
							if(ch === strCh){ //字符串结束
								strCh = '';
							}else{
								strCh = ch;
							}
							
						}
						//遇到操作符且不在字符串内
						if(strCh === '' && operand.indexOf(ch) !== -1){
							break;
						}
					}
				}

				if(j>i){
					let s = exprStr.substring(i+1,j);
					if(s !== ''){
						// 过滤器串处理
						let filterArr = FilterManager.explain(s);
						//过滤器
						if(FilterManager.hasType(filterArr[0])){

							me.addFilter(filterArr,stack);
							c = '';
							exprStr = '';
							isFilter = true;
						}
					}
				}
			}

			//操作符
			if(!isFilter && type !== 1 && type !== 3 && operand.indexOf(c) !== -1){
				me.addOperand(c,stack);
			}else{
				sTmp += c;
			}
        }
        if(type === 2){ //变量处理
			me.addVar(sTmp,stack);
		}else if(type === 0 && sTmp !== ''){  //字符串
			me.addStr(sTmp,stack);
		}else if(type !== 0){
			//抛出表达式错误
			throw Error.handle('invoke','expression',0,'Node');
		}
        return stack;
    }    



	/**
	 * 表达式计算
	 * @param model 	模型 或 fieldObj对象 
	 * @param modelId 	模型id（model为fieldObj时不能为空）
	 */
	val(model,modelId){
		const me = this;
		if(!model){return '';}
		if(me.stack === null){
			return '';
		}

		let fieldObj;
		// 模型
		if(model instanceof Model){
			modelId = model.id;
			fieldObj = Object.create(null);
			//字段值
			me.fields.forEach((field)=>{
				fieldObj[field] = me.getFieldValue(model,field);
			});
			
		}else{
			fieldObj = model;
		}
		let newFieldValue = '';
		me.fields.forEach((field)=>{
			newFieldValue += fieldObj[field];
		});


		//如果对应模型的值对象不存在，需要新建
		if(me.modelMap[modelId]===undefined){
			me.modelMap[modelId] = Object.create(null);
		}
		//field值不一样，需要重新计算
		if(me.modelMap[modelId].fieldValue !== newFieldValue){
			me.modelMap[modelId].value = me.cacStack(me.stack,fieldObj,modelId);
		}
		
		me.modelMap[modelId].fieldValue = newFieldValue;
		return me.modelMap[modelId].value;
	}

	/**
	 * 添加变量
	 */
	addVar(field,stack){
		const me = this;
		let values = ['null','undefined','true','false','NaN'];
		//判断是否为值表达式 null undefined true false
		let addFlag = values.indexOf(field) === -1 ? false:true;
		addFlag = addFlag || nodom.isNumberString(field);

		//作为字符串处理   
		if(addFlag){
			this.addStr(field,stack);
		}else{
			stack.push({
				val:field.trim(),
				type:'field'
			});
			me.addField(field);
		}
	}

	/**
     * 添加字符串
     */
	addStr(str,stack){
		//如果前一个类型为字符串，则追加到前一个
		if(stack.length > 0 && stack[stack.length-1].type === "string"){ 
			stack[stack.length-1].val += str;
		}else{
			stack.push({
				val:str,
				type:'string'
			});
		}
	}

	addOperand(str,stack){
		stack.push({
			val:str,  //去掉字符串两端的空格
			type:'operand'
		});
	}

	/**
	 * 添加过滤器
	 * @param value 	value
	 * @param filterArr	过滤器数组
	 * @param stack 	堆栈
	 * @param vtype 	值类型 field字段 func函数 comp 组合 	
	 * @param extra 	附加参数
	 */
	addFilter(filterArr,stack){
		const me = this;
		let module = ModuleFactory.get(me.moduleName);
		if(stack.length>0){
			let filterStack=[];//过滤器堆栈
			let pre = stack[stack.length-1];
			let type = pre.type;

			//字段、函数、不带括号的字符串
			if(type === 'field' || type === 'function' || type==='string'){
				filterStack.push(stack.pop());
			}else if(type === 'operand' && pre.val === ')'){ //括号操作符
				//匹配括号对
				let cnt = 1;
				let j = stack.length-2;
				for(;j>=0;j--){
					// filterStack.unshift(stack[j].pop);
					if(stack[j].val === '('){
						if(--cnt === 0){
							break;
						}
					}else if(stack[j].val === ')'){
						cnt++;
					}
				}
				//拷贝堆栈元素
				filterStack = stack.slice(j,stack.length);
				//删除堆栈元素
				stack.splice(j,stack.length-j);
			}

			let expr = new Expression(null,module);
			expr.stack = filterStack;
			expr.fields = me.fields;
			//前置表达式
			if(!me.pre){
				me.pre = [];
			}
			me.pre.push(expr.id);
			// 过滤器入栈
			stack.push({
				type:'filter',
				filter:new Filter(filterArr),
				val:expr.id
			});

		}
	}

	/**
	 * 计算堆栈
	 * @param stack 	堆栈
	 * @param fieldObj 	字段对象
	 */
	cacStack(stack,fieldObj,modelId){
		const me = this;
		let retStr = '';
		let needEval = false;
		let module = ModuleFactory.get(me.moduleName);	

		stack.forEach((item)=>{
			let value = '';
			switch(item.type){
				case 'string'://字符串
					retStr += item.val;
					break;
				case 'operand'://字符串
					retStr += item.val;
					needEval = true;
					break;
				case 'field'://变量
					value = fieldObj[item.val];
					//字符串需要处理
					if(nodom.isString(value) && value !== ''){
						value = nodom.addStrQuot(value);
					}
					retStr += value;
					break;
				case 'function'://函数
					let foo = module.methodFactory.get(item.val);
					let param = [];
					if(item.params.length>0){
						item.params.forEach((p)=>{
							let pv = fieldObj[p];
							let isVal = false;
							//非数字和值，字符串两边添加引号
							if(nodom.isString(pv) && pv !== ''){
								pv = nodom.addStrQuot(pv);
							}
							param.push(pv);
						});
					}
					if(foo !== undefined && nodom.isFunction(foo)){
						value = foo.apply(module.model,param);
					}else{ //系统函数
						value = item.val + '(' + param.join(',') + ')';
						needEval = true;
					}
					retStr += value;
					break;
				case 'filter':
					// 作为前一轮已经计算
					value = module.expressionFactory.get(item.val).val(fieldObj,modelId);
					value = item.filter.exec(value,module);
					if(typeof value === 'object'){  //对象，直接赋值，不做加法
						retStr = value;
					}else{
						//字符串
						if(nodom.isString(value) && value !== ''){
							value = nodom.addStrQuot(value);
						}
						retStr += value;
					} 
			}
			
		});

		if(needEval){
			try{
				retStr = eval(retStr);	
			}catch{

			}
		}else if(nodom.isString(retStr) && retStr.charAt(0) === '"'){ //字符串去掉两边的"
			retStr = retStr.substring(1,retStr.length-1);
		}
		return retStr;
	}

	/**
	 * 添加字段到fields
	 * @param field 	字段
	 */	
	addField(field){
		const me = this;
		
		if(me.fields.indexOf(field) === -1){
			me.fields.push(field);
		}
	}
	/**
	 * 获取field值
	 * @param module 	模块
	 * @param model 	模型，可为空
	 * @param field 	字段，可以带.
	 */
	getFieldValue(model,field){
		const me = this;
		let module = ModuleFactory.get(me.moduleName);
		if(!model && module){
			model = module.model;
		}
		if(!model){
			return '';
		}
		let v = model.query(field);
		if(v === undefined && model !== module.model){
			v = module.model.query(field);
		}
		return v===undefined?'':v;
	}
}
/**
 * element class 虚拟dom element
 */
class Element{
	constructor(tag){
		const me = this;
		me.directives = [];
		me.props = {};				//属性集合
		me.events = {};				//事件集合
		me.exprProps = {};			//含表达式的属性集合
		me.changeProps = []; 		//修改后的属性
		me.removeProps = []; 		//待删除属性
		me.children = [];			//子element
		me.parentKey = undefined;	//父对象key
		me.tagName = tag||undefined;//标签
		me.dontRender = false; 		//不渲染标志，不渲染到html
		me.key = nodom.genId();
	}

	/**
	 * 渲染到virtualdom树
	 * @param module 	模块
	 * @param parent 	父节点
	 */
	render(module,parent){
		const me = this;
		
		// 设置父对象
		if(parent){
			me.parentKey = parent.key;
			// 设置modelId
			if(!me.modelId){
				me.modelId = parent.modelId;
			}
		}
		if(me.tagName !== undefined){ //element
			me.handleProps(module);
			//某些指令可能会终止渲染，如果返回false，则不继续渲染
			me.handleDirectives(module,parent);
		}else{ //textContent
			me.handleTextContent(module);
		}

		//dontrender 为false才渲染子节点
		if(!me.dontRender){
			//子节点渲染
			for(let i=0;i<me.children.length;i++){
				let item = me.children[i];
				item.render(module,me);
				//dontRender 删除
				if(item.dontRender){
					me.removeChild(item);
					i--;
				}
			}	
		}
		return true;
	}
	/**
	 * 渲染到html element
	 * @param module 	模块
	 * @param el 		对应的element
	 * @param type 		类型
	 * @param parent 	父虚拟dom
	 */
	renderToHtml(module,params){
		const me = this;
		let el,el1;
		let type = params.type;
		let parent = params.parent;
		let modelFac = module.modelFactory;
		//构建el
		if(!parent){
			el = module.container;
		}else{
			if(type === 'fresh' || type === 'add' || type === 'text'){
				el = module.container.querySelector("[key='"+ parent.key +"']")
			}else if(me.tagName !== undefined){  //element节点才可以查找
				el = module.container.querySelector("[key='"+ me.key +"']");
			}	
		}

		if(!el){
			return;
		}
		
		switch(type){
			case 'fresh': 	//首次渲染
				if(me.tagName){
					el1 = newEl(me,null,el);
					//首次渲染需要生成子孙节点
					genSub(el1,me);	
				}else{
					el1 = newText(me.textContent,me);
				}
				el.appendChild(el1);
				break;
			case 'text': 	//文本更改
				if(!parent || !parent.children){
					break;
				}
				
				let ind = parent.children.indexOf(me);
				if(ind !== -1){
					let div = document.querySelector("[key='" + me.key + "']");
					//element或fragment
					if(me.type === 'html'){
						if(div !== null){
							div.innerHTML = '';
							div.appendChild(me.textContent);
						}else{
							div = newText(me.textContent);
							nodom.replaceNode(el.childNodes[ind],div);
						}
					}else{
						el.childNodes[ind].textContent = me.textContent;
					}
				}
				break;
			case 'upd': 	//修改属性
				//删除属性
				if(params.removeProps){
					params.removeProps.forEach((p)=>{
						el.removeAttribute(p);
					});
				}
				//修改属性
				params.changeProps.forEach((p)=>{
					if(el.tagName === 'INPUT' && p.p==='value'){  //文本框单独处理
						el.value = p.v;
					}else{
						el.setAttribute(p.p,p.v);	
					}
				});
				break;
			case 'rep': 	//替换节点
				el1 = newEl(me,parent);
				nodom.replaceNode(el,el1);
				break;
			case 'add': 	//添加
				if(me.tagName){
					el1 = newEl(me,parent,el);
					genSub(el1,me);
				}else{
					el1 = newText(me.textContent);
				}
				if(params.index === el.childNodes.length){
					el.appendChild(el1);
				}else{
					el.insertBefore(el1,el.childNodes[params.index]);
				}
				
		}

		/**
		 * 新建element节点
		 */
		function newEl(vdom,parent,parentEl){
			//创建element
			let el = document.createElement(vdom.tagName);
			//设置属性
			nodom.getOwnProps(vdom.props).forEach((p)=>{
				el.setAttribute(p,vdom.props[p]);
			});
			el.setAttribute('key',vdom.key);
			vdom.handleEvents(module,el,parent,parentEl);
			return el;
		}

		/**
		 * 新建文本节点
		 */
		function newText(text,dom){
			if(dom && 'html' === dom.type){ //html fragment 或 element
				let div = nodom.newEl('div');
				div.setAttribute('key',dom.key);
				div.appendChild(text);
				return div;
			}else{
				return document.createTextNode(text);	
			}
		}

		/**
		 * 生成子节点
		 * @param pEl 	父节点
		 * @param vNode 虚拟dom父节点	
		 */
		function genSub(pEl,vNode){
			if(vNode.children && vNode.children.length>0){
				vNode.children.forEach((item)=>{
					let el1;
					if(item.tagName){
						el1 = newEl(item,vNode,pEl);
						genSub(el1,item);
					}else{
						el1 = newText(item.textContent,item);
					}

					pEl.appendChild(el1);
				});
			}
		}
	
	}

	/**
	 * 克隆
	 */
	clone(){
		const me = this;
		let dst = new Element();

		//简单属性
		nodom.getOwnProps(me).forEach((p)=>{
			if(typeof me[p] !== 'object'){
				dst[p] = me[p];
			}
		});

		me.directives.forEach((d)=>{
			dst.directives.push(d);
		});

		//普通
		nodom.getOwnProps(me.props).forEach((d)=>{
			dst.props[d]=me.props[d];
		});

		//表达式属性
		nodom.getOwnProps(me.exprProps).forEach((d)=>{
			dst.exprProps[d]=me.exprProps[d];
		});

		//事件
		nodom.getOwnProps(me.events).forEach((d)=>{
			dst.events[d]=me.events[d].clone();
		});

		//表达式
		dst.expressions = me.expressions;
	
		me.children.forEach((d)=>{
			dst.children.push(d.clone());
		});
		return dst;
	}

	/**
	 * 处理指令
	 * 
	 */
	handleDirectives(module,parent){
		const me = this;
		if(me.dontRender){
			return false;
		}
		const dirs = me.directives;
		for(let i=0;i<dirs.length && !me.dontRender;i++){
			DirectiveManager.exec(dirs[i],me,module,parent);
		}
		return true;
	}



	/**
	 * 表达式预处理，添加到expression计算队列
	 */
	handleExpression(exprArr,module){
		const me = this;
		if(me.dontRender){
			return;
		}
		let value = '';
		let model = module.modelFactory.get(me.modelId);
		exprArr.forEach((v)=>{
			if(typeof v === 'number'){ 	//处理表达式
				// 统一添加到表达式计算队列
				let v1 = module.expressionFactory.get(v).val(model);
				//html或 fragment
				if(v1 instanceof DocumentFragment || nodom.isEl(v1)){
					// 设置类型
					me.type = 'html';
					return v1;
				}
				value += v1;
			}else{
				value += v;
			}
		});
		return value;
	}

	/**
	 * 处理属性（带表达式）
	 */
	handleProps(module){
		const me = this;
		if(me.dontRender){
			return;
		}
		nodom.getOwnProps(me.exprProps).forEach((item)=>{
			//属性值为数组，则为表达式
			if(nodom.isArray(me.exprProps[item])){
				me.props[item] = me.handleExpression(me.exprProps[item],module);
			}else if(me.exprProps[item] instanceof Expression){ //单个表达式
				me.props[item] = me.exprProps[item].val(module.modelFactory.get(me.modelId));
			}
		});
	}

	/**
	 * 处理文本（表达式）
	 */
	handleTextContent(module){
		const me = this;
		if(me.dontRender){
			return;
		}
		if(me.expressions !== undefined){
			me.textContent =  me.handleExpression(me.expressions,module);
		}
	}

	/**
	 * 处理事件
	 * @param module 
	 * @param model
	 * @param el
	 * @param parent
	 */
	handleEvents(module,el,parent,parentEl){
		const me = this;
		
		if(me.events.length === 0){
			return;
		}
		
		nodom.getOwnProps(me.events).forEach((en)=>{
			let ev = me.events[en];
			if(ev.delg && parent){  //代理到父对象
				ev.delegateTo(module,me,el,parent,parentEl);
			}else{
				ev.bind(module,me,el);
			}
		});
	}

	/**
	 * 移除指令
	 * @param directives 	待删除的指令集
	 */
	removeDirectives(delDirectives){
		const me = this;
        for(let i=me.directives.length-1;i>=0;i--){
            let d = me.directives[i];
            for(let j=0;j<delDirectives.length;j++){
                if(d.type===delDirectives[j]){
                    me.directives.splice(i,1);
                }
            }
        }
	}

	/**
	 * 是否有某个类型的指令
	 * @param directiveType 	指令类型名
	 * @return true/false
	 */
	hasDirective(directiveType){
		const me = this;
		for(let i=0;i<me.directives.length;i++){
			if(me.directives[i].type === directiveType){
				return true;
			}
		}
		return false;
	}

	/**
	 * 获取某个类型的指令
	 * @param directiveType 	指令类型名
	 * @return directive
	 */
	getDirective(directiveType){
		const me = this;
		for(let i=0;i<me.directives.length;i++){
			if(me.directives[i].type === directiveType){
				return me.directives[i];
			}
		}
	}

	/**
	 * 添加子节点
     * @param dom 	子节点
	 */
	add(dom){
		me.children.push(dom);
	}
	/**
	 * 从虚拟dom树和html dom树删除自己
	 * @param module 	模块
	 * @param html 		删除html中的
	 */
	remove(module,html){
		const me = this;
		// 从父树中移除
		if(me.parentKey !== undefined){
			let p = module.renderTree.query(me.parentKey);
			if(p){
				p.removeChild(me);
			}
		}
		
		// 删除html dom节点
		if(html && module && module.container){
			let el = module.container.querySelector("[key='"+ me.key +"']");
			if(el !== null){
				nodom.remove(el);
			}
		}
		me.free();
	}


	/**
	 * 从html删除
	 */
	removeFromHtml(module){
		const me = this;
		let el = module.container.querySelector("[key='"+ me.key +"']");
		if(el !== null){
			nodom.remove(el);
		}
	}

	/**
	 * 移除子节点
	 */
	removeChild(dom){
		const me = this;
		let ind = -1;
		// 移除
		if(nodom.isArray(me.children) && (ind = me.children.indexOf(dom)) !== -1) {
			me.children.splice(ind,1);
		}
	}

	/**
	 * 替换目标节点
	 * @param dst 	目标节点　
	 */
	replace(dst){
		const me = this;
		if(!dst.parent){
			return false;
		}
		let ind = dst.parent.children.indexOf(dst);
		if(ind === -1){
			return false;
		}
		//替换
		dst.parent.children.splice(ind,1,me);
		return true;
	}

	/**
	 * 是否包含节点
	 * @param dom 	包含的节点 
	 */
	contains(dom){
		const me = this;
		for(;dom!==undefined && dom!==me;dom=dom.parent);
		return dom !== undefined;
	}

	/**
	 * 查找子孙节点
	 * @param key 	element key
	 * @return vdom element/undefined
	 */
	query(key){
		const me = this;
		if(me.key === key){
			return me;
		}
		for(let i=0;i<me.children.length;i++){
			let dom = me.children[i].query(key);
			if(dom){
				return dom;
			}
		}
	}


	queryProp(prop,value){
		const me = this;
		if(me.key === key){
			return me;
		}
		for(let i=0;i<me.children.length;i++){
			let dom = me.children[i].query(key);
			if(dom){
				return dom;
			}
		}	
	}
	/**
	 * 比较节点
	 * @param dst 	待比较节点
	 * @return	{type:类型 text/rep/add/upd,node:节点,parent:父节点, 
	 * changeProps:改变属性,[{p:p1,v:v1},{p:p2,v:v2},...],delProps:删除属性,[p1,p2,...]}
	 */
	compare(dst,retArr,parentNode){
		if(!dst){
			return;
		}
		const me = this;
		let re = Object.create(null);
		let change = false;
		
		if(me.tagName === undefined){ //文本节点
			if(dst.tagName === undefined){
				if(me.textContent !== dst.textContent){
					re.type = 'text';
					change = true;	
				}
			}else{ //节点类型不同
				re.type = 'rep';
				change = true;
			}
		}else{	//element节点
			if(me.tagName !== dst.tagName){	//节点类型不同
				re.type = 'rep';
				change = true;
			}else{	//节点类型相同，可能属性不同
				//检查属性，如果不同则放到changeProps
				re.changeProps = [];
				//待删除属性
				re.removeProps = [];
				
				//删除或增加的属性的属性
				nodom.getOwnProps(dst.props).forEach((p)=>{
					if(!me.props.hasOwnProperty(p)){
						re.removeProps.push(p);
					}
				});

				//修改后的属性
				nodom.getOwnProps(me.props).forEach((p)=>{
					if(me.props[p] !== dst.props[p]){
						re.changeProps.push({p:p,v:me.props[p]});
					}
				});
				if(re.changeProps.length>0 || re.removeProps.length>0){
					change = true;
					re.type = 'upd';
				}
			}
		}
		//改变则加入数据
		if(change){
			re.node = me;
			if(parentNode){
				re.parent = parentNode;
			}
			retArr.push(re);
		}

		//子节点处理
		if(!me.children || me.children.length === 0){
			// 旧节点的子节点全部删除
			if(dst.children && dst.children.length > 0){
				dst.children.forEach((item)=>{
					retArr.push({
						type:'del',
						node:item
					});
				});
			}	
		}else{
			//全部新加节点
			if(!dst.children || dst.children.length === 0){
				me.children.forEach((item)=>{
					retArr.push({
						type:'add',
						node:item,
						parent:me
					});	
				});
			}else{  //都有子节点
				me.children.forEach((dom1,ind)=>{
					let dom2 = dst.children[ind];
					// dom1和dom2相同key
					if(!dom2 || dom1.key !== dom2.key){
						dom2 = undefined;
						//找到key相同的节点
						for(let i=0;i<dst.children.length;i++){
							//找到了相同key
							if(dom1.key === dst.children[i].key){
								dom2 = dst.children[i];
								break;
							}
						}
					}
					if(dom2 !== undefined){
						dom1.compare(dom2,retArr,me);
						//设置匹配标志，用于后面删除没有标志的节点
						dom2.finded = true;
					}else{
						// dom1为新增节点
						retArr.push({
							type:'add',
							node:dom1,
							parent:me,
							index:ind   //在父节点中的位置
						});
					}
				});
				
				//未匹配的节点设置删除标志
				if(dst.children && dst.children.length > 0){
					dst.children.forEach((item)=>{
						if(!item.finded){
							retArr.push({
								type:'del',
								node:item,
								parent:dst
							});
						}
					});
				}
			}
			
		}
	}
}

/**
 * @description 事件类
 * @author      yanglei
 * @since       1.0
 */
 /**
  * 事件分为自有事件和代理事件
  * 自有事件绑定在view上
  * 代理事件绑定在父view上，存储于事件对象的events数组中
  * 如果所绑定对象已存在该事件名对应的事件，如果是代理事件，则添加到子事件队列，否则替换view自有事件
  * 事件执行顺序，先执行代理事件，再执行自有事件
  */
class Event{
    /**
     * @param eventName     事件名
     * @param eventStr      事件串(可空) 方法名[:delg(代理到父对象):nopopo(禁止冒泡):once(只执行一次):useCapture]
     */
    constructor(eventName,eventStr){
        const me = this;
        me.events = undefined;  //子事件，存储代理事件集合，结构为{'click':[ev1,ev2],'swipe':[],...}
        me.name = eventName;

        //如果事件串不为空，则不需要处理
        if(eventStr){
            eventStr.split(':').forEach((item,i)=>{
                item = item.trim();
                if(i===0){    //事件方法
                    me.handler = item;
                }else{              //事件附加参数
                    me[item] = true;
                }
            });
        }
        //触屏事件根据设备类型进行处理
        if(nodom.config.deviceType === 1){ //触屏设备
            switch(me.name){
                case 'click':
                    me.name = 'tap';
                    break;
                case 'mousedown':
                    me.name = 'touchstart';
                    break;
                case 'mouseup':
                    me.name = 'touchend';
                    break;
                case 'mousemove':
                    me.name = 'touchmove';
                    break;
            }
        }else{  //转非触屏
            switch(me.name){
                case 'tap':
                    me.name = 'click';
                    break;
                case 'touchstart':
                    me.name = 'mousedown';
                    break;
                case 'touchend':
                    me.name = 'mouseup';
                    break;
                case 'touchmove':
                    me.name = 'mousemove';
                    break;
            }
        }

    }

    /**
     * 事件触发
     * @param e         事件
     */
    fire(e){
        const me = this;
        const module = ModuleFactory.get(me.moduleName);
        const dom = module.renderTree.query(me.domKey);
        const el = module.container.querySelector("[key='" + me.domKey + "']");
        const model = module.modelFactory.get(dom.modelId);
        //如果capture为true，则先执行自有事件，再执行代理事件，否则反之
        if(me.capture){
            handleSelf(e,model,module,el);
            handleDelg(e,model,module,el);
        }else{
            if(handleDelg(e,model,module,el)){
                handleSelf(e,model,module,el);
            }
        }

        //判断是否清除事件
        if(me.events !== undefined && me.events[me.name].length === 0 && me.handler === undefined){
            if(ExternalEvent.TouchEvents[me.name]){
                ExternalEvent.unregist(me,el);
            }else{
                if(el !== null){
                    el.removeEventListener(me.name,me.handleEvent); 
                }
            }
        }

        /**
         * 处理自有事件
         * @param model     模型
         * @param e         事件
         * @param module    模块
         * @param el        事件element
         */
        function handleDelg(e,model,module,el){
            //代理事件执行
            if(me.events === undefined){
                return true;
            }
            let arr = me.events[me.name];
            if(nodom.isArray(arr)){
                if(arr.length > 0){
                    for(let i=0;i<arr.length;i++){
                        // 找到对应的子事件执行
                        if(arr[i].el && arr[i].el.contains(e.target)){
                            //执行
                            arr[i].fire(e);
                            //执行一次，需要移除
                            if(arr[i].once){
                                me.removeSubEvt(arr[i]);
                            }
                            //禁止冒泡
                            if(arr[i].nopopo){
                                return false;
                            }
                        }
                    }    
                }else{ //删除该事件
                    me.events.delete(me.name);
                }
            }
            return true;
        }

        /**
         * 处理自有事件
         * @param model     模型
         * @param e         事件
         * @param module    模块
         * @param el        事件element
         */
        function handleSelf(e,model,module,el){
            let foo = module.methodFactory.get(me.handler);
            //自有事件
            if(nodom.isFunction(foo)){
                //禁止冒泡
                if(me.nopopo){
                    e.stopPropagation();
                }
                nodom.apply(foo,model,[e,module,el,dom]);
                //事件只执行一次，则删除handler
                if(me.once){  
                    delete me.handler;
                }
            }
        }
    }
        
    /**
     * 绑定事件
     * @param module    模块
     * @param vdom      虚拟dom
     * @param el        element
     
     */
    bind(module,vdom,el){
        const me = this;
        me.domKey = vdom.key;
        me.moduleName = module.name;
        //触屏事件
        if(ExternalEvent.TouchEvents[me.name]){
            ExternalEvent.regist(me,el,module,vdom);
        }else{
            me.handleEvent = function(e){
                me.fire(e);
            }
            el.addEventListener(me.name,me.handleEvent,me.capture);
        }
    }

    /**
     * 
     * 事件代理到父对象
     * @param parent    父虚拟dom
     * @param el        事件作用的html element 
     * @param model     模型
     * @param module    模块
     */
    delegateTo(module,vdom,el,parent,parentEl){
        const me = this;
        me.domKey = vdom.key;
        me.moduleName = module.name;

        //如果不存在父对象，则用body
        if(!parentEl){
            parentEl = document.body;
        }

        //父节点如果没有这个事件，则新建，否则直接指向父节点相应事件
        if(!parent.events[me.name]){
            let ev = new Event(me.name);
            ev.bind(module,parent,parentEl);
            parent.events[me.name] = ev;
        }

        parent.events[me.name].addSubEvt(me);
    }

    /**
     * 添加子事件
     * @param ev    事件
     */
    addSubEvt(ev){
        const me = this;
        if(!me.events){
            me.events = Object.create(null);
        }
        
        //事件类型对应的数组
        if(!me.events[me.name]){
            me.events[me.name] = new Array();
        }
        me.events[me.name].push(ev);
    }

    /**
     * 移除子事件
     * @param ev    子事件
     */
    removeSubEvt(ev){
        const me = this;
        if(me.events === undefined || me.events[ev.name] === undefined){
            return;
        }
        let ind = me.events[ev.name].indexOf(ev);
        if(ind !== -1){
            me.events[ev.name].splice(ind,1);
            if(me.events[ev.name].length === 0){
                me.events.delete(ev.name);
            }
        }
    }

    clone(){
        const me = this;
        let evt = new Event(me.name);
        let arr = ['delg','once','nopopo','useCapture','handler','handleEvent','module'];
        arr.forEach((item)=>{
            evt[item] = me[item];
        });
        return evt;
    }
}

/****************扩展事件*********************/


class ExternalEvent{
    /**
     * 注册事件
     * @param evtObj    event对象
     */
    static regist(evtObj,el){
        let evt = ExternalEvent.TouchEvents[evtObj.name];
        //如果绑定了，需要解绑
        if(!nodom.isEmpty(evtObj.touchListeners)){
            ExternalEvent.unregist(evtObj);
        }
        
        if(!el){
            const module = ModuleFactory.get(evtObj.moduleName);
            el = module.container.querySelector("[key='" + evtObj.domKey + "']");    
        }

        // el不存在
        evtObj.touchListeners = {};
        if(evt && el !== null){
            // console.log(el);
            // 绑定事件组
            nodom.getOwnProps(evt).forEach(function(ev){
                //先记录下事件，为之后释放
                evtObj.touchListeners[ev] = function(e){
                    evt[ev](e,evtObj);
                }
                el.addEventListener(ev,evtObj.touchListeners[ev],evtObj.capture);
            });
        }
    }

    /**
     * 取消已注册事件
     * @param evtObj    event对象
     */
    static unregist(evtObj,el){
        let evt = nodom.Event.TouchEvents[evtObj.eventName];
        if(!el){
            const module = ModuleFactory.get(evtObj.moduleName);
            el = module.container.querySelector("[key='" + evtObj.domKey + "']");
        }
        if(evt){
            // 解绑事件
            if(el !== null){
                nodom.getOwnProps(evtObj.touchListeners).forEach(function(ev){
                    el.removeEventListener(ev,evtObj.touchListeners[ev]);
                });    
            }
        }  
    }

}

/**
 * 触屏事件
 */

ExternalEvent.TouchEvents = {
    tap:{
        touchstart:function(e,evtObj){
            let tch = e.touches[0];
            evtObj.extParams={
                pos : {sx:tch.pageX,sy:tch.pageY,t:Date.now()}
            }
        },
        touchmove:function(e,evtObj){
            let pos = evtObj.extParams.pos;
            let tch = e.touches[0];
            let dx = tch.pageX - pos.sx;
            let dy = tch.pageY - pos.sy;
            //判断是否移动
            if(Math.abs(dx) > 5 || Math.abs(dy) > 5){
                pos.move = true;  
            }
        },
        touchend:function(e,evtObj){
            let pos = evtObj.extParams.pos;
            let dt = Date.now() - pos.t;
            //点下时间不超过200ms
            if(pos.move === true || dt > 200){
                return;
            }
            evtObj.fire(e);
        }
    },
    swipe:{
        touchstart:function(e,evtObj){
            let tch = e.touches[0];
            let t = Date.now();
            evtObj.extParams={
                swipe:{
                    oldTime:[t,t],
                    speedLoc:[{x:tch.pageX,y:tch.pageY},{x:tch.pageX,y:tch.pageY}],
                    oldLoc:{x:tch.pageX,y:tch.pageY}
                }
            }
        },
        touchmove:function(e,evtObj){
            let nt = Date.now();
            let tch = e.touches[0];
            let mv = evtObj.extParams['swipe'];
            //50ms记录一次
            if(nt-mv.oldTime > 50){
                mv.speedLoc[0] = {x:mv.speedLoc[1].x,y:mv.speedLoc[1].y};
                mv.speedLoc[1] = {x:tch.pageX, y:tch.pageY};
                mv.oldTime[0] = mv.oldTime[1];
                mv.oldTime[1] = nt;
            }
            mv.oldLoc={x:tch.pageX,y:tch.pageY};
        },
        touchend:function(e,evtObj){
            let mv = evtObj.extParams['swipe'];
            let nt = Date.now();

            //取值序号 0 或 1，默认1，如果释放时间与上次事件太短，则取0
            let ind=(nt-mv.oldTime[1]<30)?0:1;
            let dx = mv.oldLoc.x - mv.speedLoc[ind].x;
            let dy = mv.oldLoc.y - mv.speedLoc[ind].y;
            let s = Math.sqrt(dx*dx + dy*dy);
            let dt = nt - mv.oldTime[ind];
            //超过300ms 不执行事件
            if(dt > 300 || s < 10){
                return;
            }
            let v0 = s/dt;
            //速度>0.1,触发swipe事件
            if(v0 > 0.05){
                let sname = '';
                if(dx<0 && Math.abs(dy/dx)<1){
                    e.v0 = v0;   //添加附加参数到e
                    sname = 'swipeleft';
                }
                if(dx>0 && Math.abs(dy/dx)<1){
                    e.v0 = v0;
                    sname = 'swiperight';
                }
                if(dy>0 && Math.abs(dx/dy)<1){
                    e.v0 = v0;
                    sname = 'swipedown';
                }
                if(dy<0 && Math.abs(dx/dy)<1){
                    e.v0 = v0;
                    sname = 'swipeup';
                }
                if(evtObj.name === sname){
                    evtObj.fire(e);
                }
            }
        }
    }
}

ExternalEvent.TouchEvents['swipeleft'] = ExternalEvent.TouchEvents['swipe'];
ExternalEvent.TouchEvents['swiperight'] = ExternalEvent.TouchEvents['swipe'];
ExternalEvent.TouchEvents['swipeup'] = ExternalEvent.TouchEvents['swipe'];
ExternalEvent.TouchEvents['swipedown'] = ExternalEvent.TouchEvents['swipe'];
    



/*
 * 消息js文件 中文文件
 * @author yanglei
 * @since  v1.0
 * @date   2017-2-25
 */
nodom.words = {
	system:"系统",
	module:"模块",
	moduleClass:'模块类',
	model:"模型",
	directive:"指令",
	expression:"表达式",
	event:"事件",
	method:"方法",
	filter:"过滤器",
	filterType:"过滤器类型",
	data:"数据",
	dataItem:'数据项',
	route:'路由',
	routeView:'路由容器',
	plugin:'插件',
	resource:'资源',
	method:'方法'
};
/*异常消息*/
nodom.ErrorMsgs = {
	"unknown":"未知错误",
	"paramException":"{0}'{1}'方法参数错误，请参考api",
	"invoke":"{0}方法调用参数{1}必须为{2}",
	"invoke1":"{0}方法调用参数{1}必须为{2}或{3}",
	"invoke2":"{0}方法调用参数{1}或{2}必须为{3}",
	"invoke3":"{0}方法调用参数{1}不能为空",
	"exist":"{0}已存在",
	"exist1":"{0}'{1}'已存在",
	"notexist":"{0}不存在",
	"notexist1":"{0}'{1}'不存在",
	"notupd":"{0}不可修改",
	"notremove":"{0}不可删除",
	"notremove1":"{0}{1}不可删除",
	"namedinvalid":"{0}{1}命名错误，请参考用户手册对应命名规范",
	"initial":"{0}初始化参数错误",
	"jsonparse":"JSON解析错误",
	"timeout":"请求超时"
};

/*form消息*/
nodom.FormMsgs = {
	"type":"请输入有效的{0}",
	"unknown":"输入错误",
	"required":"不能为空",
	"min":"最小输入值为{0}",
	"max":"最大输入值为{0}"
};
/**
 * @description 异常处理类
 * @author      yanglei
 * @since       1.0.0
 */
class Error {
   /**
    * 按照消息编号进行处理并返回消息内容
    * @param 异常名
    * @param args1,args2,args3,... 待替换的参数
    * @return 转换后的消息
    */
   
   static handle(errname){
      var reg = new RegExp(/\{.+?\}/);
      
      var msg = nodom.ErrorMsgs[errname];
      if(msg === undefined){
        return "未知错误";
      }
      var args = [msg];
      for(var i=1;i<arguments.length;i++){
        args.push(arguments[i]);
      }

      return nodom.compileStr.apply(null,args);
   }
};
class ModelFactory extends Factory{}


/**
 * 模型类
 */
class Model{
	constructor(data,module){
		const me = this;
		me.data = data;
		me.fields = {};
		// modelId
		me.id = nodom.genId();
		//添加到model工厂
		if(module){
			me.moduleName = module.name;
			if(module.modelFactory){
				module.modelFactory.add(me.id,me);
			}
		}

		// 给data设置modelid
		data.$modelId = me.id;
		me.addSetterGetter(data,module);
	}

	/**
	 * 设置属性，可能属性之前不存在，用于在初始化不存在的属性创建和赋值
     * @param key       键，可以带“.”，如a, a.b.c
     * @param value     对应值
	 */
	set(key,value){
		const me = this;
        let fn,data;
        let index = key.lastIndexOf('.');
        if(index !== -1){  //key中有“.”
            fn = key.substr(index + 1); 
            key = key.substr(0,index);
            data = me.query(key);
        }else{
            fn = key;
            data = me.data;
        }

        //数据不存在
        if(data === undefined){
		    throw Error.handle('notexist1',nodom.words.dataItem,key);
        }

        if(data[fn] !== value){
            let module = ModuleFactory.get(me.moduleName);
        	// object或array需要创建新model
            if(nodom.isObject(value) || nodom.isArray(value)){
        		new Model(value,module);
        	}
            let model = module.modelFactory.get(data.$modelId);
            

        	if(model){
                //如果不存在，则需要定义 set 方法
                if(data[fn] === undefined){
                    me.defineProp(data,fn);
                }
                model.update(fn,value);
            }
            data[fn] = value;
        }
    }

    /**
     * 更新
     * @param field 	字段名或空(数组更新)
     * @param value 	字段对应的新值
     */
    update(field,value){
    	const me = this;
    	let change = false;

    	//对象设置值
    	if(nodom.isString(field)){
    		if(me.fields[field] !== value){
	    		me.fields[field] = value;
	    		change = true;
	    	}
    	}
        //添加到模块数据改变
    	if(change){
    		ModuleFactory.get(me.moduleName).dataChange(me);	
    	}
    }
    /**
     * 为对象添加setter
     */
    addSetterGetter(data){
    	const me = this;
    	if(nodom.isObject(data)){
    		nodom.getOwnProps(data).forEach(function(p){
    			let v = data[p];
    			if(nodom.isObject(v) || nodom.isArray(v)){
    				new Model(v,ModuleFactory.get(me.moduleName));
                }else{
                	me.update(p,v);
                	me.defineProp(data,p);
                }
	        });
    	}else if(nodom.isArray(data)){
    		//监听数组事件
	        let watcher = ['push','unshift','splice','pop','shift','reverse','sort'];
	        let module = ModuleFactory.get(me.moduleName);
	       	//添加自定义事件，绑定改变事件
	        watcher.forEach(function(item){
	        	data[item] = function(){
	                let args=[];
	                switch(item){
	                    case 'push':
	                    	for(let i=0;i<arguments.length;i++){
	                    		args.push(arguments[i]);
	                    	}
	                        break;
	                    case 'unshift':
	                        for(let i=0;i<arguments.length;i++){
	                    		args.push(arguments[i]);
	                    	}
	                        break;
	                    case 'splice':
	                    	//插入新元素
	                        if(arguments.length>2){
	                            for(let i=2;i<arguments.length;i++){
	                                args.push(arguments[i]);
	                            }
	                        }
	                        break;
	                    case 'pop':
	                    	module.deleteData(data[data.length-1].$modelId);
	                    	break;
	                    case 'shift':
	                    	module.deleteData(data[0].$modelId);
	                    	break;
	                }
	                me.update(data);
	                Array.prototype[item].apply(data,arguments);
	                //递归创建新model
	                args.forEach((arg)=>{
	                	if(nodom.isObject(arg) || nodom.isArray(arg)){
	                        new Model(arg,ModuleFactory.get(me.moduleName));
	                    }
	                });
	            }
	        });

	        //设置model
	        data.forEach((item)=>{
	        	if(nodom.isObject(item) || nodom.isArray(item)){
    				new Model(item,ModuleFactory.get(me.moduleName));
                }
	        });
    	}
    }
    
    /**
     * 定义属性set和get方法
     * @param data 	数据对象
	 * @param p 	属性
     */
    defineProp(data,p){
    	const me = this;
    	Object.defineProperty(data,p,{
        	set:function(v){
        		if(me.fields[p] === v){
        			return;
        		}
        		me.update(p,v);
        		data[p] = v;
        	},
            get:function(){
            	if(me.fields[p] !== undefined){
                	return me.fields[p];
                }/*else{
                	return data[p];
                }*/
            }
        });	
    }
	/**
	 * 查询
	 * @param name 		字段名，可以是多段式 如 a.b.c
	 */
	query(name){
		const me = this;
		let data = me.data;
        let fa = name.split(".");
        for(let i=0;i<fa.length && null !== data && typeof data === 'object';i++){
            if(data === undefined){
                return;
            }
            //是数组
            if(fa[i].charAt(fa[i].length-1) === ']'){
                let f = fa[i].split('[');
                data = data[f[0]];
                f.shift();
                //处理单重或多重数组
                f.forEach((istr)=>{
                     let ind = istr.substr(0,istr.length-1);
                    data = data[parseInt(ind)];
                });
            }else{
                data = data[fa[i]];
            }
        }
        return data;
	}
}
/**
 * 过滤器类
 */
class Filter{
	/**
	 * 构造方法
	 * @param src 		源串，或explain后的数组
	 */
	constructor(src){
		if(nodom.isString(src)){
			src = FilterManager.explain(src);
		}
		if(src){
			this.type = src[0];
			this.params = src.slice(1);	
		}
	}

	/**
	 * 执行
	 * @param value 	待过滤值
	 * @param module 	模块
	 * @return 			过滤结果
	 */
	exec(value,module){
		let args = [module,this.type,value].concat(this.params);
		return nodom.apply(FilterManager.exec,module,args);
	}
}
class DirectiveManager{
	/**
	 * 创建指令类型
	 * @param name 		指令类型名
	 * @param config 	配置对象{order:优先级,init:初始化函数,handler:渲染处理函数}
	 */
	static addType(name,config){
		if(this.directiveTypes.has(name)){
			throw Error.handle('exist1',nodom.words.directiveType,name);
		}
		if(!nodom.isObject(config)){
			throw Error.handle('invoke','DirectiveManager.addType',1,'Function');	
		}
        //默认优先级10
        config.prio = config.prio || 10;
		this.directiveTypes.set(name,config);
	}

	/**
     * 移除过滤器类型
     * @param name  过滤器类型名
     */
    static removeType(name){
        if(this.cantEditTypes.indexOf(name) !== -1){
            throw Error.handle('notupd',nodom.words.system + nodom.words.directiveType,name);
        }
        if(!this.directiveTypes.has(name)){
            throw Error.handle('notexist1',nodom.words.directiveType,name);
        }
        delete this.directiveTypes.delete(name);
    }

    /**
     * 获取类型
     */
    static getType(name){
        return this.directiveTypes.get(name);
    }

    /**
     * 是否有某个过滤器类型
     * @param type 		过滤器类型名
     * @return 			true/false
     */
    static hasType(name){
    	return this.directiveTypes.has(name);
    }

    /**
     * 指令初始化
     */
    static init(directive,dom,module,el){
        let dt = this.directiveTypes.get(directive.type);
    	if(dt === undefined){
    		throw Error.handle('notexist1',nodom.words.directiveType,name);
    	}
    	return dt.init(directive,dom,module,el);
    }

	/**
     * 执行指令
     * @param directiveId   指令
     * @param dom           虚拟dom
     * @param module        模块
     * @param parent        父dom
	 */
	static exec(directive,dom,module,parent){
		let args = arguments;

        // let directive = module.directiveFactory.get(directiveId);
        args[0] = directive;
        if(!this.directiveTypes.has(directive.type)){
			throw Error.handle('notexist1',nodom.words.directiveType,type);
		}

		//调用
		return nodom.apply(this.directiveTypes.get(directive.type).handle,null,args);
	}

	
}

DirectiveManager.directiveTypes = new Map();
//不可编辑类型
DirectiveManager.cantEditTypes = ['model','repeat','if','else','show','class','field'];

        
/**
 * 指令类
 */
class Directive{
	/**
	 * 构造方法
	 * @param type  	类型
	 * @param value 	指令值
	 * @param vdom 		虚拟dom
	 * @param module 	模块	
	 */
	constructor(type,value,vdom,module){
		const me = this;
		me.type = type;
		// console.log(type,value);
		if(nodom.isString(value)){
			me.value = value.trim();
		}
		if(type !== undefined){
			nodom.apply(DirectiveManager.init,DirectiveManager,[me,vdom,module]);
		}

		me.id = nodom.genId();
	}

	/**
	 * 执行
	 * @param value 	待过滤值
	 * @return 			过滤结果
	 */
	exec(value){
		let args = [this.module,this.type,value].concat(this.params);
		return nodom.apply(DirectiveManager.exec,DirectiveManager,args);
	}
}

/**
 * 模块类
 */
class Module{
	constructor(config){
		const me = this;
		me.id = nodom.genId();
		me.firstRender = true;	//是否是首次渲染
		me.rendered = false;
		me.virtualDom = undefined; 			//原始虚拟dom
		me.renderTree = undefined;			//渲染的虚拟dom树
		me.parentName = undefined; 			//父模块名
		me.children = undefined; 			//子模块（数组）
		me.selector = undefined; 			//container 选择器
		me.isMain = false; 					//主模块
		me.firstRenderOps = [];   			//首次渲染后执行数组
		me.beforeFirstRenderOps = [];  		//首次渲染前执行数组
		me.containerParam = undefined; 		//container 参数{module:,selector:}
		me.state = 0; 						//状态 0 create(创建)、1 init(初始化，已编译)、2 unactive(渲染后被置为非激活) 3 active(激活，可渲染显示)、4 dead(死亡)

		// 模块名字
		if(config.name){
			me.name = config.name;
		}else{
			me.name = 'Module' + nodom.genId();
		}

		// 把模块添加到工厂
		ModuleFactory.add(me.name,me);
		
		me.methodFactory = new MethodFactory(me);
		me.modelFactory = new ModelFactory(me);
		me.expressionFactory = new ExpressionFactory(me);
		me.directiveFactory = new DirectiveFactory(me);
		me.renderDoms = [];			//修改渲染的el数组
		
		if(config){
			//保存config，存在延迟初始化情况
			me.initConfig = config;

			//保存container参数
			if(nodom.isString(config.el)){
				me.containerParam = {
					module:config.parentName,
					selector:config.el
				};
			}else if(nodom.isEl(config.el)){  //element
				me.container = config.el;
			}

			//方法加入工厂
			if(nodom.isObject(config.methods)){
				nodom.getOwnProps(config.methods).forEach((item)=>{
					me.methodFactory.add(item,config.methods[item]);
				});
			}
			me.templateStr = '';
			//清除container的内部内容
			if(me.hasContainer()){
				me.templateStr = me.container.innerHTML.trim();
				me.container.innerHTML = '';
			}

			//主模块
			if(config.root){ 
				me.isMain = true;  
				ModuleFactory.setMain(me);
				me.active();
			}

			//不延迟初始化或为主模块，需要立即初始化
			if(!config.delayInit || me.isMain){
				me.init();
			}
		}
	}

	/**
     * 加载模块
     * @param callback  加载后的回调函数
     */
    init(){
        const me = this;
        //已初始化，不用再初始化
        if(me.state !== 0 || me.initing){
        	return me.initLinker;
        }

        me.initing = true;
        let config = me.initConfig;
        let typeArr = [];  //请求类型数组
    	let urlArr = [];   //请求url数组
    	//app页面路径
    	let appPath = nodom.config.appPath || '';
        if(nodom.isArray(config.requires) && config.requires.length>0){
        	config.requires.forEach((item)=>{
        		let type;
        		let url = '';
        		if(nodom.isObject(item)){  //为对象，可能是css或js
        			type = item.type || 'js';
        			url += item.path;
        		}else{   //js文件
        			type = 'js';
        			url += item; 
        		}
        		//如果已经加载，则不再加载
        		if(type === 'css'){
        			let css = nodom.get("link[href='" + url + "']"); 
	                if(cs !== null){     
	                    return; 
	                }
	                css = nodom.newEl('link');
	                css.type = 'text/css'; 
	                css.rel = 'stylesheet';  // 保留script标签的path属性
	                css.href = path; 
	                head.appendChild(css); 
	                return;
        		}else if(type === 'js'){
        			let cs = nodom.get("script[dsrc='" + url + "']");
	                if(cs !== null){ 
	                    return;
	                }
        		}
        		typeArr.push(type);
        		urlArr.push(url);
        	});
        }


        //模版信息
        if(config.template){ //模版串
        	//合并容器中的内容和template模版内容
    		me.templateStr += config.template.trim();
    	}else if(config.templateUrl){ //模版文件
    		typeArr.push('template');
    		urlArr.push(appPath + config.templateUrl);
    	}else if(config.compiledTemplate){ //编译后的json串
    		typeArr.push('compiled');
    		urlArr.push(appPath + config.compiledTemplate);
    	}
    	
    	//如果已存在templateStr，则直接编译
    	if(!nodom.isEmpty(me.templateStr)){
    		me.virtualDom = Compiler.compile(me,me.templateStr);
			//用后删除
			delete me.templateStr;
		}

    	//数据信息
    	if(config.data){ //数据
    		me.model = new Model(config.data,me);
    	}else if(config.dataUrl){  //数据文件url
    		typeArr.push('data');
    		urlArr.push(config.dataUrl);
    	}
    	
    	//批量请求文件
    	if(typeArr.length > 0){
    		me.initLinker = new Linker('getfiles',urlArr).then((files)=>{
	    		let head = document.querySelector('head');
	    		files.forEach((file,ind)=>{
	    			switch(typeArr[ind]){
	    				case 'js':
	    					let script = nodom.newEl('script');
	    					script.innerHTML = file;
			                head.appendChild(script);
			                script.setAttribute('dsrc',urlArr[ind]);
			                script.innerHTML = '';
	                    	head.removeChild(script);
	    					break;
	    				case 'template':
	    					me.virtualDom = Compiler.compile(me,file.trim());
	    					break;
	    				case 'compiled': //预编译后的js文件
	    					let arr = Serializer.deserialize(file,me);
	    					me.virtualDom = arr[0];
	    					me.expressionFactory = arr[1];
	    					break;
	    				case 'data': 	//数据
	    					me.model = new Model(JSON.parse(file),me);
	    			}
	    		});
	    		//主模块状态变为3
		    	changeState(me);
		    	delete me.initing;
	    	});	
    	}else{
    		me.initLinker = Promise.resolve();
    		//修改状态
    		changeState(me);
    		delete me.initing;
    	}


    	if(nodom.isArray(me.initConfig.modules)){
    		me.initConfig.modules.forEach((item)=>{
    			me.addChild(item);
    		});
    	}

    	//初始化后，不再需要initConfig
		delete me.initConfig;
		return me.initLinker;
		/**
    	 * 修改状态
    	 * @param mod 	模块
    	 */
    	function changeState(mod){
    		if(mod.isMain){
    			mod.state = 3;
    			//可能不能存在数据，需要手动添加到渲染器
    			Renderer.add(mod);
    		}else if(mod.parentName){
    			mod.state = ModuleFactory.get(mod.parentName).state;
    		}else{
    			mod.state = 1;
    		}
    	}
    	
    }

	/**
	 * 模型渲染
	 * @return false 渲染失败 true 渲染成功
	 */
	render(){
		const me = this;
		//容器没就位或state不为active则不渲染，返回渲染失败
		if(me.state !== 3 || !me.virtualDom || !me.hasContainer()){
			return false;
		}

		//克隆新的树
		let root = me.virtualDom.clone(me);
		
		if(me.firstRender){
			//执行首次渲染前事件
			me.doModuleEvent('onBeforeFirstRender');
			me.beforeFirstRenderOps.forEach((foo)=>{
				nodom.apply(foo,me,[]);
			});
			me.beforeFirstRenderOps = [];
			//渲染树
			me.renderTree = root;	
			if(me.model){
				root.modelId = me.model.id;
			}
			root.render(me,null);
			//渲染到html
			if(root.children){
				root.children.forEach((item)=>{
					item.renderToHtml(me,{type:'fresh'});
				});	
			}

			//删除首次渲染标志
			delete me.firstRender;
			//延迟执行
			setTimeout(()=>{
				//执行首次渲染后事件
				me.doModuleEvent('onFirstRender');
				//执行首次渲染后操作队列
				me.firstRenderOps.forEach((foo)=>{
					nodom.apply(foo,me,[]);
				});
				me.firstRenderOps = [];
			},0);
			
		}else{  //增量渲染
			//执行每次渲染前事件
			me.doModuleEvent('onBeforeRender');
			if(me.model){
				root.modelId = me.model.id;
				let oldTree = me.renderTree;
				me.renderTree = root;
				//渲染
				root.render(me,null);

				// 比较节点
				root.compare(oldTree,me.renderDoms);
				// 删除
				for(let i=me.renderDoms.length-1;i>=0;i--){
					let item = me.renderDoms[i];
					if(item.type === 'del'){
						item.node.removeFromHtml(me);
						me.renderDoms.splice(i,1);
					}
				}

				// 渲染
				me.renderDoms.forEach((item)=>{
					item.node.renderToHtml(me,item);
				});
			}
			
			//执行每次渲染后事件，延迟执行
			setTimeout(()=>{
				me.doModuleEvent('onRender');
			},0);
			
		}

		//数组还原
		me.renderDoms = [];

		//子模块渲染
		if(nodom.isArray(me.children)){
			me.children.forEach(item=>{
				item.render();
			});
		}
		return true;
	}

	// 检查容器是否存在，如果不存在，则尝试找到
	hasContainer(){
		const me = this;

		if(me.container){
			return true;
		}else if(me.containerParam !== undefined){
			let ct;
			if(me.containerParam.module === undefined){  //没有父节点
				ct = document;
			}else{
				let module = ModuleFactory.get(me.containerParam.module);
				if(module){
					ct = module.container;
				}
			}

			if(ct){
				me.container = ct.querySelector(me.containerParam.selector);
				return me.container !== null;
			}

		}
		
		return false;
	}
	/**
	 * 数据改变
	 * @param model 	改变的model
	 */
	dataChange(model){
		Renderer.add(this);
	}

	/**
	 * 添加子模块
	 * @param config 	模块配置 
	 */
	addChild(config){
		const me = this;
		config.parentName = me.name;
		let chd = new Module(config);
		if(me.children === undefined){
			me.children = [];
		}
		me.children.push(chd);
		return chd;
	}

	/**
	 * 发送
	 * @param toName 		接受模块名
	 * @param data 			消息内容
	 */
	send(toName,data){
		MessageFactory.add(this.name,toName,data);
	}


	/**
	 * 广播给父、兄弟和孩子（第一级）节点
	 */
	broadcast(data){
		const me = this;
		//兄弟节点
		if(me.parentName){
			let pmod = ModuleFactory.get(me.parentName);
			if(pmod && pmod.children){
				me.send(pmod.name,data);
				pmod.children.forEach((m)=>{
					//自己不发
					if(m === me){
						return;
					}
					me.send(m.name,data);
				});
			}
		}

		if(me.children !== undefined){
			me.children.forEach((m)=>{
				me.send(m.name,data);
			});
		}
	}

	/**
	 * 接受消息
	 * @param fromName 		来源模块名
	 * @param data 			消息内容
	 */
	receive(fromName,data){
		this.doModuleEvent('onReceive',[fromName,data]);
	}

	
	/**
	 * 激活
	 * @param callback 	激活后的回调函数
	 */
	active(callback){
		const me = this;
		//激活状态不用激活，创建状态不能激活
		if(me.state === 3){
			return;
		}
		let linker;
		//未初始化，需要先初始化
		if(me.state === 0){
			me.init().then(()=>{
				me.state = 3;
				if(nodom.isFunction(callback)){
					callback(me.model);
				}
				Renderer.add(me);
			});
		
		}else{
			me.state = 3;
			if(callback){
				callback(me.model);
			}
			Renderer.add(me);
		}

		//子节点
		if(nodom.isArray(me.children)){
			me.children.forEach((m)=>{
				m.active(callback);
			});
		}
		if(!linker){
			return Promise.resolve();
		}	
		return linker;
	}

	/**
	 * 取消激活
	 */
	unactive(){
		const me = this;
		//主模块不允许取消
		if(me.isRoot || me.state===2){
			return;
		}
		me.state = 2;
		//设置首次渲染标志
		me.firstRender = true;
		delete me.container;
		if(nodom.isArray(me.children)){
			me.children.forEach((m)=>{
				m.unactive();
			});
		}
	}

	/**
	 * 模块终结
	 */
	dead(){
		if(this.state === 4){
			return;
		}
		
		me.state = 4;

		if(nodom.isArray(me.children)){
			me.children.forEach((m)=>{
				m.unactive();
			});
		}
	}

	destroy(){
		if(nodom.isArray(me.children)){
			me.children.forEach((m)=>{
				m.destroy();
			});
		}
		//从工厂释放
		ModuleFactory.remove(me.name);
	}


	/*************事件**************/

	/**
	 * 执行模块事件
	 * @param eventName 	事件名
	 * @param param 		参数，为数组
	 */
	doModuleEvent(eventName,param){
		const me = this;
		let foo = me.methodFactory.get(eventName);
		if(!param){
			param = [me.model];
		}
		//调用onReceive方法
		if(nodom.isFunction(foo)){
			nodom.apply(foo,me.model,param);
		}
	}

	/**
	 * 添加首次渲染后执行操作
	 * @param foo  	操作方法
	 */
	addFirstRenderOperation(foo){
		let me = this;
		if(!nodom.isFunction(foo)){
			return;
		}
		if(me.firstRenderOps.indexOf(foo) === -1){
			me.firstRenderOps.push(foo);
		}
	}

	/**
	 * 添加首次渲染前执行操作
	 * @param foo  	操作方法
	 */
	addBeforeFirstRenderOperation(foo){
		let me = this;
		if(!nodom.isFunction(foo)){
			return;
		}
		if(me.beforeFirstRenderOps.indexOf(foo) === -1){
			me.beforeFirstRenderOps.push(foo);
		}
	}
}

/**
 * 方法工厂，每个模块一个
 */
class MethodFactory extends Factory{
	/**
	 * 调用方法
	 * @param name 		方法名
	 * @param params 	方法参数
	 */
	invoke(name,params){
		const me = this;
		let foo =  me.get(name);
		if(!nodom.isFunction(foo)){
			throw new Exception(nodom.ErrorMsgs.notexist1,nodom.words.method,name);
		}
		return nodom.apply(foo,me.module.model,params);
	}
}
/**
 * 路由，主要用于模块间跳转，一个应用中存在一个router，多个route，route节点采用双向链表存储
 * @author 		yanglei
 * @since 		1.0.0
 * @date		2017-01-21
 * @description	采用修改页面hash方式进行路由历史控制，每个route 可设置onEnter事件(钩子) 和 onLeave事件(钩子)
 * 回调调用的几个问题
 * onLeave事件在路由切换时响应，如果存在多级路由切换，则从底一直到相同祖先路由，都会进行onLeave事件响应
 *  如：从/r1/r2/r3  到 /r1/r4/r5，则onLeave响应顺序为r3、r2
 *  onEnter事件则从上往下执行
 */
class Router{

	/**
	 * 切换路由
	 * @param path 	路径
	 * @param pop 	是否为history popstate
	 */
	static start(path){
		const me = this;
		//路径相同，不执行
		if(me.currentPath === path){
			me.startStyle = 0;
			return;
		}

		//加载中，不允许切换
		if(me.loading){
			//避免连续跳转到同一个路径
			if(me.waitList[me.waitList.length-1] !== path){
				me.waitList.push(path);	
				return;
			}
		}

		me.loading = true;
		
		let diff = me.compare(me.currentPath,path);
		//获得当前模块，用于寻找router view
		let parentModule = diff[0] === null?ModuleFactory.getMain():ModuleFactory.get(diff[0].module);
		
		//onleave事件，从末往前执行
		for(let i=diff[1].length-1;i>=0;i--){
			const r = diff[1][i];
			if(!r.module){
				continue;
			}
			let module = ModuleFactory.get(r.module);

			if(nodom.isFunction(me.onDefaultLeave)){
				me.onDefaultLeave(module.model);
			}
			if(nodom.isFunction(r.onLeave)){
				r.onLeave(module.model);
			}

			//module置为不激活
			module.unactive();
		}
		let operArr = [];  	//待操作函数数组
		let paramArr = []; 	//函数对应参数数组
		let dontChangePath = false;
		let path1 = '';  	//实际要显示的路径
		if(diff[2].length === 0){
			if(diff[0] !== null){
				setRouteParamToModel(diff[0]);
				if(diff[3] && diff[3].module){
					let m = ModuleFactory.get(diff[3].module);
					m.routerWantActive = diff[0];
					if(m){
						me.changeActive(m);
					}
				}
				if(!diff[0].useParentPath){
					path1 = diff[0].fullPath; 
				}
  			}
		}else{
			//加载模块
			for(let i=0;i<diff[2].length;i++){
				let route = diff[2][i];

				//路由不存在或路由没有模块
				if(!route || !route.module){
					continue;
				}
				if(!route.useParentPath){
					path1 = route.fullPath; 
				}


				if(!parentModule.routerKey){
					throw Error.handle('notexist',nodom.words.routeView);
				}
				let module = ModuleFactory.get(route.module);
				if(!module){
					throw Error.handle('notexist1',nodom.words.module,route.module);
				}
				
				Router.moduleRouteMap[module.name] = route.id;
				//参数数组
				paramArr.push(module.name);
				//操作数组
				operArr.push(
					(resolve,reject,moduleName)=>{
						let module = ModuleFactory.get(moduleName);
						module.addBeforeFirstRenderOperation(function(){
							nodom.empty(this.container);
						});
						//保留container参数
						module.containerParam = {
							module:parentModule.name,
							selector:"[key='" + parentModule.routerKey + "']"
						}

						//激活
						module.active(function(model){
							let route = Router.routes.get(Router.moduleRouteMap[module.name]);
							delete Router.moduleRouteMap[module.name];
							setRouteParamToModel(route);
							
							if(nodom.isFunction(me.onDefaultEnter)){
								me.onDefaultEnter(model);
							}
							if(nodom.isFunction(route.onEnter)){
								route.onEnter(model);
							}

							//判断路由启动方式
							if(me.startStyle !== 1){
								//设置待激活路由绑定view
								parentModule.routerWantActive = route;
								//添加激活事件
								if(parentModule.firstRender){
									parentModule.addBeforeFirstRenderOperation(me.changeActive);
								}else{
									me.changeActive(parentModule);
								}
							}
							parentModule = module;
							if(resolve){
								resolve();	
							}
						});
					}
				);
			}
		}

		//如果是history popstate，则不进入加入history
		if(me.startStyle !== 2 && path1 !== ''){ 
			//子路由，替换state
			if(me.showPath && path1.indexOf(me.showPath) === 0){
				history.replaceState(path,'', nodom.config.routerPrePath + path1);	
			}else { //路径push进history
				history.pushState(path,'', nodom.config.routerPrePath + path1);		
			}

			//设置显示路径
			me.showPath = path1;
		}

		//修改currentPath
		me.currentPath = path;

		//同步加载模块
		new Linker("dolist",operArr,paramArr).then(()=>{
			Router.loading = false;
			Router.startStyle = 0;
		});

		/**
		 * 将路由参数放入model
		 * @param route 	路由
		 */
		function setRouteParamToModel(route){
			let module = ModuleFactory.get(route.module);
			let model = module.model;
			let o = {
				path:route.path
			};
			if(!nodom.isEmpty(route.data)){
				o.data = route.data;
			}
			if(!model){
				module.model = new Model({$route:o},module);
			}else{
				model.data['$route'] = o;
			}
			Renderer.add(module);
		}
	}

	/*
	 * 重定向
	 * @param path 	路径
	 */
	static Redirect(path){
		this.start(path,true);
	}
	
	static addRoute(route,parent){
		//加入router tree
		if(RouterTree.add(route,parent) === false){
			throw Error.handle("exist1",nodom.words.route,route.path);
		}
		//加入map
		this.routes.set(route.id,route);
	}

	/**
	 * 获取路由
	 * @param path 	路径
	 * @param last 	是否获取最后一个路由默认false
	 */
	static getRoute(path,last){
		if(!path){
			return null;
		}

		let routes = RouterTree.get(path);
		if(routes === null || routes.length === 0){
			return null;
		}
				
		//routeid 转route
		if(last){   //获取最后一个
			return routes[routes.length-1];
		}else{		//获取所有
			return routes;
		}
	}

	/**
	 * 比较两个路径对应的路由链
	 * @param path1 	第一个路径
	 * @param path2 	第二个路径
	 * @return 			两个路由数组
	 */
	static compare(path1,path2){
		const me = this;
		// 获取路由id数组
		let arr1 = null;
		let arr2 = null;
		if(path1){
			arr1 = me.getRoute(path1);
		}
		if(path2){
			arr2 = me.getRoute(path2);
		}

		let len = 0;
		if(arr1 !== null){
			len = arr1.length;
		}

		if(arr2 !== null){
			if(arr2.length<len){
				len = arr2.length;
			}
		}else{
			len = 0;
		}
		
		let retArr1=[],retArr2=[];
		let i = 0;

		for(i=0;i<len;i++){
			//找到不同路由开始位置
			if(arr1[i].id === arr2[i].id){
				//比较参数
				if(JSON.stringify(arr1[i].data) !== JSON.stringify(arr2[i].data)){
					//从后面开始更新，所以需要i+1
					i++;
					break;
				}
			}else{
				break;
			}
		}
		//参数不一样的问题
		if(arr1 !== null){
			for(let j=i;j<arr1.length;j++){
				retArr1.push(arr1[j]);
			}	
		}
		
		if(arr2 !== null){
			for(let j=i;j<arr2.length;j++){
				retArr2.push(arr2[j]);
			}
		}

		//上一级路由和上二级路由
		let p1=null,p2=null;
		if(arr1 !== null && i>0){
			for(let j=i-1;j>=0&(p1===null || p2===null);j--){
				
				if(arr1[j].module !== undefined){
					if(p1 === null){
						p1 = arr1[j];
					}else if(p2 === null){
						p2 = arr1[j];
					}
				}
			}
		}
		return [p1,retArr1,retArr2,p2];
	}

	
	/**
	 * 修改模块active view（如果为view active为true，则需要路由跳转）
	 * @param module 	模块
	 */
	static changeActive(module){
		//如果在模块中调用，则直接用this
		module = module || this;
		let wantItem = module.routerWantActive;
		//删除由该函数启动路由标志
		delete Router.startWithChangeActive;

		//用完即删
		delete module.routerWantActive;

		if(!wantItem || !nodom.isArray(module.routerActiveViews) || module.routerActiveViews.length === 0){
			return;
		}

		let doms = [];
		let domKeys = {};

		module.routerActiveViews.forEach((item)=>{
			let dom = module.renderTree.query(item);
			if(!dom){
				return;
			}

			if(dom.exprProps.hasOwnProperty('active')){ // active属性为表达式，修改字段值
				let model = module.modelFactory.get(dom.modelId);
				if(!model){
					return;
				}
				
				let expr = module.expressionFactory.get(dom.exprProps['active'][0]);
				if(!expr){
					return;
				}
				let field = expr.fields[0];
				//全部设置active为false
				model.data[field] = false;
				//保存对象
				doms.push({dom:dom,model:model,field:field,expr:true});
				//保存key对应索引
				domKeys[dom.key] = doms.length-1;	
			}else if(dom.props.hasOwnProperty('active')){  //active值属性
				dom.props['active'] = false;
				doms.push({dom:dom,expr:false});
				//保存key对应索引
				domKeys[dom.key] = doms.length-1;
			}
		});

		
		//没有dom，则不进行
		if(doms.length === 0){
			return;
		}
		
		if(wantItem instanceof Route){ //路由
			let route = wantItem;
			//修改route绑定的所有view
			if(nodom.isArray(route.attachDoms)){
				//route绑定的所有attatch dom 的数据修改为true
				route.attachDoms.forEach((item)=>{
					
					if(domKeys.hasOwnProperty(item)){
						let obj = doms[domKeys[item]];
						
						if(route.fullPath !== obj.dom.props['path']){
							return;
						}
						
						if(obj.expr){ //表达式
							//修改数据，直接进入渲染队列
							obj.model.data[obj.field] = true;	
						}else{ //值属性
							obj.dom.props['active'] = true;
							//加入渲染队列
							Renderer.add(module);
						}
					}
				});	
			}
		}else{  //dom key
			if(domKeys.hasOwnProperty(wantItem)){
				let obj = doms[domKeys[wantItem]];
				if(obj.expr){ //表达式
					//修改数据，直接进入渲染队列
					obj.model.data[obj.field] = true;	
				}else{ //值属性
					obj.dom.props['active'] = true;
					//加入渲染队列
					Renderer.add(module);
				}
				let path = obj.dom.props['path'];
				//设置启动路径为changeActive标志
				Router.startStyle = 1;
				//启动子路由
				if(!nodom.isEmpty(path)){
					Router.start(path);	
				}
			}
		}

	}
}

// Router 成员变量
Router.loading = false;				//加载中标志
Router.routes = new Map();			//路由map
Router.currentPath = ''; 			//当前路径
Router.showPath = ''; 				//显示路径（useParentPath时需要）
Router.waitList = [];				//path等待链表
Router.onDefaultEnter=undefined; 	//默认路由进入事件
Router.onDefaultLeave=undefined; 	//默认路由离开事件
Router.moduleRouteMap = {};			//module 和 route映射关系 {moduleName:routeId,...}
Router.startStyle = 0; 				//启动方式 0:直接启动 1:由element active改变启动 2:popstate 启动

class Route{
	constructor(config){
		const me = this;
		me.params = [];  //参数
		me.data={};
		me.children = [];
		me.onEnter = config.onEnter;
		me.onLeave = config.onLeave;
		me.useParentPath = config.useParentPath;

		
		me.path = config.path;
		me.module = config.module instanceof Module?config.module.name:config.module;

		if(config.path === ''){
			return;
		}
		
		me.id = nodom.genId();

		if(!config.notAdd){
			Router.addRoute(me,config.parent);	
		}
		
		//子路由
		if(nodom.isArray(config.routes)){
			config.routes.forEach((item)=>{
				item.parent = me;
				new Route(item);
			});
		}
	}
}

/**
 * 路由树类
 */
class RouterTree {
    
    /**
     * 添加route到路由树
     *
     * @param route 路由
     * @return 添加是否成功 type Boolean
     */
    static add(route,parent) {

    	const me = this;
    	//创建根节点
    	if(!me.root){
    		me.root = new Route({path:"",notAdd:true});
    	}
        let pathArr = route.path.split('/');
        let node = parent||me.root;
        let path = '';
        let param = [];
        let routeValue; 		//记录最后一个非参数路径
        let paramIndex = -1;	//最后一个参数开始
        let prePath = '';
        for(let i=0;i<pathArr.length;i++){
        	let v = pathArr[i].trim();
        	if(v === ''){
        		pathArr.splice(i--,1);
        		continue;
        	}
        	
        	if(v.startsWith(':')){ //参数
        		if(param.length === 0){
        			paramIndex = i; 
        		}
        		param.push(v.substr(1));
        	}else{
        		paramIndex = -1;
        		param = []; 	 //上级路由的参数清空
        		route.path = v;  //暂存path
        		let j=0;
        		for(;j<node.children.length;j++){
        			let r = node.children[j];
        			if(r.path === v){
        				node = r;
        				break; 
        			}
        		}

        		//没找到，创建新节点
        		if(j === node.children.length){
        			if(prePath !== ''){
        				node.children.push(new Route({path:prePath,notAdd:true}));	
        				node = node.children[node.children.length-1];
        			}
        			prePath = v;
        		}
        	}

        	//不存在参数
        	if(paramIndex === -1){
        		route.params = [];
        	}else{
        		route.params = param;
        	}
        }

        //添加到树
    	if(node !== undefined && node !== route){
    		route.path = prePath;
        	node.children.push(route);	
    	}
        return true;
    }
    
    static get(path){
    	const me = this;
    	if(!me.root){
    		throw Error.handle("根节点不存在");
    	}
    	let pathArr = path.split('/');
    	let node = me.root;
    	let paramIndex = 0;
    	let retArr = [];
    	let fullPath = '';		//完整路径
    	let preNode = me.root;  //前一个节点

    	for(let i=0;i<pathArr.length;i++){
    		let v = pathArr[i].trim();
        	if(v === ''){
        		pathArr.splice(i--,1);
        		continue;
        	}
        	let find = false;
        	for(let j=0;j<node.children.length;j++){
        		if(node.children[j].path === v){
        			//设置完整路径

        			if(preNode !== me.root){
        				preNode.fullPath = fullPath;
        				preNode.data = node.data;
        				retArr.push(preNode);
        			}
        				
        			//设置新的查找节点
        			node = node.children[j];
        			//参数清空
        			node.data = {};
        			preNode = node;
        			find = true;
        			break;
        		}
        	}
        	//路径叠加
        	fullPath += '/' + v;
        	//不是孩子节点,作为参数
        	if(!find){
        		if(paramIndex < node.params.length){ //超出参数长度的废弃
        			node.data[node.params[paramIndex++]] = v;	
        		}
        	}
        }

        //最后一个节点
        if(node !== me.root){
        	node.fullPath = fullPath;
        	retArr.push(node);
        }
        return retArr;
    }
}


//处理popstate事件
window.addEventListener('popstate' , function(e){
	//根据state切换module
	const state = history.state;
	if(!state){
		return;
	}
	Router.startStyle = 2;
	Router.start(state);
});


/**
 * 增加route指令
 */
DirectiveManager.addType('route',{
	init:(directive,dom,module)=>{
		let value = directive.value;
        if(nodom.isEmpty(value)){
            return;
        }

        //a标签需要设置href
        if(dom.tagName === 'A'){
        	dom.props['href'] = 'javascript:void(0)';
        }
        // 表达式处理
        if(value && value.substr(0,2) === '{{' && value.substr(value.length-2,2) === '}}'){
			let expr = new Expression(value.substring(2,value.length-2),module);
			dom.exprProps['path'] = expr;
			directive.value = expr;
        }else{
        	dom.props['path'] = value; 
        }

        //添加click事件
		let method = '$nodomGenMethod' + nodom.genId();
		module.methodFactory.add(method,
            (e,module,view,dom)=>{
            	let path = dom.props['path'];
            	if(dom.props.hasOwnProperty('active')){  //有active属性，交给路由激活
            		module.routerWantActive = dom.key;
            		Router.changeActive(module);	
            	}else if(!nodom.isEmpty(path)){  //自己跳转路由
            		Router.start(path);
            	}
            	
            }
        );
        dom.events['click'] = new Event('click',method);
	},

	handle:(directive,dom,module,parent)=>{
		//添加到active view 队列
		if(!module.routerActiveViews){
			module.routerActiveViews = [];
		}

		if(module.routerActiveViews.indexOf(dom.key) === -1){
			module.routerActiveViews.push(dom.key);
			if(dom.props.hasOwnProperty('active')){
				//设置已添加标志，避免重复添加
				let route = Router.getRoute(dom.props['path'],true);
				if(route === null){
					return;
				}

				if(!route.attachDoms){
					route.attachDoms = [];
				}
				//增加路由的关联dom
				route.attachDoms.push(dom.key);
			}
		}

		let path = dom.props['path'];
		//active需要跳转路由，如果路由已在路径中，或存在等待激活的路由，则不进行跳转
		if(dom.props['active'] && dom.props['active'] !== 'false' 
			&& module.routerWantActive === undefined && Router.startStyle !== 1){
			module.routerWantActive = dom.key;
			module.addFirstRenderOperation(Router.changeActive);
		}
	}
});

/**
 * 增加route指令
 */
DirectiveManager.addType('router',{
	init:(directive,dom,module)=>{
		module.routerKey = dom.key;
	},
	handle:(directive,dom,module,parent)=>{
		return;
	}
});

/**
 *  编译器
 *  描述：用于进行预编译和预编译后的json串反序列化，处理两个部分：虚拟dom树和表达式工厂
 */

class Serializer{

	/**
	 * 序列化，只序列化 virtualDom、expressionFactory
	 * @param module 	模块
	 * @return   		jsonstring
	 */
	static serialize(module){
		let props = ['virtualDom','expressionFactory'];
		let jsonStr = '[';

		props.forEach((p,i)=>{
			addClsName(module[p]);
			let s = JSON.stringify(module[p]);
			jsonStr += s;
			if(i<props.length-1){
				jsonStr += ',';
			}else{
				jsonStr += ']'
			}
		});
		
		return jsonStr;

		/**
		 * 为对象添加class name（递归执行）
		 * @param obj 	对象
		 */
		function addClsName(obj){
			if(typeof obj !== 'object'){
				return;
			}

			let cls = Class.getClassName(obj);

			if(cls && Class.getClass(cls)){
				obj.className = cls;		
			}

			nodom.getOwnProps(obj).forEach((item)=>{
				if(nodom.isArray(obj[item])){
					//删除空数组
					if(obj[item].length === 0){
						delete obj[item];
					}else{
						obj[item].forEach((item1)=>{
							addClsName(item1);
						});	
					}
				}else if(typeof obj[item] === 'object'){
					//删除空对象
					if(nodom.isEmpty(obj[item])){
						delete obj[item];
					}else{
						addClsName(obj[item]);	
					}
				}
			});
		}
	}


	/**
	 * 反序列化
	 * @param jsonStr 		json串
	 * @param module 		模块
	 * @return [virtualDom,expressionFactory]	
	 */
	static deserialize(jsonStr,module){
		let jsonArr = JSON.parse(jsonStr);
		
		let arr = [];
		let vdom; //虚拟dom
		jsonArr.forEach((item)=>{
			arr.push(handleCls(item));
		});

		return arr;

		function handleCls(jsonObj){
			if(!nodom.isObject(jsonObj)){
				return jsonObj;
			}

			if(jsonObj.moduleName){
				jsonObj.moduleName = module.name;
			}

			let retObj;
			if(jsonObj.hasOwnProperty('className')){
				const cls = jsonObj['className'];
				let param = [];
				//指令需要传入参数
				switch(cls){
					case 'Directive':
						param = [jsonObj['type'],jsonObj['value'],vdom,module];
						break;
					case 'Event':
						param = [jsonObj['name']];
						break;
				}
				
				retObj = Class.newInstance(cls,param);
				if(cls === 'Element'){
					vdom = retObj;
				}
				
			}else{
				retObj = {};
			}

			//子对象可能用到父对象属性，所以子对象要在属性赋值后处理
			let objArr = [];  //子对象
			let arrArr = [];  //子数组
			nodom.getOwnProps(jsonObj).forEach((item)=>{
				//子对象
				if(nodom.isObject(jsonObj[item])){
					objArr.push(item);
				}else if(nodom.isArray(jsonObj[item])){ //子数组
					arrArr.push(item);
				}else{  //普通属性
					if(item !== 'className'){
						retObj[item] = jsonObj[item];	
					}
				}
			});

			//子对象处理
			objArr.forEach((item)=>{
				retObj[item] = handleCls(jsonObj[item]);
			});

			//子数组处理
			arrArr.forEach(item=>{
				retObj[item] = [];
				jsonObj[item].forEach((item1)=>{
					retObj[item].push(handleCls(item1));
				});
			});
			return retObj;
		}
	}

}

/**
 * filter类型命名规则：以小写字母a-z命名，其它字母不允许
 */
class FilterManager{
	/**
	 * 创建过滤器类型
	 * @param name 		过滤器类型名
	 * @param handler 	过滤器类型处理函数{init:foo1,handler:foo2}
	 */
	static addType(name,handler){
		if(!/^[a-zA-Z]+$/.test(name)){
			throw Error.handle('namedinvalid',nodom.words.filterType,name);
		}
		if(this.filterTypes.has(name)){
			throw Error.handle('exist1',nodom.words.filterType,name);
		}
		if(!nodom.isFunction(handler)){
			throw Error.handle('invoke','FilterManager.addType',1,'Function');	
		}
		this.filterTypes.set(name,handler);
	}

	/**
     * 移除过滤器类型
     * @param name  过滤器类型名
     */
    static removeType(name){
        if(this.cantEditTypes.indexOf(name) !== -1){
            throw Error.handle('notupd',nodom.words.system + nodom.words.filterType,name);
        }
        if(!this.filterTypes.has(name)){
            throw Error.handle('notexist1',nodom.words.filterType,name);
        }
        delete this.filterTypes.delete(name);
    }

    /**
     * 是否有某个过滤器类型
     * @param type 		过滤器类型名
     * @return 			true/false
     */
    static hasType(name){
    	return this.filterTypes.has(name);
    }

	/**
     * 执行过滤器
     * @param module 	模块
     * @param value 	值
     * @param arguments 参数数组  0模块 1过滤器类型名 2待处理值 3-n处理参数
	 */
	static exec(module,type,value){
		let params = new Array();

		for(let i=2;i<arguments.length;i++){
			params.push(arguments[i]);
		}
		if(!FilterManager.filterTypes.has(type)){
			throw Error.handle('notexist1',nodom.words.filterType,type);   
		}
		//调用
		return nodom.apply(FilterManager.filterTypes.get(type),module,params);
	}

	/**
	 * 解析过滤器串为数组
	 * @param src 	源字符串，格式为filtertype:param1:param2:... 	
	 */
	static explain(src){
		let startStr,startObj = false;
		let strings = "\"'`"; 	//字符串开始和结束标志
		let splitCh = ':'; 		//分隔符
		let retArr = new Array();
		let tmp = ''; 			//临时串
		for(let i=0;i<src.length;i++){
			let ch = src[i];
			//字符串开始或结束
			if(strings.indexOf(ch) !== -1){
				if(ch === startStr){//字符串结束
					startStr = undefined;
				}else{				//字符串开始
					startStr = ch;
				}
			}else if(startStr === undefined){ 	//非字符串开始情况检查对象
				if(ch === '}' && startObj){ 	//对象结束
					startObj = false;
				}else if(ch === '{'){ 			//对象开始
					startObj = true;
				}
			}

			//分割开始
			if(ch === splitCh && startStr === undefined && !startObj && tmp !== ''){
				retArr.push(handleObj(tmp));
				tmp = '';
				continue;
			}
			tmp += ch;
		}

		//最后一个
		if(tmp !== ''){
			retArr.push(handleObj(tmp));
		}
		return retArr;
		/**
		 * 转化字符串为对象
		 */
		function handleObj(s){
			s = s.trim();
			if(s.charAt(0)==='{'){ //转换为对象
				s = eval('(' + s + ')');
			}
			return s;
		}
	}
}

FilterManager.filterTypes = new Map();
//不可编辑类型
FilterManager.cantEditTypes = ['date','currency','number','tolowercase','touppercase','orderBy','filter'];

        
/**
 *  指令类型初始化    
 *  每个指令类型都有一个init和handle方法，init和handle都可选
 *  init 方法在编译时执行，包含一个参数 directive(指令)、dom(虚拟dom)、module(模块)，无返回
 *  handle方法在渲染时执行，包含三个参数 directive(指令)、dom(虚拟dom)、module(模块)、parent(父虚拟dom)
 *  return true/false false则不进行后面的所有渲染工作
 */ 

DirectiveManager.addType('model',{
    prio:1,
    init:(directive,dom,module)=>{
        let value = directive.value;
        //处理以.分割的字段，没有就是一个
        if(nodom.isString(value)){
            let arr = new Array();
            value.split('.').forEach((item)=>{  
                let ind1 = -1,ind2 = -1;
                if((ind1 = item.indexOf('[')) !== -1 && (ind2 = item.indexOf(']')) !== -1){ //数组
                    let fn = item.substr(0,ind1);
                    let index = item.substring(ind1+1,ind2);
                    arr.push(fn + ',' + index);
                }else{ //普通字符串
                    arr.push(item);
                }
            });
            directive.value = arr;    
        }
    },

    handle:(directive,dom,module,parent)=>{
        let model = module.modelFactory.get(dom.modelId);
        if(!model || !model.data){
            return;
        }
        let data = model.data;
        directive.value.forEach((item)=>{
            if(!data){
                return;
            }
            if(item.indexOf(',') !== -1){   //处理数组
                let a = item.split(',');
                data = data[a[0]][parseInt(a[1])];    
            }else{                          //非数组
                
                data = data[item];
            }
        });
        if(data){
            dom.modelId = data.$modelId;    
        }
        return true;
    }
});

/**
 * 指令名 repeat
 * 描述：重复指令
 */
DirectiveManager.addType('repeat',{
    prio:2,
    init:(directive,dom,module)=>{
        let value = directive.value;
        if(!value){
            throw Error.handle("paramException","x-repeat");
        }
        
        let ind,filter,modelName;
        //过滤器
        if((ind=value.indexOf('|')) !== -1){
            modelName = value.substr(0,ind).trim();
            directive.filter = new Filter(value.substr(ind+1));
        }else{
            modelName = value;
        }

        // 增加model指令
        if(!dom.hasDirective('mocel')){
            dom.directives.push(new Directive('model',modelName,dom,module));    
        }
        
        directive.value = modelName;
    },
    handle:(directive,dom,module,parent)=>{
        const modelFac = module.modelFactory;
        let rows = modelFac.get(dom.modelId).data;
        //有过滤器，处理数据集合
        if(directive.filter !== undefined){
            rows = directive.filter.exec(rows,module);
        }

        // 无数据，不渲染
        if(rows === undefined || rows.length === 0){
            dom.dontRender = true;
            return true;
        }

        let chds = [];
        let key = dom.key;
        
        // 移除指令
        dom.removeDirectives(['model','repeat']);
        
        for(let i=0;i<rows.length;i++){
            let node = dom.clone(module);
            //设置modelId
            node.modelId = rows[i].$modelId;
            //设置key
            setKey(node,key,node.modelId);
            rows[i].$index = i;
            chds.push(node);     
        }

        //找到并追加到dom后
        if(chds.length > 0){
            for(let i=0,len=parent.children.length;i<len;i++){
                if(parent.children[i] === dom){
                    chds = [i+1,0].concat(chds);
                    Array.prototype.splice.apply(parent.children,chds);
                    break;
                }
            }
        }
        
        // 不渲染该节点
        dom.dontRender = true;
        return false;

        function setKey(node,key,id){
            node.key = key + '_' + id;
            node.children.forEach((dom)=>{
                setKey(dom,dom.key,id);
            });
        }
    }
});

/**
 * 指令名 if
 * 描述：条件指令
 */
DirectiveManager.addType('if',{
    init:(directive,dom,module)=>{
        let value = directive.value;
        if(!value){
            throw Error.handle("paramException","x-repeat");
        }
        //value为一个表达式
        let expr = new Expression(value,module);
        directive.value = expr;
    },
    handle:(directive,dom,module,parent)=>{
        //设置forceRender
        let model = module.modelFactory.get(dom.modelId);
        let v = directive.value.val(model);
        //找到并存储if和else在父对象中的位置
        let indif=-1,indelse=-1; 
        for(let i=0;i<parent.children.length;i++){
            if(parent.children[i] === dom){
                indif = i;
            }else if(indelse === -1 && parent.children[i].hasDirective('else')){
                indelse = i;
            }
            
            //if后的第一个element带else才算，否则不算
            if(i !== indif && indif !== -1 && indelse === -1 && parent.children[i].tagName !== undefined){
                indelse = -2;
            }
            
            //都找到了
            if(indif !== -1 && indelse !== -1){
                break;
            }
        }
        if(v && v !== 'false'){ //为真
            let ind = 0;
            //删除else
            if(indelse > 0){
                parent.children[indelse].dontRender = true;
            }
        }else if(indelse>0){    //为假则进入else渲染
            //替换if
            dom.dontRender = true;
        }
        return true;
    }

});

/**
 * 指令名 else
 * 描述：else指令
 */
DirectiveManager.addType('else',{
    name:'else',
    init:(directive,dom,module)=>{
        return;
    },
    handle:(directive,dom,module,parent)=>{
        return;
    }
});

/**
 * 指令名 show
 * 描述：显示指令
 */
DirectiveManager.addType('show',{
    init:(directive,dom,module)=>{
        let value = directive.value;
        if(!value){
            throw Error.handle("paramException","x-show");
        }
        //value为一个表达式
        let expr = new Expression(value,module);
        directive.value = expr;
    },
    handle:(directive,dom,module,parent)=>{
        //设置forceRender
        let model = module.modelFactory.get(dom.modelId);
        let v = directive.value.val(model);
        
        // 获取style属性数组
        let arr = dom.style?dom.style.split(';'):[];
        let find = false;
        let show = v && v !== 'false'? 'block':'none';
        for(let i=0;i<arr.length;i++){
            if(arr[i].indexOf('display:') === -1){
                find = true;
                arr[i] = 'display:' + show;
                break;
            }
        }
        if(!find){
            arr.push('display:' + show);
        }
        //组合style属性
        dom.props['style'] = arr.join(';');
    }
});

/**
 * 指令名 class
 * 描述：class指令
 */
DirectiveManager.addType('class',{
    init:(directive,dom,module)=>{
        //转换为json数据
        let obj = eval('(' + directive.value + ')');
        if(!nodom.isObject(obj)){
            return;
        }
        let robj = {};
        nodom.getOwnProps(obj).forEach(function(key){
            if(nodom.isString(obj[key])){
                //如果是字符串，转换为表达式
                robj[key] = new Expression(obj[key],module);
            }else{
                robj[key] = obj[key];
            }
        });
        directive.value = robj;
    },
    handle:(directive,dom,module,parent)=>{
        let obj = directive.value;
        let clsArr = [];
        let cls = dom.props['class'];
        let model = module.modelFactory.get(dom.modelId);
        if(nodom.isString(cls) && !nodom.isEmpty(cls)){
            clsArr = cls.trim().split(/\s+/);
        }

        nodom.getOwnProps(obj).forEach(function(key){
            let r = obj[key];
            // console.log(r);
            if(r instanceof Expression){
                r = r.val(model);
            }
            let ind = clsArr.indexOf(key);
            // console.log(r,dom);
            if(!r || r === 'false'){
                //移除class
                if(ind !== -1){
                    clsArr.splice(ind,1);
                }
            }else if(ind === -1){ //添加class
                clsArr.push(key);
            }
        });
        //刷新dom的class
        dom.props['class'] = clsArr.join(' ');
    }
});

/**
 * 指令名 field
 * 描述：字段指令
 */
DirectiveManager.addType('field',{
    init:(directive,dom,module)=>{
        // 带过滤器情况
        let dv = directive.value;
        let field = dv;
        let tgname = dom.tagName.toLowerCase();
        let type = dom.props['type'];
        let eventName = 'input';
        if(tgname === 'input' && (type === 'checkbox' || type === 'radio')){
            eventName = 'change';
        }

        //增加name属性
        dom.props['name'] = field;

        //增加自定义方法
        let method = '$nodomGenMethod' + nodom.genId();
        module.methodFactory.add(method,
            function(e,module,view,dom){
                let type = dom.props['type'];
                let model = module.modelFactory.get(dom.modelId);
                let field = dom.getDirective('field').value;
                let v = view.value;
                //根据选中状态设置checkbox的value
                if(type === 'checkbox'){
                    if(dom.props['yes-value'] == v){
                        v = dom.props['no-value'];
                    }else{
                        v = dom.props['yes-value'];
                    }
                }else if(type === 'radio'){
                    if(!view.checked){
                        v = undefined;
                    }
                }
                //修改字段值
                this.data[field] = v;
                //修改value值，该节点不重新渲染
                if(type !== 'radio'){
                    dom.props['value'] = v;
                    view.value = v;
                }
            }
        );
        //追加事件
        dom.events[eventName] = new Event(eventName,method);

        //增加value属性，属性可能在后面，需要延迟处理
        setTimeout(()=>{
            //增加value属性
            if(!dom.exprProps.hasOwnProperty('value') && !dom.props.hasOwnProperty('value')){
                dom.exprProps['value'] = new Expression(field,module);
            }    
        },0);
        
    },

    handle:(directive,dom,module,parent)=>{
        const type = dom.props['type'];
        const tgname = dom.tagName.toLowerCase();
        const model = module.modelFactory.get(dom.modelId);
        const dataValue = model.data[directive.value];
        let value = dom.props['value'];
            
        if(type === 'radio'){
            if(dataValue == value){
                dom.props['checked'] = 'checked';
            }else{
                delete dom.props['checked'];
            }
        }else if(type === 'checkbox'){
            //设置状态和value
            let yv = dom.props['yes-value'];
            //当前值为yes-value
            if(dataValue == yv){
                dom.props['checked'] = 'checked';
                dom.props['value'] = yv;
            }else{ //当前值为no-value
                delete dom.props['checked'];
                dom.props['value'] = dom.props['no-value'];
            }
        }else if(tgname === 'select'){ //下拉框
            dom.props['value'] = dataValue;
            //option可能没生成，延迟赋值
            setTimeout(function(){
                module.container.querySelector("[key='"+ dom.key +"']").value = dataValue;
            },0);
        }
    }
});

/**
 * 指令名 validity
 * 描述：字段指令
 */
 DirectiveManager.addType('validity',{
    init:(directive,dom,module)=>{
        let ind,fn,method;
        let value = directive.value;
        //处理带自定义校验方法
        if((ind=value.indexOf('|')) !== -1){
            fn = value.substr(0,ind);
            method=value.substr(ind+1);
        }else{
            fn = value;
        }
        directive.value = fn;
        
        directive.params = {
            enabled:false    //不可用
        }
        //如果有方法，则需要存储
        if(method){
            directive.params.method = method;
        }

        //如果没有子节点，添加一个，需要延迟执行
        setTimeout(()=>{
            if(dom.children.length === 0){
                let vd1 = new Element();
                vd1.textContent = '   ';
                dom.children.push(vd1);
            }else{ //子节点
                dom.children.forEach((item)=>{
                    if(item.children.length === 0){
                        let vd1 = new Element();
                        vd1.textContent = '   ';
                        item.children.push(vd1);      
                    }
                })
            }

        },0);

        //添加focus和blur事件
        module.addFirstRenderOperation(function(){
            const m = this;
            const el = module.container.querySelector("[name='" + directive.value + "']");
            if(el){
                //增加事件
                el.addEventListener('focus',function(e){
                    el.canBeValid = true;
                });
                el.addEventListener('blur',function(e){
                    Renderer.add(m);
                });
            }
        });
    },
    
    handle:(directive,dom,module,parent)=>{
        const el = module.container.querySelector("[name='" + directive.value + "']");
        
        if(!el || !el.canBeValid){
            dom.dontRender = true;
            return;
        }
        
        let chds = [];
        //找到带rel的节点
        dom.children.forEach((item)=>{
            if(item.tagName !== undefined && item.props.hasOwnProperty('rel')){
                chds.push(item);
            }
        });
        
        let resultArr = [];

        //自定义方法校验
        if(directive.params.method){
            const foo = module.methodFactory.get(directive.params.method);
            if(nodom.isFunction(foo)){
                let r = foo.call(module.model,el.value);
                if(!r){
                    resultArr.push('custom');
                }
            }
        }

        let vld = el.validity;
        if(!vld.valid){
            // 查找校验异常属性
            for(var o in vld){
                if(vld[o] === true) {
                    resultArr.push(o);
                }
            }
        }
        if(resultArr.length>0){
            //转换成ref对应值
            let vn = handle(resultArr);
            //单个校验
            if(chds.length === 0){
                setTip(dom,vn,el);
            }else{ //多个校验
                for(let i=0;i<chds.length;i++){
                    let rel = chds[i].props['rel'];
                    if(rel === vn){
                        setTip(chds[i],vn,el);
                    }else{ //隐藏
                        chds[i].dontRender = true;
                    }
                }
            }
        }else{
            dom.dontRender = true;
        }
    

        /**
         * 设置提示
         * @param vd    dom节点
         * @param vn    验证结果名
         */
        function setTip(vd,vn,el){
            //子节点不存在，添加一个
            let text = vd.children[0].textContent.trim();
            if(text === ''){  //没有提示内容，根据类型提示
                text = nodom.compileStr(nodom.FormMsgs[vn],el.getAttribute(vn));
            }
            vd.children[0].textContent = text;
        }

        /**
         * 验证名转换
         */
        function handle(arr){
            for(var i=0;i<arr.length;i++){
                switch(arr[i]){
                    case 'valueMissing':
                        return 'required';
                    case 'typeMismatch':
                        return 'type';
                    case 'tooLong':
                        return 'maxLength';
                    case 'tooShort':
                        return 'minLength';
                    case 'rangeUnderflow':
                        return 'min';
                    case 'rangeOverflow':
                        return 'max';
                    case 'patternMismatch':
                        return 'pattern';
                    default:
                        return arr[i];
                }
            }
        }
    }
});


/**
 * 过滤器类型初始化
 */

/**
 * 格式化日期
 * @param format    日期格式
 */
FilterManager.addType('date',(value,param)=>{
 	if(nodom.isEmpty(value)){
        return '';
    }
    //去掉首尾" '
    param = param.substr(1,param.length-2);
    return nodom.formatDate(value,param);
});


/**
 * 转换为货币
 * @param sign  货币符号¥ $ 等，默认 ¥
 */
FilterManager.addType('currency',(value,sign)=>{
    if(isNaN(value)){
        return '';
    }
    
    sign = sign || '¥';

    if(typeof value === 'string'){
        value = parseFloat(value);
    }
    return sign + ((value * 100 + 0.5 | 0) / 100);
});

/**
 * 格式化，如果为字符串，转换成数字，保留小数点后位数
 * @param digits    小数点后位数
 */
FilterManager.addType('number',(value,param)=>{
    let digits = param || 0;

    if(isNaN(value) || digits < 0){
        return '';
    }
    if(typeof value === 'string'){
        value = parseFloat(value);
    }
    
    let x = 1;
    for(let i=0;i<digits;i++){
        x*=10;
    }
    return ((value * x + 0.5) | 0) / x;
});

/**
 * 转换为小写字母
 */
FilterManager.addType('tolowercase',(value)=>{
    if(nodom.isEmpty(value)){
        return '';
    }
    if(!nodom.isString(value) || nodom.isEmpty(value)){
        throw Error.handle('invoke1',nodom.words.filter + ' tolowercase',0,'string');
    }
    return value.toLowerCase();
});

/**
 * 转换为大写字母
 */
FilterManager.addType('touppercase',(value)=>{
    if(nodom.isEmpty(value)){
        return '';
    }
    if(!nodom.isString(value) || nodom.isEmpty(value)){
        throw Error.handle('invoke1',nodom.words.filter + ' touppercase',0,'string');
    }
    return value.toUpperCase();
});

/**
 * 数组排序
 * @param arr       数组
 * @param param     
 *     用法: orderBy:字段:desc/asc
 */
FilterManager.addType('orderby',function(){
    let args = arguments;
    let arr = args[0];				//数组
    let field = args[1];			//比较字段
    let odr = args[2] || 'asc';    	//升序或降序,默认升序
    if(!nodom.isArray(arr)){
        throw Error.handle('invoke1',nodom.words.filter + ' orderby',0,'array');
    }
    //复制数组
    let ret = arr.concat([]);
    if(field && nodom.isObject(arr[0])){ //对象数组
    	if(odr === 'asc'){
	        ret.sort((a,b)=>a[field]>=b[field]?1:-1);
    	}else{
    		ret.sort((a,b)=>b[field]<=a[field]?1:-1);
    	}
    }else{  //值数组
    	if(odr === 'asc'){
	        ret.sort((a,b)=>a>=b?1:-1);
    	}else{
    		ret.sort((a,b)=>b<=a?1:-1);
    	}
    }
    return ret;
});

/**
 * 数组过滤
 * 用法: 无参数select:odd 带参数 select:range:1:5
 * odd      奇数，返回索引号为奇数的数组元素
 * even     偶数，返回索引号为偶数的数组元素
 * value    返回值中含有指定字符的数组元素
 *          {prop1:v1,prop2:v2,...} 满足所有属性prop的值中含有对应字符或相等值的数组元素
 * func     自定义函数过滤
 * range    数组范围1:5 返回索引1到5的数组元素
 * index    数组索引序列1:2:3 返回索引1，2，3的元素
 */
FilterManager.addType('select',function(){
    if(!nodom.isArray(arguments[0])){
        throw Error.handle('invoke1',nodom.words.filter + ' filter',0,'array');
    }

    let params = new Array();
    for(let i=0;i<arguments.length;i++){
    	params.push(arguments[i]);
    }
    //内部处理方法对象
    let handler = {
    	//奇数索引过滤
        odd:function(){
        	let arr = arguments[0];
            let ret = [];
            for(let i=0;i<arr.length;i++){
                if(i%2 === 1){
                    ret.push(arr[i]);
                }
            }
            return ret;
        },
        //偶数索引过滤
        even:function(){
        	let arr = arguments[0];
            let ret = [];
            for(let i=0;i<arr.length;i++){
                if(i%2 === 0){
                    ret.push(arr[i]);
                }
            }
            return ret;
        },
        //索引区域过滤
        range:function(){
        	let args = arguments;
        	let arr = args[0];
            let ret = [];
            //第一个索引,第二个索引
            let first = args[1];
            let last = args[2];
            if(isNaN(first)){
                throw Error.handle('paramException',nodom.words.filter , 'filter range');
            }
            if(!nodom.isNumber(first)){
            	first = parseInt(first);	
            }
            //判断数字
            if(isNaN(last)){
                throw Error.handle('paramException',nodom.words.filter , 'filter range');
            }

            //字符串转数字
            if(!nodom.isNumber(last)){
            	last = parseInt(last);	
            }
            
            if(first > last){
                throw Error.handle('paramException',nodom.words.filter , 'filter range');   
            }
            return arr.slice(first,last+1);
        },
        //索引过滤
        index:function(){
            let args = arguments;
            let arr = args[0];
            if(!nodom.isArray(args[0])){
                throw Error.handle('paramException',nodom.words.filter,'filter index');
            }
            let ret = [];
            //读取所有index
            if(arr.length>0){
            	for(let i=1;i<args.length;i++){
	            	if(isNaN(args[i])){
	                    continue;
	                }
	                let k = parseInt(args[i]);
	                if(k < arr.length){
	                	ret.push(arr[k]);
	                }
	            }	
            }
            return ret;
        },
        //函数过滤
        func:function(arr,param){
            if(!nodom.isArray(arr) || nodom.isEmpty(param)){
                throw Error.handle('paramException',nodom.words.filter,'filter func');   
            }
            //自定义函数
            let foo = this.methodFactory.get(param);
            if(nodom.isFunction(foo)){
                return foo(arr);    
            }
            return arr;
        },
        //值过滤
        value:function(arr,param){
        	if(!nodom.isArray(arr) || nodom.isEmpty(param)){
                throw Error.handle('paramException',nodom.words.filter,'filter value');   
            }
            //属性值对象，所有属性值满足才过滤出来
            if(nodom.isObject(param)){
                let keys = nodom.getOwnProps(param);
                return arr.filter(function(item){
                    for(let i=0;i<keys.length;i++){
                        let v =  item[keys[i]];
                        let v1 = param[keys[i]];
                        //找不到属性值，或者不相等并且是字符串且不包含的情况都返回false
                        if(v === undefined || v !== v1 && typeof v === 'string' && v.indexOf(v1) === -1){
                            return false;
                        }
                    }
                    //都匹配则返回true
                    return true;
                });
            }else{//字符串
                return arr.filter(function(item){
                    let props = nodom.getOwnProps(item);
                    for(let i=0;i<props.length;i++){
                        let v = item[props[i]];
                        if(nodom.isString(v) && v.indexOf(param) !== -1){
                            return item;
                        }
                    }
                });
            }
        }
    }
    
    let type;
    //类型匹配并处理
    if(nodom.isString(params[1])) {
        type = params[1].trim();
        if(handler.hasOwnProperty(type)){
            //去掉type
            params.splice(1,1);    
        }else{//默认为value
            type = 'value';
        }       
    }else{//默认为value，值对象
        type = 'value';
    }

    //校验输入参数是否为空
    if(type === 'range' || type === 'index' || type === 'func'){
        if(params.length < 2){
            throw Error.handle('paramException',nodom.words.filter);
        }
    }
    //方法调用
    return nodom.apply(handler[type],this,params);
});

/**
 * html过滤器
 */
FilterManager.addType('html',(value)=>{
    if(nodom.isEmpty(value)){
        return '';
    }
    let div = nodom.newEl('div');
    div.innerHTML = value;
    let frag = document.createDocumentFragment();
    for(let i=0;i<div.childNodes.length;i++){
        frag.appendChild(div.childNodes[i]);
    }
    return frag; 
});

Class.add('Directive',Directive);
Class.add('Filter',Filter);
Class.add('Expression',Expression);
Class.add('Element',Element);
Class.add('Module',Module);
Class.add('Model',Model);
Class.add('Event',Event);
Class.add('Route',Route);
Class.add('DirectiveFactory',DirectiveFactory);
Class.add('ExpressionFactory',ExpressionFactory);
Class.add('MethodFactory',MethodFactory);
Class.add('MessageFactory',MessageFactory);
Class.add('ModelFactory',ModelFactory);
Class.add('ModuleFactory',ModuleFactory);


/**
 * 暴露方法集
 */


/**
 * 暴露的创建模块方法
 * @param config  数组或单个配置
 */
nodom.createModule = function(config){
	if(nodom.isArray(config)){
		config.forEach((item)=>{
			new Module(item);
		});
	}else{
		return new (config);
	}
}

/**
 * 暴露的创建路由方法
 * @param config  数组或单个配置
 */
nodom.createRoute = function(config){
	if(nodom.isArray(config)){
		config.forEach((item)=>{
			new Route(item);
		});
	}else{
		return new Route(config);
	}
}