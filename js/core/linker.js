/**
 * 链式操作器
 */
class Linker{
	constructor(type,config){
		const me = this;
		let p;
		switch(type){
			case 'ajax':  //单个ajax
				p = me.ajax(config);
				break;
			case 'getfiles': //ajax get 多个文件
				p = me.getfiles(config);
				break;
			case 'dolist': 	//同步操作组
				if(arguments.length === 3){
					p = me.dolist(arguments[1],0,arguments[2]);
				}else{
					p = me.dolist(arguments[1],0);		
				}
				
		}
		return p;
	}

	/**
	 * ajax 请求
	 */
	ajax(config){
		return new Promise((resolve,reject)=>{
			//随机数
	        if(config.rand){  //针对数据部分，仅在app中使用
	            config.params = config.params || {};
	            config.params.$rand = Math.random();
	        }
	        
	        const async = config.async===false?false:true;
			const req = new XMLHttpRequest();
		    req.onload = ()=>{
		    	let r;
		    	switch(req.status){
	                case 200:
	                    r = req.responseText;
	                    if(config.type === 'json'){
	                        try{
	                            r = JSON.parse(r);
	                        }catch(e){
	                            
	                        }
	                    }
	                    resolve(r);
	                    break; 
	                default:    //服务器异常
	                    reject(req.statusText);
	            }
	        }
	        req.onerror = () => reject(xhr.statusText);
		    //类型默认为get

		    const reqType = config.reqType||'GET';
		    switch(reqType){
	            case 'GET':
	                //参数
	                let pa;
	                if(nodom.isObject(config.params)){
	                    let ar = [];
	                    nodom.getOwnProps(config.params).forEach(function(key){
	                        ar.push(key + '=' + config.params[key]);
	                    });
	                    pa = ar.join('&');
	                }
	                if(pa !== undefined){
	                    if(url.indexOf('?') !== -1){
	                        url += '&' + pa;
	                    }else{
	                        url += '?' + pa;
	                    }
	                }
	                req.open(reqType,config.url,async,config.user,config.pwd);
	                if(async){
	                    req.timeout = config.timeout;
	                }
	                req.send(null);
	                break;
	            case 'POST':
	                let fd = new FormData();
	                for(let o in config.params){
	                    fd.append(o,config.params[o]);
	                }
	                req.open(reqType,url,async,config.user,config.pwd);
	                req.timeout = config.timeout;
	                req.send(fd);
	                break;
	        }
	    });
	}

	/**
	 * 通过get获取多个文件
	 */
	getfiles(urls){
		let promises = [];
		urls.forEach((url)=>{
			promises.push(new Promise((resolve,reject)=>{
				const req = new XMLHttpRequest();
		    	req.open("GET", url);
			    req.onload = () => resolve(req.responseText);
			    req.onerror = () => reject(req.statusText);
			    req.send();
			}));
		});
		return Promise.all(promises);
	}

	/**
	 * 同步顺序执行
	 * @param funcArr 	函数数组
	 * @param index 	当前index	
	 * @param paramArr 	参数数组
	 * @return 			promise对象
	 */
	dolist(funcArr,index,paramArr){
		const me = this;
		return foo(funcArr,index,paramArr);
	
		function foo(fa,i,pa){
			if(fa.length === 0){
				return Promise.resolve();
			}else{
				return new Promise((resolve,reject)=>{
					if(pa !== null || pa !== undefined){
						fa[i](resolve,reject,pa[i]);
					}else{
						fa[i](resolve,reject);	
					}
				}).then((success)=>{
					if(i<fa.length-1){
						return foo(fa,i+1,pa);
					}
				});	
			}
		}
		
		
	}	
	
}