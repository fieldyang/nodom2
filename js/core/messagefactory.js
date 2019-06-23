/**
 * 消息工厂
 */
class MessageFactory{
	static add(from,to,data){
		this.messages.push({from:from,to:to,msg:data,read:false});
	}

	static broadcast(){
		
		for(let i=0;i<MessageFactory.messages.length;i++){
			let msg = MessageFactory.messages[i];
			let module = ModuleFactory.get(msg.to);
			// 模块状态未未激活或激活才接受消息
			if(module && module.state === 2 || module.state === 3){
				module.receive(msg.from,msg.msg);
			}
			// 清除已接受消息，或已死亡模块的消息
			if(module && module.state >= 2){
				MessageFactory.messages.splice(i--,1);
			}
 		}
	}
}

MessageFactory.messages = new Array();