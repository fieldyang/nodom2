/**
 * 模块类
 */
class Module{
	constructor(config){
		const me = this;
		me.id = nodom.genId();
		me.className = 'Module';
		me.firstRender = true;	//是否是首次渲染
		me.rendered = false;
		me.virtualDom = undefined; 			//原始虚拟dom
		me.renderTree = undefined;			//渲染的虚拟dom树
		me.parentName = undefined; 			//父模块名
		me.children = undefined; 			//子模块（数组）
		me.selector = undefined; 			//container 选择器
		me.isMain = false; 					//主模块
		me.firstRenderOps = [];   			//首次渲染后执行数组
		me.beforeFirstRenderOps = [];  		//首次渲染前执行数组
		me.containerParam = undefined; 		//container 参数{module:,selector:}
		me.state = 0; 						//状态 0 create(创建)、1 init(初始化，已编译)、2 unactive(渲染后被置为非激活) 3 active(激活，可渲染显示)、4 dead(死亡)

		// 模块名字
		if(config.name){
			me.name = config.name;
		}else{
			me.name = 'Module' + nodom.genId();
		}

		// 把模块添加到工厂
		ModuleFactory.add(me.name,me);
		
		me.methodFactory = new MethodFactory(me);
		me.modelFactory = new ModelFactory(me);
		
		me.expressionFactory = new ExpressionFactory(me);
		me.directiveFactory = new DirectiveFactory(me);
		me.renderDoms = [];			//修改渲染的el数组
		
		if(config){
			//保存config，存在延迟初始化情况
			me.initConfig = config;

			//保存container参数
			if(nodom.isString(config.el)){
				me.containerParam = {
					module:config.parentName,
					selector:config.el
				};
			}else if(nodom.isEl(config.el)){  //element
				me.container = config.el;
			}

			//方法加入工厂
			if(nodom.isObject(config.methods)){
				nodom.getOwnProps(config.methods).forEach((item)=>{
					me.methodFactory.add(item,config.methods[item]);
				});
			}
			me.templateStr = '';
			//清除container的内部内容
			if(me.hasContainer()){
				me.templateStr = me.container.innerHTML.trim();
				me.container.innerHTML = '';
			}

			//主模块
			if(config.root){ 
				me.isMain = true;  
				ModuleFactory.setMain(me);
				me.active();
			}

			//不延迟初始化或为主模块，需要立即初始化
			if(!config.delayInit || me.isMain){
				me.init();
			}
		}
	}

	/**
     * 加载模块
     * @param callback  加载后的回调函数
     */
    init(){
        const me = this;
        //已初始化，不用再初始化
        if(me.state !== 0 || me.initing){
        	return me.initLinker;
        }

        me.initing = true;
        let config = me.initConfig;
        let typeArr = [];  //请求类型数组
    	let urlArr = [];   //请求url数组
    	//app页面路径
    	let appPath = nodom.config.appPath || '';
        if(nodom.isArray(config.requires) && config.requires.length>0){
        	config.requires.forEach((item)=>{
        		let type;
        		let url = '';
        		if(nodom.isObject(item)){  //为对象，可能是css或js
        			type = item.type || 'js';
        			url += item.path;
        		}else{   //js文件
        			type = 'js';
        			url += item; 
        		}
        		//如果已经加载，则不再加载
        		if(type === 'css'){
        			let css = nodom.get("link[href='" + url + "']"); 
	                if(cs !== null){     
	                    return; 
	                }
	                css = nodom.newEl('link');
	                css.type = 'text/css'; 
	                css.rel = 'stylesheet';  // 保留script标签的path属性
	                css.href = path; 
	                head.appendChild(css); 
	                return;
        		}else if(type === 'js'){
        			let cs = nodom.get("script[dsrc='" + url + "']");
	                if(cs !== null){ 
	                    return;
	                }
        		}
        		typeArr.push(type);
        		urlArr.push(url);
        	});
        }


        //模版信息
        if(config.template){ //模版串
        	//合并容器中的内容和template模版内容
    		me.templateStr += config.template.trim();
    	}else if(config.templateUrl){ //模版文件
    		typeArr.push('template');
    		urlArr.push(appPath + config.templateUrl);
    	}else if(config.compiledJson){ //编译后的json串
    		typeArr.push('compiled');
    		urlArr.push(appPath + config.compiledJson);
    	}
    	
    	//如果已存在templateStr，则直接编译
    	if(!nodom.isEmpty(me.templateStr)){
    		me.virtualDom = Compiler.compile(me,me.templateStr);
			//用后删除
			delete me.templateStr;
		}

    	//数据信息
    	if(config.data){ //数据
    		me.model = new Model(config.data,me);
    	}else if(config.dataUrl){  //数据文件url
    		typeArr.push('data');
    		urlArr.push(config.dataUrl);
    	}
    	
    	//批量请求文件
    	if(typeArr.length > 0){
    		me.initLinker = new Linker('getfiles',urlArr).then((files)=>{
	    		let head = document.querySelector('head');
	    		files.forEach((file,ind)=>{
	    			switch(typeArr[ind]){
	    				case 'js':
	    					let script = nodom.newEl('script');
	    					script.innerHTML = file;
			                head.appendChild(script);
			                script.setAttribute('dsrc',urlArr[ind]);
			                script.innerHTML = '';
	                    	head.removeChild(script);
	    					break;
	    				case 'template':
	    					me.virtualDom = Compiler.compile(me,file.trim());
	    					break;
	    				case 'compiled': //预编译后的js文件

	    					break;
	    				case 'data': 	//数据
	    					me.model = new Model(JSON.parse(file),me);
	    			}
	    		});
	    		//主模块状态变为3
		    	changeState(me);
		    	delete me.initing;
	    	});	
    	}else{
    		me.initLinker = Promise.resolve();
    		//修改状态
    		changeState(me);
    		delete me.initing;
    	}


    	if(nodom.isArray(me.initConfig.modules)){
    		me.initConfig.modules.forEach((item)=>{
    			me.addChild(item);
    		});
    	}

    	//初始化后，不再需要initConfig
		delete me.initConfig;
		return me.initLinker;
		/**
    	 * 修改状态
    	 * @param mod 	模块
    	 */
    	function changeState(mod){
    		if(mod.isMain){
    			mod.state = 3;
    			//可能不能存在数据，需要手动添加到渲染器
    			Renderer.add(mod);
    		}else if(mod.parentName){
    			mod.state = ModuleFactory.get(mod.parentName).state;
    		}else{
    			mod.state = 1;
    		}
    	}
    	
    }

	/**
	 * 模型渲染
	 * @return false 渲染失败 true 渲染成功
	 */
	render(){
		const me = this;
		//容器没就位或state不为active则不渲染，返回渲染失败
		if(!me.hasContainer() || me.state !== 3 || !me.virtualDom){
			return false;
		}

		//克隆新的树
		let root = me.virtualDom.clone(me);
		
		if(me.firstRender){
			//执行首次渲染前事件
			me.doModuleEvent('onBeforeFirstRender');
			me.beforeFirstRenderOps.forEach((foo)=>{
				nodom.apply(foo,me,[]);
			});
			me.beforeFirstRenderOps = [];
			//渲染树
			me.renderTree = root;	
			if(me.model){
				root.modelId = me.model.id;
			}
			root.render(me,null);
			//渲染到html
			if(root.children){
				root.children.forEach((item)=>{
					item.renderToHtml(me,{type:'fresh'});
				});	
			}

			//删除首次渲染标志
			delete me.firstRender;
			//延迟执行
			setTimeout(()=>{
				//执行首次渲染后事件
				me.doModuleEvent('onFirstRender');
				//执行首次渲染后操作队列
				me.firstRenderOps.forEach((foo)=>{
					nodom.apply(foo,me,[]);
				});
			},0);
			
		}else{  //增量渲染
			//执行每次渲染前事件
			me.doModuleEvent('onFirstRender');
			if(me.model){
				root.modelId = me.model.id;
				let oldTree = me.renderTree;
				me.renderTree = root;
				//渲染
				root.render(me,null);

				// 比较节点
				root.compare(oldTree,me.renderDoms);
				// 删除
				for(let i=me.renderDoms.length-1;i>=0;i--){
					let item = me.renderDoms[i];
					if(item.type === 'del'){
						item.node.removeFromHtml(me);
						me.renderDoms.splice(i,1);
					}
				}

				// 渲染
				me.renderDoms.forEach((item)=>{
					item.node.renderToHtml(me,item);
				});
			}
			
			//执行首次渲染后事件，延迟执行
			setTimeout(()=>{
				me.doModuleEvent('onRender');
			},0);
			
		}

		//数组还原
		me.renderDoms = [];

		//子模块渲染
		if(nodom.isArray(me.children)){
			me.children.forEach(item=>{
				item.render();
			});
		}
		return true;
	}

	// 检查容器是否存在，如果不存在，则尝试找到
	hasContainer(){
		const me = this;

		if(me.container){
			return true;
		}else if(me.containerParam !== undefined){
			let ct;
			if(me.containerParam.module === undefined){  //没有父节点
				ct = document;
			}else{
				let module = ModuleFactory.get(me.containerParam.module);
				if(module){
					ct = module.container;
				}
			}

			if(ct){
				me.container = ct.querySelector(me.containerParam.selector);
				return me.container !== null;
			}

		}
		
		return false;
	}
	/**
	 * 数据改变
	 * @param model 	改变的model
	 */
	dataChange(model){
		Renderer.add(this);
	}

	/**
	 * 添加子模块
	 * @param config 	模块配置 
	 */
	addChild(config){
		const me = this;
		config.parentName = me.name;
		let chd = new Module(config);
		if(me.children === undefined){
			me.children = [];
		}
		me.children.push(chd);
		return chd;
	}

	/**
	 * 发送
	 * @param toName 		接受模块名
	 * @param data 			消息内容
	 */
	send(toName,data){
		MessageFactory.add(this.name,toName,data);
	}


	/**
	 * 广播给父、兄弟和孩子（第一级）节点
	 */
	broadcast(data){
		const me = this;
		//兄弟节点
		if(me.parentName){
			let pmod = ModuleFactory.get(me.parentName);
			if(pmod && pmod.children){
				me.send(pmod.name,data);
				pmod.children.forEach((m)=>{
					//自己不发
					if(m === me){
						return;
					}
					me.send(m.name,data);
				});
			}
		}

		if(me.children !== undefined){
			me.children.forEach((m)=>{
				me.send(m.name,data);
			});
		}
	}

	/**
	 * 接受消息
	 * @param fromName 		来源模块名
	 * @param data 			消息内容
	 */
	receive(fromName,data){
		this.doModuleEvent('onReceive',[fromName,data]);
	}

	
	/**
	 * 激活
	 * @param callback 	激活后的回调函数
	 */
	active(callback){
		const me = this;
		//激活状态不用激活，创建状态不能激活
		if(me.state === 3){
			return;
		}
		let linker;
		//未初始化，需要先初始化
		if(me.state === 0){
			me.init().then(()=>{
				me.state = 3;
				if(nodom.isFunction(callback)){
					callback(me.model);
				}
				Renderer.add(me);
			});
		
		}else{
			me.state = 3;
			if(callback){
				callback(me.model);
			}
			Renderer.add(me);
		}

		//子节点
		if(nodom.isArray(me.children)){
			me.children.forEach((m)=>{
				m.active(callback);
			});
		}
		if(!linker){
			return Promise.resolve();
		}	
		return linker;
	}

	/**
	 * 取消激活
	 */
	unactive(){
		const me = this;
		//主模块不允许取消
		if(me.isRoot || me.state===2){
			return;
		}
		me.state = 2;
		//设置首次渲染标志
		me.firstRender = true;
		delete me.container;
		if(nodom.isArray(me.children)){
			me.children.forEach((m)=>{
				m.unactive();
			});
		}
	}

	/**
	 * 模块终结
	 */
	dead(){
		if(this.state === 4){
			return;
		}
		
		me.state = 4;

		if(nodom.isArray(me.children)){
			me.children.forEach((m)=>{
				m.unactive();
			});
		}
	}

	destroy(){
		if(nodom.isArray(me.children)){
			me.children.forEach((m)=>{
				m.destroy();
			});
		}
		//从工厂释放
		ModuleFactory.remove(me.name);
	}


	/*************事件**************/

	/**
	 * 执行模块事件
	 * @param eventName 	事件名
	 * @param param 		参数，为数组
	 */
	doModuleEvent(eventName,param){	
		const me = this;
		let foo = me.methodFactory.get(eventName);
		//调用onReceive方法
		if(nodom.isFunction(foo)){
			nodom.apply(foo,me.model,param);
		}
	}

	/**
	 * 添加首次渲染后执行操作
	 * @param foo  	操作方法
	 */
	addFirstRenderOperation(foo){
		let me = this;
		if(!nodom.isFunction(foo)){
			return;
		}
		if(me.firstRenderOps.indexOf(foo) === -1){
			me.firstRenderOps.push(foo);
		}
	}

	/**
	 * 添加首次渲染前执行操作
	 * @param foo  	操作方法
	 */
	addBeforeFirstRenderOperation(foo){
		let me = this;
		if(!nodom.isFunction(foo)){
			return;
		}
		if(me.beforeFirstRenderOps.indexOf(foo) === -1){
			me.beforeFirstRenderOps.push(foo);
		}
	}
}
