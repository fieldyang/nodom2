/**
 * 指令类
 */
class Directive{
	/**
	 * 构造方法
	 * @param type  	类型
	 * @param value 	指令值
	 * @param vdom 		虚拟dom
	 */
	constructor(type,value,vdom,module){
		this.className = 'Directive';
		this.type = type;
		
		if(value !== undefined){
			this.value = value.trim();
		}

		if(type !== undefined){
			nodom.apply(DirectiveManager.init,DirectiveManager,[this,vdom,module]);
		}
		this.id = nodom.genId();
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
