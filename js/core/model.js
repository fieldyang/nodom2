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