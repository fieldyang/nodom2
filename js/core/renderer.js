class Renderer{
	/**
	 * 添加到渲染列表
	 * @param module 		模块
	 */
	static add(module){
		const me = this;
		//非激活状态
		if(module.state !== 3){
			return;
		}
		//如果已经在列表中，不再添加
		if(me.waitList.indexOf(module.name) === -1){
			//计算优先级
			me.waitList.push(module.name);
		}
	}
	//从列表移除
	static remove(module){
		let ind;
		if((ind = me.waitList.indexOf(module.name)) !== -1){
			me.waitList.splice(ind,1);
		}
	}

	/**
	 * 队列渲染
	 */
	static render(){
		const me = this;

		//调用队列渲染
		for(let i=0;i<Renderer.waitList.length;i++){
			let m = ModuleFactory.get(Renderer.waitList[i]);
			if(!m || m.render()){
				Renderer.waitList.splice(i--,1);
			}
		}
	}
}

Renderer.waitList = [];

