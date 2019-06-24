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
	 * 切换路由
	 * @param path 	路径
	 * @param pop 	是否为history popstate
	 */
	static start(path,pop){
		const me = this;
		//路径相同，不执行
		if(me.currentPath === path){
			delete me.startWithChangeActive;
			return;
		}

		//加载中，不允许切换
		if(me.loading){
			//避免连续跳转到同一个路径
			if(me.waitList[me.waitList.length-1] !== path){
				me.waitList.push(path);	
				return;
			}
		}

		me.loading = true;
		
		let diff = me.compare(me.currentPath,path);
		if(!pop){ //如果是history popstate，则不进入加入history
			//路径push进history
			//子路由，替换state
			if(path.indexOf(me.currentPath) === 0){
				history.replaceState(path,'', nodom.config.routerPrePath + path);	
			}else{
				history.pushState(path,'', nodom.config.routerPrePath + path);		
			}
		}
		//修改currentPath
		me.currentPath = path;
		
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

		if(diff[2].length === 0){
			if(diff[0] !== null){
				setRouteParamToModel(diff[0]);
				if(diff[3] && diff[3].module){
					let m = ModuleFactory.get(diff[3].module);
					m.routerWantActive = diff[0];
					if(m){
						me.changeActive(m);
					}
				}
  			}
		}else{
			//加载模块
			for(let i=0;i<diff[2].length;i++){
				let route = diff[2][i];
				//路由不存在或路由没有模块
				if(!route || !route.module){
					continue;
				}

				if(!parentModule.routerKey){
					throw Error.handle('notexist',nodom.words.routeView);
				}
				let module = ModuleFactory.get(route.module);
				if(!module){
					throw Error.handle('notexist1',nodom.words.module,route.module);
				}
				
				Router.moduleRouteMap[module.name] = route.id;
				//参数数组
				paramArr.push(module.name);
				//操作数组
				operArr.push(
					(resolve,reject,moduleName)=>{
						let module = ModuleFactory.get(moduleName);
						module.addBeforeFirstRenderOperation(function(){
							nodom.empty(this.container);
						});
						//保留container参数
						module.containerParam = {
							module:parentModule.name,
							selector:"[key='" + parentModule.routerKey + "']"
						}

						//激活
						module.active(function(model){
							let route = Router.routes.get(Router.moduleRouteMap[module.name]);
							delete Router.moduleRouteMap[module.name];
							setRouteParamToModel(route);
							
							if(nodom.isFunction(me.onDefaultEnter)){
								me.onDefaultEnter(model);
							}
							if(nodom.isFunction(route.onEnter)){
								route.onEnter(model);
							}

							//判断路由是否由changeActive启动
							if(!me.startWithChangeActive){
								//设置待激活路由绑定view
								parentModule.routerWantActive = route;
								//添加激活事件
								if(parentModule.firstRender){
									parentModule.addBeforeFirstRenderOperation(me.changeActive);
								}else{
									me.changeActive(parentModule);
								}
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

		//同步加载模块
		new Linker("dolist",operArr,paramArr).then(()=>{
			me.loading = false;
			delete me.startWithChangeActive;
		});

		/**
		 * 将路由参数放入model
		 * @param route 	路由
		 */
		function setRouteParamToModel(route){
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
	static Redirect(path){
		this.start(path,true);
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
	 * @return 			两个路由数组
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
		//参数不一样的问题
		if(arr1 !== null){
			for(let j=i;j<arr1.length;j++){
				retArr1.push(arr1[j]);
			}	
		}
		
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
	 * 加入view等待列表
	 */
	static addWaitViewList(moduleName,route){
		Router.waitViewList.push({module:moduleName,route:route});
	}

	/**
	 * 处理wait view列表
	 */
	static handleWaitViewList(){
		let me = Router;
		for(let i=0;i<me.waitViewList.length;i++){
			let item = me.waitViewList[i];
			let pm = ModuleFactory.get(item.module);
			let el = pm.container;
			if(el){
				el = el.querySelector("[key='" + pm.routerKey + "']");	
				if(el !== null){
					//清空容器
					el.innerHTML = '';
					let m = ModuleFactory.get(item.route.module);
					m.container = el;
					me.waitViewList.splice(i--,1);
				}
			}
		}
	}

	/**
	 * 修改模块active view（如果为view active为true，则需要路由跳转）
	 * @param module 	模块
	 */
	static changeActive(module){
		//如果在模块中调用，则直接用this
		module = module || this;
		let wantItem = module.routerWantActive;
		//删除由该函数启动路由标志
		delete Router.startWithChangeActive;

		//用完即删
		delete module.routerWantActive;
		if(!wantItem || !nodom.isArray(module.routerActiveViews) || module.routerActiveViews.length === 0){
			return;
		}

		let doms = [];
		let domKeys = {};

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
				//全部设置active为false
				model.data[field] = false;
				//保存对象
				doms.push({dom:dom,model:model,field:field,expr:true});
				//保存key对应索引
				domKeys[dom.key] = doms.length-1;	
			}else if(dom.props.hasOwnProperty('active')){  //active值属性
				dom.props['active'] = false;
				doms.push({dom:dom,expr:false});
				//保存key对应索引
				domKeys[dom.key] = doms.length-1;
			}
		});

		
		//没有dom，则不进行
		if(doms.length === 0){
			return;
		}
		

		if(wantItem instanceof Route){ //路由
			let route = wantItem;
			//修改route绑定的所有view
			if(nodom.isArray(route.attachDoms)){
				//route绑定的所有attatch dom 的数据修改为true
				route.attachDoms.forEach((item)=>{
					
					if(domKeys.hasOwnProperty(item)){
						let obj = doms[domKeys[item]];
						
						if(route.fullPath !== obj.dom.props['path']){
							return;
						}
						
						if(obj.expr){ //表达式
							//修改数据，直接进入渲染队列
							obj.model.data[obj.field] = true;	
						}else{ //值属性
							obj.dom.props['active'] = true;
							//加入渲染队列
							Renderer.add(module);
						}
					}
				});	
			}
		}else{  //dom key
			if(domKeys.hasOwnProperty(wantItem)){
				let obj = doms[domKeys[wantItem]];
				if(obj.expr){ //表达式
					//修改数据，直接进入渲染队列
					obj.model.data[obj.field] = true;	
				}else{ //值属性
					obj.dom.props['active'] = true;
					//加入渲染队列
					Renderer.add(module);
				}
				let path = obj.dom.props['path'];
				// //设置启动路径为changeActive标志
				Router.startWithChangeActive = true;
				// //启动子路由
				if(!nodom.isEmpty(path)){
					Router.start(path);	
				}
			}
		}

	}
}

// Router 成员变量
Router.basePath = ''; 				//路由基础路径
Router.loading = false;				//加载中标志
Router.routes = new Map();			//路由map
Router.currentPath = ''; 			//当前路径
Router.waitList = [];				//path等待链表
Router.waitViewList = []; 			//等待route view列表
Router.onDefaultEnter=undefined; 	//默认路由进入事件
Router.onDefaultLeave=undefined; 	//默认路由离开事件
Router.routerPrePath = ''; 			//默认前置路径
Router.moduleRouteMap = {}; 		//module 和 route映射关系 {moduleName:routeId,...}

//添加waitviewlist 处理事件到调度器
Scheduler.addTask(Router.handleWaitViewList);


class Route{
	constructor(config){
		const me = this;
		me.params = [];  //参数
		me.data={};
		me.children = [];
		
		if(config.module instanceof Module){
			config.module = config.module.name;
		}
		
		me.path = config.path;
		me.module = config.module;
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
    
    static get(path){
    	const me = this;
    	if(!me.root){
    		throw Error.handle("根节点不存在");
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
	Router.start(state,true);
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
            	if(dom.props.hasOwnProperty('active')){  //有active属性，交给路由激活
            		module.routerWantActive = dom.key;
            		Router.changeActive(module);	
            	}else if(!nodom.isEmpty(path)){  //自己跳转路由
            		Router.start(path);
            	}
            	
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
			module.routerActiveViews.push(dom.key);
			if(dom.props.hasOwnProperty('active')){
				//设置已添加标志，避免重复添加
				let route = Router.getRoute(dom.props['path'],true);
				if(route === null){
					return;
				}

				if(!route.attachDoms){
					route.attachDoms = [];
				}
				//增加路由的关联dom
				route.attachDoms.push(dom.key);
			}
		}

		let path = dom.props['path'];
		//active需要跳转路由，如果路由已在路径中，或存在等待激活的路由，则不进行跳转
		if(dom.props['active'] && dom.props['active'] !== 'false' 
			&& module.routerWantActive === undefined && !Router.startWithChangeActive){
			module.routerWantActive = dom.key;
			if(module.firstRender){
				module.addFirstRenderOperation(Router.changeActive);	
			}
		}
	}
});

/**
 * 增加route指令
 */
DirectiveManager.addType('router',{
	init:(directive,dom,module)=>{
		module.routerKey = dom.key;
	},
	handle:(directive,dom,module,parent)=>{
		return;
	}
});
