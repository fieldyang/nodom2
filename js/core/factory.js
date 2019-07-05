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
