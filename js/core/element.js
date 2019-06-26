/**
 * element class 虚拟dom element
 */
class Element{
	constructor(){
		const me = this;
		me.className = 'Element';
		me.directives = [];
		me.props = {};				//属性集合
		me.events = {};				//事件集合
		me.exprProps = {};			//含表达式的属性集合
		me.changeProps = []; 		//修改后的属性
		me.removeProps = []; 		//待删除属性
		me.children = [];			//子element
		me.parentKey = undefined;	//父对象key
		me.tagName = undefined;		//元素名
		me.dontRender = false; 		//不渲染标志，不渲染到html
		me.key = nodom.genId();
	}

	/**
	 * 渲染到virtualdom树
	 * @param module 	模块
	 * @param parent 	父节点
	 */
	render(module,parent){
		const me = this;
		
		// 设置父对象
		if(parent){
			me.parentKey = parent.key;
			// 设置modelId
			if(!me.modelId){
				me.modelId = parent.modelId;
			}
		}
		if(me.tagName !== undefined){ //element
			me.handleProps(module);
			//某些指令可能会终止渲染，如果返回false，则不继续渲染
			me.handleDirectives(module,parent);
		}else{ //textContent
			me.handleTextContent(module);
		}

		//dontrender 为false才渲染子节点
		if(!me.dontRender){
			//子节点渲染
			for(let i=0;i<me.children.length;i++){
				let item = me.children[i];
				item.render(module,me);
				//dontRender 删除
				if(item.dontRender){
					me.removeChild(item);
					i--;
				}
			}	
		}
		return true;
	}
	/**
	 * 渲染到html element
	 * @param module 	模块
	 * @param el 		对应的element
	 * @param type 		类型
	 * @param parent 	父虚拟dom
	 */
	renderToHtml(module,params){
		const me = this;
		let el,el1;
		let type = params.type;
		let parent = params.parent;
		let modelFac = module.modelFactory;
		//构建el
		if(!parent){
			el = module.container;
		}else{
			if(type === 'fresh' || type === 'add' || type === 'text'){
				el = module.container.querySelector("[key='"+ parent.key +"']")
			}else if(me.tagName !== undefined){  //element节点才可以查找
				el = module.container.querySelector("[key='"+ me.key +"']");
			}	
		}

		if(!el){
			return;
		}
		
		switch(type){
			case 'fresh': 	//首次渲染
				if(me.tagName){
					el1 = newEl(me,null,el);
					//首次渲染需要生成子孙节点
					genSub(el1,me);	
				}else{
					el1 = newText(me.textContent,me);
				}
				el.appendChild(el1);
				break;
			case 'text': 	//文本更改
				if(!parent || !parent.children){
					break;
				}
				
				let ind = parent.children.indexOf(me);
				if(ind !== -1){
					let div = document.querySelector("[key='" + me.key + "']");
					//element或fragment
					if(me.type === 'html'){
						if(div !== null){
							div.innerHTML = '';
							div.appendChild(me.textContent);
						}else{
							div = newText(me.textContent);
							nodom.replaceNode(el.childNodes[ind],div);
						}
					}else{
						el.childNodes[ind].textContent = me.textContent;
					}
				}
				break;
			case 'upd': 	//修改属性
				//删除属性
				if(params.removeProps){
					params.removeProps.forEach((p)=>{
						el.removeAttribute(p);
					});
				}
				//修改属性
				params.changeProps.forEach((p)=>{
					el.setAttribute(p.p,p.v);
				});
				break;
			case 'rep': 	//替换节点
				el1 = newEl(me,parent);
				nodom.replaceNode(el,el1);
				break;
			case 'add': 	//添加
				if(me.tagName){
					el1 = newEl(me,parent,el);
					genSub(el1,me);
				}else{
					el1 = newText(me.textContent);
				}
				if(params.index === el.childNodes.length){
					el.appendChild(el1);
				}else{
					el.insertBefore(el1,el.childNodes[params.index]);
				}
				
		}

		/**
		 * 新建element节点
		 */
		function newEl(vdom,parent,parentEl){
			//创建element
			let el = document.createElement(vdom.tagName);
			//设置属性
			nodom.getOwnProps(vdom.props).forEach((p)=>{
				el.setAttribute(p,vdom.props[p]);
			});
			el.setAttribute('key',vdom.key);
			vdom.handleEvents(module,el,parent,parentEl);
			return el;
		}

		/**
		 * 新建文本节点
		 */
		function newText(text,dom){
			if(dom && 'html' === dom.type){ //html fragment 或 element
				let div = nodom.newEl('div');
				div.setAttribute('key',dom.key);
				div.appendChild(text);
				return div;
			}else{
				return document.createTextNode(text);	
			}
		}

		/**
		 * 生成子节点
		 * @param pEl 	父节点
		 * @param vNode 虚拟dom父节点	
		 */
		function genSub(pEl,vNode){
			if(vNode.children && vNode.children.length>0){
				vNode.children.forEach((item)=>{
					let el1;
					if(item.tagName){
						el1 = newEl(item,vNode,pEl);
						genSub(el1,item);
					}else{
						el1 = newText(item.textContent,item);
					}

					pEl.appendChild(el1);
				});
			}
		}
	
	}

	/**
	 * 克隆
	 */
	clone(){
		const me = this;
		let dst = new Element();

		//简单属性
		nodom.getOwnProps(me).forEach((p)=>{
			if(typeof me[p] !== 'object'){
				dst[p] = me[p];
			}
		});

		me.directives.forEach((d)=>{
			dst.directives.push(d);
		});

		//普通
		nodom.getOwnProps(me.props).forEach((d)=>{
			dst.props[d]=me.props[d];
		});

		//表达式属性
		nodom.getOwnProps(me.exprProps).forEach((d)=>{
			dst.exprProps[d]=me.exprProps[d];
		});

		//事件
		nodom.getOwnProps(me.events).forEach((d)=>{
			dst.events[d]=me.events[d].clone();
		});

		//表达式
		dst.expressions = me.expressions;
	
		me.children.forEach((d)=>{
			dst.children.push(d.clone());
		});
		return dst;
	}

	/**
	 * 处理指令
	 * 
	 */
	handleDirectives(module,parent){
		const me = this;
		if(me.dontRender){
			return false;
		}
		let dirs = me.directives;
		for(let i=0;i<dirs.length && !me.dontRender;i++){
			DirectiveManager.exec(dirs[i],me,module,parent);
		}
		return true;
	}



	/**
	 * 表达式预处理，添加到expression计算队列
	 */
	handleExpression(exprArr,module){
		const me = this;
		if(me.dontRender){
			return;
		}
		let value = '';
		let model = module.modelFactory.get(me.modelId);
		exprArr.forEach((v)=>{
			if(typeof v === 'number'){ 	//处理表达式
				// 统一添加到表达式计算队列
				let v1 = module.expressionFactory.get(v).val(model);
				//html或 fragment
				if(v1 instanceof DocumentFragment || nodom.isEl(v1)){
					// 设置类型
					me.type = 'html';
					return v1;
				}
				value += v1;
			}else{
				value += v;
			}
		});
		return value;
	}

	/**
	 * 处理属性（带表达式）
	 */
	handleProps(module){
		const me = this;
		if(me.dontRender){
			return;
		}
		nodom.getOwnProps(me.exprProps).forEach((item)=>{
			//属性值为数组，则为表达式
			if(nodom.isArray(me.exprProps[item])){
				me.props[item] = me.handleExpression(me.exprProps[item],module);
			}else if(me.exprProps[item] instanceof Expression){ //单个表达式
				me.props[item] = me.exprProps[item].val(module.modelFactory.get(me.modelId));
			}
		});
	}

	/**
	 * 处理文本（表达式）
	 */
	handleTextContent(module){
		const me = this;
		if(me.dontRender){
			return;
		}
		if(me.expressions !== undefined){
			me.textContent =  me.handleExpression(me.expressions,module);
		}
	}

	/**
	 * 处理事件
	 * @param module 
	 * @param model
	 * @param el
	 * @param parent
	 */
	handleEvents(module,el,parent,parentEl){
		const me = this;
		
		if(me.events.length === 0){
			return;
		}
		
		nodom.getOwnProps(me.events).forEach((en)=>{
			let ev = me.events[en];
			if(ev.delg && parent){  //代理到父对象
				ev.delegateTo(module,me,el,parent,parentEl);
			}else{
				ev.bind(module,me,el);
			}
		});
	}

	/**
	 * 移除指令
	 * @param directives 	待删除的指令集
	 */
	removeDirectives(delDirectives){
		const me = this;
        for(let i=me.directives.length-1;i>=0;i--){
            let d = me.directives[i];
            for(let j=0;j<delDirectives.length;j++){
                if(d.type===delDirectives[j]){
                    me.directives.splice(i,1);
                }
            }
        }
	}

	/**
	 * 是否有某个类型的指令
	 * @param directiveType 	指令类型名
	 * @return true/false
	 */
	hasDirective(directiveType){
		const me = this;
		for(let i=0;i<me.directives.length;i++){
			if(me.directives[i].type === directiveType){
				return true;
			}
		}
		return false;
	}

	/**
	 * 获取某个类型的指令
	 * @param directiveType 	指令类型名
	 * @return directive
	 */
	getDirective(directiveType){
		const me = this;
		for(let i=0;i<me.directives.length;i++){
			if(me.directives[i].type === directiveType){
				return me.directives[i];
			}
		}
	}

	/**
	 * 从虚拟dom树和html dom树删除自己
	 * @param module 	模块
	 * @param html 		删除html中的
	 */
	remove(module,html){
		const me = this;
		// 从父树中移除
		if(me.parentKey !== undefined){
			let p = module.renderTree.query(me.parentKey);
			if(p){
				p.removeChild(me);
			}
		}
		
		// 删除html dom节点
		if(html && module && module.container){
			let el = module.container.querySelector("[key='"+ me.key +"']");
			if(el !== null){
				nodom.remove(el);
			}
		}
		me.free();
	}


	/**
	 * 从html删除
	 */
	removeFromHtml(module){
		const me = this;
		let el = module.container.querySelector("[key='"+ me.key +"']");
		if(el !== null){
			nodom.remove(el);
		}
	}

	/**
	 * 移除子节点
	 */
	removeChild(dom){
		const me = this;
		let ind = -1;
		// 移除
		if(nodom.isArray(me.children) && (ind = me.children.indexOf(dom)) !== -1) {
			me.children.splice(ind,1);
		}
	}

	/**
	 * 替换目标节点
	 * @param dst 	目标节点　
	 */
	replace(dst){
		const me = this;
		if(!dst.parent){
			return false;
		}
		let ind = dst.parent.children.indexOf(dst);
		if(ind === -1){
			return false;
		}
		//替换
		dst.parent.children.splice(ind,1,me);
		return true;
	}

	/**
	 * 是否包含节点
	 * @param dom 	包含的节点 
	 */
	contains(dom){
		const me = this;
		for(;dom!==undefined && dom!==me;dom=dom.parent);
		return dom !== undefined;
	}

	/**
	 * 查找子孙节点
	 * @param key 	element key
	 * @return vdom element/undefined
	 */
	query(key){
		const me = this;
		if(me.key === key){
			return me;
		}
		for(let i=0;i<me.children.length;i++){
			let dom = me.children[i].query(key);
			if(dom){
				return dom;
			}
		}
	}


	queryProp(prop,value){
		const me = this;
		if(me.key === key){
			return me;
		}
		for(let i=0;i<me.children.length;i++){
			let dom = me.children[i].query(key);
			if(dom){
				return dom;
			}
		}	
	}
	/**
	 * 比较节点
	 * @param dst 	待比较节点
	 * @return	{type:类型 text/rep/add/upd,node:节点,parent:父节点, 
	 * changeProps:改变属性,[{p:p1,v:v1},{p:p2,v:v2},...],delProps:删除属性,[p1,p2,...]}
	 */
	compare(dst,retArr,parentNode){
		if(!dst){
			return;
		}
		const me = this;
		let re = Object.create(null);
		let change = false;
		
		if(me.tagName === undefined){ //文本节点
			if(dst.tagName === undefined){
				if(me.textContent !== dst.textContent){
					re.type = 'text';
					change = true;	
				}
			}else{ //节点类型不同
				re.type = 'rep';
				change = true;
			}
		}else{	//element节点
			if(me.tagName !== dst.tagName){	//节点类型不同
				re.type = 'rep';
				change = true;
			}else{	//节点类型相同，可能属性不同
				//检查属性，如果不同则放到changeProps
				re.changeProps = [];
				//待删除属性
				re.removeProps = [];
				
				//删除或增加的属性的属性
				nodom.getOwnProps(dst.props).forEach((p)=>{
					if(!me.props.hasOwnProperty(p)){
						re.removeProps.push(p);
					}
				});

				//修改后的属性
				nodom.getOwnProps(me.props).forEach((p)=>{
					if(me.props[p] !== dst.props[p]){
						re.changeProps.push({p:p,v:me.props[p]});
					}
				});
				
				if(re.changeProps.length>0 || re.removeProps.length>0){
					change = true;
					re.type = 'upd';
				}
			}
		}
		//改变则加入数据
		if(change){
			re.node = me;
			if(parentNode){
				re.parent = parentNode;
			}
			retArr.push(re);
		}

		//子节点处理
		if(!me.children || me.children.length === 0){
			// 旧节点的子节点全部删除
			if(dst.children && dst.children.length > 0){
				dst.children.forEach((item)=>{
					retArr.push({
						type:'del',
						node:item
					});
				});
			}	
		}else{
			//全部新加节点
			if(!dst.children || dst.children.length === 0){
				me.children.forEach((item)=>{
					retArr.push({
						type:'add',
						node:item,
						parent:me
					});	
				});
			}else{  //都有子节点
				me.children.forEach((dom1,ind)=>{
					let dom2 = dst.children[ind];
					// dom1和dom2相同key
					if(!dom2 || dom1.key !== dom2.key){
						dom2 = undefined;
						//找到key相同的节点
						for(let i=0;i<dst.children.length;i++){
							//找到了相同key
							if(dom1.key === dst.children[i].key){
								dom2 = dst.children[i];
								break;
							}
						}
					}
					if(dom2 !== undefined){
						dom1.compare(dom2,retArr,me);
						//设置匹配标志，用于后面删除没有标志的节点
						dom2.finded = true;
					}else{
						// dom1为新增节点
						retArr.push({
							type:'add',
							node:dom1,
							parent:me,
							index:ind   //在父节点中的位置
						});
					}
				});
				
				//未匹配的节点设置删除标志
				if(dst.children && dst.children.length > 0){
					dst.children.forEach((item)=>{
						if(!item.finded){
							retArr.push({
								type:'del',
								node:item,
								parent:dst
							});
						}
					});
				}
			}
			
		}
	}
}
