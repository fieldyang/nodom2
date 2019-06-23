/**
 * 调度器，用于每次空闲的待操作序列调度
 */
class Scheduler{
	static dispatch(){
		Scheduler.tasks.forEach((foo)=>{
			if(nodom.isFunction(foo)){
				foo();	
			}
		});
	}

	static start(){
		Scheduler.dispatch();
		if(window.requestAnimationFrame){
		 	window.requestAnimationFrame(Scheduler.start);
		}else{
			window.setTimeout(Scheduler.start,nodom.config.renderTick);
		}		
	}

	/**
	 * 添加任务
	 * @param foo 	任务
	 */
	static addTask(foo){
		if(!nodom.isFunction(foo)){
			throw Error.handle("invoke","Scheduler.addTask","0","function");
		}
		if(Scheduler.tasks.indexOf(foo) !== undefined){
			Scheduler.tasks.push(foo);	
		}
	}

	/**
	 * 移除任务
	 * @param foo 	任务
	 */
	static removeTask(foo){
		if(!nodom.isFunction(foo)){
			throw Error.handle("invoke","Scheduler.removeTask","0","function");
		}
		let ind = -1;
		if((ind = Scheduler.tasks.indexOf(foo)) !== -1){
			Scheduler.tasks.splice(ind,1);
		}	
	}
}

Scheduler.tasks = [];

//消息工厂发消息
Scheduler.addTask(MessageFactory.broadcast);

//渲染器启动渲染
Scheduler.addTask(Renderer.render);
//启动调度
Scheduler.start();



