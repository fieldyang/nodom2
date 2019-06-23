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
    static init(directive,dom,module){
        let dt = this.directiveTypes.get(directive.type);
    	if(dt === undefined){
    		throw Error.handle('notexist1',nodom.words.directiveType,name);
    	}
    	return dt.init(directive,dom,module);
    }

	/**
     * 执行指令
     * @param arguments 参数数组  0模块 1指令类型 2待处理值 3-n处理参数
	 */
	static exec(directive,ele,parent){
		if(!this.directiveTypes.has(directive.type)){
			throw Error.handle('notexist1',nodom.words.directiveType,type);
		}
		//调用
		return nodom.apply(this.directiveTypes.get(directive.type).handle,null,arguments);
	}

	
}

DirectiveManager.directiveTypes = new Map();
//不可编辑类型
DirectiveManager.cantEditTypes = ['model','repeat','if','else','show','class','field'];

        