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
	 * @param 
	 * @return 			根据类创建的实例
	 */
	static newInstance(clsName,config){
		let cls = this.items.get(clsName);
		if(cls === undefined){}
		return Reflect.construct(cls);
	}
}

Class.items = new Map();
