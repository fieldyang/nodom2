/**
 * 路由，主要用于模块间跳转，一个应用中存在一个router，多个route，route节点采用双向链表存储
 * @author 		yanglei
 * @since 		1.0.0
 * @date		2017-01-21
 * @description	采用修改页面hash方式进行路由历史控制，每个route 可设置onEnter事件(钩子) 和 onLeave事件(钩子)
 * 回调调用的几个问题
 * onLeave事件在路由切换时响应，如果存在多级路由切换，则从底一直到相同祖先路由，都会进行onLeave事件响应
 *  如：从/r1/r2/r3  到 /r1/r4/r5，则onLeave响应顺序为r3、r2
 *  onEnter事件则从上往下执行
 */
class Router{
	/**
	 * 往路由管理器中添加路径
	 * @param path 	路径 
	 */
	static addPath(path){
		const me = this;
		for(let i=0;i<me.waitList.length;i++){
			let li = me.waitList[i];
			//相等，则不加入队列
			if(li === path){
				return;
			}
			//父路径，不加入
			if(li.indexOf(path) === 0 && li.indexOf(path.length+1) === '/'){
				return;
			}
		}
		me.waitList.push(path);
		me.load();
	}

	/**
	 * 启动加载
	 * @param path 
	 */
	static load(){
		const me = this;
		
		//在加载，或无等待列表，则返回
		if(me.loading || me.waitList.length === 0){
			return;
		}
		let path = me.waitList.shift();
		me.loading = true;
		me.start(path);
	}

	/**
	 * 切换路由
	 * @param path 	路径
	 */
	static start(path){
		const me = this;
		let diff = me.compare(me.currentPath,path);
		//获得当前模块，用于寻找router view
		let parentModule = diff[0] === null?ModuleFactory.getMain():ModuleFactory.get(diff[0].module);
		//onleave事件，从末往前执行
		for(let i=diff[1].length-1;i>=0;i--){
			const r = diff[1][i];
			if(!r.module){
				continue;
			}
			let module = ModuleFactory.get(r.module);
			if(nodom.isFunction(me.onDefaultLeave)){
				me.onDefaultLeave(module.model);
			}
			if(nodom.isFunction(r.onLeave)){
				r.onLeave(module.model);
			}
			//module置为不激活
			module.unactive();
		}

		let operArr = [];  	//待操作函数数组
		let paramArr = []; 	//函数对应参数数组
		let showPath = '';  //实际要显示的路径

		//设置active
		
		if(diff[2].length === 0){ //路由相同，参数不同
			if(diff[0] !== null){
				setRouteParamToModel(diff[0]);
				//用父路由路径
				if(!diff[0].useParentPath){
					showPath = diff[0].fullPath; 
				}
			}
			diff[0].setLinkActive(true);
		}else{ //路由不同
			//加载模块
			for(let i=0;i<diff[2].length;i++){
				let route = diff[2][i];
				//路由不存在或路由没有模块（空路由？）
				if(!route || !route.module){
					continue;
				}

				if(!route.useParentPath){
					showPath = route.fullPath; 
				}

				if(!parentModule.routerKey){
					throw Error.handle('notexist',nodom.words.routeView);
				}

				//构建module route map
				Router.moduleRouteMap[route.module] = route.id;
				//参数数组
				paramArr.push(route.module);
				
				//操作数组
				operArr.push(
					(resolve,reject,moduleName)=>{
						let module = ModuleFactory.get(moduleName);
						//添加before first render 操作
						module.addBeforeFirstRenderOperation(function(){
							//清空模块容器
							nodom.empty(module.container);
						});
						//保留container参数
						module.containerParam = {
							module:parentModule.name,
							selector:"[key='" + parentModule.routerKey + "']"
						}

						//激活模块
						module.active((model)=>{
							let route = Router.routes.get(Router.moduleRouteMap[module.name]);
							if(!route){
								return;
							}
							route.setLinkActive(true);
							delete Router.moduleRouteMap[module.name];
							setRouteParamToModel(route);
							if(nodom.isFunction(me.onDefaultEnter)){
								me.onDefaultEnter(model);
							}
							if(nodom.isFunction(route.onEnter)){
								route.onEnter(model);
							}
							parentModule = module;
							if(resolve){
								resolve();	
							}
						});
					}
				);
			}
		}

		//如果是history popstate，则不加入history
		if(me.startStyle !== 2 && showPath !== ''){ 
			//子路由，替换state
			if(me.showPath && showPath.indexOf(me.showPath) === 0){
				history.replaceState(path,'', nodom.config.routerPrePath + showPath);	
			}else { //路径push进history
				history.pushState(path,'', nodom.config.routerPrePath + showPath);		
			}
			//设置显示路径
			me.showPath = showPath;
		}
		//待处理模块链为空，不需要处理
		if(operArr.length === 0){
			Router.loading = false;
			Router.startStyle = 0;
			return;
		}
		//修改currentPath
		me.currentPath = path;
		
		//同步加载模块
		new Linker("dolist",operArr,paramArr).then(()=>{
			Router.loading = false;
			me.load();
			Router.startStyle = 0;
		});

		/**
		 * 将路由参数放入model
		 * @param route 	路由
		 */
		function setRouteParamToModel(route){
			if(!route){
				return;
			}
			let module = ModuleFactory.get(route.module);
			let model = module.model;
			let o = {
				path:route.path
			};
			if(!nodom.isEmpty(route.data)){
				o.data = route.data;
			}
			if(!model){
				module.model = new Model({$route:o},module);
			}else{
				model.data['$route'] = o;
			}
			Renderer.add(module);
		}
	}

	/*
	 * 重定向
	 * @param path 	路径
	 */
	static redirect(path){
		this.addPath(path);
	}
	
	static addRoute(route,parent){
		//加入router tree
		if(RouterTree.add(route,parent) === false){
			throw Error.handle("exist1",nodom.words.route,route.path);
		}
		//加入map
		this.routes.set(route.id,route);
	}

	/**
	 * 获取路由
	 * @param path 	路径
	 * @param last 	是否获取最后一个路由默认false
	 */
	static getRoute(path,last){
		if(!path){
			return null;
		}
		
		let routes = RouterTree.get(path);
		if(routes === null || routes.length === 0){
			return null;
		}
				
		//routeid 转route
		if(last){   //获取最后一个
			return routes[routes.length-1];
		}else{		//获取所有
			return routes;
		}
	}

	/**
	 * 比较两个路径对应的路由链
	 * @param path1 	第一个路径
	 * @param path2 	第二个路径
	 * @return 			[不同路由的父路由，第一个需要销毁的路由数组，第二个需要增加的路由数组，第二个路由]
	 */
	static compare(path1,path2){
		const me = this;
		// 获取路由id数组
		let arr1 = null;
		let arr2 = null;
		
		if(path1){
			arr1 = me.getRoute(path1);
		}
		if(path2){
			arr2 = me.getRoute(path2);
		}

		let len = 0;
		if(arr1 !== null){
			len = arr1.length;
		}

		if(arr2 !== null){
			if(arr2.length<len){
				len = arr2.length;
			}
		}else{
			len = 0;
		}
		
		let retArr1=[],retArr2=[];
		let i = 0;

		for(i=0;i<len;i++){
			//找到不同路由开始位置
			if(arr1[i].id === arr2[i].id){
				//比较参数
				if(JSON.stringify(arr1[i].data) !== JSON.stringify(arr2[i].data)){
					//从后面开始更新，所以需要i+1
					i++;
					break;
				}
			}else{
				break;
			}
		}
		//旧路由改变数组
		if(arr1 !== null){
			for(let j=i;j<arr1.length;j++){
				retArr1.push(arr1[j]);
			}
		}
		
		//新路由改变数组（相对于旧路由）
		if(arr2 !== null){
			for(let j=i;j<arr2.length;j++){
				retArr2.push(arr2[j]);
			}
		}

		//上一级路由和上二级路由
		let p1=null,p2=null;
		if(arr1 !== null && i>0){
			for(let j=i-1;j>=0&(p1===null || p2===null);j--){
				if(arr1[j].module !== undefined){
					if(p1 === null){
						p1 = arr1[j];
					}else if(p2 === null){
						p2 = arr1[j];
					}
				}
			}
		}
		return [p1,retArr1,retArr2,p2];
	}

	/**
	 * 修改模块active view（如果为view active为true，则需要路由跳转）
	 * @param module 	模块
	 * @param path 		view对应的route路径
	 */
	static changeActive(module,path){
		if(!module || !path || path==='' || !module.routerActiveViews){
			return;
		}
		//遍历router active view，设置或取消active class
		module.routerActiveViews.forEach((item)=>{
			let dom = module.renderTree.query(item);
			if(!dom){
				return;
			}
			
			if(dom.exprProps.hasOwnProperty('active')){ // active属性为表达式，修改字段值
				let model = module.modelFactory.get(dom.modelId);
				if(!model){
					return;
				}
				
				let expr = module.expressionFactory.get(dom.exprProps['active'][0]);
				if(!expr){
					return;
				}
				let field = expr.fields[0];
				//路径相同则设置active 为true，否则为false
				if(path.indexOf(dom.props['path']) === 0){
					model.data[field] = true;
				}else{
					model.data[field] = false;
				}
			}else if(dom.props.hasOwnProperty('active')){  //active值属性
				//路径相同则设置active 为true，否则为false
				if(path.indexOf(dom.props['path']) === 0){
					dom.props['active'] = true;
				}else{
					dom.props['active'] = false;
				}
			}
		});

	}
}

// Router 成员变量
Router.loading = false;				//加载中标志
Router.routes = new Map();			//路由map
Router.currentPath = ''; 			//当前路径
Router.showPath = ''; 				//显示路径（useParentPath时需要）
Router.waitList = [];				//path等待链表
Router.currentIndex = 0; 			//当前路由在路由链中的index
Router.onDefaultEnter=undefined; 	//默认路由进入事件
Router.onDefaultLeave=undefined; 	//默认路由离开事件
Router.moduleRouteMap = {};			//module 和 route映射关系 {moduleName:routeId,...}
Router.startStyle = 0; 				//启动方式 0:直接启动 1:由element active改变启动 2:popstate 启动


class Route{
	constructor(config){
		const me = this;
		me.params = [];  //参数
		me.data={};
		me.children = [];
		me.onEnter = config.onEnter;
		me.onLeave = config.onLeave;
		me.useParentPath = config.useParentPath;
		me.path = config.path;
		me.module = config.module instanceof Module?config.module.name:config.module;

		if(config.path === ''){
			return;
		}
		
		me.id = nodom.genId();

		if(!config.notAdd){
			Router.addRoute(me,config.parent);	
		}
		
		//子路由
		if(nodom.isArray(config.routes)){
			config.routes.forEach((item)=>{
				item.parent = me;
				new Route(item);
			});
		}
	}
	/**
	 * 设置关联标签激活状态
	 * @param ancestor 		是否激活祖先路由 true/false
	 */
	setLinkActive(ancestor){
		let path = this.fullPath;
		let module = ModuleFactory.get(this.module);
		if(module && module.containerParam){
			let pm = ModuleFactory.get(module.containerParam.module);
			if(pm){
				Router.changeActive(pm,path);		
			}
		}
		if(ancestor && this.parent){
			this.parent.setLinkActive(true);
		}
	}
}

/**
 * 路由树类
 */
class RouterTree {
    /**
     * 添加route到路由树
     *
     * @param route 路由
     * @return 添加是否成功 type Boolean
     */
    static add(route,parent) {

    	const me = this;
    	//创建根节点
    	if(!me.root){
    		me.root = new Route({path:"",notAdd:true});
    	}
        let pathArr = route.path.split('/');
        let node = parent||me.root;
        let path = '';
        let param = [];
        let routeValue; 		//记录最后一个非参数路径
        let paramIndex = -1;	//最后一个参数开始
        let prePath = '';
        for(let i=0;i<pathArr.length;i++){
        	let v = pathArr[i].trim();
        	if(v === ''){
        		pathArr.splice(i--,1);
        		continue;
        	}
        	
        	if(v.startsWith(':')){ //参数
        		if(param.length === 0){
        			paramIndex = i; 
        		}
        		param.push(v.substr(1));
        	}else{
        		paramIndex = -1;
        		param = []; 	 //上级路由的参数清空
        		route.path = v;  //暂存path
        		let j=0;
        		for(;j<node.children.length;j++){
        			let r = node.children[j];
        			if(r.path === v){
        				node = r;
        				break; 
        			}
        		}

        		//没找到，创建新节点
        		if(j === node.children.length){
        			if(prePath !== ''){
        				node.children.push(new Route({path:prePath,notAdd:true}));	
        				node = node.children[node.children.length-1];
        			}
        			prePath = v;
        		}
        	}

        	//不存在参数
        	if(paramIndex === -1){
        		route.params = [];
        	}else{
        		route.params = param;
        	}
        }

        //添加到树
    	if(node !== undefined && node !== route){
    		route.path = prePath;
        	node.children.push(route);	
    	}
        return true;
    }
	
	/**
	 * 从路由树中获取路由节点
	 * @param path  	路径
	 */
    static get(path){
		const me = this;
    	if(!me.root){
    		throw Error.handle("notexist",nodom.words.root);
    	}
    	let pathArr = path.split('/');
    	let node = me.root;
    	let paramIndex = 0;
    	let retArr = [];
    	let fullPath = '';		//完整路径
    	let preNode = me.root;  //前一个节点

    	for(let i=0;i<pathArr.length;i++){
    		let v = pathArr[i].trim();
        	if(v === ''){
        		pathArr.splice(i--,1);
        		continue;
        	}
        	let find = false;
        	for(let j=0;j<node.children.length;j++){
        		if(node.children[j].path === v){
        			//设置完整路径

        			if(preNode !== me.root){
        				preNode.fullPath = fullPath;
        				preNode.data = node.data;
        				retArr.push(preNode);
        			}
        				
        			//设置新的查找节点
        			node = node.children[j];
        			//参数清空
        			node.data = {};
        			preNode = node;
        			find = true;
        			break;
        		}
        	}
        	//路径叠加
        	fullPath += '/' + v;
        	//不是孩子节点,作为参数
        	if(!find){
        		if(paramIndex < node.params.length){ //超出参数长度的废弃
        			node.data[node.params[paramIndex++]] = v;	
        		}
        	}
        }

        //最后一个节点
        if(node !== me.root){
        	node.fullPath = fullPath;
        	retArr.push(node);
        }
        return retArr;
    }
}


//处理popstate事件
window.addEventListener('popstate' , function(e){
	//根据state切换module
	const state = history.state;
	if(!state){
		return;
	}
	Router.startStyle = 2;
	Router.addPath(state);
	// Router.start(state);
});


/**
 * 增加route指令
 */
DirectiveManager.addType('route',{
	init:(directive,dom,module)=>{
		let value = directive.value;
        if(nodom.isEmpty(value)){
            return;
        }

        //a标签需要设置href
        if(dom.tagName === 'A'){
        	dom.props['href'] = 'javascript:void(0)';
        }
		let dirObj = {};
		// 表达式处理
        if(value && value.substr(0,2) === '{{' && value.substr(value.length-2,2) === '}}'){
			let expr = new Expression(value.substring(2,value.length-2),module);
			dom.exprProps['path'] = expr;
			directive.value = expr;
        }else{
        	dom.props['path'] = value; 
		}

        //添加click事件
		let method = '$nodomGenMethod' + nodom.genId();
		module.methodFactory.add(method,
            (e,module,view,dom)=>{
				let path = dom.props['path'];
				if(!path){
					return;
				}
				Router.addPath(path);
	        }
        );
        dom.events['click'] = new Event('click',method);
	},

	handle:(directive,dom,module,parent)=>{
		//添加到active view 队列
		if(!module.routerActiveViews){
			module.routerActiveViews = [];
		}

		if(module.routerActiveViews.indexOf(dom.key) === -1){
			//设置已添加标志，避免重复添加
			module.routerActiveViews.push(dom.key);
			if(dom.props.hasOwnProperty('active')){
				let route = Router.getRoute(dom.props['path'],true);
				if(route === null){
					return;
				}
			}
		}

		let path = dom.props['path'];
		if(path === Router.currentPath){
			return;
		}
		//active需要跳转路由（当前路由为该路径对应的父路由）
		if(dom.props['active'] && dom.props['active'] !== 'false' && (!Router.currentPath || path.indexOf(Router.currentPath) === 0)){
			Router.addPath(path);
		}
	}
});

/**
 * 增加router指令
 */
DirectiveManager.addType('router',{
	init:(directive,dom,module)=>{
		module.routerKey = dom.key;
	},
	handle:(directive,dom,module,parent)=>{
		return;
	}
});
