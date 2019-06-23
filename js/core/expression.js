class Expression{
	/**
	 * @param exprStr	表达式串
	 */
	constructor(exprStr,module){
		const me = this;
		//旧值
		me.fields = [];  				// 字段数组
		me.modelMap = {}; 				//一个expression可能被多次使用，以modelid进行区分，针对不同的模型id构建对象{modelId:{fieldValue:,value:}
		me.id = nodom.genId();
		if(module){
			me.moduleName = module.name;
			module.expressionFactory.add(me.id,me);
		}

		if(exprStr){
			me.stack = this.init(exprStr);
		}
	}

	/**
	 * 初始化，把表达式串转换成堆栈
	 * @param exprStr 	表达式串
	 */
	init(exprStr){
		const me = this;
		//字符串开始
		let startStr = undefined;
		let type = 0; // 1字符串 2变量 3函数 4过滤器
		//字符串开始结束符
		let strings = "'`\"";
        //运算符
        let operand = "()!|*/+-><=&%";
        let spaceChar = " 	";
        //堆栈
        let stack = new Array();
        let sTmp = '';
        for(let i=0;i<exprStr.length;i++){
        	let c = exprStr[i];
        	//变量和函数的空格不处理
			if((type !== 1) && spaceChar.indexOf(c) !== -1){	
				continue;
			}
        	switch(type){
        		case 1: //当前为字符串
        			//字符串标识
        			if(strings.indexOf(c) !== -1){
        				if(c === startStr){
        					me.addStr(sTmp + c,stack);
		        			startStr = undefined;
		        			sTmp = '';
		        			type = 0;
		        			continue;
		        		}
        			}
        			break;
        		case 2: //当前为变量
        			if(operand.indexOf(c) !== -1){
        				//转为函数
        				if(c === '('){
        					type = 3;
        				}else{ //变量结束
        					me.addVar(sTmp,stack);
        					sTmp = '';
	        				type = 0;		
        				}


        			}
        			break;
        		case 3: //当前为函数
        			if(c === ')'){
        				let a = sTmp.trim().split('(');
        				//函数名
        				let fn = a[0];

        				//参数
        				let pa = a[1].split(',');
        				for(let j=0;j<pa.length;j++){
        					let field = pa[j].trim();
        					pa[j] = field;

        					// 添加字段到集合 
        					me.addField(field);
        				}
        				
        				//函数入栈
        				stack.push({
        					val:fn,
        					params:pa,
        					type:'function'
        				});
        				sTmp = '';
        				type = 0;
        				continue;
        			}
        			break;
        		default:
        			//字符串开始
        			if(strings.indexOf(c) !== -1){
        				startStr = c;
        				type = 1;
        			}else if(operand.indexOf(c) === -1){ //变量开始
						type = 2;
        				if(sTmp !== ''){
        					me.addStr(sTmp,stack);
	        				sTmp = '';
        				}
        			}
        	}

        	//过滤器标志
        	let isFilter = false;
        	//过滤器
        	if(c === '|'){ 
				let j = i+1;
				let nextc = exprStr[j];
				if(nextc >= 'a' && nextc <= 'z'){
					let strCh = '';
					for(;j<exprStr.length;j++){
						let ch = exprStr[j];
						if(strings.indexOf(ch) !== -1){
							if(ch === strCh){ //字符串结束
								strCh = '';
							}else{
								strCh = ch;
							}
							
						}
						//遇到操作符且不在字符串内
						if(strCh === '' && operand.indexOf(ch) !== -1){
							break;
						}
					}
				}

				if(j>i){
					let s = exprStr.substring(i+1,j);
					if(s !== ''){
						// 过滤器串处理
						let filterArr = FilterManager.explain(s);
						//过滤器
						if(FilterManager.hasType(filterArr[0])){

							me.addFilter(filterArr,stack);
							c = '';
							exprStr = '';
							isFilter = true;
						}
					}
				}
			}

			//操作符
			if(!isFilter && type !== 1 && type !== 3 && operand.indexOf(c) !== -1){
				me.addOperand(c,stack);
			}else{
				sTmp += c;
			}
        }

        if(type === 2){ //变量处理
			me.addVar(sTmp,stack);
		}else if(type === 0 && sTmp !== ''){  //字符串
			me.addStr(sTmp,stack);
		}else if(type !== 0){
			//抛出表达式错误
			throw Error.handle('invoke','expression',0,'Node');
		}

        return stack;
    }    



	/**
	 * 表达式计算
	 * @param model 	模型 或 fieldObj对象 
	 * @param modelId 	模型id（model为fieldObj时不能为空）
	 */
	val(model,modelId){
		const me = this;
		if(!model){return '';}
		if(me.stack === null){
			return '';
		}

		let fieldObj;
		// 模型
		if(model instanceof Model){
			modelId = model.id;
			fieldObj = Object.create(null);
			//字段值
			me.fields.forEach((field)=>{
				fieldObj[field] = me.getFieldValue(model,field);
			});
			
		}else{
			fieldObj = model;
		}
		let newFieldValue = '';
		me.fields.forEach((field)=>{
			newFieldValue += fieldObj[field];
		});


		//如果对应模型的值对象不存在，需要新建
		if(me.modelMap[modelId]===undefined){
			me.modelMap[modelId] = Object.create(null);
		}
		//field值不一样，需要重新计算
		if(me.modelMap[modelId].fieldValue !== newFieldValue){
			me.modelMap[modelId].value = me.cacStack(me.stack,fieldObj,modelId);
		}
		
		me.modelMap[modelId].fieldValue = newFieldValue;
		return me.modelMap[modelId].value;
	}

	/**
	 * 添加变量
	 */
	addVar(field,stack){
		const me = this;
		let values = ['null','undefined','true','false','NaN'];
		//判断是否为值表达式 null undefined true false
		let addFlag = values.indexOf(field) === -1 ? false:true;
		addFlag = addFlag || nodom.isNumberString(field);

		//作为字符串处理   
		if(addFlag){
			this.addStr(field,stack);
		}else{
			stack.push({
				val:field.trim(),
				type:'field'
			});
			me.addField(field);
		}
	}

	/**
     * 添加字符串
     */
	addStr(str,stack){
		//如果前一个类型为字符串，则追加到前一个
		if(stack.length > 0 && stack[stack.length-1].type === "string"){ 
			stack[stack.length-1].val += str;
		}else{
			stack.push({
				val:str,
				type:'string'
			});
		}
	}

	addOperand(str,stack){
		stack.push({
			val:str,  //去掉字符串两端的空格
			type:'operand'
		});
	}

	/**
	 * 添加过滤器
	 * @param value 	value
	 * @param filterArr	过滤器数组
	 * @param stack 	堆栈
	 * @param vtype 	值类型 field字段 func函数 comp 组合 	
	 * @param extra 	附加参数
	 */
	addFilter(filterArr,stack){
		const me = this;
		let module = ModuleFactory.get(me.moduleName);
		if(stack.length>0){
			let filterStack=[];//过滤器堆栈
			let pre = stack[stack.length-1];
			let type = pre.type;

			//字段、函数、不带括号的字符串
			if(type === 'field' || type === 'function' || type==='string'){
				filterStack.push(stack.pop());
			}else if(type === 'operand' && pre.val === ')'){ //括号操作符
				//匹配括号对
				let cnt = 1;
				let j = stack.length-2;
				for(;j>=0;j--){
					// filterStack.unshift(stack[j].pop);
					if(stack[j].val === '('){
						if(--cnt === 0){
							break;
						}
					}else if(stack[j].val === ')'){
						cnt++;
					}
				}
				//拷贝堆栈元素
				filterStack = stack.slice(j,stack.length);
				//删除堆栈元素
				stack.splice(j,stack.length-j);
			}

			let expr = new Expression(null,module);
			expr.stack = filterStack;
			expr.fields = me.fields;
			//前置表达式
			if(!me.pre){
				me.pre = [];
			}
			me.pre.push(expr.id);
			// 过滤器入栈
			stack.push({
				type:'filter',
				filter:new Filter(filterArr),
				val:expr.id
			});

		}
	}

	/**
	 * 计算堆栈
	 * @param stack 	堆栈
	 * @param fieldObj 	字段对象
	 */
	cacStack(stack,fieldObj,modelId){
		const me = this;
		let retStr = '';
		let needEval = false;
		let module = ModuleFactory.get(me.moduleName);	

		stack.forEach((item)=>{
			let value = '';
			switch(item.type){
				case 'string'://字符串
					retStr += item.val;
					break;
				case 'operand'://字符串
					retStr += item.val;
					needEval = true;
					break;
				case 'field'://变量
					value = fieldObj[item.val];
					//字符串需要处理
					if(nodom.isString(value) && value !== ''){
						value = nodom.addStrQuot(value);
					}
					retStr += value;
					break;
				case 'function'://函数
					let foo = module.methodFactory.get(item.val);
					let param = [];
					if(item.params.length>0){
						item.params.forEach((p)=>{
							let pv = fieldObj[p];
							let isVal = false;
							//非数字和值，字符串两边添加引号
							if(nodom.isString(pv) && pv !== ''){
								pv = nodom.addStrQuot(pv);
							}
							param.push(pv);
						});
					}
					if(foo !== undefined && nodom.isFunction(foo)){
						value = foo.apply(module.model,param);
					}else{ //系统函数
						value = item.val + '(' + param.join(',') + ')';
						needEval = true;
					}
					retStr += value;
					break;
				case 'filter':
					// 作为前一轮已经计算
					value = module.expressionFactory.get(item.val).val(fieldObj,modelId);
					value = item.filter.exec(value,module);
					if(nodom.isString(value) && value !== ''){
						value = nodom.addStrQuot(value);
						retStr += value;
					}else if(typeof value === 'object'){  //对象，直接赋值，不做加法
						retStr = value;
					}
					break;
			}
			
		});

		if(needEval){
			try{
				retStr = eval(retStr);	
			}catch{

			}
		}else if(nodom.isString(retStr) && retStr.charAt(0) === '"'){ //字符串去掉两边的"
			retStr = retStr.substring(1,retStr.length-1);
		}
		return retStr;
	}

	/**
	 * 添加字段到fields
	 * @param field 	字段
	 */	
	addField(field){
		const me = this;
		
		if(me.fields.indexOf(field) === -1){
			me.fields.push(field);
		}
	}
	/**
	 * 获取field值
	 * @param module 	模块
	 * @param model 	模型，可为空
	 * @param field 	字段，可以带.
	 */
	getFieldValue(model,field){
		const me = this;
		let module = ModuleFactory.get(me.moduleName);
		if(!model && module){
			model = module.model;
		}
		if(!model){
			return '';
		}
		let v = model.query(field);
		if(v === undefined && model !== module.model){
			v = module.model.query(field);
		}
		return v===undefined?'':v;
	}
}