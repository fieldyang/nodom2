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