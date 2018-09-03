class EditForm extends React.Component{
    constructor(props) {
	super(props);
	this.state = Object.assign(props.data);;
	this.handleChange = this.handleChange.bind(this);
	this.handleSubmit = this.handleSubmit.bind(this);
    }
    
    handleChange(event) {
	if (event.target.name!='id')
	    this.setState({[event.target.name]: event.target.value});
    }
    
    handleSubmit(event) {
	event.preventDefault();
	this.props.saveClick(this.state);
    }
    render(){
	var res=[];
	var data = this.props.data;
        var keys = Object.keys(data);
       	for (var i = 0; i < keys.length; i++) {
            res.push(React.createElement('p', { name: keys[i], key: keys[i] }, keys[i],
					 React.createElement('input',{name: keys[i], type:'text', value:this.state[keys[i]], onChange:this.handleChange}
							    )
					));
        }
	let save= React.createElement('input',{name:'save', type:'submit',value:'save'});
	let cancel= React.createElement('input',{name:'cancel', type:'button', onClick:()=>this.props.cancelClick(),value:'close'});
	return React.createElement('form',{id:'editform',name:'editform',onSubmit:(e)=>this.handleSubmit(e)},res,save,cancel);
    }
}

class Authline extends React.Component{
    render() {
	var res = [];
        var data = this.props.data;
        var keys = Object.keys(data);
        for (var i = 0; i < keys.length; i++) {
            res.push(React.createElement('td', { name: keys[i], key: keys[i] }, data[keys[i]]));
        }
        return (React.createElement('tr', {name:this.props.data.username},
				    res,
				    React.createElement('td', { name: 'control' },
							React.createElement('button', { name: 'edit', onClick:()=>{this.props.editClick(this.props.data.id);} }, 'edit'),
							React.createElement('button', { name: 'pwd', onClick:()=>{this.props.pwdClick(this.props.data.id);} }, 'reset password'),
							React.createElement('button', { name: 'delete', onClick:()=>{this.props.delClick(this.props.data.id);} }, 'delete'))));
    }
}
class Auth extends React.Component{
    constructor(props){
	super(props);
	this.state={data:props.data, message:'', editmode:-1, message:''};
    }
    renderAuthlines() {
        var res = [];
	let data=this.state.data;
	if (data==null)
	    return 'data is null =(';
	let ids=Object.keys(data)
	for (var i = 0; i < ids.length; i++) {
            res.push(
		React.createElement(Authline, {num:i, key:ids[i], data:data[ids[i]], editClick:(i)=>{this.editUser(i)}, delClick:(i)=>this.delUser(i), pwdClick:(i)=>this.resetPwd(i) })
	    );
        }
        return res;
    }
    renderHeaderline() {
	let res=[];
	let keys=Object.keys(this.state.data[Object.keys(this.state.data)[0]]);
	for (let i=0;i< keys.length;i++){
	    res.push(React.createElement('td', { name: keys[i], key: keys[i] }, keys[i]));
        }
	return React.createElement('tr',{},res);
    }

    editUser(id) {
	this.setState({editmode:id});
}
    delUser(name) {
	ajaxRequest('GET','delete/'+name,(a)=>this.updateData(a));
    }
    updateList(userid){
	console.log(userid);
	ajaxRequest('GET','user/'+userid,(a)=>this.updateData(a));
    }
    updateData(responseText){
	console.log(responseText)
	let newdata=Object.assign(this.state.data);
	let answer = JSON.parse(responseText);
	if (answer.error)
	    this.setState({message:answer.error})
	else{
	    let keys=Object.keys(answer);
	    for (var i=0; i<keys.length;i++){
		if (answer[keys[i]]==null)
		    delete newdata[keys[i]];
		else
		    newdata[keys[i]]=answer[keys[i]];
	    }
	    this.setState({data:newdata})
	}
    }
    resetPwd(id){ 
	//request new password
	let pass1=prompt('Enter new password:');
	let pass2=prompt('Enter new password again:');
	if (pass1&&pass2&&(pass1==pass2)){
	    ajaxRequest('POST','save',this.processPwd,JSON.stringify({id:id,password:pass1}))
	}
	else{
	    this.setState({message:'passwords not equal'});
	}
    }
    processPwd(responseText){
	this.setState({message:'password changed for'+responseText});
    }
    cancelEdit(){
	this.setState({editmode:-1});
    }
    
    saveEdit(data){
//	console.log(data);
	let keys = Object.keys(data);
	let params=keys.map((key)=>{return key+'='+data[key];}).join('&');
	ajaxRequest('POST','save',(u)=>this.updateData(u),JSON.stringify(data));
	this.setState({editmode:-1});
    }
    render() {
	if (this.state.editmode==-2){
	    let empty={};
	    Object.keys(this.state.data[Object.keys(this.state.data)[0]]).map((key)=>{empty[key]='';})
	    return (React.createElement(EditForm,{data:empty,saveClick:(form)=>{this.saveEdit(form)},cancelClick:()=>{this.cancelEdit()}}));
	}
	if (this.state.editmode>-1){
	    return (React.createElement(EditForm,{data:this.state.data[this.state.editmode],saveClick:(form)=>{this.saveEdit(form)},cancelClick:()=>{this.cancelEdit()}}));
	}
	else
            return (React.createElement('table', { name: 'users' },
					React.createElement('thead', null, this.renderHeaderline()),
    					React.createElement('tbody', {}, this.renderAuthlines()),
					React.createElement('button', { name: 'add new', onClick:()=>{this.editUser(-2);} }, 'create new User'),
							));
    }
}


    
function requestUsers() {
    ajaxRequest('GET','users',processUsers);
}
function processUsers(responseText) {
    let resp = JSON.parse(responseText);
    ReactDOM.render(React.createElement(Auth, { data:resp, name: 'test' }),document.getElementById('root'));
}



function ajaxRequest(method,url,processor,params) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == XMLHttpRequest.DONE) {   // XMLHttpRequest.DONE == 4
            if (xmlhttp.status == 200) {
		processor(xmlhttp.responseText);
	    }
            else {
		console.log('something else other than 200 was returned.'+xmlhttp.status );
            }
        }
    };
    xmlhttp.open(method, url, true);
    if (method=='POST'){
	xmlhttp.setRequestHeader("X-CSRFToken", getCookie("csrftoken"));
    }
    xmlhttp.send(params);
}

function getCookie(name){
    let h={};
    let cookie=document.cookie.split('; ').map((item)=>{
	let pair=item.split('=');
	h[pair[0]]=pair[1];
	return pair; });
    return h[name];
}
