/**
 * 暴露方法集
 */


/**
 * 暴露的创建模块方法
 * @param config  数组或单个配置
 */
nodom.createModule = function(config){
	if(nodom.isArray(config)){
		config.forEach((item)=>{
			new Module(item);
		});
	}else{
		return new (config);
	}
}

/**
 * 暴露的创建路由方法
 * @param config  数组或单个配置
 */
nodom.createRoute = function(config){
	if(nodom.isArray(config)){
		config.forEach((item)=>{
			new Route(item);
		});
	}else{
		return new Route(config);
	}
}