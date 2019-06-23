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