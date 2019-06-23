/**
 * 工厂基类
 */
class Factory{
	constructor(module){
		if(module !== undefined){
			this.moduleName = module.name;
		}
		//容器map
		this.items = new Map();
	}

	/**
	 * 添加到工厂
	 */
	add(name,item){
		this.items.set(name,item);
	}

	/**
	 * 获得item
	 */
	get(name){
		return this.items.get(name);
	}

 	/**
 	 * 从容器移除
 	 */
	remove(name){
		this.items.delete(name);
	}

	
}
