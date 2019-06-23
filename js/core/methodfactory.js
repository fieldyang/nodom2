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