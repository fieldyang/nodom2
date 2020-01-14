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
	 * @param el 		element
	 */
	constructor(type,value,vdom,module,el){
		const me = this;
		me.type = type;
		if(nodom.isString(value)){
			me.value = value.trim();
		}
		if(type !== undefined){
			nodom.apply(DirectiveManager.init,DirectiveManager,[me,vdom,module,el]);
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
